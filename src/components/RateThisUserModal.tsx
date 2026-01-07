import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface RateThisUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: any;
  onSubmitRating: (rating: number, review: string) => void;
}

export function RateThisUserModal({ 
  isOpen, 
  onClose, 
  otherUser, 
  onSubmitRating 
}: RateThisUserModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    onSubmitRating(rating, review);
    toast.success('Review submitted successfully!', {
      description: '+1 credit point earned for leaving a review'
    });
    
    // Reset state
    setRating(0);
    setHoverRating(0);
    setReview('');
    onClose();
  };

  const handleCancel = () => {
    setRating(0);
    setHoverRating(0);
    setReview('');
    onClose();
  };

  if (!isOpen) return null;

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-white dark:backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header - Standardized */}
        <div className="modal-header-standard">
          <div className="modal-header-content">
            <div className="modal-header-text">
              <h2 className="modal-header-title">Rate This User</h2>
              <p className="modal-header-description">
                Share your experience with {otherUser.name}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className="modal-close-button-standard"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Rating Stars */}
          <div>
            <label className="text-sm mb-3 block">
              How was your transaction? <span className="inline-block px-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">*</span>
            </label>
            <div className="flex gap-3 justify-center my-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-10 w-10 transition-colors duration-200 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {/* Rating Text Feedback */}
            <div className="text-center text-sm text-muted-foreground">
              {(hoverRating || rating) === 5 && '⭐ Excellent!'}
              {(hoverRating || rating) === 4 && '👍 Good'}
              {(hoverRating || rating) === 3 && '😊 Okay'}
              {(hoverRating || rating) === 2 && '😕 Could be better'}
              {(hoverRating || rating) === 1 && '😞 Poor'}
              {!hoverRating && !rating && 'Select a rating'}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="text-sm mb-3 block">
              Write a review (optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share details about your experience..."
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {review.length}/500 characters
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground text-center">
              💡 You can only rate this user once for this transaction.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-standard">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={rating === 0}
          >
            Submit Review
          </Button>
        </div>
      </div>
    </div>
  );
}
