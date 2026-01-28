import { NotificationFilter } from "./NotificationsModal";

interface NotificationTabsProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  unreadCount?: number;
  messagesCount?: number;
  systemCount?: number;
  reportsCount?: number;
  appealsCount?: number;
}

const filters: { value: NotificationFilter; label: string; countKey?: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread", countKey: "unreadCount" },
  { value: "messages", label: "Messages", countKey: "messagesCount" },
  { value: "system", label: "System", countKey: "systemCount" },
  { value: "reports", label: "Reports", countKey: "reportsCount" },
  { value: "appeals", label: "Appeals", countKey: "appealsCount" },
];

export function NotificationTabs({ 
  activeFilter, 
  onFilterChange,
  unreadCount = 0,
  messagesCount = 0,
  systemCount = 0,
  reportsCount = 0,
  appealsCount = 0
}: NotificationTabsProps) {
  const counts = {
    unreadCount,
    messagesCount,
    systemCount,
    reportsCount,
    appealsCount
  };

  const getCount = (countKey?: string) => {
    if (!countKey) return 0;
    return counts[countKey as keyof typeof counts] || 0;
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {filters.map((filter) => {
        const count = getCount(filter.countKey);
        
        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full transition-all duration-200 relative
              ${
                activeFilter === filter.value
                  ? "bg-green-500 dark:bg-green-700 text-foreground shadow-md dark:shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
                  : "bg-gray-100 dark:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-green-900/40 hover:text-green-600 dark:hover:text-green-400 border border-transparent dark:border-green-700/30"
              }
            `}
          >
            <span className="flex items-center gap-1.5">
              {filter.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] ${
                  activeFilter === filter.value 
                    ? "bg-card/20 dark:bg-[var(--card)]/20 text-foreground" 
                    : "bg-green-500 dark:bg-green-600 text-foreground dark:shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                }`}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
