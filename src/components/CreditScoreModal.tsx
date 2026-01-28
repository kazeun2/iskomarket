import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle, XCircle, Calendar, User, Package, MapPin, X, Clock, Snowflake } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { CreditScoreBadge } from './CreditScoreBadge';
import { CreditScoreRing } from './CreditScoreRing';
import { CreditScoreHistoryEntry, CooldownStatus, CREDIT_SCORE_ACTIONS } from './CreditScoreSystem';
import { toast } from 'sonner';

interface CreditScoreHistory {
  id: number;
  date: string;
  type: 'violation' | 'success' | 'penalty' | 'bonus';
  points: number;
  description: string;
  balanceAfter: number;
  transactionId?: number;
}

interface CreditScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  history: CreditScoreHistory[];
  cooldownStatus?: CooldownStatus;
  loading?: boolean;
}

export function CreditScoreModal({ isOpen, onClose, currentScore, history, cooldownStatus }: CreditScoreModalProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<CreditScoreHistory | null>(null);

  // Diagnostics: log lifecyle so we can confirm mount / open events in the browser console
  React.useEffect(() => {
    console.debug('[CreditScoreModal] mounted, isOpen=', isOpen);
    return () => console.debug('[CreditScoreModal] unmounted');
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      console.debug('[CreditScoreModal] isOpen changed to true (opening)');
    } else {
      console.debug('[CreditScoreModal] isOpen changed to false (closing)');
    }
  }, [isOpen]);
  
  const getScoreStatus = () => {
    if (currentScore >= 85) return { 
      label: 'Excellent', 
      color: 'text-primary', 
      badgeClass: 'bg-primary/10 text-primary border-primary/20',
      icon: Shield 
    };
    if (currentScore >= 70) return { 
      label: 'Good', 
      color: 'text-secondary', 
      badgeClass: 'bg-secondary/10 text-secondary border-secondary/20',
      icon: CheckCircle 
    };
    if (currentScore >= 60) return { 
      label: 'Warning', 
      color: 'text-yellow-600', 
      badgeClass: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
      icon: AlertTriangle 
    };
    return { 
      label: 'Critical', 
      color: 'text-destructive', 
      badgeClass: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
      icon: XCircle 
    };
  };

  const status = getScoreStatus();
  const StatusIcon = status.icon;

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'violation':
      case 'penalty':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'success':
      case 'bonus':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  // Mock transaction details generator
  const getTransactionDetails = (entry: CreditScoreHistory) => {
    const isPositive = entry.type === 'success' || entry.type === 'bonus';
    return {
      id: entry.transactionId || entry.id,
      buyer: isPositive ? 'You' : 'Maria Santos',
      seller: isPositive ? 'John Doe' : 'You',
      product: entry.description.includes('Calculus') ? 'Advanced Calculus Textbook' : 
               entry.description.includes('Laptop') ? 'Gaming Laptop - ASUS ROG' : 'Product Item',
      price: Math.floor(Math.random() * 5000) + 500,
      meetupLocation: ['Umall Gate', 'Gate 1', 'Gate 2'][Math.floor(Math.random() * 3)],
      date: entry.date,
      status: isPositive ? 'Completed' : entry.type === 'violation' ? 'Reported' : 'Cancelled'
    };
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose} forceZIndex={30000}>
      {/* QA: help identify this dialog in the DOM */}
      <div data-qa="CreditScoreModal-root" />
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-hidden credit-score-modal-content modal-standard"
      >
        {/* Premium glassmorphism styling */}
        <style>{`
          .credit-score-modal-content {
            background: rgba(255, 255, 255, 0.68);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 120, 60, 0.18);
            border-radius: 32px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          }
          
          /* Dark mode styles */
          .dark .credit-score-modal-content {
            background: linear-gradient(135deg, #003726 0%, #021223 100%);
            border-color: rgba(0, 255, 180, 0.12);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), 
                        0 0 28px rgba(14, 240, 169, 0.24);
            backdrop-filter: blur(28px);
          }
          
          /* Noise texture overlay */
          .credit-score-modal-content::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.02;
            pointer-events: none;
            border-radius: 32px;
            z-index: 0;
          }
          
          .credit-score-modal-content > * {
            position: relative;
            z-index: 1;
          }
        `}</style>
        
        <DialogHeader className="modal-header-standard">
          <DialogTitle>Credit Score History</DialogTitle>
          <DialogDescription className="modal-subtitle">
            Track your marketplace reputation and transaction history
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="modal-close-button-standard"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Diagnostics: show computed z-index from dialog context (rendered in DOM for quick debugging) */}
        <div data-qa="CreditScoreModal-diagnostics" className="sr-only">CreditScoreModal diagnostics</div>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-150px)]">
          {/* Current Score Card */}
          <Card 
            className="credit-score-card border-primary/20 relative overflow-hidden transition-all duration-300 hover:shadow-lg"
            style={{
              borderRadius: '20px',
            }}
          >
            {/* Card background styling */}
            <style>{`
              .credit-score-card {
                background: linear-gradient(to bottom, #f3fbf7, #dff7ec);
              }
              
              .dark .credit-score-card {
                background: linear-gradient(to bottom, rgba(0, 55, 38, 0.3), rgba(2, 18, 35, 0.3)) !important;
                border-color: rgba(0, 255, 180, 0.12) !important;
              }
            `}</style>
            
            {/* Subtle teal glow under title - light mode only */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 opacity-30 blur-2xl pointer-events-none dark:opacity-0"
              style={{
                background: 'radial-gradient(ellipse, rgba(21, 182, 108, 0.35) 0%, transparent 70%)'
              }}
            />
            
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-base">Current Credit Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="text-4xl font-bold mb-1 text-foreground">{currentScore}</div>
                  <div className="text-sm text-muted-foreground mb-3">out of 100 points</div>
                  <Badge className={status.badgeClass}>{status.label}</Badge>
                </div>
                
                {/* Enhanced Credit Score Ring with 3D depth */}
                <div 
                  className="relative transition-all duration-300 hover:scale-105"
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(21, 182, 108, 0.35))',
                  }}
                >
                  <CreditScoreRing 
                    score={currentScore} 
                    size="lg" 
                    showAnimation={true}
                    showIcon={true}
                  />
                  {/* Subtle outer glow - emerald in light, neon teal in dark */}
                  <div 
                    className="absolute inset-0 rounded-full opacity-35 dark:opacity-20 pointer-events-none glow-ring"
                    style={{
                      background: 'radial-gradient(circle, rgba(21, 182, 108, 0.35) 0%, transparent 70%)',
                      filter: 'blur(12px)',
                    }}
                  />
                  <style>{`
                    .dark .glow-ring {
                      background: radial-gradient(circle, rgba(20, 255, 217, 0.28) 0%, transparent 70%) !important;
                    }
                  `}</style>
                </div>
              </div>

              {/* Cooldown Warning */}
              {cooldownStatus?.isActive && (
                <div 
                  className="cooldown-glass border border-blue-600 rounded-xl p-3 flex items-start gap-3 transition-all duration-200 hover:shadow-md bg-[var(--card)] dark:bg-[rgba(255,255,255,0.55)] dark:backdrop-blur-[12px]"
                >
                  <style>{`
                    .dark .cooldown-glass {
                      background: rgba(30, 58, 138, 0.2) !important;
                    }
                  `}</style>
                  <Snowflake className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      ❄️ Credit Cooldown Active
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                      Positive points disabled until {cooldownStatus.endDate ? new Date(cooldownStatus.endDate).toLocaleDateString() : 'N/A'} due to multiple warnings this month.
                    </p>
                  </div>
                </div>
              )}

              {/* Warning and Excellent Messages */}
              {currentScore < 70 && (
                <div 
                  className="warning-glass p-3 border border-yellow-600 rounded-xl transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
                >
                  <style>{`
                    .warning-glass {
                      background: var(--card);
                    }
                    
                    .dark .warning-glass {
                      background: rgba(161, 98, 7, 0.15) !important;
                      backdrop-filter: blur(12px) !important;
                    }
                  `}</style>
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    {currentScore < 60 
                      ? '⚠️ Critical: Your account is at risk of suspension. Improve your score by completing successful transactions and avoiding violations.'
                      : '⚠️ Warning: Your score is approaching the warning threshold. Be careful with your transactions and follow marketplace guidelines.'}
                  </p>
                </div>
              )}

              {currentScore >= 85 && (
                <div 
                  className="excellent-glass p-3 border rounded-xl transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]"
                >
                  <style>{`
                    .excellent-glass {
                      background: var(--card);
                      border-color: rgba(21, 182, 108, 0.05);
                    }
                    
                    .dark .excellent-glass {
                      background: rgba(21, 182, 108, 0.1) !important;
                      backdrop-filter: blur(12px) !important;
                      border-color: rgba(20, 255, 217, 0.15) !important;
                    }
                  `}</style>
                  <p className="text-sm text-emerald-900 dark:text-emerald-300">
                    ✓ Excellent standing! You qualify for the Trustworthy Badge.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <div>
            <h3 
              className="history-divider font-medium mb-3 pb-2"
              style={{
                borderBottom: '1px solid rgba(0, 80, 40, 0.10)',
              }}
            >
              <style>{`
                .dark .history-divider {
                  border-bottom-color: rgba(20, 255, 150, 0.10) !important;
                }
              `}</style>
              Transaction History
            </h3>
            <div className="space-y-2">
              {history.length === 0 ? (
                <Card className="p-6 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Shield className="h-8 w-8" />
                    <p>No transaction history yet.</p>
                    <p className="text-sm">Start trading to build your credit score!</p>
                  </div>
                </Card>
              ) : (
                history.map((entry, index) => (
                  <Card 
                    key={entry.id} 
                    className="history-card cursor-pointer border-2 transition-all duration-220 ease-in-out group bg-[var(--card)] dark:bg-[rgba(255,255,255,0.55)] dark:backdrop-blur-[12px]"
                    style={{ 
                      borderRadius: '16px',
                      borderColor: 'rgba(0, 120, 60, 0.15)',
                    }}
                    onClick={() => setSelectedTransaction(entry)}
                  >
                    <style>{`
                      .dark .history-card {
                        background: rgba(255, 255, 255, 0.08) !important;
                        border-color: rgba(0, 255, 180, 0.12) !important;
                      }
                      
                      .history-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 8px 24px rgba(0, 100, 0, 0.25);
                        border-color: rgba(21, 182, 108, 0.3) !important;
                      }
                      
                      .dark .history-card:hover {
                        box-shadow: 0 8px 24px rgba(14, 240, 169, 0.35) !important;
                        border-color: rgba(20, 255, 217, 0.4) !important;
                      }
                    `}</style>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1 transition-all duration-180 group-hover:scale-110 group-hover:brightness-125">
                            {getEntryIcon(entry.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm group-hover:text-primary transition-colors duration-180">
                              {entry.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {entry.transactionId && (
                              <p className="text-xs text-primary mt-1 group-hover:brightness-125 transition-all duration-180">
                                Click to view transaction details →
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            entry.points > 0 ? 'text-primary' : 'text-destructive'
                          }`}>
                            {entry.points > 0 ? '+' : ''}{entry.points} pts
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Balance: {entry.balanceAfter}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* How to Improve Section */}
          {currentScore < 85 && (
            <Card 
              className="improve-card border-primary/10 bg-[var(--card)] dark:bg-[rgba(255,255,255,0.55)] dark:backdrop-blur-[12px]"
              style={{
                borderRadius: '16px',
              }}
            >
              <style>{`
                .dark .improve-card {
                  background: rgba(255, 255, 255, 0.08) !important;
                  border-color: rgba(0, 255, 180, 0.08) !important;
                }
              `}</style>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">How to Improve Your Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Complete transactions successfully (+5 points)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Maintain good communication with buyers/sellers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Follow marketplace guidelines and policies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Avoid violations and reported incidents (-3 to -10 points)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Transaction Detail Dialog */}
    {selectedTransaction && (() => {
      const details = getTransactionDetails(selectedTransaction);
      return (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="modal-standard sm:max-w-md">
            <DialogHeader className="modal-header-standard">
              <DialogTitle>Transaction Details</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="modal-close-button-standard"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm">#{details.id.toString().padStart(6, '0')}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{details.product}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Buyer</p>
                    <p className="font-medium">{details.buyer}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Seller</p>
                    <p className="font-medium">{details.seller}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Meetup Location</p>
                    <p className="font-medium">{details.meetupLocation}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(details.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={details.status === 'Completed' ? 'default' : 'destructive'}>
                    {details.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Price</span>
                  <span className="font-medium">₱{details.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Credit Score Impact</span>
                  <span className={`font-medium ${
                    selectedTransaction.points > 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {selectedTransaction.points > 0 ? '+' : ''}{selectedTransaction.points} points
                  </span>
                </div>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      );
    })()}
  </>
  );
}

// Mock credit score history generator
export function generateMockCreditHistory(currentScore: number): CreditScoreHistory[] {
  return [
    {
      id: 1,
      date: '2025-01-10T14:30:00',
      type: 'success',
      points: 5,
      description: 'Successful transaction completed',
      balanceAfter: currentScore,
      transactionId: 1001
    },
    {
      id: 2,
      date: '2025-01-08T10:15:00',
      type: 'success',
      points: 5,
      description: 'Item delivered and confirmed by buyer',
      balanceAfter: currentScore - 5,
      transactionId: 1002
    },
    {
      id: 3,
      date: '2025-01-05T16:20:00',
      type: 'violation',
      points: -3,
      description: 'Late response to buyer inquiry',
      balanceAfter: currentScore - 10
    },
    {
      id: 4,
      date: '2025-01-03T09:00:00',
      type: 'success',
      points: 5,
      description: 'Successful sale with positive feedback',
      balanceAfter: currentScore - 7,
      transactionId: 1003
    },
    {
      id: 5,
      date: '2025-01-01T12:00:00',
      type: 'bonus',
      points: 0,
      description: 'Account created - Starting balance',
      balanceAfter: 100
    }
  ];
}