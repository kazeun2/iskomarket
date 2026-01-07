import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface GlowNameEffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onConfirm: (glowStyle: string) => void;
}

const GLOW_STYLES = [
  {
    name: 'Glow Green',
    preview: 'text-green-600 dark:text-green-400',
    shadow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]',
    description: 'Classic green with soft glow'
  },
  {
    name: 'Golden Pulse',
    preview: 'text-amber-500',
    shadow: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]',
    description: 'Warm gold with pulsing effect'
  },
  {
    name: 'Aqua Drift',
    preview: 'text-cyan-500',
    shadow: 'drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]',
    description: 'Cool cyan with drift animation'
  }
];

export function GlowNameEffectModal({
  isOpen,
  onClose,
  username,
  onConfirm
}: GlowNameEffectModalProps) {
  const [selectedGlow, setSelectedGlow] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedGlow) {
      toast.error('Please select a glow effect');
      return;
    }

    onConfirm(selectedGlow);
    toast.success('Glow effect applied for 3 days!', {
      description: 'Your username will glow across all pages.',
      duration: 4000,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="modal-header-standard">
          <DialogTitle>Activate glowing username</DialogTitle>
          <DialogDescription className="modal-subtitle">
            Display sample username preview with glowing animation styles.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-4">
          <div className="space-y-3">
            {GLOW_STYLES.map((style) => (
              <div
                key={style.name}
                onClick={() => setSelectedGlow(style.name)}
                className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                  selectedGlow === style.name
                    ? 'border-primary shadow-xl bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* Selection Checkmark */}
                {selectedGlow === style.name && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {/* Style Info */}
                  <div className="flex-1">
                    <h4 className="text-sm mb-1">{style.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {style.description}
                    </p>

                    {/* Preview */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Preview:</span>
                      <span className={`text-base ${style.preview} ${style.shadow} animate-pulse`}>
                        @{username || 'Username'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Indicator */}
                  <div className={`h-16 w-16 rounded-full ${style.preview} ${style.shadow} opacity-60 flex items-center justify-center`}>
                    <Sparkles className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
            <p className="text-xs text-cyan-900 dark:text-cyan-100">
              <strong>✨ Duration:</strong> Glow animation will appear around your username across all pages (posts, comments, messages) for 3 days.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 border-t flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedGlow}
            className="bg-green-600 hover:bg-green-700"
            style={{
              background: 'linear-gradient(135deg, #0F8A2C 0%, #0A5F1F 100%)',
              border: '1px solid #34E57A',
              color: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0px 0px 12px rgba(52,229,122,0.35)',
              padding: '10px 20px',
              fontWeight: 600
            }}
            onMouseEnter={(e: any) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #17A83A 0%, #0E7A2A 100%)';
            }}
            onMouseLeave={(e: any) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0F8A2C 0%, #0A5F1F 100%)';
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Redeem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}