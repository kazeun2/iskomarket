-- Migration: 20260109 - Add RPCs to update user counters atomically and recalculate tiers

-- Atomic increment function for user counters (iskons, spins)
create or replace function public.increment_user_counters(
  p_user_id uuid,
  p_iskons_delta int default 0,
  p_spins_delta int default 0
) returns table (iskons int, spin_count int, total_spins int) language plpgsql security definer as $$
begin
  update public.users
  set
    iskons = greatest(0, coalesce(iskoins,0) + p_iskons_delta),
    spin_count = greatest(0, coalesce(spin_count,0) + p_spins_delta),
    total_spins = coalesce(total_spins,0) + CASE WHEN p_spins_delta > 0 THEN p_spins_delta ELSE 0 END,
    updated_at = now()
  where id = p_user_id
  returning public.users.iskoins, public.users.spin_count, public.users.total_spins into iskons, spin_count, total_spins;

  return query select iskons, spin_count, total_spins;
end;
$$;

-- Tier recalculation function removed: tier calculation will be handled externally or derived from business logic as needed.
-- (Previously: recalculate_user_tier function removed per request.)

-- =====================================================
-- Daily spins enhancements and server-side spin RPC
-- Implements: Elite access (credit_score == 100) for free daily spin,
--            1 free spin per day, up to 3 recharges/day (cost 2 IsKoins per recharge),
--            weighted reward distribution (0-7 IsKoins), and basic credit score update.
-- =====================================================

-- Add spin_type to daily_spins for bookkeeping (free | recharge)
alter table if exists public.daily_spins add column if not exists spin_type varchar(20) default 'free';

-- Adjust rewards distribution and enforce limits at RPC level
create or replace function public.perform_user_spin(p_user_id uuid, p_recharge boolean default false)
returns table (reward_amount int, iskons int, spin_count int, total_spins int, new_credit_score int) language plpgsql security definer as $perform_user_spin$
declare
  user_row record;
  free_spins_today int;
  recharge_spins_today int;
  reward int := 0;
  r float;
  cost int := 2; -- cost per recharge
  new_credit int;
begin
  -- Lock user row to avoid races
  select * into user_row from public.users where id = p_user_id for update;
  if not found then
    raise exception 'user not found';
  end if;

  -- Count free/recharge spins used today
  select count(*) into free_spins_today
    from public.daily_spins
    where user_id = p_user_id
      and spin_type = 'free'
      and created_at >= date_trunc('day', now());

  select count(*) into recharge_spins_today
    from public.daily_spins
    where user_id = p_user_id
      and spin_type = 'recharge'
      and created_at >= date_trunc('day', now());

  -- Enforce access: only Elite IskoMembers (credit_score = 100) get a free daily spin
  if not p_recharge then
    if coalesce(user_row.credit_score, 0) < 100 then
      raise exception 'Free spin is available only for Elite IskoMembers (credit_score 100)';
    end if;
    if free_spins_today >= 1 then
      raise exception 'Free spin already used for today';
    end if;
  else
    -- Recharge path: up to 3 recharges per day, cost 2 IsKoins each
    if recharge_spins_today >= 3 then
      raise exception 'Maximum of 3 recharges per day reached';
    end if;
    if coalesce(user_row.iskons,0) < cost then
      raise exception 'Insufficient IsKoins for recharge';
    end if;
    -- Deduct cost immediately
    update public.users set iskons = greatest(0, coalesce(iskons,0) - cost), updated_at = now() where id = p_user_id;
    user_row.iskons := greatest(0, coalesce(user_row.iskons,0) - cost);
  end if;

  -- Determine reward with weighted probabilities
  r := random(); -- 0..1
  -- Weights (configurable): 0:30%, 1:30%, 2-6: each 7% (total 35%), 7:5%
  if r < 0.30 then
    reward := 0;
  elsif r < 0.60 then
    reward := 1;
  elsif r < 0.67 then
    reward := 2;
  elsif r < 0.74 then
    reward := 3;
  elsif r < 0.81 then
    reward := 4;
  elsif r < 0.88 then
    reward := 5;
  elsif r < 0.95 then
    reward := 6;
  else
    reward := 7;
  end if;

  -- Insert spin record
  insert into public.daily_spins (user_id, reward_type, reward_amount, reward_description, spin_type)
    values (p_user_id, 'iskoins', reward, 'Daily spin result', (case when p_recharge then 'recharge' else 'free' end));

  -- Apply reward
  if reward > 0 then
    update public.users set iskons = coalesce(iskons,0) + reward, updated_at = now() where id = p_user_id;
    user_row.iskons := coalesce(user_row.iskons,0) + reward;
  end if;

  -- Update spin counters on the user row (spin_count = today's count or increment, total_spins accumulates)
  update public.users
    set spin_count = coalesce(spin_count,0) + 1,
        total_spins = coalesce(total_spins,0) + 1,
        last_spin_date = now(),
        updated_at = now()
  where id = p_user_id;

  -- Optional: small credit score bump for rare / good wins (e.g., reward >=5)
  if reward >= 5 then
    update public.users set credit_score = least(100, coalesce(credit_score,0) + 1) where id = p_user_id;
  end if;

  -- Refresh user row to reflect the latest values (iskons, spin counts, credit_score)
  select iskons, spin_count, total_spins, credit_score into user_row.iskons, user_row.spin_count, user_row.total_spins, user_row.credit_score from public.users where id = p_user_id;
  new_credit := coalesce(user_row.credit_score,0);

  -- Return latest values
  return query select reward as reward_amount, coalesce(user_row.iskons,0) as iskons, coalesce(user_row.spin_count,0) as spin_count, coalesce(user_row.total_spins,0) as total_spins, new_credit as new_credit_score;
end;
$perform_user_spin$;

-- Grant execute to authenticated role (adjust role name according to your RLS setup)
-- grant execute on function public.increment_user_counters(uuid, int, int) to authenticated;
-- grant execute on function public.perform_user_spin(uuid, boolean) to authenticated;
