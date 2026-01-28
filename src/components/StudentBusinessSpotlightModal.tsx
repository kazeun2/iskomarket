import React, { useState, ChangeEvent } from 'react';
import { Upload, X, MapPin, Eye, Star, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { PreviewListingModal } from './PreviewListingModal';

interface StudentBusinessSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  meetupLocations: string[];
  onConfirm: (productData: any) => void;
}

export function StudentBusinessSpotlightModal({
  isOpen,
  onClose,
  currentUser,
  meetupLocations,
  onConfirm
}: StudentBusinessSpotlightModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    images: [] as File[],
  });

  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const categories = [
    'Textbooks',
    'Electronics', 
    'Art Supplies',
    'Laboratory Equipment',
    'Sports Equipment',
    'Clothing',
    'Stationery',
    'Food',
    'Others'
  ];

  const conditions = [
    'Brand New',
    'Like New', 
    'Good',
    'Fair',
    'For Parts'
  ];

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Simulate upload progress
    setIsUploading(true);
    setImageUploadProgress(0);

    // Simulate progressive upload
    const progressInterval = setInterval(() => {
      setImageUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Wait for "upload" to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    } as any));

    setIsUploading(false);
    setImageUploadProgress(0);
    toast.success(`${files.length} image${files.length !== 1 ? 's' : ''} uploaded`);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.location) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (!formData.condition) {
      toast.error('Please select item condition');
      return false;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return false;
    }

    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setShowPreview(true);
  };

  const handleConfirmPost = () => {
    // Create featured product object with expiration (3 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);
    
    const newProductData = {
      ...formData,
      images: formData.images.map(file => URL.createObjectURL(file)),
      seller: currentUser,
      datePosted: new Date().toISOString().split('T')[0],
      views: 0,
      interested: 0,
      expiresAt: expiresAt.toISOString(),
      isSpotlight: true
    };

    // Show success message
    toast.success('✨ Product spotlight activated for 3 days!', {
      description: `"${formData.title}" will appear in Featured Student Businesses section.`,
      duration: 4000
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      condition: '',
      location: '',
      images: [],
    });

    // Close modals
    setShowPreview(false);
    onClose();
    
    // Pass data to parent
    onConfirm(newProductData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePreview();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="modal-standard !w-[650px] bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]">
          <DialogTitle className="sr-only">
            Premium Spotlight - Post a Product
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create and post a new product listing with premium 3-day spotlight feature
          </DialogDescription>
          
          {/* Header with Premium Spotlight Badge */}
          <div className="modal-header-standard relative !bg-gradient-to-br !from-orange-50/80 !to-amber-50/80 dark:!from-orange-950/30 dark:!to-amber-950/30 backdrop-blur-sm !border-b-2 !border-orange-200/50 dark:!border-orange-500/20">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg text-gray-900 dark:text-foreground">Post a Product</h2>
              
              {/* Premium Spotlight Badge */}
              <Badge 
                className="bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-foreground border-0 shadow-lg px-3 py-1.5"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
                }}
              >
                <Star className="h-3.5 w-3.5 mr-1.5 fill-white" />
                Premium Spotlight
              </Badge>
            </div>
          </div>
          
          {/* Content */}
          <div className="modal-content-standard">
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-300/50 dark:border-orange-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">
                    🌟 Premium Spotlight Benefits
                  </h3>
                  <p className="text-xs text-orange-800 dark:text-orange-300">
                    Your product will be featured at the top of <strong>Featured Student Businesses</strong> section for <strong>3 days</strong>, giving it maximum visibility to all IskoMarket users!
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm mb-2 text-gray-900 dark:text-foreground">Title *</label>
                <Input
                  placeholder="e.g., Advanced Calculus Textbook - 3rd Edition"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={100}
                  className="dark:bg-gray-800/50 dark:border-gray-700 dark:text-foreground"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.title.length}/100 characters</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-2 text-gray-900 dark:text-foreground">Description *</label>
                <Textarea
                  placeholder="Describe your item's condition, usage, and any important details..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  maxLength={500}
                  className="dark:bg-gray-800/50 dark:border-gray-700 dark:text-foreground"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/500 characters</p>
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-900 dark:text-foreground">Price (PHP) *</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    min="1"
                    className="dark:bg-gray-800/50 dark:border-gray-700 dark:text-foreground"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cash payments only</p>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-900 dark:text-foreground">Category *</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="dark:bg-gray-800/50 dark:border-gray-700 dark:text-foreground">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Condition and Meetup Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-900 dark:text-foreground">Condition *</label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger className="dark:bg-gray-800/50 dark:border-gray-700 dark:text-foreground">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map(condition => (
                        <SelectItem key={condition} value={condition}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-900 dark:text-foreground">Preferred Meetup Location *</label>
                  <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                    <SelectTrigger className="dark:bg-gray-800/50 dark:border-gray-700 dark:text-foreground">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetupLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm mb-2 text-gray-900 dark:text-foreground">Images * (Max 5)</label>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div>
                    <div className="border-2 border-dashed border-orange-300 dark:border-orange-500/30 rounded-lg p-6 text-center hover:border-orange-400 dark:hover:border-orange-400/50 transition-colors bg-orange-50/30 dark:bg-orange-950/10">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={isUploading || formData.images.length >= 5}
                      />
                      <label htmlFor="image-upload" className={isUploading || formData.images.length >= 5 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                        <Upload className="h-8 w-8 text-orange-500 dark:text-orange-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">Click to upload images</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 5MB each</p>
                      </label>
                    </div>
                    {imageUploadProgress > 0 && imageUploadProgress < 100 && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Uploading images...</span>
                          <span className="text-xs text-gray-900 dark:text-foreground">{Math.round(imageUploadProgress)}%</span>
                        </div>
                        <Progress value={imageUploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <Card key={index} className="relative dark:bg-gray-800/50 dark:border-gray-700">
                          <CardContent className="p-2">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Safety Guidelines */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Safety Guidelines</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Only meet in designated campus locations</li>
                    <li>• Confirm meetup details with buyer/seller before meeting</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="dark:border-gray-700 dark:text-gray-300">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-foreground border-0 shadow-lg"
                  disabled={isUploading}
                  style={{
                    boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Listing
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <PreviewListingModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onEdit={() => setShowPreview(false)}
        onConfirmPost={handleConfirmPost}
        formData={formData}
        currentUser={currentUser}
        isFundraiser={false}
      />
    </>
  );
}
