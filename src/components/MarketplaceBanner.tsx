import React from 'react';
import { Button } from './ui/button';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { probeMarketplaceBanner } from '../lib/bannerDebug';

interface MarketplaceStats {
  totalProducts?: number;
  totalUsers?: number;
  activeUsers24h?: number;
  activeSellersWeek?: number;
}

interface MarketplaceBannerProps {
  currentUser?: any;
  role?: 'admin' | 'user';
  stats?: MarketplaceStats;
  loading?: boolean;
  onClickProducts?: () => void;
  onClickUsers?: () => void;
}

export function MarketplaceBanner({ currentUser, role = 'user', stats, loading = false, onClickProducts, onClickUsers }: MarketplaceBannerProps) {
  const name = currentUser?.username || currentUser?.name || 'Student';
  const isAdmin = role === 'admin';

  const StatCard = ({ label, value, title }: { label: string; value: string; title?: string }) => (
    <div
      title={title}
      className={`group flex flex-col items-center sm:items-start text-center sm:text-left min-w-[120px] sm:min-w-[140px] w-full sm:w-auto glass-card dark:bg-[var(--card)] stat-card rounded-lg px-4 py-3 transition-all duration-150 cursor-default pointer-events-none`}
      aria-label={label}
    >
      <div className="text-lg md:text-xl font-semibold text-foreground stat-number">{value}</div>
      <div className="text-xs text-foreground/90 mt-1">{label}</div>
    </div>
  );

  const formatNumber = (n?: number) => (loading ? '--' : n !== undefined ? new Intl.NumberFormat().format(n) : '0');

  // Updated banner content per requested final copy. Left side welcome + description. Right-bottom metrics + Trusted Student Board button.
  const [productsCount, setProductsCount] = React.useState(stats?.totalProducts);
  const [usersCount, setUsersCount] = React.useState(stats?.totalUsers);

  React.useEffect(() => { setProductsCount(stats?.totalProducts); }, [stats?.totalProducts]);
  React.useEffect(() => { setUsersCount(stats?.totalUsers); }, [stats?.totalUsers]);

  React.useEffect(() => {
    let channel: any = null;
    let mounted = true;

    async function fetchCounts(){
      if (!isSupabaseConfigured()) return;
      try {
        const prodRes = await supabase.from('products').select('id', { count: 'exact', head: true });
        if (mounted && prodRes && typeof prodRes.count === 'number') setProductsCount(prodRes.count);
        const usersRes = await supabase.from('users').select('id', { count: 'exact', head: true });
        if (mounted && usersRes && typeof usersRes.count === 'number') setUsersCount(usersRes.count);
      } catch(e){ console.debug('MarketplaceBanner: fetchCounts failed', e); }
    }

    fetchCounts();

    if (isSupabaseConfigured()) {
      channel = supabase.channel('public:market_counts_banner')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchCounts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchCounts())
        .subscribe();
    }

    return () => { mounted = false; if (channel && channel.unsubscribe) channel.unsubscribe(); };
  }, []);

  React.useEffect(() => {
    // Delegate debug probing to a shared helper which respects the global debug flag and
    // removes any DOM attributes it sets. This keeps the component code minimal and
    // ensures fixes are applied consistently across all banner instances.
    const cleanup = probeMarketplaceBanner(document.querySelector('[aria-label="Marketplace banner"]') as HTMLElement | null);
    return cleanup;
  }, []);

  const isAdminLocal = role === 'admin';

  return (
    <div className={`rounded-lg p-6 text-foreground relative overflow-hidden hero-gradient banner-enhanced`} role="banner" aria-label="Marketplace banner" style={{ backgroundImage: 'linear-gradient(90deg, #082f23 0%, #0f6b3a 40%, #6fe7a0 100%)', backgroundColor: '#082f23', color: 'var(--iskomarket-pure-white)', boxShadow: '0 18px 48px rgba(3,67,33,0.16), inset 0 -6px 24px rgba(0,0,0,0.08)' }}>
      <div className="flex items-stretch max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">IskoMarket · {isAdminLocal ? 'Administration View' : 'CvSU Community Marketplace'}</div>
          <h1 className="mt-1 text-lg sm:text-2xl banner-heading">Welcome, <span className="banner-username">{name}</span>!</h1>
          <p className="mt-2 text-sm opacity-90 max-w-2xl">{isAdminLocal ? 'A campus marketplace where CvSU students buy and sell textbooks, supplies, and daily needs in a secure environment.' : 'A campus marketplace where CvSU students buy and sell textbooks, supplies, and daily needs in one secure place.'}</p>
        </div>

        <div className="flex-shrink-0 flex flex-col justify-end items-end text-right ml-auto">
          <div className="text-sm text-foreground/90">
            <div className="banner-metric-number flex items-center">
              <span className="metric-value text-base sm:text-xl font-semibold leading-tight" aria-label={`${formatNumber(productsCount)} products`}>{formatNumber(productsCount)}</span>
              <span className="metric-label ml-2 text-sm sm:text-lg font-normal leading-tight text-foreground/90">{isAdminLocal ? 'total products' : 'products'}</span>
            </div>
            <div className="mt-1 banner-metric-number flex items-center">
              <span className="metric-value text-base sm:text-xl font-semibold leading-tight" aria-label={`${formatNumber(usersCount)} users`}>{formatNumber(usersCount)}</span>
              <span className="metric-label ml-2 text-sm sm:text-lg font-normal leading-tight text-foreground/80">{isAdminLocal ? 'total users' : 'users'}</span>
            </div> 
          </div>

          <button
            type="button"
            onClick={() => { if (typeof (onClickProducts) === 'function') { /* keep existing behavior */ } if ((window as any).__openTrustedStudentBoard) { (window as any).__openTrustedStudentBoard(); } else { window.location.assign('/trusted-student-board'); } }}
            className="trusted-board-btn inline-block mt-3 rounded-full px-4 py-2 bg-[var(--iskomarket-dark-green)] text-foreground/95 text-sm no-underline focus:outline-none"
            style={{ border: '1px solid rgba(255,217,122,0.10)', boxShadow: '0 10px 28px rgba(3,67,33,0.18), 0 0 12px rgba(255,217,122,0.04)', zIndex: 3, background: 'linear-gradient(180deg, #0b6b43 0%, #085c33 100%)' }}
            aria-label="Open Trusted Student Board"
          >
            Trusted Student Board
          </button>
        </div>
      </div>
    </div>
  );
}
