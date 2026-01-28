import React from "react";
import { Eye, MapPin, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LazyImage } from "./LazyImage";
import { StarRating } from "./StarRating";
import { TrustworthyBadge } from "./TrustworthyBadge";
import { CreditScoreBadge } from "./CreditScoreBadge";
import { RankTierCompact } from "./RankTier";
import { ForCauseBadge } from './ForCauseBadge'

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category?: string | { name?: string };
  images: string[];
  seller: {
    id: number;
    username?: string;
    name?: string;
    program: string;
    rating: number;
    totalRatings: number;
    creditScore: number;
    avatar: string;
    reviews: Array<{
      buyerId: number;
      rating: number;
      comment: string;
      date: string;
    }>;
  };
  condition: string;
  location: string;
  datePosted: string;
  views: number;
  interested: number;
  goalAmount?: number;
  raisedAmount?: number;
  supporters?: number;
}

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onSellerClick?: (seller: any) => void;
}

export function ProductGrid({
  products,
  onProductClick,
  onSellerClick,
}: ProductGridProps) {
  // IDs for special For a Cause styling
  const TRENDING_ID = 201; // Homemade Brownies
  const NEARLY_COMPLETE_ID = 205; // Premium Coffee Beans

  const isForACause = (product: Product) =>
    (product.category && ((product as any).category.name || product.category) === "For a Cause");
  const isSpecialCause = (product: any) => {
    return (
      isForACause(product) &&
      (product.id === TRENDING_ID ||
        product.id === NEARLY_COMPLETE_ID)
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Brand New":
        return { border: "#FF8A00", text: "#FF8A00" };
      case "Like New":
        return { border: "#FF8A00", text: "#FF8A00" };
      case "Good":
        return { border: "#FF8A00", text: "#FF8A00" };
      case "Fair":
        return { border: "#FF8A00", text: "#FF8A00" };
      default:
        return { border: "#FF8A00", text: "#FF8A00" };
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <Eye className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg text-muted-foreground mb-2">
          No products found
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div 
      className="relative"
      style={{
        borderRadius: "24px",
        padding: "14px 20px 18px 20px",
        marginBottom: "22px"
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

      {/* Noise Overlay - Dark Mode */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-[0.11] opacity-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.11'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
          borderRadius: "24px",
        }}
      />

      {/* Noise Overlay - Light Mode */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.07'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
          borderRadius: "24px",
        }}
      />

      <div className="relative z-10" style={{ marginTop: '10px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2" style={{ paddingTop: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(0,128,0,0.18)', marginBottom: '14px' }}>
          <h2 className="dark:text-[#C7FFD9] text-[#0A4D28]" style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '0.2px' }}>
            Posted Products
          </h2>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ gap: '16px', rowGap: '14px' }}>
          {products.map((product) => {
            const isSpecial = isSpecialCause(product);
            const progress = product.goalAmount
              ? ((product.raisedAmount || 0) / product.goalAmount) *
                100
              : 0;

            return (
              <Card
                key={product.id}
                className="cursor-pointer overflow-hidden border-0 shadow-none bg-transparent group flex flex-col relative transition-all duration-200"
                style={{
                  borderRadius: "14px",
                }}
                onClick={() => onProductClick(product)}
              >
                {/* Premium Card Background - Dark Mode Glassmorphism */}
                <div
                  className="absolute inset-0 dark:opacity-100 opacity-0 transition-all duration-200 group-hover:translate-y-[-4px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #0d2b20 0%, #081c15 100%)",
                    border:
                      "1.4px solid rgba(0, 255, 150, 0.10)",
                    borderRadius: "14px",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.06)",
                    backdropFilter: "blur(18px)",
                  }}
                />

                {/* Premium Card Background - Light Mode */}
                <div
                  className="absolute inset-0 dark:opacity-0 opacity-100 transition-all duration-200 group-hover:translate-y-[-3px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFFFFF 0%, #F6FFF9 100%)",
                    borderRadius: "14px",
                    border:
                      "1.5px solid rgba(0, 130, 60, 0.12)",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.06)",
                    backdropFilter: "blur(16px)",
                  }}
                />

                {/* Hover Glow Effect - Dark Mode */}
                <div
                  className="absolute inset-0 dark:opacity-0 dark:group-hover:opacity-100 opacity-0 transition-all duration-200 pointer-events-none"
                  style={{
                    borderRadius: "14px",
                    boxShadow:
                      "0 4px 8px rgba(0,0,0,0.12)",
                    transform: "translateY(-4px)",
                  }}
                />

                {/* Hover Glow Effect - Light Mode */}
                <div
                  className="absolute inset-0 dark:opacity-0 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
                  style={{
                    borderRadius: "14px",
                    boxShadow:
                      "0 4px 8px rgba(0,0,0,0.12)",
                    transform: "translateY(-3px)",
                  }}
                />

                <div className="relative z-10 flex flex-col h-full" style={{ padding: '12px' }}>
                  {/* Product Image */}
                  <div
                    className="relative w-full flex-shrink-0 overflow-hidden bg-muted"
                    style={{
                      borderRadius: "12px",
                      aspectRatio: '1',
                      height: 'auto',
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <LazyImage
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      aspectRatio="1/1"
                      objectFit="cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-40" />

                    {/* Special Badge for Trending/Nearly Complete - Social Media Style */}
                    {isSpecial && (
                      <div className="absolute z-20 flex items-center" style={{ top: '8px', left: '8px', gap: '4px', flexWrap: 'wrap', maxWidth: 'calc(100% - 16px)' }}>
                        {product.id === TRENDING_ID && (
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
                        {product.id === NEARLY_COMPLETE_ID && (
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
                      </div>
                    )}

                    {/* Regular Badges - Social Media Style */}
                    {!isSpecial && (
                      <div className="absolute z-20 flex items-center" style={{ top: '8px', left: '8px', gap: '4px', flexWrap: 'wrap', maxWidth: 'calc(100% - 16px)' }}>
                        {/* Condition Badge */}
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
                          {/* Emerald accent bar */}
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
                          <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                            <span className="dark:text-[#F3F3F3] dark:opacity-85">{product.condition}</span>
                          </span>
                        </div>

                        {/* For a Cause Badge (if applicable) */}
                        {((product as any).is_for_cause || (product as any).goalAmount) && (
                          <div className="ml-2 mt-1">
                            <ForCauseBadge status="approved" forSeller={false} />
                          </div>
                        )}

                        {/* Category Badge */}
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
                          {/* Emerald accent bar */}
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
                          <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                            <span className="dark:text-[#F3F3F3] dark:opacity-85">{typeof product.category === 'object' ? (product.category?.name ?? '') : (product.category ?? '')}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col" style={{ paddingTop: '6px' }}>
                    {/* Title */}
                    <h3 className="line-clamp-2 leading-tight text-[#064B2F] dark:text-[#CFFFE8]" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      {product.title}
                    </h3>

                    {/* Price */}
                    <div
                      className={isSpecial ? "text-[#F57C00]" : "text-[#0A7F4F] dark:text-[#7AFFC7]"}
                      style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: isSpecial ? '#F57C00' : 'rgb(21, 128, 61)' }}
                    >
                      {formatPrice(product.price)}
                    </div>

                    {/* Progress Bar for Special Cause Items */}
                    {isSpecial && (
                      <div className="space-y-1.5 mt-auto">
                        <div 
                          className="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                          style={{
                            height: '6px',
                            borderRadius: '4px'
                          }}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-[#FFB300] to-[#F57C00] rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between" style={{ fontSize: '9px' }}>
                          <span className="text-[#F57C00] font-medium">
                            ₱{(product.raisedAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Regular Product Info */}
                    {!isSpecial && (
                      <>
                        {/* Location */}
                        <div className="flex items-center text-muted-foreground" style={{ gap: '4px', fontSize: '11px', marginBottom: '6px' }}>
                          <MapPin className="flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                          <span className="truncate">
                            {product.location}
                          </span>
                        </div>

                        {/* Seller Info */}
                        <div
                          className="flex items-center pt-2 mt-auto cursor-pointer hover:bg-muted/50 transition-colors border-t dark:border-white/5 border-white/5"
                          style={{ gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.seller) onSellerClick?.(product.seller);
                          }}
                        >
                          <Avatar className="w-6 h-6 rounded-full flex-shrink-0 ring-1 ring-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {(() => {
                                const sellerName = product.seller?.username || product.seller?.name || 'M';
                                return sellerName.split(" ").map((n) => n[0] || '').join("");
                              })()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-0.5">
                              <Star className="fill-yellow-400 text-yellow-400 flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                              <span style={{ fontSize: '11px' }}>
                                {(product.seller?.rating ?? 0).toFixed(1)}
                              </span>
                              <span className="text-muted-foreground" style={{ fontSize: '9px' }}>
                                ({product.seller?.totalRatings ?? 0})
                              </span>
                            </div>

                            <TrustworthyBadge
                              creditScore={product.seller?.creditScore ?? (product.seller as any)?.credit_score ?? 700}
                              size="sm"
                              variant="icon-only"
                            />
                          </div>
                        </div>
                      </>
                    )}
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