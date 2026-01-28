import React, { useEffect } from "react";
import { X, ShoppingCart, Star, UserCheck, XCircle, TrendingDown, Clock, CheckCircle, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

export interface ActivityDetail {
  type: "transaction" | "credit" | "registration" | "system_error" | "slow_response";
  status?: "success" | "error" | string;
  action: string;
  user: string;
  details: string;
  change?: number; // For credit score changes
  time: string;
  timestamp?: Date;
  subType?: "successful" | "unsuccessful";
}

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityDetail | null;
}

export function ActivityDetailModal({ isOpen, onClose, activity }: ActivityDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;
  if (!activity) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[102] transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-[103] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#1a2f1a] dark:via-[#1a2317] dark:to-[#1a1f1a] rounded-[24px] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[calc(100%-32px)] md:max-w-[540px] lg:max-w-[600px] max-h-[90vh] flex flex-col pointer-events-auto border border-gray-200 dark:border-green-900/20 dark:backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - sticky */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-green-900/20 dark:bg-gradient-to-r dark:from-[#1a2f1a]/80 dark:via-[#1a2317]/80 dark:to-[#1a1f1a]/80 dark:backdrop-blur-sm">
            <h2 className="text-[22px] md:text-[24px] flex items-center gap-2 dark:text-foreground">
              {activity.type === "transaction" && (
                <ShoppingCart
                  className={`h-5 w-5 ${
                    activity.status === "success"
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                />
              )}
              {activity.type === "credit" && (
                <Star
                  className={`h-5 w-5 ${
                    activity.change && activity.change > 0
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                />
              )}
              {activity.type === "registration" && (
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              )}
              {activity.type === "system_error" && (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
              )}
              {activity.type === "slow_response" && (
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-500" />
              )}
              Activity Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors text-green-600 dark:text-green-500"
              aria-label="Close activity details"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-4">
              {/* Activity Type Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                  Type:
                </span>
                <Badge
                  className={
                    activity.type === "transaction"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-transparent dark:border-purple-700/30"
                      : activity.type === "credit"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-transparent dark:border-green-700/30"
                        : activity.type === "registration"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-transparent dark:border-blue-700/30"
                          : activity.type === "system_error"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-transparent dark:border-red-700/30"
                            : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-transparent dark:border-orange-700/30"
                  }
                >
                  {activity.type === "transaction" && "Transaction"}
                  {activity.type === "credit" && "Credit Score"}
                  {activity.type === "registration" && "Registration"}
                  {activity.type === "system_error" && "System Error"}
                  {activity.type === "slow_response" && "Slow Response"}
                </Badge>

                {activity.status && (
                  <Badge
                    variant={
                      activity.status === "success"
                        ? "default"
                        : activity.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {activity.status}
                  </Badge>
                )}
              </div>

              {/* Action */}
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1">
                  Action
                </p>
                <p className="text-base font-semibold dark:text-gray-200">
                  {activity.action}
                </p>
              </div>

              {/* User */}
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1">
                  User/Entity
                </p>
                <p className="text-base dark:text-gray-200">
                  {activity.user}
                </p>
              </div>

              {/* Details */}
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1">
                  Details
                </p>
                <div className="text-sm bg-muted dark:bg-green-900/20 p-3 rounded-lg dark:text-gray-300 border border-transparent dark:border-green-900/20">
                  {typeof activity.details === 'object' && activity.details !== null ? (
                    <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(activity.details, null, 2)}</pre>
                  ) : (
                    <div>{activity.details}</div>
                  )}
                </div>
              </div>

              {/* Credit Change */}
              {activity.change && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1">
                    Credit Score Change
                  </p>
                  <Badge
                    variant={
                      activity.change > 0
                        ? "default"
                        : "destructive"
                    }
                    className="text-base px-3 py-1"
                  >
                    {activity.change > 0 ? "+" : ""}
                    {activity.change} points
                  </Badge>
                </div>
              )}

              {/* Timestamp */}
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1">
                  Time
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <p className="text-sm dark:text-gray-300">
                    {activity.time}
                  </p>
                </div>
                {activity.timestamp && (
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {activity.timestamp.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Transaction Sub-Type */}
              {activity.subType && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1">
                    Transaction Status
                  </p>
                  <Badge
                    variant={
                      activity.subType === "successful"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {activity.subType === "successful"
                      ? "Successful"
                      : "Unsuccessful"}
                  </Badge>
                </div>
              )}

              {/* Admin Actions (for errors) */}
              {(activity.type === "system_error" ||
                activity.type === "slow_response") && (
                <div className="pt-4 border-t border-gray-200 dark:border-green-900/20">
                  <p className="text-sm font-medium mb-2 dark:text-gray-200">
                    Admin Actions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.success("Issue marked as resolved");
                        onClose();
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.success("Investigation started");
                        onClose();
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Investigate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
