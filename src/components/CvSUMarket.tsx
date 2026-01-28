import React, { useState, useEffect, useMemo, useRef, useId } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  Search,
  ShoppingCart,
  Plus,
  Edit,
  Trash2,
  Save,
  X as XIcon,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Info,
  Building2,
  Ruler,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { EmptyState } from "./EmptyState";
import { useMarketplaceFilters } from '../hooks/useMarketplaceFilters';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { products as staticProducts } from '../data/staticProducts'
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext'
import { getCvSUProducts, subscribeToProducts, updateProduct, deleteProduct, createProduct, uploadProductImages, isCvSUProduct, createCvSUProduct, updateCvSUProduct, deleteCvSUProduct, subscribeToCvSUProducts } from '../lib/services/products'
import type { ProductWithSeller } from '../lib/services/products'

// Local UI type (keeps the component typing simple)
type CvSUProduct = ProductWithSeller | any;

export default function CvSUMarket({ onRequestEdit, userType }: { onRequestEdit?: (p: CvSUProduct) => void, userType?: string } = {}) {
  // keep userType for backward compatibility (App may pass it)
  void userType;
  const { user } = useAuth()
  // Consider App-level userType prop for example mode admin preview
  const isAdmin = Boolean(user?.is_admin || userType === 'admin')

  const [products, setProducts] = useState<CvSUProduct[]>([]);
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, filteredProducts, highlightMatch, noResultsMessage } = useMarketplaceFilters(products, { debounce: 300 });
  const [editingProduct, setEditingProduct] = useState<CvSUProduct | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUniformSizes, setShowUniformSizes] = useState(false);
  const [showOfficeInfo, setShowOfficeInfo] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Add mode + image helpers used by the Add/Edit modal
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Track IDs currently being deleted to avoid optimistic removal races with realtime inserts
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const deletingIdsRef = useRef<Set<string>>(deletingIds);
  useEffect(() => { deletingIdsRef.current = deletingIds; }, [deletingIds]);

  const addDeletingId = (id: string) => setDeletingIds((prev) => { const s = new Set(prev); s.add(id); return s; });
  const removeDeletingId = (id: string) => setDeletingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });

  // Create and revoke objectURL for file previews to avoid memory leaks
  const _objectUrlRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      // Revoke any previous object URL before creating a new one
      if (_objectUrlRef.current) {
        try { URL.revokeObjectURL(_objectUrlRef.current); } catch (e) { /* ignore */ }
        _objectUrlRef.current = null;
      }

      if (selectedFiles && selectedFiles.length > 0) {
        const url = URL.createObjectURL(selectedFiles[0]);
        _objectUrlRef.current = url;
        setPreviewUrl(url);
      } else {
        // No files selected: clear preview and ensure previous URL is revoked
        setPreviewUrl(null);
      }
    } catch (e) {
      setPreviewUrl(null);
    }

    return () => {
      // On unmount revoke any remaining object URL
      if (_objectUrlRef.current) {
        try { URL.revokeObjectURL(_objectUrlRef.current); } catch (e) { /* ignore */ }
        _objectUrlRef.current = null;
      }
    };
  }, [selectedFiles]);

  // Helper to safely extract normalized category name from product or raw category value
  const getCategoryName = (obj: any) => {
    const cat = obj?.category ?? obj;
    if (!cat) return null;
    if (typeof cat === 'object') return (cat as any).name ?? null;
    return cat;
  };

  // Dynamically derive known categories from product data for consistency
  const categories = useMemo(() => {
    const names = new Set<string>();
    products.forEach((p: any) => {
      const name = getCategoryName(p) || null;
      // Remove the special-purpose 'CvSU Market' category which should not be selectable by users
      if (name && name !== 'CvSU Market') names.add(name);
    });
    return ["all", ...Array.from(names)];
  }, [products]);


  // Stable ids for dialog descriptions to ensure accessibility attributes are always present
  const editModalDescId = useId();
  const uniformModalDescId = useId();
  const officeModalDescId = useId();

  // Persist filters/search across navigation within session
  useEffect(() => {
    try { sessionStorage.setItem('market:query', searchQuery || ''); } catch (e) {}
  }, [searchQuery]);

  useEffect(() => {
    try { sessionStorage.setItem('market:category', selectedCategory || 'all'); } catch (e) {}
  }, [selectedCategory]);

  useEffect(() => {
    try {
      const q = sessionStorage.getItem('market:query');
      const c = sessionStorage.getItem('market:category');
      if (q) setSearchQuery(q);
      if (c) setSelectedCategory(c);
    } catch (e) {}
  }, []);

  // Load CvSU products and subscribe to realtime updates for them
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    const cvsuCategoryIdsRef = { current: new Set<string>() } as { current: Set<string> };

    const load = async () => {
      setLoading(true);
      try {
        const rows = await getCvSUProducts();
        if (!mounted) return;

        // If DB returned no CvSU rows, fall back to static demo products present in the repo
        if (!rows || (Array.isArray(rows) && rows.length === 0)) {
          console.debug('getCvSUProducts returned no rows - using static demo products as fallback');
          const demo = staticProducts.map((s: any) => ({
            ...s,
            // Attach minimal seller so UI renders consistently
            seller: { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
            // Ensure images array exists
            images: s.images && s.images.length ? s.images : s.image ? [s.image] : ['/placeholder.png']
          }));
          setProducts(demo as any[]);

          // Cache categories by name (no ids available in static data) to help reconciliation
          const catNames = new Set<string>();
          demo.forEach((r: any) => {
            const name = getCategoryName(r) || null;
            if (name) catNames.add(name);
          });
          // store as set of names on ref 'current' so realtime handlers can still use isCvSUProduct
          // (we'll keep using isCvSUProduct primarily)
          cvsuCategoryIdsRef.current = new Set<string>();
        } else {
          // If the DB returned rows, include any featured/static CvSU items that are missing
          const dbRows = (rows as any[]).map(r => ({
            // normalize view or product shape into a consistent display shape
            id: r.id,
            product_id: r.product_id || null,
            title: r.title || r.name,
            description: r.description || r.title || r.name,
            images: r.images || [],
            category: getCategoryName(r) || r.category || null,
            seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
          }));

          // Titles present in DB (lowercase) for quick lookup
          const dbTitles = new Set(dbRows.map(r => ((r.title || '') || '').toString().toLowerCase()));

          // Find featured static CvSU products (we treat id >= 100 as featured fallback)
          const featured = staticProducts.filter((p: any) => p.id >= 100 && ((p.category || '').toString().toLowerCase().includes('cvsu') || p.category === 'CvSU Uniforms' || p.category === 'PE Apparel'));

          const toAppend = featured.filter((f: any) => !dbTitles.has((f.title || f.name).toString().toLowerCase()))
            .map((f: any) => ({ ...f, seller: { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null } }));

          // Merge DB rows and featured static products, ensuring uniqueness by id
          setProducts(() => {
            const map = new Map<string | number, any>();
            // add DB rows first (authored source of truth)
            dbRows.forEach((r: any) => map.set(String(r.id), r));
            // append featured ones only if missing
            toAppend.forEach((r: any) => {
              if (!map.has(String(r.id))) map.set(String(r.id), r);
            });
            return Array.from(map.values());
          });

          // Cache the category ids for quick realtime qualification checks
          const catIds = new Set<string>();
          rows.forEach((r: any) => {
            if (r?.category?.id) catIds.add(r.category.id);
            else if (r?.category_id) catIds.add(r.category_id);
          });
          cvsuCategoryIdsRef.current = catIds;
        }
      } catch (e: any) {
        console.error('Failed to load CvSU products', e);
        toast.error('Failed to load CvSU products');
      } finally {
        setLoading(false);
      }

      // Subscribe to product changes (products table) and cvsu_market changes (cvsu specific table)
      unsub = subscribeToProducts({
        onInsert: (p: any) => {
          try {
            const isCv = isCvSUProduct(p) || cvsuCategoryIdsRef.current.has(p?.category_id);
            if (!isCv) return;
            setProducts((prev) => {
              if (prev.find((x) => String(x.id) === String(p.id))) return prev;
              return [p, ...prev];
            });
          } catch (err) {
            console.error('onInsert handler error', err);
          }
        },
        onUpdate: (p: any) => {
          try {
            const qualifies = (isCvSUProduct(p) || cvsuCategoryIdsRef.current.has(p?.category_id)) && !p.is_deleted && !p.is_hidden && !p.is_sold && (p.is_available === true || p.is_available === null);
            setProducts((prev) => {
              const idx = prev.findIndex((x) => String(x.id) === String(p.id));
              if (idx >= 0) {
                if (!qualifies) {
                  const copy = [...prev];
                  copy.splice(idx, 1);
                  return copy;
                }
                const copy = [...prev];
                copy[idx] = { ...copy[idx], ...p };
                return copy;
              }

              if (qualifies) {
                return [p, ...prev.filter((x) => String(x.id) !== String(p.id))];
              }
              return prev;
            });
          } catch (err) {
            console.error('onUpdate handler error', err);
          }
        },
        onDelete: (id: string) => {
          try {
            setProducts((prev) => prev.filter((x) => String(x.id) !== String(id)));
          } catch (err) {
            console.error('onDelete handler error', err);
          }
        }
      });

      // Also subscribe to cvsu_market_products table changes
      const unsubCvsu = subscribeToCvSUProducts({
        onInsert: (row: any) => {
          try {
            // Ignore realtime inserts for rows we are currently deleting to avoid re-adding them
            if (deletingIdsRef.current.has(String(row.id))) return;

            const item = {
              ...row,
              id: row.id,
              title: row.title,
              description: row.description || row.title,
              images: row.images || [],
              category: row.category || null,
            };
            setProducts((prev) => [item, ...prev.filter((x) => String(x.id) !== String(item.id))]);
          } catch (err) {
            console.error('subscribeToCvSUProducts onInsert', err);
          }
        },
        onUpdate: (row: any) => {
          try {
            // Ignore updates for rows we are actively deleting to avoid transient state flips
            if (deletingIdsRef.current.has(String(row.id))) return;
            setProducts((prev) => prev.map((p) => (String(p.id) === String(row.id) ? { ...p, ...row, images: row.images || [] } : p)));
          } catch (err) {
            console.error('subscribeToCvSUProducts onUpdate', err);
          }
        },
        onDelete: (id: any) => {
          try {
            setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
          } catch (err) {
            console.error('subscribeToCvSUProducts onDelete', err);
          }
        }
      });

      // Merge unsub functions so we can clean up both. Capture the concrete unsub fns returned
      // by the subscribes and call them (avoid reassigning `unsub` to a function that would call
      // itself and cause recursion).
      const productUnsub = unsub;
      const cvsuUnsubFn = unsubCvsu;
      const combined = () => {
        try { if (typeof productUnsub === 'function') productUnsub(); } catch (e) { console.warn('failed to unsubscribe products channel', e); }
        try { if (typeof cvsuUnsubFn === 'function') cvsuUnsubFn(); } catch (e) { console.warn('failed to unsubscribe cvsu channel', e); }
      };

      // expose combined cleanup as `unsub` so outer cleanup calls it safely
      unsub = combined;
    };

    load();

    return () => {
      mounted = false;
      if (unsub) try { unsub(); } catch (e) {}
    };
  }, []);



  // Ensure the list rendered to the user contains unique products by id to avoid React key collisions
  const uniqueFilteredProducts = useMemo(() => {
    const seen = new Set<string>();
    return filteredProducts.filter((p: any) => {
      const id = String(p?.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [filteredProducts]);

  const handleAddProduct = () => {
    const newProduct: CvSUProduct = {
      id: Date.now(),
      name: "",
      category: "CvSU Uniforms",
      image: "https://tse4.mm.bing.net/th/id/OIP.-oHmAgKavCEdbqiCk0tI8QHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3",
    };
    setEditingProduct(newProduct);
    setSelectedFiles([]);
    setImageUrlInput('');
    setIsAddMode(true);
    setShowEditModal(true);
  };

  const handleEditProduct = (product: CvSUProduct) => {
    // Prefer parent-managed edit modal if provided
    if (typeof onRequestEdit === 'function') {
      onRequestEdit(product);
      return;
    }

    setEditingProduct({ ...product });
    setSelectedFiles([]);
    setImageUrlInput('');
    setIsAddMode(false);
    setShowEditModal(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    if (!editingProduct.title && !editingProduct.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Build images array (selected file upload takes precedence, then image URL, then existing images)
    let images: string[] = editingProduct?.images || (editingProduct?.image ? [editingProduct.image] : []);

    if (selectedFiles && selectedFiles.length > 0) {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        const uploaded = await uploadProductImages(selectedFiles, (uploadedCount: number, total: number) => {
          try { setUploadProgress(Math.round((uploadedCount / total) * 100)); } catch (e) { /* ignore */ }
        });
        if (uploaded && uploaded.length > 0) images = uploaded;
      } catch (e: any) {
        console.error('Image upload failed', e);
        toast.error(e?.message || 'Image upload failed');
        return;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else if (imageUrlInput && imageUrlInput.trim()) {
      images = [imageUrlInput.trim()];
    }

    // Determine if this is creating a new product (Add) or editing existing one (Edit)
    const isExisting = !isAddMode;

    try {
      const title = editingProduct.title || editingProduct.name || '';
      const price = editingProduct.price ? Number(editingProduct.price) : 0;

      // Build description: prefer an explicit field, fall back to title for creates so DB NOT NULL constraint is satisfied
      const hasDescriptionField = (editingProduct as any)?.description !== undefined;

      // Normalize category into either category_id or category name so the service functions don't send a raw `category` object
      const payload: any = {
        title,
        price,
        images,
      } as any;

      // Include description: for creates ensure non-null; for updates only include if user provided one
      if (isAddMode) {
        payload.description = (editingProduct as any)?.description ?? title;
      } else if (hasDescriptionField) {
        // Only include description in updates if it was present on the editing model (avoid overwriting existing description with empty)
        payload.description = (editingProduct as any)?.description;
      }

      // Include condition: database requires non-null condition for products table
      const hasConditionField = (editingProduct as any)?.condition !== undefined;
      if (isAddMode) {
        payload.condition = (editingProduct as any)?.condition ?? 'Not specified';
      } else if (hasConditionField) {
        // Only include if user explicitly provided a condition while editing
        payload.condition = (editingProduct as any)?.condition;
      }

      if (editingProduct.category) {
        // If product already has a category object (from DB), prefer its id (but only include it if it looks like a UUID)
        if (typeof editingProduct.category === 'object' && editingProduct.category?.id) {
          // Ensure we pass a string id only
          const cid = String(editingProduct.category.id);
          // Simple UUID detection
          const looksLikeUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(val);
          if (looksLikeUuid(cid)) payload.category_id = cid; else payload.category_name = cid;
        } else if (typeof editingProduct.category === 'string') {
          // Use a safe name field so we don't send a raw `category` column which doesn't exist
          // Server helpers expect either `category_id` or `category_name`/`category` name.
          payload.category_name = editingProduct.category;
        }
      }

      // Defensive: normalize category_id so we don't accidentally send an object/number and trigger a DB casting error
      if (payload.category_id !== undefined && payload.category_id !== null) {
        if (typeof payload.category_id === 'object') {
          // If someone accidentally attached a category object, use its id
          if (payload.category_id.id) payload.category_id = String(payload.category_id.id);
          else payload.category_id = String(payload.category_id);
        } else if (typeof payload.category_id !== 'string') {
          payload.category_id = String(payload.category_id);
        }
      }

      // Ensure we never send raw `category` object/column by mistake
      if ('category' in payload) delete payload.category;

      // Debug: log payload so we can inspect what is being sent when reproducing errors
      if (typeof window !== 'undefined' && ((window as any).__ISKOMARKET_DEBUG__ || (window as any).ISKOMARKET_DEBUG)) {
        console.debug('CvSUMarket: saving product payload', payload, { isExisting, editingProduct });
      }

      if (isExisting) {
        // Admin edits should update the cvsu_market_products table if the row exists in that table.
        if (isAdmin) {
          try {
            const updated = await updateCvSUProduct(editingProduct.id, { title, description: payload.description, images: images, category: editingProduct.category || payload.category });
            setProducts((prev) => prev.map((p) => (String(p.id) === String(updated.id) ? { ...p, ...updated, images: updated.images } : p)));
            toast.success('Product updated');
          } catch (e) {
            // If cvsu table update failed, fall back to updating the products table
            const updated = await updateProduct(editingProduct.product_id || editingProduct.id, payload as any);
            setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            toast.success('Product updated (synced to products table)');
          }
        } else {
          // Non-admins update the products table as before
          const updated = await updateProduct(editingProduct.id, payload as any);
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          toast.success('Product updated');
        }
      } else {
        if (isAdmin) {
          const created = await createCvSUProduct({ title, description: payload.description, images, category: payload.category });
          setProducts((prev) => [{ ...created, id: created.id, images: created.images }, ...prev.filter((x) => String(x.id) !== String(created.id))]);
          toast.success('Product created');
        } else {
          const created = await createProduct({ ...payload, is_cvsu_only: true });
          setProducts((prev) => [created, ...prev.filter((x) => String(x.id) !== String(created.id))]);
          toast.success('Product created');
        }
      }
    } catch (e: any) {
      console.error('Save product failed', e);

      // More actionable messaging for permission issues (RLS)
      const msg = e?.message || '';
      if (typeof msg === 'string' && (msg.includes('update not permitted') || msg.includes('not found or update not permitted') || msg.includes('not found'))) {
        toast.error('You are not permitted to update this product. Ensure you are signed in as the product owner or an admin, or refresh the list to re-sync.');
      } else if (typeof msg === 'string' && (msg.toLowerCase().includes('invalid category') || msg.toLowerCase().includes('invalid category id') || msg.toLowerCase().includes('category not found') )) {
        toast.error('Invalid category selected. Please choose an existing category from the list.');
      } else if (typeof msg === 'string' && msg.toLowerCase().includes('server schema mismatch')) {
        toast.error('Server schema mismatch detected. Please notify the administrator.');
      } else {
        toast.error(msg || 'Failed to save product');
      }

      return;
    }

    setShowEditModal(false);
    setEditingProduct(null);
    setSelectedFiles([]);
    setImageUrlInput('');
    setIsAddMode(false);
  };

  const handleDeleteProduct = async (productOrId: any) => {
    if (!isAdmin) return;

    // Accept either product object or id
    const product = (typeof productOrId === 'object') ? productOrId : null;
    const rawId = product ? (product.id || product.product_id || '') : String(productOrId || '');
    const idStr = String(rawId);

    const ok = window.confirm('Delete this product? This action can be undone only by restoring in the DB.');
    if (!ok) return;

    // Ask admin whether to permanently delete the canonical product as well
    const permanently = isAdmin ? window.confirm('Also permanently delete the linked product and associated data from the database? This is irreversible.') : false;

    // mark as deleting (prevent realtime insert from re-adding while it's in-flight)
    addDeletingId(idStr);

    try {
      // If the clicked item is a CvSU row (it has a product_id property), delete the cvsu table row first
      if (product && (product.product_id !== undefined)) {
        try {
          console.debug('handleDeleteProduct: deleting CvSU row', { id: product.id, hard: permanently });
          const deleted = await deleteCvSUProduct(product.id, permanently);
          console.debug('handleDeleteProduct: deleteCvSUProduct returned', { id: product.id, deleted });
          // If the cvsu row referenced a canonical product, ensure we at least soft-delete the canonical product
          // (so it won't appear on public pages). If admin explicitly requested a permanent delete, follow-up with a hard delete.
          if (deleted && product?.product_id) {
            try {
              // Always attempt a soft-delete first to mark the product removed from public listings
              const { deleteProductById } = await import('../lib/services/products');
              const prodSoftRes = await deleteProductById(String(product.product_id), false);
              console.debug('handleDeleteProduct: soft-delete result', { product_id: product.product_id, prodSoftRes });

              if (!prodSoftRes.ok) {
                if ((prodSoftRes as any).reason === 'not_found') {
                  // Product already gone — not a hard failure for CvSU row deletion
                  console.info('Canonical product already deleted for product_id', product.product_id);
                } else if ((prodSoftRes as any).permissionDenied) {
                  toast.warning('CvSU entry removed but product-level deletion was denied due to permissions.');
                } else {
                  toast.warning('CvSU entry removed but product-level deletion failed; please check server logs.');
                }
              } else {
                // Dispatch deletion event so other clients remove the canonical product
                try { window.dispatchEvent(new CustomEvent('iskomarket:product-deleted', { detail: { id: prodSoftRes.id } })); } catch (e) { /* ignore */ }

                if (permanently) {
                  // If the admin wanted permanent deletion, attempt hard delete next. Let errors here surface as a warning.
                  try {
                    const prodHard = await deleteProductById(String(product.product_id), true);
                    console.debug('handleDeleteProduct: hard-delete result', { product_id: product.product_id, prodHard });

                    if (!(prodHard as any).ok) {
                      toast.warning('Permanent deletion attempted but failed; please check server logs.');
                    }
                  } catch (err) {
                    console.error('handleDeleteProduct: hard delete failed', { product_id: product.product_id, error: err });
                    toast.warning('CvSU entry removed but permanent product deletion failed; please check server logs.');
                  }
                } // end if (permanently)
              } // end else (prodSoftRes.ok)
            } catch (err) {
              console.error('handleDeleteProduct: product-level delete failed', { product_id: product.product_id, error: err });
              // Inform the admin but do not roll back the cvsu deletion
              toast.warning('CvSU entry removed but product-level deletion failed; please check server logs.');
            }
          }

          setProducts((prev) => prev.filter((p) => String(p.id) !== String(product.id) && String(p.product_id) !== String(product.id)));
          toast.success('Product deleted');

          // Insert admin audit log for CvSU product delete
          try {
            const { insertAdminAuditLog } = await import('../services/adminAuditService');
            await insertAdminAuditLog({
              admin_email: user?.email || user?.name || 'admin',
              action: 'deleted',
              target_type: 'product',
              target_id: String(product.product_id || product.id || ''),
              target_title: product.title || product.name || null,
              reason: 'Deleted via admin (CvSU entry removal)'
            } as any);
          } catch (e) {
            console.error('Failed to insert admin audit log for CvSU product delete', e);
          }

          // Ensure we refetch canonical set of CvSU products after a successful delete so navigation back shows fresh data
          (async () => {
            try {
              const fresh = await getCvSUProducts();
              if (Array.isArray(fresh)) {
                // map to canonical UI shape (matching load() mapping)
                const mapped = (fresh as any[]).map(r => ({
                  id: r.id,
                  product_id: r.product_id || null,
                  title: r.title || r.name,
                  description: r.description || r.title || r.name,
                  images: r.images || [],
                  category: getCategoryName(r) || r.category || null,
                  seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
                }));
                setProducts(mapped);
              }
            } catch (err) {
              console.warn('Refetch after delete failed', err);
            }
          })();

          return;
        } catch (e: any) {
          // Log full error for debugging, but avoid noisy warnings in normal flows.
          console.error('deleteCvSUProduct failed (attempting product-level fallback)', { id: product.id, error: e?.message || e });

          // Only remove the local item if the server explicitly reports the row is missing.
          const em = String(e?.message || '').toLowerCase();
          const isNotFound = em.includes('not found') || em.includes('product not found') || em.includes('no rows') || e?.status === 404 || e?.code === 'PGRST116' || e?.code === 'P0001';

          if (isNotFound) {
            // Remove local item that references a missing server row
            setProducts((prev) => prev.filter((p) => String(p.id) !== String(product.id) && String(p.product_id) !== String(product.id)));
            toast.info('Product not found on server; removed from the list');
            return;
          }

          // Otherwise, show a clear error to the admin, but do NOT remove from local state.
          toast.error('Failed to delete CvSU entry. Attempting fallback delete on the product record.');
          // Continue to fallback to product-level delete below
        }
      }

      // If the item is a product row (or fallback), attempt to find an associated cvsu row and delete that instead
      const associatedCvSU = products.find((p: any) => String(p.product_id) === String(idStr));
      if (associatedCvSU && associatedCvSU.id) {
        try {
          console.debug('handleDeleteProduct: deleting associated CvSU row', { id: associatedCvSU.id, product_id: idStr, hard: permanently });
          const deleted = await deleteCvSUProduct(associatedCvSU.id, permanently);
          console.debug('handleDeleteProduct: deleteCvSUProduct returned', { id: associatedCvSU.id, deleted });
          setProducts((prev) => prev.filter((p) => String(p.id) !== String(associatedCvSU.id) && String(p.id) !== idStr));
          toast.success('Product deleted (CvSU entry removed)');

          (async () => {
            try {
              const fresh = await getCvSUProducts();
              if (Array.isArray(fresh)) {
                const mapped = (fresh as any[]).map(r => ({
                  id: r.id,
                  product_id: r.product_id || null,
                  title: r.title || r.name,
                  description: r.description || r.title || r.name,
                  images: r.images || [],
                  category: getCategoryName(r) || r.category || null,
                  seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
                }));
                setProducts(mapped);
              }
            } catch (err) {
              console.warn('Refetch after delete failed', err);
            }
          })();

          return;
        } catch (e) {
          console.error('Associated cvsu delete failed, falling back to product-level delete', e);
          toast.error('Failed to delete associated CvSU entry; attempting product-level delete');
        }
      }

      // Fallback: try deleting a possible CvSU row matching this product id (server-side lookup by product_id)
      try {
        // First, try deleting any CvSU row referencing this id (accepts numeric id or product_id)
        const cvsuDeleteResult = await deleteCvSUProduct(idStr, permanently);

        if (cvsuDeleteResult) {
          // Deleted the CvSU row that referenced this product — now refresh canonical list and finish
          try {
            const fresh = await getCvSUProducts();
            if (Array.isArray(fresh)) {
              const mapped = (fresh as any[]).map(r => ({
                id: r.id,
                product_id: r.product_id || null,
                title: r.title || r.name,
                description: r.description || r.title || r.name,
                images: r.images || [],
                category: getCategoryName(r) || r.category || null,
                seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
              }));
              setProducts(mapped);
            }
          } catch (err) {
            console.warn('Refetch after delete failed', err);
          }

          toast.success('Product deleted (CvSU entry removed)');
          return;
        }

        // If there was no CvSU row for this id, delete the product record directly
        console.debug('handleDeleteProduct: calling product-level delete RPC', { id: idStr });
        const { deleteProductById } = await import('../lib/services/products');
        const result = await deleteProductById(idStr, permanently);
        console.debug('handleDeleteProduct: deleteProductById returned', { id: idStr, result });

        // If product RPC indicates the product was already deleted or did not exist, refresh and remove locally
        if (!(result as any).ok && (result as any).reason === 'not_found') {
          try {
            const fresh = await getCvSUProducts();
            if (Array.isArray(fresh)) {
              const mapped = (fresh as any[]).map(r => ({
                id: r.id,
                product_id: r.product_id || null,
                title: r.title || r.name,
                description: r.description || r.title || r.name,
                images: r.images || [],
                category: getCategoryName(r) || r.category || null,
                seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
              }));
              setProducts(mapped);
            }
          } catch (err) {
            console.warn('Refetch after delete failed', err);
          }

          toast.success('Product removed (was already deleted)');
          return;
        }

        // Product deleted successfully — ensure there is no lingering CvSU row (this may exist if RLS prevents deletion earlier)
        try {
          const cvsuAfter = await deleteCvSUProduct(idStr, permanently);
          if (cvsuAfter) {
            // We deleted a matching cvsu row as well — refresh canonical list
            const fresh = await getCvSUProducts();
            if (Array.isArray(fresh)) {
              const mapped = (fresh as any[]).map(r => ({
                id: r.id,
                product_id: r.product_id || null,
                title: r.title || r.name,
                description: r.description || r.title || r.name,
                images: r.images || [],
                category: getCategoryName(r) || r.category || null,
                seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
              }));
              setProducts(mapped);
            }

            toast.success('Product deleted (CvSU entry removed)');
            return;
          }

          // If no CvSU existed, product deletion is complete — refresh and remove locally
          try {
            const fresh = await getCvSUProducts();
            if (Array.isArray(fresh)) {
              const mapped = (fresh as any[]).map(r => ({
                id: r.id,
                product_id: r.product_id || null,
                title: r.title || r.name,
                description: r.description || r.title || r.name,
                images: r.images || [],
                category: (r.category && (r.category.name || r.category)) || r.category || null,
                seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
              }));
              setProducts(mapped);
            }
          } catch (err) {
            console.warn('Refetch after delete failed', err);
          }

          toast.success('Product deleted');
          return;
        } catch (e: any) {
          // CVSU cleanup failed — this means the product row was deleted but the cvsu listing remains (likely RLS)
          console.error('Product deleted but failed to delete CvSU listing', { id: idStr, error: e?.message || e });
          if (String(e?.message || '').toLowerCase().includes('not permitted') || e?.status === 403) {
            toast.error('Product deleted but the CvSU listing could not be removed due to permissions. Please use admin RPC or adjust RLS policies.');
            // Refresh canonical list to show the lingering cvsu row
            try {
              const fresh = await getCvSUProducts();
              if (Array.isArray(fresh)) {
                const mapped = (fresh as any[]).map(r => ({
                  id: r.id,
                  product_id: r.product_id || null,
                  title: r.title || r.name,
                  description: r.description || r.title || r.name,
                  images: r.images || [],
                  category: getCategoryName(r) || r.category || null,
                  seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
                }));
                setProducts(mapped);
              }
            } catch (err) {
              console.warn('Refetch after failed cleanup', err);
            }

            return;
          }

          // Other errors: show generic message and refresh list to reflect actual DB state
          toast.error(e?.message || 'Product deleted but failed to ensure CvSU listing removal. Please refresh and check.');
          try {
            const fresh = await getCvSUProducts();
            if (Array.isArray(fresh)) {
              const mapped = (fresh as any[]).map(r => ({
                id: r.id,
                product_id: r.product_id || null,
                title: r.title || r.name,
                description: r.description || r.title || r.name,
                images: r.images || [],
                category: getCategoryName(r) || r.category || null,
                seller: r.seller || { id: 'marketing-office', username: 'CvSU Marketing Office', avatar_url: null, credit_score: 0, is_trusted_member: false },
              }));
              setProducts(mapped);
            }
          } catch (err) {
            console.warn('Refetch after delete+cleanup failure failed', err);
          }

          return;
        }
      } catch (e: any) {
        // Any error here indicates a problem (permissions, malformed id, server error). Do NOT remove item locally.
        console.error('Product-level delete failed', { id: idStr, error: e?.message || e });
        const msg = String(e?.message || '');
        if (msg.toLowerCase().includes('not permitted') || (e?.status === 403) || (typeof msg === 'string' && msg.toLowerCase().includes('permission'))) {
          toast.error('You do not have permission to delete this product. Ensure you are signed in as an admin.');
          return;
        }

        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('malformed')) {
          toast.error('Failed to delete product: invalid identifier. Please refresh and try again.');
          return;
        }

        // Generic fallback message
        toast.error(msg || 'Failed to delete product. Please try again or contact support.');
      }
    } catch (e: any) {
      console.error('Failed to delete product', e);

      const msg = e?.message || '';

      // Handle permission errors
      if (typeof msg === 'string' && msg.includes('not permitted')) {
        toast.error('You are not permitted to delete this product. Ensure you are the product owner or an admin.');
        return;
      }

      // Invalid identifier
      if (typeof msg === 'string' && msg.toLowerCase().includes('invalid product id')) {
        toast.error('Cannot delete product: invalid product identifier. Please refresh the list or contact support.');
        return;
      }

      // Handle RPC 'product not found' gracefully: remove local UI entry and show a neutral toast
      if (e?.code === 'P0001' || (typeof msg === 'string' && (msg.toLowerCase().includes('product not found') || msg.toLowerCase().includes('could not be delete')))) {
        setProducts((prev) => prev.filter((p) => String(p.id) !== idStr && String(p.product_id) !== idStr));
        toast('Product not found on server; it has been removed from the list');
        return;
      }

      // Fallback: show error message
      toast.error(msg || 'Failed to delete product');
    } finally {
      // Always clear deleting mark for this id (best-effort)
      try { removeDeletingId(idStr); } catch (_) {}
    }
  };

  // Default product click handler: dispatch a global event so the App can open product detail if desired
  const onProductClick = (product: CvSUProduct) => {
    try {
      window.dispatchEvent(new CustomEvent('iskomarket:product-selected', { detail: product }));
    } catch (e) {
      // Fallback no-op
      console.debug('onProductClick dispatch failed', e);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero Section - Premium Enhanced Banner */}
      <div
        className="rounded-[28px] p-4 sm:p-5 relative overflow-hidden group transition-all duration-300"
        style={{
          cursor: "default",
        }}
      >
        {/* Dark Mode Background - Enhanced Premium */}
        <div
          className="absolute inset-0 dark:opacity-100 opacity-0 transition-all duration-300"
          style={{
            background:
              "linear-gradient(135deg, #0c251b 0%, #092017 100%)",
            borderRadius: "28px",
          }}
        />

        {/* Dark Mode Premium Shadow */}
        <div
          className="absolute inset-0 dark:opacity-100 opacity-0 pointer-events-none"
          style={{
            borderRadius: "28px",
            boxShadow:
              "0 8px 28px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(0, 255, 160, 0.08)",
          }}
        />

        {/* Dark Mode Border Glow */}
        <div
          className="absolute inset-0 dark:opacity-100 opacity-0 pointer-events-none"
          style={{
            border: "1px solid rgba(0, 255, 160, 0.12)",
            borderRadius: "28px",
          }}
        />

        {/* Dark Mode Emerald Glow (outer edges) */}
        <div
          className="absolute -inset-[1px] dark:opacity-[0.05] opacity-0 pointer-events-none blur-xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #0c8f4a 0%, transparent 70%)",
            borderRadius: "28px",
          }}
        />

        {/* Dark Mode Gradient Overlay */}
        <div
          className="absolute inset-0 dark:opacity-[0.12] opacity-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #0c251b 0%, #092017 100%)",
            borderRadius: "28px",
          }}
        />

        {/* Dark Mode Noise Texture */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-[0.03] opacity-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
            borderRadius: "28px",
          }}
        />

        {/* Light Mode Background - Premium Glass */}
        <div
          className="absolute inset-0 dark:opacity-0 opacity-100 transition-all duration-300"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(20px)",
            borderRadius: "28px",
          }}
        />

        {/* Light Mode Border */}
        <div
          className="absolute inset-0 dark:opacity-0 opacity-100 pointer-events-none"
          style={{
            border: "1px solid rgba(0, 120, 60, 0.15)",
            borderRadius: "28px",
          }}
        />

        {/* Light Mode Premium Shadow */}
        <div
          className="absolute inset-0 dark:opacity-0 opacity-100 pointer-events-none transition-all duration-300 group-hover:opacity-100"
          style={{
            borderRadius: "28px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
          }}
        />

        {/* Light Mode Subtle Gradient Overlay */}
        <div
          className="absolute inset-0 dark:opacity-0 opacity-[0.08] pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #dff3e6 0%, #f8fcfa 100%)",
            borderRadius: "28px",
          }}
        />

        {/* Light Mode Noise Texture */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
            borderRadius: "28px",
          }}
        />

        {/* Light Mode Ambient Emerald Glow */}
        <div
          className="absolute -inset-[2px] dark:opacity-0 opacity-[0.07] pointer-events-none blur-2xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #99e5c2 0%, transparent 60%)",
            borderRadius: "28px",
          }}
        />

        {/* Light Mode Vignette */}
        <div
          className="absolute inset-0 dark:opacity-0 opacity-100 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(0, 120, 60, 0.02) 100%)",
            borderRadius: "28px",
          }}
        />

        <div className="relative z-10">
          <h1
            className="dark:text-[#DFFFEA] text-[#0A5C33] transition-all duration-300"
            style={{
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
              letterSpacing: "0.01em",
            }}
          >
            CvSU Market
          </h1>
          <p className="text-xs sm:text-sm dark:text-[#8BB7A3] text-[#6f7f74] transition-all duration-300">
            Official merchandise from CvSU Marketing Office
          </p>
        </div>

        {/* Dark Mode Title Glow Effect */}
        <div
          className="absolute top-4 sm:top-5 left-4 sm:left-5 dark:opacity-[0.06] opacity-0 pointer-events-none blur-lg"
          style={{
            color: "#0c8f4a",
            zIndex: 5,
          }}
        >
          <h1>CvSU Market</h1>
        </div>

        {/* Light Mode Title Glow Effect */}
        <div
          className="absolute top-4 sm:top-5 left-4 sm:left-5 dark:opacity-0 opacity-[0.015] pointer-events-none blur-md"
          style={{
            color: "#0c8f4a",
            zIndex: 5,
          }}
        >
          <h1>CvSU Market</h1>
        </div>
      </div>

      {/* Search and Filters - Premium Glass Container */}
      <div
        className="relative p-3 sm:p-4 rounded-xl"
        style={{
          borderRadius: "20px",
        }}
      >
        {/* Dark Mode Glass Background */}
        <div
          className="absolute inset-0 dark:opacity-100 opacity-0 pointer-events-none"
          style={{
            background: "rgba(0, 18, 28, 0.55)",
            border: "1px solid rgba(0, 255, 150, 0.12)",
            borderRadius: "20px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 20px rgba(0, 255, 150, 0.08)",
          }}
        />
        {/* Light Mode Glass Background */}
        <div
          className="absolute inset-0 dark:opacity-0 opacity-100 pointer-events-none"
          style={{
            background: "rgba(255, 255, 255, 0.55)",
            border: "1px solid rgba(0, 120, 60, 0.12)",
            borderRadius: "20px",
            backdropFilter: "blur(14px)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          }}
        />
        {/* Noise Texture - Dark */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-[0.04] opacity-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
            borderRadius: "20px",
          }}
        />
        {/* Noise Texture - Light */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
            borderRadius: "20px",
          }}
        />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Bar with Proceed Button */}
            <div className="flex-1 relative">
              <label htmlFor="market-search" className="sr-only">Search products</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-[#A6D5C0] text-muted-foreground z-10 search-icon-glow" />
              <Input
                id="market-search"
                aria-label="Search products"
                placeholder="Search for uniforms, books, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery) {
                    e.preventDefault();
                  }
                }}
                className="pl-10 pr-12 h-12 rounded-xl dark:bg-[var(--card)]/60 dark:border-[rgba(0, 255, 150, 0.18)] dark:focus:border-[rgba(0, 255, 160, 0.35)] dark:text-[#E9FFF4] dark:placeholder:text-[#A6D5C0]/50 bg-[var(--surface-soft)]/60 border-[rgba(0, 120, 60, 0.15)] focus:border-[rgba(0, 160, 80, 0.3)] text-base"
                style={{
                  boxShadow:
                    "inset 0 1px 3px rgba(0, 0, 0, 0.08)",
                  transition: "all 160ms ease-out",
                }}
              />
              {/* Proceed Button */}
              <button
                onClick={() => {
                  if (searchQuery) {
                    // no-op: debounced search auto-applies
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 dark:bg-[#00C87D]/20 bg-[#0A6E3A]/10 dark:hover:bg-[#00C87D]/30 hover:bg-[#0A6E3A]/20 group"
                disabled={!searchQuery}
                style={{
                  opacity: searchQuery ? 1 : 0.4,
                  cursor: searchQuery
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                <ArrowRight className="h-4 w-4 dark:text-[#C7FFE5] text-[#0A6E3A] group-hover:translate-x-0.5 transition-transform" />
              </button>
              <style>
                {`
                  .search-icon-glow {
                    filter: drop-shadow(0px 0px 0px rgba(0, 200, 125, 0));
                    transition: filter 0.3s ease;
                  }
                  input:focus ~ .search-icon-glow,
                  input:focus-visible ~ .search-icon-glow {
                    filter: drop-shadow(0px 0px 8px rgba(0, 200, 125, 0.35)) !important;
                  }
                `}
              </style>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-48 rounded-xl transition-all duration-300 dark:bg-[var(--card)]/60 dark:border-[rgba(0, 255, 150, 0.18)] dark:text-[#C7FFD9] dark:hover:bg-[rgba(0, 255, 150, 0.08)] bg-[var(--surface-soft)]/60 border-[rgba(0, 120, 60, 0.15)] hover:bg-[rgba(0, 160, 80, 0.05)]">
                  <SelectValue>
                    {selectedCategory === "all"
                      ? "All Categories"
                      : selectedCategory}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border shadow-lg">
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="rounded-lg cursor-pointer transition-all duration-300 dark:hover:bg-[rgba(0, 255, 150, 0.08)] hover:bg-[#e6f4ea]"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>
                          {category === "all"
                            ? "All Categories"
                            : category}
                        </span>

                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Admin-only Add button (replaces previous Clear button) */}
              {isAdmin ? (
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  className="h-10 w-10 rounded-full bg-[var(--surface-soft)] dark:bg-[var(--card)] text-[#0A8F46] border border-[rgba(0,128,40,0.12)] shadow-sm flex items-center justify-center"
                  aria-label="Add product"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : (
                // Keep layout stable when not admin: small spacer to align controls
                <div style={{ width: 44 }} />
              )}
            </div>
          </div>

          {/* Information Bar - Premium Light-Mode Green Glass Chip */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* CvSU Marketing Office Button - Light-Green Glass Chip */}
            <button
              onClick={() => setShowOfficeInfo(true)}
              className="flex-1 sm:flex-initial h-11 gap-2 rounded-full flex items-center justify-center relative overflow-hidden group transition-all duration-160"
              style={{
                transition: "all 160ms ease-out",
              }}
            >
              {/* Dark Mode Background */}
              <div
                className="absolute inset-0 dark:opacity-100 opacity-0"
                style={{
                  background:
                    "linear-gradient(135deg, #0A5A32 0%, #064B2C 100%)",
                  borderRadius: "9999px",
                }}
              />
              {/* Light Mode Background - Premium Light-Green Glass */}
              <div
                className="absolute inset-0 dark:opacity-0 opacity-100 group-hover:shadow-[0_0_16px_rgba(0,160,60,0.22)]"
                style={{
                  background:
                    "linear-gradient(135deg, #E7FBE9 0%, #D4F4D6 100%)",
                  border: "1px solid rgba(0, 120, 40, 0.22)",
                  borderRadius: "9999px",
                  backdropFilter: "blur(12px)",
                  transition: "all 160ms ease-out",
                }}
              />
              <div className="relative z-10 flex items-center gap-2 px-4">
                <Building2 className="h-4 w-4 dark:text-white text-[#0A5C2E]" />
                <span className="dark:text-white text-[#0A5C2E]">
                  CvSU Marketing Office
                </span>
              </div>
            </button>

            {/* Uniform Sizes Button */}
            <Button
              onClick={() => setShowUniformSizes(true)}
              variant="outline"
              className="flex-1 sm:flex-initial h-11 gap-2 rounded-full dark:border-[rgba(0, 255, 150, 0.18)] dark:text-[#C7FFD9] dark:hover:bg-[rgba(0, 255, 150, 0.08)] dark:hover:shadow-[0_0_16px_rgba(0, 255, 160, 0.15)] border-[rgba(0, 120, 60, 0.2)] text-[#0A6633] hover:bg-[rgba(0, 160, 80, 0.05)]"
              style={{ transition: "all 160ms ease-out" }}
            >
              <Ruler className="h-4 w-4" />
              Uniform Sizes
            </Button>
          </div>
        </div>
      </div>

      {/* Empty state handling */}
      {filteredProducts.length === 0 ? (
        <div className="col-span-full">
          {products.length === 0 ? (
            <EmptyState title="No listings yet" description="There are no products in the marketplace right now." suggestion="Check back later or be the first to post a product." />
          ) : (searchQuery || selectedCategory !== 'all') ? (
            <EmptyState title="No matches" description={noResultsMessage(searchQuery, selectedCategory)} suggestion="Try another keyword or clear filters to see more products." />
          ) : (
            <EmptyState title="No results" description="No products found." suggestion="Try a different keyword or check categories." />
          )}
        </div>
      ) : (
        <div className="col-span-full">
          {/* Horizontal scroll list refined to match Figma: larger cards, soft shadows, top-left category badge, bottom-right floating admin buttons */}
          <div className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uniqueFilteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer rounded-xl shadow-md border border-[rgba(0,128,40,0.06)] overflow-hidden" onClick={() => onProductClick(product)}>
                <div className="relative w-full flex-shrink-0 overflow-hidden bg-muted" style={{ borderRadius: '12px', aspectRatio: '1', height: 'auto' }}>
                  <ImageWithFallback src={(product.images && product.images[0]) || '/placeholder.png'} alt={product.title || product.name} className="w-full h-full object-cover" />

                  {/* Gradient overlay for title/category */}
                  <div className="absolute left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="text-sm font-semibold text-white truncate">
                      {/* Highlight simple match in title when searching */}
                      {(() => {
                        const t = product.title || product.name || '';
                        const highlighted = highlightMatch(t, searchQuery as string);
                        if (typeof highlighted === 'string') return highlighted;
                        return (<>{highlighted.before}<mark className="bg-yellow-300 text-black px-0 py-0">{highlighted.match}</mark>{highlighted.after}</>);
                      })()}
                    </div>
                  </div>

                  {/* Category badge top-left */}
                  <div className="absolute top-3 left-3 bg-[var(--surface-soft)] dark:bg-[var(--card)]/90 text-[11px] text-[#0A6E3A] px-2 py-1 rounded-full border border-[rgba(0,128,40,0.08)] shadow-[0_6px_12px_rgba(0,0,0,0.06)]">
                    {(product.category && (product.category.name || product.category)) || 'CvSU'}
                  </div>

                  {/* Admin floating actions — bottom-right (inside card) */}
                  {isAdmin && (
                    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                        aria-label="Edit product"
                        className="h-9 w-9 rounded-full bg-[#0A8F46] text-white shadow-md flex items-center justify-center border border-[rgba(0,128,40,0.12)]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product); }}
                        aria-label="Delete product"
                        disabled={deletingIds.has(String(product.id) || String(product.product_id || ''))}
                        className={`h-9 w-9 rounded-full ${deletingIds.has(String(product.id) || String(product.product_id || '')) ? 'bg-yellow-400 cursor-wait' : 'bg-red-500'} text-white shadow-md flex items-center justify-center border border-[rgba(0,0,0,0.06)]`}
                      >
                        {deletingIds.has(String(product.id) || String(product.product_id || '')) ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
        </div>
      )}



      {/* Edit Product Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="modal-standard !w-[500px]" aria-describedby={editModalDescId}>
            <DialogHeader className="modal-header-standard">
              <DialogTitle>{isAddMode ? 'Add Product' : 'Edit Product'}</DialogTitle>
              <DialogDescription className="sr-only">{isAddMode ? 'Use this form to add a product. Fields marked with an asterisk are required.' : 'Use this form to edit a product. Fields marked with an asterisk are required.'}</DialogDescription>
            </DialogHeader>

            {/* Stable hidden description element to satisfy accessibility checks even if DialogDescription momentarily isn't present */}
            <div id={editModalDescId} className="sr-only">{isAddMode ? 'Use this form to add a product. Fields marked with an asterisk are required.' : 'Use this form to edit a product. Fields marked with an asterisk are required.'}</div>

            <div className="modal-content-standard">
              {/* Top image preview (reduced height for better layout) */}
              <div className="w-full h-40 bg-muted rounded-lg overflow-hidden relative">
                <ImageWithFallback
                  src={
                    // priority: previewUrl → imageUrlInput → existing product images → placeholder
                    previewUrl || imageUrlInput || (editingProduct?.images && editingProduct.images[0]) || editingProduct?.image || '/placeholder.png'
                  }
                  alt={editingProduct?.title || editingProduct?.name || 'Image'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium mb-1">Product Name *</Label>
                  <Input
                    id="name"
                    className="rounded-xl h-10"
                    value={editingProduct?.title || editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct((prev) => ({ ...(prev || {}), title: e.target.value, name: e.target.value }))}
                    placeholder="e.g., CvSU Polo Uniform"
                  />
                </div>

                {/* Note: description intentionally omitted per requirement */}

                <div>
                  <Label htmlFor="category" className="text-sm font-medium mb-1">Category *</Label>
                  <Select
                    value={(editingProduct?.category && (editingProduct?.category.name || editingProduct?.category)) || 'CvSU Uniforms'}
                    onValueChange={(v) => setEditingProduct((prev) => ({ ...(prev || {}), category: v }))}
                  >
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border shadow-lg">
                      {categories.filter(c => c !== 'all').map((category) => (
                        <SelectItem key={category} value={category} className="rounded-lg cursor-pointer">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-1">Upload Image</Label>
                  <div className="mt-2">
                    <input
                      aria-label="Choose image file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                    />
                    {isUploading && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-gray-500 mt-1">Uploading images... {uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="imageUrl" className="text-sm font-medium mb-1">Image URL</Label>
                  <Input id="imageUrl" className="rounded-xl h-10" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="https://example.com/image.jpg" />
                </div>
              </div>

              <div className="modal-footer-standard">
                <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingProduct(null); setSelectedFiles([]); setImageUrlInput(''); setIsAddMode(false); setUploadProgress(0); setIsUploading(false); }}>Cancel</Button>
                <Button disabled={isUploading || (!(editingProduct?.title || editingProduct?.name))} onClick={handleSaveProduct}><Save className="h-4 w-4 mr-2" />Save</Button>
              </div>
            </div>
          </DialogContent>
      </Dialog>

      {/* Uniform Sizes Modal */}
      <Dialog
        open={showUniformSizes}
        onOpenChange={setShowUniformSizes}
      >
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          aria-describedby={uniformModalDescId}
        >
          <DialogHeader>
            <DialogTitle>Uniform Sizes & Prices</DialogTitle>
            <DialogDescription className="sr-only">Table of available uniform sizes and their prices.</DialogDescription>
          </DialogHeader>

          <div id={uniformModalDescId} className="sr-only">Table of available uniform sizes and their prices.</div>

          <div className="overflow-y-auto flex-1 pr-2">
            <div className="space-y-6 py-4">
              {/* PE T-SHIRT & SHORT */}
              <div>
                <h3 className="font-medium mb-3">
                  PE T-SHIRT & SHORT
                </h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 text-sm">
                          Size
                        </th>
                        <th className="text-right p-3 text-sm">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">
                          XS - Large
                        </td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱270.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">XLarge</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱275.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">2XLarge</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱290.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">3XLarge</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱300.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">4XLarge</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱315.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">5XLarge</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱325.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">6XLarge</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱340.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* POLO */}
              <div>
                <h3 className="font-medium mb-3">POLO</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 text-sm">
                          Size
                        </th>
                        <th className="text-right p-3 text-sm">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">XS</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱315.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">S</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱335.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">M</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱350.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">L</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱370.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱390.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">2XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱410.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">3XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱425.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PANTS */}
              <div>
                <h3 className="font-medium mb-3">PANTS</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 text-sm">
                          Size
                        </th>
                        <th className="text-right p-3 text-sm">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">32</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱500.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">33</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱500.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">34</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱500.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">36</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱500.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BLOUSE */}
              <div>
                <h3 className="font-medium mb-3">BLOUSE</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 text-sm">
                          Size
                        </th>
                        <th className="text-right p-3 text-sm">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">XS</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱320.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">S</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱340.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">M</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱360.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">L</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱375.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱400.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">2XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱415.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">3XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱435.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">4XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱450.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">5XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱470.00
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-sm">6XL</td>
                        <td className="text-right p-3 text-sm text-green-600">
                          ₱490.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t border-border">
            <Button
              onClick={() => setShowUniformSizes(false)}
              className="px-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent
          className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        >
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription className="sr-only">Confirm deletion of the selected product. This action can be undone only by restoring it in the database.</DialogDescription>
          </DialogHeader>

          {deleteConfirmId !== null && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={
                    products.find(
                      (p) => p.id === deleteConfirmId,
                    )?.name || ""
                  }
                  readOnly
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setDeleteConfirmId(null)}
                  variant="outline"
                  className="flex-1"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleDeleteProduct(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CvSU Marketing Office Information Modal */}
      <Dialog
        open={showOfficeInfo}
        onOpenChange={setShowOfficeInfo}
      >
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          aria-describedby={officeModalDescId}
        >
          <DialogHeader>
            <DialogTitle>CvSU Marketing Office</DialogTitle>
            <DialogDescription className="sr-only">Details for the CvSU Marketing Office including location and hours.</DialogDescription>
          </DialogHeader>

          <div id={officeModalDescId} className="sr-only">Details for the CvSU Marketing Office including location and hours.</div>

          <div className="overflow-y-auto flex-1 pr-2">
            <div className="space-y-6 py-4">
              {/* Office Description */}

              {/* Location */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
                </h3>
                <p className="text-sm text-muted-foreground pl-6">
                  International House 2<br />
                  Cavite State University - Indang Campus
                  <br />
                  Indang, Cavite 4122
                </p>
              </div>

              {/* Office Hours */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  Office Hours
                </h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="p-3 text-sm font-medium">
                          Monday - Thursday
                        </td>
                        <td className="p-3 text-sm text-right">
                          8:00 AM - 5:00 PM
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t border-border">
            <Button
              onClick={() => setShowOfficeInfo(false)}
              className="px-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}