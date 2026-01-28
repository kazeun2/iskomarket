import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { LazyImage } from './LazyImage';
import { Heart, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ForACauseItem {
  id: number;
  title: string;
  description: string;
  cause: string;
  price: number;
  category: string;
  image: string;
  seller: any;
  organization: string;
  goalAmount: number;
  raisedAmount: number;
  supporters: number;
  verificationStatus?: 'pending' | 'approved' | 'declined';
  verificationFeedback?: string;
}

interface ForACauseGridProps {
  items: any[];
  onItemClick: (item: any) => void;
}

export function ForACauseGrid({ items, onItemClick }: ForACauseGridProps) {
  // IDs for special styling
  const TRENDING_ID = 201; // Homemade Brownies
  const NEARLY_COMPLETE_ID = 205; // Premium Coffee Beans

  const isSpecial = (id: number) => id === TRENDING_ID || id === NEARLY_COMPLETE_ID;
  const isTrending = (id: number) => id === TRENDING_ID;
  const isNearlyComplete = (id: number) => id === NEARLY_COMPLETE_ID;

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <Heart className="h-12 w-12 mx-auto text-[#FFB300]" />
        </div>
        <h3 className="text-lg text-muted-foreground mb-2">No cause items found</h3>
        <p className="text-muted-foreground">Check back later for fundraising opportunities</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {items.map((item) => {
        const progress = item.goalAmount ? (item.raisedAmount / item.goalAmount) * 100 : 0;
        const special = isSpecial(item.id);

        return (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className={`
              group cursor-pointer rounded-xl overflow-hidden transition-all duration-200 ease-in-out
              ${special 
                ? 'border-2 border-[#FFB300]/40 bg-card dark:bg-card shadow-[0_4px_8px_rgba(255,182,74,0.35)] hover:shadow-[0_8px_20px_rgba(255,182,74,0.35)] hover:scale-105 hover:-translate-y-1' 
                : 'border border-[#2E7D32]/20 bg-card dark:bg-card hover:shadow-[0_8px_20px_rgba(46,125,50,0.2)] hover:scale-105 hover:-translate-y-1'
              }
            `}
          >
            {/* Image - Exact match to CvSU Market cards with lazy loading */}
            <div className="aspect-square w-full overflow-hidden bg-muted relative">
              <LazyImage
                src={item.image || item.images?.[0]}
                alt={item.title}
                className=""
                aspectRatio="1/1"
                objectFit="cover"
              />
              
              {/* Tags Container - Social Media Inspired Horizontal Layout */}
              <div className="absolute z-20 flex items-center" style={{ top: '8px', left: '8px', gap: '4px', flexWrap: 'wrap', maxWidth: 'calc(100% - 16px)' }}>
                {/* Special Badge for Trending/Nearly Complete - Social Media Style */}
                {special && (
                  <>
                    {isTrending(item.id) && (
                      <div
                        className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                        style={{
                          height: '19px',
                          padding: '0 8px',
                          borderRadius: '30px',
                          backdropFilter: 'blur(7px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                          opacity: 0.9
                        }}
                      >
                        {/* Light Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-0 opacity-100"
                          style={{
                            background: 'rgba(255, 255, 255, 0.45)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Dark Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-100 opacity-0"
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Orange accent bar */}
                        <div
                          className="absolute left-[6px] transition-all duration-150"
                          style={{
                            width: '2px',
                            height: '70%',
                            background: '#FF8A00',
                            borderRadius: '1px',
                            top: '15%'
                          }}
                        />
                        <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">Trending</span>
                        </span>
                      </div>
                    )}
                    {isNearlyComplete(item.id) && (
                      <div
                        className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                        style={{
                          height: '19px',
                          padding: '0 8px',
                          borderRadius: '30px',
                          backdropFilter: 'blur(7px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                          opacity: 0.9
                        }}
                      >
                        {/* Light Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-0 opacity-100"
                          style={{
                            background: 'rgba(255, 255, 255, 0.45)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Dark Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-100 opacity-0"
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Orange accent bar */}
                        <div
                          className="absolute left-[6px] transition-all duration-150"
                          style={{
                            width: '2px',
                            height: '70%',
                            background: '#FF8A00',
                            borderRadius: '1px',
                            top: '15%'
                          }}
                        />
                        <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">Nearly Complete</span>
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Verification Badge - Social Media Style */}
                {!special && (
                  <>
                    {item.verificationStatus === 'approved' && (
                      <div
                        className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                        style={{
                          height: '19px',
                          padding: '0 8px',
                          borderRadius: '30px',
                          backdropFilter: 'blur(7px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                          opacity: 0.9
                        }}
                      >
                        {/* Light Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-0 opacity-100"
                          style={{
                            background: 'rgba(255, 255, 255, 0.45)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Dark Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-100 opacity-0"
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Green accent bar */}
                        <div
                          className="absolute left-[6px] transition-all duration-150"
                          style={{
                            width: '2px',
                            height: '70%',
                            background: '#22C55E',
                            borderRadius: '1px',
                            top: '15%'
                          }}
                        />
                        <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">Verified</span>
                        </span>
                      </div>
                    )}
                    {item.verificationStatus === 'pending' && (
                      <div
                        className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                        style={{
                          height: '19px',
                          padding: '0 8px',
                          borderRadius: '30px',
                          backdropFilter: 'blur(7px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                          opacity: 0.9
                        }}
                      >
                        {/* Light Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-0 opacity-100"
                          style={{
                            background: 'rgba(255, 255, 255, 0.45)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Dark Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-100 opacity-0"
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Amber accent bar */}
                        <div
                          className="absolute left-[6px] transition-all duration-150"
                          style={{
                            width: '2px',
                            height: '70%',
                            background: '#F59E0B',
                            borderRadius: '1px',
                            top: '15%'
                          }}
                        />
                        <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">Pending</span>
                        </span>
                      </div>
                    )}
                    {item.verificationStatus === 'declined' && (
                      <div
                        className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                        style={{
                          height: '19px',
                          padding: '0 8px',
                          borderRadius: '30px',
                          backdropFilter: 'blur(7px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                          opacity: 0.9
                        }}
                      >
                        {/* Light Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-0 opacity-100"
                          style={{
                            background: 'rgba(255, 255, 255, 0.45)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Dark Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-100 opacity-0"
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Red accent bar */}
                        <div
                          className="absolute left-[6px] transition-all duration-150"
                          style={{
                            width: '2px',
                            height: '70%',
                            background: '#EF4444',
                            borderRadius: '1px',
                            top: '15%'
                          }}
                        />
                        <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">Not Verified</span>
                        </span>
                      </div>
                    )}
                    {!item.verificationStatus && (
                      <div
                        className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                        style={{
                          height: '19px',
                          padding: '0 8px',
                          borderRadius: '30px',
                          backdropFilter: 'blur(7px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                          opacity: 0.9
                        }}
                      >
                        {/* Light Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-0 opacity-100"
                          style={{
                            background: 'rgba(255, 255, 255, 0.45)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Dark Mode Glass Background */}
                        <div
                          className="absolute inset-0 dark:opacity-100 opacity-0"
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '30px',
                          }}
                        />
                        {/* Orange accent bar */}
                        <div
                          className="absolute left-[6px] transition-all duration-150"
                          style={{
                            width: '2px',
                            height: '70%',
                            background: '#FF8A00',
                            borderRadius: '1px',
                            top: '15%'
                          }}
                        />
                        <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">For a Cause</span>
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Content - Exact match to CvSU Market cards */}
            <div className="p-2">
              {/* Title - Same font size as CvSU Market */}
              <h4 className="text-[10px] sm:text-xs line-clamp-2 leading-tight mb-1 text-foreground">
                {item.title}
              </h4>

              {/* Price - Match CvSU Market styling */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs sm:text-sm ${special ? 'text-[#F57C00]' : 'text-[#2E7D32]'}`}>
                  ₱{item.price.toLocaleString()}
                </span>
                {!special && (
                  <Badge variant="secondary" className="text-[7px] px-1 py-0 bg-[#2E7D32]/10 text-[#2E7D32]">
                    Fundraiser
                  </Badge>
                )}
              </div>

              {/* Progress Bar - Consistent styling */}
              <div className="space-y-1">
                <div className={`rounded-full overflow-hidden ${special ? 'h-1.5 bg-gray-200 dark:bg-gray-700' : 'h-1.5 bg-gray-200 dark:bg-gray-700'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      special 
                        ? 'bg-gradient-to-r from-[#FFB300] to-[#F57C00]' 
                        : 'bg-[#2E7D32]'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-[8px]">
                  <span className={special ? 'text-[#F57C00]' : 'text-[#2E7D32]'}>
                    ₱{item.raisedAmount?.toLocaleString() || 0}
                  </span>
                  <span className="text-muted-foreground">
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
