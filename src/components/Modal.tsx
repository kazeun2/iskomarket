"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from './ui/dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  forceZIndex?: number;
}

export function Modal({ open, onClose, title, children, className, forceZIndex }: ModalProps) {
  // Modal wrapper: enforces a single canonical dialog surface and backdrop for
  // consistent rendering across dev and production builds. It intentionally
  // applies `modal-pure-white` and robust layout utilities to avoid glassy
  // transparency or mix-blend differences between environments.
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} forceZIndex={forceZIndex}>
      {/* Overlay ensures full-screen dimmed backdrop */}
      <DialogOverlay className="!fixed inset-0 z-50 bg-black/40" />

      {/* Content is a responsive, centered panel */}
      <DialogContent
        className={cn(
<<<<<<< HEAD
          "forced-modal-bg bg-[#f8fafc]/95 w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-lg max-h-[90vh] overflow-y-auto bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]",
=======
          "w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-lg max-h-[90vh] overflow-y-auto bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]",
>>>>>>> 5fb2eafeae169a25463aa6b7379206387573cbb6
          className || ''
        )}
        aria-describedby="modal-description"
      >
        <DialogHeader className="modal-header-standard relative">
          {title ? (
            <DialogTitle className="text-center w-full">{title}</DialogTitle>
          ) : null}

          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="modal-content-standard mt-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
