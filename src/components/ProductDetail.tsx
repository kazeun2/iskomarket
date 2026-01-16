import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Flag, MessageCircle, Star, ChevronRight, Info, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StarRating } from './StarRating';
import { ChatModal } from './ChatModal';
import { MeetupReminderModal } from './MeetupReminderModal';
import { toast } from 'sonner';
import { UsernameWithGlow } from './UsernameWithGlow';
import { updateCreditScore } from '../lib/services/users';
import { createTransaction, updateMeetupDetails, getPendingTransactions } from '../lib/services/transactions';
import { agreeMeetupAndNotify } from '../lib/actions/meetup';
import { sendMessage } from '../services/messageService';
import { useAuth } from '../contexts/AuthContext';
import { isExampleMode } from '../utils/exampleMode';
import { EditListingModal } from './EditListingModal';
import { updateProduct, deleteProduct as deleteProductService, deleteProductById } from '../lib/services/products';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

interface ProductDetailProps {
  product: any;
  onClose: () => void;
  meetupLocations: string[];
  onSellerClick?: (seller: any) => void;
  currentUser?: any;
  userType?: string;
  onDeleteProduct?: (product: any) => void;
  onProductUpdated?: (product: any) => void; // optional callback to notify parent of updates
  onProductDeleted?: (productId: number) => void; // optional callback to notify parent of deletion
  onRequestEdit?: (product: any) => void; // ask parent to open the edit modal at app level
}

export function ProductDetail({ product, onClose, meetupLocations, onSellerClick, currentUser, userType, onDeleteProduct, onProductUpdated, onProductDeleted, onRequestEdit }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showMeetupReminder, setShowMeetupReminder] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Local editable copy of product so we can reflect updates immediately
  const [displayProduct, setDisplayProduct] = useState(product);
  useEffect(() => setDisplayProduct(product), [product]);

  // Edit modal state
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // When opening the edit modal locally, hide the ProductDetail visually so the edit modal appears without the underlying overlay
  const [closingForEdit, setClosingForEdit] = useState(false);
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Auth helper
  const { refreshUser } = useAuth();

  // Derived role/ownership
  const isAdmin = userType === 'admin';
  const isOwner = Boolean(
    currentUser && (
      (displayProduct.seller && (currentUser.id === displayProduct.seller.id)) ||
      (displayProduct.seller_id && currentUser.id === displayProduct.seller_id)
    )
  );

  // Track if any secondary modal is open
  const isSecondaryModalOpen = showReportDialog || showRatingDialog || showAllReviews || showChat || showMeetupReminder || showSellerProfile;

  // IDs for special For a Cause styling
  const TRENDING_ID = 201;
  const NEARLY_COMPLETE_ID = 205;
  
  const categoryName = displayProduct?.category && typeof displayProduct.category === 'object' ? displayProduct.category?.name : displayProduct?.category;
  const isForACause = categoryName === 'For a Cause';
  const isSpecialCause = isForACause && (displayProduct?.id === TRENDING_ID || displayProduct?.id === NEARLY_COMPLETE_ID);
  const progress = displayProduct?.goalAmount ? ((displayProduct.raisedAmount || 0) / displayProduct.goalAmount) * 100 : 0;

  // Centralized permission helpers
  // Only the owner may edit their product. Admins may delete non-owner listings but should not edit non-owned listings.
  const canEdit = Boolean(isOwner);
  const canDelete = Boolean(isAdmin || isOwner);
  const isAdminDelete = Boolean(isAdmin && !isOwner);

  // Lock body scroll when modal is open
  useEffect(() => {
    // Mark body as modal-open so global dialog-originating CSS rules apply consistently
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Scroll to top when modal first opens
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  // Mock reviews data
  const allReviews = isExampleMode(currentUser) ? [
    {
      id: 1,
      rating: 5,
      comment: "Great seller! Fast response and item was exactly as described.",
      date: "12/28/2024",
      buyerName: "JohnD"
    },
    {
      id: 2,
      rating: 4,
      comment: "Good communication, smooth transaction",
      date: "12/20/2024",
      buyerName: "SarahM"
    },
    {
      id: 3,
      rating: 5,
      comment: "Highly recommended! Very professional and responsive.",
      date: "12/15/2024",
      buyerName: "MikeR"
    }
  ] : [];

  const recentReviews = allReviews.slice(0, 2);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Brand New': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'Like New': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'Good': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
      case 'Fair': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700';
      default: return 'bg-gray-100 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  // Scroll to top of modal content when secondary dialogs open (do NOT change page scroll)
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleContactSeller = () => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      setShowMeetupReminder(true);
    });
  };

  const handleAgreeMeetup = async () => {
    setShowMeetupReminder(false);
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'instant' });

    const meetupLocation =
      displayProduct.location || displayProduct.meetupLocation || 'Main Gate, Cavite State University';

    const buyerId = currentUser?.id;
    const sellerId = displayProduct.seller?.id || displayProduct.seller_id;

    try {
      if (!buyerId || !sellerId) {
        console.warn('Cannot persist meetup - missing buyer or seller id');
        toast.error('Could not save meet-up details. Please try again.');
        return;
      }

      // Meet-up backend creation disabled while transactions schema is being stabilized.
      // Record locally and open chat so users can coordinate directly.
      toast.info('Meet-up scheduling is temporarily disabled. Opening chat so you can coordinate with the seller.');
    } catch (err: any) {
      console.error('Local handleAgreeMeetup error:', err);
      toast.error('Could not schedule meet-up locally. Please try again.');
    } finally {
      // Open chat so users can continue conversation immediately
      requestAnimationFrame(() => {
        setShowChat(true);
      });
    }
  };

  const handleReport = () => {
    if (!reportReason) {
      toast.error('Please select a reason for reporting');
      return;
    }
    
    toast.success('Report submitted successfully', {
      description: 'Our team will review your report within 24 hours.'
    });
    
    setReportReason('');
    setReportDescription('');
    setShowReportDialog(false);
  };

  const handleRatingSubmit = async () => {
    if (userRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      // Persist the rating/review to backend (omitted here) and award a credit to the rater
      if (currentUser && currentUser.id) {
        await updateCreditScore(String(currentUser.id), 1, 'Submitted rating', 'increase');
      }

      // Refresh auth profile if available
      if (typeof refreshUser === 'function') {
        await refreshUser();
      }

      toast.success('Thank you for rating this seller!', {
        description: `Rating: ${userRating} star${userRating !== 1 ? 's' : ''}`
      });
    } catch (err: any) {
      console.error('Error updating credit score:', err);
      toast.error('Failed to update credit score');
    } finally {
      setUserRating(0);
      setRatingComment('');
      setShowRatingDialog(false);
    }
  };



  const openRatingDialog = () => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      setShowRatingDialog(true);
    });
  };

  const openReportDialog = () => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      setShowReportDialog(true);
    });
  };

  const openDeleteDialog = () => {
    // Call parent's onDeleteProduct to show "Confirm Product Deletion" modal
    if (onDeleteProduct) {
      onDeleteProduct(displayProduct);
    }
  };

  // Save handler for Edit Listing modal - reuse server update logic
  const handleEditSave = async (updatedListing: any) => {
    try {
      // Persist on server (backend enforces ownership/admin via RLS)
      const updates: any = {
        title: updatedListing.title,
        price: Number(updatedListing.price),
        description: updatedListing.description,
        category: updatedListing.category,
        condition: updatedListing.condition,
        location: updatedListing.location,
      };

      // If an image was provided, send it as an images array so the service persists it
      if (updatedListing.image) {
        updates.images = [updatedListing.image];
      }

      const updated = await updateProduct(String(updatedListing.id), updates);

      setDisplayProduct(updated);
      toast.success('Product updated successfully!');
      setShowEditModal(false);

      if (typeof (onProductUpdated) === 'function') onProductUpdated(updated);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update product');
    }
  };

  const openAllReviews = () => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      setShowAllReviews(true);
    });
  };

  const modalContent = (
    <>
      <div 
        data-product-detail="true"
        data-product-id={String(displayProduct?.id ?? '')}
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-300 ${
          isSecondaryModalOpen ? 'z-[9999]' : 'z-[10000]'
        } ${closingForEdit ? 'opacity-0 pointer-events-none scale-95 transition-all duration-[var(--default-transition-duration)]' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
      {/* Premium Glassmorphism Container */}
      <div 
        className={`relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[32px] bg-white product-detail-radial dark:bg-[#0a120e]/65 border-[1.5px] border-[rgba(0,0,0,0.06)] dark:border-[rgba(0,255,180,0.15)] animate-in zoom-in-95 duration-300 transition-opacity duration-200 ${
          isSecondaryModalOpen ? 'opacity-60' : 'opacity-100'
        }`}
        style={{
          boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 18px rgba(0,255,180,0.15)'
        }}
      >
        {/* Close Button - Floating Top Right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 h-10 w-10 rounded-full bg-[var(--surface-soft)] dark:bg-[var(--card)] dark:backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-gray-900 hover:scale-110 transition-all duration-200 shadow-lg"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Scrollable Content */}
        <div ref={contentRef} className="overflow-y-auto max-h-[92vh] pb-24">
          <div className="p-8 sm:p-10 space-y-8">
            
            {/* Product Image Section - Edge to Edge Style */}
            <div className="relative -mx-10 -mt-10 mb-8">
              <div className="relative">
                <ImageWithFallback
                  src={displayProduct.images?.[selectedImage] || displayProduct.image}
                  alt={displayProduct.title}
                  className="w-full h-[360px] sm:h-[420px] object-cover"
                  style={{
                    borderTopLeftRadius: '32px',
                    borderTopRightRadius: '32px',
                  }}
                />
                
                {/* Floating Tags */}
                <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                  <Badge className={`${getConditionColor(displayProduct.condition || 'Good')} text-xs px-3 py-1.5 rounded-full shadow-lg dark:backdrop-blur-sm border` }>
                    {displayProduct.condition || 'Good'}
                  </Badge>
                  <Badge className="bg-[var(--surface-soft)] dark:bg-[var(--card)] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs px-3 py-1.5 rounded-full shadow-lg dark:backdrop-blur-sm">
                    {typeof displayProduct.category === 'object' ? displayProduct.category.name : displayProduct.category}
                  </Badge>
                </div>

                {/* Image Shadow */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  boxShadow: 'inset 0 -60px 40px -20px rgba(0,0,0,0.15)',
                  borderTopLeftRadius: '32px',
                  borderTopRightRadius: '32px',
                }} />
              </div>

              {/* Mini Carousel Preview */}
              {displayProduct.images && displayProduct.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4">
                  {product.images.slice(0, 5).map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 ${
                        selectedImage === index 
                          ? 'ring-2 ring-white shadow-lg scale-110' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="w-14 h-14 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Price Section */}
            <div className="space-y-3">
              <h1 className="text-[#093d23] dark:text-[#DFFFEA] text-2xl sm:text-[26px] leading-tight">
                {displayProduct.title}
              </h1>
              
              <div className="text-[#0A8730] dark:text-emerald-400 text-[28px] sm:text-[32px]">
                {formatPrice(displayProduct.price)}
              </div>

              {/* Posted Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Posted {displayProduct.postedDate || new Date(displayProduct.datePosted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {displayProduct.location && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{displayProduct.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

            {/* Description */}
            {displayProduct.description && (
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {displayProduct.description}
                </p>
              </div>
            )}

            {/* Marketplace Safety Section */}
            <div 
              className="bg-[rgba(230,244,236,0.55)] dark:bg-emerald-950/20 border border-[rgba(0,120,60,0.18)] dark:border-emerald-900/30 rounded-[20px] p-4 flex items-start gap-3"
            >
              <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-[#265b3a] dark:text-emerald-300">
                  <strong className="font-semibold">Safety First:</strong> Meet only in designated campus locations for safety. Cash payments only.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

            {/* Seller Information Card - Social Style */}
            {displayProduct.seller && (
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Seller Information</h3>
                
                <div 
                  className="bg-white/60 dark:bg-[var(--card)]/30 border border-gray-200/70 dark:border-gray-700/50 rounded-[20px] p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    if (onSellerClick) {
                      onSellerClick(displayProduct.seller);
                      onClose(); // Close product detail modal when opening seller profile
                    }
                  }}
                  title="Click to view profile"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-lg">
                        {(displayProduct.seller.username || displayProduct.seller.name || 'M').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Seller Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-gray-900 dark:text-gray-100"><UsernameWithGlow username={displayProduct.seller.username || displayProduct.seller.name || 'MariaBendo'} glowEffect={displayProduct.seller?.glowEffect} showTimer={false} /></h4>
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 text-xs px-2 py-0.5">
                          Trustworthy Badge
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {displayProduct.seller.username && (
                          <UsernameWithGlow
                            username={displayProduct.seller.username}
                            glowEffect={displayProduct.seller.glowEffect}
                            showTimer={false}
                            className="text-sm"
                          />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {displayProduct.seller.program || 'BS Computer Science'}
                      </p>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {displayProduct.seller.bio || 'Math major selling textbooks and study materials. Always negotiable!'}
                      </p>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <StarRating rating={5.0} size="sm" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">5.0 (23)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Buyer Reviews Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent Buyer Reviews</h3>
                {allReviews.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Showing 2 of {allReviews.length}</span>
                )}
              </div>
              
              {/* Reviews List - Feed Style */}
              {recentReviews.length > 0 ? (
                <div className="space-y-3">
                  {recentReviews.map((review) => (
                    <div 
                      key={review.id}
                      className="bg-white/40 dark:bg-gray-900/20 border border-gray-200/50 dark:border-gray-700/30 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{review.date}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No reviews at the moment</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Pinned Bottom Action Bar - Professional & Minimal */}
        <div className="absolute bottom-0 left-0 right-0 bg-[var(--card)] dark:bg-[#0a120e]/90 dark:backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex gap-3">
            {/* Report Button - show only to non-owner normal users (not admins) */}
            {(!isAdmin && !isOwner) && (
              <Button
                variant="outline"
                size="icon"
                onClick={openReportDialog}
                className="h-12 w-12 rounded-full border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-800 transition-all duration-200"
                title="Report Product"
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}

            {/* Edit + Delete for owners and admin-owners */}
            {canEdit && (
              <>
                <Button
                  onClick={() => {
                    // Prefer parent-managed edit modal so it remains visible when ProductDetail closes
                    if (typeof onRequestEdit === 'function') {
                      // Close this ProductDetail first so the app-level modal's z-index and centering work reliably
                      onClose();
                      // Wait for the closing animation/unmount to finish, then open the edit modal
                      // (180ms is the dialog animation; use 420ms for more reliable timing on slower machines)
                      setTimeout(() => onRequestEdit(displayProduct), 420);
                      return;
                    }

                    // Fallback: open local edit modal (backwards compatible)
                    // Hide ProductDetail visually so the edit modal appears unobstructed while we keep this component mounted
                    setClosingForEdit(true);
                    setEditingListing(displayProduct);
                    // Small timeout to allow CSS transform/opacity to take effect before opening the nested modal
                    setTimeout(() => {
                      setShowEditModal(true);
                    }, 60);
                  }}
                  className="h-12 px-6 rounded-full bg-[var(--surface-soft)] border border-gray-200/40 dark:border-gray-700/30 text-foreground hover:shadow-md transition-all duration-150"
                >
                  Edit
                </Button>

                {/* Owner-style delete (owners and admin-owners) */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { if (!canDelete) return; setShowDeleteDialog(true); }}
                  title="Delete Product"
                  className="h-12 w-12 rounded-full border-gray-200/40 dark:border-gray-700/30 text-foreground hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[var(--card)]/5 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <ConfirmDeleteDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                  productName={displayProduct?.title}
                  onConfirm={async ({ permanently } = {}) => {
                    try {
                      console.debug('ProductDetail: deleting product', { id: displayProduct?.id, product_id: displayProduct?.product_id, permanently });
                      const result = await deleteProductById(String(displayProduct.id), Boolean(permanently));
                      console.debug('ProductDetail: deleteProductById result', result);

                      if (!result.ok) {
                        if ((result as any).reason === 'not_found') {
                          // Product already removed on server — remove locally as well and inform the user
                          console.debug('ProductDetail: delete returned not_found for id', displayProduct.id);
                          setDisplayProduct((prev) => ({ ...prev, is_deleted: true }));
                          toast.success('Product removed (was already deleted)');
                          try { window.dispatchEvent(new CustomEvent('iskomarket:product-deleted', { detail: { id: String(displayProduct.id), product_id: displayProduct.product_id || null } })); } catch (e) {}
                          onClose();
                          if (typeof (onProductDeleted) === 'function') onProductDeleted(displayProduct.id);
                          return;
                        }

                        // Permission or other error: surface as a failure
                        if ((result as any).reason === 'error') {
                          if ((result as any).permissionDenied) {
                            toast.error('You do not have permission to delete this product.');
                          } else {
                            toast.error('Failed to delete product. Please try again later.');
                          }
                        }
                        throw (result as any).error || new Error('Delete failed');
                      }

                      // Success: product deleted on server
                      console.debug('ProductDetail: deleteProductById OK - dispatching event and closing', { id: result.id || displayProduct.id });
                      toast.success('Product deleted successfully!');
                      try { window.dispatchEvent(new CustomEvent('iskomarket:product-deleted', { detail: { id: result.id || displayProduct.id, product_id: displayProduct.product_id || null } })); } catch (e) {}
                      onClose();
                      if (typeof (onProductDeleted) === 'function') onProductDeleted(result.id || displayProduct.id);
                    } catch (err: any) {
                      console.error('ProductDetail: delete flow threw', err);
                      throw err;
                    }
                  }}
                />
              </>
            )}

            {/* Admin-non-owner: Admin delete icon with red color and tooltip */}
            {isAdminDelete && (
              <Button
                variant="outline"
                size="icon"
                onClick={openDeleteDialog}
                className="h-12 w-12 rounded-full border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-800 transition-all duration-200"
                title="Admin: Remove listing"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/* Message Button - show only to non-owner viewers */}
            {!isOwner && (
              <Button
                onClick={handleContactSeller}
                className="flex-1 h-12 px-8 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 0 rgba(0,255,180,0)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2), 0 0 12px rgba(0,255,180,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 0 0 0 rgba(0,255,180,0)';
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );

return (
  <>
    {/* Product Details Modal */}
    {createPortal(modalContent, document.body)}

    {/* All Nested Modals (ONE portal only) */}
    {createPortal(
      <>
        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent
            className="sm:max-w-md max-h-[90vh] overflow-y-auto"
            style={{ 
              zIndex: 12000,
              animation: `scaleIn var(--default-transition-duration) var(--default-transition-timing-function)`,
            }}
          >
            <DialogTitle>Report Product</DialogTitle>
            <DialogDescription>
              Help us maintain a safe marketplace by reporting inappropriate products.
            </DialogDescription>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm mb-2">Reason for reporting</label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam or duplicate</SelectItem>
                    <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                    <SelectItem value="scam">Potential scam</SelectItem>
                    <SelectItem value="prohibited">Prohibited item</SelectItem>
                    <SelectItem value="misleading">Misleading information</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm mb-2">Additional details</label>
                <Textarea
                  placeholder="Please provide more details..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-initial sm:min-w-[100px]"
                  onClick={() => setShowReportDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReport}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        {showRatingDialog && (
          <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
            <DialogContent
              className="sm:max-w-md max-h-[90vh] overflow-y-auto"
              style={{ 
                zIndex: 12000,
                animation: `scaleIn var(--default-transition-duration) var(--default-transition-timing-function)`,
              }}
            >
              <DialogTitle>Rate This Seller</DialogTitle>
              <DialogDescription>
                Share your experience to help other students make informed decisions.
              </DialogDescription>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm mb-2">
                    Your rating for {displayProduct.seller?.name}
                  </label>

                  <div className="flex justify-center py-2">
                    <StarRating
                      rating={userRating}
                      interactive={true}
                      onRatingChange={setUserRating}
                      size="lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Comment (optional)</label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRatingDialog(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 
                               hover:from-emerald-700 hover:to-emerald-800"
                    onClick={handleRatingSubmit}
                  >
                    Submit Rating
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Listing Modal (reuse same modal used in dashboard) */}
        {editingListing && (
          <EditListingModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingListing(null);
              setClosingForEdit(false);
            }}
            listing={editingListing}
            onUpdateListing={async (updated: any) => {
              await handleEditSave(updated);
              setClosingForEdit(false);
            }}
            portalZIndex={13001}
          />
        )}

        {/* Chat Modal */}
        {showChat && currentUser && (
          <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            currentUser={currentUser}
            otherUser={displayProduct.seller || product.seller}
            product={product}
            zIndex={12000}
            onSellerClick={onSellerClick}
          />
        )}
      
{/* Meetup Reminder Modal */}
    <MeetupReminderModal
      isOpen={showMeetupReminder}
      onClose={() => setShowMeetupReminder(false)}
      onAgree={handleAgreeMeetup}
      meetupLocation={
        product.location ||
        product.meetupLocation ||
        'Main Gate, Cavite State University'
      }
      sellerName={displayProduct.seller?.name || 'the seller'}
      zIndex={12000}
    />

        {/* All Reviews Modal */}
    {showAllReviews && (
      <Dialog open={showAllReviews} onOpenChange={setShowAllReviews}>
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ 
            zIndex: 12000,
            animation: `scaleIn var(--default-transition-duration) var(--default-transition-timing-function)`,
          }}
        >
          <DialogTitle>All Reviews ({allReviews.length})</DialogTitle>
          <DialogDescription>
            Customer reviews for {displayProduct.seller?.name}
          </DialogDescription>

          <div className="space-y-4 mt-4 overflow-y-auto max-h-[60vh]">
            {allReviews.map((review) => (
              <div 
                key={review.id}
                className="bg-white/40 dark:bg-gray-900/20 
                           border border-gray-200/50 dark:border-gray-700/30 
                           rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      {(review.buyerName || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm text-gray-900 dark:text-gray-100">
                        {review.buyerName}
                      </h5>
                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {review.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowAllReviews(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
          </Dialog>
        )}
      </>,
      document.body
    )}
  </>
);
}