import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client module with behavior tailored for users.updateCreditScore
vi.mock('../src/lib/supabase', () => {
  const state: any = {
    lastInserted: null,
    lastUpdated: null,
    users: {
      'user-1': { id: 'user-1', credit_score: 70 }
    }
  };

  const supabaseMock: any = {
    from: (tableName: string) => {
      const obj: any = {};

      obj.select = (cols?: string) => ({
        eq: (col: string, val: any) => ({
          single: async () => {
            if (tableName === 'users') {
              const user = state.users[val];
              return { data: user ? { ...user } : null, error: null };
            }
            return { data: [], error: null };
          },
        }),
      });

      obj.update = (updates: any) => ({
        eq: (col: string, val: any) => ({
          select: () => ({
            single: async () => {
              if (tableName === 'users') {
                state.users[val] = {
                  ...(state.users[val] || {}),
                  ...updates,
                };

                state.lastUpdated = { table: tableName, id: val, updates };

                return { data: state.users[val], error: null };
              }
              return { data: null, error: null };
            },
          }),
        }),
      });

      obj.insert = (rows: any[]) => ({
        select: () => ({
          single: async () => {
            const inserted = { ...(rows[0] || {}), id: 'hist-1', created_at: new Date().toISOString() };
            state.lastInserted = { table: tableName, row: inserted };
            return { data: inserted, error: null };
          },
        }),
      });

      return obj;
    },
    __mockState: state,
  };

  return { supabase: supabaseMock };
});

import { updateCreditScore } from '../src/lib/services/users';
import { supabase } from '../src/lib/supabase';

describe('updateCreditScore', () => {
  beforeEach(() => {
    // reset state
    (supabase as any).__mockState.users = { 'user-1': { id: 'user-1', credit_score: 70 } };
    (supabase as any).__mockState.lastInserted = null;
    (supabase as any).__mockState.lastUpdated = null;
  });

  it('should update the users.credit_score and insert a history row', async () => {
    const res = await updateCreditScore('user-1', 5, 'Test increase', 'increase');

    // The function returns the updated user
    expect(res).toBeTruthy();
    expect(res.credit_score).toBe(75);

    // Confirm supabase mock recorded the update
    const state = (supabase as any).__mockState;
    expect(state.lastUpdated).toBeTruthy();
    expect(state.lastUpdated.table).toBe('users');
    expect(state.lastUpdated.id).toBe('user-1');
    expect(state.lastUpdated.updates.credit_score).toBe(75);

    // Confirm history insert was recorded
    expect(state.lastInserted).toBeTruthy();
    expect(state.lastInserted.table).toBe('credit_score_history');
    expect(state.lastInserted.row.previous_score).toBe(70);
    expect(state.lastInserted.row.new_score).toBe(75);
    expect(state.lastInserted.row.change_amount).toBe(5);
  });

  it('should clamp values between 0 and 100', async () => {
    const res = await updateCreditScore('user-1', 50, 'Big increase', 'increase');
    expect(res.credit_score).toBe(100);

    const res2 = await updateCreditScore('user-1', -200, 'Huge penalty', 'decrease');
    expect(res2.credit_score).toBe(0);
  });
});
