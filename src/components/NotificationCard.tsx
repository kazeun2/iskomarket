import { Notification } from "./NotificationsModal";

interface NotificationCardProps {
  key?: any;
  notification: Notification;
  onClick: () => void;
}

// Glow colors and shadows based on notification type
const getNotificationStyles = (type: string) => {
  switch (type) {
    case "message":
      return {
        // Soft green glow (#3BAE5C)
        shadow: "shadow-[0_0_12px_rgba(59,174,92,0.4)]",
        hoverShadow: "hover:shadow-[0_0_16px_rgba(59,174,92,0.6),0_8px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_16px_rgba(59,174,92,0.5),0_8px_20px_rgba(255,255,255,0.08)]",
        darkShadow: "dark:shadow-[0_0_12px_rgba(59,174,92,0.25)]",
      };
    case "system":
      return {
        // Deep green glow (#2F8B4D)
        shadow: "shadow-[0_0_12px_rgba(47,139,77,0.4)]",
        hoverShadow: "hover:shadow-[0_0_16px_rgba(47,139,77,0.6),0_8px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_16px_rgba(47,139,77,0.5),0_8px_20px_rgba(255,255,255,0.08)]",
        darkShadow: "dark:shadow-[0_0_12px_rgba(47,139,77,0.25)]",
      };
    case "report":
      return {
        // Soft orange glow (#FFA733)
        shadow: "shadow-[0_0_12px_rgba(255,167,51,0.4)]",
        hoverShadow: "hover:shadow-[0_0_16px_rgba(255,167,51,0.6),0_8px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_16px_rgba(255,167,51,0.5),0_8px_20px_rgba(255,255,255,0.08)]",
        darkShadow: "dark:shadow-[0_0_12px_rgba(255,167,51,0.25)]",
      };
    case "warning":
      return {
        // Soft red glow (#FF5C5C)
        shadow: "shadow-[0_0_12px_rgba(255,92,92,0.4)]",
        hoverShadow: "hover:shadow-[0_0_16px_rgba(255,92,92,0.6),0_8px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_16px_rgba(255,92,92,0.5),0_8px_20px_rgba(255,255,255,0.08)]",
        darkShadow: "dark:shadow-[0_0_12px_rgba(255,92,92,0.25)]",
      };
    case "transaction":
      return {
        // Mint green glow (#57C785)
        shadow: "shadow-[0_0_12px_rgba(87,199,133,0.4)]",
        hoverShadow: "hover:shadow-[0_0_16px_rgba(87,199,133,0.6),0_8px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_16px_rgba(87,199,133,0.5),0_8px_20px_rgba(255,255,255,0.08)]",
        darkShadow: "dark:shadow-[0_0_12px_rgba(87,199,133,0.25)]",
      };
    default:
      return {
        shadow: "shadow-md",
        hoverShadow: "hover:shadow-lg",
        darkShadow: "dark:shadow-md",
      };
  }
};

export function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const styles = getNotificationStyles(notification.type);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left
        px-5 py-4
        bg-white dark:bg-gradient-to-br dark:from-[#1a2f1a] dark:via-[#1a2317] dark:to-[#1a1f1a]
        rounded-[16px]
        border border-green-100 dark:border-green-900/20
        ${styles.shadow} ${styles.darkShadow} ${styles.hoverShadow}
        hover:-translate-y-1
        transition-all duration-200
        backdrop-blur-xl
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with unread dot */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-[15px] text-gray-900 dark:text-white line-clamp-1">
              {notification.title}
            </h4>
            {notification.isUnread && (
              <span className="flex-shrink-0 size-2 rounded-full bg-green-500 dark:shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            )}
          </div>

          {/* Description - hide for message type notifications */}
          {notification.type !== "message" && (
            <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {notification.description}
            </p>
          )}

          {/* Timestamp */}
          <span className="text-[12px] text-gray-500 dark:text-gray-500">
            {notification.timestamp}
          </span>
        </div>
      </div>
    </button>
  );
}