import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

export type ProductLike = any;

export function normalizeForCompare(v: any) {
  if (v === undefined || v === null) return '';
  return String(v).trim().toLowerCase();
}

export function useMarketplaceFilters(products: ProductLike[] = [], opts?: { debounce?: number }) {
  const debounce = opts?.debounce ?? 300;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const debouncedQuery = useDebouncedValue(searchQuery, debounce);

  const filteredProducts = useMemo(() => {
    const q = normalizeForCompare(debouncedQuery);

    const cat = normalizeForCompare(selectedCategory);

    return (products || []).filter((p) => {
      const title = normalizeForCompare(p?.title || p?.name || '');
      const desc = normalizeForCompare(p?.description || '');

      const prodCatRaw = p?.category && (p.category.name || p.category) ? (p.category.name || p.category) : p?.category_id || p?.category || '';
      const prodCat = normalizeForCompare(prodCatRaw);

      const matchesSearch = q === '' || title.includes(q) || desc.includes(q) || prodCat.includes(q);

      const matchesCategory = cat === 'all' || prodCat === cat;

      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedQuery, selectedCategory]);

  useEffect(() => {
    // placeholder for analytics / logging hook
    // trackSearch(searchQuery, selectedCategory, filteredProducts.length);

    // Defensive logging: if a category is selected but results are empty, log potential mismatch
    const cat = normalizeForCompare(selectedCategory);
    if (cat && cat !== 'all' && (products || []).length > 0 && filteredProducts.length === 0) {
      // collect candidate category values from products for debugging
      const prodCats = Array.from(new Set((products || []).map((p: any) => normalizeForCompare(p?.category && (p.category.name || p.category) ? (p.category.name || p.category) : p?.category_id || p?.category || '')))).slice(0, 10);
      console.debug('[useMarketplaceFilters] category filter returned 0 results', { selectedCategory, normalizedCategory: cat, productsCount: (products || []).length, sampleProductCategories: prodCats });
    }
  }, [debouncedQuery, selectedCategory, products, filteredProducts]);

  function highlightMatch(text: string, query: string) {
    try {
      const q = normalizeForCompare(query);
      if (!q) return text;
      const idx = normalizeForCompare(text).indexOf(q);
      if (idx === -1) return text;
      const start = (text.slice(0, idx));
      const match = text.slice(idx, idx + q.length);
      const end = text.slice(idx + q.length);
      return {
        before: start,
        match,
        after: end,
      };
    } catch (e) {
      return text;
    }
  }

  const noResultsMessage = (query: string, category: string) => {
    const q = (query || '').trim();
    const cat = category === 'all' ? 'All Categories' : category;
    if (!q) return `No products found in ${cat}.`;
    return `No products found for "${q}" in ${cat}.`;
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
    highlightMatch,
    noResultsMessage,
  } as const;
}
