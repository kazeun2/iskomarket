import React, { useEffect, useState } from 'react';
import { getUserById, User as ServiceUser } from '../services/userService';
import { getProducts } from '../lib/services/products';
import { SellerProfile } from './SellerProfile';

interface SellerProfileModalProps {
  sellerId?: string | number;
  sellerProfile?: any;
  sellerProducts?: any[];
  onClose: () => void;
  onProductClick?: (product: any) => void;
  currentUser?: any;
  isAdmin?: boolean;
  onReport?: (s: any) => void;
  onDelete?: (s: any) => void;
  /** When true the modal is rendered inside an external overlay host which already provides backdrop */
  embedded?: boolean;
}

export function SellerProfileModal({
  sellerId,
  sellerProfile,
  sellerProducts: initialProducts,
  onClose,
  onProductClick,
  currentUser,
  isAdmin = false,
  onReport,
  onDelete,
  embedded = false,
}: SellerProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<any | null>(sellerProfile || null);
  const [products, setProducts] = useState<any[] | null>(initialProducts || null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load seller if we only have ID
        let s = seller;
        if (!s && sellerId) {
          const { data, error } = await getUserById(String(sellerId));
          if (error) throw error;
          s = data;
        }

        // Load products if not provided
        let p = products;
        if ((!p || p.length === 0) && s) {
          try {
            p = await getProducts({ seller_id: String(s.id) });
          } catch (e: any) {
            // non-fatal: show empty products
            p = [];
          }
        }

        if (!mounted) return;

        setSeller(s);
        setProducts(p || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    // Only fetch if we don't already have data
    if ((!seller && sellerId) || (initialProducts === undefined && !products)) {
      load();
    }

    return () => {
      mounted = false;
    };
    // intentionally excluding 'seller' and 'products' to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <svg className="animate-spin h-6 w-6 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-sm text-red-600">Error loading profile: {error}</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Seller not found.</p>
      </div>
    );
  }

  return (
    <SellerProfile
      seller={seller}
      sellerProducts={products || []}
      onClose={onClose}
      onProductClick={(p) => {
        onProductClick?.(p);
      }}
      currentUser={currentUser}
      isAdmin={isAdmin}
      onReport={onReport}
      onDelete={onDelete}
      noBackdrop={embedded}
    />
  );
}
