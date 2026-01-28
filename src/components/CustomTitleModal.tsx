// CustomTitleModal removed as part of a feature removal. Kept a lightweight stub to preserve imports if referenced elsewhere.
import React from 'react';

interface CustomTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  onConfirm?: (title: string) => void;
}

export function CustomTitleModal(_props: CustomTitleModalProps) {
  // Feature removed: custom titles no longer supported.
  return null;
}
