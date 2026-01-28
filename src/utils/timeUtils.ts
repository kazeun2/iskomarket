/**
 * Converts a Supabase timestamp to JavaScript Date
 */
export function parseSupabaseTimestamp(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null;
  return new Date(timestamp);
}

/**
 * Formats a notification timestamp with "Just now" support
 * Specifically designed for notification timestamps
 */
export function formatNotificationTime(timestamp: Date | string | number): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return '';
  }

  if (diffInSeconds < 30) {
    return '';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 1) {
    return '';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // For dates older than 7 days, show the actual date
  const month = then.toLocaleString('en-US', { month: 'short' });
  const day = then.getDate();
  const year = then.getFullYear();
  const currentYear = now.getFullYear();

  // Only show year if it's different from current year
  if (year !== currentYear) {
    return `${month} ${day}, ${year}`;
  }

  return `${month} ${day}`;
}

/**
 * Formats a relative time for chat messages with shorter formats
 * Used for message timestamps in the chat system
 */
export function formatRelativeTime(timestamp: Date | string | number): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return '';
  }

  if (diffInSeconds < 60) {
    return '';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // For dates older than 7 days, show the actual date
  const month = then.toLocaleString('en-US', { month: 'short' });
  const day = then.getDate();
  const year = then.getFullYear();
  const currentYear = now.getFullYear();

  // Only show year if it's different from current year
  if (year !== currentYear) {
    return `${month} ${day}, ${year}`;
  }

  return `${month} ${day}`;
}

/**
 * Formats user's online status based on last active timestamp
 * Returns "Active now", "Active Xm ago", "Active Xh ago", or "Offline"
 */
export function formatOnlineStatus(lastActive: string | Date | null | undefined): { isOnline: boolean; statusText: string } {
  if (!lastActive) return { isOnline: false, statusText: 'Offline' };

  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffInSeconds = Math.floor((now.getTime() - lastActiveDate.getTime()) / 1000);

  // Active now if last activity was within the last 5 minutes
  if (diffInSeconds < 300) {
    return { isOnline: true, statusText: 'Active now' };
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return { isOnline: true, statusText: `Active ${diffInMinutes}m ago` };
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return { isOnline: true, statusText: `Active ${diffInHours}h ago` };
  }

  return { isOnline: false, statusText: 'Offline' };
}