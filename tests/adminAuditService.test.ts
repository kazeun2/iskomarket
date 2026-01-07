import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase client module
vi.mock('../src/lib/supabase', () => {
  // Internal state for the mock
  const state: any = {
    lastChannel: null,
    // nextSelectResult can be set in tests to control what select() returns
    nextSelectResult: [],
  };

  const makeQuery = (result: any) => {
    const q: any = {
      _result: result,
      select() { return q; },
      gte() { return q; },
      order() { return q; },
      range() { return q; },
      eq() { return q; },
      then(resolve: any) { resolve({ data: q._result, error: null }); },
    };
    return q;
  };

  const supabaseMock: any = {
    // from() supports both read queries (select chains) and insert chains
    from: (tableName: string) => {
      const obj: any = {};

      // return whatever was set on state.nextSelectResult (default empty array)
      obj.select = () => makeQuery(state.nextSelectResult ?? []);

      obj.gte = () => makeQuery(state.nextSelectResult ?? []);
      obj.order = () => makeQuery(state.nextSelectResult ?? []);
      obj.range = () => makeQuery(state.nextSelectResult ?? []);
      obj.eq = () => makeQuery(state.nextSelectResult ?? []);

      obj.insert = (rows: any[]) => {
        const inserted = { ...(rows[0] || {}), id: '11111111-1111-1111-1111-111111111111', created_at: new Date().toISOString() };
        return {
          select: () => ({ single: async () => ({ data: inserted, error: null }) }),
        };
      };

      return obj;
    },

    channel: (name: string) => {
      const ch: any = {
        name,
        _handler: null,
        on(eventName: string, evSpec: any, handler: any) {
          ch._handler = handler;
          return ch;
        },
        subscribe() {
          state.lastChannel = ch;
          return ch;
        },
      };
      return ch;
    },

    removeChannel: (ch: any) => {
      if (state.lastChannel === ch) state.lastChannel = null;
    },

    __mockState: state,
  };

  return { supabase: supabaseMock };
});

// Import after mocking
import * as adminSvc from '../src/services/adminAuditService';
import { insertAdminAuditLog, subscribeToAdminAuditLogs } from '../src/services/adminAuditService';
import type { AdminAuditUI } from '../src/services/adminAuditService';
import { supabase } from '../src/lib/supabase';

describe('adminAuditService integration tests (mocked supabase)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('insertAdminAuditLog should insert and return normalized UI object', async () => {
    const payload = {
      admin_email: 'tester@local',
      action: 'deleted' as any,
      target_type: 'product' as any,
      target_id: 'prod-123',
      target_title: 'Test Product',
      reason: 'test delete',
    };

    const { data, error } = await insertAdminAuditLog(payload as any);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data?.adminEmail).toBe('tester@local');
    expect(data?.action).toBe('deleted');
    expect(data?.targetType).toBe('product');
    expect(data?.targetId).toBe('prod-123');
    expect(data?.targetTitle).toBe('Test Product');
    expect(data?.id).toBeTruthy();
    expect(data?.created_at).toBeTruthy();
  });

  it('subscribeToAdminAuditLogs should call callback when channel handler triggers', async () => {
    // Make getRecentAdminAuditLogs return a deterministic row
    const sampleRow = {
      id: '22222222-2222-2222-2222-222222222222',
      admin_email: 'realtime@local',
      action: 'approved',
      target_type: 'for_a_cause',
      target_id: 'cause-1',
      target_title: 'Help A Student',
      reason: 'Approved via test',
      created_at: new Date().toISOString(),
    };

    // Arrange: make the supabase mock return our sample row for select() calls
    (supabase as any).__mockState.nextSelectResult = [sampleRow];

    // Create a promise we can await when callback is invoked
    let received: any[] | null = null;

    const p = new Promise<void>((resolve) => {
      const unsubscribe = subscribeToAdminAuditLogs((rows) => {
        received = rows;
        resolve();
      });

      // The subscribe call should have set lastChannel on the mock
      const channel = (supabase as any).__mockState.lastChannel;

      // Call the handler that adminAuditService installed
      if (channel && channel._handler) channel._handler();

      // cleanup subscription
      unsubscribe();
    });

    await p;

    expect(received).not.toBeNull();
    if (received) {
      expect((received as any).length).toBeGreaterThan(0);
      expect((received as any)[0].adminEmail).toBe('realtime@local');
    } 
  });
});
