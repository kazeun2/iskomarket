import { useEffect, useState } from 'react';
import { getMarketplaceStats, MarketplaceStats } from '../lib/services/stats';

export function useMarketplaceStats() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const s = await getMarketplaceStats();
        if (!mounted) return;
        setStats(s);
        setError(null);
      } catch (e: any) {
        console.error('useMarketplaceStats: failed to fetch', e);
        if (!mounted) return;
        setError(e);
        setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const interval = setInterval(async () => {
      try {
        const s = await getMarketplaceStats();
        if (mounted) setStats(s);
      } catch (e) { /* ignore periodic errors */ }
    }, 60 * 1000); // refresh every minute

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, error };
}
