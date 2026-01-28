import React, { useState } from 'react';
import { Palette, Check, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface MarketplaceThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (themeName: string) => void;
}

const MARKETPLACE_THEMES = [
  {
    name: 'Emerald & White',
    description: 'Classic CvSU green theme',
    colors: {
      primary: '#006400',
      secondary: '#228B22',
      background: '#f7f6f2',
      card: '#FFFFFF'
    },
    sample: 'Default marketplace theme'
  },
  {
    name: 'Midnight Indigo',
    description: 'Deep blue for night owls',
    colors: {
      primary: '#312E81',
      secondary: '#4F46E5',
      background: '#1E1B4B',
      card: '#312E81'
    },
    sample: 'Dark blue professional theme'
  },
  {
    name: 'Ivory Sand',
    description: 'Warm neutral tones',
    colors: {
      primary: '#92400E',
      secondary: '#D97706',
      background: '#FEF3C7',
      card: '#FFFBEB'
    },
    sample: 'Warm sandy beige theme'
  },
  {
    name: 'Aqua Mint',
    description: 'Fresh teal and mint',
    colors: {
      primary: '#0F766E',
      secondary: '#14B8A6',
      background: '#CCFBF1',
      card: '#F0FDFA'
    },
    sample: 'Cool aqua refresh theme'
  }
];

export function MarketplaceThemeModal({
  isOpen,
  onClose,
  onConfirm
}: MarketplaceThemeModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedTheme) {
      toast.error('Please select a theme');
      return;
    }

    onConfirm(selectedTheme);
    toast.success('Theme activated for 7 days!', {
      description: `Marketplace theme changed to ${selectedTheme}.`,
      duration: 4000,
    });
    onClose();
  };

  const currentTheme = MARKETPLACE_THEMES.find(t => t.name === (previewTheme || selectedTheme));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard !w-[750px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Choose your marketplace theme</DialogTitle>
          <DialogDescription>
            Customize the color palette of your marketplace experience for 7 days
          </DialogDescription>
        </DialogHeader>

        <div className="modal-header-standard">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
              <Palette className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg">Choose your marketplace theme</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personalize your marketplace color palette
              </p>
            </div>
          </div>
        </div>

        <div className="modal-content-standard !max-h-[550px]">
          <div className="grid grid-cols-2 gap-6">
            {/* Theme Selection Panel - 40% */}
            <div className="space-y-3">
              <h3 className="text-sm mb-2">Select Theme:</h3>
              {MARKETPLACE_THEMES.map((theme) => (
                <div
                  key={theme.name}
                  onClick={() => {
                    setSelectedTheme(theme.name);
                    setPreviewTheme(theme.name);
                  }}
                  onMouseEnter={() => setPreviewTheme(theme.name)}
                  onMouseLeave={() => setPreviewTheme(null)}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${
                    selectedTheme === theme.name
                      ? 'border-primary shadow-md bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {/* Theme Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm mb-0.5">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {theme.description}
                      </p>
                    </div>
                    {selectedTheme === theme.name && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2">
                        <Check className="h-3 w-3 text-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Color Swatches */}
                  <div className="flex gap-2">
                    <div 
                      className="h-6 w-6 rounded-md border"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary"
                    ></div>
                    <div 
                      className="h-6 w-6 rounded-md border"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="Secondary"
                    ></div>
                    <div 
                      className="h-6 w-6 rounded-md border"
                      style={{ backgroundColor: theme.colors.background }}
                      title="Background"
                    ></div>
                    <div 
                      className="h-6 w-6 rounded-md border"
                      style={{ backgroundColor: theme.colors.card }}
                      title="Card"
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Preview Panel - 60% */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm">Live Preview:</h3>
              </div>

              {currentTheme ? (
                <div 
                  className="rounded-xl p-4 border-2 min-h-[300px]"
                  style={{ 
                    backgroundColor: currentTheme.colors.background,
                    borderColor: currentTheme.colors.primary
                  }}
                >
                  {/* Mock Product Card */}
                  <div 
                    className="rounded-lg p-3 shadow-md"
                    style={{ backgroundColor: currentTheme.colors.card }}
                  >
                    <div className="h-32 rounded-md mb-2" 
                         style={{ backgroundColor: currentTheme.colors.primary + '20' }}>
                    </div>
                    <div className="h-3 rounded mb-2" 
                         style={{ backgroundColor: currentTheme.colors.primary + '40', width: '70%' }}>
                    </div>
                    <div className="h-2 rounded mb-3" 
                         style={{ backgroundColor: currentTheme.colors.primary + '20', width: '50%' }}>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-8 rounded" 
                           style={{ backgroundColor: currentTheme.colors.primary }}>
                      </div>
                      <div className="flex-1 h-8 rounded border-2" 
                           style={{ borderColor: currentTheme.colors.primary }}>
                      </div>
                    </div>
                  </div>

                  {/* Mock Button */}
                  <div className="mt-3 h-10 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: currentTheme.colors.secondary }}>
                    <span className="text-xs text-foreground">Sample Button</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] border-2 border-dashed rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    Hover over a theme to preview
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-xs text-purple-900 dark:text-purple-100">
              <strong>🎨 Active Duration:</strong> Your selected theme will be active for 7 days. A countdown timer will appear in Profile Settings showing "Theme active: X days left".
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
            disabled={!selectedTheme}
            className="modal-button-primary"
          >
            Apply Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
