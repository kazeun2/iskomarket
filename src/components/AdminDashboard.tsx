// Updated: Fixed light mode theming with proper contrast
import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  AlertTriangle,
  Users,
  Package,
  TrendingUp,
  Flag,
  User,
  Ban,
  CheckCircle,
  Eye,
  X,
  Calendar,
  Clock,
  Activity,
  Trash2,
  Send,
  AlertCircle,
  UserCheck,
  UserX,
  Mail,
  BarChart3,
  FileText,
  Megaphone,
  Search,
  ShoppingCart,
  CalendarClock,
  TrendingDown,
  Zap,
  AlertOctagon,
  Star,
  Award,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { SystemAlertModal } from "./SystemAlertModal";
import AdminAppeals from '../components/AdminAppeals';
import { AdminForCauseReview } from './AdminForCauseReview';
import { AdminReports } from './AdminReports';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getPrimaryImage } from "../utils/images";
import { UsernameWithGlow } from './UsernameWithGlow';
import { ActiveProductsModal } from './ActiveProductsModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { InactiveAccountsPanel } from "./InactiveAccountsPanel";
import { adminFlags } from "../config/adminFlags";
import { useMaintenanceStatus } from '../hooks/useMaintenanceStatus';
import { updateMaintenanceSettings } from '../services/maintenanceSettingsService';
import { WarningConfirmationModal } from "./WarningConfirmationModal";
import { SeasonResetCountdown } from "./SeasonResetCountdown";
import {
  CreditScoreModal,
} from "./CreditScoreModal";
import { MinimalStatCard } from "./MinimalStatCard";
import { SellerProfile } from "./SellerProfile";

import { useOverlayManager, useOptionalOverlayManager } from "../contexts/OverlayManager";
import { ProductDetail } from "./ProductDetail";
import { isExampleMode, filterExampleData } from "../utils/exampleMode";
import { getAllUsers, subscribeToUsers, User as ServiceUser } from "../services/userService";
import { getPendingReports, subscribeToReports, updateReportStatus, Report as ReportType } from "../services/reportService";
import { getTodaysActivities, subscribeToActivities } from "../services/activityService";
import { getRecentSystemLogs, subscribeToSystemLogs } from "../services/systemLogService";
import { getRecentAdminAuditLogs, subscribeToAdminAuditLogs, insertAdminAuditLog, AdminAuditUI } from "../services/adminAuditService";
import { SeasonResetConfirmationModal } from "./SeasonResetConfirmationModal";
import { SeasonResetFinalConfirmationModal } from "./SeasonResetFinalConfirmationModal";
import { SeasonResetProcessingModal } from "./SeasonResetProcessingModal";

interface AdminDashboardProps {
  currentUser?: any;
  onSendWarning?: (
    username: string,
    message: string,
    inactiveDays: number,
  ) => void;
}

export function AdminDashboard({
  currentUser,
  onSendWarning,
}: AdminDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStatModal, setSelectedStatModal] = useState<
    string | null
  >(null);
  const [selectedProduct, setSelectedProduct] =
    useState<any>(null);
  const [selectedReport, setSelectedReport] =
    useState<any>(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [showWarningModal, setShowWarningModal] =
    useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] =
    useState(false);
  const [showRemoveAccountModal, setShowRemoveAccountModal] =
    useState(false);
  const [
    showInactiveAccountsPanel,
    setShowInactiveAccountsPanel,
  ] = useState(false);
  const [showFlaggedWarnModal, setShowFlaggedWarnModal] =
    useState(false);
  const [showFlaggedSuspendModal, setShowFlaggedSuspendModal] =
    useState(false);
  const [flaggedUserMessage, setFlaggedUserMessage] =
    useState("");

  // Ensure overlay manager and selected seller state are declared before effects that use them
  const [selectedSellerProfile, setSelectedSellerProfile] =
    useState<any>(null);

  // Use a non-throwing optional hook so AdminDashboard can be rendered outside the OverlayProvider
  const overlayManager = useOptionalOverlayManager();

  const [showWarningConfirmation, setShowWarningConfirmation] = useState(false);
  const [showFlaggedWarnConfirmation, setShowFlaggedWarnConfirmation] = useState(false);
  const [showFlaggedSuspendConfirmation, setShowFlaggedSuspendConfirmation] = useState(false);

  // Forward legacy modal flags to OverlayManager so these actions render at app root
  React.useEffect(() => {
    if (!overlayManager || !overlayManager.show) return;

    if (showFlaggedWarnModal && selectedSellerProfile) {
      overlayManager.show('notice', {
        mode: 'warn',
        user: selectedSellerProfile,
        onSend: (mode: string, user: any) => {
          setShowFlaggedWarnModal(false);
          setSelectedSellerProfile(null);
          toast.success('Warning notice sent successfully');
        },
      });
      // reset local flag to avoid re-show
      setShowFlaggedWarnModal(false);
    }

    if (showFlaggedSuspendModal && selectedSellerProfile) {
      overlayManager.show('notice', {
        mode: 'suspend',
        user: selectedSellerProfile,
        onSend: (mode: string, user: any) => {
          setShowFlaggedSuspendModal(false);
          setSelectedSellerProfile(null);
          toast.success('Suspension notice sent successfully');
        },
      });
      setShowFlaggedSuspendModal(false);
    }
  }, [showFlaggedWarnModal, showFlaggedSuspendModal, selectedSellerProfile, overlayManager]);

  // Forward legacy warning confirmation flag to OverlayManager
  React.useEffect(() => {
    if (!overlayManager || !overlayManager.show) return;
    if (showWarningConfirmation && selectedSellerProfile) {
      overlayManager.show('warningConfirmation', {
        user: selectedSellerProfile,
        onConfirm: () => handleSendWarning(selectedSellerProfile),
      });
      setShowWarningConfirmation(false);
    }
  }, [showWarningConfirmation, selectedSellerProfile, overlayManager]);



  // Fetch pending reports (Supabase) and subscribe to realtime updates.
  React.useEffect(() => {
    if (isExampleMode(currentUser)) return;
    let mounted = true;

    const mapReportRowToUi = (row: any) => {
      const reporter = (row as any).reporter || null;
      const reportedUser = (row as any).reported_user || null;

      return {
        id: row.id,
        type: row.reported_type,
        reportedItem: row.reported_item_name || String(row.reported_id || row.reported_user_id || ''),
        reportedItemId: row.reported_id,
        reportedBy: reporter ? { username: reporter.username, id: reporter.id } : { username: undefined, id: row.reporter_id },
        reportedUser: reportedUser ? { username: reportedUser.username, id: reportedUser.id } : undefined,
        reason: row.reason,
        date: row.created_at,
        status: row.status,
        description: row.description,
        evidence_urls: row.evidence_urls || [],
        raw: row,
      };
    };

    const load = async () => {
      const { data, error } = await getPendingReports();
      if (!mounted) return;
      if (data) setPendingReports((data as any[]).map(mapReportRowToUi));
      if (error) console.error('Failed to load pending reports:', error);
    };

    load();

    const unsubscribe = subscribeToReports((data: any[]) => {
      setPendingReports((data || []).map(mapReportRowToUi));
    });

    const onReportsChanged = () => {
      load();
    };
    window.addEventListener('iskomarket:reports-changed', onReportsChanged);

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      window.removeEventListener('iskomarket:reports-changed', onReportsChanged);
    };
  }, [currentUser]);

  // Fetch today's activities and subscribe with simple batching
  const activitiesBatchRef = useRef<any[]>([]);
  const activitiesTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isExampleMode(currentUser)) return;
    let mounted = true;

    (async () => {
      const { data, error } = await getTodaysActivities();
      if (!mounted) return;
      if (data) setTodaysActivitiesState(data as any[]);
      if (error) console.error('Failed to load todays activities:', error);
    })();

    const unsubscribe = subscribeToActivities((data: any[]) => {
      // Batch updates to avoid flooding UI
      activitiesBatchRef.current = (activitiesBatchRef.current || []).concat(data || []);
      if (activitiesTimerRef.current) {
        window.clearTimeout(activitiesTimerRef.current);
      }
      activitiesTimerRef.current = window.setTimeout(() => {
        setTodaysActivitiesState(prev => {
          // Merge and dedupe by a stable key (fallback to created_at if id missing)
          const map = new Map<string, any>();
          prev.forEach((a) => {
            const key = String(a.id ?? a.created_at ?? `${a.type}-${a.action}-${a.time}`);
            map.set(key, a);
          });
          activitiesBatchRef.current.forEach((a) => {
            const key = String(a.id ?? a.created_at ?? `${a.type}-${a.action}-${a.time}-${Math.random()}`);
            map.set(key, a);
          });
          activitiesBatchRef.current = [];
          return Array.from(map.values()).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
      }, 250);
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      if (activitiesTimerRef.current) window.clearTimeout(activitiesTimerRef.current);
    };
  }, [currentUser]);

  // System logs (monitoring) - state and pagination
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const LOGS_PER_PAGE = 50;

  const transactionActivities = systemLogs.filter((a: any) => a.category === 'transaction' || a.type === 'transaction');
  const successfulTransactions = transactionActivities.filter((a: any) => a.subType === 'successful' || a.severity === 'SUCCESS');
  const unsuccessfulTransactions = transactionActivities.filter((a: any) => a.subType === 'unsuccessful' || a.severity === 'ERROR');
  const creditScoreLogs = systemLogs.filter((a: any) => a.category === 'credit');
  const systemErrors = systemLogs.filter((a: any) => a.category === 'error');
  const slowResponses = systemLogs.filter((a: any) => a.category === 'slow');

  // System logs (monitoring) - fetch and realtime
  useEffect(() => {
    if (isExampleMode(currentUser)) return;
    let mounted = true;

    const loadLogs = async (page = 1) => {
      try {
        const { data, error } = await getRecentSystemLogs({ sinceDays: 7, limit: LOGS_PER_PAGE, offset: (page - 1) * LOGS_PER_PAGE });
        if (!mounted) return;
        if (data) setSystemLogs((prev) => {
          // merge by id, but keep newest first
          const map = new Map<string, any>();
          data.forEach((d: any) => map.set(String(d.id), d));
          prev.forEach((p: any) => map.set(String(p.id), p));
          return Array.from(map.values()).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
        if (error) console.error('Failed to load system logs:', error);
      } catch (err) {
        console.error('Unexpected error loading system logs:', err);
      }
    };

    loadLogs(logsPage);

    const unsubscribe = subscribeToSystemLogs((data: any[]) => {
      // Prepend any new items (dedupe by id)
      setSystemLogs((prev) => {
        const map = new Map<string, any>();
        data.forEach(d => map.set(String(d.id), d));
        prev.forEach(p => map.set(String(p.id), p));
        return Array.from(map.values()).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, logsPage]);


  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditUI[]>([]);
  const [selectedProductDetails, setSelectedProductDetails] =
    useState<any>(null);

  // Modals for trust/admin actions
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showForCauseModal, setShowForCauseModal] = useState(false);

  React.useEffect(() => {
    if (!selectedProductDetails) return;
    if (!overlayManager || !overlayManager.show) return;

    overlayManager.show('productDetail', {
      product: selectedProductDetails,
      meetupLocations: [],
      currentUser: { id: 1, username: 'admin', name: 'Administrator' },
      // Optional callback used by ProductDetail when user clicks "Delete". Opens the productDelete overlay without automatically hiding the productDetail.
      onRequestDelete: (product: any) => {
        overlayManager.show('productDelete', {
          product,
          initialReason: productDeleteReason,
          onConfirm: (reason: string) => handleMarketplaceProductDelete(product, reason),
        });
      },
      // Back-compat / fallback when the productDetail wants to signal it was deleted elsewhere
      onProductDeleted: (id: number) => {
        // Notify the global app so product lists can update immediately
        try {
          window.dispatchEvent(new CustomEvent('iskomarket:product-deleted', { detail: { id } }));
        } catch (e) {
          console.warn('dispatch product-deleted event failed', e);
        }
        setSelectedProductDetails(null);
      },
    });

    setSelectedProductDetails(null);
  }, [selectedProductDetails, overlayManager]);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);

  // Moderation: update report status
  const handleUpdateReport = async (status: ReportType['status']) => {
    if (!selectedReport || !selectedReport.id) return;
    try {
      const { data, error } = await updateReportStatus(String(selectedReport.id), status as any);
      if (error) {
        console.error('Failed to update report status:', error);
        toast.error('Failed to update report');
        return;
      }
      // Remove from local pending list for immediate feedback
      setPendingReports(prev => prev.filter(r => String(r.id) !== String(selectedReport.id)));
      toast.success('Report updated');
      setSelectedReport(null);
    } catch (err) {
      console.error('Unexpected error updating report:', err);
      toast.error('Unexpected error updating report');
    }
  };

  // If a selected seller profile is set (various click handlers call setSelectedSellerProfile),
  // display it via the global OverlayManager to avoid nested modal stacking contexts.
  React.useEffect(() => {
    if (!selectedSellerProfile) return;
    if (!overlayManager || !overlayManager.show) return;

    const seller = {
      ...selectedSellerProfile,
      name: selectedSellerProfile.username || selectedSellerProfile.name,
      rating: selectedSellerProfile.rating || 4.8,
      totalRatings: selectedSellerProfile.totalRatings || 24,
      reviews: selectedSellerProfile.reviews || [],
      bio: selectedSellerProfile.bio || "Member of the IskoMarket community.",
    };

    const sellerProducts = allProducts
      .filter((p) => p.seller.id === selectedSellerProfile.id)
      .map((p) => ({
        ...p,
        images: (p as any).images || (p.image ? [p.image] : []),
        condition: p.condition || "Good",
        location: p.location || "CvSU Main Campus",
      }));

    overlayManager.show("profile", {
      userId: selectedSellerProfile.id,
      currentUser: { id: 1, username: "admin", name: "Administrator" },
      isAdmin: true,
      onReport: (s: any) => {
        toast.success("Report submitted (mock)");
      },
      onDelete: (s: any) => {
        setShowRemoveAccountModal(true);
      },
    });
    // clear local selection — profile will be handled by OverlayHost
    setSelectedSellerProfile(null);

    // clear local selection to avoid rendering nested profile
    setSelectedSellerProfile(null);
  }, [selectedSellerProfile, overlayManager]);
  // product delete modal is now handled by OverlayManager (screen-level overlay)
  // Credit score handled via OverlayManager / screen-level overlays - no local nested modal state needed
  // (the old `showCreditScoreModal` local state was removed to avoid nested modal stacking issues)
  const [productDeleteReason, setProductDeleteReason] =
    useState("");
  const [auditLogFilter, setAuditLogFilter] = useState({
    role: "all",
    action: "all",
    date: "all",
  });
  const [showSeasonSummary, setShowSeasonSummary] =
    useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Users state (real data from Supabase when not in example mode)
  const [users, setUsers] = useState<ServiceUser[] | any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const usersSubscriptionRef = useRef<(() => void) | null>(null);

  // Local UI profile shape used by the modal
  interface Profile {
    id: string | number;
    username: string;
    name?: string;
    email: string;
    program?: string;
    status?: string;
    joinDate?: string;
    creditScore?: number;
    lastActive?: string;
    inactiveDays?: number;
    avatar_url?: string;
  }

  function normalizeUser(u: ServiceUser | any): Profile {
    const joinDate = u.created_at || u.joinDate || new Date().toISOString();
    const lastActive = u.last_active || u.lastActive || u.updated_at || joinDate;
    const creditScore = (u.credit_score ?? u.creditScore) as number | undefined;

    const inactiveDays = Math.max(
      0,
      Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: u.id,
      username: u.username || (u.email || "").split("@")[0] || "unknown",
      name: u.name || u.username,
      email: u.email || "",
      program: u.program || u.department || "",
      status: u.status || "active",
      joinDate,
      creditScore: creditScore ?? 0,
      lastActive,
      inactiveDays,
      avatar_url: u.avatar_url,
    };
  }

  // Fetch users and subscribe when modal opens (only in non-example mode)
  useEffect(() => {
    if (isExampleMode(currentUser)) return; // skip in example mode

    let mounted = true;

    async function loadUsers() {
      setIsLoadingUsers(true);
      setUsersError(null);
      try {
        const { data, error } = await getAllUsers();
        if (!mounted) return;
        setIsLoadingUsers(false);
        if (error) {
          setUsersError(String(error.message || "Failed to fetch users"));
          return;
        }

        const normalized = (data || []).map(normalizeUser);

        // make sure current admin is included
        if (currentUser && !normalized.find((x) => x.id === currentUser.id || x.email === currentUser.email)) {
          normalized.unshift(
            normalizeUser({ id: currentUser.id, username: currentUser.username, email: currentUser.email, created_at: new Date().toISOString(), status: "active" }),
          );
        }

        setUsers(normalized);
        setFilteredUsers(normalized);
      } catch (err: any) {
        if (!mounted) return;
        setIsLoadingUsers(false);
        setUsersError(String(err?.message || err));
      }
    }

    if (selectedStatModal === "totalUsers") {
      loadUsers();

      const unsubscribe = subscribeToUsers(async (updated) => {
        const normalized = (updated || []).map(normalizeUser);

        if (currentUser && !normalized.find((x) => x.id === currentUser.id || x.email === currentUser.email)) {
          normalized.unshift(
            normalizeUser({ id: currentUser.id, username: currentUser.username, email: currentUser.email, created_at: new Date().toISOString(), status: "active" }),
          );
        }

        setUsers(normalized);
      });

      usersSubscriptionRef.current = unsubscribe;
    }

    return () => {
      mounted = false;
      if (usersSubscriptionRef.current) {
        usersSubscriptionRef.current();
        usersSubscriptionRef.current = null;
      }
    };
  }, [selectedStatModal, currentUser]);

  // Debounced search: update filteredUsers when users or search term changes
  useEffect(() => {
    if (isExampleMode(currentUser)) return; // searching for example mode handled inline

    const q = userSearchTerm.trim().toLowerCase();

    const handler = setTimeout(() => {
      if (!q) {
        setFilteredUsers(users as any[]);
        return;
      }

      setFilteredUsers(
        (users as any[]).filter((u) => {
          return (
            (u.username || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q)
          );
        }),
      );
    }, 250);

    return () => clearTimeout(handler);
  }, [userSearchTerm, users]);
  const [showFullSeasonStats, setShowFullSeasonStats] =
    useState(false);
  const [showSystemAlert, setShowSystemAlert] = useState(false);
  // Maintenance window state (active window shown to admins)
  const { id: maintenanceId, isActive: maintenanceIsActive, title: maintenanceTitle, message: maintenanceMessage } = useMaintenanceStatus();
  const [showCancelMaintenanceConfirmation, setShowCancelMaintenanceConfirmation] = useState(false);
  const [isCancellingMaintenance, setIsCancellingMaintenance] = useState(false);
  const [appealSearchTerm, setAppealSearchTerm] = useState("");
  const [activitiesTab, setActivitiesTab] = useState("all");
  const [selectedActivity, setSelectedActivity] =
    useState<any>(null);
  const [showActivityDetailModal, setShowActivityDetailModal] =
    useState(false);
  const [transactionFilter, setTransactionFilter] = useState<
    "all" | "successful" | "unsuccessful"
  >("all");
  const [showSeasonResetConfirmation, setShowSeasonResetConfirmation] = useState(false);
  const [showSeasonResetFinal, setShowSeasonResetFinal] = useState(false);
  const [showSeasonResetProcessing, setShowSeasonResetProcessing] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);



  // NOTE: adminStats is now calculated dynamically after filtered arrays are defined (see line ~906)

  // Mock data for detailed modals - only shown for example accounts
  const mockAllUsers = [
    {
      id: 1,
      username: "MariaBendo",
      name: "MariaBendo",
      email: "maria.santos@cvsu.edu.ph",
      program: "BS Computer Science",
      status: "active",
      joinDate: "2024-01-15",
      creditScore: 95,
      lastActive: "2024-12-30",
      inactiveDays: 0,
    },
    {
      id: 2,
      username: "JohnDela",
      name: "JohnDela",
      email: "john.delacruz@cvsu.edu.ph",
      program: "BS Information Technology",
      status: "active",
      joinDate: "2024-02-20",
      creditScore: 88,
      lastActive: "2024-12-30",
      inactiveDays: 0,
    },
    {
      id: 3,
      username: "AnnaReyes",
      name: "AnnaReyes",
      email: "anna.reyes@cvsu.edu.ph",
      program: "BS Engineering",
      status: "inactive",
      joinDate: "2024-03-10",
      creditScore: 92,
      lastActive: "2024-11-01",
      inactiveDays: 35,
    },
    {
      id: 4,
      username: "CarlosMar",
      name: "CarlosMar",
      email: "carlos.martinez@cvsu.edu.ph",
      program: "BS Biology",
      status: "inactive",
      joinDate: "2023-11-05",
      creditScore: 76,
      lastActive: "2024-10-15",
      inactiveDays: 65,
    },
    {
      id: 5,
      username: "SarahJohn",
      name: "SarahJohn",
      email: "sarah.johnson@cvsu.edu.ph",
      program: "BS Psychology",
      status: "active",
      joinDate: "2024-04-12",
      creditScore: 90,
      lastActive: "2024-12-30",
      inactiveDays: 0,
    },
    {
      id: 6,
      username: "InactiveU1",
      name: "InactiveU1",
      email: "inactive1@cvsu.edu.ph",
      program: "BS Mathematics",
      status: "inactive",
      joinDate: "2023-08-20",
      creditScore: 65,
      lastActive: "2024-06-15",
      inactiveDays: 105,
    },
    // Reported users for profile viewing
    {
      id: 97,
      username: "BadSeller",
      name: "BadSeller",
      email: "bad.seller@cvsu.edu.ph",
      program: "BS Engineering",
      status: "flagged",
      joinDate: "2024-11-20",
      creditScore: 52,
      lastActive: "2024-12-28",
      inactiveDays: 2,
      totalProducts: 8,
      completedTransactions: 12,
      rating: 3.2,
      bio: "Selling various school supplies and textbooks.",
    },
    {
      id: 98,
      username: "FakeUser",
      name: "Fake Account",
      email: "fake.account@cvsu.edu.ph",
      program: "Unknown",
      status: "flagged",
      joinDate: "2024-12-28",
      creditScore: 30,
      lastActive: "2024-12-29",
      inactiveDays: 1,
      totalProducts: 2,
      completedTransactions: 0,
      rating: 1.5,
      bio: "New to the marketplace.",
    },
    {
      id: 99,
      username: "ScamUser",
      name: "Scam Account",
      email: "scam.user@cvsu.edu.ph",
      program: "Unknown",
      status: "flagged",
      joinDate: "2024-12-25",
      creditScore: 45,
      lastActive: "2024-12-30",
      inactiveDays: 0,
      totalProducts: 5,
      completedTransactions: 1,
      rating: 2.5,
      bio: "Selling electronics and gadgets.",
    },
  ];

  // Filter users based on example mode (use real Supabase users when not in example mode)
  const allUsers = isExampleMode(currentUser)
    ? filterExampleData(mockAllUsers, currentUser)
    : (users as any[]);
  
  const activeUsersList = allUsers.filter(
    (u) => u.status === "active",
  );
  const inactiveUsersList = allUsers.filter(
    (u) => u.status === "inactive",
  );

  const mockAllProducts = [
    {
      id: 1,
      title: "Advanced Calculus Textbook",
      seller: { username: "MariaBendo", id: 1 },
      category: "Textbooks",
      price: 1200,
      status: "active",
      datePosted: "2024-12-30",
      views: 45,
      description: "Excellent condition textbook",
      condition: "Like New",
      location: "Gate 2",
      image:
        "https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?w=400",
    },
    {
      id: 2,
      title: "Gaming Laptop - ASUS ROG",
      seller: { username: "JohnDela", id: 2 },
      category: "Electronics",
      price: 45000,
      status: "active",
      datePosted: "2024-12-29",
      views: 120,
      description: "Perfect for programming and gaming",
      condition: "Good",
      location: "Gate 1",
      image:
        "https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?w=400",
    },
    {
      id: 3,
      title: "Complete Art Supply Set",
      seller: { username: "AnnaReyes", id: 3 },
      category: "Art Supplies",
      price: 2500,
      status: "active",
      datePosted: "2024-12-28",
      views: 67,
      description: "Unused art supplies",
      condition: "Brand New",
      location: "U-Mall Gate",
      image:
        "https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?w=400",
    },
    // Products from reported users
    {
      id: 101,
      title: "iPhone 14 Pro 256GB",
      seller: { username: "ScamUser", id: 99 },
      category: "Electronics",
      price: 5000,
      status: "flagged",
      datePosted: "2024-12-29",
      views: 200,
      description: "iPhone 14 Pro 256GB in excellent condition. Complete with original box and accessories.",
      condition: "Good",
      location: "CvSU Main Campus - Main Gate",
      image: "https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?w=400",
    },
    {
      id: 102,
      title: "Engineering Mechanics Textbook (Original)",
      seller: { username: "BadSeller", id: 97 },
      category: "Textbooks",
      price: 800,
      status: "flagged",
      datePosted: "2024-12-27",
      views: 85,
      description: "Original Engineering Mechanics textbook for sale. All chapters included, no markings or highlights.",
      condition: "Brand New",
      location: "CvSU Main Campus - Library",
      image: "https://images.unsplash.com/photo-1666281269793-da06484657e8?w=400",
    },
  ];

  const todaysActivities = [
    {
      id: 1,
      type: "registration",
      action: "New User Registration",
      user: "Carlos Martinez",
      time: "5 minutes ago",
      details: "Joined as BS Biology student",
      icon: Users,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "product",
      action: "Product Posted",
      user: "Maria Santos",
      time: "15 minutes ago",
      details: "Advanced Calculus Textbook",
      icon: Package,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "transaction",
      action: "Transaction Completed",
      user: "John Dela Cruz",
      time: "30 minutes ago",
      details: "Sold Gaming Laptop",
      icon: CheckCircle,
      color: "text-purple-600",
    },
    {
      id: 4,
      type: "report",
      action: "Report Submitted",
      user: "Anna Reyes",
      time: "1 hour ago",
      details: "Reported suspicious product",
      icon: Flag,
      color: "text-orange-600",
    },
    {
      id: 5,
      type: "review",
      action: "Review Posted",
      user: "Sarah Johnson",
      time: "2 hours ago",
      details: "5-star review for seller",
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  const flaggedUsersList = [
    {
      id: 1,
      username: "SuspUser1",
      name: "Suspicious User 1",
      email: "fake.user1@cvsu.edu.ph",
      reason: "Multiple spam reports",
      flagDate: "2024-12-28",
      violations: 3,
      status: "under review",
      program: "BS Computer Science",
      creditScore: 45,
      reportDetails:
        "Posted multiple spam products with fake information. Multiple users reported suspicious behavior.",
    },
    {
      id: 2,
      username: "SuspUser2",
      name: "Suspicious User 2",
      email: "fake.user2@cvsu.edu.ph",
      reason: "Inappropriate content",
      flagDate: "2024-12-27",
      violations: 2,
      status: "warned",
      program: "BS Information Technology",
      creditScore: 58,
      reportDetails:
        "Posted inappropriate images in product listings. Has been warned once.",
    },
    {
      id: 3,
      username: "SuspUser3",
      name: "Suspicious User 3",
      email: "fake.user3@cvsu.edu.ph",
      reason: "Potential scam",
      flagDate: "2024-12-26",
      violations: 5,
      status: "suspended",
      program: "BS Engineering",
      creditScore: 20,
      reportDetails:
        "Attempted to scam multiple students with fake products. Account suspended pending investigation.",
    },
  ];

  // Mock appeals data
  const appealsList = [
    {
      id: 1,
      appealId: "APL-001",
      user: {
        id: 5,
        username: "CarlosMendez",
        name: "Carlos Mendez",
        email: "carlos.mendez@cvsu.edu.ph",
        program: "BS Computer Science",
        creditScore: 72,
      },
      deletionReason: "Violated marketplace rules",
      adminNote: "Posted prohibited items multiple times despite warnings.",
      appealMessage:
        "I sincerely apologize for my actions. I was not aware that those items were prohibited. I have read the marketplace rules thoroughly now and promise to follow them strictly. Please give me another chance.",
      submittedDate: "2024-12-30T08:30:00",
      daysRemaining: 28,
      status: "pending",
    },
    {
      id: 2,
      appealId: "APL-002",
      user: {
        id: 8,
        username: "LisaTan",
        name: "Lisa Tan",
        email: "lisa.tan@cvsu.edu.ph",
        program: "BS Information Technology",
        creditScore: 65,
      },
      deletionReason: "Multiple unresolved warnings",
      adminNote: "Failed to respond to three consecutive warnings about account activity.",
      appealMessage:
        "I was dealing with a family emergency and couldn't access my account. I'm back now and ready to resolve any issues. I've always been a responsible member of this community.",
      submittedDate: "2024-12-29T14:20:00",
      daysRemaining: 27,
      status: "pending",
    },
    {
      id: 3,
      appealId: "APL-003",
      user: {
        id: 12,
        username: "MarkReyes",
        name: "Mark Reyes",
        email: "mark.reyes@cvsu.edu.ph",
        program: "BS Engineering",
        creditScore: 58,
      },
      deletionReason: "Fake or misleading listings",
      adminNote: "Posted products with misleading descriptions and fake condition reports.",
      appealMessage: "",
      submittedDate: "2024-12-28T16:45:00",
      daysRemaining: 26,
      status: "pending",
    },
  ];

  const pendingReportsMock = [
    {
      id: 1,
      type: "product",
      reportedItem: "Suspicious iPhone Sale",
      reportedItemId: 101,
      reportedBy: { username: "MariaBendo", id: 1 },
      reportedUser: { username: "ScamUser", id: 99 },
      reason: "Potential scam",
      date: "2024-12-30",
      status: "pending",
      description:
        "Price seems too good to be true (iPhone 14 Pro for ₱5,000). Product images appear to be stock photos. Seller has no reviews or history.",
      productDetails: {
        id: 101,
        title: "iPhone 14 Pro 256GB",
        price: 5000,
        category: "Electronics",
        condition: "Good",
        description: "iPhone 14 Pro 256GB in excellent condition. Complete with original box and accessories.",
        location: "CvSU Main Campus - Main Gate",
        datePosted: "2024-12-29",
        postedDate: "Dec 29, 2024",
        images: [
          "https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?w=800",
          "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800",
        ],
        image: "https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?w=800",
        seller: {
          name: "ScamUser",
          username: "ScamUser",
          creditScore: 45,
          rating: 2.5,
          program: "Unknown",
        },
      },
    },
    {
      id: 2,
      type: "user",
      reportedItem: "Fake Profile Account",
      reportedItemId: 98,
      reportedBy: { username: "AnnaReyes", id: 3 },
      reportedUser: { username: "FakeUser", id: 98 },
      reason: "Fake account",
      date: "2024-12-29",
      status: "pending",
      description:
        "User profile appears to be fake. No student ID verification, using stolen photos from internet, multiple complaints from other students.",
      userDetails: {
        username: "FakeUser",
        email: "fake.account@cvsu.edu.ph",
        program: "Unknown",
        joinDate: "2024-12-28",
        creditScore: 30,
        violations: 4,
      },
    },
    {
      id: 3,
      type: "product",
      reportedItem: "Counterfeit Textbook",
      reportedItemId: 102,
      reportedBy: { username: "JohnDela", id: 2 },
      reportedUser: { username: "BadSeller", id: 97 },
      reason: "Counterfeit item",
      date: "2024-12-28",
      status: "pending",
      description:
        "Selling photocopied textbooks claiming they are original. This violates copyright laws and university policies.",
      productDetails: {
        id: 102,
        title: "Engineering Mechanics Textbook (Original)",
        price: 800,
        category: "Textbooks",
        condition: "Brand New",
        description: "Original Engineering Mechanics textbook for sale. All chapters included, no markings or highlights.",
        location: "CvSU Main Campus - Library",
        datePosted: "2024-12-27",
        postedDate: "Dec 27, 2024",
        images: [
          "https://images.unsplash.com/photo-1666281269793-da06484657e8?w=800",
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
        ],
        image: "https://images.unsplash.com/photo-1666281269793-da06484657e8?w=800",
        seller: {
          name: "BadSeller",
          username: "BadSeller",
          creditScore: 52,
          rating: 3.2,
          program: "BS Engineering",
        },
      },
    },
  ];

  // Filter products based on example mode
  const allProducts = filterExampleData(mockAllProducts, currentUser);

  const mockRecentActivities = [
    {
      id: 1,
      action: "User Registration",
      user: "New Student: Carlos Martinez",
      time: "5 minutes ago",
      type: "registration",
    },
    {
      id: 2,
      action: "Product Approved",
      user: "Textbook by Maria Santos",
      time: "15 minutes ago",
      type: "approval",
    },
    {
      id: 3,
      action: "Report Resolved",
      user: "Report #123 marked as resolved",
      time: "1 hour ago",
      type: "resolution",
    },
  ];

  // Marketplace Stats Data
  const marketplaceStats = {
    mostViewed: [
      {
        id: 2,
        title: "Gaming Laptop - ASUS ROG",
        seller: {
          username: "JohnDela",
          id: 2,
          creditScore: 88,
          totalItems: 5,
          reports: 0,
        },
        category: "Electronics",
        price: 45000,
        views: 1250,
        datePosted: "2024-12-29",
        description:
          "Perfect for programming and gaming. RTX 3060, 16GB RAM, 512GB SSD. Barely used, still under warranty.",
        condition: "Like New",
        location: "Gate 1",
        image:
          "https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?w=400",
      },
      {
        id: 1,
        title: "Advanced Calculus Textbook",
        seller: {
          username: "MariaBendo",
          id: 1,
          creditScore: 95,
          totalItems: 12,
          reports: 0,
        },
        category: "Textbooks",
        price: 1200,
        views: 890,
        datePosted: "2024-12-30",
        description:
          "Excellent condition textbook with all solutions manual. Perfect for BS Math and Engineering students.",
        condition: "Like New",
        location: "Gate 2",
        image:
          "https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?w=400",
      },
      {
        id: 7,
        title: "iPhone 13 Pro 256GB",
        seller: {
          username: "SarahJohn",
          id: 5,
          creditScore: 90,
          totalItems: 3,
          reports: 0,
        },
        category: "Electronics",
        price: 38000,
        views: 765,
        datePosted: "2024-12-27",
        description:
          "Sierra Blue, battery health 95%, complete with original box and accessories.",
        condition: "Good",
        location: "Gate 3",
        image:
          "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400",
      },
    ],
    mostSold: [
      {
        id: 15,
        title: "Nursing Uniform Set",
        seller: {
          username: "MariaBendo",
          id: 1,
          creditScore: 95,
          totalItems: 12,
          reports: 0,
        },
        category: "Clothing",
        price: 1500,
        sales: 45,
        datePosted: "2024-11-15",
        description:
          "Complete nursing uniform set, size M. Gently used, washed and ironed.",
        condition: "Good",
        location: "Gate 2",
        image:
          "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400",
      },
      {
        id: 16,
        title: "Scientific Calculator (Casio FX-991EX)",
        seller: {
          username: "JohnDela",
          id: 2,
          creditScore: 88,
          totalItems: 5,
          reports: 0,
        },
        category: "Stationery",
        price: 800,
        sales: 38,
        datePosted: "2024-11-20",
        description:
          "Latest model with ClassWiz features. Perfect condition with original packaging.",
        condition: "Brand New",
        location: "Gate 1",
        image:
          "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=400",
      },
      {
        id: 17,
        title: "Organic Chemistry Textbook",
        seller: {
          username: "AnnaReyes",
          id: 3,
          creditScore: 92,
          totalItems: 8,
          reports: 0,
        },
        category: "Textbooks",
        price: 1000,
        sales: 32,
        datePosted: "2024-11-10",
        description:
          "Wade 9th Edition. Excellent condition with highlighted notes.",
        condition: "Good",
        location: "Gate 2",
        image:
          "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400",
      },
    ],
    mostSearched: [
      {
        id: 20,
        title: "MacBook Air M1 2020",
        seller: {
          username: "SarahJohn",
          id: 5,
          creditScore: 90,
          totalItems: 3,
          reports: 0,
        },
        category: "Electronics",
        price: 42000,
        searches: 1580,
        datePosted: "2024-12-28",
        description:
          "8GB RAM, 256GB SSD. Perfect for students. Battery cycle count: 45. Includes original charger.",
        condition: "Like New",
        location: "Gate 3",
        image:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
      },
      {
        id: 21,
        title: "Lab Gown - White Coat (Size L)",
        seller: {
          username: "CarlosMar",
          id: 4,
          creditScore: 76,
          totalItems: 4,
          reports: 1,
        },
        category: "Clothing",
        price: 500,
        searches: 1340,
        datePosted: "2024-12-26",
        description:
          "Standard white lab coat for medical and science students. Clean and pressed.",
        condition: "Good",
        location: "Gate 1",
        image:
          "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400",
      },
      {
        id: 22,
        title: "Engineering Drawing Kit Complete",
        seller: {
          username: "MariaBendo",
          id: 1,
          creditScore: 95,
          totalItems: 12,
          reports: 0,
        },
        category: "Art Supplies",
        price: 1800,
        searches: 980,
        datePosted: "2024-12-25",
        description:
          "Complete set with compass, triangles, protractor, T-square, and French curves.",
        condition: "Brand New",
        location: "Gate 2",
        image:
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
      },
    ],
  };

  // Filter data arrays based on example mode
  // Today's activities: use mock in example mode, otherwise fetch from Supabase
  const [todaysActivitiesState, setTodaysActivitiesState] = useState<any[]>(isExampleMode(currentUser) ? todaysActivities : []);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const ACTIVITIES_PER_PAGE = 12;
  const filteredTodaysActivities = isExampleMode(currentUser)
    ? filterExampleData(todaysActivities, currentUser)
    : todaysActivitiesState;

  // Pending reports: use mock data in example mode, otherwise fetch from Supabase
  const [pendingReports, setPendingReports] = useState<any[]>(isExampleMode(currentUser) ? pendingReportsMock : []);
  const [reportsPage, setReportsPage] = useState(1);
  const REPORTS_PER_PAGE = 10;
  const filteredPendingReports = isExampleMode(currentUser)
    ? filterExampleData(pendingReportsMock, currentUser)
    : pendingReports;
  const filteredFlaggedUsers = filterExampleData(flaggedUsersList, currentUser);
  const filteredAppeals = filterExampleData(appealsList, currentUser);
  const filteredMarketplaceStats = {
    mostViewed: filterExampleData(marketplaceStats.mostViewed, currentUser),
    mostSold: filterExampleData(marketplaceStats.mostSold, currentUser),
    mostSearched: filterExampleData(marketplaceStats.mostSearched, currentUser),
  };
  const recentActivities = filterExampleData(mockRecentActivities, currentUser);

  // Calculate dynamic adminStats based on filtered arrays
  // This gives accurate counts that reflect whether the user is in example mode or not
  const adminStats = {
    totalUsers: allUsers.length,
    activeUsers: activeUsersList.length,
    inactiveUsers: inactiveUsersList.length,
    activeProducts: allProducts.filter(p => p.status === 'active').length,
    pendingReports: filteredPendingReports.length,
    todaysActivity: filteredTodaysActivities.length,
    flaggedUsers: filteredFlaggedUsers.length,
    activeAppeals: filteredAppeals.length,
  };

  // Audit logs: mock data removed — UI now uses real `systemLogs` state only


  const mockAuditLogs = [
    {
      id: 1,
      adminEmail: "mariakazandra.bendo@cvsu.edu.ph",
      adminName: "Maria Bendo",
      action: "deleted",
      itemType: "product",
      itemName: "Used Nursing Uniform",
      reason: "Violates marketplace policy - counterfeit item",
      date: "2025-10-15",
      time: "2:30 PM",
      timestamp: new Date("2025-10-15T14:30:00"),
    },
    {
      id: 4,
      adminEmail: "mariakazandra.bendo@cvsu.edu.ph",
      adminName: "Maria Bendo",
      action: "declined",
      itemType: "fundraiser",
      itemName: "Fake Charity Post",
      reason: "Insufficient proof of cause",
      date: "2025-10-15",
      time: "11:00 AM",
      timestamp: new Date("2025-10-15T11:00:00"),
    },
  ];



  const handleReportAction = (
    reportId: number,
    action: string,
  ) => {
    toast.success(`Report ${reportId} has been ${action}`);
    setSelectedReport(null);
  };

  const handleSendWarning = (user: any) => {
    // Generate the warning message
    const message =
      warningMessage ||
      `Dear ${user.username},

Your IskoMarket account has been inactive for ${user.inactiveDays || 0} days. This is an official notification to remind you about our inactivity policy.

⚠️ INACTIVITY CONSEQUENCES:
${user.inactiveDays < 30 ? `• You are approaching the 30-day threshold\n• At 30 days: All your products will be automatically hidden from the marketplace` : user.inactiveDays >= 30 && user.inactiveDays < 100 ? `• Your products are currently hidden from the marketplace\n• You have ${100 - user.inactiveDays} days remaining before account deletion\n• At 100 days: Your account will be permanently deleted` : `• Your account is scheduled for permanent deletion\n• This is your final warning before permanent removal\n• All your data and products will be permanently deleted`}

📌 WHAT YOU NEED TO DO:
• Log in to your account immediately to reset the inactivity counter
• Update your listings or post new products to show activity
• Contact support if you need to appeal or have special circumstances

This is an automated warning from the IskoMarket Administration Team.
Please take immediate action to prevent account suspension.

Best regards,
IskoMarket Admin Team
Cavite State University`;

    // Call the parent callback to save warning state
    if (onSendWarning) {
      onSendWarning(
        user.username,
        message,
        user.inactiveDays || 0,
      );
    }

    toast.success(`Warning sent to ${user.username}`, {
      description:
        "User will see the warning banner when they log in.",
    });

    // Insert audit log for warning
    (async () => {
      try {
        const { insertAdminAuditLog } = await import('../services/adminAuditService');
        await insertAdminAuditLog({
          admin_email: currentUser?.email || currentUser?.username || 'admin',
          action: 'warned',
          target_type: 'user',
          target_id: String(user.id || user.userId || ''),
          target_title: user.username || user.name || null,
          reason: warningMessage || null,
        } as any);
      } catch (e) {
        console.error('Failed to insert admin audit log for warning', e);
      }
    })();

    setWarningMessage("");
    setShowWarningModal(false);
    setSelectedSellerProfile(null);
  };

  const handleDeleteProduct = async (product: any) => {
    if (!deleteReason || !deleteReason.trim()) {
      toast.error("Please select a reason for deletion");
      return;
    }

    try {
      const { deleteProductById } = await import('../lib/services/products');
      const res = await deleteProductById(String(product.id), false);

      if (res.ok) {
        toast.success(`Product "${product.title}" has been deleted. Seller has been notified.`);

        // Clean up local UI
        setDeleteReason("");
        setShowDeleteProductModal(false);
        setSelectedProduct(null);

        // Hide any overlays if present
        try { overlayManager?.hide(); } catch (e) { /* ignore */ }

        // Dispatch a product-deleted event so other clients update
        try {
          window.dispatchEvent(new CustomEvent('iskomarket:product-deleted', { detail: { id: res.id } }));
        } catch (e) { /* ignore */ }

        // Insert audit log
        try {
          const { insertAdminAuditLog } = await import('../services/adminAuditService');
          await insertAdminAuditLog({
            admin_email: currentUser?.email || currentUser?.username || 'admin',
            action: 'deleted',
            target_type: 'product',
            target_id: String(res.id || product.id),
            target_title: product.title,
            reason: deleteReason || null,
          } as any);
        } catch (e) {
          console.error('Failed to insert admin audit log for product delete', e);
        }
      } else {
        if ((res as any).reason === 'not_found') {
          toast.info('Product was already deleted.');

          // Clean up UI similarly
          setDeleteReason("");
          setShowDeleteProductModal(false);
          setSelectedProduct(null);

          try { overlayManager?.hide(); } catch (e) { /* ignore */ }
        } else if ((res as any).permissionDenied) {
          toast.error('Permission denied: you are not allowed to delete this product.');
        } else {
          toast.error('Failed to delete product.');
          console.error('handleDeleteProduct: unknown error result', res);
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      toast.error(`Failed to delete product: ${msg}`);
      console.error('handleDeleteProduct error', err);
    }
  };

  const handleRemoveAccount = async (user: any) => {
    toast.success(
      `Account ${user.username} has been permanently removed from the system`,
    );

    // Insert audit log
    try {
      const { insertAdminAuditLog } = await import('../services/adminAuditService');
      await insertAdminAuditLog({
        admin_email: currentUser?.email || currentUser?.username || 'admin',
        action: 'removed',
        target_type: 'user',
        target_id: String(user.id || user.userId || ''),
        target_title: user.username || user.name || null,
        reason: null,
      } as any);
    } catch (e) {
      console.error('Failed to insert admin audit log for account removal', e);
    }

    setShowRemoveAccountModal(false);
    setSelectedSellerProfile(null);
  };

  const handleAppealResponse = async (
    userId: number,
    approved: boolean,
  ) => {
    if (approved) {
      toast.success(
        "Appeal approved. User account has been reactivated.",
      );
    } else {
      toast.error("Appeal denied. User will be notified.");
    }

    // Insert audit log for appeal decision
    try {
      const { insertAdminAuditLog } = await import('../services/adminAuditService');
      await insertAdminAuditLog({
        admin_email: currentUser?.email || currentUser?.username || 'admin',
        action: approved ? 'approved' : 'declined',
        target_type: 'user',
        target_id: String(userId),
        target_title: null,
        reason: approved ? 'Appeal approved' : 'Appeal denied',
      } as any);
    } catch (e) {
      console.error('Failed to insert admin audit log for appeal decision', e);
    }
  };

  const handleMarketplaceProductDelete = async (product: any, reason: string) => {
    if (!reason || !reason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    try {
      // Call the service to delete (soft delete via RPC by default)
      const { deleteProductById } = await import('../lib/services/products');
      const res = await deleteProductById(String(product.id), false);

      if (res.ok) {
        toast.success(`Product "${product.title}" has been deleted`, {
          description: `Seller ${product.seller?.username || product.seller_id} has been notified.`,
        });

        // Clear local UI state and close any overlays
        setProductDeleteReason("");
        setSelectedProduct(null);
        setSelectedProductDetails(null);

        // Dispatch product-deleted event
        try {
          window.dispatchEvent(new CustomEvent('iskomarket:product-deleted', { detail: { id: res.id } }));
        } catch (e) { /* ignore */ }

        // Insert audit log
        try {
          const { insertAdminAuditLog } = await import('../services/adminAuditService');
          await insertAdminAuditLog({
            admin_email: currentUser?.email || currentUser?.username || 'admin',
            action: 'deleted',
            target_type: 'product',
            target_id: String(res.id || product.id),
            target_title: product.title,
            reason: reason || null,
          } as any);
        } catch (e) {
          console.error('Failed to insert admin audit log for product delete', e);
        }
      } else {
        if ((res as any).reason === 'not_found') {
          toast.info('Product was already deleted.');

          setProductDeleteReason("");
          setSelectedProduct(null);
          setSelectedProductDetails(null);
        } else if ((res as any).permissionDenied) {
          toast.error('Permission denied: you are not allowed to delete this product.');
        } else {
          toast.error('Failed to delete product.');
          console.error('handleMarketplaceProductDelete: unknown error result', res);
        }
      }

      try { overlayManager.hide(); } catch (e) { /* ignore */ }

    } catch (err: any) {
      const msg = err?.message || String(err);
      toast.error(`Failed to delete product: ${msg}`);
      // Keep modals open so admin can retry or adjust reason
      console.error('handleMarketplaceProductDelete error', err);
    }
  };

  // Load admin audit logs when modal opens (real-time subscription)
  React.useEffect(() => {
    if (isExampleMode(currentUser)) return; // do not fetch in example mode

    let unsubscribe: (() => void) | null = null;

    const load = async () => {
      try {
        const { data, error } = await getRecentAdminAuditLogs({ sinceDays: 7, limit: 200 });
        if (data) setAdminAuditLogs(data);
        if (error) console.error('Failed to load admin audit logs:', error);
      } catch (err) {
        console.error('Unexpected error loading admin audit logs:', err);
      }

      unsubscribe = subscribeToAdminAuditLogs((data: AdminAuditUI[]) => {
        setAdminAuditLogs((prev) => {
          const map = new Map<string, AdminAuditUI>();
          data.forEach((d) => map.set(String(d.id), d));
          prev.forEach((p) => map.set(String(p.id), p));
          return Array.from(map.values()).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
      });
    };

    if (showAuditLogs) load();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showAuditLogs, currentUser]);

  // Dev helper: insert an example audit log to verify realtime subscription
  const insertExampleAudit = async () => {
    try {
      const { insertAdminAuditLog } = await import('../services/adminAuditService');
      const payload = {
        admin_email: currentUser?.email || currentUser?.username || 'dev@example.local',
        action: 'approved',
        target_type: 'for_a_cause',
        target_id: `example-${Date.now()}`,
        target_title: 'Example Fundraiser',
        reason: 'Inserted for realtime test',
      } as any;

      const { data, error } = await insertAdminAuditLog(payload);

      if (error) {
        console.error('insertExampleAudit: insert error', error);
        toast.error('Failed to insert example audit log');
        return;
      }

      if (data) {
        // Optimistically merge the new log into the UI so you see it immediately
        setAdminAuditLogs((prev) => {
          const map = new Map<string, any>();
          map.set(String(data.id), data);
          prev.forEach((p) => map.set(String(p.id), p));
          return Array.from(map.values()).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });

        toast.success('Example audit log inserted');
      } else {
        toast.error('Insert returned no data');
      }
    } catch (err) {
      console.error('insertExampleAudit unexpected error', err);
      toast.error('Insert failed');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <Users className="h-4 w-4 text-green-600" />;
      case "approval":
        return (
          <CheckCircle className="h-4 w-4 text-blue-600" />
        );
      case "resolution":
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return (
          <Eye className="h-4 w-4 text-muted-foreground" />
        );
    }
  };

  const getFilteredAuditLogs = () => {
    // Use real admin audits when available; fall back to example/mock data in example mode
    const logsSource: any[] = isExampleMode(currentUser)
      ? filterExampleData(mockAuditLogs, currentUser)
      : adminAuditLogs.map((l) => ({
          id: l.id,
          adminEmail: l.adminEmail || 'Unknown',
          action: l.action,
          itemType: l.targetType,
          itemName: l.targetTitle || l.targetId || '',
          reason: l.reason,
          date: l.date,
          time: l.time,
          timestamp: new Date(l.created_at),
        }));

    return logsSource.filter((log) => {
      if (
        auditLogFilter.action !== "all" &&
        log.action !== auditLogFilter.action
      )
        return false;
      if (
        auditLogFilter.role !== "all" &&
        !log.adminEmail?.includes(auditLogFilter.role)
      )
        return false;
      // Date filter can be added here
      return true;
    });
  };

  // Season Reset Handlers
  const handleSeasonResetClick = () => {
    setShowSeasonResetConfirmation(true);
  };

  const handleSeasonResetProceed = () => {
    setShowSeasonResetConfirmation(false);
    setShowSeasonResetFinal(true);
  };

  const handleSeasonResetConfirm = () => {
    setShowSeasonResetFinal(false);
    setShowSeasonResetProcessing(true);
  };

  const handleSeasonResetComplete = () => {
    setShowSeasonResetProcessing(false);
    setCurrentSeason(prev => prev + 1);
    toast.success(`Season ${currentSeason + 1} has begun! All credits scores and statistics have been updated.`);
  };

  const getCurrentSeasonDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    
    // Determine which season we're in
    const month = today.getMonth(); // 0-11
    
    if (month >= 11 || month <= 4) {
      // December - May (Season 1)
      return {
        startDate: `December 1, ${month === 11 ? year : year - 1}`,
        endDate: `May 31, ${month <= 4 ? year : year + 1}`,
        lastResetDate: month === 11 ? `November 30, ${year}` : `May 31, ${year}`,
      };
    } else {
      // June - November (Season 2)
      return {
        startDate: `June 1, ${year}`,
        endDate: `November 30, ${year}`,
        lastResetDate: `May 31, ${year}`,
      };
    }
  };

  const seasonDates = getCurrentSeasonDates();

  return (
    <div className="space-y-6" data-admin-view>
      {/* Dark Mode: Deep Navy-Emerald Gradient Background */}
      <div
        className="fixed inset-0 pointer-events-none dark:block hidden -z-50"
        style={{
          background:
            "linear-gradient(135deg, #071A14 0%, #020C0A 100%)",
        }}
      />

      {/* Dark Mode: Soft noise texture (2-3%) */}
      <div
        className="fixed inset-0 pointer-events-none dark:block hidden -z-30 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
        }}
      />

      {/* Dark Mode: Subtle vignette */}
      <div
        className="fixed inset-0 pointer-events-none dark:block hidden -z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.45) 100%)",
        }}
      />
      {/* Admin Hero Section */}
      <div
        className="relative bg-[#fafaf8] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[28px] p-6 md:p-8 overflow-hidden dark:shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2),0_8px_32px_rgba(0,55,38,0.4),inset_0_1px_0_rgba(20,184,166,0.1)]"
        style={{
          boxShadow:
            "0 8px 32px rgba(0, 100, 0, 0.08), 0 2px 8px rgba(0, 100, 0, 0.04)",
        }}
      >
        {/* Noise Overlay - Dark Mode Only */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02] dark:block hidden"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
          }}
        />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#006400]/10 to-[#228b22]/20 dark:from-[#14b8a6]/20 dark:to-[#0d9488]/20 border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20">
                <Shield className="h-6 w-6 text-[#006400] dark:text-[#4ade80]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl text-[#006400] dark:text-[#4ade80]">
                  Admin Dashboard
                </h1>
                <p className="text-sm md:text-base text-[#006400]/70 dark:text-[#4ade80]/70">
                  IskoMarket Administration Panel
                </p>
              </div>
            </div>
          </div>

          <Badge className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-white border-0">
            <Shield className="h-3 w-3 mr-1" />
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Stats Overview - Minimal Stripe-Style Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MinimalStatCard
          onClick={() => setSelectedStatModal("totalUsers")}
        >
          <Users className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">Total Users</div>
        </MinimalStatCard>

        <MinimalStatCard
          onClick={() => setSelectedStatModal("activeProducts")}
        >
          <Package className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">Active Products</div>
        </MinimalStatCard>

        {/* View Reports – moved from Trust & Reports */}
        <MinimalStatCard
          onClick={() => setShowReportsModal(true)}
        >
          <Flag className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">View Reports</div>
        </MinimalStatCard>

        {/* For a Cause Review – moved from Trust & Reports */}
        <MinimalStatCard
          onClick={() => setShowForCauseModal(true)}
        >
          <Users className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">For a Cause Review</div>
        </MinimalStatCard>

        {adminFlags.pendingReports && (
          <MinimalStatCard
            onClick={() => setSelectedStatModal("pendingReports")}
          >
            <AlertTriangle className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Pending Reports</div>
          </MinimalStatCard>
        )}
        {adminFlags.todaysActivity && (
          <MinimalStatCard
            onClick={() => setSelectedStatModal("todaysActivity")}
          >
            <TrendingUp className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Today's Activity</div>
          </MinimalStatCard>
        )}
        {adminFlags.flaggedUsers && (
          <MinimalStatCard
            onClick={() => setSelectedStatModal("flaggedUsers")}
          >
            <Ban className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Flagged Users</div>
          </MinimalStatCard>
        )}
        {adminFlags.appeals && (
          <>
            <MinimalStatCard
              onClick={() => setSelectedStatModal("appeals")}
            >
              <Mail className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Appeals</div>
            </MinimalStatCard>

            <MinimalStatCard
              onClick={() => setSelectedStatModal("transactionAppeals")}
            >
              <FileText className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Transaction Appeals</div>
            </MinimalStatCard>
          </>
        )}
        {adminFlags.seasonReset && (
          <MinimalStatCard
            onClick={handleSeasonResetClick}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950/40 dark:to-red-950/40 opacity-50" />
            <div className="relative">
              <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className="text-sm text-orange-900 dark:text-orange-200">Season Reset</div>
            </div>
            <div className="absolute inset-0 shadow-[0_0_20px_rgba(251,146,60,0.3)] dark:shadow-[0_0_20px_rgba(251,146,60,0.2)] pointer-events-none" />
          </MinimalStatCard>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/30 dark:to-[#021223]/50 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] p-1.5 dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] backdrop-blur-sm">
          <TabsTrigger
            value="overview"
            className="rounded-[16px] data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
          >
            Overview
          </TabsTrigger>
          {adminFlags.activitiesTab && (
            <TabsTrigger
              value="activities"
              className="rounded-[16px] data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
            >
              Activities
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Season Calendar */}
            <Card className="hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-lg transition-all duration-300 bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border border-gray-200 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm overflow-hidden relative">
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.015] rounded-[20px]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulance type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                  mixBlendMode: "overlay",
                }}
              />

              <CardHeader className="relative z-10 backdrop-blur-md bg-gradient-to-b from-green-50/30 to-white/70 dark:from-emerald-900/10 dark:to-white/5 border-b-2 border-green-500/40 dark:border-[#14b8a6]/50 pl-5 pt-4 pb-3 rounded-t-[20px] transition-all duration-200 hover:from-green-50/40 hover:to-white/80 dark:hover:from-emerald-900/15 dark:hover:to-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(20,184,166,0.06)]">
                <CardTitle
                  className="text-[#005a00] dark:text-white font-semibold dark:[text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)]"
                  style={{ letterSpacing: "0.2px" }}
                >
                  Season Calendar
                </CardTitle>
              </CardHeader>

              <CardContent
                className="space-y-3 max-h-[400px] overflow-y-auto relative z-10"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#cfe8ce transparent",
                }}
              >
                {/* Current Season Info */}
                <div className="p-4 rounded-[12px] bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-2 border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                        Current Season {currentSeason}
                      </span>
                    </div>
                    <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Start: {seasonDates.startDate}
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      End: {seasonDates.endDate}
                    </p>
                  </div>
                </div>

                {/* Season Countdown */}
                <div className="p-4 rounded-[12px] bg-[var(--card)] dark:bg-[#0F2820] border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time Remaining
                    </span>
                  </div>
                  <SeasonResetCountdown />
                </div>
              </CardContent>
            </Card>

            {/* Maintenance banner (admin POV) */}
            {maintenanceIsActive && (
              <section className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm mb-4">
                <h3 className="text-base font-semibold text-amber-900">
                  Scheduled maintenance
                </h3>
                <p className="mt-2">
                  {maintenanceTitle ?? "Scheduled maintenance"}
                </p>
                <p className="mt-1">
                  {maintenanceMessage ?? "IskoMarket will be undergoing scheduled maintenance and will be temporarily unavailable. We apologize for any inconvenience."}
                </p>
                <p className="mt-3 text-xs text-amber-800">
                  We’ll return the site to normal automatically when maintenance ends.
                </p>
              </section>
            )}

            {/* System Alert - quick action (ALWAYS VISIBLE for admins) */}
            <div className="mb-4">
              <button
                className="w-full rounded-[12px] py-3 px-4 bg-red-600 text-white hover:bg-red-700 font-medium"
                onClick={() => setShowSystemAlert(true)}
                data-quick-action="system-alert"
              >
                <span className="mr-2">🔔</span>
                System Alert & Maintenance Notification
              </button>
            </div>

            {/* Quick Actions (additional cards, gated by flag) */}
            {adminFlags.quickActions ? (
              <Card className="hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-lg transition-all duration-300 bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border border-gray-200 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm overflow-hidden relative p-6">
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.015] rounded-[20px]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                  mixBlendMode: "overlay",
                }}
              />
              <CardHeader
                className="
  relative z-10 
  bg-gradient-to-b from-white/95 to-white/90 
  dark:bg-gradient-to-b dark:from-[#003726]/90 dark:to-[#021223]/90
  -mx-6 -mt-6
  px-6 pt-4 pb-3 
  mb-6
  rounded-t-[20px]
"
              >
                <CardTitle
                  className="
    font-semibold tracking-[0.2px]
    text-[#005a00] 
    dark:text-white dark:text-shadow-[0_1px_2px_rgba(0,0,0,0.4)]
  "
                >
                  Quick Actions
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-2 gap-4 p-0">


                {/* Audit Logs - Light Indigo (Light) / Deep Navy (Dark) */}
                {adminFlags.auditLogs && (
                  <button
                  className="group relative col-span-1 justify-start rounded-2xl px-4 py-3.5 transition-all duration-300 overflow-hidden inline-flex items-center cursor-pointer h-14
                    border border-white/50 dark:border-white/8
                    hover:scale-[1.015] hover:shadow-[0_0_0_3px_rgba(121,134,203,0.15)] dark:hover:shadow-[0_0_0_3px_rgba(200,255,220,0.1)]
                    active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #5C6BC0 0%, #7986CB 100%)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08), inset 0 0 0 0 rgba(0,0,0,0)",
                  }}
                  data-quick-action="audit-logs"
                  onClick={() => setShowAuditLogs(true)}
                >
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(135deg, #1E2441 0%, #151B33 100%)",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  />
                  <FileText className="h-6 w-6 mr-2.5 relative z-10 text-white/90 dark:text-[#C8FFDC]" strokeWidth={1.5} />
                  <span className="text-[15px] font-medium relative z-10 text-white dark:text-[#C8FFDC]">
                    Audit Logs
                  </span>
                </button>
                )}



                {/* Manage Inactive - Orange (Light) / Deep Brown (Dark) */}
                {adminFlags.manageInactive && (
                  <button
                  className="group relative col-span-1 justify-start rounded-2xl px-4 py-3.5 transition-all duration-300 overflow-hidden inline-flex items-center cursor-pointer h-14
                    border border-white/50 dark:border-white/8
                    hover:scale-[1.015] hover:shadow-[0_0_0_3px_rgba(255,167,38,0.15)] dark:hover:shadow-[0_0_0_3px_rgba(200,255,220,0.1)]
                    active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08), inset 0 0 0 0 rgba(0,0,0,0)",
                  }}
                  data-quick-action="manage-inactive"
                  onClick={() =>
                    setShowInactiveAccountsPanel(true)
                  }
                >
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(135deg, #4A2F17 0%, #3B2412 100%)",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  />
                  <UserX className="h-6 w-6 mr-2.5 relative z-10 text-white/90 dark:text-[#C8FFDC]" strokeWidth={1.5} />
                  <span className="text-[15px] font-medium relative z-10 text-white dark:text-[#C8FFDC]">
                    Manage Inactive
                  </span>
                </button>
                )}





                {/* System Alert - Red (Light) / Deep Red (Dark) */}
                <button
                  className="group relative col-span-1 justify-start rounded-2xl px-4 py-3.5 transition-all duration-300 overflow-hidden inline-flex items-center cursor-pointer h-14
                    border border-white/50 dark:border-white/8
                    hover:scale-[1.015] hover:shadow-[0_0_0_3px_rgba(239,83,80,0.15)] dark:hover:shadow-[0_0_0_3px_rgba(200,255,220,0.1)]
                    active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #CB4744 0%, #D9927B 100%)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08), inset 0 0 0 0 rgba(0,0,0,0)",
                  }}
                  data-quick-action="system-alert"
                  onClick={() => setShowSystemAlert(true)}
                >
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(135deg, #4A1F1F 0%, #3A1717 100%)",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  />
                  <AlertOctagon className="h-6 w-6 mr-2.5 relative z-10 text-white/90 dark:text-[#C8FFDC]" strokeWidth={1.5} />
                  <span className="text-[15px] font-medium relative z-10 text-white dark:text-[#C8FFDC]">
                    System Alert
                  </span>
                </button>
              </CardContent>
            </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {filteredPendingReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No pending reports at the moment</p>
              </div>
            ) : (
              (() => {
                const displayedReports = filteredPendingReports.slice(0, reportsPage * REPORTS_PER_PAGE);
                return (
                  <>
                    {displayedReports.map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-all border-orange-200 dark:border-orange-800">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <Flag className="h-5 w-5 text-red-600" />
                                <h3 className="text-lg font-medium">{report.reportedItem}</h3>
                                <Badge className="bg-orange-100 text-orange-700 capitalize">{report.type}</Badge>
                              </div>
                              <p className="text-muted-foreground mb-4">{report.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-2"><User className="h-4 w-4" /><span>By: {report.reportedBy?.username ?? report.reportedBy?.id ?? 'Unknown'}</span></div>
                                <div className="flex items-center space-x-2"><AlertTriangle className="h-4 w-4" /><span>{report.reason}</span></div>
                                <div className="flex items-center space-x-2"><Calendar className="h-4 w-4" /><span>{new Date(report.date).toLocaleDateString()}</span></div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => setSelectedReport(report)}>
                                <Eye className="h-4 w-4 mr-1" /> Review
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {displayedReports.length < filteredPendingReports.length && (
                      <div className="p-4 text-center">
                        <Button size="sm" variant="ghost" onClick={() => setReportsPage(p => p + 1)}>Load more</Button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </TabsContent>



        {adminFlags.activitiesTab && (
          <TabsContent value="activities" className="space-y-4">
          <Card className="hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-lg transition-all duration-300 bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border border-gray-200 dark:border-[#14b8a6]/20 rounded-[20px] overflow-hidden relative">
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.015] rounded-[20px]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                mixBlendMode: "overlay",
              }}
            />
            <CardHeader className="relative z-10 backdrop-blur-md bg-gradient-to-b from-green-50/30 to-white/70 dark:from-emerald-900/10 dark:to-white/5 border-b-2 border-green-500/40 dark:border-[#14b8a6]/50 pl-5 pt-4 pb-3 rounded-t-[20px] transition-all duration-200 hover:from-green-50/40 hover:to-white/80 dark:hover:from-emerald-900/15 dark:hover:to-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(20,184,166,0.06)]">
              <CardTitle
                className="flex items-center gap-2 text-[#005a00] dark:text-white font-semibold dark:[text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)]"
                style={{ letterSpacing: "0.2px" }}
              >
                <Activity className="h-5 w-5 text-[#005a00] dark:text-emerald-400" />
                Activity Logs & System Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {/* Activities Sub-Tabs */}
              <Tabs
                value={activitiesTab}
                onValueChange={setActivitiesTab}
              >
                <TabsList className="grid w-full grid-cols-5 mb-4 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] p-1.5 shadow-sm backdrop-blur-sm gap-2">
                  <TabsTrigger
                    value="all"
                    className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                  >
                    All
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                    >
                      {systemLogs.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                  >
                    Transactions
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                    >
                      {transactionActivities.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="credit"
                    className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                  >
                    Credit Logs
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                    >
                      {creditScoreLogs.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="errors"
                    className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                  >
                    <AlertOctagon className="h-3 w-3 mr-1" />
                    Errors
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                    >
                      {systemErrors.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="slow"
                    className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Slow
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                    >
                      {slowResponses.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* All Activities */}
                <TabsContent
                  value="all"
                  className="space-y-3 max-h-[600px] overflow-y-auto"
                >
                  {systemLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <Activity className="h-16 w-16 text-[#006400]/20 dark:text-emerald-400/20 mb-4" />
                      <p className="text-[#006400]/60 dark:text-emerald-400/60 text-center">
                        No activity logs yet
                      </p>
                    </div>
                  ) : (
                    systemLogs.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 backdrop-blur-sm hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] hover:border-emerald-200 dark:hover:border-[#14b8a6]/30"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowActivityDetailModal(true);
                        }}
                      >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.status === "success"
                            ? "bg-emerald-100 dark:bg-emerald-500/20"
                            : activity.status === "error"
                              ? "bg-red-100 dark:bg-red-500/20"
                              : activity.status === "warning"
                                ? "bg-orange-100 dark:bg-orange-500/20"
                                : "bg-blue-100 dark:bg-blue-500/20"
                        }`}
                      >
                        {activity.type === "transaction" && (
                          <ShoppingCart
                            className={`h-5 w-5 ${
                              activity.status === "success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          />
                        )}
                        {activity.type === "credit" && (
                          <Star
                            className={`h-5 w-5 ${
                              activity.status === "success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : activity.status === "warning"
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-red-600 dark:text-red-400"
                            }`}
                          />
                        )}
                        {activity.type === "registration" && (
                          <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                        {activity.type === "system_error" && (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        {activity.type === "slow_response" && (
                          <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white">
                          {activity.action}
                        </p>
                        <p className="text-gray-700 dark:text-white/80">
                          {activity.user}
                        </p>
                        <p className="text-gray-600 dark:text-white/60 mt-1">
                          {typeof activity.details === 'object' && activity.details !== null ? (activity.details.summary ?? JSON.stringify(activity.details)) : (activity.details || '')}
                        </p>
                      </div>
                      <span className="text-gray-500 dark:text-white/60 whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  ))
                  )}
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent
                  value="transactions"
                  className="space-y-3"
                >
                  {/* Transaction Sub-Tabs */}
                  <Tabs
                    value={transactionFilter}
                    onValueChange={(value) =>
                      setTransactionFilter(
                        value as
                          | "all"
                          | "successful"
                          | "unsuccessful",
                      )
                    }
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] p-1.5 shadow-sm backdrop-blur-sm gap-2">
                      <TabsTrigger
                        value="all"
                        className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                      >
                        All
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                        >
                          {transactionActivities.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="successful"
                        className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                      >
                        Successful
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                        >
                          {successfulTransactions.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="unsuccessful"
                        className="rounded-[16px] text-gray-600 dark:text-white/70 data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
                      >
                        Unsuccessful
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-white/20 dark:bg-[var(--card)] text-current text-xs"
                        >
                          {unsuccessfulTransactions.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="all"
                      className="space-y-3 max-h-[600px] overflow-y-auto"
                    >
                      {transactionActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                          <ShoppingCart className="h-16 w-16 text-[#006400]/20 dark:text-emerald-400/20 mb-4" />
                          <p className="text-[#006400]/60 dark:text-emerald-400/60 text-center">
                            No transaction activities yet
                          </p>
                        </div>
                      ) : (
                        transactionActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 backdrop-blur-sm hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] hover:border-emerald-200 dark:hover:border-[#14b8a6]/30"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowActivityDetailModal(true);
                            }}
                          >
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.subType === "successful"
                                ? "bg-emerald-100 dark:bg-emerald-500/20"
                                : "bg-red-100 dark:bg-red-500/20"
                            }`}
                          >
                            {activity.subType ===
                            "successful" ? (
                              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white">
                              {activity.action}
                            </p>
                            <p className="text-gray-700 dark:text-white/80">
                              {activity.user}
                            </p>
                            <p className="text-gray-600 dark:text-white/60 mt-1">
                              {activity.details}
                            </p>
                          </div>
                          <Badge
                            variant={
                              activity.subType === "successful"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {activity.subType === "successful"
                              ? "Success"
                              : "Failed"}
                          </Badge>
                          <span className="text-[#9bb9ae] dark:text-[#709f89] whitespace-nowrap">
                            {activity.time}
                          </span>
                        </div>
                      )))}
                    </TabsContent>

                    <TabsContent
                      value="successful"
                      className="space-y-3 max-h-[600px] overflow-y-auto"
                    >
                      {successfulTransactions.map(
                        (activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 backdrop-blur-sm hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] hover:border-emerald-200 dark:hover:border-[#14b8a6]/30"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowActivityDetailModal(true);
                            }}
                          >
                            <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-500/20">
                              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white">
                                {activity.action}
                              </p>
                              <p className="text-gray-700 dark:text-white/80">
                                {activity.user}
                              </p>
                              <p className="text-gray-600 dark:text-white/60 mt-1">
                                {typeof activity.details === 'object' && activity.details !== null ? (activity.details.summary ?? JSON.stringify(activity.details)) : (activity.details || '')}
                              </p>
                            </div>
                            <Badge
                              variant="default"
                              className="text-xs"
                            >
                              Success
                            </Badge>
                            <span className="text-[#9bb9ae] dark:text-[#709f89] whitespace-nowrap">
                              {activity.time}
                            </span>
                          </div>
                        ),
                      )}
                    </TabsContent>

                    <TabsContent
                      value="unsuccessful"
                      className="space-y-3 max-h-[600px] overflow-y-auto"
                    >
                      {unsuccessfulTransactions.map(
                        (activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 backdrop-blur-sm hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] hover:border-emerald-200 dark:hover:border-[#14b8a6]/30"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowActivityDetailModal(true);
                            }}
                          >
                            <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-500/20">
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white">
                                {activity.action}
                              </p>
                              <p className="text-gray-700 dark:text-white/80">
                                {activity.user}
                              </p>
                              <p className="text-gray-600 dark:text-white/60 mt-1">
                                {typeof activity.details === 'object' && activity.details !== null ? (activity.details.summary ?? JSON.stringify(activity.details)) : (activity.details || '')}
                              </p>
                            </div>
                            <Badge
                              variant="destructive"
                              className="text-xs"
                            >
                              Failed
                            </Badge>
                            <span className="text-[#9bb9ae] dark:text-[#709f89] whitespace-nowrap">
                              {activity.time}
                            </span>
                          </div>
                        ),
                      )}
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Credit Score Logs */}
                <TabsContent
                  value="credit"
                  className="space-y-3 max-h-[600px] overflow-y-auto"
                >
                  {creditScoreLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <Star className="h-16 w-16 text-[#006400]/20 dark:text-emerald-400/20 mb-4" />
                      <p className="text-[#006400]/60 dark:text-emerald-400/60 text-center">
                        No credit score logs yet
                      </p>
                    </div>
                  ) : (
                    creditScoreLogs.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 backdrop-blur-sm hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] hover:border-emerald-200 dark:hover:border-[#14b8a6]/30"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowActivityDetailModal(true);
                      }}
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.change && activity.change > 0
                            ? "bg-emerald-100 dark:bg-emerald-500/20"
                            : "bg-red-100 dark:bg-red-500/20"
                        }`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            activity.change &&
                            activity.change > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white">
                            {activity.action}
                          </p>
                          {activity.change && (
                            <Badge
                              variant={
                                activity.change > 0
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {activity.change > 0 ? "+" : ""}
                              {activity.change} points
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-white/80">
                          {activity.user}
                        </p>
                        <p className="text-gray-600 dark:text-white/60 mt-1">
                          {activity.details}
                        </p>
                      </div>
                      <span className="text-gray-500 dark:text-white/60 whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  )))}
                </TabsContent>

                {/* System Errors */}
                <TabsContent
                  value="errors"
                  className="space-y-3 max-h-[600px] overflow-y-auto"
                >
                  {systemErrors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <AlertOctagon className="h-16 w-16 text-[#006400]/20 dark:text-emerald-400/20 mb-4" />
                      <p className="text-[#006400]/60 dark:text-emerald-400/60 text-center">
                        No system errors — platform is running smoothly!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 p-3 border rounded-[16px] mb-3 bg-[#fff5f5] border-[rgba(255,75,75,0.2)] dark:bg-[#ff4b4b]/10 dark:border-[rgba(255,75,75,0.3)]">
                        <AlertOctagon className="h-4 w-4 text-[#ff4b4b]" />
                        <p className="text-[#c92a2a] dark:text-[#ff6b6b]">
                          System errors require immediate attention
                          to ensure platform stability
                        </p>
                      </div>
                      {systemErrors.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 backdrop-blur-sm hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] hover:border-emerald-200 dark:hover:border-[#14b8a6]/30"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowActivityDetailModal(true);
                      }}
                    >
                      <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-500/20">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white">
                            {activity.action}
                          </p>
                          <Badge
                            variant="destructive"
                            className="text-xs"
                          >
                            ERROR
                          </Badge>
                        </div>
                        <p className="text-red-600 dark:text-red-200">
                          {activity.user}
                        </p>
                        <p className="text-red-700 dark:text-red-300 mt-1">
                          {activity.details}
                        </p>
                      </div>
                      <span className="text-red-700 dark:text-red-300 whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                    </>
                  )}
                </TabsContent>

                {/* Slow Responses */}
                <TabsContent
                  value="slow"
                  className="space-y-3 max-h-[600px] overflow-y-auto"
                >
                  {slowResponses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <Zap className="h-16 w-16 text-[#006400]/20 dark:text-emerald-400/20 mb-4" />
                      <p className="text-[#006400]/60 dark:text-emerald-400/60 text-center">
                        No slow responses — performance is optimal!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 p-3 border rounded-[16px] mb-3 bg-[#fff8f0] border-[rgba(255,147,64,0.2)] dark:bg-[#ff9340]/10 dark:border-[rgba(255,147,64,0.3)]">
                        <Zap className="h-4 w-4 text-[#ff9340]" />
                        <p className="text-[#d9730d] dark:text-[#ffb366]">
                          Performance monitoring: Responses
                          exceeding 2s threshold
                        </p>
                      </div>
                      {slowResponses.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726] dark:to-[#021223] border border-gray-200/50 dark:border-[#14b8a6]/20 backdrop-blur-sm hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] hover:border-emerald-200 dark:hover:border-[#14b8a6]/30"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowActivityDetailModal(true);
                      }}
                    >
                      <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-100 dark:bg-orange-500/20">
                        <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white">
                            {activity.action}
                          </p>
                          <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-200 text-xs border border-orange-200 dark:border-orange-300/30">
                            SLOW
                          </Badge>
                        </div>
                        <p className="text-orange-600 dark:text-orange-200">
                          {activity.user}
                        </p>
                        <p className="text-orange-700 dark:text-orange-300 mt-1">
                          {activity.details}
                        </p>
                      </div>
                      <span className="text-orange-700 dark:text-orange-300 whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>

      {/* Total Users Modal */}
      <Dialog
        open={selectedStatModal === "totalUsers"}
        onOpenChange={() => {
          setSelectedStatModal(null);
          setUserSearchTerm("");
        }}
      >
        <DialogContent
          className="modal-standard sm:max-w-[800px] max-h-[90vh] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[24px] bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] shadow-2xl dark:shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2)]"
          style={{
            boxShadow: "0 8px 32px rgba(0, 100, 0, 0.08)",
          }}
        >
          <DialogHeader className="sticky top-0 z-50 pb-4 border-b-2 border-[#cfe8ce] dark:border-[#14b8a6]/20">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2 text-[#006400] dark:text-[#4ade80]">
                <Users className="h-5 w-5" />
                Total Users (
                {adminStats.totalUsers.toLocaleString()})
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-[#006400]/10 dark:hover:bg-[#14b8a6]/10 text-[#006400] dark:text-[#4ade80]"
                onClick={() => setSelectedStatModal(null)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              View all registered users in the marketplace
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="active">
                Active (
                {adminStats.activeUsers.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({adminStats.inactiveUsers})
              </TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="mt-3 px-5 mb-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2F7A3D]" />
                <input
                  type="text"
                  placeholder="Search users by name or CvSU email…"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full h-[42px] pl-10 pr-4 bg-[#F5F7F3] dark:bg-[#003726]/40 border border-[#D7E5D1] dark:border-[#14b8a6]/20 rounded-xl text-sm placeholder:text-[#6B7A6B]/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 transition-all"
                  style={{
                    boxShadow: "0 2px 8px rgba(0, 100, 0, 0.04)",
                  }}
                />
              </div>
            </div>

            <TabsContent
              value="all"
              className="space-y-3 max-h-[60vh] overflow-y-auto pb-8 pr-4 scroll-pb-8"
            >
              {(() => {
                const displayUsers = isExampleMode(currentUser)
                  ? allUsers.filter((user) => {
                      const searchLower = userSearchTerm.toLowerCase();
                      return (
                        user.username.toLowerCase().includes(searchLower) ||
                        user.email.toLowerCase().includes(searchLower)
                      );
                    })
                  : filteredUsers;

                if (isLoadingUsers) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <svg className="animate-spin h-6 w-6 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    </div>
                  );
                }

                if (usersError) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-red-600">Error loading users: {usersError}</p>
                    </div>
                  );
                }

                if (displayUsers.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="text-center max-w-md">
                        <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          {userSearchTerm ? 'No users found' : 'No users registered yet'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {userSearchTerm 
                            ? 'Try adjusting your search terms.' 
                            : 'User accounts will appear here once students register for the marketplace.'}
                        </p>
                      </div>
                    </div>
                  );
                }

                return displayUsers.map((user) => (
                <Card
                  key={user.id}
                  className="cursor-pointer hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm"
                  onClick={() => {
                    setSelectedSellerProfile(user);
                    setSelectedStatModal(null);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            <UsernameWithGlow username={user.username} glowEffect={user.glowEffect} showTimer={false} />
                          </p>
                          <Badge
                            className={
                              user.status === "active"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-orange-100 text-orange-800 border-orange-300"
                            }
                          >
                            {user.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.program}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          Credit Score: {user.creditScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined:{" "}
                          {new Date(
                            user.joinDate,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
              })()}
            </TabsContent>

            <TabsContent
              value="active"
              className="space-y-3 max-h-[60vh] overflow-y-auto pb-8 pr-4 scroll-pb-8"
            >
              {activeUsersList
                .filter((user) => {
                  const searchLower = userSearchTerm.toLowerCase();
                  return (
                    user.username.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower)
                  );
                })
                .map((user) => (
                <Card
                  key={user.id}
                  className="cursor-pointer hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm"
                  onClick={() => {
                    setSelectedSellerProfile(user);
                    setSelectedStatModal(null);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-green-600 text-white">
                          {user.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            <UsernameWithGlow username={user.username} glowEffect={user.glowEffect} showTimer={false} />
                          </p>
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            active
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.program}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          Credit Score: {user.creditScore}
                        </div>
                        <div className="text-xs text-green-600">
                          Active{" "}
                          {user.inactiveDays === 0
                            ? "today"
                            : `${user.inactiveDays} days ago`}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent
              value="inactive"
              className="space-y-3 max-h-[60vh] overflow-y-auto pb-8 pr-4 scroll-pb-8"
            >
              {inactiveUsersList
                .filter((user) => {
                  const searchLower = userSearchTerm.toLowerCase();
                  return (
                    user.username.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower)
                  );
                })
                .map((user) => (
                <Card
                  key={user.id}
                  className="cursor-pointer hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm"
                  onClick={() => {
                    setSelectedSellerProfile(user);
                    setSelectedStatModal(null);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-orange-600 text-white">
                          {user.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {user.username}
                          </p>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                            inactive
                          </Badge>
                          {user.inactiveDays >= 30 && (
                            <Badge
                              variant="destructive"
                              className="text-xs"
                            >
                              {user.inactiveDays} days
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.program}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          Credit Score: {user.creditScore}
                        </div>
                        <div className="text-xs text-orange-600">
                          Last active:{" "}
                          {new Date(
                            user.lastActive,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Active Users Modal */}
      <Dialog
        open={selectedStatModal === "activeUsers"}
        onOpenChange={() => setSelectedStatModal(null)}
      >
        <DialogContent
          className="modal-standard sm:max-w-[700px] max-h-[90vh] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[24px] bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] shadow-2xl dark:shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2)]"
          style={{
            boxShadow: "0 8px 32px rgba(0, 100, 0, 0.08)",
          }}
        >
          <DialogHeader className="sticky top-0 z-50 pb-4 border-b-2 border-[#cfe8ce] dark:border-[#14b8a6]/20">
            <div className="pr-12">
              <DialogTitle className="flex items-center gap-2 text-[#006400] dark:text-[#4ade80]">
                <UserCheck className="h-5 w-5" />
                Active Users (
                {adminStats.activeUsers.toLocaleString()})
              </DialogTitle>
              <DialogDescription className="sr-only">
                View list of active users in the past 7 days
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#006400]/10 dark:hover:bg-[#14b8a6]/10 text-[#006400] dark:text-[#4ade80] absolute top-4 right-6"
              onClick={() => setSelectedStatModal(null)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {activeUsersList.map((user) => (
              <Card
                key={user.id}
                className="cursor-pointer hover:shadow-xl transition-all border-2 rounded-[16px] border-[#cfe8ce] dark:border-[#14b8a6]/20 bg-[var(--card)] dark:bg-[var(--card)] shadow-lg dark:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                style={{
                  boxShadow: "0 4px 16px rgba(0, 100, 0, 0.08)",
                }}
                onClick={() => setSelectedSellerProfile(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-600 text-white">
                        {user.username
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {user.username}
                        </p>
                        <Badge className="bg-green-600">
                          active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.program}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        Credit Score: {user.creditScore}
                      </div>
                      <div className="text-xs text-green-600">
                        Active{" "}
                        {user.inactiveDays === 0
                          ? "today"
                          : `${user.inactiveDays} days ago`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Products Modal */}
      <ActiveProductsModal
        isOpen={selectedStatModal === "activeProducts"}
        onClose={() => setSelectedStatModal(null)}
        initialCount={adminStats.activeProducts}
        onSelectProduct={(p) => {
          // Store selection and request the global product detail overlay
          setSelectedProduct(p);
          setSelectedProductDetails(p);
        }}
      />

      {/* Pending Reports Modal */}
      <Dialog
        open={selectedStatModal === "pendingReports"}
        onOpenChange={() => setSelectedStatModal(null)}
      >
        <DialogContent className="modal-standard sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="pr-12">
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Pending Reports ({adminStats.pendingReports})
              </DialogTitle>
              <DialogDescription className="sr-only">
                View and manage all pending user and product
                reports
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted hover:scale-110 transition-all duration-200 absolute top-4 right-6"
              onClick={() => setSelectedStatModal(null)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {filteredPendingReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No pending reports at the moment
                </p>
              </div>
            ) : (
              (() => {
                const displayed = filteredPendingReports.slice(0, reportsPage * REPORTS_PER_PAGE);
                return (
                  <>
                    {displayed.map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-all border-orange-200 dark:border-orange-800">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Report Header */}
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                                {report.type === "product" ? (
                                  <Package className="h-5 w-5 text-orange-600" />
                                ) : (
                                  <User className="h-5 w-5 text-orange-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{report.reportedItem}</p>
                                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 capitalize">{report.type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{report.reason}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Reported by: <UsernameWithGlow username={report.reportedBy.username} glowEffect={(report.reportedBy as any)?.glowEffect} showTimer={false} /></span>
                                  <span>•</span>
                                  <span>{new Date(report.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>Review</Button>
                            </div>

                            {/* Product Preview */}
                            {report.type === "product" && report.productDetails && (
                              <div className="bg-[var(--card)]/60 dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-700/50 rounded-[20px] p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProductDetails(report.productDetails); setShowProductDetailModal(true); setSelectedStatModal(null); }} title="Click to view product details">
                                <div className="flex gap-3">
                                  <ImageWithFallback src={report.productDetails.image} alt={report.productDetails.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{report.productDetails.title}</h5>
                                    <p className="text-emerald-600 dark:text-emerald-400 mb-2">₱{report.productDetails.price.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Posted: {new Date(report.productDetails.datePosted).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* User Preview */}
                            {report.type === "user" && report.reportedUser && (
                              <div className="bg-white/60 dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-700/50 rounded-[20px] p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 cursor-pointer" onClick={(e) => { e.stopPropagation(); const reportedUser = allUsers.find(u => u.username === report.reportedUser.username); if (reportedUser) { setSelectedSellerProfile(reportedUser); setSelectedStatModal(null); } }} title="Click to view user profile">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-12 w-12 ring-2 ring-emerald-500/20"><AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">{(((report.reportedUser as any)?.username) || ((report.reportedUser as any)?.name) || 'U').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1"><h5 className="text-gray-900 dark:text-gray-100"><UsernameWithGlow username={report.reportedUser.username} glowEffect={(report.reportedUser as any)?.glowEffect} showTimer={false} /></h5><Badge className="bg-red-500 text-white border-0 text-xs px-2 py-0.5">Reported</Badge></div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{allUsers.find(u => u.username === report.reportedUser.username)?.program || 'Student'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {displayed.length < filteredPendingReports.length && (
                      <div className="p-4 text-center">
                        <Button size="sm" variant="ghost" onClick={() => setReportsPage(p => p + 1)}>Load more</Button>
                      </div>
                    )}
                  </>
                );
              })()
            )}

          </div>
        </DialogContent>
      </Dialog>

      {/* Today's Activity Modal */}
      <Dialog
        open={selectedStatModal === "todaysActivity"}
        onOpenChange={() => setSelectedStatModal(null)}
      >
        <DialogContent className="modal-standard sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="pr-12">
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Today's Activity ({adminStats.todaysActivity})
              </DialogTitle>
              <DialogDescription className="sr-only">
                View today's marketplace activity and user
                actions
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted hover:scale-110 transition-all duration-200 absolute top-4 right-6"
              onClick={() => setSelectedStatModal(null)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {systemLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No activity recorded today</p>
              </div>
            ) : (() => {
              const displayed = systemLogs.slice(0, logsPage * LOGS_PER_PAGE);
              return (
                <>
                  {displayed.map((activity: any) => {
                    const severity = activity.severity || 'INFO';
                    return (
                      <Card key={activity.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-full bg-card flex items-center justify-center flex-shrink-0 ${severity === 'ERROR' ? 'text-red-600' : severity === 'SLOW' ? 'text-orange-500' : 'text-green-600'}`}>
                              <Activity className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{activity.type}</p>
                              <p className="text-sm text-muted-foreground">{activity.summary}</p>
                              <p className="text-xs text-muted-foreground mt-1">{typeof activity.details === 'string' ? activity.details : JSON.stringify(activity.details)}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                              <Badge className="mt-2" variant={severity === 'ERROR' ? 'destructive' : severity === 'SLOW' ? 'warning' : 'secondary'}>{severity}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {displayed.length >= LOGS_PER_PAGE && (
                    <div className="p-4 text-center">
                      <Button size="sm" variant="ghost" onClick={() => setLogsPage(p => p + 1)}>Load more</Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Flagged Users Modal */}
      <Dialog
        open={selectedStatModal === "flaggedUsers"}
        onOpenChange={() => setSelectedStatModal(null)}
      >
        <DialogContent className="modal-standard sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="pr-12">
              <DialogTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" />
                Flagged Users ({adminStats.flaggedUsers})
              </DialogTitle>
              <DialogDescription className="sr-only">
                View and manage users who have been flagged for
                policy violations
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted hover:scale-110 transition-all duration-200 absolute top-4 right-6"
              onClick={() => setSelectedStatModal(null)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {filteredFlaggedUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No flagged users at the moment
                </p>
              </div>
            ) : (
              filteredFlaggedUsers.map((user) => (
                <Card
                  key={user.id}
                  className="hover:shadow-md transition-all border-red-200 dark:border-red-800"
                >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      className="h-12 w-12 cursor-pointer ring-2 ring-red-200 hover:ring-red-400 transition-all"
                      onClick={() => {
                        setSelectedSellerProfile(user);
                        setSelectedStatModal(null); // Close Flagged Users modal
                      }}
                    >
                      <AvatarFallback className="bg-red-600 text-white">
                        {user.username
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedSellerProfile(user);
                            setSelectedStatModal(null); // Close Flagged Users modal
                          }}
                        >
                          {user.username}
                        </p>
                        <Badge
                          variant={
                            user.status === "suspended"
                              ? "destructive"
                              : user.status === "warned"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {user.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {user.violations} violations
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {user.reason}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Flagged:{" "}
                          {new Date(
                            user.flagDate,
                          ).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          Credit Score: {user.creditScore}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSellerProfile(user);
                        setSelectedStatModal(null); // Close Flagged Users modal
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Appeals Modal */}
      <Dialog
        open={selectedStatModal === "appeals"}
        onOpenChange={() => setSelectedStatModal(null)}
      >
        <DialogContent className="modal-standard sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="pr-12">
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#006400] dark:text-[#4ade80]" />
                Account Deletion Appeals ({adminStats.activeAppeals})
              </DialogTitle>
              <DialogDescription className="sr-only">
                View and manage account deletion appeals from users
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted hover:scale-110 transition-all duration-200 absolute top-4 right-6"
              onClick={() => setSelectedStatModal(null)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {/* Search Bar */}
          <div className="sticky top-0 bg-background z-40 pb-3 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by username, email, or appeal ID..."
                value={appealSearchTerm}
                onChange={(e) => setAppealSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-[16px] border border-gray-300 dark:border-[#14b8a6]/20 bg-[var(--card)] dark:bg-[#0a1628] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {filteredAppeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No active appeals at the moment
                </p>
              </div>
            ) : (
              filteredAppeals
                .filter((appeal) => {
                  const searchLower = appealSearchTerm.toLowerCase();
                  return (
                    appeal.user.username.toLowerCase().includes(searchLower) ||
                    appeal.user.email.toLowerCase().includes(searchLower) ||
                    appeal.appealId.toLowerCase().includes(searchLower)
                  );
                })
                .map((appeal) => {
                const timeAgo = () => {
                  const now = new Date();
                  const submitted = new Date(appeal.submittedDate);
                  const diffMinutes = Math.floor(
                    (now.getTime() - submitted.getTime()) / (1000 * 60),
                  );
                  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
                  const diffHours = Math.floor(diffMinutes / 60);
                  if (diffHours < 24) return `${diffHours} hours ago`;
                  const diffDays = Math.floor(diffHours / 24);
                  return `${diffDays} days ago`;
                };

                return (
                  <Card
                    key={appeal.id}
                    className="hover:shadow-md transition-all border-[#cfe8ce] dark:border-[#14b8a6]/20 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/20 dark:to-[#021223]/40"
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Header Row */}
                        <div className="flex items-start gap-3">
                          <Avatar
                            className="h-12 w-12 cursor-pointer ring-2 ring-primary/20 dark:ring-emerald-500/30 hover:ring-primary/40 transition-all"
                            onClick={() => {
                              setSelectedSellerProfile(appeal.user);
                              setSelectedStatModal(null); // Close Account Deletion Appeals modal
                            }}
                          >
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                              {appeal.user.username
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p
                                className="font-medium cursor-pointer hover:text-primary transition-colors"
                                onClick={() => {
                                  setSelectedSellerProfile(appeal.user);
                                  setSelectedStatModal(null); // Close Account Deletion Appeals modal
                                }}
                              >
                                {appeal.user.username}
                              </p>
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                              >
                                ⚠ Pending Appeal
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {appeal.appealId}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {appeal.user.email}
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div className="mb-1">{timeAgo()}</div>
                            <div className="text-red-600 dark:text-red-400 font-medium">
                              {appeal.daysRemaining} days left
                            </div>
                          </div>
                        </div>

                        {/* Deletion Info */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                Reason for Deletion
                              </p>
                              <p className="text-sm mt-1">
                                {appeal.deletionReason}
                              </p>
                              {appeal.adminNote && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  Admin note: {appeal.adminNote}
                                </p>
                              )}
                            </div>
                          </div>

                          {appeal.appealMessage && (
                            <div className="flex items-start gap-2 mt-3">
                              <FileText className="h-4 w-4 text-primary dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  Appeal Message
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                  {appeal.appealMessage}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Admin Actions */}
                        <div className="flex gap-3 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              toast.success(
                                `Appeal from ${appeal.user.username} has been rejected. User will be notified.`,
                              );
                              // In real app, would update state/database
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Appeal
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={() => {
                              toast.success(
                                `Appeal approved! ${appeal.user.username}{''}s account has been fully restored.`,
                              );
                              // In real app, would update state/database
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Appeal
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {filteredAppeals.length > 0 && filteredAppeals.filter((appeal) => {
              const searchLower = appealSearchTerm.toLowerCase();
              return (
                appeal.user.username.toLowerCase().includes(searchLower) ||
                appeal.user.email.toLowerCase().includes(searchLower) ||
                appeal.appealId.toLowerCase().includes(searchLower)
              );
            }).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No appeals found matching your search</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog
        open={selectedProduct !== null}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent className="modal-standard sm:max-w-[600px]">
          {selectedProduct && (
            <>
              <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Details
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted transition-all duration-200"
                    onClick={() => setSelectedProduct(null)}
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <DialogDescription className="sr-only">
                  View detailed product information and listings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <ImageWithFallback
                    src={getPrimaryImage(selectedProduct)}
                    alt={selectedProduct.title}
                    className="w-32 h-32 object-contain p-2 rounded-lg flex-shrink-0 bg-white dark:bg-[var(--card)]"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-2">
                      {selectedProduct.title}
                    </h3>
                    <p className="text-2xl text-primary mb-2">
                      ₱{Number(selectedProduct?.price ?? 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Seller
                    </div>
                    <div className="font-medium">
                      {selectedProduct?.seller?.username ?? selectedProduct?.seller_id}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Category
                    </div>
                    <div className="font-medium">
                      {selectedProduct?.category ? (typeof selectedProduct.category === 'object' ? selectedProduct.category.name : selectedProduct.category) : ''}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Condition
                    </div>
                    <div className="font-medium">
                      {selectedProduct?.condition ?? 'Unknown'}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Location
                    </div>
                    <div className="font-medium">
                      {selectedProduct?.location ?? ''}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Views
                    </div>
                    <div className="font-medium">
                      {selectedProduct?.views ?? 0}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Posted
                    </div>
                    <div className="font-medium">
                      {selectedProduct?.datePosted ? new Date(selectedProduct.datePosted).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteProductModal(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Detail Modal - Comprehensive View */}
      <Dialog
        open={selectedReport !== null}
        onOpenChange={() => setSelectedReport(null)}
      >
        <DialogContent className="modal-standard sm:max-w-[800px] max-h-[90vh]">
          {selectedReport && (
            <>
              <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-red-600" />
                    Reported{" "}
                    {selectedReport.type === "product"
                      ? "Product"
                      : "User"}{" "}
                    - Full Details
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleUpdateReport('reviewed')}>Mark Reviewed</Button>
                    <Button size="sm" onClick={() => handleUpdateReport('resolved')}>Mark Resolved</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleUpdateReport('dismissed')}>Dismiss</Button>
                  </div>
                </div>
                <DialogDescription className="sr-only">
                  View comprehensive details about reported
                  content and take moderation actions
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto px-1">
                {/* Report Summary */}
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-800 border-red-400 capitalize">
                      {selectedReport.type} Report
                    </Badge>
                    <Badge variant="outline">
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <h3 className="font-medium mb-2">
                    {selectedReport.reportedItem}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedReport.description}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Reported by:
                      </span>{" "}
                      <span className="font-medium">
                        {selectedReport.reportedBy.username}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Reason:
                      </span>{" "}
                      <span className="font-medium">
                        {selectedReport.reason}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Information (if product report) */}
                {selectedReport.type === "product" &&
                  selectedReport.productDetails && (
                    <>
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          Reported Product Details
                        </h4>
                        <Card className="border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20">
                          <CardContent 
                            className="p-4 cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-950/40 transition-colors"
                            onClick={() => {
                              setSelectedProductDetails(selectedReport.productDetails);
                              setShowProductDetailModal(true);
                              setSelectedReport(null);
                            }}
                          >
                            <div className="flex gap-4">
                              <ImageWithFallback
                                src={
                                  selectedReport.productDetails
                                    .image
                                }
                                alt={
                                  selectedReport.productDetails
                                    .title
                                }
                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1">
                                <h5 className="font-medium mb-1">
                                  {
                                    selectedReport
                                      .productDetails.title
                                  }
                                </h5>
                                <div className="text-lg text-green-600 mb-2">
                                  ₱
                                  {selectedReport.productDetails.price.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>
                                    Posted:{" "}
                                    {new Date(
                                      selectedReport.productDetails.datePosted,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Seller Information */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Seller Information
                        </h4>
                        <div 
                          className="bg-white/60 dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-700/50 rounded-[20px] p-5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            // Find the full seller object from allUsers
                            const sellerUser = allUsers.find(
                              u => u.username === selectedReport.productDetails.seller.username
                            );
                            
                            if (sellerUser) {
                              // Close both modals before opening seller profile
                              setSelectedReport(null); // Close "Reported Product - Full Details" modal
                              setSelectedStatModal(null); // Close "Pending Reports (23)" modal
                              
                              // Open seller profile modal
                              setSelectedSellerProfile(sellerUser);
                              toast.success(`Opening profile for ${sellerUser.username}`);
                            } else {
                              toast.error("Unable to load seller profile");
                            }
                          }}
                          title="Click to view seller profile"
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all duration-200">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-lg">
                                {(selectedReport.productDetails.seller.username || selectedReport.productDetails.seller.name || 'S').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Seller Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors duration-200">{selectedReport.productDetails.seller.name || selectedReport.productDetails.seller.username}</h4>
                                <Badge className="bg-red-500 text-white border-0 text-xs px-2 py-0.5">
                                  Reported User
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {selectedReport.productDetails.seller.program || 'Student'}
                              </p>
                              
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                Click to view full seller profile and activity history
                              </p>
                              
                              {/* Rating/Stats */}
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Credit Score: {selectedReport.productDetails.seller.creditScore || 'N/A'}</span>
                                <span>•</span>
                                <span>Items: {allProducts.filter(p => p.seller.username === selectedReport.productDetails.seller.username).length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Seller's All Products */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          All Products by Seller
                        </h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {allProducts
                            .filter(
                              (p) =>
                                p.seller.username ===
                                selectedReport.productDetails
                                  .seller.username,
                            )
                            .map((product) => (
                              <Card
                                key={product.id}
                                className={`hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm ${
                                  product.title ===
                                  selectedReport.productDetails
                                    .title
                                    ? "!border-2 !border-yellow-400 !bg-yellow-50/50 dark:!bg-yellow-950/20"
                                    : ""
                                }`}
                              >
                                <CardContent className="p-3">
                                  <div className="flex gap-3">
                                    <ImageWithFallback
                                      src={getPrimaryImage(product)}
                                      alt={product.title}
                                      className="w-16 h-16 object-contain p-1 rounded bg-white dark:bg-[var(--card)]"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <h6 className="font-medium text-sm mb-1 flex items-center gap-2">
                                            {product.title}
                                            {product.title ===
                                              selectedReport
                                                .productDetails
                                                .title && (
                                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-400 text-xs">
                                                ⚠️ Reported
                                              </Badge>
                                            )}
                                          </h6>
                                          <div className="text-green-600 text-sm">
                                            ₱
                                            {product.price.toLocaleString()}
                                          </div>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {product.category ? (typeof (product.category as any) === 'object' ? (product.category as any).name : product.category) : ''}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          {allProducts.filter(
                            (p) =>
                              p.seller.username ===
                              selectedReport.productDetails
                                .seller,
                          ).length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">
                                No other products found
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                {/* User Information (if user report) */}
                {selectedReport.type === "user" &&
                  selectedReport.userDetails && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Reported User Details
                      </h4>
                      <Card className="border-2 border-orange-300 dark:border-orange-700">
                        <div 
                          className="bg-white/60 dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-700/50 rounded-[20px] p-5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the full user object from allUsers
                            const reportedUser = allUsers.find(
                              u => u.username === selectedReport.userDetails.username
                            );
                            if (reportedUser) {
                              setSelectedSellerProfile(reportedUser);
                              // Don't close the report modal - keep it in background
                            } else {
                              toast.error("Unable to load user profile");
                            }
                          }}
                          title="Click to view user profile"
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all duration-200">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-lg">
                                {(selectedReport.userDetails.username || selectedReport.userDetails.name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors duration-200">{selectedReport.userDetails.username}</h4>
                                <Badge className="bg-red-500 text-white border-0 text-xs px-2 py-0.5">
                                  Reported User
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {selectedReport.userDetails.program}
                              </p>
                              
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                {selectedReport.userDetails.email}
                              </p>
                              
                              {/* Stats */}
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-600 dark:text-gray-400">Credit Score:</span>
                                  <Badge
                                    className={
                                      selectedReport.userDetails.creditScore >= 70
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                    }
                                  >
                                    {selectedReport.userDetails.creditScore}
                                  </Badge>
                                </div>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-600 dark:text-gray-400">Violations:</span>
                                  <Badge variant="destructive" className="text-xs">
                                    {selectedReport.userDetails.violations}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                {/* Bottom Actions */}
                <div className="flex justify-center pt-4 border-t sticky bottom-0 bg-background pb-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedReport(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Warning Modal */}
      <Dialog
        open={showWarningModal}
        onOpenChange={setShowWarningModal}
      >
        <DialogContent className="modal-standard sm:max-w-[500px]">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-orange-600" />
                Send Warning to{" "}
                {selectedSellerProfile?.username}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Send an inactivity warning notification to the
              user
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted transition-colors absolute right-4 top-4"
            onClick={() => {
              setShowWarningModal(false);
              setWarningMessage("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                <strong>Inactivity Warning</strong>
                <br />
                This user has been inactive for{" "}
                <strong>
                  {selectedSellerProfile?.inactiveDays} days
                </strong>
                . Send a warning notification to remind them to
                stay active or their account may be subject to
                suspension.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Warning Message:
              </label>
              <Textarea
                value={
                  warningMessage ||
                  `Dear ${selectedSellerProfile?.username},

Your IskoMarket account has been inactive for ${selectedSellerProfile?.inactiveDays || 0} days. This is an official notification to remind you about our inactivity policy.

���️ INACTIVITY CONSEQUENCES:
${selectedSellerProfile?.inactiveDays < 30 ? `• You are approaching the 30-day threshold\n• At 30 days: All your products will be automatically hidden from the marketplace` : selectedSellerProfile?.inactiveDays >= 30 && selectedSellerProfile?.inactiveDays < 100 ? `• Your products are currently hidden from the marketplace\n• You have ${100 - selectedSellerProfile.inactiveDays} days remaining before account deletion\n• At 100 days: Your account will be permanently deleted` : `• Your account is scheduled for permanent deletion\n• This is your final warning before permanent removal\n• All your data and products will be permanently deleted`}

📌 WHAT YOU NEED TO DO:
• Log in to your account immediately to reset the inactivity counter
• Update your listings or post new products to show activity
• Contact support if you need to appeal or have special circumstances

This is an automated warning from the IskoMarket Administration Team.
Please take immediate action to prevent account suspension.

Best regards,
IskoMarket Admin Team
Cavite State University`
                }
                onChange={(e) =>
                  setWarningMessage(e.target.value)
                }
                rows={16}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowWarningModal(false);
                  setWarningMessage("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() =>
                  handleSendWarning(selectedSellerProfile)
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Send Warning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Product Modal */}
      <Dialog
        open={showDeleteProductModal}
        onOpenChange={setShowDeleteProductModal}
      >
        <DialogContent className="modal-standard sm:max-w-[500px]">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Product
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Permanently delete a product listing from the
              marketplace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                Are you sure you want to delete "
                {selectedProduct?.title}"? The seller will be
                notified with the reason.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for Deletion:
              </label>
              <select
                value={deleteReason}
                onChange={(e) =>
                  setDeleteReason(e.target.value)
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a reason...</option>
                <option value="inappropriate">
                  Inappropriate Content
                </option>
                <option value="prohibited">
                  Prohibited Item
                </option>
                <option value="misleading">
                  Misleading Information
                </option>
                <option value="duplicate">
                  Duplicate Listing
                </option>
                <option value="spam">Spam or Scam</option>
                <option value="violation">
                  Community Guidelines Violation
                </option>
                <option value="reported">
                  Multiple User Reports
                </option>
                <option value="other">
                  Other Policy Violation
                </option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteProductModal(false);
                  setDeleteReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() =>
                  handleDeleteProduct(selectedProduct)
                }
                disabled={!deleteReason}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Account Modal */}
      <Dialog
        open={showRemoveAccountModal}
        onOpenChange={setShowRemoveAccountModal}
      >
        <DialogContent className="modal-standard sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Permanently Remove Account
            </DialogTitle>
            <DialogDescription className="sr-only">
              Permanently remove a user account from the
              marketplace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                <strong>Warning:</strong> This action cannot be
                undone!
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                User "{selectedSellerProfile?.username}" has
                been inactive for{" "}
                {selectedSellerProfile?.inactiveDays} days and
                has not appealed. Their account and all
                associated data will be permanently deleted from
                the system.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRemoveAccountModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() =>
                  handleRemoveAccount(selectedSellerProfile)
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Permanently Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ready to Send Notice Modal is now shown via OverlayManager (screen-level overlay) */}


      {/* Warning Confirmation is now shown via OverlayManager */}

      {/* Flagged User Suspend Confirmation Modal */}
      <Dialog
        open={showFlaggedSuspendConfirmation}
        onOpenChange={() =>
          setShowFlaggedSuspendConfirmation(false)
        }
      >
        <DialogContent
          className="sm:max-w-lg [&>button]:hidden"
        >
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2 flex-1">
                <Ban className="h-5 w-5 text-red-600" />
                Ready to Suspend Account
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* User Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">
                  {selectedSellerProfile?.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSellerProfile?.email}
                </p>
              </div>
              <Badge variant="destructive" className="text-xs">
                Reported User
              </Badge>
            </div>

            {/* Suspension Notice */}
            <div className="p-3 rounded-lg border-2 bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">
                  ⚠️ Suspension Notice – Reported Account
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                User has been reported for violating community
                or marketplace guidelines.
              </p>
            </div>

            {/* Message Preview */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Message:
              </label>
              <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-700">
                <p className="text-sm text-foreground leading-relaxed">
                  Hi {selectedSellerProfile?.username}, your
                  account has been reported for violating our
                  community guidelines. Please be informed that
                  your account is now under review and will be
                  temporarily suspended while the investigation
                  is ongoing. You will be notified once a
                  decision has been made.
                </p>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium mb-2">
                What happens next:
              </p>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>
                  • A suspension notification will be sent to
                  the user
                </li>
                <li>
                  • User will see a banner when they log in
                </li>
                <li>
                  • Account will be temporarily disabled during
                  review
                </li>
                <li>
                  • Admin will be notified once the suspension
                  is processed
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowFlaggedSuspendConfirmation(false);
                  setShowFlaggedSuspendModal(true);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={async () => {
                  setShowFlaggedSuspendConfirmation(false);
                  toast.success(
                    `Account suspended: ${selectedSellerProfile?.username}`,
                    {
                      description:
                        "User has been notified and account access is restricted.",
                      duration: 4000,
                    },
                  );
                  setFlaggedUserMessage("");
                  // Insert audit log
                  try {
                    const { insertAdminAuditLog } = await import('../services/adminAuditService');
                    await insertAdminAuditLog({
                      admin_email: currentUser?.email || currentUser?.username || 'admin',
                      action: 'suspended',
                      target_type: 'user',
                      target_id: String(selectedSellerProfile?.id || selectedSellerProfile?.userId || ''),
                      target_title: selectedSellerProfile?.username || selectedSellerProfile?.name || null,
                      reason: flaggedUserMessage || null,
                    } as any);
                  } catch (e) {
                    console.error('Failed to insert admin audit log for suspension', e);
                  }

                  setSelectedSellerProfile(null);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Suspend Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>




      {/* Product Details Modal is now shown via OverlayManager (screen-level overlay) */}

      {/* Product Delete Confirmation is now shown via OverlayManager */}

      {/* Transaction Appeals Modal (prototype - shows transaction appeals from ConversationContext) */}
      <Dialog
        open={selectedStatModal === "transactionAppeals"}
        onOpenChange={() => setSelectedStatModal(null)}
      >
        <DialogContent className="modal-standard sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="pr-12">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#006400] dark:text-[#4ade80]" />
                Transaction Appeals
              </DialogTitle>
              <DialogDescription className="sr-only">
                View and manage transaction appeals (mock / prototype store)
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted hover:scale-110 transition-all duration-200 absolute top-4 right-6"
              onClick={() => setSelectedStatModal(null)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <AdminAppeals transactionOnly />
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      {selectedProductDetails && showProductDetailModal && (
        <ProductDetail
          product={{
            ...selectedProductDetails,
            images: selectedProductDetails.images || [selectedProductDetails.image],
            condition: selectedProductDetails.condition || "Good",
            location: selectedProductDetails.location || "CvSU Main Campus",
            seller: selectedProductDetails.seller || {
              name: "Seller Name",
              creditScore: 750,
              rating: 4.8,
            },
          }}
          onClose={() => {
            setShowProductDetailModal(false);
            setSelectedProductDetails(null);
          }}
          meetupLocations={[
            "CvSU Main Campus - Main Gate",
            "CvSU Main Campus - Library",
            "CvSU Main Campus - Cafeteria",
          ]}
          onSellerClick={(seller) => {
            setSelectedSellerProfile(seller);
            setShowProductDetailModal(false);
          }}
          currentUser={{ name: "Admin", userType: "admin" }}
          userType="admin"
        />
      )}

      {/* Audit Logs Modal */}
      <Dialog
        open={showAuditLogs}
        onOpenChange={setShowAuditLogs}
      >
        <DialogContent
          className="modal-standard sm:max-w-[900px] max-h-[90vh] border-2 rounded-[24px] border-[#cfe8ce] dark:border-[#14b8a6]/20 bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] shadow-2xl dark:shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2)]"
          style={{
            boxShadow: "0 8px 32px rgba(0, 100, 0, 0.08)",
          }}
        >
          <DialogHeader className="sticky top-0 z-50 pb-4 border-b-2 border-[#cfe8ce] dark:border-[#14b8a6]/20">
            <div className="flex justify-between items-start w-full">
              {/* Title */}
              <DialogTitle className="flex items-center gap-2 text-[#006400] dark:text-[#4ade80]">
                <FileText className="h-5 w-5" />
                Admin Audit Logs
              </DialogTitle>
              <DialogDescription className="sr-only">View and filter administrative audit logs and events.</DialogDescription>

              {/* Dev: Insert example log button (dev mode or example mode only) */}
              {(process.env.NODE_ENV === 'development' || isExampleMode(currentUser)) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2 h-8"
                  onClick={() => insertExampleAudit()}
                >
                  Add Example
                </Button>
              )}

              {/* X Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-[#006400]/10 dark:hover:bg-[#14b8a6]/10 text-[#006400] dark:text-[#4ade80]"
                onClick={() => setShowAuditLogs(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Filters */}
          <div className="flex gap-2 pb-4 border-b-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 mt-4">
            <select
              className="flex h-12 rounded-[12px] border-2 px-4 py-2 text-sm bg-[var(--card)] dark:bg-[var(--card)] border-[#cfe8ce] dark:border-[#14b8a6]/20 text-[#006400] dark:text-[#4ade80] focus:outline-none focus:ring-2 focus:ring-[#006400] dark:focus:ring-[#14b8a6] hover:border-[#006400] dark:hover:border-[#14b8a6] transition-all duration-300 cursor-pointer backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
              value={auditLogFilter.action}
              onChange={(e) =>
                setAuditLogFilter({
                  ...auditLogFilter,
                  action: e.target.value,
                })
              }
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='%23006400' d='M7 10L2 5h10z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: "42px",
                appearance: "none",
                boxShadow: "0 2px 8px rgba(0,100,0,0.08)",
              }}
            >
              <option
                value="all"
                className="bg-white dark:bg-[#003726] text-[#006400] dark:text-[#4ade80] py-2"
              >
                All Actions
              </option>
              <option
                value="deleted"
                className="bg-white dark:bg-[#003726] text-[#006400] dark:text-[#4ade80] py-2"
              >
                Deleted
              </option>
              <option
                value="suspended"
                className="bg-white dark:bg-[#003726] text-[#006400] dark:text-[#4ade80] py-2"
              >
                Suspended
              </option>
              <option
                value="approved"
                className="bg-white dark:bg-[#003726] text-[#006400] dark:text-[#4ade80] py-2"
              >
                Approved
              </option>
              <option
                value="declined"
                className="bg-white dark:bg-[#003726] text-[#006400] dark:text-[#4ade80] py-2"
              >
                Declined
              </option>
              <option
                value="warned"
                className="bg-white dark:bg-[#003726] text-[#006400] dark:text-[#4ade80] py-2"
              >
                Warned
              </option>
            </select>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {getFilteredAuditLogs().map((log) => (
              <Card
                key={log.id}
                className="border-l-4 border-2 rounded-[20px] border-[#cfe8ce] dark:border-[#14b8a6]/20 hover:shadow-xl dark:hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] transition-all duration-300 hover:scale-[1.01] bg-white/50 dark:bg-[var(--card)] backdrop-blur-sm"
                style={{
                  boxShadow: "0 4px 16px rgba(0,100,0,0.08)",
                  borderLeftColor:
                    log.action === "deleted"
                      ? "#FF4B4B"
                      : log.action === "suspended"
                        ? "#E87C22"
                        : "#006400",
                }}
              >
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm mb-1 text-[#006400] dark:text-[#4ade80]">
                        Admin{" "}
                        <span className="font-medium text-[#006400] dark:text-[#4ade80]">
                          {log.adminEmail}
                        </span>
                        <Badge
                          className="mx-2 rounded-[12px] text-white"
                          style={{
                            background:
                              log.action === "deleted"
                                ? "#FF4B4B"
                                : log.action === "suspended"
                                  ? "#E87C22"
                                  : "#0C8F4A",
                            boxShadow:
                              log.action === "deleted"
                                ? "0 0 8px rgba(255,75,75,0.4)"
                                : log.action === "suspended"
                                  ? "0 0 8px rgba(232,124,34,0.4)"
                                  : "0 0 8px rgba(12,143,74,0.4)",
                          }}
                        >
                          {log.action}
                        </Badge>
                        <span className="text-muted-foreground">
                          '{log.itemName}'
                        </span>
                      </p>
                      <p className="text-xs text-[#006400]/60 dark:text-[#4ade80]/60 mb-2">
                        {log.date} at {log.time}
                      </p>
                      {log.reason && (
                        <div className="p-2 bg-muted rounded text-xs">
                          <strong>Reason:</strong> {log.reason}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {log.itemType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>


      {/* Reports Modal */}
      <Dialog open={showReportsModal} onOpenChange={setShowReportsModal}>
        <DialogContent className="modal-standard sm:max-w-3xl max-h-[90vh]">
          <DialogHeader className="sticky top-0 z-50 pb-4 border-b">
            <div className="flex justify-between items-start w-full">
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" /> Admin Reports
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowReportsModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="py-4">
            <AdminReports />
          </div>
        </DialogContent>
      </Dialog>

      {/* For a Cause Review Modal */}
      <Dialog open={showForCauseModal} onOpenChange={setShowForCauseModal}>
        <DialogContent className="modal-standard sm:max-w-3xl max-h-[90vh]">
          <DialogHeader className="sticky top-0 z-50 pb-4 border-b">
            <div className="flex justify-between items-start w-full">
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> For a Cause Review
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForCauseModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="py-4">
            <AdminForCauseReview />
          </div>
        </DialogContent>
      </Dialog>

      {/* Inactive Accounts Panel */}
      {adminFlags.manageInactive && (
        <InactiveAccountsPanel
          isOpen={showInactiveAccountsPanel}
          onClose={() => setShowInactiveAccountsPanel(false)}
          currentUser={currentUser}
          onSendWarning={onSendWarning as any}
        />
      )}


      {/* Full Season Stats Modal removed */}

      {/* System Alert Modal */}
      <SystemAlertModal
        isOpen={showSystemAlert}
        onClose={() => setShowSystemAlert(false)}
      />

      {/* Cancel Maintenance Confirmation */}
      <Dialog open={showCancelMaintenanceConfirmation} onOpenChange={() => setShowCancelMaintenanceConfirmation(false)}>
        <DialogContent className="modal-standard sm:max-w-lg [&>button]:hidden">
          <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Cancel Maintenance
            </DialogTitle>
            <DialogDescription className="sr-only">Confirm cancel maintenance window</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
              <div className="font-medium text-yellow-900">Are you sure you want to cancel the active maintenance window?</div>
              <div className="text-sm text-muted-foreground mt-2">This will immediately end maintenance and notify users that maintenance has been cancelled.</div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelMaintenanceConfirmation(false)}>No, keep maintenance</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={async () => {
                setIsCancellingMaintenance(true);
                try {
                  if (!maintenanceId) throw new Error('No maintenance id available');
                  const res = await updateMaintenanceSettings(String(maintenanceId), { is_active: false, updated_at: new Date().toISOString() });
                  if (res && (res as any).error) throw (res as any).error;
                  toast.success('Maintenance cancelled');
                } catch (e) {
                  console.error('Failed to cancel maintenance:', e);
                  toast.error('Failed to cancel maintenance');
                } finally {
                  setIsCancellingMaintenance(false);
                  setShowCancelMaintenanceConfirmation(false);
                }
              }}>
                {isCancellingMaintenance ? 'Cancelling...' : 'Cancel Maintenance'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Season Reset Modals */}
      <SeasonResetConfirmationModal
        isOpen={showSeasonResetConfirmation}
        onClose={() => setShowSeasonResetConfirmation(false)}
        onProceed={() => {
          setShowSeasonResetConfirmation(false);
          setShowSeasonResetFinal(true);
        }}
        currentSeason={currentSeason}
      />

      <SeasonResetFinalConfirmationModal
        isOpen={showSeasonResetFinal}
        onClose={() => setShowSeasonResetFinal(false)}
        onConfirm={() => {
          setShowSeasonResetFinal(false);
          setShowSeasonResetProcessing(true);
        }}
        currentSeason={currentSeason}
        newSeasonStartDate={seasonDates.endDate}
        lastResetDate={seasonDates.lastResetDate}
      />

      <SeasonResetProcessingModal
        isOpen={showSeasonResetProcessing}
        onComplete={() => {
          setShowSeasonResetProcessing(false);
          setCurrentSeason(currentSeason + 1);
          toast.success(`Successfully reset to Season ${currentSeason + 1}`);
        }}
      />

      {/* Activity Detail Modal */}
      <Dialog
        open={showActivityDetailModal}
        onOpenChange={setShowActivityDetailModal}
      >
        <DialogContent className="modal-standard sm:max-w-[600px]">
          <DialogHeader className="px-6 py-4 border-b relative">
            <div className="pr-12">
              <DialogTitle className="flex items-center gap-2">
                {selectedActivity?.type === "transaction" && (
                  <ShoppingCart
                    className={`h-5 w-5 ${
                      selectedActivity?.status === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                )}
                {selectedActivity?.type === "credit" && (
                  <Star
                    className={`h-5 w-5 ${
                      selectedActivity?.change &&
                      selectedActivity.change > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                )}
                {selectedActivity?.type === "registration" && (
                  <UserCheck className="h-5 w-5 text-blue-600" />
                )}
                {selectedActivity?.type === "system_error" && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {selectedActivity?.type === "slow_response" && (
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                )}
                Activity Details
              </DialogTitle>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 rounded-full absolute top-4 right-6 hover:bg-muted hover:scale-110 transition-all duration-200"
              onClick={() => setShowActivityDetailModal(false)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>

            <DialogDescription className="sr-only">
              View detailed information about this activity
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4 mt-4">
              {/* Activity Type Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Type:
                </span>
                <Badge
                  className={
                    selectedActivity.type === "transaction"
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                      : selectedActivity.type === "credit"
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : selectedActivity.type ===
                            "registration"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : selectedActivity.type ===
                              "system_error"
                            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                            : "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                  }
                >
                  {selectedActivity.type === "transaction" &&
                    "Transaction"}
                  {selectedActivity.type === "credit" &&
                    "Credit Score"}
                  {selectedActivity.type === "registration" &&
                    "Registration"}
                  {selectedActivity.type === "system_error" &&
                    "System Error"}
                  {selectedActivity.type === "slow_response" &&
                    "Slow Response"}
                </Badge>

                {selectedActivity.status && (
                  <Badge
                    variant={
                      selectedActivity.status === "success"
                        ? "default"
                        : selectedActivity.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {selectedActivity.status}
                  </Badge>
                )}
              </div>

              {/* Action */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Action
                </p>
                <p className="text-base font-semibold">
                  {selectedActivity.action}
                </p>
              </div>

              {/* User */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  User/Entity
                </p>
                <p className="text-base">
                  {selectedActivity.user}
                </p>
              </div>

              {/* Details */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Details
                </p>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {selectedActivity.details}
                </p>
              </div>

              {/* Credit Change */}
              {selectedActivity.change && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Credit Score Change
                  </p>
                  <Badge
                    variant={
                      selectedActivity.change > 0
                        ? "default"
                        : "destructive"
                    }
                    className="text-base px-3 py-1"
                  >
                    {selectedActivity.change > 0 ? "+" : ""}
                    {selectedActivity.change} points
                  </Badge>
                </div>
              )}

              {/* Timestamp */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Time
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {selectedActivity.time}
                  </p>
                </div>
                {selectedActivity.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedActivity.timestamp.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Transaction Sub-Type */}
              {selectedActivity.subType && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Transaction Status
                  </p>
                  <Badge
                    variant={
                      selectedActivity.subType === "successful"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {selectedActivity.subType === "successful"
                      ? "Successful"
                      : "Unsuccessful"}
                  </Badge>
                </div>
              )}

              {/* Admin Actions (for errors) */}
              {(selectedActivity.type === "system_error" ||
                selectedActivity.type === "slow_response") && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    Admin Actions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.success(
                          "Issue marked as resolved",
                        );
                        setShowActivityDetailModal(false);
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
                        setShowActivityDetailModal(false);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Investigate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Score handled via screen-level OverlayManager (no nested modal rendered here) */}
    </div>
  );
}