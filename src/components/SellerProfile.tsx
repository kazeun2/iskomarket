import React, { useEffect, useRef, useState } from "react";
import { X, Star, MapPin, Package, Flag, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { StarRating } from "./StarRating";
import { TrustworthyBadge } from "./TrustworthyBadge";
import { RankTierCompact } from "./RankTier";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { UsernameWithGlow } from "./UsernameWithGlow";

interface SellerProfileProps {
  seller: any;
  sellerProducts?: any[];
  onClose?: () => void;
  onProductClick?: (product: any) => void;
  currentUser?: any;
  isAdmin?: boolean;
  onReport?: (seller: any) => void;
  onDelete?: (seller: any) => void;
  noBackdrop?: boolean;
}

export function SellerProfile({
  seller,
  sellerProducts = [],
  onClose = () => {},
  onProductClick = () => {},
  currentUser,
  isAdmin = false,
  onReport,
  onDelete,
  noBackdrop = false,
}: SellerProfileProps) {
  const [showCreditScoreModal, setShowCreditScoreModal] = useState(false);
  const avatarRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showCreditScoreModal) {
      try { avatarRef.current?.focus(); } catch {}
    }
  }, [showCreditScoreModal]);

  useEffect(() => { try { avatarRef.current?.focus(); } catch {} }, []);

  const formatPrice = (price?: number) => {
    if (price == null) return "";
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Brand New": return "bg-emerald-50/70 text-emerald-700";
      case "Like New": return "bg-blue-50/70 text-blue-700";
      case "Good": return "bg-amber-50/70 text-amber-700";
      case "Fair": return "bg-orange-50/70 text-orange-700";
      default: return "bg-[var(--surface-soft)]/70 text-gray-700";
    }
  };

  const content = (
    <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[24px] bg-[var(--card)] p-0">
      <div className="flex flex-col h-full min-h-0 bg-white dark:bg-[var(--card)]">
        <div className="flex items-center justify-between px-6 py-4 rounded-t-[24px] border-b">
          <h2 className="text-lg text-[#003300] dark:text-white">Profile</h2>
          <div className="flex items-center gap-2">
            {onReport && (
              <Button variant="ghost" size="icon" title="Report" onClick={() => onReport(seller)}>
                <Flag className="h-4 w-4" />
              </Button>
            )}
            {isAdmin && onDelete && (
              <Button variant="ghost" size="icon" title="Delete" onClick={() => onDelete(seller)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto pb-8 px-6 py-5">
          <div className="space-y-5">
            <section>
              <div className="rounded-[12px] p-4 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-start gap-4">
                  <button ref={avatarRef} type="button" className="p-0 bg-transparent" onClick={() => { if (isAdmin) setShowCreditScoreModal(true); }}>
                    <Avatar className="h-14 w-14">
                      <AvatarFallback>{(seller?.username || seller?.name || "S").toString().split(" ").map((n: any) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                  </button>

                  <div className="flex-1">
                    <div className="mb-2">
                      <h3 className="text-md font-semibold">{seller?.username || seller?.name}</h3>
                      <div className="text-xs text-gray-500"><UsernameWithGlow username={seller?.username} /></div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <RankTierCompact creditScore={seller?.creditScore || 70} />
                      <TrustworthyBadge creditScore={seller?.creditScore || 70} size="md" />
                    </div>

                    <div className="mt-3 text-sm text-gray-600">{seller?.program}</div>
                    {seller?.bio && <p className="mt-2 text-xs text-gray-500">{seller.bio}</p>}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm mb-3">Rating & Reviews</h4>
              <Card>
                <CardContent>
                  <div className="mb-4">
                    <StarRating rating={seller?.rating ?? 0} totalRatings={seller?.totalRatings ?? 0} size="lg" />
                  </div>
                  <div className="space-y-3">
                    {(seller?.reviews && seller.reviews.length > 0) ? (
                      seller.reviews.slice(0,3).map((r: any, i: number) => (
                        <div key={i} className="rounded p-3 border">
                          <div className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</div>
                          <p className="mt-1 text-sm">{r.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No reviews yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h4 className="text-sm mb-3">Current Products</h4>
              <Card>
                <CardContent>
                  {sellerProducts.length > 0 ? (
                    <div className="space-y-2">
                      {sellerProducts.map((product: any) => (
                        <div key={product.id} className="flex items-center gap-3 p-3 rounded border" onClick={() => { onProductClick(product); onClose && onClose(); }}>
                          <ImageWithFallback src={product.images?.[0]} alt={product.title} className="w-12 h-12 rounded" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.title}</div>
                            <div className="text-xs text-primary">{formatPrice(product.price)}</div>
                          </div>
                          <div className="text-xs text-gray-500">{product.location}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No active products.</div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <h4 className="text-sm mb-3">Contact Information</h4>
              <Card>
                <CardContent>
                  <div className="text-xs">Program: <span className="text-gray-600">{seller?.program}</span></div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  if (noBackdrop) return content;

  return (
    <div
      className="fixed inset-0 bg-white dark:backdrop-blur-sm flex items-start justify-center p-6 overflow-auto"
      style={{ zIndex: isAdmin ? 20000 : 12000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {content}
    </div>
  );
}