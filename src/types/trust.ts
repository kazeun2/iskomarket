export type CauseStatus = "pending" | "approved" | "rejected";

export type CauseType =
  | "medical"
  | "charity"
  | "fundraiser"
  | "organization"
  | "other";

export type ForCauseDetails = {
  id: string;
  productId: string;
  sellerId: string;

  fundraisingCause: string;     // text: Describe the purpose of this fundraiser
  organizationName?: string;    // Organization/Group
  fundraisingGoal: number;      // Fundraising Goal (PHP)

  verificationDocumentUrl: string; // uploaded proof
  verificationDocumentName: string;

  causeType: CauseType;
  status: CauseStatus;          // pending / approved / rejected
  adminNotes?: string;

  createdAt: string;
  reviewedAt?: string;
};

export type ReportTargetType = "product" | "user";

export type ReportReason =
  | "scam"
  | "fake_cause_proof"
  | "inappropriate_content"
  | "harassment"
  | "no_show"
  | "other";

export type ReportStatus = "pending" | "reviewed_valid" | "reviewed_invalid" | "spam";

export type Report = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;           // productId or userId
  reporterId: string;
  reportedUserId?: string;    // for product reports, inferred from product.sellerId

  reason: ReportReason;
  description: string;        // “Additional details” / “Description”
  hasExistingTransaction: boolean; // did reporter transact/meet with them?
  evidenceUrls: string[];     // up to 3 files for user report; 0..n for product

  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
};