/**
 * Format a date to "MMM YYYY" format (e.g., "Dec 2024")
 */
export function formatJoinDate(date: string | Date | null | undefined): string {
  if (!date) {
    // Return current month/year if no date provided
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      const now = new Date();
      return now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    return parsedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (error) {
    console.error('Error formatting date:', error);
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

/**
 * Format a date to "MMM DD, YYYY" format (e.g., "Dec 10, 2024")
 */
export function formatFullDate(date: string | Date | null | undefined): string {
  if (!date) {
    return 'N/A';
  }

  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return 'N/A';
    }

    return parsedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * Calculate how long ago a date was
 */
export function getTimeAgo(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Unknown';
  }

  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return 'Unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    } else {
      return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    }
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'Unknown';
  }
}

/**
 * Calculate number of days inactive
 */
export function getDaysInactive(lastActiveDate: string | Date | null | undefined): number {
  if (!lastActiveDate) {
    return 0;
  }

  try {
    const parsedDate = typeof lastActiveDate === 'string' ? new Date(lastActiveDate) : lastActiveDate;
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return 0;
    }

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  } catch (error) {
    console.error('Error calculating days inactive:', error);
    return 0;
  }
}

/**
 * Check if a user account is new (created within the last 7 days)
 */
export function isNewAccount(createdDate: string | Date | null | undefined): boolean {
  if (!createdDate) {
    return false;
  }

  try {
    const parsedDate = typeof createdDate === 'string' ? new Date(createdDate) : createdDate;
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return false;
    }

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays <= 7;
  } catch (error) {
    console.error('Error checking if account is new:', error);
    return false;
  }
}
