import React from "react";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { TrustworthyBadge } from "./TrustworthyBadge";

interface FeaturedProduct {
  id: number;
  productId: number;
  userId: number;
  title: string;
  price: number;
  category: string;
  images: string[];
  seller: {
    id: number;
    username: string;
    rating: number;
    avatar?: string;
    glowEffect?: any;
    frameEffect?: any;
    customTitle?: any;
  };
  expiresAt: string;
}

interface FeaturedStudentBusinessProps {
  featuredProducts: FeaturedProduct[];
  currentUser: any;
  onProductClick: (productId: number) => void;
}

export function FeaturedStudentBusiness({
  featuredProducts,
  currentUser,
  onProductClick,
}: FeaturedStudentBusinessProps) {
  if (featuredProducts.length === 0) {
    return null;
  }

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, diffDays);
  };

  return (
    <div
      className="mb-6 relative"
      style={{
        borderRadius: "24px",
        padding: "14px 20px 18px 20px",
      }}
    >
      {/* Dark Mode Background - Premium Fintech Glassmorphism */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-100 opacity-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, #0b1f17 0%, #06150f 100%)",
          borderRadius: "24px",
          border: "1.5px solid rgba(0, 255, 155, 0.18)",
          boxShadow: "0 0 30px rgba(0, 255, 150, 0.12)",
          backdropFilter: "blur(18px)",
        }}
      />

      {/* Light Mode Background Overlay - Enhanced Premium Fintech */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-100 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #F8FFF8 0%, #F3FFF5 100%)",
          borderRadius: "24px",
          border: "1.5px solid rgba(0, 130, 60, 0.15)",
          boxShadow: "0 0 28px rgba(0, 180, 90, 0.18)",
          backdropFilter: "blur(14px)",
        }}
      />

      {/* Vignette Effect - Dark Mode */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-[0.32] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.45) 100%)",
          borderRadius: "24px",
        }}
      />

      {/* Vignette Effect - Light Mode */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-[0.18]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0, 130, 60, 0.08) 100%)",
          borderRadius: "24px",
        }}
      />

      {/* Noise Overlay - Dark Mode - Enhanced Matte Texture */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-[0.11] opacity-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.11'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
          borderRadius: "24px",
        }}
      />

      {/* Noise Overlay - Light Mode - Enhanced Fine Texture */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.07'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
          borderRadius: "24px",
        }}
      />

      <div className="relative z-10" style={{ marginTop: '10px', marginBottom: '22px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2" style={{ paddingTop: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(0,128,0,0.18)', marginBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center relative"
              style={{
                background:
                  "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
                boxShadow:
                  "0 4px 12px rgba(245, 158, 11, 0.35)",
              }}
            >
              <Star className="h-5 w-5 text-foreground fill-white" />
            </div>
            <h2 className="dark:text-[#C7FFD9] text-[#0A4D28]" style={{ fontSize: '16px', fontWeight: 600 }}>
              Featured Student Businesses
            </h2>
          </div>
          <div
            className="relative text-xs px-3 py-1.5"
            style={{
              borderRadius: "16px",
              marginTop: '0px'
            }}
          >
            {/* Dark Mode Badge Background - Premium Neon Glass */}
            <div
              className="absolute inset-0 dark:opacity-100 opacity-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0, 255, 150, 0.12) 0%, rgba(0, 255, 180, 0.12) 100%)",
                border: "1px solid rgba(0, 255, 180, 0.20)",
                borderRadius: "16px",
                boxShadow:
                  "0 0 12px rgba(0, 255, 160, 0.18), inset 0 0 12px rgba(0, 255, 150, 0.08)",
                backdropFilter: "blur(18px)",
              }}
            />
            {/* Light Mode Badge Background - Premium Glassy */}
            <div
              className="absolute inset-0 dark:opacity-0 opacity-100"
              style={{
                background:
                  "linear-gradient(135deg, #E9FFF0 0%, #D4F7E3 100%)",
                border: "1.5px solid rgba(0, 120, 60, 0.20)",
                borderRadius: "16px",
                backdropFilter: "blur(12px)",
                boxShadow:
                  "0 0 10px rgba(0, 160, 80, 0.12), inset 0 0 10px rgba(0, 120, 60, 0.06)",
              }}
            />
            <div className="flex items-center gap-1.5 relative z-10">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="dark:text-[#C7FFD9] text-[#0A4D28]">
                Premium Spotlight
              </span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ gap: '16px', rowGap: '14px' }}>
          {featuredProducts.map((featured) => {
            const daysRemaining = getDaysRemaining(
              featured.expiresAt,
            );
            const isOwner = currentUser?.id === featured.userId;
            // customTitle feature removed; no longer displaying custom titles

            return (
              <Card
                key={featured.id}
                className="overflow-hidden border-0 shadow-none bg-transparent cursor-pointer relative group flex flex-col transition-all duration-160"
                style={{
                  borderRadius: "20px",
                }}
                onClick={() =>
                  onProductClick(featured.productId)
                }
              >
                {/* Premium Card Background - Dark Mode Glassmorphism */}
                <div
                  className="absolute inset-0 dark:opacity-100 opacity-0 transition-all duration-160 group-hover:translate-y-[-4px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #0d2b20 0%, #081c15 100%)",
                    border:
                      "1.4px solid rgba(0, 255, 150, 0.10)",
                    borderRadius: "20px",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.08)",
                    backdropFilter: "blur(18px)",
                  }}
                />

                {/* Premium Card Background - Light Mode with Elevated Glassmorphism */}
                <div
                  className="absolute inset-0 dark:opacity-0 opacity-100 transition-all duration-150 group-hover:translate-y-[-3px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFFFFF 0%, #F6FFF9 100%)",
                    borderRadius: "20px",
                    border:
                      "1.5px solid rgba(0, 130, 60, 0.12)",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.08)",
                    backdropFilter: "blur(16px)",
                  }}
                />

                {/* Hover Glow Effect - Dark Mode - Neon Emerald */}
                <div
                  className="absolute inset-0 dark:opacity-0 dark:group-hover:opacity-100 opacity-0 transition-all duration-160 pointer-events-none"
                  style={{
                    borderRadius: "20px",
                    boxShadow:
                      "0 0 28px rgba(0, 255, 160, 0.18), 0 4px 20px rgba(0, 255, 150, 0.12)",
                    transform: "translateY(-4px)",
                  }}
                />

                {/* Hover Glow Effect - Light Mode */}
                <div
                  className="absolute inset-0 dark:opacity-0 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none"
                  style={{
                    borderRadius: "20px",
                    boxShadow:
                      "0 0 26px rgba(0, 175, 85, 0.18)",
                    transform: "translateY(-3px)",
                  }}
                />

                <div className="relative z-10 flex flex-col h-full" style={{ padding: '12px' }}>
                  {/* Product Image - Enhanced with Premium Depth */}
                  <div
                    className="w-full overflow-hidden relative flex-shrink-0"
                    style={{
                      borderRadius: "12px",
                      aspectRatio: '1',
                      height: 'auto'
                    }}
                  >
                    {/* Tags Container - Social Media Inspired Horizontal Layout */}
                    <div className="absolute z-20 flex items-center" style={{ top: '8px', left: '8px', gap: '4px', flexWrap: 'wrap', maxWidth: 'calc(100% - 16px)' }}>
                      {/* Featured Badge - Social Media Style */}
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
                        {/* Orange accent bar on left */}
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
                        <span 
                          className="relative z-10"
                          style={{ 
                            fontSize: '10.5px',
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            color: '#2E2E2E',
                            paddingLeft: '6px'
                          }}
                        >
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">Featured</span>
                        </span>
                      </div>

                      {/* Category Badge - Social Media Style */}
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
                        {/* Emerald accent bar on left */}
                        <div
                          className="absolute left-[6px] transition-all duration-150"
                          style={{
                            width: '2px',
                            height: '70%',
                            background: '#10B981',
                            borderRadius: '1px',
                            top: '15%'
                          }}
                        />
                        <span 
                          className="relative z-10"
                          style={{ 
                            fontSize: '10.5px',
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            color: '#2E2E2E',
                            paddingLeft: '6px'
                          }}
                        >
                          <span className="dark:text-[#F3F3F3] dark:opacity-85">{featured.category}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div
                      className="absolute inset-0 dark:opacity-100 opacity-0"
                      style={{
                        boxShadow:
                          "inset 0 2px 6px rgba(0, 0, 0, 0.08), 0 6px 16px rgba(0, 0, 0, 0.45)",
                      }}
                    />
                    <div
                      className="absolute inset-0 dark:opacity-0 opacity-100"
                      style={{
                        boxShadow:
                          "inset 0 2px 6px rgba(0, 0, 0, 0.08), 0 4px 14px rgba(0, 0, 0, 0.08)",
                      }}
                    />
                    <ImageWithFallback
                      src={featured.images[0]}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{
                        filter:
                          "saturate(1.03) contrast(1.04) brightness(1.01)",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="flex-1 flex flex-col" style={{ paddingTop: '6px' }}>
                    {/* Title */}
                    <h3 className="line-clamp-2 leading-tight text-[#064B2F] dark:text-[#CFFFE8]" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      {featured.title}
                    </h3>

                    {/* Price */}
                    <div className="text-[#0A7F4F] dark:text-[#7AFFC7]" style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'rgb(21, 128, 61)' }}>
                      ₱{featured.price.toLocaleString()}
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-muted-foreground" style={{ gap: '4px', fontSize: '11px', marginBottom: '6px' }}>
                      <MapPin className="flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                      <span className="truncate">
                        Gate 1
                      </span>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center pt-2 mt-auto border-t dark:border-white/5 border-white/5" style={{ gap: '4px' }}>
                      <Avatar className="w-6 h-6 rounded-full flex-shrink-0 ring-1 ring-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {featured.seller.username
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-0.5">
                          <Star className="fill-yellow-400 text-yellow-400 flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                          <span style={{ fontSize: '11px' }}>
                            {(featured.seller?.rating ?? 0).toFixed(1)}
                          </span>
                          <span className="text-muted-foreground" style={{ fontSize: '9px' }}>
                            (15)
                          </span>
                        </div>

                        <TrustworthyBadge
                          creditScore={850}
                          size="sm"
                          variant="icon-only"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
