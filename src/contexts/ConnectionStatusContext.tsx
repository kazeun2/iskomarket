import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

type QueuedMessage = {
  id: string; // temp id
  conversation_id?: string | null;
  senderId: string;
  receiverId: string;
  message: string;
  productId?: number | null;
  created_at: string;
};

type ConnectionContextType = {
  isOnline: boolean;
  pendingCount: number;
  enqueueOutgoingMessage: (m: Omit<QueuedMessage, 'id' | 'created_at'>) => Promise<string>;
  processQueue: () => Promise<void>;
};

const LOCAL_KEY = 'iskomarket:outgoing_queue_v1';
const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return 0;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.length : 0;
    } catch (e) { return 0; }
  });

  // Helper: read queue
  const readQueue = useCallback((): QueuedMessage[] => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }, []);

  const writeQueue = useCallback((arr: QueuedMessage[]) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
      setPendingCount(arr.length);
    } catch (e) {
      console.warn('[ConnectionStatus] Failed to write queue to localStorage', e);
    }
  }, []);

  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      toast.success('Connection restored — sending queued messages');
      // Attempt to process queue
      try { await processQueue(); } catch (e) { console.warn('processQueue failed on online', e); }
    };
    const onOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost — messages will be queued');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Supabase channel state check: try lightweight ping to detect if realtime is reachable
    const checkSupabase = async () => {
      try {
        // quick select to validate connectivity
        await supabase.from('messages').select('id').limit(1);
        setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkSupabase, 30000);
    // initial
    checkSupabase();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, []);

  // enqueue message
  const enqueueOutgoingMessage = useCallback(async (m: Omit<QueuedMessage, 'id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const id = `queued-${Date.now()}`;
    const entry: QueuedMessage = { id, ...m, created_at: now };
    const current = readQueue();
    const updated = [...current, entry];
    writeQueue(updated);
    toast.success('Message queued and will be sent when connection is restored');
    return id;
  }, [readQueue, writeQueue]);

  // process queue on reconnect
  const processQueue = useCallback(async () => {
    const queue = readQueue();
    if (!queue.length) return;

    const nextQueue: QueuedMessage[] = [];
    for (const item of queue) {
      try {
        // Try to send using canonical send helper
        const { sendUserMessage } = await import('../services/messageService');
        // Use our supabase client
        await sendUserMessage(supabase, item.conversation_id ?? null, item.senderId, item.receiverId, item.message);
        // small delay to avoid hammering
        await new Promise((r) => setTimeout(r, 150));

        // Emit a local event so UIs can reconcile optimistic queued messages
        try {
          window.dispatchEvent(new CustomEvent('iskomarket:queued-message-sent', { detail: { conversation_id: item.conversation_id, message: item.message, created_at: item.created_at } }));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        console.warn('[ConnectionStatus] Failed to send queued message', item, e);
        // keep this in queue for retry
        nextQueue.push(item);
      }
    }

    writeQueue(nextQueue);
    if (nextQueue.length === 0) toast.success('Queued messages sent successfully');
  }, [readQueue, writeQueue]);

  const ctx: ConnectionContextType = {
    isOnline,
    pendingCount,
    enqueueOutgoingMessage,
    processQueue,
  };

  return <ConnectionContext.Provider value={ctx}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionStatusProvider');
  return ctx;
}
