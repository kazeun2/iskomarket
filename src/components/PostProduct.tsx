import React, { useEffect, useState } from 'react';
import { Upload, X, MapPin, FileText, AlertCircle, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { createProduct, uploadProductImages } from '../lib/services/products';
import { isSupabaseConfigured } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import { PreviewListingModal } from './PreviewListingModal';

interface PostProductProps {
  meetupLocations: string[];
  currentUser?: any;
  onClose?: () => void;
  onProductPosted?: (productData: any) => void;
  isFundraiser?: boolean;
}

export function PostProduct({ meetupLocations, currentUser, onClose, onProductPosted, isFundraiser = false }: PostProductProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    category_name: '',
    condition: '',
    location: '',
    images: [] as File[],
    cause: '',
    organization: '',
    goalAmount: '',
    proofDocument: null as File | null
  });

  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { getCategories } = await import('../lib/services/categories');
        const cats = await getCategories();
        if (mounted && cats) {
          setCategoriesList(cats.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        // ignore - fallback static list will be used
      }
    })();
    return () => { mounted = false };
  }, []);

  const selectedCategoryName = formData.category_name || categoriesList.find(c => c.id === formData.category_id)?.name;
  const isForACauseSelected = isFundraiser || selectedCategoryName === 'For a Cause';

  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [proofUploadProgress, setProofUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const categories = isFundraiser ? [
    'Food & Baked Goods',
    'Handmade Crafts',
    'Books & Study Materials',
    'Services',
    'Others'
  ] : [
    'For a Cause',
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

  const handleImageUpload = async (e: any) => {
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
    }));

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

  const handleProofUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, or PNG file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Simulate upload progress
    setIsUploading(true);
    setProofUploadProgress(0);

    // Simulate progressive upload
    const progressInterval = setInterval(() => {
      setProofUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 8;
      });
    }, 120);

    // Wait for "upload" to complete
    await new Promise(resolve => setTimeout(resolve, 1500));

    setFormData(prev => ({ ...prev, proofDocument: file }));
    
    setIsUploading(false);
    setProofUploadProgress(0);
    toast.success('Proof document uploaded successfully');
  };

  const removeProof = () => {
    setFormData(prev => ({ ...prev, proofDocument: null }));
    toast.info('Proof document removed');
  };

  const validateForm = () => {
    const selectedCategoryName = formData.category_name || categoriesList.find(c => c.id === formData.category_id)?.name;
    const isForACause = isFundraiser || selectedCategoryName === "For a Cause";

    if (!formData.title || !formData.description || !formData.price || !formData.category_id || !formData.location) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (!isForACause && !formData.condition) {
      toast.error('Please select item condition');
      return false;
    }

    if (isForACause && (!formData.cause || !formData.goalAmount)) {
      toast.error('Please fill in all fundraiser details (Cause and Goal Amount are required)');
      return false;
    }

    if (isForACause && !formData.proofDocument) {
      toast.error('Verification required for all "For a Cause" posts to maintain platform integrity.', {
        description: 'Please upload proof of cause (medical certificate, endorsement letter, or proof document)',
        duration: 5000
      });
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

  // NOTE: This handler performs server-side creation and MUST await the server.
  // Previously the UI would optimistically call `onProductPosted(newProductData)` immediately
  // which caused the product to appear locally even if the Supabase insert failed. We now
  // await `createProduct()` and only call `onProductPosted` on success; on error we show
  // a toast and keep the modal open so the user can retry (no optimistic commit).
  const handleConfirmPost = async () => {
    // If Supabase is available, create product in database
    const createRemoteProduct = async (newProductData: any) => {
      setIsUploading(true);
      try {
        // Map images to string URLs (already using object URLs locally)
        // Verify session matches the UI's currentUser to avoid stale/mismatched sessions
        if (isSupabaseConfigured()) {
          const sessionProfile = await getCurrentUser();
          if (!sessionProfile) throw new Error('Authentication required. Please sign in and try again.');
          if (currentUser?.id && sessionProfile.id !== currentUser.id) {
            console.warn('Session user does not match UI current user when posting product.', { sessionId: sessionProfile.id, uiId: currentUser.id });

            // Ask the user whether they want to proceed as the currently authenticated session user
            const displayName = sessionProfile.username || sessionProfile.email || sessionProfile.id || 'your account';
            const proceed = window.confirm(`You are currently signed in as ${displayName}. Press OK to post as ${displayName}, or Cancel to abort and re-sync (refresh or sign out).`);

            if (!proceed) {
              // User chose to abort; throw so outer catch displays an error and keeps the modal open
              throw new Error('Session mismatch: Please sign out and sign in with the correct account before posting (refresh the page to re-sync).');
            } else {
              // User accepted - inform them we're posting as the authenticated session
              toast.info(`Posting as ${displayName}`);
              // continue with upload and creation - authenticated session is authoritative
            }
          }
        }

        // If Supabase is configured, upload local image files to storage and use public URLs
        let finalImages = newProductData.images;
        try {
          if (isSupabaseConfigured()) {
            // Only upload if images are File objects (not already URLs)
            const filesToUpload = formData.images && formData.images.length ? formData.images : [];
            if (filesToUpload.length > 0) {
              // Upload product images to storage and replace images with public URLs
              const uploaded = await uploadProductImages(filesToUpload as File[], (uploadedCount, total) => {
                setImageUploadProgress(Math.round((uploadedCount / total) * 100));
              });
              console.debug('Image upload result (public URLs):', uploaded);
              if (uploaded && uploaded.length > 0) finalImages = uploaded;
              setImageUploadProgress(100);
            }
          }
        } catch (e: any) {
          console.error('Image upload failed', e);
          // Throw so the outer try/catch shows error and we don't continue with an incomplete upload
          throw new Error(e?.message || 'Image upload failed. Please check storage permissions or contact an admin.');
        }

        const payload = {
          title: newProductData.title,
          description: newProductData.description,
          price: Number(newProductData.price),
          category_id: newProductData.category_id || null,
          is_for_a_cause: newProductData.isFundraiser || false,
          condition: newProductData.condition ?? 'Not specified',
          // Do NOT set seller_id from client-side values — server will derive from authenticated session
          images: finalImages,
          location: newProductData.location,
          views: 0,
          interested: 0,
          is_sold: false,
          is_hidden: false,
          is_deleted: false,
        };

        const result = await createProduct(payload as any);
        setImageUploadProgress(0);

        // Log created product visibility flags to help debug RLS/visibility issues
        console.debug('createProduct result:', { id: result?.id, is_available: result?.is_available, is_deleted: result?.is_deleted, is_hidden: result?.is_hidden });

        // Ensure result is valid; otherwise throw so caller knows creation failed
        if (!result || !result.id) {
          throw new Error('Product creation failed or was aborted. No product was created.');
        }

        // Return the server result for the caller to handle UI updates
        return result;
      } finally {
        setIsUploading(false);
      }
    };
    const selectedCategoryName = formData.category_name || categoriesList.find(c => c.id === formData.category_id)?.name;
    const isForACause = isFundraiser || selectedCategoryName === "For a Cause";
    
    // Create product object with all necessary data
    const newProductData = {
      ...formData,
      // images will be uploaded to storage if Supabase is configured; placeholder URLs used by default
      images: formData.images.map(file => URL.createObjectURL(file)),
      isFundraiser: isForACause,
      seller: currentUser,
      datePosted: new Date().toISOString().split('T')[0],
      views: 0,
      interested: 0
    };

    // ensure category_name is present for preview
    if (formData.category_id && !newProductData.category_name) {
      newProductData.category_name = categoriesList.find(c => c.id === formData.category_id)?.name || '';
    }

    // If Supabase configured, create in database; otherwise use local fallback
    if (isSupabaseConfigured()) {
      try {
        const created = await createRemoteProduct(newProductData);

        toast.success('Product posted successfully!');
        if (onProductPosted) onProductPosted(created);
        // Verify the product is discoverable by re-fetching the product list once (best-effort)
        try {
          const { getProductsWithFallback } = await import('../lib/services/products');
          const list = await getProductsWithFallback();
          const found = list && list.some((p: any) => p.id === created.id);
          if (!found) {
            console.warn('PostProduct: created product not found by getProductsWithFallback immediately after creation. Retrying in 1s...');
            // Try one more time after a short delay
            await new Promise(r => setTimeout(r, 1000));
            const list2 = await getProductsWithFallback();
            const found2 = list2 && list2.some((p: any) => p.id === created.id);
            if (!found2) {
              console.error('PostProduct: created product still not visible after retry. This may indicate an RLS/visibility issue.', { createdId: created.id });
              toast.error('Product was created, but is not yet visible in the marketplace. This is likely a server visibility or policy issue.');
            }
          }
        } catch (e) {
          console.warn('PostProduct: verification fetch failed', e);
        }

        if (onClose) onClose();
      } catch (err: any) {
        console.error('Failed to create product:', err);
        toast.error(err?.message || 'Failed to post product. Please try again.');
        // Do not call onProductPosted - rollback optimistic UI
        return; // keep the modal open so user can retry
      }
    } else {
      // Show success message (local/demo mode)
      if (isForACause) {
        toast.success('💛 Fundraiser posted successfully!', {
          description: `"${formData.title}" - Goal: ₱${parseInt(formData.goalAmount).toLocaleString()}`
        });
      } else {
        toast.success('Product posted successfully!', {
          description: `"${formData.title}" - ₱${parseInt(formData.price).toLocaleString()}`
        });
      }

      if (onProductPosted) onProductPosted(newProductData);
    }
    
    // Reset form (only when posting succeeded or in demo/local mode)
    setFormData({
      title: '',
      description: '',
      price: '',
      category_id: '',
      category_name: '',
      condition: '',
      location: '',
      images: [],
      cause: '',
      organization: '',
      goalAmount: '',
      proofDocument: null
    });
    // Close preview and main modal
    setShowPreview(false);
    
    // Callbacks for local/demo posting
    if (!isSupabaseConfigured()) {
      if (onProductPosted) onProductPosted(newProductData);
      if (onClose) onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePreview();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm mb-2">Title *</label>
          <Input
            placeholder="e.g., Advanced Calculus Textbook - 3rd Edition"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm mb-2">Description *</label>
          <Textarea
            placeholder={isFundraiser ? "Describe what you're selling and how it helps your cause..." : "Describe your item's condition, usage, and any important details..."}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
        </div>

        {/* Price and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Price (PHP) *</label>
            <Input
              type="number"
              placeholder="1000"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Cash payments only</p>
          </div>
          <div>
            <label className="block text-sm mb-2">Category *</label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value, category_name: (categoriesList.find(c => c.id === value)?.name || value) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(categoriesList.length > 0 ? categoriesList.map(c => c.name) : categories).map((name) => {
                  // Prevent placeholder option from being selectable ('All Categories')
                  if (name === 'All Categories') return null;
                  // find id for name if possible
                  const found = categoriesList.find(c => c.name === name);
                  const value = found ? found.id : name;
                  return (
                    <SelectItem
                      key={value}
                      value={value}
                      className={name === "For a Cause" ? "for-a-cause-option" : ""}
                    >
                      {name === "For a Cause" ? "💛 For a Cause" : name}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fundraiser-specific fields */}
        {isForACauseSelected && (
          <div className="bg-[#FFF8E1] dark:bg-[#FFB300]/10 border-2 border-[#FFB300]/40 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💛</span>
              <h3 className="text-sm text-[#F57C00]">Fundraiser Details</h3>
            </div>
            
            <div>
              <label className="block text-sm mb-2">Fundraising Cause *</label>
              <Input
                placeholder="e.g., Medical Assistance for Student with Cancer"
                value={formData.cause}
                onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">Describe the purpose of this fundraiser</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Organization/Group</label>
                <Input
                  placeholder="Enter organization name (optional)"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Fundraising Goal (PHP) *</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.goalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, goalAmount: e.target.value }))}
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">Total amount you want to raise</p>
              </div>
            </div>

            {/* Verification Upload Section */}
            <div className="border-t-2 border-[#FFB300]/20 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-[#F57C00]" />
                <h4 className="text-sm text-[#F57C00]">Verification Document *</h4>
              </div>
              
              <Alert className="mb-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Required for platform integrity:</strong> Upload proof of cause (medical certificate, endorsement letter, or verification document)
                </AlertDescription>
              </Alert>

              {!formData.proofDocument ? (
                <div>
                  <div className="border-2 border-dashed border-[#FFB300]/40 rounded-lg p-4 text-center hover:border-[#FFB300] transition-colors bg-white dark:bg-card">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleProofUpload}
                      className="hidden"
                      id="proof-upload"
                      disabled={isUploading}
                    />
                    <label htmlFor="proof-upload" className={isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                      <FileText className="h-8 w-8 text-[#FFB300] mx-auto mb-2" />
                      <p className="text-sm text-[#F57C00] mb-1">Upload Proof of Cause</p>
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: PDF, JPG, PNG (Max 10MB)
                      </p>
                    </label>
                  </div>
                  {proofUploadProgress > 0 && proofUploadProgress < 100 && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Uploading...</span>
                        <span className="text-xs">{Math.round(proofUploadProgress)}%</span>
                      </div>
                      <Progress value={proofUploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              ) : (
                <Card className="border-[#FFB300]/40 bg-white dark:bg-card">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#F57C00]" />
                        <div>
                          <p className="text-sm text-foreground truncate max-w-[200px]">
                            {formData.proofDocument.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(formData.proofDocument.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeProof}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Condition and Meetup Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isForACauseSelected && (
            <div>
              <label className="block text-sm mb-2">Condition *</label>
              <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                <SelectTrigger>
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
          )}
          <div className={isForACauseSelected ? 'md:col-span-2' : ''}>
            <label className="block text-sm mb-2">Preferred Meetup Location *</label>
            <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
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
          <label className="block text-sm mb-2">Images * (Max 5)</label>
          <div className="space-y-4">
            {/* Upload Area */}
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
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
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload images</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
                </label>
              </div>
              {imageUploadProgress > 0 && imageUploadProgress < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Uploading images...</span>
                    <span className="text-xs">{Math.round(imageUploadProgress)}%</span>
                  </div>
                  <Progress value={imageUploadProgress} className="h-2" />
                </div>
              )}
            </div>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <Card key={index} className="relative">
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
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Safety Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Only meet in designated campus locations</li>
              <li>• Confirm meetup details with buyer/seller before meeting</li>
            </ul>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-green-600 hover:bg-green-700"
            disabled={isUploading}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Listing
          </Button>
        </div>
      </form>

      {/* Preview Modal */}
      <PreviewListingModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onEdit={() => setShowPreview(false)}
        onConfirmPost={handleConfirmPost}
        formData={formData}
        currentUser={currentUser}
        isFundraiser={isFundraiser}
      />
    </>
  );
}
