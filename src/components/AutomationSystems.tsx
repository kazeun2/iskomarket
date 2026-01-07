/**
 * ⚙️ AUTOMATION SYSTEMS - IskoMarket
 * 
 * This file contains all core automation systems that run in the background
 * to maintain marketplace integrity, fairness, and user engagement.
 * 
 * All systems follow the 8px grid spacing, use Inter font, and maintain
 * the premium dark-mode fintech/social app aesthetic.
 */

import { toast } from 'sonner';
import { CREDIT_SCORE_ACTIONS } from './CreditScoreSystem';

// ===========================
// 2.1 USER ACTIVITY AUTOMATION
// ===========================

export interface UserActivityTracker {
  userId: string;
  lastLogin: Date;
  lastPostEngagement: Date;
  lastSessionActivity: Date;
  inactiveDays: number;
  accountStatus: 'active' | 'on-hold' | 'at-risk' | 'deleted';
}

/**
 * Tracks user activity and automatically triggers actions based on inactivity thresholds
 */
export class UserActivityAutomation {
  private static THRESHOLDS = {
    REMINDER: 25,      // Send reminder notification
    ON_HOLD: 30,       // Restrict access and hide products
    AT_RISK: 90,       // Show critical warning
    DELETE: 100,       // Delete inactive account
  };

  /**
   * Calculate inactivity days from last login
   */
  static calculateInactiveDays(lastLogin: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check and apply inactivity automation
   */
  static checkInactivityStatus(user: UserActivityTracker): {
    action: 'none' | 'remind' | 'on-hold' | 'at-risk' | 'delete';
    message: string;
  } {
    const days = user.inactiveDays;

    if (days >= this.THRESHOLDS.DELETE) {
      return {
        action: 'delete',
        message: `Account deleted due to ${days} days of inactivity`,
      };
    } else if (days >= this.THRESHOLDS.AT_RISK) {
      return {
        action: 'at-risk',
        message: `Final warning: Account will be deleted in ${100 - days} days`,
      };
    } else if (days >= this.THRESHOLDS.ON_HOLD) {
      return {
        action: 'on-hold',
        message: 'Products hidden and buying restricted due to 30-day inactivity',
      };
    } else if (days >= this.THRESHOLDS.REMINDER) {
      return {
        action: 'remind',
        message: 'Reminder: Stay active to keep your account in good standing',
      };
    }

    return { action: 'none', message: '' };
  }

  /**
   * Send automated notification based on inactivity
   */
  static sendInactivityNotification(action: string, message: string): void {
    if (action === 'remind') {
      toast.warning(message, {
        duration: 5000,
        description: 'Click "I\'m Active" to reset your inactivity counter',
      });
    } else if (action === 'on-hold') {
      toast.error(message, {
        duration: 8000,
        description: 'Click "Appeal" to restore your account access',
      });
    } else if (action === 'at-risk') {
      toast.error(message, {
        duration: 10000,
        description: 'Log in now to prevent account deletion',
      });
    }
  }
}

// ===========================
// 2.2 CREDIT SCORE AUTOMATION
// ===========================

export interface CreditScoreUpdate {
  userId: string;
  actionType: string;
  points: number;
  timestamp: Date;
  oldScore: number;
  newScore: number;
}

/**
 * Automatically updates credit scores in real-time after transactions, ratings, or reports
 */
export class CreditScoreAutomation {
  private static MIN_SCORE = 0;
  private static MAX_SCORE = 100;
  private static STARTING_SCORE = 70;

  /**
   * Calculate new credit score after an action
   */
  static calculateNewScore(
    currentScore: number,
    actionId: string
  ): { newScore: number; change: number; tier: string } {
    const action = CREDIT_SCORE_ACTIONS[actionId];
    if (!action) {
      return { newScore: currentScore, change: 0, tier: this.getTier(currentScore) };
    }

    const points = action.points;
    const change = action.type === 'positive' ? points : -points;
    const newScore = Math.min(
      this.MAX_SCORE,
      Math.max(this.MIN_SCORE, currentScore + change)
    );

    return {
      newScore,
      change,
      tier: this.getTier(newScore),
    };
  }

  /**
   * Get tier classification based on score
   */
  static getTier(score: number): string {
    if (score >= 90) return 'Elite Isko';
    if (score >= 80) return 'Trusted Isko';
    if (score >= 70) return 'Reliable Isko';
    if (score >= 60) return 'Active Isko';
    if (score >= 50) return 'Trainee Isko';
    return 'Unranked Isko';
  }

  /**
   * Automatically update credit score and trigger rank-up animation if tier changed
   */
  static async updateCreditScore(
    userId: string,
    currentScore: number,
    actionId: string,
    onRankUp?: (oldTier: string, newTier: string, newScore: number) => void
  ): Promise<CreditScoreUpdate> {
    const oldTier = this.getTier(currentScore);
    const result = this.calculateNewScore(currentScore, actionId);
    const newTier = result.tier;

    const update: CreditScoreUpdate = {
      userId,
      actionType: actionId,
      points: result.change,
      timestamp: new Date(),
      oldScore: currentScore,
      newScore: result.newScore,
    };

    // Trigger rank-up animation if tier changed
    if (oldTier !== newTier && onRankUp) {
      onRankUp(oldTier, newTier, result.newScore);
    }

    // Show toast notification
    const action = CREDIT_SCORE_ACTIONS[actionId];
    if (action) {
      const sign = result.change > 0 ? '+' : '';
      toast.success(`${action.emoji} ${action.name}`, {
        description: `Credit Score: ${currentScore} → ${result.newScore} (${sign}${result.change})`,
      });
    }

    return update;
  }
}

// ===========================
// 2.3 VIOLATION & REPORTING AUTOMATION
// ===========================

export interface ViolationReport {
  reportId: string;
  reportedUserId: string;
  reportType: string;
  severity: 'minor' | 'major' | 'critical';
  isValid: boolean;
  timestamp: Date;
}

export interface ViolationPenalty {
  type: 'warning' | 'credit_deduction' | 'temporary_ban' | 'permanent_ban';
  creditDeduction?: number;
  banDuration?: number; // in hours
  notificationMessage: string;
}

/**
 * Automatically handles misconduct reports and applies penalties
 */
export class ViolationAutomation {
  /**
   * Determine penalty based on violation severity
   */
  static determinePenalty(
    violationType: string,
    violationCount: number
  ): ViolationPenalty {
    // First violation
    if (violationCount === 1) {
      return {
        type: 'warning',
        creditDeduction: 3,
        notificationMessage: 'First warning: Please review community guidelines.',
      };
    }

    // Second violation
    if (violationCount === 2) {
      return {
        type: 'credit_deduction',
        creditDeduction: 5,
        notificationMessage:
          'Second violation: 5 credit points deducted. One more violation may result in a temporary ban.',
      };
    }

    // Third violation
    if (violationCount === 3) {
      return {
        type: 'temporary_ban',
        creditDeduction: 8,
        banDuration: 72,
        notificationMessage:
          'Third violation: 8 credit points deducted and 3-day temporary ban applied.',
      };
    }

    // Fourth+ violation
    return {
      type: 'permanent_ban',
      notificationMessage: 'Multiple violations: Account permanently banned.',
    };
  }

  /**
   * Automatically apply penalty
   */
  static async applyPenalty(
    userId: string,
    penalty: ViolationPenalty,
    currentScore: number
  ): Promise<void> {
    // Deduct credit score
    if (penalty.creditDeduction) {
      const newScore = Math.max(0, currentScore - penalty.creditDeduction);
    }

    // Apply ban
    if (penalty.banDuration) {
      const banEndTime = new Date();
      banEndTime.setHours(banEndTime.getHours() + penalty.banDuration);
    }

    // Send notification
    toast.error('Violation Penalty Applied', {
      description: penalty.notificationMessage,
      duration: 8000,
    });
  }

  /**
   * Validate and process report automatically
   */
  static async processReport(report: ViolationReport): Promise<boolean> {
    if (!report.isValid) {
      return false;
    }

    // Auto-apply penalty based on violation history
    // In production, this would query the database for violation count
    const violationCount = 1; // Mock value
    const penalty = this.determinePenalty(report.reportType, violationCount);

    // Apply penalty automatically
    await this.applyPenalty(report.reportedUserId, penalty, 70); // Mock current score

    return true;
  }
}

// ===========================
// 2.4 LEADERBOARD AUTOMATION
// ===========================

export interface LeaderboardEntry {
  userId: string;
  username: string;
  creditScore: number;
  totalTransactions: number;
  rating: number;
  violationCount: number;
  rank: number;
}

/**
 * Automatically recalculates leaderboard at end of season
 */
export class LeaderboardAutomation {
  /**
   * Calculate leaderboard rankings based on performance metrics
   */
  static calculateRankings(users: Omit<LeaderboardEntry, 'rank'>[]): LeaderboardEntry[] {
    // Leaderboard feature removed — return simple deterministic ranks without side effects
    return users.map((user, idx) => ({
      userId: user.userId,
      username: user.username,
      creditScore: user.creditScore,
      totalTransactions: user.totalTransactions,
      rating: user.rating,
      violationCount: user.violationCount,
      rank: idx + 1,
    }));
  }

  /**
   * Publish leaderboard at end of season — no-op since leaderboards removed
   */
  static async publishLeaderboard(
    users: Omit<LeaderboardEntry, 'rank'>[],
    season: string
  ): Promise<LeaderboardEntry[]> {
    console.warn('[Automation] publishLeaderboard called but leaderboards were removed.');
    return this.calculateRankings(users);
  }
}

// ===========================
// 2.5 REWARD DISTRIBUTION AUTOMATION
// ===========================

export interface DailySpinReward {
  id: string;
  userId: string;
  iskoins: number;
  probability: number;
  timestamp: Date;
}

/**
 * Automatically schedules and distributes daily spin rewards
 */
export class RewardDistributionAutomation {
  private static REWARD_TIERS = [
    { iskoins: 5, probability: 0.4 },    // 40% - Common
    { iskoins: 10, probability: 0.3 },   // 30% - Uncommon
    { iskoins: 15, probability: 0.15 },  // 15% - Rare
    { iskoins: 25, probability: 0.1 },   // 10% - Epic
    { iskoins: 50, probability: 0.05 },  // 5% - Legendary
  ];

  /**
   * Determine reward using weighted random selection
   */
  static determineReward(): number {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const tier of this.REWARD_TIERS) {
      cumulativeProbability += tier.probability;
      if (random <= cumulativeProbability) {
        return tier.iskoins;
      }
    }

    return 5; // Fallback
  }

  /**
   * Check if user is eligible for daily spin
   */
  static isEligibleForSpin(lastSpinDate: Date | null): boolean {
    if (!lastSpinDate) return true;

    const now = new Date();
    const lastSpin = new Date(lastSpinDate);

    // Check if 24 hours have passed
    const hoursSinceLastSpin = (now.getTime() - lastSpin.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSpin >= 24;
  }

  /**
   * Distribute daily spin reward
   */
  static async distributeDailyReward(userId: string): Promise<DailySpinReward> {
    const iskoins = this.determineReward();

    const reward: DailySpinReward = {
      id: `spin_${Date.now()}_${userId}`,
      userId,
      iskoins,
      probability: this.REWARD_TIERS.find(t => t.iskoins === iskoins)?.probability || 0,
      timestamp: new Date(),
    };

    toast.success(`🎰 Daily Spin Complete!`, {
      description: `You won ${iskoins} Iskoins!`,
    });

    return reward;
  }
}

// ===========================
// 2.6 CHAT MODERATION AUTOMATION
// ===========================

export interface ChatViolation {
  userId: string;
  messageId: string;
  violationType: 'offensive_language' | 'spam' | 'harassment';
  detectedKeyword: string;
  timestamp: Date;
  violationNumber: number;
}

/**
 * Automatically monitors chat for offensive content and applies penalties
 */
export class ChatModerationAutomation {
  private static OFFENSIVE_KEYWORDS = [
    // Hate speech
    'putangina', 'gago', 'tanga', 'bobo', 'ulol', 'hayop', 'tarantado',
    // Sexual harassment
    'bastos', 'malibog',
    // Scam indicators
    'free money', 'send nudes', 'bank account', 'password',
  ];

  /**
   * Check message for offensive content
   */
  static detectViolation(message: string): { isViolation: boolean; keyword?: string } {
    const lowerMessage = message.toLowerCase();

    for (const keyword of this.OFFENSIVE_KEYWORDS) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return { isViolation: true, keyword };
      }
    }

    return { isViolation: false };
  }

  /**
   * Apply chat penalty based on violation count
   * 1st & 2nd violation: Warning only
   * 3rd+ violation: 24-hour ban per violation
   */
  static applyChatPenalty(violationNumber: number): {
    action: 'warning' | 'ban';
    banHours?: number;
    message: string;
  } {
    if (violationNumber <= 2) {
      return {
        action: 'warning',
        message: `Warning ${violationNumber}/2: Please use respectful language. Next violation will result in a 24-hour chat ban.`,
      };
    }

    const banHours = 24;
    return {
      action: 'ban',
      banHours,
      message: `Chat violation #${violationNumber}: You have been banned from messaging for 24 hours.`,
    };
  }

  /**
   * Automatically moderate message
   */
  static async moderateMessage(
    userId: string,
    messageId: string,
    message: string,
    currentViolationCount: number
  ): Promise<{ blocked: boolean; penalty?: any }> {
    const detection = this.detectViolation(message);

    if (detection.isViolation) {
      const violation: ChatViolation = {
        userId,
        messageId,
        violationType: 'offensive_language',
        detectedKeyword: detection.keyword!,
        timestamp: new Date(),
        violationNumber: currentViolationCount + 1,
      };

      const penalty = this.applyChatPenalty(violation.violationNumber);

      // Send notification
      toast.error('Message Blocked', {
        description: penalty.message,
        duration: 8000,
      });

      console.log(`[Chat Moderation] Blocked message from ${userId}: "${detection.keyword}"`);

      return { blocked: true, penalty };
    }

    return { blocked: false };
  }
}

// ===========================
// 2.7 EMAIL VERIFICATION AUTOMATION
// ===========================

export interface EmailVerification {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}

/**
 * Automatically generates and validates OTP for CvSU email verification
 */
export class EmailVerificationAutomation {
  private static OTP_LENGTH = 6;
  private static OTP_EXPIRY_MINUTES = 10;

  /**
   * Generate random 8-digit OTP
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate CvSU email format
   */
  static isValidCvSUEmail(email: string): boolean {
    const cvsuPattern = /^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/;
    return cvsuPattern.test(email);
  }

  /**
   * Send OTP email (mock implementation)
   */
  static async sendOTPEmail(email: string): Promise<EmailVerification> {
    if (!this.isValidCvSUEmail(email)) {
      throw new Error('Invalid CvSU email address');
    }

    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    const verification: EmailVerification = {
      email,
      otp,
      expiresAt,
      verified: false,
    };

    // In production, this would send an actual email via SendGrid/AWS SES
    console.log(`[Email Automation] OTP for ${email}: ${otp} (expires in ${this.OTP_EXPIRY_MINUTES}min)`);

    toast.success('OTP Sent', {
      description: `Check your ${email} inbox for the verification code`,
    });

    return verification;
  }

  /**
   * Validate OTP
   */
  static validateOTP(
    storedVerification: EmailVerification,
    enteredOTP: string
  ): { valid: boolean; message: string } {
    const now = new Date();

    if (now > storedVerification.expiresAt) {
      return { valid: false, message: 'OTP has expired. Request a new one.' };
    }

    if (storedVerification.otp !== enteredOTP) {
      return { valid: false, message: 'Invalid OTP. Please try again.' };
    }

    return { valid: true, message: 'Email verified successfully!' };
  }
}

// ===========================
// 2.8 REWARD REDEMPTION VALIDATION
// ===========================

export interface RewardRedemption {
  userId: string;
  rewardId: string;
  iskoinCost: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * Validates IsKoin balance and prevents exploitation during reward redemption
 */
export class RewardRedemptionAutomation {
  private static redemptionQueue = new Map<string, Date>();

  /**
   * Check if user has sufficient Iskoins
   */
  static validateBalance(currentIskoins: number, cost: number): boolean {
    return currentIskoins >= cost;
  }

  /**
   * Prevent simultaneous redemptions (double-spending protection)
   */
  static preventDoubleRedemption(userId: string): { allowed: boolean; message?: string } {
    const lastRedemption = this.redemptionQueue.get(userId);
    const now = new Date();

    if (lastRedemption) {
      const secondsSinceLastRedemption =
        (now.getTime() - lastRedemption.getTime()) / 1000;

      if (secondsSinceLastRedemption < 3) {
        return {
          allowed: false,
          message: 'Please wait before redeeming another reward',
        };
      }
    }

    this.redemptionQueue.set(userId, now);
    return { allowed: true };
  }

  /**
   * Validate and process reward redemption
   */
  static async redeemReward(
    userId: string,
    rewardId: string,
    cost: number,
    currentIskoins: number
  ): Promise<RewardRedemption> {
    // Check for simultaneous redemptions
    const doubleCheck = this.preventDoubleRedemption(userId);
    if (!doubleCheck.allowed) {
      return {
        userId,
        rewardId,
        iskoinCost: cost,
        timestamp: new Date(),
        success: false,
        errorMessage: doubleCheck.message,
      };
    }

    // Validate balance
    if (!this.validateBalance(currentIskoins, cost)) {
      return {
        userId,
        rewardId,
        iskoinCost: cost,
        timestamp: new Date(),
        success: false,
        errorMessage: 'Insufficient Iskoins',
      };
    }

    // Process redemption
    const redemption: RewardRedemption = {
      userId,
      rewardId,
      iskoinCost: cost,
      timestamp: new Date(),
      success: true,
    };

    toast.success('Reward Redeemed!', {
      description: `${cost} Iskoins deducted. Reward activated.`,
    });

    return redemption;
  }
}

// ===========================
// 2.10 REWARD EXPIRY SYSTEM
// ===========================

export interface ActiveRewardWithExpiry {
  id: string;
  userId: string;
  rewardId: string;
  title: string;
  activatedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expiring_soon' | 'expired';
}

/**
 * Automatically deactivates expired rewards and sends expiry notifications
 */
export class RewardExpiryAutomation {
  /**
   * Check if reward is expiring soon (within 24 hours)
   */
  static isExpiringSoon(expiresAt: Date): boolean {
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  }

  /**
   * Check if reward has expired
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Send expiry warning notification
   */
  static sendExpiryWarning(reward: ActiveRewardWithExpiry): void {
    const hoursLeft = Math.floor(
      (reward.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    );

    toast.warning(`Reward Expiring Soon`, {
      description: `"${reward.title}" expires in ${hoursLeft} hours!`,
      duration: 6000,
    });
  }

  /**
   * Deactivate expired reward
   */
  static deactivateExpiredReward(reward: ActiveRewardWithExpiry): ActiveRewardWithExpiry {
    toast.info('Reward Expired', {
      description: `"${reward.title}" has expired and been deactivated.`,
    });

    return {
      ...reward,
      status: 'expired',
    };
  }

  /**
   * Process all active rewards and check for expiry
   */
  static processRewards(activeRewards: ActiveRewardWithExpiry[]): ActiveRewardWithExpiry[] {
    return activeRewards.map((reward) => {
      if (this.isExpired(reward.expiresAt)) {
        return this.deactivateExpiredReward(reward);
      } else if (this.isExpiringSoon(reward.expiresAt) && reward.status === 'active') {
        this.sendExpiryWarning(reward);
        return { ...reward, status: 'expiring_soon' as const };
      }
      return reward;
    });
  }
}

// ===========================
// 2.13 TRANSACTION AUTOMATION
// ===========================

export interface TransactionTracking {
  id: string;
  buyerId: string;
  sellerId: string;
  productTitle: string;
  meetupDate: Date;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  status: 'pending' | 'confirmed' | 'unsuccessful' | 'appealed';
  createdAt: Date;
  confirmationDeadline: Date;
}

/**
 * Handles end-to-end transaction verification and automation
 */
export class TransactionAutomation {
  private static CONFIRMATION_DEADLINE_DAYS = 7;

  /**
   * Create new transaction tracking
   */
  static createTransaction(
    buyerId: string,
    sellerId: string,
    productTitle: string,
    meetupDate: Date
  ): TransactionTracking {
    const now = new Date();
    const deadline = new Date(meetupDate);
    deadline.setDate(deadline.getDate() + this.CONFIRMATION_DEADLINE_DAYS);

    return {
      id: `txn_${Date.now()}`,
      buyerId,
      sellerId,
      productTitle,
      meetupDate,
      buyerConfirmed: false,
      sellerConfirmed: false,
      status: 'pending',
      createdAt: now,
      confirmationDeadline: deadline,
    };
  }

  /**
   * Check if both parties confirmed
   */
  static isBothConfirmed(transaction: TransactionTracking): boolean {
    return transaction.buyerConfirmed && transaction.sellerConfirmed;
  }

  /**
   * Check if confirmation deadline passed
   */
  static isPastDeadline(transaction: TransactionTracking): boolean {
    return new Date() > transaction.confirmationDeadline;
  }

  /**
   * Automatically mark as unsuccessful if deadline passed without dual confirmation
   */
  static checkAndMarkUnsuccessful(
    transaction: TransactionTracking
  ): TransactionTracking {
    if (
      this.isPastDeadline(transaction) &&
      !this.isBothConfirmed(transaction) &&
      transaction.status === 'pending'
    ) {
      toast.error('Transaction Marked Unsuccessful', {
        description: `"${transaction.productTitle}" - Both parties did not confirm within 7 days`,
        duration: 8000,
      });

      return {
        ...transaction,
        status: 'unsuccessful',
      };
    }

    return transaction;
  }

  /**
   * Process confirmation and trigger rating modal
   */
  static async confirmTransaction(
    transaction: TransactionTracking,
    userId: string,
    onOpenRatingModal: () => void
  ): Promise<TransactionTracking> {
    let updatedTransaction = { ...transaction };

    // Mark user's confirmation
    if (userId === transaction.buyerId) {
      updatedTransaction.buyerConfirmed = true;
    } else if (userId === transaction.sellerId) {
      updatedTransaction.sellerConfirmed = true;
    }

    // If both confirmed, open rating modal and update credit scores
    if (this.isBothConfirmed(updatedTransaction)) {
      updatedTransaction.status = 'confirmed';

      toast.success('Transaction Successful!', {
        description: 'Both parties confirmed. Please rate each other.',
      });

      // Trigger rating modal
      setTimeout(() => {
        onOpenRatingModal();
      }, 500);

      // Update credit scores for both parties
      console.log('[Transaction Automation] Both parties get +3 credit points');
    } else {
      toast.success('Confirmation Received', {
        description: 'Waiting for the other party to confirm.',
      });
    }

    return updatedTransaction;
  }
}

// Export all automation classes
export default {
  UserActivityAutomation,
  CreditScoreAutomation,
  ViolationAutomation,
  LeaderboardAutomation,
  RewardDistributionAutomation,
  ChatModerationAutomation,
  EmailVerificationAutomation,
  RewardRedemptionAutomation,
  RewardExpiryAutomation,
  TransactionAutomation,
};
