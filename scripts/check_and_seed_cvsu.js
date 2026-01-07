/*
  Check and seed script for CvSU categories & products
  Usage: set env vars and run `node scripts/check_and_seed_cvsu.js`

  Required env vars for reads:
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY  (recommended)

  Optional env vars for writes:
    - TEST_POSTER_EMAIL
    - TEST_POSTER_PASSWORD
    - SUPABASE_SERVICE_ROLE_KEY (admin fallback for creating category/product)

  The script will:
    1) list categories with name ilike 'CvSU%'
    2) list visible products in those categories
    3) if none exist, create a category 'CvSU Uniforms' (if missing) and seed a test product
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL in env');
  process.exit(1);
}

const anonClient = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }) : null;
const adminClient = SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } }) : null;

async function getCvSUCategories(client) {
  const { data, error } = await client.from('categories').select('id, name').ilike('name', 'CvSU%');
  if (error) throw error;
  return data || [];
}

async function getCvSUProducts(client, catIds) {
  const { data, error } = await client.from('products')
    .select('*')
    .in('category_id', catIds)
    .eq('is_sold', false)
    .eq('is_hidden', false)
    .eq('is_deleted', false)
    .or('is_available.eq.true,is_available.is.null')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

async function createCategory(client, name) {
  const { data, error } = await client.from('categories').insert({ name }).select('id, name').single();
  if (error) throw error;
  return data;
}

async function signInClient(email, password) {
  if (!anonClient) return null;
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Sign-in failed:', error);
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

async function createTestProductAsUser(client, title, categoryId) {
  const payload = {
    title,
    description: 'Test CvSU product created by scripts/check_and_seed_cvsu.js',
    price: 1,
    category_id: categoryId,
    condition: 'Good',
    location: 'CvSU Campus',
    images: ['/placeholder.png'],
    is_available: true,
    is_deleted: false,
    is_hidden: false,
  };

  const { data, error } = await client.from('products').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

async function main() {
  try {
    console.log('Using SUPABASE_URL:', SUPABASE_URL.slice(0, 32) + '...');

    // Prefer anon client for reads if available
    const reader = anonClient || adminClient;
    if (!reader) {
      console.error('No anon key or service role key available for reads. Provide VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    // 1) Find CvSU categories
    console.log('Fetching categories with name like CvSU%...');
    const cats = await getCvSUCategories(reader);
    console.log(`Found ${cats.length} CvSU categories`);
    if (cats.length) console.log('Categories:', cats.map(c => ({ id: c.id, name: c.name })));

    // 2) If categories exist, fetch products
    let catIds = cats.map(c => c.id).filter(Boolean);

    if (catIds.length === 0) {
      console.log('No CvSU categories found. Attempting to create one if admin credentials available...');
      if (!adminClient) {
        console.warn('No admin client (service role) available — cannot create category automatically. You can create a category named "CvSU Uniforms" in the dashboard or provide SUPABASE_SERVICE_ROLE_KEY.');
      } else {
        try {
          const created = await createCategory(adminClient, 'CvSU Uniforms');
          console.log('Created category:', created);
          catIds.push(created.id);
        } catch (e) {
          console.error('Failed to create category with admin client:', e.message || e);
        }
      }
    }

    // Fetch products
    if (catIds.length > 0) {
      console.log('Checking for CvSU products in categories', catIds.slice(0,5));
      const prods = await getCvSUProducts(reader, catIds);
      console.log(`Found ${prods.length} CvSU products`);
      if (prods.length > 0) {
        console.log('Sample products:', prods.slice(0,5).map(p => ({ id: p.id, title: p.title || p.name, seller_id: p.seller_id, price: p.price })));

        // Even if there are some CvSU products, ensure the featured static products exist
        let staticProductsInner = [];
        try {
          staticProductsInner = require('../src/data/staticProducts').products;
        } catch (e) {
          staticProductsInner = [
            { id: 101, title: 'CvSU Polo Uniform', description: 'Official CvSU white polo with embroidered logo', category: 'CvSU Uniforms', images: ['https://tse4.mm.bing.net/th/id/OIP.-oHmAgKavCEdbqiCk0tI8QHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3'], price: 450 },
            { id: 102, title: 'CvSU PE Shirt', description: 'Official green PE shirt with CvSU branding', category: 'PE Apparel', images: ['https://tse1.mm.bing.net/th/id/OIP.KH34IjuDWnnlzlmGovN2-AHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3'], price: 350 },
            { id: 103, title: 'CvSU Student Handbook', description: 'Official student handbook 2025 edition', category: 'Books & Modules', images: ['https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NTk5NDc4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080'], price: 150 },
            { id: 104, title: 'CvSU Official Lanyard', description: 'Green lanyard with official CvSU logo', category: 'Accessories', images: ['https://images.unsplash.com/photo-1658722452255-44276f94e098?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW55YXJkJTIwaWQlMjBob2xkZXJ8ZW58MXx8fHwxNzYwMDIzODA1fDA&ixlib=rb-4.1.0&q=80&w=1080'], price: 80 },

            { id: 106, title: 'CvSU Notebook', description: 'Official CvSU branded notebook', category: 'Stationery', images: ['https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NTk5NDc4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080'], price: 120 },
            { id: 107, title: 'CvSU PE Shorts', description: 'Official green shorts for PE', category: 'PE Apparel', images: ['https://tse1.mm.bing.net/th/id/OIP.KH34IjuDWnnlzlmGovN2-AHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3'], price: 200 }
          ];
        }
        const featured = (staticProductsInner || []).filter(p => p.id && Number(p.id) >= 100 && p.title && p.category);

        const existingTitles = new Set((prods || []).map(p => ((p.title || p.name) || '').toString().toLowerCase()));
        const missing = featured.filter(f => !existingTitles.has((f.title || f.name).toString().toLowerCase()));
        if (missing.length === 0) {
          console.log('Featured products already present. No seeding necessary.');
          return;
        }

        console.log('Found some CvSU products but missing featured items. Will attempt to seed the following:', missing.map(m => m.title));

        // Reuse insertion logic by placing missing into 'featured' variable and continue with insertion flow below
        // We'll set featured to the missing set and fall through to insertion
        var featuredToSeed = missing;

        // Fall through to insertion logic (reusing code below)
      }

      console.log('Proceeding to seed featured products from static data.');

      // 3) Seed featured static products (IDs >= 100)
      let staticProducts = [];
      try {
        staticProducts = require('../src/data/staticProducts').products;
      } catch (e) {
        console.warn('Could not require staticProducts module, falling back to embedded featured list.');
        staticProducts = [
          { id: 101, title: 'CvSU Polo Uniform', description: 'Official CvSU white polo with embroidered logo', category: 'CvSU Uniforms', images: ['https://tse4.mm.bing.net/th/id/OIP.-oHmAgKavCEdbqiCk0tI8QHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3'], price: 450 },
          { id: 102, title: 'CvSU PE Shirt', description: 'Official green PE shirt with CvSU branding', category: 'PE Apparel', images: ['https://tse1.mm.bing.net/th/id/OIP.KH34IjuDWnnlzlmGovN2-AHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3'], price: 350 },
          { id: 103, title: 'CvSU Student Handbook', description: 'Official student handbook 2025 edition', category: 'Books & Modules', images: ['https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NTk5NDc4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080'], price: 150 },
          { id: 104, title: 'CvSU Official Lanyard', description: 'Green lanyard with official CvSU logo', category: 'Accessories', images: ['https://images.unsplash.com/photo-1658722452255-44276f94e098?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW55YXJkJTIwaWQlMjBob2xkZXJ8ZW58MXx8fHwxNzYwMDIzODA1fDA&ixlib=rb-4.1.0&q=80&w=1080'], price: 80 },
          { id: 106, title: 'CvSU Notebook', description: 'Official CvSU branded notebook', category: 'Stationery', images: ['https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NTk5NDc4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080'], price: 120 },
          { id: 107, title: 'CvSU PE Shorts', description: 'Official green shorts for PE', category: 'PE Apparel', images: ['https://tse1.mm.bing.net/th/id/OIP.KH34IjuDWnnlzlmGovN2-AHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3'], price: 200 }
        ];
      }
      const featured = (staticProducts || []).filter(p => p.id && Number(p.id) >= 100 && p.title && p.category);

      // Helper: find or create category by name
      async function ensureCategory(client, name) {
        const { data: found, error: findErr } = await client.from('categories').select('id, name').ilike('name', name).limit(1).maybeSingle();
        if (findErr) return null;
        if (found && found.id) return found.id;

        if (!adminClient) return null;
        try {
          const { data: created, error: createErr } = await adminClient.from('categories').insert({ name }).select('id, name').single();
          if (createErr) {
            console.error('Failed to create category', name, createErr.message || createErr);
            return null;
          }
          return created.id;
        } catch (e) {
          console.error('Exception creating category', name, e.message || e);
          return null;
        }
      }

      // Poster creds (optional)
      const posterEmail = process.env.TEST_POSTER_EMAIL;
      const posterPassword = process.env.TEST_POSTER_PASSWORD;

      // Prefer admin client for bulk insertion
      if (!adminClient && !(posterEmail && posterPassword)) {
        console.error('No admin client or test poster credentials available to insert products. Provide SUPABASE_SERVICE_ROLE_KEY or TEST_POSTER_EMAIL/PASSWORD.');
        return;
      }

      // Determine seller id for admin inserts
      let adminSellerId = null;
      if (adminClient) {
        try {
          // Try 'users' table
          const { data: someUser, error: userErr } = await adminClient.from('users').select('id').limit(1).maybeSingle();
          if (!userErr && someUser && someUser.id) adminSellerId = someUser.id;
        } catch (e) {}

        if (!adminSellerId) {
          try {
            // Try 'profiles' table (if applicable)
            const { data: someProfile, error: profErr } = await adminClient.from('profiles').select('id').limit(1).maybeSingle();
            if (!profErr && someProfile && someProfile.id) adminSellerId = someProfile.id;
          } catch (e) {}
        }

        if (!adminSellerId) {
          const newEmail = process.env.SEED_ADMIN_USER_EMAIL || `cvsu-seed-${Date.now()}@example.com`;
          const newPass = process.env.SEED_ADMIN_USER_PASSWORD || 'Password123!';
          try {
            console.log('Creating a seed user via admin.auth.createUser with email', newEmail);
            const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({ email: newEmail, password: newPass, user_metadata: { username: `cvsu-seed-${Date.now()}` }, email_confirm: true });
            if (createErr) {
              console.error('Admin createUser returned error:', createErr);
            } else {
              // createdUser may be { user: { id: ... } } or { id: ... }
              adminSellerId = createdUser?.user?.id || createdUser?.id || null;
            }
          } catch (e) {
            console.error('Admin createUser failed:', e.message || e);
          }
        }

        // Final attempt: query users by the email used
        if (!adminSellerId) {
          try {
            const emailToFind = process.env.SEED_ADMIN_USER_EMAIL;
            if (emailToFind) {
              const { data: found, error: findErr } = await adminClient.from('users').select('id,email').ilike('email', emailToFind).limit(1).maybeSingle();
              if (!findErr && found && found.id) adminSellerId = found.id;
            }
          } catch (e) {}
        }

        if (!adminSellerId) {
          console.warn('Could not resolve a seller_id for admin insert; admin user not available. Insert attempts may fail due to NOT NULL seller_id constraint.');
        }
      }

      // Fallback seller id: prefer an existing CvSU product's seller_id if available
      const fallbackSellerId = (typeof prods !== 'undefined' && prods && prods.length > 0 && prods[0].seller_id) ? prods[0].seller_id : adminSellerId;
      console.log('Using seller id for inserts: fallbackSellerId=', fallbackSellerId, ' adminSellerId=', adminSellerId);

      // If poster creds provided, try sign-in to create as that user
      let userClient = null;
      if (posterEmail && posterPassword && anonClient) {
        try {
          const { data: signData, error: signErr } = await anonClient.auth.signInWithPassword({ email: posterEmail, password: posterPassword });
          if (!signErr && signData?.user) {
            userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
          }
        } catch (e) {}
      }

      // For each featured product (or only the missing subset), ensure category exists and insert if missing
      const listToSeed = (typeof featuredToSeed !== 'undefined' && Array.isArray(featuredToSeed)) ? featuredToSeed : featured;
      for (const feat of listToSeed) {
        const catName = feat.category;
        let categoryId = null;

        // Try to find category via reader (anonClient) first
        try {
          const { data: found, error: findErr } = await (anonClient || adminClient).from('categories').select('id, name').ilike('name', catName).limit(1).maybeSingle();
          if (!findErr && found && found.id) categoryId = found.id;
        } catch (e) {}

        if (!categoryId) {
          // Prefer inserting featured items under the primary CvSU category when available
          const cvsuPrimary = (catIds && catIds.length) ? catIds[0] : null;
          if (feat.category && feat.category.toString().toLowerCase().includes('cvsu')) {
            categoryId = await ensureCategory(adminClient || anonClient, catName);
          } else if (cvsuPrimary) {
            categoryId = cvsuPrimary;
          } else {
            // Fallback: try to create the original category if no primary found
            categoryId = await ensureCategory(adminClient || anonClient, catName);
          }
        }

        if (!categoryId) {
          console.warn('Could not determine or create category for', feat.title, '— skipping');
          continue;
        }

        // Check if product with same title exists in the expected category
        try {
          const { data: exists, error: existsErr } = await (anonClient || adminClient).from('products').select('id, title, category_id').ilike('title', feat.title).eq('category_id', categoryId).limit(1).maybeSingle();
          if (exists && exists.id) {
            console.log('Product already exists in CvSU category:', feat.title, 'id:', exists.id);
            continue;
          }
        } catch (e) {}

        // If not present in the CvSU category, check globally by title and, if found, move it into CvSU category
        try {
          const { data: globalFound, error: globErr } = await (anonClient || adminClient).from('products').select('id, title, category_id').ilike('title', feat.title).limit(1).maybeSingle();
          if (globalFound && globalFound.id) {
            // If found but in a different category, and we have a CvSU primary category, update it
            const cvsuPrimary = (catIds && catIds.length) ? catIds[0] : null;
            if (cvsuPrimary && globalFound.category_id && globalFound.category_id !== cvsuPrimary) {
              try {
                if (adminClient) {
                  const { data: upd, error: updErr } = await adminClient.from('products').update({ category_id: cvsuPrimary }).eq('id', globalFound.id).select('*').single();
                  if (!updErr) console.log('Moved existing product into CvSU category:', globalFound.title, globalFound.id);
                } else if (userClient) {
                  // Cannot change category as anon user; log and skip
                  console.log('Product exists in non-CvSU category; run admin migration to move it:', globalFound.title, globalFound.id);
                }
              } catch (e) {
                console.error('Failed to move product into CvSU category for', globalFound.title, e.message || e);
              }
            }
            // If it exists globally (regardless of category), skip insertion to avoid duplicates
            console.log('Product already exists (global):', globalFound.title, 'id:', globalFound.id);
            continue;
          }
        } catch (e) {
          // ignore
        }

        // Build payload
        const payload = {
          title: feat.title || feat.name,
          description: feat.description || feat.desc || 'Featured CvSU product',
          price: feat.price || feat.price || 0,
          category_id: categoryId,
          condition: feat.condition || 'Good',
          location: feat.location || 'CvSU Campus',
          images: feat.images && feat.images.length ? feat.images : feat.image ? [feat.image] : ['/placeholder.png'],
          is_available: true,
          is_deleted: false,
          is_hidden: false,
        };

        try {
          let inserted = null;
          if (adminClient) {
            // attach a seller_id so the product has an owner
            if (!payload.seller_id) payload.seller_id = fallbackSellerId || adminSellerId || null;
            console.log('Inserting as adminClient with payload:', payload);
            const { data: d, error: err } = await adminClient.from('products').insert(payload).select('*').single();
            if (err) throw err;
            inserted = d;
          } else if (userClient) {
            console.log('Inserting as userClient with payload:', payload);
            const { data: d, error: err } = await userClient.from('products').insert(payload).select('*').single();
            if (err) throw err;
            inserted = d;
          } else {
            console.warn('No client available to insert product:', feat.title);
          }

          if (inserted && inserted.id) console.log('Inserted featured product:', inserted.title || inserted.name, inserted.id);
        } catch (e) {
          console.error('Failed to insert featured product', feat.title, e.message || e);
        }
      }

      return;

    } else {
      console.log('No CvSU category IDs available - nothing else to do.');
    }

  } catch (e) {
    console.error('Script failed:', e.message || e);
    process.exit(1);
  }
}

main();
