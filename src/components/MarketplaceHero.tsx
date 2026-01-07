import React from 'react';
import { Button } from './ui/button';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { probeMarketplaceBanner } from '../lib/bannerDebug';


export type MarketplaceHeroProps = {
  userRole: 'admin' | 'user';
  firstName: string;
  totalProducts: number | undefined;
  totalUsers: number | undefined;
  myListingsCount?: number | undefined;
  loading?: boolean;
  onPrimaryAction: () => void;
  onClickProducts?: () => void;
  onClickUsers?: () => void;
  onOpenTrustBoard?: () => void;
};

function StatCard({ label, value, title }: { label: string; value: string; title?: string }) {
  // Informational, non-interactive stat card. Centered on mobile, left-aligned on desktop.
  return (
    <div
      role="group"
      title={title}
      className={`flex flex-col items-center sm:items-start text-center sm:text-left min-w-[120px] sm:min-w-[140px] w-full sm:w-auto glass-card dark:bg-[var(--card)] stat-card rounded-xl px-4 py-3 shadow-sm transition-all duration-150 border border-transparent pointer-events-none`}
      aria-label={label}
    >
      <div className="text-lg md:text-xl font-semibold leading-tight text-white stat-number">{value}</div>
      <div className="text-xs text-white/90 mt-1">{label}</div>
    </div>
  );
}

export function MarketplaceHero({ userRole, firstName, totalProducts, totalUsers, myListingsCount, loading = false, onPrimaryAction, onClickProducts, onClickUsers, onOpenTrustBoard }: MarketplaceHeroProps) {
  const isAdmin = userRole === 'admin';
  const nf = (n?: number) => (loading ? '--' : (n !== undefined ? new Intl.NumberFormat().format(n) : '0'));

  // Banner: updated per final copy requirements. Shows left welcome text + description, right-bottom live metrics + Trusted Student Board button.
  const [productsCount, setProductsCount] = React.useState(totalProducts);
  const [usersCount, setUsersCount] = React.useState(totalUsers);

  React.useEffect(() => { setProductsCount(totalProducts); }, [totalProducts]);
  React.useEffect(() => { setUsersCount(totalUsers); }, [totalUsers]);

  React.useEffect(() => {
    // Subscribe to supabase changes for products and users, fallback to polling if supabase unavailable
    let channel: any = null;
    let mounted = true;

    async function fetchCounts() {
      try {
        if (!isSupabaseConfigured()) return;
        const prodRes = await supabase.from('products').select('id', { count: 'exact', head: true });
        if (mounted && prodRes && typeof prodRes.count === 'number') setProductsCount(prodRes.count);

        // try users table (may require RLS); fallback to profiles if users not accessible
        const usersRes = await supabase.from('users').select('id', { count: 'exact', head: true });
        if (mounted && usersRes && typeof usersRes.count === 'number') setUsersCount(usersRes.count);
      } catch (err) {
        // ignore errors; we'll rely on props
        console.debug('MarketplaceHero: failed to fetch counts', err);
      }
    }

    fetchCounts();

    if (isSupabaseConfigured()) {
      channel = supabase.channel('public:market_counts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { fetchCounts(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { fetchCounts(); })
        .subscribe();
    }

    return () => {
      mounted = false;
      if (channel && channel.unsubscribe) channel.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    // Delegate debug probing to a shared helper which respects the global debug flag and
    // removes any DOM attributes it sets. This keeps the component code minimal and
    // ensures fixes are applied consistently across all banner instances.
    const cleanup = probeMarketplaceBanner(document.querySelector('[aria-label="Marketplace banner"]') as HTMLElement | null);
    return cleanup;
  }, []);

  return (
    <div className={`rounded-lg overflow-hidden p-6 hero-gradient banner-enhanced`} role="banner" aria-label="Marketplace banner" style={{ backgroundImage: 'linear-gradient(90deg, #082f23 0%, #0f6b3a 40%, #6fe7a0 100%)', backgroundColor: '#082f23', color: 'var(--iskomarket-pure-white)', boxShadow: '0 18px 48px rgba(3,67,33,0.16), inset 0 -6px 24px rgba(0,0,0,0.08)' }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-stretch gap-4">
          {/* Left: welcome + description */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide opacity-90">IskoMarket · {userRole === 'admin' ? 'Administration View' : 'CvSU Community Marketplace'}</div>
            <h1 className="mt-1 text-2xl md:text-3xl banner-heading leading-tight">Welcome, <span className="banner-username">{firstName}</span>!</h1>
            <p className="mt-2 text-sm opacity-90 max-w-2xl">{userRole === 'admin' ? 'A campus marketplace where CvSU students buy and sell textbooks, supplies, and daily needs in a secure environment.' : 'A campus marketplace where CvSU students buy and sell textbooks, supplies, and daily needs in one secure place.'}</p>
          </div>

          {/* Right: metrics aligned to bottom-right, no containers */}
          <div className="flex-shrink-0 flex flex-col justify-end items-end text-right ml-auto">
            <div className="text-sm text-white/90">
              <div className="banner-metric-number flex items-center">
                <span className="metric-value text-xl md:text-2xl font-semibold leading-tight" aria-label={`${nf(productsCount)} products`}>{nf(productsCount)}</span>
                <span className="metric-label ml-2 text-base md:text-lg font-normal leading-tight text-white/90">{userRole === 'admin' ? 'total products' : 'products'}</span>
              </div> 
              <div className="mt-1 banner-metric-number flex items-center">
                <span className="metric-value text-xl md:text-2xl font-semibold leading-tight" aria-label={`${nf(usersCount)} users`}>{nf(usersCount)}</span>
                <span className="metric-label ml-2 text-base md:text-lg font-normal leading-tight text-white/90">{userRole === 'admin' ? 'total users' : 'users'}</span>
              </div>  
            </div>

            <button
              type="button"
              onClick={() => { if (onOpenTrustBoard) onOpenTrustBoard(); else window.location.assign('/trusted-student-board'); }}
              className="trusted-board-btn inline-block mt-3 rounded-full px-4 py-2 text-white text-sm no-underline focus:outline-none"
              style={{ border: '1px solid rgba(255,217,122,0.10)', boxShadow: '0 10px 28px rgba(3,67,33,0.18), 0 0 12px rgba(255,217,122,0.04)', zIndex: 3, background: 'linear-gradient(180deg, #0b6b43 0%, #085c33 100%)' }}
              aria-label="Open Trusted Student Board"
            >
              Trusted Student Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
Notes:
- This component mirrors a social-media dashboard header by using a two-column composition: left for identity and messaging, right for compact analytics tiles and primary action.
- Stats are formatted using Intl.NumberFormat and show a loading placeholder ('--') while data is being fetched.
- On desktop, cards are inline and the CTA sits to the side; on mobile the CTA stacks below the cards and cards become a vertical grid.
- Role-aware behavior: admins see platform-level metrics and 'View Overview'; users see a personal stat (your listings) and 'Continue browsing'.
*/