import React, { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";

interface ShoutOutFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onConfirm: (showBio: boolean) => void;
}

export function ShoutOutFeatureModal({
  isOpen,
  onClose,
  currentUser,
  onConfirm,
}: ShoutOutFeatureModalProps) {
  const [showBio, setShowBio] = useState(true);

  const getInitials = (username: string) => {
    const cleaned = username?.replace("@", "") || "";
    return cleaned.slice(0, 2).toUpperCase();
  };

  const handleConfirm = () => {
    onConfirm(showBio);
    toast.success(
      "You've been featured on the Trusted Board!",
      {
        description:
          "Your profile will appear in the Featured Students section for 3 days.",
        duration: 4000,
      },
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard max-w-[550px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="modal-header-standard">
          <div className="pr-12">
            <DialogTitle>
              Feature Profile on the Trusted Student Board
            </DialogTitle>
            <DialogDescription className="modal-subtitle">
              Your profile will be visible for 3 days on the
              featured section.
            </DialogDescription>
          </div>
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full absolute top-4 right-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-4">
          {/* Profile Preview Card - Matching Trusted Student Board Style */}
          <div className="p-3 border rounded-lg bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10 border-amber-200/50 dark:border-amber-800/50">
            <div className="flex flex-col items-center text-center gap-2">
              {/* Circle Avatar with Initials */}
              <Avatar className="h-14 w-14 border-2 border-amber-400 dark:border-amber-600">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm">
                  {getInitials(currentUser?.username || "U")}
                </AvatarFallback>
              </Avatar>

              {/* Username */}
              <div className="text-sm truncate w-full">
                {currentUser?.username || "Username"}
              </div>

              {/* Course/Program */}
              <p className="text-xs text-muted-foreground truncate w-full">
                {currentUser?.program || "Program"}
              </p>

              {/* Bio (if showBio is true and bio exists) */}
              {showBio && currentUser?.bio && (
                <p className="text-xs text-muted-foreground italic line-clamp-2 w-full">
                  "{currentUser.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Bio Option */}
          <div className="mt-4 flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="show-bio"
              checked={showBio}
              onCheckedChange={(checked) =>
                setShowBio(checked as boolean)
              }
            />
            <div className="flex-1">
              <label
                htmlFor="show-bio"
                className="text-sm cursor-pointer"
              >
                Allow my short bio to be shown
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your bio will help other students know more
                about you
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>📢 Visibility:</strong> Your profile will
              appear in the Trusted Featured Students board for
              3 days.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 border-t flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
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
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Redeem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}