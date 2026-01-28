import React from 'react';
import Modal from './Modal';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, Heart, MessageCircle, Edit, Check, FileText } from 'lucide-react';
import { CreditScoreBadge } from './CreditScoreBadge';
import { TrustworthyBadge } from './TrustworthyBadge';

interface PreviewListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onConfirmPost: () => void;
  formData: {
    title: string;
    description: string;
    price: string;
    category?: string;
    category_name?: string;
    condition: string;
    location: string;
    images: File[];
    cause?: string;
    organization?: string;
    goalAmount?: string;
    proofDocument?: File | null;
  };
  currentUser?: any;
  isFundraiser?: boolean;
}

export function PreviewListingModal({
  isOpen,
  onClose,
  onEdit,
  onConfirmPost,
  formData,
  currentUser,
  isFundraiser = false
}: PreviewListingModalProps) {
  const isForACause = isFundraiser || formData.category === "For a Cause";
  const categoryName = formData.category_name || formData.category || '';
  const isForACauseLocal = isFundraiser || categoryName === "For a Cause";

  return (
<Modal open={isOpen} onClose={onClose} title="Preview Your Product" className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col rounded-2xl border border-green-300/40 dark:border-[#14b8a6]/20 bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]">
        <div className="px-6 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-green-200/40 dark:border-emerald-500/20">
        <p className="text-gray-600 dark:text-emerald-400/60">This is how your product will appear to other users</p>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-6">
        {/* Preview Card - Match Posted Product Cards */}
        <div className="glass-card dark:bg-[var(--card)]/40 border border-green-200/40 dark:border-emerald-500/20 rounded-xl overflow-hidden">
          {/* Product Image Section */}
          {formData.images.length > 0 && (
            <div className="relative w-full h-[280px] bg-green-50/30 dark:bg-emerald-950/20 rounded-t-xl overflow-hidden border-b border-green-200/40 dark:border-emerald-500/20">
              <img
                src={URL.createObjectURL(formData.images[0])}
                alt={formData.title}
                className="w-full h-full object-cover rounded-t-xl"
              />
              {/* Gradient overlay for price legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black/40 to-transparent pointer-events-none" />
              
              {/* Price Overlay - Bottom Right */}
              <div className="absolute bottom-3 right-3">
                <div className="text-2xl font-semibold text-green-700 dark:text-emerald-300 drop-shadow-lg">
                  ₱{formData.price ? parseInt(formData.price).toLocaleString() : '0'}
                </div>
                {isForACause && formData.goalAmount && (
                  <div className="text-xs text-green-600 dark:text-emerald-400 text-right mt-0.5">
                    Goal: ₱{parseInt(formData.goalAmount).toLocaleString()}
                  </div>
                )}
              </div>
              
              {/* Multiple Images Indicator */}
              {formData.images.length > 1 && (
                <div className="absolute top-3 right-3 bg-neutral-50 text-green-900 px-2.5 py-1 rounded-full text-xs font-medium">
                  +{formData.images.length - 1} more
                </div>
              )}
            </div>
          )}

          {/* Product Information Section */}
          <div className="p-5 space-y-4">
            {/* Title */}
            <h2 className="text-xl font-semibold text-[#1A1F1A] dark:text-emerald-200 leading-snug">
              {formData.title || 'Your Product Title'}
            </h2>

            {/* Category and Condition Tags */}
            <div className="flex flex-wrap gap-2">
              {categoryName && (
                <Badge 
                  className={isForACauseLocal 
                    ? "bg-[#FFB300] hover:bg-[#FFA000] text-foreground border-0" 
                    : "bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border-0"
                  }
                >
                  {isForACauseLocal ? '💛 For a Cause' : categoryName}
                </Badge>
              )}
              {formData.condition && !isForACause && (
                <Badge className="bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-0">
                  {formData.condition}
                </Badge>
              )}
              {isForACause && formData.proofDocument && (
                <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/40 dark:border-blue-500/20">
                  <FileText className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Fundraiser Cause */}
            {isForACause && formData.cause && (
              <div className="bg-[#FFF8E1] dark:bg-[#FFB300]/10 border border-[#FFB300]/40 dark:border-[#FFB300]/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💛</span>
                  <h3 className="text-sm font-medium text-[#1A1F1A] dark:text-amber-200">Fundraising Cause</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-amber-100/80">{formData.cause}</p>
                {formData.organization && (
                  <p className="text-xs text-gray-600 dark:text-amber-200/60 mt-1">
                    Organization: {formData.organization}
                  </p>
                )}
              </div>
            )}

            {/* Description Section */}
            <div className="pt-4 border-t border-green-200/40 dark:border-emerald-500/20">
              <h3 className="text-sm font-medium text-green-800 dark:text-emerald-300 mb-2">Description</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {formData.description || 'Your product description will appear here...'}
              </p>
            </div>

            {/* Seller Info Section - Match Posted Product Cards */}
            <div className="glass-card dark:bg-emerald-950/20 border border-green-200/40 dark:border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-emerald-900/40 text-green-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                  <span>{currentUser?.name?.charAt(0) || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#1A1F1A] dark:text-emerald-200">{currentUser?.name || 'Your Name'}</p>
                    {currentUser && (currentUser?.creditScore ?? currentUser?.credit_score ?? 0) >= 750 && (
                      <TrustworthyBadge size="sm" creditScore={(currentUser?.creditScore ?? currentUser?.credit_score ?? 70)} />
                    )}
                  </div>
                  <CreditScoreBadge score={currentUser?.creditScore ?? currentUser?.credit_score ?? 700} showLabel={true} />
                </div>
              </div>
              
              {/* Location */}
              {formData.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-emerald-300/70">
                  <MapPin className="h-4 w-4" />
                  <span>{formData.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Match Posted Product Cards */}
          <div className="flex justify-end gap-3 pt-6 pb-4">
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              className="h-10 w-10 rounded-lg border-green-500/40 dark:border-emerald-500/40 text-green-600 dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-emerald-500/10"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="icon"
              className="h-10 w-10 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-foreground shadow-md"
              onClick={onConfirmPost}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
