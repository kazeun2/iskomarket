import React from 'react';

export function ChatSkeleton() {
  return (
    <div className="p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-3/4 bg-muted rounded" />
        <div className="h-40 bg-muted rounded" />
        <div className="h-8 w-1/2 bg-muted rounded" />
      </div>
    </div>
  );
}
