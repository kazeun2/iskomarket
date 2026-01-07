import React, { useState } from "react";
import { Trophy, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface TrustedStudent {
  id: number;
  userId: number;
  username: string;
  avatar?: string;
  program: string;
  rating: number;
  creditScore: number;
  bio?: string;
  showBio: boolean;
  expiresAt: string;
  glowEffect?: any;
  frameEffect?: any;
  customTitle?: any;
  purchasedRewards?: string[];
}

interface TrustedStudentBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  trustedStudents: TrustedStudent[];
  currentUser: any;
  onUserClick?: (student: TrustedStudent) => void;
}

export function TrustedStudentBoardModal({
  isOpen,
  onClose,
  trustedStudents,
  currentUser,
  onUserClick,
}: TrustedStudentBoardModalProps) {
  const getInitials = (username: string) => {
    const cleaned = username.replace("@", "");
    return cleaned.slice(0, 2).toUpperCase();
  };

  const handleProfileClick = (student: TrustedStudent) => {
    if (onUserClick) {
      onUserClick(student);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard max-w-[650px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Compact Header with Close Button */}
        <DialogHeader className="px-6 py-4 border-b relative">
          <div className="flex items-center gap-3 pr-10">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Trustworthy Student Board
              </DialogTitle>
            </div>
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {trustedStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No featured students at the moment
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Redeem the Shout-Out feature to appear here!
              </p>
            </div>
          ) : (
            <>
              {/* Compact Grid - 2 columns */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {trustedStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleProfileClick(student)}
                    className="p-3 border rounded-lg bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10 border-amber-200/50 dark:border-amber-800/50 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      {/* Circle Avatar with Initials */}
                      <Avatar className="h-14 w-14 border-2 border-amber-400 dark:border-amber-600">
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm">
                          {getInitials(student.username)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Username */}
                      <div className="text-sm truncate w-full">
                        {student.username}
                      </div>

                      {/* Course/Program */}
                      <p className="text-xs text-muted-foreground truncate w-full">
                        {student.program}
                      </p>

                      {/* Bio (if exists and showBio is true) */}
                      {student.showBio && student.bio && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2 w-full">
                          "{student.bio}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Compact Info Text */}
              <div className="px-3 py-2 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-800/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>About:</strong> They earned this
                  recognition by redeeming the Shout-Out Feature
                  from the Reward Chest.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}