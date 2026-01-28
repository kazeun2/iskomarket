import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Upload, Camera } from 'lucide-react';
import { uploadProductImages } from '../lib/services/products';
import { toast } from 'sonner';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: number;
    title: string;
    price: number;
    status: string;
    views: number;
    interested: number;
    image: string;
    datePosted: string;
    description?: string;
    category?: string | { name?: string };
    condition?: string;
    location?: string;
  };
  onUpdateListing: (updatedListing: any) => void;
  portalZIndex?: number;
} 

export function EditListingModal({ isOpen, onClose, listing, onUpdateListing, portalZIndex }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    title: listing.title,
    price: listing.price != null ? listing.price.toString() : '0',
    description: listing.description || '',
    category: (typeof listing.category === 'object' ? listing.category?.name : listing.category) || 'Textbooks',
    condition: listing.condition || 'Good',
    location: listing.location || 'Gate 1',
    image: listing.image || (listing as any).image_url || ''
  });

  // Ensure the dialog content appears above other overlays by default (app-level modals should be top-most)
  const effectivePortalZ = portalZIndex ?? 32000;

  // When the modal opens, ensure any scrollable content is scrolled to top and first input is focused
  React.useEffect(() => {
    if (!isOpen) return;
    // Initial attempt after portal insertion
    const t1 = setTimeout(() => {
      const content = document.querySelector('[data-slot="dialog-content"]') as HTMLElement | null;
      if (content) {
        content.scrollTop = 0;
        const firstInput = content.querySelector('input, textarea, select') as HTMLElement | null;
        if (firstInput) {
          try { (firstInput as HTMLElement).focus(); } catch (e) {}
        }
      }
    }, 50);

    // Second attempt after dialog animations finish to handle slower devices
    const t2 = setTimeout(() => {
      const content = document.querySelector('[data-slot="dialog-content"]') as HTMLElement | null;
      if (content) {
        content.scrollTop = 0;
        const firstInput = content.querySelector('input, textarea, select') as HTMLElement | null;
        if (firstInput) {
          try { (firstInput as HTMLElement).focus(); } catch (e) {}
        }
      }
    }, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  const getListingImage = (item: any) => {
    if (!item) return '';
    if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string') return item.images[0];
    return (item?.image || item?.image_url || item?.imageUrl || '');
  };

  // Keep the existing image URL separate from a newly selected File
  const [existingImageUrl, setExistingImageUrl] = useState<string>(getListingImage(listing));
  const [confirmedImageFile, setConfirmedImageFile] = useState<File | null>(null);
  const [confirmedImageDataUrl, setConfirmedImageDataUrl] = useState<string | null>(null);
  const imageObjectUrlRef = useRef<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(getListingImage(listing));
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Temporary dialog state while user is choosing an image (only committed on Confirm)
  const [tempSelectedFile, setTempSelectedFile] = useState<File | null>(null);
  const [tempSelectedDataUrl, setTempSelectedDataUrl] = useState<string | null>(null);
  const tempObjectUrlRef = useRef<string | null>(null);
  const [tempUrlInput, setTempUrlInput] = useState<string>('');
  const [tempPreview, setTempPreview] = useState<string>('');

  // Sync local form state & preview whenever the modal opens or a different listing is provided
  React.useEffect(() => {
    if (!isOpen) return;

    // revoke any previously created object URL
    if (imageObjectUrlRef.current) {
      try { URL.revokeObjectURL(imageObjectUrlRef.current); } catch (e) {}
      imageObjectUrlRef.current = null;
    }
    if (tempObjectUrlRef.current) {
      try { URL.revokeObjectURL(tempObjectUrlRef.current); } catch (e) {}
      tempObjectUrlRef.current = null;
    }

    const original = getListingImage(listing);

    setFormData(prev => ({
      ...prev,
      title: listing.title || '',
      price: listing.price != null ? listing.price.toString() : '0',
      description: listing.description || '',
      category: (typeof listing.category === 'object' ? listing.category?.name : listing.category) || 'Textbooks',
      condition: listing.condition || 'Good',
      location: listing.location || 'Gate 1',
      image: original
    }));

    setExistingImageUrl(original);
    setConfirmedImageFile(null);
    setConfirmedImageDataUrl(null);
    setImagePreview(original);
    setIsEditingImage(false);

    // reset temp dialog state
    setTempSelectedFile(null);
    setTempSelectedDataUrl(null);
    setTempUrlInput('');
    setTempPreview('');

    return () => {
      if (imageObjectUrlRef.current) {
        try { URL.revokeObjectURL(imageObjectUrlRef.current); } catch (e) {}
        imageObjectUrlRef.current = null;
      }
      if (tempObjectUrlRef.current) {
        try { URL.revokeObjectURL(tempObjectUrlRef.current); } catch (e) {}
        tempObjectUrlRef.current = null;
      }
    };
  }, [isOpen, listing]);

  const categories = ['Art Supplies', 'Clothing', 'Electronics', 'Food', 'Laboratory Equipment', 'Others', 'Sports Equipment', 'Textbooks'];
  const conditions = ['Brand New', 'Like New', 'Good', 'Fair', 'Poor'];
  const meetupLocations = ['Umall Gate', 'Gate 1', 'Gate 2'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final image:
    // - If a confirmed file was picked, upload it and use the returned public URL
    // - Otherwise, use the confirmed/existing image URL
    let finalImage = listing.image || existingImageUrl || '';

    if (confirmedImageFile) {
      try {
        const uploaded = await uploadProductImages([confirmedImageFile], undefined);
        if (uploaded && uploaded.length > 0 && uploaded[0]) {
          finalImage = uploaded[0];
        } else {
          // If upload returned nothing, fall back to previous existing value
          finalImage = existingImageUrl || listing.image || '';
        }
      } catch (e: any) {
        console.error('EditListingModal: image upload failed', e);
        toast?.error?.('Image upload failed. Please try again.');
        // Abort save to avoid overwriting with bad state
        return;
      }
    } else if (existingImageUrl && existingImageUrl.trim()) {
      finalImage = existingImageUrl;
    } else if (formData.image && typeof formData.image === 'string' && formData.image.trim()) {
      finalImage = formData.image.trim();
    }

    const updatedListing = {
      ...listing,
      title: formData.title,
      price: parseFloat(formData.price),
      description: formData.description,
      // Send category *name* intentionally; the service will resolve it to category_id
      category: formData.category,
      condition: formData.condition,
      location: formData.location,
      // The server expects `images` (array); provide images with the uploaded/confirmed public URL so it gets persisted
      images: finalImage ? [finalImage] : ((listing as any).images || (listing.image ? [listing.image] : [])),
      // Keep a client-friendly `image` fallback for immediate UI updates
      image: finalImage || listing.image
    };

    // Update local UI state optimistically so preview reflects the saved image immediately
    if (finalImage) {
      setImagePreview(finalImage);
      setExistingImageUrl(finalImage);
      setConfirmedImageFile(null);
      setConfirmedImageDataUrl(null);
    }

    // Cleanup object URL after using it
    if (imageObjectUrlRef.current) {
      try { URL.revokeObjectURL(imageObjectUrlRef.current); } catch (e) {}
      imageObjectUrlRef.current = null;
    }

    // Call upstream updater which persists to DB via updateProduct; that function returns the saved object and triggers app-level state update / realtime
    onUpdateListing(updatedListing);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // TEMP: Called when a file is selected inside the image editor dialog (does NOT commit)
  const handleTempFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous temp object URL if any
      if (tempObjectUrlRef.current) {
        try { URL.revokeObjectURL(tempObjectUrlRef.current); } catch (e) {}
      }

      const objectUrl = URL.createObjectURL(file);
      tempObjectUrlRef.current = objectUrl;

      // Preview inside dialog uses temp object URL
      setTempPreview(objectUrl);
      setTempSelectedFile(file);
      setTempSelectedDataUrl(null);

      // Read as data URL for possible later commit
      fileToDataUrl(file).then((dataUrl) => {
        setTempSelectedDataUrl(dataUrl);
      }).catch(() => {
        // ignore
      });
    }
  };

  // TEMP: Called when an URL is pasted inside the image editor dialog (does NOT commit)
  const handleTempUrlChange = (url: string) => {
    // Revoke previous temp object URL if any
    if (tempObjectUrlRef.current) {
      try { URL.revokeObjectURL(tempObjectUrlRef.current); } catch (e) {}
      tempObjectUrlRef.current = null;
    }
    setTempSelectedFile(null);
    setTempSelectedDataUrl(null);
    setTempUrlInput(url);
    setTempPreview(url);
  };

  // Cancel inside editor: discard temp changes
  const handleCancelImageEdit = () => {
    if (tempObjectUrlRef.current) {
      try { URL.revokeObjectURL(tempObjectUrlRef.current); } catch (e) {}
      tempObjectUrlRef.current = null;
    }
    setTempSelectedFile(null);
    setTempSelectedDataUrl(null);
    setTempUrlInput('');
    setTempPreview('');
    setIsEditingImage(false);
  };

  // Confirm inside editor: commit temp selection into confirmed image state (but do not upload yet)
  const handleConfirmImageEdit = () => {
    // Revoke any existing committed object URL
    if (imageObjectUrlRef.current) {
      try { URL.revokeObjectURL(imageObjectUrlRef.current); } catch (e) {}
      imageObjectUrlRef.current = null;
    }

    if (tempSelectedFile) {
      // Move temp object URL to committed ref
      if (tempObjectUrlRef.current) {
        imageObjectUrlRef.current = tempObjectUrlRef.current;
        tempObjectUrlRef.current = null;
      }

      setConfirmedImageFile(tempSelectedFile);
      setConfirmedImageDataUrl(tempSelectedDataUrl);
      setExistingImageUrl('');
      setImagePreview(tempPreview);
      setFormData(prev => ({ ...prev, image: tempSelectedDataUrl || '' }));
    } else if (tempUrlInput && tempUrlInput.trim()) {
      setConfirmedImageFile(null);
      setConfirmedImageDataUrl(null);
      setExistingImageUrl(tempUrlInput);
      setImagePreview(tempUrlInput);
      setFormData(prev => ({ ...prev, image: tempUrlInput }));
    } else {
      // Cleared
      setConfirmedImageFile(null);
      setConfirmedImageDataUrl(null);
      setExistingImageUrl('');
      setImagePreview('');
      setFormData(prev => ({ ...prev, image: '' }));
    }

    // Reset temp dialog state
    setTempSelectedFile(null);
    setTempSelectedDataUrl(null);
    setTempUrlInput('');
    setTempPreview('');
    setIsEditingImage(false);
  };

  const handleRemoveImage = () => {
    const originalImage = getListingImage(listing);
    if (imageObjectUrlRef.current) {
      try { URL.revokeObjectURL(imageObjectUrlRef.current); } catch (e) {}
      imageObjectUrlRef.current = null;
    }
    setConfirmedImageFile(null);
    setConfirmedImageDataUrl(null);
    setExistingImageUrl(originalImage);
    setImagePreview(originalImage);
    setFormData(prev => ({ ...prev, image: originalImage }));
    setIsEditingImage(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="modal-standard max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[24px] shadow-2xl dark:shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2)] p-0"
        style={{
          zIndex: effectivePortalZ,
          boxShadow: '0 8px 32px rgba(0, 100, 0, 0.08)'
        }}
      >
        {/* Header - Centered Title (compact) */}
        <DialogHeader className="modal-header-standard">
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription className="sr-only">
            Update your product details including title, price, description, and other information
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-4 pb-32" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cfe8ce transparent'
        }}>
          <div className="space-y-6">
            {/* Product Image Section */}
            <div className="space-y-3">
              <Label className="text-[14px] font-semibold text-[#006400] dark:text-[#4ade80]">
                Product Image
              </Label>
              <div className="flex flex-col items-center gap-4">
                {/* Image Card with Camera Badge */}
                <div className="relative">
                  <div 
                    className="relative rounded-[16px] overflow-hidden border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 shadow-lg dark:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 100, 0, 0.08)'
                    }}
                  >
                    {(() => {
                      const displaySrc = isEditingImage ? (tempPreview || imagePreview) : imagePreview;
                      const safeSrc = (typeof displaySrc === 'string' && displaySrc.trim() !== '') ? displaySrc : '/placeholder.png';
                      return (
                        <ImageWithFallback
                          src={safeSrc}
                          alt={listing.title}
                          className="w-40 h-40 object-cover"
                        />
                      );
                    })()}
                  </div>
                  {/* Camera Icon Badge */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] flex items-center justify-center shadow-lg">
                    <Camera className="h-5 w-5 text-foreground" />
                  </div>
                </div>

                {/* Change Image Button */}
                <Button
                  type="button"
                  onClick={() => {
                    // Initialize temp dialog values from current committed preview
                    setTempSelectedFile(null);
                    setTempSelectedDataUrl(null);
                    setTempUrlInput(existingImageUrl || imagePreview || '');
                    setTempPreview(imagePreview || existingImageUrl || '');
                    setIsEditingImage(true);
                  }}
                  className="h-11 px-6 rounded-[12px] bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-foreground hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Image
                </Button>

                {/* Image Edit Options */}
                {isEditingImage && (
                  <div className="w-full space-y-4 p-5 bg-card dark:bg-[var(--card)] rounded-[16px] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20">
                    {/* Upload from device */}
                    <div className="space-y-2">
                      <Label htmlFor="image-upload" className="text-[13px] font-medium text-[#006400] dark:text-[#4ade80]">
                        Upload from Device
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleTempFileChange}
                        className="cursor-pointer h-11 bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80]"
                      />
                    </div>

                    {/* Or paste URL */}
                    <div className="space-y-2">
                      <Label htmlFor="image-url" className="text-[13px] font-medium text-[#006400] dark:text-[#4ade80]">
                        Or Paste Image URL
                      </Label>
                      <Input
                        id="image-url"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={tempUrlInput}
                        onChange={(e) => handleTempUrlChange(e.target.value)}
                        className="h-11 bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelImageEdit}
                        className="flex-1 h-10 rounded-[12px] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 text-[#006400] dark:text-[#4ade80] hover:bg-[#006400]/5 dark:hover:bg-[#14b8a6]/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleConfirmImageEdit}
                        className="flex-1 h-10 rounded-[12px] bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-foreground hover:scale-105 transition-all"
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[14px] font-semibold text-[#006400] dark:text-[#4ade80]">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter item title"
                required
                className="h-12 bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40 px-4"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-[14px] font-semibold text-[#006400] dark:text-[#4ade80]">
                Price *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006400] dark:text-[#4ade80] font-medium">
                  ₱
                </span>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="h-12 bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40 pl-9 pr-4"
                />
              </div>
              <p className="text-[12px] text-[#006400]/60 dark:text-[#4ade80]/60">
                Set a fair price for your item
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[14px] font-semibold text-[#006400] dark:text-[#4ade80]">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your item..."
                rows={4}
                className="bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40 p-4 resize-none"
              />
              <p className="text-[12px] text-[#006400]/60 dark:text-[#4ade80]/60">
                Buyers will see this in your product listing
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold text-[#006400] dark:text-[#4ade80]">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="h-12 bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card dark:bg-[#003726] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[12px]">
                  {categories.filter(c => c !== 'All Categories').map(category => (
                    <SelectItem 
                      key={category} 
                      value={category}
                      className="text-[#006400] dark:text-[#4ade80] focus:bg-[#006400]/5 dark:focus:bg-[#14b8a6]/10"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold text-[#006400] dark:text-[#4ade80]">
                Condition *
              </Label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                <SelectTrigger className="h-12 bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80]">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="bg-card dark:bg-[#003726] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[12px]">
                  {conditions.map(condition => (
                    <SelectItem 
                      key={condition} 
                      value={condition}
                      className="text-[#006400] dark:text-[#4ade80] focus:bg-[#006400]/5 dark:focus:bg-[#14b8a6]/10"
                    >
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Meetup Location */}
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold text-[#006400] dark:text-[#4ade80]">
                Preferred Meetup Location *
              </Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                <SelectTrigger className="h-12 bg-card dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80]">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-card dark:bg-[#003726] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[12px]">
                  {meetupLocations.map(location => (
                    <SelectItem 
                      key={location} 
                      value={location}
                      className="text-[#006400] dark:text-[#4ade80] focus:bg-[#006400]/5 dark:focus:bg-[#14b8a6]/10"
                    >
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        {/* Footer with Action Buttons - standard */}
        <div className="modal-footer-standard">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
            >
              Save
            </Button>
        </div>

        {/* Custom Scrollbar Styles */}
        <style>{`
          form::-webkit-scrollbar {
            width: 6px;
          }
          form::-webkit-scrollbar-track {
            background: transparent;
          }
          form::-webkit-scrollbar-thumb {
            background: #cfe8ce;
            border-radius: 3px;
          }
          .dark form::-webkit-scrollbar-thumb {
            background: rgba(20, 184, 166, 0.3);
          }
          form::-webkit-scrollbar-thumb:hover {
            background: #006400;
          }
          .dark form::-webkit-scrollbar-thumb:hover {
            background: rgba(20, 184, 166, 0.5);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
