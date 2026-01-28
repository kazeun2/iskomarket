/*
  Usage: node scripts/cleanup_product_images.js
  Requires environment variables:
    - SUPABASE_URL
    - SUPABASE_SERVICE_KEY (admin key to update rows)

  This script finds product rows where image URLs are ephemeral (blob:, file:, filesystem:) and replaces them with '/placeholder.png'.
*/
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

(async function main() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, images')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('No products found');
      return;
    }

    const candidates = data.filter(p => {
      const imgs = p.images || [];
      return imgs.some(src => typeof src === 'string' && (src.startsWith('blob:') || src.startsWith('file:') || src.startsWith('filesystem:')));
    });

    if (candidates.length === 0) {
      console.log('No products with ephemeral image URLs found');
      return;
    }

    console.log(`Found ${candidates.length} product(s) with ephemeral image URLs. Updating to placeholders...`);

    for (const p of candidates) {
      const old = p.images || [];
      const cleaned = old.map(src => (typeof src === 'string' && (src.startsWith('blob:') || src.startsWith('file:') || src.startsWith('filesystem:')) ? '/placeholder.png' : src));
      const { data: updated, error: upErr } = await supabase.from('products').update({ images: cleaned }).eq('id', p.id).select('id, images').single();
      if (upErr) {
        console.error('Failed to update product', p.id, upErr);
      } else {
        console.log('Updated product', p.id, 'title:', p.title || '<no title>');
      }
    }

    console.log('Cleanup complete. Consider running additional checks for other ephemeral URLs.');
  } catch (err) {
    console.error('Error while cleaning up product images:', err.message || err);
    process.exit(1);
  }
})();