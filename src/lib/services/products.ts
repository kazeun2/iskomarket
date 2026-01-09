/**
 * Product Services
 * Last Updated: December 13, 2025
 */
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { getSupabase } from '../supabaseClient'

export interface Product {
  id: string
  title: string
  description: string
  price: number
  category_id?: string | null
  condition?: string | null
  seller_id: string
  images: string[]
  location: string
  views: number
  interested: number
  is_sold: boolean
  is_hidden: boolean
  is_deleted: boolean
  deleted_reason?: string | null
  is_for_a_cause?: boolean
  is_available?: boolean
  created_at: string
  updated_at: string
  sold_at?: string | null
}

/*
 * Realtime subscription notes:
 * - subscribeToProducts now supports INSERT, UPDATE, DELETE events.
 * - The UI should prefer server-returned rows (from insert/select) to avoid
 *   showing optimistic items that are never committed.
 */
export interface ProductWithSeller extends Product {
  seller: {
    id: string
    username: string
    name?: string
    avatar_url?: string | null
    credit_score?: number
    is_trusted_member?: boolean
  }
  category?: {
    id: string
    name: string
    // icon removed - categories table currently only has `id` and `name`
  }
}

// Normalize image URLs to avoid rendering ephemeral blob: or file: object URLs
function normalizeImages(images: any): string[] {
  const placeholder = '/placeholder.png';
  try {
    if (!images || !Array.isArray(images) || images.length === 0) return [placeholder];
    const sanitized = images.map((src: any) => {
      if (!src || typeof src !== 'string') return placeholder;
      const trimmed = src.trim();
      if (trimmed.startsWith('blob:') || trimmed.startsWith('file:') || trimmed.startsWith('filesystem:')) return placeholder;
      return trimmed;
    }).filter(Boolean);
    return sanitized.length ? sanitized : [placeholder];
  } catch (e) {
    return [placeholder];
  }
}

/**
 * Upload product images to Supabase Storage and return public URLs.
 * - Uploads to the 'product-images' bucket under path {userId}/{timestamp}-{random}.{ext}
 * - If an upload fails for a file, it returns the placeholder for that slot.
 */
export async function uploadProductImages(files: File[], onProgress?: (uploaded: number, total: number) => void): Promise<string[]> {
  const uploadedUrls: string[] = [];
  if (!files || files.length === 0) return uploadedUrls;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    const total = files.length;
    let uploaded = 0;

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) {
          console.error('uploadProductImages: upload error', error);
          // Fail fast: do not silently insert placeholders - surface a clear error so caller can abort
          throw new Error(`Storage upload failed: ${error.message || String(error)}. This often means storage row-level security blocks uploads for the 'product-images' bucket. Run the storage policy migration or contact an admin.`);
        } else {
          const { data: pub } = supabase.storage.from('product-images').getPublicUrl(fileName);
          // If bucket is public, publicUrl will be returned; otherwise create a signed URL
          if (pub && pub.publicUrl && typeof pub.publicUrl === 'string' && pub.publicUrl.startsWith('http')) {
            console.debug('uploadProductImages: publicUrl', pub.publicUrl);
            uploadedUrls.push(pub.publicUrl);
          } else {
            try {
              // Create a signed URL valid for 7 days as a fallback when the bucket isn't public
              const { data: signedData, error: signedError } = await supabase.storage.from('product-images').createSignedUrl(fileName, 60 * 60 * 24 * 7);
              if (!signedError && signedData && signedData.signedUrl) {
                console.debug('uploadProductImages: signedUrl', signedData.signedUrl);
                uploadedUrls.push(signedData.signedUrl);
              } else {
                console.error('uploadProductImages: createSignedUrl failed', signedError);
                throw new Error(`Failed to create signed URL for uploaded file ${fileName}. Storage visibility may be misconfigured.`);
              }
            } catch (e) {
              console.error('uploadProductImages: createSignedUrl error', e);
              throw e;
            }
          }
        }
      } catch (e) {
        console.error('uploadProductImages: unexpected error', e);
        uploadedUrls.push('/placeholder.png');
      }

      uploaded++;
      try { onProgress?.(uploaded, total); } catch (e) { /* ignore */ }
    }

    return uploadedUrls;
  } catch (e) {
    console.error('uploadProductImages: failed to get user or upload', e);
    // Surface error to caller so product creation can be aborted instead of silently using placeholders
    throw new Error(`Image upload failed: ${e?.message || String(e)}. Check storage permissions and RLS policies for the 'product-images' bucket.`);
  }
}



// Fetch all products
export async function getProducts(filters?: {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  seller_id?: string
}) {
  // Exclude CvSU categories (by name) and any explicit CvSU-only items from the global marketplace
  const { data: cvsuCats, error: cvsuCatErr } = await supabase.from('categories').select('id').ilike('name', 'CvSU%');
  if (cvsuCatErr) {
    console.warn('getProducts: failed to resolve CvSU categories for exclusion', cvsuCatErr);
  }
  const cvsuIds = (cvsuCats || []).map((c: any) => c.id).filter(Boolean);

  let query = supabase
    .from('products')
    .select(`
      *,
      seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member),
      category:categories(id, name)
    `)
    .eq('is_sold', false)
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .eq('is_cvsu_only', false) /* exclude explicit CvSU-only items from marketplace */

  if (cvsuIds.length > 0) {
    // Build a safe in-list string for PostgREST without adding extra quotes that may be double-encoded
    // e.g. (uuid1,uuid2)
    const inList = `(${cvsuIds.map((id: any) => String(id)).join(',')})`;
    query = query.not('category_id', 'in', inList);
  }

  // Apply filters
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category_id', filters.category)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }

  if (filters?.seller_id) {
    query = query.eq('seller_id', filters.seller_id)
  }

  const { data, error } = await query

  if (error) throw error

  // Defensive fallback: if seller join missing, synthesize a minimal seller object so UI can render
  const safeData = (data || []).map((p: any) => {
    const seller = p.seller
      ? p.seller
      : { id: p.seller_id, username: String(p.seller_id), avatar_url: null, credit_score: 0, is_trusted_member: false };

    // Normalize images so ephemeral blob/file URLs don't break other sessions
    const images = normalizeImages(p.images || p.image ? (p.images || [p.image]) : undefined);

    return {
      ...p,
      id: String(p.id), // normalize id to string for consistent handling across the UI
      seller,
      images,
    };
  })

  return safeData as ProductWithSeller[]
}

/**
 * Robust fetcher that tries multiple strategies to retrieve visible products.
 * This helps in environments where views, joins, or RLS may temporarily
 * hide rows from the primary query. It falls back to safer queries that
 * avoid complex joins, and to the `active_products_view` if available.
 */
export async function getProductsWithFallback(filters?: {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  seller_id?: string
}) {
  try {
    // Primary (preferred) fetch using rich joins and policy-aware predicates
    const primary = await getProducts(filters);
    if (primary && primary.length > 0) return primary;
  } catch (err) {
    console.warn('Primary getProducts() failed, will try fallbacks', err);
  }

  try {
    // Try the active_products_view if it exists (some projects expose this view as a stable public interface)
    const { data: viewRows, error: viewErr } = await supabase.from('active_products_view').select('*').limit(100);
    if (!viewErr && viewRows && viewRows.length > 0) {
      // Filter out CvSU items either explicitly flagged or identified by CvSU category naming
      const rows = (viewRows as any[]).filter(r => !r.is_cvsu_only && !isCvSUProduct(r));
      if (rows.length === 0) return [] as ProductWithSeller[];
      // Map view rows into ProductWithSeller-like shape minimally
      return rows.map((r) => ({
        ...r,
        seller: r.seller || { id: r.seller_id, username: String(r.seller_id), avatar_url: null, credit_score: 0, is_trusted_member: false },
        category: r.category || null,
        images: normalizeImages(r.images || r.image),
      }));
    }
  } catch (e) {
    // view may not exist or be inaccessible; ignore
    console.warn('active_products_view fallback failed or missing', e?.message || e);
  }

  try {
    // Final fallback: fetch minimal product rows without joins to avoid any join-induced hides
    // Exclude soft-deleted rows in the raw fallback as well to prevent deleted items leaking through when other
    // strategies fail. This mirrors the visibility checks used in getCvSUProducts.
    const { data: rawRows, error: rawErr } = await supabase.from('products').select('*').eq('is_deleted', false).order('created_at', { ascending: false }).limit(100);
    if (rawErr) throw rawErr;
    if (rawRows && rawRows.length > 0) {
      return (rawRows as any[]).map((r) => ({
        ...r,
        seller: { id: r.seller_id, username: String(r.seller_id), avatar_url: null, credit_score: 0, is_trusted_member: false },
        images: normalizeImages(r.images || r.image),
      }));
    }
  } catch (e) {
    console.warn('Raw products fallback failed', e?.message || e);
  }

  // No rows found by any strategy
  return [] as ProductWithSeller[];
}

/**
 * Helper: determine if a product row qualifies as a CvSU product.
 * Existing project data identifies official CvSU items via category names like `CvSU Uniforms`.
 * Keep this logic centralized so other components and realtime handlers can reuse it.
 */
export function isCvSUProduct(p: any) {
  // Prefer rich `category.name` when available, otherwise fall back to legacy `category` string
  const name = (p?.category && p.category.name) || p?.category || '';
  if (!name || typeof name !== 'string') return false;
  return name.trim().toLowerCase().startsWith('cvsu');
}

/**
 * Fetch products that are considered "CvSU" products using existing category naming.
 * Respects visibility flags (is_sold, is_hidden, is_deleted, is_available).
 */
export async function getCvSUProducts(filters?: {
  search?: string
  minPrice?: number
  maxPrice?: number
  // allow filtering by category_id(s) if needed in the future
}) {
  // Prefer the read-safe view if it exists (view_cvsu_market exposing only needed fields + id)
  try {
    const { data: viewRows, error: viewErr } = await supabase.from('view_cvsu_market').select('*').order('id', { ascending: false });
    if (!viewErr && viewRows && viewRows.length > 0) {
      // Map view rows into Product-like objects the UI expects
      return (viewRows as any[]).map((r) => ({
        id: r.id, // integer id from cvsu_market_products
        cvsu_product_id: r.id,
        product_id: r.product_id || null,
        title: r.title,
        description: r.description || r.title,
        images: normalizeImages(r.images || []),
        category: r.category || null,
      })) as any as ProductWithSeller[];
    }
  } catch (e) {
    // If view is missing or access blocked, fall back to previous product-based fetch below
    console.warn('getCvSUProducts: view fetch failed; falling back to products query', (e as any)?.message || e);
  }

  // Fallback: find categories whose name starts with 'CvSU' (case-insensitive)
  const { data: cats, error: catErr } = await supabase.from('categories').select('id, name').ilike('name', 'CvSU%');
  if (catErr) throw catErr;
  const catIds = (cats || []).map((c: any) => c.id).filter(Boolean);

  // Build the products query with the same visibility predicates as getProducts
  let query: any = supabase
    .from('products')
    .select(`
      *,
      seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member),
      category:categories(id, name)
    `)
    .eq('is_sold', false)
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .or('is_available.eq.true,is_available.is.null')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (catIds.length > 0) {
    query = query.in('category_id', catIds);
  } else {
    // No CvSU categories exist - return empty
    return [] as ProductWithSeller[];
  }

  const { data, error } = await query;
  if (error) throw error;

  const safeData = (data || []).map((p: any) => {
    const seller = p.seller
      ? p.seller
      : { id: p.seller_id, username: String(p.seller_id), avatar_url: null, credit_score: 0, is_trusted_member: false };

    const images = normalizeImages(p.images || p.image ? (p.images || [p.image]) : undefined);

    return {
      ...p,
      seller,
      images,
    };
  });

  return safeData as ProductWithSeller[];
}

// Create/Update/Delete helpers that operate on the lightweight cvsu_market_products table
export async function createCvSUProduct(payload: { title: string; description?: string; category?: string; images?: string[] }) {
  const insertPayload = {
    title: payload.title,
    description: payload.description ?? payload.title,
    category: payload.category ?? 'CvSU Uniforms',
    images: payload.images || [],
  } as any;

  let { data, error } = await supabase
    .from('cvsu_market_products')
    .insert(insertPayload)
    .select('*')
    .single();

  // Robust fallback: some deployments may have an older schema without `description`.
  // If PostgREST returns a schema-cache error mentioning `description`, retry without it.
  if (error && (String(error?.message || '').toLowerCase().includes('could not find the') || String(error?.message || '').includes('PGRST204'))) {
    try {
      console.warn('createCvSUProduct: schema mismatch detected; retrying insert without `description` column');
      const fallbackPayload = { title: insertPayload.title, category: insertPayload.category, images: insertPayload.images };
      const res = await supabase.from('cvsu_market_products').insert(fallbackPayload).select('*').single();
      data = res.data;
      error = res.error;
    } catch (e) {
      // if fallback fails, bubble original error below
    }
  }

  if (error) throw error;

  // Normalize before returning
  return {
    ...data,
    id: data.id,
    title: data.title,
    description: data.description,
    images: normalizeImages(data.images || []),
    category: data.category,
  };
}

export async function updateCvSUProduct(id: string | number, updates: Partial<{ title: string; description: string; images: string[]; category: string }>) {
  const payload: any = { ...updates };
  if ('images' in payload && payload.images) payload.images = payload.images;

  let { data, error } = await supabase
    .from('cvsu_market_products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  // Fallback for older schemas lacking `description` column: retry without it
  if (error && (String(error?.message || '').toLowerCase().includes('could not find the') || String(error?.message || '').includes('PGRST204'))) {
    try {
      console.warn('updateCvSUProduct: schema mismatch detected; retrying update without `description`');
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('cvsu_market_products')
        .update(({ description, ...rest }: any) => rest)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      data = fallbackData;
      error = fallbackErr;
    } catch (e) {
      // ignore - we'll rethrow below
    }
  }

  if (error) {
    // map friendly messages for common permission errors
    if (error.code === 'PGRST116' || (error.details && String(error.details).includes('0 rows'))) {
      throw new Error(`CvSU product not found or update not permitted: ${id}`);
    }
    throw error;
  }

  if (!data) throw new Error(`CvSU product not found or update not permitted: ${id}`);

  return {
    ...data,
    images: normalizeImages(data.images || []),
  };
}

export async function deleteCvSUProduct(idOrProductId: string | number, hard: boolean = false) {
  if (!idOrProductId) throw new Error('Missing cvsu product id or product_id');
  const raw = String(idOrProductId).trim();

  // The cvsu table uses an integer `id` primary key, while product IDs are UUIDs stored in `product_id`.
  // Accept either form: if caller passed a numeric id we delete by `id`; otherwise try to locate a row
  // by `product_id` and delete that row. This makes the helper robust to the UI passing either value.

  // Helper to attempt an admin RPC fallback when direct SELECT/DELETE is forbidden
async function tryAdminRpc(pId: string, hardFlag: boolean = false) {
    try {
      console.debug('deleteCvSUProduct: attempting admin_delete_cvsu_product RPC', { p_id: pId, hard: hardFlag });
      const rpcRes = await supabase.rpc('admin_delete_cvsu_product', { p_id: pId, p_hard: hardFlag });
      if (rpcRes.error) {
        console.error('deleteCvSUProduct: admin_delete_cvsu_product RPC failed', { p_id: pId, error: rpcRes.error });
        throw rpcRes.error;
      }
      console.debug('deleteCvSUProduct: admin_delete_cvsu_product RPC succeeded', { p_id: pId, data: rpcRes.data });
      return rpcRes.data;
    } catch (rpcErr) {
      throw new Error(`Delete failed (admin rpc): ${String(rpcErr?.message || rpcErr)}`);
    }
  }

  // Determine whether input looks like an integer id
  const looksNumeric = /^\d+$/.test(raw);
  let targetRow: any = null;

  try {
    if (looksNumeric) {
      // Query by integer id
      console.debug('deleteCvSUProduct: looking up by numeric id', Number(raw));
      const { data: found, error: selErr } = await supabase
        .from('cvsu_market_products')
        .select('id, product_id')
        .eq('id', Number(raw))
        .maybeSingle();

      if (selErr) {
        const msg = String(selErr?.message || selErr || '');
        console.error('deleteCvSUProduct: select by id failed', { id: Number(raw), status: selErr?.status, message: msg });
        if (msg.toLowerCase().includes('not permitted') || selErr?.status === 400 || selErr?.status === 403) {
          return tryAdminRpc(raw, hard);
        }
        throw new Error(`Failed to query CvSU product ${raw}: ${msg}`);
      }

      if (!found) return null;
      targetRow = found;
    } else {
      // Input looks like a product UUID - find the cvsu row with this product_id
      console.debug('deleteCvSUProduct: looking up by product_id', raw);
      const { data: foundByPid, error: selErr } = await supabase
        .from('cvsu_market_products')
        .select('id, product_id')
        .eq('product_id', raw)
        .maybeSingle();

      if (selErr) {
        const msg = String(selErr?.message || selErr || '');
        console.error('deleteCvSUProduct: select by product_id failed', { product_id: raw, status: selErr?.status, message: msg });
        if (msg.toLowerCase().includes('not permitted') || selErr?.status === 400 || selErr?.status === 403) {
          return tryAdminRpc(raw, hard);
        }
        throw new Error(`Failed to query CvSU product by product_id ${raw}: ${msg}`);
      }

      if (!foundByPid) return null;
      targetRow = foundByPid;
    }

    // Now delete by the row's integer id (primary key)
    console.debug('deleteCvSUProduct: deleting by row id', targetRow.id);
    const { data, error } = await supabase
      .from('cvsu_market_products')
      .delete()
      .eq('id', targetRow.id)
      .select('*')
      .single();

    if (error) {
      const msg = String(error?.message || error || '');
      console.error('deleteCvSUProduct: delete failed', { id: targetRow.id, status: error?.status, message: msg });
      if (msg.toLowerCase().includes('not permitted') || error?.status === 400 || error?.status === 403) {
        return tryAdminRpc(raw);
      }

      throw new Error(`Failed to delete CvSU product ${targetRow.id} (product_id: ${targetRow.product_id}): ${msg}`);
    }

    console.debug('deleteCvSUProduct: delete succeeded', { id: targetRow.id });

    // Verification: ensure the row is actually gone from the DB. This guards against eventual consistency
    // issues or failed deletes that still report success.
    try {
      const { data: verify, error: verifyErr } = await supabase
        .from('cvsu_market_products')
        .select('id')
        .eq('id', targetRow.id)
        .maybeSingle();

      if (verifyErr) {
        console.error('deleteCvSUProduct: verification select failed', { id: targetRow.id, status: verifyErr?.status, message: String(verifyErr?.message || verifyErr) });
        throw new Error(`Delete verification failed for cvsu id ${targetRow.id}: ${String(verifyErr?.message || verifyErr)}`);
      }

      if (verify) {
        console.error('deleteCvSUProduct: delete reported success but row still exists', { id: targetRow.id });
        // Try a second delete attempt in case of transient failure
        const { data: retryData, error: retryErr } = await supabase
          .from('cvsu_market_products')
          .delete()
          .eq('id', targetRow.id)
          .select('*')
          .single();

        if (retryErr) {
          console.warn('deleteCvSUProduct: retry delete failed, will attempt admin RPC as fallback', { id: targetRow.id, error: retryErr });
          // Attempt admin RPC as a last resort. If the id is not a UUID, admin RPC may still accept product_id instead.
          try {
            await tryAdminRpc(String(targetRow.id));
          } catch (rpcErr) {
            throw new Error(`Delete did not persist for cvsu id ${targetRow.id} and admin RPC fallback failed: ${String(rpcErr?.message || rpcErr)}`);
          }
        } else {
          // Retry succeeded - proceed
          console.debug('deleteCvSUProduct: retry delete succeeded', { id: targetRow.id });
        }
      }
    } catch (verErr) {
      // Surface verification errors to caller
      throw verErr;
    }

    return data;
  } catch (e) {
    // Re-throw so callers can decide how to handle UI changes
    throw e;
  }
}

// Subscribe to cvsu market table changes (returns unsubscribe function)
export function subscribeToCvSUProducts(callbacks: { onInsert?: (row: any) => void; onUpdate?: (row: any) => void; onDelete?: (id: any) => void; }) {
  const channel = supabase
    .channel('cvsu-market-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cvsu_market_products' }, (payload) => {
      if (payload?.new) callbacks.onInsert?.(payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cvsu_market_products' }, (payload) => {
      if (payload?.new) callbacks.onUpdate?.(payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cvsu_market_products' }, (payload) => {
      if (payload?.old) callbacks.onDelete?.(payload.old.id);
    })
    .subscribe();

  return () => { try { supabase.removeChannel(channel); } catch (e) { console.warn('Failed to remove cvsu channel', e); } };
}

// // Get single product 
// export async function 
// getProduct(id: string) 
// { const { data, error } = await supabase 
// .from('products') 
// .select(` *, seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member), 
// category:categories(id, name) `) .eq('id', id) .single() 
// if (error) throw error 
// // Increment view count 
// await supabase .from('products') 
// .update({ views: (data.views || 0) + 1 }) 
// .eq('id', id) return data as ProductWithSeller }

// Get single product and increment views
export async function getProduct(id: string) {
  // Fetch product with seller + category
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member),
      category:categories(id, name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!product) throw new Error(`Product not found: ${id}`);

  // Increment view count and return updated product
  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({ views: (product.views ?? 0) + 1 })
    .eq('id', id)
    .select(`
      *,
      seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member),
      category:categories(id, name)
    `)
    .single();

  if (updateError) {
    // In some cases the update (increment views) may be blocked by RLS for the current user.
    // Treat this as a non-fatal condition: log it and return the originally fetched product so the UI can continue to render it.
    console.warn('getProduct: failed to increment views or re-fetch updated product - returning original product', updateError);

    // Defensive seller fallback for original product
    if (!product.seller) {
      product.seller = {
        id: product.seller_id,
        username: String(product.seller_id),
        avatar_url: null,
        credit_score: 0,
        is_trusted_member: false,
      } as any;
    }

    return product as ProductWithSeller;
  }

  // Defensive seller fallback for updated product
  if (updated && !updated.seller) {
    updated.seller = {
      id: updated.seller_id,
      username: String(updated.seller_id),
      avatar_url: null,
      credit_score: 0,
      is_trusted_member: false,
    } as any;
  }

  return updated as ProductWithSeller;
}


// // Create product
// export async function createProduct(product: any) {
//   // Resolve category name to category_id when caller provided a category_name
//   // (or a legacy `category` string) to ensure DB referential integrity.
//   let categoryId = product.category_id ?? null;

//   try {
//     const categoryName = product.category_name || product.category || null;
//     if (!categoryId && categoryName) {
//       const { data: cat, error: catError } = await supabase
//         .from('categories')
//         .select('id')
//         .eq('name', categoryName)
//         .maybeSingle();

//       if (catError) throw catError;
//       if (cat && (cat as any).id) categoryId = (cat as any).id;
//       else {
//         // If category doesn't exist, fail fast so the client can show a meaningful error
//         throw new Error(`Category not found: ${categoryName}`);
//       }
//     }

//     const insertPayload = {
//       ...product,
//       category_id: categoryId ?? null
//     };

//     const { data, error } = await supabase
//       .from('products')
//       .insert(insertPayload)
//       .select(`
//         *,
//         seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member),
//         category:categories(id, name)
//       `)
//       .single();

//     if (error) throw error;
//     return data as ProductWithSeller;
//   } catch (err) {
//     // Re-throw after logging to surface the issue to the caller
//     console.error('createProduct error:', err);
//     throw err;
//   }
// }
// Create product
export async function createProduct(product: any) {
  let categoryId = product.category_id ?? null;

  try {
    // If caller provided a non-UUID category_id (e.g., numeric id or name), try to resolve it.
    const looksLikeUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);

    // Prefer an explicit category_name or legacy category string
    const categoryName = product.category_name || product.category || null;

    // If category_id is present but not a UUID, attempt to treat it as a category name and look up its id
    if (product.category_id && !looksLikeUuid(product.category_id)) {
      // If it's numeric or a short string, maybe caller passed the category label instead of id
      try {
        const lookupName = String(product.category_id);
        const { data: catByName, error: catByNameErr } = await supabase
          .from('categories')
          .select('id')
          .eq('name', lookupName)
          .maybeSingle();

        if (catByNameErr) throw catByNameErr;
        if (catByName && (catByName as any).id) {
          categoryId = (catByName as any).id;
        }
      } catch (e) {
        // Ignore; we'll fall back to other resolution strategies below
      }
    }

    // If we still don't have an id, resolve by category name if provided
    if (!categoryId && categoryName) {
      const { data: cat, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .maybeSingle();

      if (catError) throw catError;
      if (cat && (cat as any).id) categoryId = (cat as any).id;
    }

    if (!categoryId) {
      throw new Error('Category not found or invalid. Please choose a valid category.');
    }

    // Ensure authenticated user and set seller_id based on auth.uid()
    const { data: { user } } = await supabase.auth.getUser();
    const authUserId = user?.id;
    console.debug('createProduct: authenticated user id:', authUserId, 'payload seller_id:', product.seller_id);
    if (!authUserId) {
      throw new Error('You must be signed in to create a product. Sign in and try again.');
    }

    if (product.seller_id && product.seller_id !== authUserId) {
      console.warn('createProduct: provided seller_id does not match authenticated user; overriding with auth user id.');
    }
    // Ensure client cannot force seller_id - always use the authenticated session id
    if ('seller_id' in product) delete product.seller_id;

    // Remove any client-only or legacy fields that do not map to DB columns
    if ('category_name' in product) delete product.category_name;
    if ('category' in product) delete product.category;
    if ('image' in product) delete product.image;

    const insertPayload = {
      ...product,
      seller_id: authUserId,
      category_id: categoryId,
      // Ensure required fields have safe defaults to avoid NOT NULL DB errors
      description: product.description ?? product.title ?? product.name ?? '',
      condition: product.condition ?? 'Not specified',
      // Normalize images in case the client supplied ephemeral blob/file URLs
      images: normalizeImages(product.images || product.image),
      // Ensure visibility flags are set so other users can read the product
      // (RLS SELECT policies commonly check these flags).
      is_available: product.is_available ?? true,
      is_deleted: product.is_deleted ?? false,
      is_hidden: product.is_hidden ?? false,
      is_sold: product.is_sold ?? false,
      views: product.views ?? 0,
      interested: product.interested ?? 0,
    };

    // Safer two-step insert: first insert to get id, then fetch row with joins to avoid any join/caching anomalies
    const { data: insertResult, error: insertError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError) {
      if (insertError.message && insertError.message.toLowerCase().includes('row-level security')) {
        throw new Error('Insert blocked by Row-Level Security. Ensure you are authenticated and the policies allow creating products for your user (auth.uid() = seller_id).');
      }
      throw insertError;
    }

    if (!insertResult || !insertResult.id) {
      throw new Error('Product insert failed to return an id');
    }

    // Fetch the inserted row with seller and category joined explicitly
    const { data: fetched, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member, email),
        category:categories(id, name)
      `)
      .eq('id', insertResult.id)
      .single();

    if (fetchError) throw fetchError;
    if (!fetched) throw new Error('Failed to fetch inserted product');

    // Defensive check: ensure the seller.id matches the authenticated user
    if (fetched.seller?.id !== authUserId) {
      console.warn('createProduct: inserted product seller mismatch. Auth user:', authUserId, 'fetched seller.id:', fetched.seller?.id);

      try {
        // Attempt to correct the seller_id to the authenticated user
        const { data: corrected, error: correctionError } = await supabase
          .from('products')
          .update({ seller_id: authUserId })
          .eq('id', insertResult.id)
          .select(`
            *,
            seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member, email),
            category:categories(id, name)
          `)
          .single();

        if (!correctionError && corrected) {
          console.info('createProduct: corrected seller_id on product', insertResult.id);
          // Trigger a small update to ensure updated_at triggers and realtime UPDATE events are emitted
          (async () => {
            try {
              await supabase.from('products').update({ views: corrected.views || 0 }).eq('id', corrected.id);
            } catch (uErr) {
              console.warn('createProduct: failed to perform post-insert update for realtime trigger', uErr);
            }
          })();

          return corrected as ProductWithSeller;
        } else {
          console.warn('createProduct: failed to auto-correct seller_id', correctionError);
          // If correction failed, abort to avoid misattributed product
          throw new Error('Seller mismatch after insert and auto-correction attempt failed. Product not posted under your account. Please contact support.');
        }
      } catch (e) {
        console.error('createProduct: auto-correction attempt failed', e);
        // Abort since we couldn't ensure the product belongs to the authenticated user
        throw new Error('Seller mismatch after insert; aborting to prevent misattribution.');
      }
    }

    // After successful insert+fetch, do a best-effort small update to touch the row and trigger updated_at
    (async () => {
      try {
        await supabase.from('products').update({ views: fetched.views || 0 }).eq('id', fetched.id);
      } catch (uErr) {
        console.warn('createProduct: failed to perform post-insert update for realtime trigger', uErr);
      }
    })();

    // Best-effort: insert a system log so the Admin Dashboard activity stream reflects product posts even when `activities` table is missing
    // Fire-and-forget system log — do not await, treat as non-fatal
    (async () => {
      try {
        // Lazy import to avoid circular dependencies in some test environments
        const { insertSystemLog } = await import('../../services/systemLogService');
        // Do not await here; use catch on the returned promise to avoid unhandled rejections
        insertSystemLog({
          category: 'transaction',
          type: 'product',
          severity: 'SUCCESS',
          source: 'web',
          summary: 'Product Posted',
          details: { productId: fetched.id, title: fetched.title, sellerId: fetched.seller?.id, seller: fetched.seller?.username },
        }).catch((e) => {
          // insertSystemLog is non-throwing for known RLS errors, but guard anyway
          console.warn('createProduct: system log insert failed (non-fatal):', e);
        });
      } catch (e) {
        console.warn('createProduct: failed to import systemLogService (non-fatal):', e);
      }
    })();

    // If any images are placeholders, treat this as a hard failure: upload or storage visibility problem
    if (Array.isArray(fetched.images) && fetched.images.some((s: any) => typeof s === 'string' && s.includes('/placeholder.png'))) {
      console.warn('createProduct: fetched product contains placeholder images - upload or storage visibility may have failed', fetched.id, fetched.images);
      throw new Error('Product was created but images are missing due to upload/storage visibility issues. Admin action required to fix storage policies or bucket visibility.');
    }

    return fetched as ProductWithSeller;
  } catch (err: any) {
    console.error('createProduct error:', err);
    // Map common Postgres/Supabase errors to friendlier messages
    if (err?.code === '22P02' || (err?.message && String(err.message).toLowerCase().includes('invalid input syntax for type uuid'))) {
      throw new Error('Invalid category id. Please choose a valid category.');
    }
    if (err?.message && String(err.message).toLowerCase().includes('could not find the')) {
      // schema cache / column missing errors
      throw new Error('Server schema mismatch: ' + (err?.message || 'unknown schema error.'));
    }
    throw err;
  }
}

// // Update product
// export async function updateProduct(id: string, updates: Partial<Product>) {
//   const { data, error } = await supabase
//     .from('products')
//     .update(updates)
//     .eq('id', id)
//     .select()
//     .single()

//   if (error) throw error
//   return data as Product
// }

// // Delete product (soft delete)
// export async function deleteProduct(id: string, reason?: string) {
//   const { error } = await supabase
//     .from('products')
//     .update({ 
//       is_deleted: true,
//       deleted_reason: reason || 'Deleted by user'
//     })
//     .eq('id', id)

//   if (error) throw error
// }

// // Mark product as sold
// export async function markProductAsSold(id: string) {
//   const { data, error } = await supabase
//     .from('products')
//     .update({ 
//       is_sold: true,
//       sold_at: new Date().toISOString()
//     })
//     .eq('id', id)
//     .select()
//     .single()

//   if (error) throw error
//   return data as Product
// }

// // Increment interested count
// export async function incrementInterested(id: string) {
//   const { data: product } = await supabase
//     .from('products')
//     .select('interested')
//     .eq('id', id)
//     .single()

//   if (!product) return

//   const { error } = await supabase
//     .from('products')
//     .update({ interested: (product.interested || 0) + 1 })
//     .eq('id', id)

//   if (error) throw error
// }

// // Get user's products
// export async function getUserProducts(userId: string, includeDeleted: boolean = false) {
//   let query = supabase
//     .from('products')
//     .select(`
//       *,
//       category:categories(id, name, icon)
//     `)
//     .eq('seller_id', userId)
//     .order('created_at', { ascending: false })

//   if (!includeDeleted) {
//     query = query.eq('is_deleted', false)
//   }

//   const { data, error } = await query

//   if (error) throw error
//   return data as Product[]
// }

// Update product
export async function updateProduct(id: string, updates: Partial<Product>) {
  // Defensive: copy payload
  const payload: any = { ...updates };

  // If caller provided `category` as a string (category name) or `category_name`, try to resolve it to id
  const categoryName = (payload.category_name && typeof payload.category_name === 'string')
    ? payload.category_name
    : (payload.category && typeof payload.category === 'string' ? payload.category : null);

  if (categoryName) {
    try {
      const { data: cat, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .maybeSingle();

      if (catError) throw catError;

      if (cat && (cat as any).id) {
        payload.category_id = (cat as any).id;
      } else {
        // If the category doesn't exist, create it (best-effort) and use the new id
        const { data: newCat, error: newCatErr } = await supabase
          .from('categories')
          .insert({ name: categoryName })
          .select('id')
          .maybeSingle();

        if (newCatErr) throw newCatErr;
        if (newCat && (newCat as any).id) payload.category_id = (newCat as any).id;
      }
    } catch (e) {
      console.warn('updateProduct: failed to resolve category name to id', e);
    }
  }

  // Always remove raw `category`/`category_name` and legacy `image` fields to avoid sending invalid columns
  if ('category' in payload) delete payload.category;
  if ('category_name' in payload) delete payload.category_name;
  if ('image' in payload) delete payload.image;

  // Sanitize images array when present
  if (payload.images) {
    try {
      payload.images = normalizeImages(payload.images as any);
    } catch (e) {
      payload.images = normalizeImages(undefined);
    }
  }

  // If client provided a category_id that doesn't look like a UUID, try to resolve it as a category name
  const looksLikeUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);
  if (payload.category_id && !looksLikeUuid(payload.category_id)) {
    try {
      const lookup = String(payload.category_id);
      const { data: cat, error: catErr } = await supabase
        .from('categories')
        .select('id')
        .eq('name', lookup)
        .maybeSingle();

      if (catErr) throw catErr;
      if (cat && (cat as any).id) payload.category_id = (cat as any).id;
      else {
        // Couldn't resolve category id/name - remove to avoid DB uuid cast errors
        delete payload.category_id;
      }
    } catch (e) {
      // Remove invalid category_id to avoid causing a DB error
      delete payload.category_id;
    }
  }

  const res = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      seller:users!seller_id(id, username, avatar_url, credit_score, is_trusted_member),
      category:categories(id, name, icon)
    `)
    .maybeSingle();

  let { data, error } = res;

  // If PostgREST complains about missing relationship/column (e.g., PGRST204 or 42703), fall back to a safe two-step approach:
  //  - perform the update without nested selects
  //  - then fetch the row with a simple select('*') and enrich seller/category in separate queries
  if (error) {
    const msg = (error?.message || '').toLowerCase();
    if (error?.code === 'PGRST204' || error?.code === '42703' || msg.includes('could not find') || msg.includes('does not exist') || msg.includes('seller')) {
      console.info('[products] Schema/relationship mismatch when selecting nested seller; performing safe update+fetch', { message: error?.message });

      // Attempt update without nested select
      const { error: updErr } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id);

      if (updErr) {
        // If the plain update failed, try server-side safe RPC which avoids nested selects and schema cache issues
        console.info('[products] plain update failed; attempting safe_update_product RPC', { error: updErr?.message || '' });
        try {
          let rpcRes: any = null;
          let rpcErr: any = null;

          // Retry RPC a couple times with small backoff to tolerate transient schema cache issues
          for (let attempt = 1; attempt <= 2; attempt++) {
            const call = await supabase.rpc('safe_update_product', { p_id: id, p_payload: payload as any });
            rpcRes = call.data;
            rpcErr = call.error;
            if (!rpcErr) break;
            console.warn(`[products] safe_update_product RPC attempt ${attempt} failed`, rpcErr);
            if (attempt < 2) await new Promise((r) => setTimeout(r, 250 * attempt));
          }

          if (rpcErr) {
            const rpcMsg = String(rpcErr?.message || '').toLowerCase();
            console.error('[products] safe_update_product RPC failed after retries:', rpcErr);

            // Detect common RPC failure reasons and provide clearer guidance
            if (rpcMsg.includes('subquery must return only one column') || rpcMsg.includes('could not find') || rpcMsg.includes('does not exist') || rpcMsg.includes('seller')) {
              throw new Error('Server schema/cache mismatch detected. Please restart the Supabase API (Project → Settings → API → Restart) or apply pending migrations, then try again.');
            }

            error = rpcErr;
          } else if (!rpcRes) {
            throw new Error(`Product not found or update not permitted: ${id}.`);
          } else {
            // Compose and normalize RPC result
            const composed = rpcRes as any;
            let seller: any = null;
            if (composed.seller_id) {
              try {
                const { data: sellerRow } = await supabase
                  .from('users')
                  .select('id, username, avatar_url, credit_score, is_trusted_member')
                  .eq('id', composed.seller_id)
                  .maybeSingle();
                seller = sellerRow || null;
              } catch (e) { seller = null; }
            }

            let category: any = null;
            if ((composed as any).category_id) {
              try {
                const { data: catRow } = await supabase
                  .from('categories')
                  .select('id, name, icon')
                  .eq('id', (composed as any).category_id)
                  .maybeSingle();
                category = catRow || null;
              } catch (e) { category = null; }
            }

            const images = normalizeImages((composed as any).images || (composed as any).image ? ((composed as any).images || [(composed as any).image]) : undefined);
            const firstImage = (images && images.length > 0) ? images[0] : ((composed as any).image || '/placeholder.png');

            return {
              ...composed,
              seller,
              category,
              images,
              image: firstImage,
            } as Product;
          }
        } catch (e) {
          // If rpc attempt threw, capture it and continue to mapping below which will eventually throw
          error = e as any;
        }
      } else {
        // Fetch the updated row with a simple select and enrich
        const { data: simpleRow, error: simpleErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (simpleErr) {
          error = simpleErr;
        } else if (!simpleRow) {
          // No row found after update - treat as not found
          throw new Error(`Product not found or update not permitted: ${id}. This may be caused by insufficient permissions or the product being removed.`);
        } else {
          // Best-effort enrichment for seller and category
          let seller: any = null;
          if (simpleRow.seller_id) {
            try {
              const { data: sellerRow } = await supabase
                .from('users')
                .select('id, username, avatar_url, credit_score, is_trusted_member')
                .eq('id', simpleRow.seller_id)
                .maybeSingle();
              seller = sellerRow || null;
            } catch (e) {
              seller = null;
            }
          }

          let category: any = null;
          if (simpleRow.category_id) {
            try {
              const { data: catRow } = await supabase
                .from('categories')
                .select('id, name, icon')
                .eq('id', simpleRow.category_id)
                .maybeSingle();
              category = catRow || null;
            } catch (e) {
              category = null;
            }
          }

          const composed = { ...simpleRow, seller, category } as any;

          // Normalize images on return to keep UI rendering consistent
          const images = normalizeImages((composed as any).images || (composed as any).image ? ((composed as any).images || [(composed as any).image]) : undefined);
          const firstImage = (images && images.length > 0) ? images[0] : ((composed as any).image || '/placeholder.png');

          return {
            ...composed,
            images,
            image: firstImage,
          } as Product;
        }
      }
    }
  }

  // Map common PostgREST single-row coercion error to a clearer message
  if (error) {
    // Map empty-result single-coercion error to friendlier message
    if (error.code === 'PGRST116' || (error.details && String(error.details).includes('0 rows'))) {
      throw new Error(`Product not found or update not permitted: ${id}. This may be caused by insufficient permissions or the product being removed.`);
    }

    // Handle invalid UUID errors (e.g., invalid category_id)
    if (error.code === '22P02' || (error.message && String(error.message).toLowerCase().includes('invalid input syntax for type uuid'))) {
      throw new Error('Invalid category id or malformed identifier provided. Please choose a valid category.');
    }

    throw error;
  }

  if (!data) throw new Error(`Product not found or update not permitted: ${id}`);

  // Normalize images on return to keep UI rendering consistent
  const images = normalizeImages((data as any).images || (data as any).image ? ((data as any).images || [(data as any).image]) : undefined);
  const firstImage = (images && images.length > 0) ? images[0] : ((data as any).image || '/placeholder.png');

  return {
    ...data,
    images,
    image: firstImage,
  } as Product;
}

// Delete product. By default this performs a soft delete via `delete_product_fallback`.
// If `hard` is true, call the admin-only `hard_delete_product` RPC (requires an admin session).
export async function deleteProduct(id: string, reason?: string, hard: boolean = false) {
  if (hard) {
    // Admin-only hard delete
    const { data, error } = await supabase.rpc('hard_delete_product', { p_id: id });
    if (error) {
      // Map common DB errors to friendly messages
      if (error.code === '22P02' || (error.message && String(error.message).toLowerCase().includes('invalid input syntax for type uuid'))) {
        throw new Error('Invalid product id format. The product identifier appears malformed.');
      }
      throw error;
    }
    // If the product was already gone, function returns null
    if (!data) return null;

    return { id: data }; // return deleted id for callers
  }

  const payload = { p_id_text: String(id), p_reason: reason || 'Deleted by user' };

  const { data, error } = await supabase.rpc('delete_product_fallback', payload);

  if (error) {
    // Map common database errors to friendly messages
    if (error.code === '22P02' || (error.message && String(error.message).toLowerCase().includes('invalid input syntax for type uuid'))) {
      throw new Error('Invalid product id format. The product identifier appears malformed.');
    }
    // For any other RPC-level errors, rethrow so the caller can inspect
    throw error;
  }

  // RPC may return an array of rows or a single row depending on client/driver
  const row = Array.isArray(data) ? data[0] : data;

  // If the server indicates the product wasn't found (we return a sentinel row), do NOT throw.
  // Return null so callers can handle it as a no-op (item already deleted).
  if (!row || row.id == null) {
    return null;
  }

  // Successful soft-delete: return the deleted row
  return row as any;
}

// New wrapper that makes the result explicit and easier to consume from UI code
export type DeleteProductResult =
  | { ok: true; id?: string }
  | { ok: false; reason: 'not_found' | 'error'; error?: unknown; permissionDenied?: boolean };

export async function deleteProductById(id: string, hard: boolean = false): Promise<DeleteProductResult> {
  console.debug('deleteProductById: attempting delete for id:', id, { hard });
  try {
    const res = await deleteProduct(id, undefined, hard);
    console.debug('deleteProductById: deleteProduct RPC returned', res);
    if (!res) {
      // No row matched the RPC — treat as not found, but try multiple direct fallbacks to cover different legacy columns
      console.debug('deleteProductById: no matching row found (not_found) for id', id);

      const fallbackFields = ['id', 'product_id', 'legacy_product_id', 'numeric_id', 'legacy_id'];
      for (const field of fallbackFields) {
        try {
          // Skip numeric-field attempts when id is not numeric
          if (field !== 'id') {
            const asNum = Number(id);
            if (Number.isNaN(asNum)) continue;
            console.debug('deleteProductById: attempting fallback update using field', field, 'value', asNum);
            const { data: upd, error: updErr } = await supabase
              .from('products')
              .update({ is_deleted: true, deletion_reason: `Deleted by user (fallback:${field})` })
              .eq(field, asNum)
              .select('id')
              .maybeSingle();

            if (updErr) {
              console.debug('deleteProductById: fallback update error for field', field, updErr);
            } else if (upd && (upd as any).id) {
              console.debug('deleteProductById: fallback update succeeded for field', field, 'id', (upd as any).id);
              return { ok: true as const, id: String((upd as any).id) };
            }
          } else {
            console.debug('deleteProductById: attempting fallback update using id (uuid) for', id);
            const { data: upd, error: updErr } = await supabase
              .from('products')
              .update({ is_deleted: true, deletion_reason: 'Deleted by user (fallback:id)' })
              .eq('id', id)
              .select('id')
              .maybeSingle();

            if (updErr) {
              console.debug('deleteProductById: fallback update error for id', updErr);
            } else if (upd && (upd as any).id) {
              console.debug('deleteProductById: fallback update succeeded for id', id);
              return { ok: true as const, id: String((upd as any).id) };
            }
          }
        } catch (e) {
          console.debug('deleteProductById: fallback attempt threw for field', field, e);
        }
      }

      // Development-only verification to help diagnose cases where a UI thinks the product was deleted but DB row remains
      try {
        if (process.env.NODE_ENV === 'development') {
          const checks: any[] = [];

          try {
            const { data: byId } = await supabase.from('products').select('id,is_deleted,seller_id').eq('id', id).maybeSingle();
            checks.push({ method: 'id', row: byId });
          } catch (e) {
            checks.push({ method: 'id', error: e });
          }

          const asNum = Number(id);
          if (!Number.isNaN(asNum)) {
            for (const numericCol of ['product_id', 'legacy_product_id', 'numeric_id', 'legacy_id']) {
              try {
                const { data } = await supabase.from('products').select('id,is_deleted,seller_id').eq(numericCol, asNum).maybeSingle();
                checks.push({ method: numericCol, row: data });
              } catch (e) {
                checks.push({ method: numericCol, error: e });
              }
            }
          }

          console.debug('deleteProductById: verification checks for id', id, checks);
        }
      } catch (e) {
        console.debug('deleteProductById: verification check threw', e);
      }

      return { ok: false as const, reason: 'not_found' };
    }

    // res is either { id } or a row object including id
    const deletedId = (res.id ? String(res.id) : String(id));

    // Development-only verification: confirm the row is marked as deleted
    try {
      if (process.env.NODE_ENV === 'development') {
        try {
          const { data: verify } = await supabase.from('products').select('id,is_deleted').eq('id', deletedId).maybeSingle();
          console.debug('deleteProductById: verification after delete (should be is_deleted=true):', verify);
        } catch (e) {
          console.debug('deleteProductById: verification after delete threw', e);
        }
      }
    } catch (e) { /* ignore */ }

    console.debug('deleteProductById: successful delete, id:', deletedId);
    return { ok: true as const, id: deletedId };
  } catch (err: any) {
    console.error('deleteProductById: unexpected error', err);
    // Map RLS/permission-like errors to a friendly reason when possible
    const message = err?.message || '';
    const isPermission = String(message).toLowerCase().includes('permission') || String(message).toLowerCase().includes('row-level security') || (err?.status === 403);
    return { ok: false as const, reason: 'error' as const, error: err, permissionDenied: isPermission };
  }
}

// Mark product as sold
export async function markProductAsSold(id: string) {
  const { data, error } = await supabase
    .from('products')
    .update({ 
      is_sold: true,
      sold_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      seller:users!seller_id(id, username, avatar_url),
      category:categories(id, name)
    `)
    .single();

  if (error) throw error;
  if (!data) throw new Error(`Product not found: ${id}`);
  return data as Product;
}

// Increment interested count
export async function incrementInterested(id: string) {
  const { data, error } = await supabase
    .from('products')
    .update({ interested: supabase.rpc('increment', { x: 1 }) }) // or manual increment
    .eq('id', id)
    .select('id, interested')
    .single();

  if (error) throw error;
  return data;
}

// Get user's products
export async function getUserProducts(userId?: string | null, includeDeleted: boolean = false) {
  // Defensive: if userId is missing, avoid calling Supabase which may return a 400 Bad Request
  if (!userId) return [];

  let query = supabase
    .from('products')
    .select(`
      *,
      seller:users!seller_id(id, username, avatar_url),
      category:categories(id, name, icon)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;
  if (error) throw error;

  const safeData = (data || []).map((p: any) => {
    if (!p.seller) {
      return {
        ...p,
        seller: {
          id: p.seller_id,
          username: String(p.seller_id),
          avatar_url: null,
          credit_score: 0,
          is_trusted_member: false,
        }
      }
    }
    return p
  })

  return safeData as Product[];
}


// // Subscribe to new product inserts (returns unsubscribe function)
// type ProductCallbacks = {
//   onInsert?: (product: Product) => void;
//   onUpdate?: (product: Product) => void;
//   onDelete?: (productId: string) => void;
// };

// /**
//  * Subscribe to realtime product events (INSERT, UPDATE, DELETE).
//  * Accepts either a single callback (onInsert) for backward compatibility,
//  * or an object of callbacks { onInsert, onUpdate, onDelete }.
//  * Returns an unsubscribe function.
//  */
// export function subscribeToProducts(
//   callbacks: ((product: Product) => void) | ProductCallbacks,
// ) {
//   const cbs: ProductCallbacks =
//     typeof callbacks === 'function' ? { onInsert: callbacks } : callbacks;

//   const channel = supabase.channel('public:products')
//     // INSERT
//     .on(
//       'postgres_changes',
//       { event: 'INSERT', schema: 'public', table: 'products' },
//       (payload) => {
//         try {
//           cbs.onInsert?.(payload.new as Product);
//         } catch (e) {
//           console.warn('Error handling new product payload', e);
//         }
//       },
//     )
//     // UPDATE
//     .on(
//       'postgres_changes',
//       { event: 'UPDATE', schema: 'public', table: 'products' },
//       (payload) => {
//         try {
//           cbs.onUpdate?.(payload.new as Product);
//         } catch (e) {
//           console.warn('Error handling updated product payload', e);
//         }
//       },
//     )
//     // DELETE
//     .on(
//       'postgres_changes',
//       { event: 'DELETE', schema: 'public', table: 'products' },
//       (payload) => {
//         try {
//           cbs.onDelete?.((payload.old as Product).id);
//         } catch (e) {
//           console.warn('Error handling deleted product payload', e);
//         }
//       },
//     )
//     .subscribe();

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }

type ProductCallbacks = {
  onInsert?: (product: Product) => void;
  onUpdate?: (product: Product) => void;
  onDelete?: (productId: string) => void;
};

/**
 * Subscribe to realtime product events (INSERT, UPDATE, DELETE).
 * Accepts either a single callback (onInsert) for backward compatibility,
 * or an object of callbacks { onInsert, onUpdate, onDelete }.
 * Returns an unsubscribe function.
 */
export function subscribeToProducts(
  callbacks: ((product: Product) => void) | ProductCallbacks,
) {
  const cbs: ProductCallbacks =
    typeof callbacks === 'function' ? { onInsert: callbacks } : callbacks;

  const channel = supabase
    .channel('products-changes') // ✅ clearer channel name
    // INSERT
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'products' },
      (payload) => {
        if (payload?.new) {
          try {
            cbs.onInsert?.(payload.new as Product);
          } catch (e) {
            console.error('Error handling new product payload', e);
          }
        }
      }
    )
    // UPDATE
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'products' },
      (payload) => {
        if (payload?.new) {
          try {
            cbs.onUpdate?.(payload.new as Product);
          } catch (e) {
            console.error('Error handling updated product payload', e);
          }
        }
      }
    )
    // DELETE
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'products' },
      (payload) => {
        if (payload?.old?.id) {
          try {
            cbs.onDelete?.((payload.old as Product).id);
          } catch (e) {
            console.error('Error handling deleted product payload', e);
          }
        }
      }
    )
    .subscribe();

  // Log subscription creation for debugging (use debug level to avoid noisy info logs in console)
  try {
    console.debug('subscribeToProducts: realtime subscription created on channel products-changes');
  } catch (e) {
    // ignore
  }

  // ✅ Return unsubscribe function
  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      console.warn('Failed to remove products channel', e);
    }
  };
}
