import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ProfileFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (frameName: string) => void;
}

const FRAME_THEMES = [
  {
    name: 'Spring Bloom',
    gradient: 'linear-gradient(135deg, #FFE5F1 0%, #FFF1F8 50%, #E8F5E9 100%)',
    accent: '#FF69B4',
    description: 'Fresh spring colors with floral accents'
  },
  {
    name: 'Emerald Crest',
    gradient: 'linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 50%, #81C784 100%)',
    accent: '#4CAF50',
    description: 'Deep forest green with gold trim'
  },
  {
    name: 'Night Indigo',
    gradient: 'linear-gradient(135deg, #C5CAE9 0%, #9FA8DA 50%, #7986CB 100%)',
    accent: '#3F51B5',
    description: 'Midnight blue with silver stars'
  },
  {
    name: 'Sunset Gold',
    gradient: 'linear-gradient(135deg, #FFE0B2 0%, #FFCC80 50%, #FFB74D 100%)',
    accent: '#FF9800',
    description: 'Warm golden sunset tones'
  }
];

export function ProfileFrameModal({
  isOpen,
  onClose,
  onConfirm
}: ProfileFrameModalProps) {
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedFrame) {
      toast.error('Please select a frame theme');
      return;
    }

    onConfirm(selectedFrame);
    toast.success('Semester frame applied for 7 days!', {
      description: `Your profile now features the ${selectedFrame} theme.`,
      duration: 4000,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard !w-[650px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Choose your semester theme frame</DialogTitle>
          <DialogDescription>
            Select a decorative frame to display on your profile for 7 days
          </DialogDescription>
        </DialogHeader>

        <div className="modal-header-standard">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg">Choose your semester theme frame</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a theme to personalize your profile
              </p>
            </div>
          </div>
        </div>

        <div className="modal-content-standard !max-h-[450px]">
          <div className="grid grid-cols-2 gap-4">
            {FRAME_THEMES.map((theme) => (
              <div
                key={theme.name}
                onClick={() => setSelectedFrame(theme.name)}
                className={`relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                  selectedFrame === theme.name
                    ? 'border-primary shadow-xl scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* Selection Checkmark */}
                {selectedFrame === theme.name && (
                  <div className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Frame Preview */}
                <div 
                  className="h-40 p-4 flex items-center justify-center relative overflow-hidden"
                  style={{ background: theme.gradient }}
                >
                  {/* Mock Profile Card */}
                  <div className="w-full h-full bg-white dark:bg-card rounded-lg shadow-lg p-3 flex flex-col items-center justify-center border-2"
                       style={{ borderColor: theme.accent }}>
                    <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 mb-2"></div>
                    <div className="h-2 w-20 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                    <div className="h-1.5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-2 left-2 h-3 w-3 rounded-full opacity-50"
                       style={{ backgroundColor: theme.accent }}></div>
                  <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full opacity-40"
                       style={{ backgroundColor: theme.accent }}></div>
                </div>

                {/* Theme Info */}
                <div className="p-3 bg-card border-t">
                  <h4 className="text-sm mb-1">{theme.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-xs text-purple-900 dark:text-purple-100">
              <strong>✨ Active Duration:</strong> Your selected frame will be visible for 7 days on your profile photo across the platform.
            </p>
          </div>
        </div>

        <div className="modal-footer-standard">
          <Button
            onClick={onClose}
            variant="outline"
            className="modal-button-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedFrame}
            className="modal-button-primary"
          >
            Apply Frame
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
