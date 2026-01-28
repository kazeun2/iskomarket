/*
  Usage: node scripts/repair_product_images.js
  Requires environment variables:
    - SUPABASE_URL
    - SUPABASE_SERVICE_KEY (admin key to create signed URLs and update rows)

  This script scans products and attempts to repair missing product images by creating signed URLs
  for storage objects in the `product-images` bucket when the public URL returns non-200.
  It updates the product row to use the signed URL (temporary fix). Use this as an admin tool; the
  correct long-term fix is to make the bucket public or re-host missing images.
*/
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function extractFilePathFromUrl(url) {
  try {
    const u = new URL(url);
    // Look for product-images path
    const idx = u.pathname.indexOf('/product-images/');
    if (idx !== -1) return decodeURIComponent(u.pathname.substring(idx + '/product-images/'.length));
    // Fallback: try to match product-images/ in the full URL
    const m = url.match(/product-images\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch (e) {
    const m = url.match(/product-images\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }
}

(async function main() {
  try {
    const { data: rows, error } = await supabase.from('products').select('id, title, images').order('created_at', { ascending: false }).limit(2000);
    if (error) throw error;
    if (!rows || rows.length === 0) {
      console.log('No products found');
      return;
    }

    const problematic = [];

    for (const p of rows) {
      const imgs = p.images || [];
      let changed = false;
      const newImgs = [];
      for (const img of imgs) {
        if (!img || typeof img !== 'string') {
          newImgs.push(img);
          continue;
        }

        // If it's a placeholder, skip
        if (img.includes('/placeholder.png') || img.startsWith('data:')) {
          newImgs.push(img);
          continue;
        }

        // Try to fetch the image
        try {
          const res = await fetch(img, { method: 'HEAD' });
          if (res && res.status === 200) {
            newImgs.push(img);
            continue;
          }
        } catch (e) {
          // ignore
        }

        // Try to create a signed url for this storage object
        const filePath = extractFilePathFromUrl(img);
        if (filePath) {
          try {
            const { data: signedData, error: signErr } = await supabase.storage.from('product-images').createSignedUrl(filePath, 60 * 60 * 24 * 7);
            if (!signErr && signedData && signedData.signedUrl) {
              newImgs.push(signedData.signedUrl);
              changed = true;
              console.log(`Repaired image for product ${p.id} (${p.title || ''}): ${filePath}`);
              continue;
            }
          } catch (e) {
            // ignore
          }
        }

        // Nothing worked - push original
        newImgs.push(img);
        problematic.push({ id: p.id, title: p.title, image: img });
      }

      if (changed) {
        const { data: updated, error: upErr } = await supabase.from('products').update({ images: newImgs }).eq('id', p.id).select('id, images').single();
        if (upErr) {
          console.error('Failed to update product', p.id, upErr);
        } else {
          console.log('Updated product', p.id);
        }
      }
    }

    if (problematic.length > 0) {
      console.log('Products with unrepaired images (inspect manually):', problematic.slice(0, 20));
    } else {
      console.log('No unrepaired product images found.');
    }

    console.log('Repair script finished. Consider making the product-images bucket public for long-term fix.');
  } catch (err) {
    console.error('Error scanning/repairing product images:', err.message || err);
    process.exit(1);
  }
})();
