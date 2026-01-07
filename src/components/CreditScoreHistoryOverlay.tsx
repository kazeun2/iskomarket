import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CreditScoreRing } from './CreditScoreRing';
import { getUserById } from '../services/userService';
import { getUserCreditScoreHistory } from '../lib/services/creditScore';

// This overlay is a screen-level replacement for the old nested CreditScoreModal.
// It is mounted at the app root via the OverlayHost so it has its own overlay,
// scroll context, and focus management, avoiding stacking-context problems.
export function CreditScoreHistoryOverlay({ userId, onClose, onBack } : { userId?: string, onClose: () => void, onBack?: () => void }) {
  const [user, setUser] = useState(null as any | null);
  const [history, setHistory] = useState([] as any[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (userId) {
          const { data } = await getUserById(userId as any);
          if (!mounted) return;
          setUser(data);
          const historyData = await getUserCreditScoreHistory(Number(userId));
          if (!mounted) return;
          setHistory(historyData || []);
        } else {
          setUser(null);
          setHistory([]);
        }
      } catch (e) {
        console.error('CreditScoreHistoryOverlay fetch error', e);
        if (!mounted) return;
        setError('Failed to load credit history');
        setHistory([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    // focus the panel for accessibility
    console.debug('[CreditScoreHistoryOverlay] mounted for userId=', userId);
    setTimeout(() => overlayRef.current?.focus(), 0);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-score-title"
      tabIndex={-1}
      ref={overlayRef}
      className="fixed inset-0 z-[40001] flex items-start justify-end p-6 pointer-events-auto"
      style={{ outline: 'none' }}
    >
      <div className="w-full max-w-[980px] h-full bg-white dark:bg-[#04121a] shadow-2xl rounded-l-xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to profile" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <h2 id="credit-score-title" className="text-lg font-semibold">Credit Score History</h2>
            <p className="text-sm text-muted-foreground">{user?.username || 'User'}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close credit score history">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Credit Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-6">
              <div>
                <div className="text-4xl font-bold">{user?.credit_score ?? 70}</div>
                <div className="text-sm text-muted-foreground">out of 100 points</div>
              </div>
              <div>
                <CreditScoreRing score={user?.credit_score ?? 70} size="lg" showAnimation showIcon />
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-medium mb-3">Transaction History</h3>
            <div className="space-y-2">
              {loading && (
                <div className="text-sm text-muted-foreground">Loading history…</div>
              )}

              {!loading && error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              {!loading && !error && history.length === 0 && (
                <div className="text-sm text-muted-foreground">No credit score history available.</div>
              )}

              {!loading && !error && history.map((entry: any) => (
                <Card key={entry.id} className="p-4">
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{entry.reason || 'Credit score update'}</div>
                        <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</div>
                      </div>
                      <div className={`font-semibold ${entry.change > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {entry.change > 0 ? '+' : ''}{entry.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
