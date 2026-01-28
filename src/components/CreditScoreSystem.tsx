import React, { useState } from "react";
import { toast } from "sonner";

/**
 * Credit Score Action Types
 */
export interface CreditScoreAction {
  id: string;
  type: "positive" | "negative";
  name: string;
  points: number;
  description: string;
  emoji: string;
}

/**
 * Credit Score Actions Configuration
 * All verified CvSU students start with 70 credit points upon registration.
 * Points automatically adjust based on marketplace behavior and performance.
 */
export const CREDIT_SCORE_ACTIONS: Record<
  string,
  CreditScoreAction
> = {
  // ✅ Positive Actions (Green)
  COMPLETED_TRANSACTION: {
    id: "completed_transaction",
    type: "positive",
    name: "Completed Transaction (Buy/Sell)",
    points: 3,
    description: "Encourages marketplace activity",
    emoji: "✅",
  },
  RECEIVED_HIGH_RATING: {
    id: "received_high_rating",
    type: "positive",
    name: "Received 4-5 Star Rating",
    points: 3,
    description: "Reflects consistent good performance",
    emoji: "⭐",
  },
  LEFT_STAR_RATING: {
    id: "left_star_rating",
    type: "positive",
    name: "Left a Star Rating",
    points: 2,
    description: "Builds feedback culture",
    emoji: "🗣️",
  },
  LEFT_WEBSITE_FEEDBACK: {
    id: "left_website_feedback",
    type: "positive",
    name: "Left Feedback for Website",
    points: 5,
    description: "Only for 3 times per account",
    emoji: "💬",
  },
  FOR_A_CAUSE_PURCHASE: {
    id: "for_a_cause_purchase",
    type: "positive",
    name: 'Purchased from "For a Cause"',
    points: 3,
    description: "Promotes campus empathy",
    emoji: "❤️",
  },
  NO_REPORTS_30_DAYS: {
    id: "no_reports_30_days",
    type: "positive",
    name: "30 Days Without Reports",
    points: 4,
    description: "Rewards clean transaction record",
    emoji: "📅",
  },
  QUICK_RESPONSE: {
    id: "quick_response",
    type: "positive",
    name: "Responded Within 24 Hours",
    points: 3,
    description: "Encourages responsiveness",
    emoji: "⚡",
  },
  TOP_5_MONTHLY: {
    id: "top_5_monthly",
    type: "positive",
    name: "Top 5 Buyer/Seller of Month",
    points: 5,
    description: "Monthly recognition",
    emoji: "🏆",
  },
  NO_VALID_REPORTS_3_MONTHS: {
    id: "no_valid_reports_3_months",
    type: "positive",
    name: "3 Months Without Valid Reports",
    points: 7,
    description:
      "Rewards consistency and respect in the community",
    emoji: "🛡️",
  },

  // ⚠️ Negative Actions (Red)
  VALID_REPORT: {
    id: "valid_report",
    type: "negative",
    name: "1 Valid Report Confirmed",
    points: -5,
    description: "Penalizes verified violations",
    emoji: "⚠️",
  },
  INAPPROPRIATE_MESSAGE: {
    id: "inappropriate_message",
    type: "negative",
    name: "Inappropriate Message",
    points: -5,
    description: "Keeps communication respectful",
    emoji: "💢",
  },
  IGNORED_TRANSACTION: {
    id: "ignored_transaction",
    type: "negative",
    name: "Ignored Transaction (>3 days)",
    points: -3,
    description: "Discourages irresponsibility",
    emoji: "🕓",
  },
  THREE_WARNINGS_MONTH: {
    id: "three_warnings_month",
    type: "negative",
    name: "3 Warnings in a Month",
    points: -10,
    description: "Leads to temporary suspension",
    emoji: "🚫",
  },
};

/**
 * Credit Score History Entry
 */
export interface CreditScoreHistoryEntry {
  id: string;
  userId: number;
  actionId: string;
  actionName: string;
  pointsChange: number;
  previousScore: number;
  newScore: number;
  timestamp: string;
  description: string;
  emoji: string;
}

/**
 * User Cooldown Status
 */
export interface CooldownStatus {
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  warningsThisMonth: number;
}

/**
 * Credit Score System Manager
 */
export class CreditScoreManager {
  private static readonly STARTING_SCORE = 70;
  private static readonly MIN_SCORE = 0;
  private static readonly MAX_SCORE = 100;
  private static readonly COOLDOWN_DAYS = 7;
  private static readonly WARNINGS_THRESHOLD = 3;

  /**
   * Apply a credit score action to a user
   */
  static applyAction(
    userId: number,
    currentScore: number,
    actionId: string,
    cooldownStatus: CooldownStatus,
    showToast: boolean = true,
  ): {
    newScore: number;
    historyEntry: CreditScoreHistoryEntry;
    newCooldownStatus: CooldownStatus;
  } {
    const action = CREDIT_SCORE_ACTIONS[actionId];
    if (!action) {
      throw new Error(`Invalid action ID: ${actionId}`);
    }

    // Check cooldown for positive actions
    if (action.type === "positive" && cooldownStatus.isActive) {
      if (showToast) {
        toast.warning("Credit Score Cooldown Active", {
          description: `Positive points disabled until ${new Date(cooldownStatus.endDate!).toLocaleDateString()}`,
          duration: 4000,
        });
      }
      return {
        newScore: currentScore,
        historyEntry: {
          id: `${Date.now()}-${userId}-${actionId}`,
          userId,
          actionId,
          actionName: action.name,
          pointsChange: 0,
          previousScore: currentScore,
          newScore: currentScore,
          timestamp: new Date().toISOString(),
          description: `${action.description} (Cooldown Active)`,
          emoji: "❄️",
        },
        newCooldownStatus: cooldownStatus,
      };
    }

    // Calculate new score
    let newScore = currentScore + action.points;
    newScore = Math.max(
      this.MIN_SCORE,
      Math.min(this.MAX_SCORE, newScore),
    );

    // Create history entry
    const historyEntry: CreditScoreHistoryEntry = {
      id: `${Date.now()}-${userId}-${actionId}`,
      userId,
      actionId,
      actionName: action.name,
      pointsChange: action.points,
      previousScore: currentScore,
      newScore,
      timestamp: new Date().toISOString(),
      description: action.description,
      emoji: action.emoji,
    };

    // Update cooldown status
    let newCooldownStatus = { ...cooldownStatus };

    // Check if this is a warning action
    if (
      actionId === "VALID_REPORT" ||
      actionId === "INAPPROPRIATE_MESSAGE" ||
      actionId === "IGNORED_TRANSACTION"
    ) {
      newCooldownStatus.warningsThisMonth += 1;

      // Trigger cooldown if threshold reached (3 warnings)
      if (
        newCooldownStatus.warningsThisMonth >=
        this.WARNINGS_THRESHOLD
      ) {
        const cooldownStart = new Date();
        const cooldownEnd = new Date(cooldownStart);
        cooldownEnd.setDate(
          cooldownEnd.getDate() + this.COOLDOWN_DAYS,
        );

        newCooldownStatus.isActive = true;
        newCooldownStatus.startDate =
          cooldownStart.toISOString();
        newCooldownStatus.endDate = cooldownEnd.toISOString();

        if (showToast) {
          toast.error("Credit Cooldown Activated", {
            description: `Credit scores disabled for ${this.COOLDOWN_DAYS} days after receiving 3 warnings (prevents abuse farming)`,
            duration: 6000,
          });
        }
      }
    }

    // Show toast notification
    if (showToast) {
      this.showActionToast(
        action,
        newScore - currentScore,
        newScore,
      );
    }

    return { newScore, historyEntry, newCooldownStatus };
  }

  /**
   * Show toast notification for credit score action
   */
  private static showActionToast(
    action: CreditScoreAction,
    pointsChange: number,
    newScore: number,
  ) {
    const isPositive = action.type === "positive";
    const title = `${action.emoji} ${action.name}`;
    const description = `${isPositive ? "+" : ""}${pointsChange} points • New score: ${newScore}`;

    if (isPositive) {
      toast.success(title, {
        description,
        duration: 3000,
      });
    } else {
      toast.error(title, {
        description,
        duration: 4000,
      });
    }
  }

  /**
   * Reset cooldown status (called monthly or by admin)
   */
  static resetCooldown(): CooldownStatus {
    return {
      isActive: false,
      startDate: null,
      endDate: null,
      warningsThisMonth: 0,
    };
  }

  /**
   * Check if cooldown has expired
   */
  static checkCooldownExpiry(
    cooldownStatus: CooldownStatus,
  ): CooldownStatus {
    if (!cooldownStatus.isActive || !cooldownStatus.endDate) {
      return cooldownStatus;
    }

    const now = new Date();
    const endDate = new Date(cooldownStatus.endDate);

    if (now >= endDate) {
      return {
        ...cooldownStatus,
        isActive: false,
        startDate: null,
        endDate: null,
      };
    }

    return cooldownStatus;
  }

  /**
   * Get starting credit score for new users
   */
  static getStartingScore(): number {
    return this.STARTING_SCORE;
  }

  /**
   * Get credit score tier information
   * Visual Feedback (Credit Progress UI)
   * The progress ring/meter changes color dynamically based on trust level.
   */
  static getTierInfo(score: number): {
    tier: string;
    color: string;
    emoji: string;
    description: string;
  } {
    if (score === 100) {
      return {
        tier: "Elite / Maxed",
        color: "cyan",
        emoji: "💎",
        description: "Top credibility and privileges",
      };
    } else if (score >= 80) {
      return {
        tier: "Trusted",
        color: "green",
        emoji: "🟢",
        description: "Reliable participant",
      };
    } else if (score >= 70) {
      return {
        tier: "Active",
        color: "yellow",
        emoji: "💛",
        description: "Active but still building trust",
      };
    } else if (score >= 61) {
      return {
        tier: "Needs Improvement",
        color: "orange",
        emoji: "🟠",
        description: "Recovering reputation",
      };
    } else {
      return {
        tier: "At Risk",
        color: "red",
        emoji: "🔴",
        description: "Under review & limited access",
      };
    }
  }

  /**
   * Generate mock credit history for testing
   */
  static generateMockHistory(
    userId: number,
    count: number = 10,
  ): CreditScoreHistoryEntry[] {
    const history: CreditScoreHistoryEntry[] = [];
    let currentScore = this.STARTING_SCORE;

    const actionKeys = Object.keys(CREDIT_SCORE_ACTIONS);

    for (let i = 0; i < count; i++) {
      const randomActionKey =
        actionKeys[
          Math.floor(Math.random() * actionKeys.length)
        ];
      const action = CREDIT_SCORE_ACTIONS[randomActionKey];

      const previousScore = currentScore;
      currentScore = Math.max(
        this.MIN_SCORE,
        Math.min(this.MAX_SCORE, currentScore + action.points),
      );

      const daysAgo = count - i;
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);

      history.push({
        id: `mock-${i}`,
        userId,
        actionId: randomActionKey,
        actionName: action.name,
        pointsChange: action.points,
        previousScore,
        newScore: currentScore,
        timestamp: timestamp.toISOString(),
        description: action.description,
        emoji: action.emoji,
      });
    }

    return history.reverse();
  }
}

/**
 * Hook for managing user credit score
 */
export function useCreditScore(
  userId: number,
  initialScore: number = 70,
) {
    const [score, setScore] = useState(initialScore);
    const [history, setHistory] = useState<CreditScoreHistoryEntry[]>([]);
    const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus>({
      isActive: false,
      startDate: null,
      endDate: null,
      warningsThisMonth: 0,
    });

  const applyAction = (
    actionId: string,
    showToast: boolean = true,
  ) => {
    const result = CreditScoreManager.applyAction(
      userId,
      score,
      actionId,
      cooldownStatus,
      showToast,
    );

    setScore(result.newScore);
    setHistory((prev) => [result.historyEntry, ...prev]);
    setCooldownStatus(result.newCooldownStatus);

    return result;
  };

  const checkCooldown = () => {
    const updated =
      CreditScoreManager.checkCooldownExpiry(cooldownStatus);
    if (updated.isActive !== cooldownStatus.isActive) {
      setCooldownStatus(updated);
    }
  };

  return {
    score,
    history,
    cooldownStatus,
    applyAction,
    checkCooldown,
    tierInfo: CreditScoreManager.getTierInfo(score),
  };
}

// For use in non-React contexts
export default CreditScoreManager;
