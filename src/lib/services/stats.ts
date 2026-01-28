import { supabase } from '../supabaseClient';

export interface MarketplaceStats {
  totalUsers: number;
  totalProducts: number;
  activeUsers24h?: number;
}

export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  // Count users
  const [{ count: usersCount }, { count: productsCount }, { count: cvsuCount }, { count: active24hCount }] = await Promise.all([
    supabase.from('users').select('id', { head: true, count: 'exact' }),
    supabase.from('products').select('id', { head: true, count: 'exact' }).neq('is_deleted', true),
    supabase.from('cvsu_market_products').select('id', { head: true, count: 'exact' }),
    supabase.from('users').select('id', { head: true, count: 'exact' }).gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalUsers = Number(usersCount || 0);
  const productCount = Number(productsCount || 0);
  const cvsu = Number(cvsuCount || 0);
  const totalProducts = productCount + cvsu;
  const activeUsers24h = Number(active24hCount || 0);

  return {
    totalUsers,
    totalProducts,
    activeUsers24h,
  };
}
