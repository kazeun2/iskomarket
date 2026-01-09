import { supabase } from './lib/supabaseClient';
import { isSupabaseConfigured } from './lib/supabase';
import React, { useState, useEffect, useRef } from "react";
import { OverlayProvider, useOverlayManager, useOptionalOverlayManager } from "./contexts/OverlayManager";
import { OverlayHost } from "./components/OverlayHost";
import {
  Search,
  User,
  MessageSquare,
  MapPin,
  Star,
  Flag,
  Menu,
  X,
  Plus,
  ShoppingBag,
  ArrowRight,
  Shield,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./components/ui/avatar";
import { getPrimaryImage } from "./utils/images";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Navigation } from "./components/Navigation";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetail } from "./components/ProductDetail";
import { normalizeForCompare } from './hooks/useMarketplaceFilters';
import { EditListingModal } from "./components/EditListingModal";
import { updateProduct, isCvSUProduct } from './lib/services/products';
import { submitReport, uploadReportProof, updateReportProofs } from './services/reportService';
import { UserDashboard } from "./components/UserDashboard";
import { updateUser, incrementUserCounters, subscribeToUserChanges, recalcUserTier } from './services/userService';
import { AdminDashboard } from "./components/AdminDashboard";
import { PostProduct } from "./components/PostProduct";
import { AuthPage } from "./auth/AuthPage";
import { ProfileSettings } from "./components/ProfileSettings";
import { SellerProfile } from "./components/SellerProfile";
import { SellerProfileModal } from "./components/SellerProfileModal";
import { FeedbackModal } from "./components/FeedbackModal";
import CvSUMarket from "./components/CvSUMarket";
import { ForACauseSection } from "./components/ForACauseSection";
import { ForACauseGrid } from "./components/ForACauseGrid";
import { CreditScoreBadge } from "./components/CreditScoreBadge";
import { ModerationAlert } from "./components/ModerationAlert";
import { SuspensionNotice } from "./components/SuspensionNotice";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { MarketplaceHero } from './components/MarketplaceHero';
import { InactivityManager } from "./components/InactivityManager";
import { InactivityWarningBanner } from "./components/InactivityWarningBanner";
import { AdminNotificationBanner } from "./components/AdminNotificationBanner";
import { MaintenanceOverlay } from "./components/MaintenanceOverlay";
import { useMaintenance } from './hooks/useMaintenance';
import {
  AnnouncementBannerList,
  Announcement,
} from "./components/AnnouncementBanner";
import { TopFiveMembersSection } from "./components/TopFiveMembersSection";
import { FloatingDailySpinWidget } from "./components/FloatingDailySpinWidget";
import { FloatingSeasonWidget } from "./components/FloatingSeasonWidget";
import { IskoinMeterWidget } from "./components/IskoinMeterWidget";
import { DailySpinModal } from "./components/DailySpinModal";
import { RewardChestModal } from "./components/RewardChestModal";
import {
  SeasonResetPopup,
  getCurrentSeason,
  calculateSeasonResetScore,
  shouldShowSeasonResetPopup,
} from "./components/SeasonResetPopup";
import { ChatModal } from "./components/ChatModal";
import { FeaturedStudentBusiness } from "./components/FeaturedStudentBusiness";
import { TrustedStudentBoardModal } from "./components/TrustedStudentBoardModal";
import { NotificationsModal } from "./components/NotificationsModal";
import { AnnouncementProvider } from "./contexts/AnnouncementContext";
import { useMarketplaceStats } from './hooks/useMarketplaceStats';
import { AnnouncementPopupManager } from "./components/AnnouncementPopupManager";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { isExampleMode, filterExampleData } from "./utils/exampleMode";

// Mock data for demonstration
const mockProducts = [
  {
    id: 2,
    title: "Gaming Laptop - ASUS ROG",
    description:
      "Perfect for programming and gaming. 16GB RAM, RTX 3060, used for 1 year.",
    price: 45000,
    category: "Electronics",
    images: [
      "https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3ElMjBlbGVjdHJvbmljcyUyMHN0dWRlbnR8ZW58MXx8fHwxNzU5MjIxMjgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    seller: {
      id: 2,
      username: "PauAngon",
      name: "PauAngon",
      program: "BS Computer Science",
      bio: "Tech enthusiast and gamer. Selling quality electronics!",
      rating: 2.9,
      totalRatings: 15,
      creditScore: 72,
      successfulPurchases: 8,
      avatar: "",
      reviews: [
        {
          buyerId: 1,
          rating: 5,
          comment:
            "Excellent seller! Very honest about item condition.",
          date: "2024-12-22",
        },
        {
          buyerId: 6,
          rating: 4,
          comment: "Professional and reliable seller",
          date: "2024-12-18",
        },
      ],
    },
    condition: "Good",
    location: "Gate 1",
    datePosted: "2024-12-29",
    views: 120,
    interested: 23,
  },
  {
    id: 1,
    title: "Advanced Calculus Textbook",
    description:
      "Excellent condition, used for Math 151. All pages intact, no highlighting.",
    price: 1200,
    category: "Textbooks",
    images: [
      "https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9va3MlMjBzdHVkeSUyMG1hdGVyaWFsc3xlbnwxfHx8fDE3NTkyMjEyNzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    seller: {
      id: 1,
      username: "MariaBendo",
      name: "MariaBendo",
      program: "BS Computer Science",
      bio: "Math major selling textbooks and study materials. Always negotiable!",
      rating: 5.0,
      totalRatings: 23,
      creditScore: 95,
      successfulPurchases: 15,
      avatar: "",
      reviews: [
        {
          buyerId: 2,
          rating: 5,
          comment:
            "Great seller! Fast response and item was exactly as described.",
          date: "2024-12-25",
        },
        {
          buyerId: 4,
          rating: 4,
          comment: "Good communication, smooth transaction",
          date: "2024-12-20",
        },
        {
          buyerId: 7,
          rating: 5,
          comment: "Highly recommended seller!",
          date: "2024-12-15",
        },
      ],
    },
    condition: "Like New",
    location: "Gate 2",
    datePosted: "2024-12-30",
    views: 45,
    interested: 8,
  },
  {
    id: 3,
    title: "Complete Art Supply Set",
    description:
      "Unused art supplies for Fine Arts students. Includes brushes, paints, and canvas.",
    price: 2500,
    category: "Art Supplies",
    images: [
      "https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3VwcGxpZXMlMjBzdGF0aW9uZXJ5fGVufDF8fHx8MTc1OTIyMTI4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    seller: {
      id: 3,
      username: "HazelPerez",
      name: "HazelPerez",
      program: "Bachelor of Jon",
      bio: "Art student with extra supplies. DM for bundle deals!",
      rating: 4.7,
      totalRatings: 8,
      creditScore: 88,
      successfulPurchases: 12,
      avatar: "",
      reviews: [
        {
          buyerId: 5,
          rating: 5,
          comment:
            "Very helpful seller, provided great advice about the supplies!",
          date: "2024-12-26",
        },
        {
          buyerId: 8,
          rating: 5,
          comment:
            "Fast transaction, items were brand new as promised",
          date: "2024-12-24",
        },
      ],
    },
    condition: "Brand New",
    location: "U-Mall Gate",
    datePosted: "2024-12-28",
    views: 67,
    interested: 12,
  },
];

const meetupLocations = ["Umall Gate", "Gate 1", "Gate 2"];

// Mock "For a Cause" fundraising items
const mockForACauseItems = [
  {
    id: 201,
    title: "Homemade Brownies (Box of 12)",
    description:
      "Freshly baked brownies with premium chocolate. All proceeds go to medical bills.",
    cause: "Medical Assistance for Student with Leukemia",
    price: 200,
    category: "Food & Baked Goods",
    image:
      "https://images.unsplash.com/photo-1702743116767-c59de4e90d5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlZCUyMGdvb2RzJTIwY29va2llc3xlbnwxfHx8fDE3NjAwMjQ0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    seller: {
      id: 4,
      username: "SarahJohn",
      name: "SarahJohn",
      program: "BS Biology",
      bio: "Baking for a cause! Supporting classmate's medical fund.",
      creditScore: 92,
      rating: 4.8,
      totalRatings: 18,
      successfulPurchases: 10,
    },
    organization: "BS Biology Class 2025",
    goalAmount: 50000,
    raisedAmount: 32500,
    supporters: 87,
  },
  {
    id: 202,
    title: "Handmade Pet Collars",
    description:
      "Custom-made collars for dogs and cats. Supporting local animal shelter.",
    cause: "Rescue and Care for Abandoned Campus Pets",
    price: 150,
    category: "Handmade Crafts",
    image:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGNyYWZ0c3xlbnwxfHx8fDE3NTk5Mjk1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    seller: {
      id: 5,
      username: "MarkCruz",
      name: "MarkCruz",
      program: "BS Veterinary Medicine",
      bio: "Animal lover! All proceeds go to campus pet rescue.",
      creditScore: 90,
      rating: 4.6,
      totalRatings: 12,
      successfulPurchases: 7,
    },
    organization: "CvSU Animal Welfare Club",
    goalAmount: 25000,
    raisedAmount: 18750,
    supporters: 52,
  },
  {
    id: 203,
    title: "Relief Goods Package",
    description:
      "Essential supplies package for families affected by recent typhoon.",
    cause: "Disaster Relief for Typhoon-Affected Families",
    price: 300,
    category: "Community Support",
    image:
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwZG9uYXRpb258ZW58MXx8fHwxNzYwMDIyNzcwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    seller: {
      id: 6,
      username: "JaneMend",
      name: "JaneMend",
      program: "BS Social Work",
      bio: "Disaster relief volunteer. Help us help others!",
      creditScore: 94,
      rating: 4.9,
      totalRatings: 25,
      successfulPurchases: 14,
    },
    organization: "CvSU Disaster Response Team",
    goalAmount: 100000,
    raisedAmount: 67500,
    supporters: 145,
  },
  {
    id: 204,
    title: "Eco-Friendly Tote Bags",
    description:
      "Sustainable canvas bags with student designs. Supporting scholarship fund.",
    cause: "Scholarship Fund for Underprivileged Students",
    price: 120,
    category: "Handmade Crafts",
    image:
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwZG9uYXRpb258ZW58MXx8fHwxNzYwMDIyNzcwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    seller: {
      id: 7,
      username: "AlexRiver",
      name: "AlexRiver",
      program: "BS Fine Arts",
      bio: "Designer supporting scholarship fund. Eco-friendly bags!",
      creditScore: 89,
      rating: 4.7,
      totalRatings: 16,
      successfulPurchases: 9,
    },
    organization: "CvSU Student Council",
    goalAmount: 75000,
    raisedAmount: 45800,
    supporters: 98,
  },
  {
    id: 205,
    title: "Premium Coffee Beans",
    description:
      "Locally-sourced coffee beans. Proceeds help rebuild community library.",
    cause: "Library Restoration After Fire Incident",
    price: 250,
    category: "Food & Beverages",
    image:
      "https://images.unsplash.com/photo-1702743116767-c59de4e90d5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlZCUyMGdvb2RzJTIwY29va2llc3xlbnwxfHx8fDE3NjAwMjQ0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    seller: {
      id: 8,
      username: "CarlosSan",
      name: "CarlosSan",
      program: "BS Library Science",
      bio: "Coffee lover rebuilding our library. Every cup counts!",
      creditScore: 91,
      rating: 4.8,
      totalRatings: 20,
      successfulPurchases: 11,
    },
    organization: "Library Science Students Association",
    goalAmount: 150000,
    raisedAmount: 98000,
    supporters: 176,
  },
  {
    id: 206,
    title: "Handcrafted Bookmarks",
    description:
      "Beautiful bookmarks made from recycled materials. Supporting mental health awareness.",
    cause: "Mental Health Support and Awareness Program",
    price: 80,
    category: "Handmade Crafts",
    image:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGNyYWZ0c3xlbnwxfHx8fDE3NTk5Mjk1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    seller: {
      id: 9,
      username: "LisaChen",
      name: "LisaChen",
      program: "BS Psychology",
      bio: "Mental health advocate. Handmade bookmarks with love!",
      creditScore: 93,
      rating: 4.9,
      totalRatings: 22,
      successfulPurchases: 13,
    },
    organization: "CvSU Mental Health Advocates",
    goalAmount: 40000,
    raisedAmount: 28600,
    supporters: 71,
  },
];

// Featured CvSU Market Products
const featuredCvSUProducts = [
  {
    id: 101,
    name: "CvSU Polo Uniform",
    description:
      "Official CvSU white polo with embroidered logo",
    price: 450,
    category: "CvSU Uniforms",
    image:
      "https://tse4.mm.bing.net/th/id/OIP.-oHmAgKavCEdbqiCk0tI8QHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3",
    stock: 50,
  },
  {
    id: 102,
    name: "CvSU PE Shirt",
    description: "Official green PE shirt with CvSU branding",
    price: 350,
    category: "PE Apparel",
    image:
      "https://tse1.mm.bing.net/th/id/OIP.KH34IjuDWnnlzlmGovN2-AHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3",
    stock: 60,
  },
  {
    id: 103,
    name: "CvSU Student Handbook",
    description: "Official student handbook 2025 edition",
    price: 150,
    category: "Books & Modules",
    image:
      "https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NTk5NDc4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    stock: 45,
  },
  {
    id: 104,
    name: "CvSU Official Lanyard",
    description: "Green lanyard with official CvSU logo",
    price: 80,
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1658722452255-44276f94e098?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW55YXJkJTIwaWQlMjBob2xkZXJ8ZW58MXx8fHwxNzYwMDIzODA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    stock: 100,
  },
  {
    id: 106,
    name: "CvSU Notebook",
    description: "Official CvSU branded notebook",
    price: 120,
    category: "Stationery",
    image:
      "https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NTk5NDc4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    stock: 75,
  },
];

// Mock data for Trustworthy Students (Reward System)
const mockTrustedStudents = [
  {
    id: 1,
    userId: 201,
    username: "Maria Santos",
    avatar: "https://i.pravatar.cc/150?img=1",
    program: "BS Computer Science",
    rating: 4.9,
    creditScore: 685,
    bio: "Passionate about tech and helping fellow students find great deals!",
    showBio: true,
    expiresAt: "2025-12-31",
    glowEffect: {
      active: true,
      color: "gold",
      expiresAt: "2025-12-31",
    },
    frameEffect: {
      active: true,
      college: "CEIT",
      expiresAt: "2025-12-31",
    },
    purchasedRewards: [
      "Glow Name Effect",
      "College Frame Badge",
      "Shout-Out Feature",
    ],
  },
  // Additional trusted students would be here...
];

// Mock data for Featured Products (Reward System)
const mockFeaturedProducts = [
  {
    id: 1,
    productId: 2,
    userId: 2,
    title: "Gaming Laptop - ASUS ROG",
    price: 45000,
    category: "Electronics",
    images: [
      "https://images.unsplash.com/photo-1689857538296-b6e1a392a91d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBlbGVjdHJvbmljcyUyMHN0dWRlbnR8ZW58MXx8fHwxNzU5MjIxMjgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    seller: {
      id: 2,
      username: "PauAngon",
      rating: 2.9,
      avatar: "https://i.pravatar.cc/150?img=1",
      glowEffect: {
        active: true,
        color: "gold",
        expiresAt: "2025-12-31",
      },
      frameEffect: {
        active: true,
        college: "CEIT",
        expiresAt: "2025-12-31",
      },
      customTitle: {
        active: false,
        title: "",
        expiresAt: "2025-12-31",
      },
    },
    expiresAt: "2025-12-15",
  },
  {
    id: 2,
    productId: 3,
    userId: 3,
    title: "Complete Art Supply Set",
    price: 2500,
    category: "Art Supplies",
    images: [
      "https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3VwcGxpZXMlMjBzdGF0aW9uZXJ5fGVufDF8fHx8MTc1OTIyMTI4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    seller: {
      id: 3,
      username: "HazelPerez",
      rating: 4.7,
      avatar: "https://i.pravatar.cc/150?img=9",
      glowEffect: {
        active: true,
        color: "gold",
        expiresAt: "2025-12-28",
      },
      customTitle: {
        active: false,
        title: "",
        expiresAt: "2025-12-28",
      },
    },
    expiresAt: "2025-12-08",
  },
  {
    id: 3,
    productId: 1,
    userId: 1,
    title: "Advanced Calculus Textbook",
    price: 1200,
    category: "Textbooks",
    images: [
      "https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9va3MlMjBzdHVkeSUyMG1hdGVyaWFsc3xlbnwxfHx8fDE3NTkyMjEyNzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    seller: {
      id: 1,
      username: "MariaBendo",
      rating: 5.0,
      avatar: "https://i.pravatar.cc/150?img=16",
      glowEffect: {
        active: true,
        color: "platinum",
        expiresAt: "2026-01-15",
      },
      frameEffect: {
        active: true,
        college: "CAS",
        expiresAt: "2026-01-15",
      },
    },
    expiresAt: "2025-12-20",
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState("marketplace");
  // Marketplace-level stats
  const { stats, loading: statsLoading, error: statsError } = useMarketplaceStats();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [userType, setUserType] = useState("student"); // student, admin
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Start with false
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]); // Initialize empty, will be set based on example mode
  const [lastProductsSync, setLastProductsSync] = useState<string | null>(null);
  const lastProductsSyncRef: any = useRef(null);
  const userRealtimeUnsubRef: any = useRef(null);
  const [visibilityCounts, setVisibilityCounts] = useState<{primary?: number; view?: number; raw?: number} | null>(null);

  const [forACauseItems, setForACauseItems] = useState([]); // Initialize empty, will be set based on example mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved theme preference or default to false
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(
        "iskomarket-dark-mode",
      );
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [showProfileSettings, setShowProfileSettings] =
    useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showPostProduct, setShowPostProduct] = useState(false);
  const [showNotifications, setShowNotifications] =
    useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  
  // Report Dialog State (for SellerProfile)
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTargetSeller, setReportTargetSeller] = useState(null);
  const [reportReasonSeller, setReportReasonSeller] = useState("");
  const [reportDescriptionSeller, setReportDescriptionSeller] = useState("");
  const [reportProofSeller, setReportProofSeller] = useState<File[]>([]);
  
  // Delete Dialog State (for SellerProfile - Admin only)
  const [deleteDialogStep, setDeleteDialogStep] = useState(0); // 0=closed, 1=step1, 2=step2
  const [deleteTargetSeller, setDeleteTargetSeller] = useState(null);
  const [deleteReasonSeller, setDeleteReasonSeller] = useState("");
  const [deleteAdminNote, setDeleteAdminNote] = useState("");
  
  const [showPostForCause, setShowPostForCause] =
    useState(false);
  const [moderationAlerts, setModerationAlerts] = useState<
    any[]
  >([]);
  const [showSuspension, setShowSuspension] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] =
    useState(false);
  const [productsVisibilityIssue, setProductsVisibilityIssue] = useState(false);
  const [productsVisibilityNote, setProductsVisibilityNote] = useState<string | null>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const [showModerationModal, setShowModerationModal] =
    useState(false);
  const [moderationModalContent, setModerationModalContent] =
    useState<{
      title: string;
      message: string;
      type: "warning" | "ban" | "suspension" | "permanent";
    } | null>(null);

  // Listen for cross-component product updates (e.g., dashboard edit) so the
  // global products list and any open ProductDetail get updated immediately.
  React.useEffect(() => {
    const handler = (e: any) => {
      const saved = e?.detail;
      if (!saved) return;
      setProducts(prev => prev.map((p: any) => String(p.id) === String(saved.id) ? saved : p));
      setSelectedProduct(prev => prev && String(prev.id) === String(saved.id) ? saved : prev);
    };

    window.addEventListener('iskomarket:product-updated', handler as EventListener);
    return () => window.removeEventListener('iskomarket:product-updated', handler as EventListener);
  }, []);
  const [showMarketingSchedule, setShowMarketingSchedule] =
    useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);
  const [showDeleteReason, setShowDeleteReason] =
    useState(false);
  const [productToDelete, setProductToDelete] =
    useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [userWarnings, setUserWarnings] = useState<{
    [key: string]: {
      hasWarning: boolean;
      message: string;
      inactiveDays: number;
    };
  }>({});
  const [adminNotifications, setAdminNotifications] = useState<
    any[]
  >([]);


  // App-level Edit Listing modal (so it can remain open independently of ProductDetail)
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // Global runtime error handlers to avoid silent white screens
  useEffect(() => {
    function onError(e: ErrorEvent) {
      console.error('Global error caught:', e.error || e.message || e);
      try { toast.error('Runtime error occurred - check console for details'); } catch (err) {}
      try { if (e.preventDefault) e.preventDefault(); } catch (err) {}
    }
    function onRejection(e: PromiseRejectionEvent) {
      console.error('Unhandled rejection:', e.reason || e);
      try { toast.error('Unhandled promise rejection - check console'); } catch (err) {}
      try { if (e.preventDefault) e.preventDefault(); } catch (err) {}
    }
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Maintenance manager (shows overlay or banner depending on role)
  function MaintenanceManager() {
    const { maintenanceWindow } = useMaintenance()
    if (!maintenanceWindow) return null
    return (
      <MaintenanceOverlay title={maintenanceWindow.title} message={maintenanceWindow.message || ''} currentWindowId={maintenanceWindow.id} />
    )
  }

  // Floating widgets and modals state
  const [showDailySpinModal, setShowDailySpinModal] =
    useState(false);

  // Optional overlay manager (safe to call even when there is no provider)
  const optionalOverlayManager = useOptionalOverlayManager();

  // App-level edit handler
  const openEditModalForListing = (listing: any) => {
    setEditingListing(listing);
    setIsEditingModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditingModalOpen(false);
    setEditingListing(null);
  };

  // Open the edit modal after any ProductDetail modal has been closed/removed from the DOM.
  // This uses a MutationObserver to avoid fixed-time delays and be robust across devices.
  const openEditModalAfterClose = (listing: any) => {
    // Close the product detail (if any)
    setSelectedProduct(null);

    // Immediate fallback: hide the overlay right away so it cannot obscure the edit modal
    const detailEl = document.querySelector('[data-product-detail="true"]') as HTMLElement | null;
    if (detailEl) {
      try {
        // Use inline style to force it hidden immediately
        detailEl.style.display = 'none';
        detailEl.style.pointerEvents = 'none';
        detailEl.style.opacity = '0';
      } catch (e) {}
    }

    // If no product detail element exists, open immediately
    const exists = document.querySelector('[data-product-detail="true"]');
    if (!exists) {
      openEditModalForListing(listing);
      return;
    }

    // Observe DOM for removal of product detail overlay
    const observer = new MutationObserver((mutations, obs) => {
      const stillExists = document.querySelector('[data-product-detail="true"]');
      if (!stillExists) {
        obs.disconnect();
        openEditModalForListing(listing);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Timeout fallback: if not removed in 1500ms, open anyway
    setTimeout(() => {
      const stillExists = document.querySelector('[data-product-detail="true"]');
      if (stillExists) {
        try { observer.disconnect(); } catch (e) {}
        openEditModalForListing(listing);
      }
    }, 1500);
  };

  const handleUpdateListing = async (updatedListing: any) => {
    // Persist using the service and update local state
    try {
      const saved = await updateProduct(String(updatedListing.id), updatedListing);
      // Normalize id comparison to avoid string/number mismatches
      setProducts((prev) => prev.map((p: any) => (String(p.id) === String(saved.id) ? saved : p)));
      toast.success('Product updated successfully!');
      closeEditModal();
    } catch (err: any) {
      console.error('Failed to update listing', err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('could not find') || msg.includes('seller') || msg.includes('schema')) {
        toast.error('Server schema error while saving; attempting a safe server-side save. If this persists, please refresh and try again.');
      } else {
        toast.error(err?.message || 'Failed to update product');
      }
    }
  };
  const [showRewardChestModal, setShowRewardChestModal] =
    useState(false);
  const [userIskoins, setUserIskoins] = useState(0); // Iskoins from user data
  const [userSpins, setUserSpins] = useState(0);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [userSpinsLeft, setUserSpinsLeft] = useState(1); // Mock spins
  const [userRechargesLeft, setUserRechargesLeft] = useState(0); // Mock recharges
  const [iskoinChange, setIskoinChange] = useState<
    number | undefined
  >(undefined);

  // Season Reset Popup state
  const [showSeasonResetPopup, setShowSeasonResetPopup] =
    useState(false);
  const [seasonResetData, setSeasonResetData] = useState<{
    previousScore: number;
    newScore: number;
    season: string;
    iskoinsLocked: boolean;
    totalIskoins: number;
  } | null>(null);



  // Chat Modal state
  const [isChatOpen, setChatOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);

  // Reward Features state
  const [showTrustedStudentBoard, setShowTrustedStudentBoard] =
    useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [trustedStudents, setTrustedStudents] = useState<any[]>([]);

  // Expose a global helper so other parts (like static links) can open the modal
  React.useEffect(() => {
    (window as any).__openTrustedStudentBoard = () => setShowTrustedStudentBoard(true);
    return () => { try { delete (window as any).__openTrustedStudentBoard; } catch (e) {} };
  }, []);

  // Theme toggle effect
  React.useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("iskomarket-dark-mode", "true");
    } else {
      root.classList.remove("dark");
      // Explicitly set light theme attribute so theme tokens (defined under [data-theme="light"]) are applied
      root.setAttribute("data-theme", "light");
      localStorage.setItem("iskomarket-dark-mode", "false");
    }
  }, [isDarkMode]);

  // Dev diagnostics: log and (optionally) enforce off-white app background so we can verify changes quickly.
  // NOTE: only enforce in light mode to avoid leaking light tokens into dark mode.
  React.useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'development') {
        const root = document.documentElement;
        const computed = getComputedStyle(root);
        console.group('[ThemeDiag] App startup theme diagnostics');
        console.log('data-theme:', root.getAttribute('data-theme'));
        console.log('--bg-root (computed):', computed.getPropertyValue('--bg-root'));
        console.log('--background (computed):', computed.getPropertyValue('--background'));
        console.log('body computed background:', getComputedStyle(document.body).background);

        const offWhite = '#f6f9f7';

        if (!isDarkMode) {
          // Enforce an explicit off-white background for verification (non-destructive) — only in light mode.
          root.style.setProperty('--bg-root', offWhite);
          root.style.setProperty('--background', offWhite);
          root.style.setProperty('--app-bg', offWhite);
          // Also ensure the body background reflects the change immediately
          document.body.style.background = offWhite;

          console.log('Enforced off-white tokens and body background (dev only, light mode)');
        } else {
          // Clean up prior dev-only inline overrides when switching to dark mode.
          root.style.removeProperty('--bg-root');
          root.style.removeProperty('--background');
          root.style.removeProperty('--app-bg');
          document.body.style.background = '';

          console.log('Cleared dev-only light overrides for dark mode');
        }

        console.log('--bg-root (new):', getComputedStyle(root).getPropertyValue('--bg-root'));
        console.groupEnd();
      }
    } catch (e) {
      console.error('ThemeDiag failed', e);
    }
  }, [isDarkMode]);

  // Example Mode effect - Update data based on user type
  React.useEffect(() => {
    if (currentUser) {
      // Set products based on example mode
      if (isExampleMode(currentUser)) {
        setProducts(mockProducts);
        setFeaturedProducts(mockFeaturedProducts);
        setTrustedStudents(mockTrustedStudents);
        setForACauseItems(mockForACauseItems);
      } else {
        setProducts([]); // Real users start with empty products
        setFeaturedProducts([]); // Real users start with empty featured products
        setTrustedStudents([]); // Real users start with empty trusted students
        setForACauseItems([]); // Real users start with empty for a cause items
      }
    } else {
      // For unauthenticated visitors, keep the current product state.
      // Do not clear products here so anonymous users can view marketplace listings
      // and receive realtime updates.
    }
  }, [currentUser]);

  // When using real Supabase, fetch products and subscribe to new product inserts
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let pollingInterval: any = null;
    let lastRealtimeEventAt: number | null = null;

    async function setupProductsRealtime() {
      if (!isSupabaseConfigured()) return;
      // Ensure subscriptions and polling run for all visitor types (example mode also benefits from realtime/polling)
      // Previous behavior skipped subscriptions for example/demo users which could result in missed product updates.

      // Start a persistent polling fallback unconditionally so clients will reflect DB rows even when realtime is unreliable
      let persistentPoll: any = null;

      async function pollOnce() {
        try {
          const productsService = await import('./lib/services/products');

          // Warm schema cache for products table to reduce transient schema-cache errors
          try {
            await supabase.from('products').select('id').limit(1);
          } catch (e) {
            // Ignore warming failures - we'll attempt primary and fallback fetches below
            console.debug('Schema warm for products table failed (ignored):', e?.message || e);
          }

          // Try primary rich fetch first
          let primary: any[] = [];
          try {
            primary = await productsService.getProducts();
          } catch (e) {
            console.warn('Primary getProducts failed in pollOnce:', e?.message || e);
          }

          // If primary returned nothing, try fallback strategies
          let final = primary;
          if (!primary || primary.length === 0) {
            const fallback = await productsService.getProductsWithFallback();
            if (fallback && fallback.length > 0) {
              final = fallback;
              console.warn('getProductsWithFallback returned rows while primary getProducts returned none; this may indicate a visibility/RLS or view/join issue.');
              setProductsVisibilityIssue(true);
              setProductsVisibilityNote('Some products exist in the database but are not visible through the primary query; try checking RLS policies, `active_products_view`, or missing seller profiles.');
            }
          } else {
            // Clear any previous warning when primary query returns rows
            setProductsVisibilityIssue(false);
            setProductsVisibilityNote(null);
          }

          const fresh = final || [];
          setProducts((prev) => {
            const prevIds = new Set((prev || []).map((p: any) => p.id));
            const freshIds = new Set((fresh || []).map((p: any) => p.id));
            const changed = prevIds.size !== freshIds.size || [...freshIds].some(id => !prevIds.has(id));
            if (changed) {
              console.debug('Persistent poll discovered change in products, updating UI');
              lastProductsSyncRef.current = Date.now();
              setLastProductsSync(new Date().toISOString());
              return fresh || [];
            }
            return prev;
          });
        } catch (err) {
          console.warn('Persistent poll failed to fetch products', err);
        }
      }

      // Do an immediate poll to ensure UI has canonical rows
      await pollOnce();
      // Start interval regardless of realtime
      persistentPoll = setInterval(pollOnce, 5000);

      try {
        const productsService = await import('./lib/services/products');
        unsubscribe = productsService.subscribeToProducts({
          onInsert: async (newProduct: any) => {
            console.debug('Realtime onInsert payload:', newProduct);
            lastRealtimeEventAt = Date.now();
            // Stop any lightweight polling fallback (we still keep persistent poll running)
            if (pollingInterval) {
              clearInterval(pollingInterval);
              pollingInterval = null;
              console.debug('Realtime product events detected - stopped lightweight polling fallback');
            }

            // Only add if product should be visible to users (defensive check)
            // Treat legacy NULL is_available as visible (RLS policy uses IS NULL === visible)
            if (newProduct.is_deleted || newProduct.is_hidden || (newProduct.is_available === false)) {
              console.debug('Realtime insert ignored (not visible by policy):', newProduct.id);
              return;
            }

            // Try to fetch the full product (including seller join) to ensure UI has seller data.
            try {
              const { getProduct, getProducts } = await import('./lib/services/products');

              // Prefer fetching the single product for speed/partial update
              try {
                const product = await getProduct(newProduct.id);
                setProducts((prev) => {
                  if (prev.some((p: any) => p.id === product.id)) return prev;
                  lastProductsSyncRef.current = Date.now();
                  setLastProductsSync(new Date().toISOString());
                  return [product, ...prev];
                });
              } catch (e) {
                console.warn('Failed to fetch single product on realtime insert, falling back to refetching full list', e);
                // As a robust fallback (handles RLS/join/schema inconsistencies), re-fetch the canonical product list
                try {
                  const { getProductsWithFallback } = await import('./lib/services/products');
                  const fresh = await getProductsWithFallback();
                  lastProductsSyncRef.current = Date.now();
                  setLastProductsSync(new Date().toISOString());
                  setProducts(fresh || []);
                } catch (err) {
                  console.warn('Failed to fetch product list after realtime insert', err);
                }
              }

              return;
            } catch (e) {
              console.warn('Error while handling realtime insert (import or fetch failed), falling back to payload', e);
            }

            // Fallback: synthesize seller if missing and add payload (best-effort, kept for resilience)
            const safe = newProduct.seller ? newProduct : {
              ...newProduct,
              seller: {
                id: newProduct.seller_id,
                username: String(newProduct.seller_id),
                avatar_url: null,
                credit_score: 0,
                is_trusted_member: false,
              }
            };

            // Also trigger a full list refetch to ensure everyone sees the canonical set
            (async () => {
              try {
                const { getProductsWithFallback } = await import('./lib/services/products');
                const fresh = await getProductsWithFallback();
                lastProductsSyncRef.current = Date.now();
                setLastProductsSync(new Date().toISOString());
                setProducts(fresh || [safe]);
              } catch (err) {
                console.warn('Failed to fetch product list in fallback path', err);
                setProducts((prev) => {
                  if (prev.some((p: any) => p.id === safe.id)) return prev;
                  return [safe, ...prev];
                });
              }
            })();
          },

          onUpdate: (updated: any) => {
            console.debug('Realtime product update payload:', updated);
            lastRealtimeEventAt = Date.now();
            if (pollingInterval) {
              clearInterval(pollingInterval);
              pollingInterval = null;
              console.debug('Realtime product events detected - stopped lightweight polling fallback');
            }

            // Try to update single entry then reconcile by fetching fresh list
            (async () => {
              try {
                const { getProducts, getProduct } = await import('./lib/services/products');
                try {
                  const prod = await getProduct(updated.id);
                  lastProductsSyncRef.current = Date.now();
                  setLastProductsSync(new Date().toISOString());
                  setProducts((prev) => prev.map((p: any) => (p.id === prod.id ? { ...p, ...prod } : p)));
                } catch (e) {
                  console.warn('Failed to fetch single product on update, refetching all products', e);
                  // Import fallback fetcher dynamically to avoid circular deps
                  const { getProductsWithFallback } = await import('./lib/services/products');
                  const fresh = await getProductsWithFallback();
                  lastProductsSyncRef.current = Date.now();
                  setLastProductsSync(new Date().toISOString());
                  setProducts(fresh || []);
                }
              } catch (err) {
                console.warn('Error handling product update realtime event', err);
                setProducts((prev) => prev.map((p: any) => (p.id === updated.id ? { ...p, ...updated } : p)));
              }
            })();
          },

          onDelete: (id: string) => {
            console.debug('Realtime product delete payload:', id);
            lastRealtimeEventAt = Date.now();
            if (pollingInterval) {
              clearInterval(pollingInterval);
              pollingInterval = null;
              console.debug('Realtime product events detected - stopped lightweight polling fallback');
            }

            // Re-fetch canonical product list to avoid stale view
            (async () => {
              try {
                const { getProductsWithFallback } = await import('./lib/services/products');
                const fresh = await getProductsWithFallback();
                lastProductsSyncRef.current = Date.now();
                setLastProductsSync(new Date().toISOString());
                setProducts(fresh || []);
              } catch (err) {
                console.warn('Failed to refresh products after delete', err);
                setProducts((prev) => prev.filter((p: any) => p.id !== id));
              }
            })();
          }
        });

        // Start lightweight polling fallback if no realtime events within 5s
        setTimeout(() => {
          if (!lastRealtimeEventAt) {
            console.debug('No realtime product events detected within 5s - starting lightweight polling fallback every 5s');
            pollingInterval = setInterval(async () => {
              try {
                const { getProductsWithFallback } = await import('./lib/services/products');
                const fresh = await getProductsWithFallback();
                // Only set if different length or ids differ - minimal diff check
                const oldIds = new Set(products.map((p: any) => p.id));
                const freshIds = new Set((fresh || []).map((p: any) => p.id));
                const changed = oldIds.size !== freshIds.size || [...freshIds].some(id => !oldIds.has(id));
                if (changed) {
                  console.debug('Lightweight polling fallback found updated product list, updating UI');
                  lastProductsSyncRef.current = Date.now();
                  setLastProductsSync(new Date().toISOString());
                  setProducts(fresh || []);
                }
              } catch (e) {
                console.warn('Lightweight polling fallback failed to fetch products', e);
              }
            }, 5000);
          }
        }, 5000);

      } catch (e) {
        console.warn('Failed to subscribe to realtime product events - falling back to persistent polling', e);
        // Simple polling fallback if subscribe call itself failed
        persistentPoll = setInterval(async () => {
          try {
            const { getProductsWithFallback } = await import('./lib/services/products');
                const fresh = await getProductsWithFallback();
                setProducts(fresh || []);
            lastProductsSyncRef.current = Date.now();
            setLastProductsSync(new Date().toISOString());
          } catch (err) {
            console.warn('Persistent polling fetch failed', err);
          }
        }, 5000);
      }

      // Cleanup: ensure we stop persistent poll on unmount or re-run
      return () => {
        if (persistentPoll) clearInterval(persistentPoll);
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }

    setupProductsRealtime();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Listen for global product-deleted events and remove the product from the canonical list
  // Use a top-level effect so hooks ordering stays consistent
  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id;
      const productId = e?.detail?.product_id;
      if (!id && !productId) return;
      try {
        setProducts((prev) => prev.filter((p: any) => {
          const matchId = id ? (String(p.id) !== String(id) && String(p.product_id) !== String(id)) : true;
          const matchProductId = productId ? (String(p.id) !== String(productId) && String(p.product_id) !== String(productId)) : true;
          return matchId && matchProductId;
        }));

        // As a robust follow-up, trigger an immediate canonical refresh so any visibility mismatches are reconciled promptly.
        (async () => {
          try {
            const productsService = await import('./lib/services/products');
            const fresh = await productsService.getProductsWithFallback();
            if (Array.isArray(fresh)) {
              lastProductsSyncRef.current = Date.now();
              setLastProductsSync(new Date().toISOString());
              setProducts(fresh || []);
            }
          } catch (err) {
            console.warn('Failed to refetch products after delete event', err);
          }
        })();
      } catch (err) {
        console.warn('Failed to remove product from list after delete event', err);
      }
    };

    window.addEventListener('iskomarket:product-deleted', handler as EventListener);
    return () => window.removeEventListener('iskomarket:product-deleted', handler as EventListener);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Handle user warning from admin
  const handleSendUserWarning = (
    username: string,
    message: string,
    inactiveDays: number,
  ) => {
    setUserWarnings((prev) => ({
      ...prev,
      [username]: {
        hasWarning: true,
        message,
        inactiveDays,
      },
    }));
    // Note: Toast notification is handled by WarningSuccessToast component in AdminDashboard
  };

  // Handle user reactivation
  const handleUserReactivation = (username: string) => {
    const warning = userWarnings[username];
    if (warning) {
      // Remove warning
      setUserWarnings((prev) => {
        const newWarnings = { ...prev };
        delete newWarnings[username];
        return newWarnings;
      });

      // Add notification for admin
      const notification = {
        id: Date.now(),
        type: "reactivation",
        username,
        email: `${username.toLowerCase()}@cvsu.edu.ph`,
        previousInactiveDays: warning.inactiveDays,
        timestamp: new Date().toISOString(),
      };

      setAdminNotifications((prev) => [notification, ...prev]);
    }
  };

  // Handle admin dismissing notification
  const handleDismissAdminNotification = (id: number) => {
    setAdminNotifications((prev) =>
      prev.filter((n) => n.id !== id),
    );
  };

  // Handle viewing user from notification
  const handleViewUserFromNotification = (username: string) => {
    toast.info(`Viewing profile for ${username}`);
    // In a real app, this would navigate to the user's profile
  };

  // Announcements feature removed from the app; handler removed.

  const categories = [
    "all",
    "For a Cause",
    "Textbooks",
    "Electronics",
    "Art Supplies",
    "Laboratory Equipment",
    "Sports Equipment",
    "Clothing",
    "Food",
    "Stationery",
    "Others",
  ];

  // Combine regular products and "For a Cause" items
  const allProducts = [
    ...products,
    ...forACauseItems.map((item) => ({
      ...item,
      images: [item.image],
      condition: "Brand New",
      location: item.seller?.location || "Gate 1",
      datePosted: new Date().toISOString(),
      views: Math.floor(Math.random() * 100) + 50,
      interested: item.supporters,
      category: "For a Cause",
    })),
  ];

  const filteredProducts = allProducts.filter((product) => {
    const prodTitle = (product.title || product.name || '').toString();
    const prodDesc = (product.description || '').toString();
    const prodCatRaw = product?.category && (product.category.name || product.category) ? (product.category.name || product.category) : product?.category_id || product?.category || '';
    const matchesSearch =
      prodTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prodDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prodCatRaw.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      normalizeForCompare(prodCatRaw).includes(normalizeForCompare(selectedCategory));
    // Exclude official CvSU products from the main marketplace listing — they belong on the CvSU Market page
    // Criteria: (1) category name starts with 'CvSU' OR (2) title contains 'CvSU' (covers legacy items)
    const hasCvSUTitle = (product.title || '').toString().toLowerCase().includes('cvsu');
    const notCvSU = !isCvSUProduct(product) && !hasCvSUTitle;
    return matchesSearch && matchesCategory && notCvSU;
  });

  // If a category is selected but no products matched, log sample categories (dev helper)
  if (selectedCategory !== 'all' && filteredProducts.length === 0 && allProducts.length > 0) {
    const sampleCats = Array.from(new Set(allProducts.map((p: any) => normalizeForCompare(p?.category && (p.category.name || p.category) ? (p.category.name || p.category) : p?.category_id || p?.category || '')))).slice(0, 10);
    console.debug('[App] category filter returned 0 results', { selectedCategory, normalizedSelected: normalizeForCompare(selectedCategory), sampleCategories: sampleCats });
  }

  // Dev-only global debug helper (localhost): exposes simple getters to inspect runtime state.
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.'))) {
      const dbg = {
        getProducts: () => products,
        getFilteredProducts: () => filteredProducts,
        getSelectedCategory: () => selectedCategory,
        getSearchQuery: () => searchQuery,
        getVisibilityCounts: () => visibilityCounts,
        refresh: handleManualRefresh,
      };
      (window as any).__ISKOMARKET_DEBUG__ = dbg;
      // Convenience alias for quick console access
      try { (window as any).ISKOMARKET_DEBUG = dbg; } catch (e) { /* ignore non-writable window in some environments */ }
      console.info('__ISKOMARKET_DEBUG__ and ISKOMARKET_DEBUG available on window');
    }
    return () => {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.'))) {
        try { delete (window as any).__ISKOMARKET_DEBUG__; } catch(e) {}
        try { delete (window as any).ISKOMARKET_DEBUG; } catch(e) {}
      }
    };
  }, [products, filteredProducts, selectedCategory, searchQuery, visibilityCounts]);

  // Handle category change with loading state and auto-scroll
  useEffect(() => {
    setIsLoadingProducts(true);

    // Simulate loading delay (you can remove this in production with real API)
    const timer = setTimeout(() => {
      setIsLoadingProducts(false);

      // Auto-scroll to product grid after content loads
      if (
        selectedCategory !== "all" &&
        productGridRef.current
      ) {
        setTimeout(() => {
          productGridRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100); // Small delay to ensure content is rendered
      }
    }, 1000); // 1 second loading animation

    return () => clearTimeout(timer);
  }, [selectedCategory]);

  // Manual refresh action for operators/users when no products are shown
  async function handleManualRefresh() {
    try {
      const { getProductsWithFallback } = await import('./lib/services/products');
      const fresh = await getProductsWithFallback();
      setProducts(fresh || []);
      lastProductsSyncRef.current = Date.now();
      setLastProductsSync(new Date().toISOString());
      toast.success('Products refreshed');
      setProductsVisibilityIssue(false);
      setProductsVisibilityNote(null);
    } catch (e) {
      console.error('Manual refresh failed:', e);
      toast.error('Failed to refresh products. Check console for details.');
    }
  }

  // Dev helper: show counts for primary query, active_products_view, and raw products table
  async function handleShowVisibilityCounts() {
    try {
      const productsService = await import('./lib/services/products');
      const primary = await productsService.getProducts();
      const { data: viewData, count: viewCount } = await supabase.from('active_products_view').select('id', { count: 'exact' });
      const { data: rawData, count: rawCount } = await supabase.from('products').select('id', { count: 'exact' });
      setVisibilityCounts({ primary: (primary || []).length, view: viewCount ?? (viewData || []).length, raw: rawCount ?? (rawData || []).length });
      toast.success(`Counts - primary: ${(primary || []).length}, view: ${viewCount ?? (viewData || []).length}, raw: ${rawCount ?? (rawData || []).length}`);
      console.info('Visibility counts', { primary: (primary || []).length, view: viewCount ?? (viewData || []).length, raw: rawCount ?? (rawData || []).length });
    } catch (e) {
      console.error('Failed to fetch visibility counts:', e);
      toast.error('Failed to fetch visibility counts. Check console for details.');
    }
  }

  const normalizeUser = (user: any) => {
    if (!user) return user;
    const glow = (user.glow_expiry || user.glow_effect) ? {
      name: user.glow_effect || null,
      active: user.glow_expiry ? new Date(user.glow_expiry) > new Date() : true,
      expiresAt: user.glow_expiry || null
    } : null;
    return { ...user, glowEffect: glow };
  };

  const handleAuthentication = async (userData: any) => {
    // Ensure user has a credit score
    // Admin accounts start at 100, normal users start at 70
    const defaultCreditScore = userData.isAdmin ? 100 : 70;
    const glowEffectFromData = (userData && (userData.glow_expiry || userData.glow_effect)) ? {
      name: userData.glow_effect || null,
      active: userData.glow_expiry ? new Date(userData.glow_expiry) > new Date() : false,
      expiresAt: userData.glow_expiry || null
    } : null;

    const userWithScore = {
      ...userData,
      creditScore: userData.creditScore || defaultCreditScore,
      iskoins: userData.iskoins || (userData.isAdmin ? 50 : ((userData.creditScore || defaultCreditScore) === 100 ? 10 : 0)), // Admin: 50, Students at 100: 10, Others: 0
      violations: userData.violations || 0,
      suspensionCount: userData.suspensionCount || 0,
      messagingBanned: userData.messagingBanned || false,
      messagingBanExpires: userData.messagingBanExpires || null,
      glowEffect: glowEffectFromData,
    };

    setIsAuthenticated(true);
    setCurrentUser(normalizeUser(userWithScore));
    setUserType(userWithScore.isAdmin ? "admin" : "student");
    setUserIskoins(userWithScore.iskoins); // Update userIskoins state with actual user data
    setUserSpins(userWithScore.spin_count ?? userWithScore.total_spins ?? 0);
    setUserTier(userWithScore.tier || null);

    // Setup realtime subscription to keep iskons/spins/tier in sync across sessions
    if (userRealtimeUnsubRef.current) {
      try { userRealtimeUnsubRef.current(); } catch(_) { /* ignore */ }
    }
    if (userWithScore?.id) {
      userRealtimeUnsubRef.current = subscribeToUserChanges(userWithScore.id, (record) => {
        // Merge into currentUser and update local counters
        setCurrentUser(prev => {
          if (!prev) return prev;
          const merged = { ...prev, ...record };
          return normalizeUser(merged);
        });

        if ((record as any)?.iskoins !== undefined) setUserIskoins(Number((record as any).iskoins));
        if ((record as any)?.spin_count !== undefined) setUserSpins(Number((record as any).spin_count));
        else if ((record as any)?.total_spins !== undefined) setUserSpins(Number((record as any).total_spins));
        if ((record as any)?.tier !== undefined) setUserTier(String((record as any).tier));
      });
    }

    // Verify session/auth identity matches the provided profile to avoid stale-cached users
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        if (authUser.id !== userWithScore.id) {
          console.warn('Authentication mismatch: session user differs from provided profile. Overriding with session user profile. Provided:', userWithScore.id, 'Session:', authUser.id);
          // Fetch authoritative profile and use that instead
          try {
            const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
            if (profile) {
              const glowFromProfile = (profile && (profile.glow_expiry || profile.glow_effect)) ? {
                name: profile.glow_effect || null,
                active: profile.glow_expiry ? new Date(profile.glow_expiry) > new Date() : false,
                expiresAt: profile.glow_expiry || null
              } : null;

              const profileWithScore = {
                ...profile,
                creditScore: profile.credit_score ?? userWithScore.creditScore ?? defaultCreditScore,
                iskoins: profile.iskoins ?? userWithScore.iskoins,
                glowEffect: glowFromProfile
              };
              setCurrentUser(normalizeUser(profileWithScore));
            }
          } catch (e) {
            console.error('Failed to fetch authoritative profile for session user:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error verifying auth session during handleAuthentication:', e);
    }

    // Check if season reset popup should be shown (only for non-admin users)
    if (!userWithScore.isAdmin) {
      const currentSeason = getCurrentSeason();
      if (shouldShowSeasonResetPopup(currentSeason)) {
        // Show welcome popup for new users
        setSeasonResetData({
          previousScore: 0,
          newScore: 70,
          season: currentSeason,
          iskoinsLocked: true,
          totalIskoins: userWithScore.iskoins,
        });

        // Show popup after a short delay
        setTimeout(() => {
          setShowSeasonResetPopup(true);
        }, 800);
      }
    }

    // Show admin popup and navigate to admin dashboard if admin user
    if (userWithScore.isAdmin) {
      setTimeout(() => {
        toast.success("Admin Access Granted", {
          description:
            "You'll be directed to the Admin Dashboard",
          duration: 3000,
          icon: "👑",
        });
        setCurrentView("admin");
      }, 500);
    }

    // After authentication, proactively fetch latest products to avoid stale UI state
    try {
      if (isSupabaseConfigured() && !isExampleMode(userWithScore)) {
        const { getProductsWithFallback } = await import('./lib/services/products');
        const fresh = await getProductsWithFallback();
        setProducts(fresh || []);
      }
    } catch (e) {
      console.warn('Failed to fetch products after authentication (non-blocking):', e);
    }
  };

  const handleProfileUpdate = (updatedUser: any) => {
    setCurrentUser(normalizeUser(updatedUser));
    // In a real app, you would also update the user data in your backend/database
  };

  // Cleanup user realtime subscription on sign-out
  useEffect(() => {
    if (!isAuthenticated) {
      if (userRealtimeUnsubRef.current) {
        try { userRealtimeUnsubRef.current(); } catch (_) {}
        userRealtimeUnsubRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Handle Report Seller
  const handleReportSeller = (seller: any) => {
    setReportTargetSeller(seller);
    setSelectedSeller(null); // Close seller profile
    setReportDialogOpen(true); // Open report dialog
  };

  const [reportSubmitting, setReportSubmitting] = useState(false);

  const handleReportSubmit = async () => {
    if (!reportReasonSeller) {
      toast.error("Please select a reason for reporting");
      return;
    }
    if (!reportDescriptionSeller.trim()) {
      toast.error("Please provide a description");
      return;
    }
    if (reportDescriptionSeller.trim().length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to submit a report');
      return;
    }

    setReportSubmitting(true);

    try {
      // Prepare payload using column names expected by service
      const payload = {
        type: 'user',
        reported_item_id: String(reportTargetSeller?.id ?? ''),
        reported_item_name: reportTargetSeller?.username || reportTargetSeller?.name || '',
        reporter_id: String(currentUser?.id ?? ''),
        reporter_name: currentUser?.username || currentUser?.name || '',
        reason: reportReasonSeller,
        description: reportDescriptionSeller.trim(),
        proof_urls: [],
      } as any;

      const { data, error } = await submitReport(payload);
      if (error || !data) {
        console.error('Failed to submit report:', error);
        toast.error('Failed to submit report');
        setReportSubmitting(false);
        return;
      }

      const reportId = String((data as any).id);

      // Upload proofs if any and attach to report
      if (reportProofSeller.length > 0) {
        const { data: uploadedUrls, error: uploadErr } = await uploadReportProof(reportProofSeller, reportId);
        if (uploadErr) {
          console.warn('Failed to upload report proof:', uploadErr);
        }
        if (uploadedUrls && uploadedUrls.length > 0) {
          const { error: updateErr } = await updateReportProofs(reportId, uploadedUrls as string[]);
          if (updateErr) console.warn('Failed to attach proof urls:', updateErr);
        }
      }

      toast.success('Report submitted successfully! Our team will review it within 24 hours.');

      // Reset form and close
      setReportReasonSeller("");
      setReportDescriptionSeller("");
      setReportProofSeller([]);
      setReportDialogOpen(false);
      setReportTargetSeller(null);

      // Optionally let listeners know reports changed (AdminDashboard will receive realtime changes too)
      try { window.dispatchEvent(new CustomEvent('iskomarket:reports-changed')); } catch (e) {}
    } catch (err) {
      console.error('Unexpected error submitting report:', err);
      toast.error('Unexpected error submitting report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleReportProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (reportProofSeller.length + files.length > 3) {
      toast.error("Maximum 3 proof files allowed");
      return;
    }
    setReportProofSeller((prev) => [...prev, ...files]);
    if (files.length > 0) {
      toast.success(`${files.length} file(s) added as proof`);
    }
  };

  const removeReportProofFile = (index: number) => {
    setReportProofSeller((prev) => prev.filter((_, i) => i !== index));
    toast.success("File removed");
  };

  // Handle Delete Seller (Admin only)
  const handleDeleteSeller = (seller: any) => {
    setDeleteTargetSeller(seller);
    setSelectedSeller(null); // Close seller profile
    setDeleteDialogStep(1); // Open delete step 1
  };

  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuthenticated={handleAuthentication}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <AnnouncementProvider>
      <OverlayProvider>
        {/* Apply theme class to the app root so CSS tokens take effect for navbar, hero and background */}
        {/* Maintenance overlay: if a window is active, show it via hook. Admins see a small banner, non-admins are locked out */}
        <MaintenanceManager />
        <div className={`${userType === 'admin' ? 'theme-admin' : 'theme-user'} min-h-screen bg-background`}>
      <Navigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        userType={userType}
        setUserType={setUserType}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenProfileSettings={() =>
          setShowProfileSettings(true)
        }
        onOpenFeedback={() => setShowFeedback(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        notificationUnreadCount={notificationUnreadCount}
        onSignOut={async () => {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setUserType("student");

          // After sign-out, refresh public products (non-blocking)
          try {
            if (isSupabaseConfigured()) {
              const { getProductsWithFallback } = await import('./lib/services/products');
              const fresh = await getProductsWithFallback();
              setProducts(fresh || []);
            }
          } catch (e) {
            console.warn('Failed to fetch products after sign-out (non-blocking):', e);
          }
        }}
      />

      <div className="container mx-auto px-2 sm:px-3 py-3 sm:py-4 relative z-0 overflow-visible">
        <ErrorBoundary>
        {currentView === "marketplace" && (
          <div
            className="space-y-3 sm:space-y-4 relative z-0"
            data-view-container
            {...(userType === "admin"
              ? { "data-admin-view": "" }
              : {})}
          >
            {/* Moderation Alerts */}
            {moderationAlerts.length > 0 && (
              <div className="space-y-3">
                {moderationAlerts.map((alert, index) => (
                  <ModerationAlert
                    key={index}
                    type={alert.type}
                    title={alert.title}
                    message={alert.message}
                    onDismiss={() => {
                      setModerationAlerts((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                  />
                ))}
              </div>
            )}

            {/* Inactivity Warning Banner */}
            {currentUser &&
              userWarnings[currentUser.username] && (
                <InactivityWarningBanner
                  hasWarning={
                    userWarnings[currentUser.username]
                      .hasWarning
                  }
                  inactiveDays={
                    userWarnings[currentUser.username]
                      .inactiveDays
                  }
                  warningMessage={
                    userWarnings[currentUser.username].message
                  }
                  onReactivate={() =>
                    handleUserReactivation(currentUser.username)
                  }
                />
              )}

            {/* Suspension Notice */}
            {showSuspension &&
              currentUser?.suspensionCount > 0 && (
                <SuspensionNotice
                  type={
                    currentUser.suspensionCount === 1
                      ? "3-day"
                      : "permanent"
                  }
                  reason="Multiple violations detected"
                  onAppeal={() => {
                    toast.info("Appeal feature coming soon");
                  }}
                />
              )}

            {/* Hero Section (MarketplaceHero) */}
            {/* App-level flag to show the Inactive Accounts panel (Admin primary action) */}

            <MarketplaceHero
              userRole={userType === 'admin' ? 'admin' : 'user'}
              firstName={(currentUser?.username || currentUser?.name || 'Student').split(' ')[0]}
              totalProducts={stats?.totalProducts}
              totalUsers={stats?.totalUsers}
              myListingsCount={currentUser?.listingCount}
              loading={statsLoading}
              onPrimaryAction={() => {
                // Navigate to admin dashboard for admin-like actions
                setCurrentView('admin');
                setUserType('admin');
              }}
              onClickProducts={() => {
                const el = document.getElementById('products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              onClickUsers={() => {
                setCurrentView('admin');
                setUserType('admin');
              }}
              onOpenTrustBoard={() => setShowTrustedStudentBoard(true)}
            />

            {/* Search and Filters - Inline Compact Layout */}
            <div className="space-y-4">
              {/* Inline Search Bar Layout: Search | Categories | Post Button */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Search Bar - Takes most space - Premium Fintech Style */}
                <div 
                  className="relative flex-1 min-w-0"
                  style={{
                    borderRadius: '18px',
                    background: 'rgba(0, 20, 10, 0.55)',
                    border: '1px solid rgba(0, 255, 150, 0.18)',
                    boxShadow: '0px 0px 18px rgba(0, 255, 150, 0.10)',
                    padding: '0px',
                  }}
                >
                  {/* Light Mode Search Bar Overlay */}
                  <div 
                    className="absolute inset-0 dark:opacity-0 opacity-100 pointer-events-none -z-10"
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '18px',
                      border: '1px solid rgba(0, 100, 40, 0.12)',
                      boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.05)',
                    }}
                  />

                  {/* Noise Overlay - Dark Mode */}
                  <div 
                    className="absolute inset-0 pointer-events-none dark:opacity-[0.06] opacity-0"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
                      mixBlendMode: 'overlay',
                      borderRadius: '18px'
                    }}
                  />

                  {/* Noise Overlay - Light Mode */}
                  <div 
                    className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-[0.03]"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
                      mixBlendMode: 'overlay',
                      borderRadius: '18px'
                    }}
                  />

                  <Search 
                    className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 dark:text-[#C7FFE5] text-[#0A6E3A] z-20 transition-all search-icon-glow pointer-events-none"
                  />
                  <Input
                    placeholder="Search for textbooks, electronics, supplies..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery && productGridRef.current) {
                        productGridRef.current.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }
                    }}
                    className="pl-12 pr-14 h-12 border-0 bg-transparent relative z-10 font-medium text-base dark:text-[#CFFFE7] text-[#064B2F] dark:placeholder:text-[rgba(180,255,225,0.35)] placeholder:text-[rgba(0,70,40,0.45)] focus-visible:ring-0 focus-visible:ring-offset-0"
                    style={{
                      borderRadius: '18px',
                      fontSize: '16px',
                    }}
                  />
                  {/* Proceed/Search Button */}
                  <button
                    onClick={() => {
                      if (searchQuery && productGridRef.current) {
                        productGridRef.current.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 dark:bg-[#00C87D]/20 bg-[#0A6E3A]/10 dark:hover:bg-[#00C87D]/30 hover:bg-[#0A6E3A]/20 group"
                    disabled={!searchQuery}
                    style={{
                      opacity: searchQuery ? 1 : 0.4,
                      cursor: searchQuery ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <ArrowRight className="h-4 w-4 dark:text-[#C7FFE5] text-[#0A6E3A] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <style>
                    {`
                      .search-icon-glow {
                        filter: drop-shadow(0px 0px 0px rgba(0, 200, 125, 0));
                        transition: filter 0.3s ease;
                      }
                      input:focus ~ .search-icon-glow,
                      input:focus-visible ~ .search-icon-glow {
                        filter: drop-shadow(0px 0px 8px rgba(0, 200, 125, 0.35)) !important;
                      }
                    `}
                  </style>
                </div>

                {/* All Categories Dropdown - Compact (25-30% smaller) */}
                <div className="w-[140px] sm:w-[180px] flex-shrink-0">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger
                      className={`h-10 transition-all duration-300 rounded-xl ${
                        selectedCategory !== "all"
                          ? "bg-primary text-primary-foreground border-primary shadow-md hover:shadow-lg"
                          : "border-2 hover:border-primary/50 hover:bg-[#e6f4ea] dark:hover:bg-[#193821]"
                      }`}
                    >
                      <SelectValue>
                        {selectedCategory === "all"
                          ? "All Categories"
                          : selectedCategory === "For a Cause"
                            ? "For a Cause"
                            : selectedCategory}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[100] rounded-xl border shadow-lg">
                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className={`rounded-lg cursor-pointer transition-all duration-300 hover:bg-[#e6f4ea] dark:hover:bg-[#193821] ${
                            category === "For a Cause"
                              ? "for-a-cause-option"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>
                              {category === "all"
                                ? "All Categories"
                                : category === "For a Cause"
                                  ? "For a Cause"
                                  : category}
                            </span>

                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Post Product Button - Fixed width with responsive text */}
                <Button
                  onClick={() => setShowPostProduct(true)}
                  className="flex items-center justify-center h-10 w-10 flex-shrink-0 rounded-xl dark:bg-gradient-to-r dark:from-[#003920] dark:to-[#00C47A] dark:text-white dark:hover:shadow-[0_0_20px_rgba(0,255,160,0.25)] bg-gradient-to-r from-[#EFFEF4] to-[#D8FEE7] text-[#0A6633] hover:shadow-[0_0_16px_rgba(50,199,122,0.25)]"
                  size="default"
                  aria-label="Post Product"
                  style={{
                    transition: "all 160ms ease-out",
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Moderation Tests - Only for Admin - Premium Fintech */}
              {userType === "admin" && (
                <div className="relative rounded-[20px] bg-gradient-to-br from-white/85 via-white/75 to-[#F1F8F4]/70 dark:from-[#0c251b]/95 dark:via-[#092017]/90 dark:to-[#0a1f14]/85 backdrop-blur-[12px] dark:backdrop-blur-[18px] border-[1.5px] border-[#4CAF50]/12 dark:border-[#00C87D]/10 shadow-[0_2px_12px_rgba(76,175,80,0.08)] dark:shadow-[0_4px_20px_rgba(0,200,125,0.12),0_0_60px_rgba(0,200,125,0.03)] p-4 mt-2 overflow-hidden">
                  
                  {/* Noise Texture - Light Mode */}
                  <div 
                    className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-[0.025]"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.025\'/%3E%3C/svg%3E")',
                      mixBlendMode: 'overlay',
                      borderRadius: '20px',
                    }}
                  />

                  {/* Noise Texture - Dark Mode */}
                  <div 
                    className="absolute inset-0 pointer-events-none dark:opacity-[0.045] opacity-0"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.045\'/%3E%3C/svg%3E")',
                      mixBlendMode: 'overlay',
                      borderRadius: '20px',
                    }}
                  />

                  {/* Vignette - Dark Mode */}
                  <div className="absolute inset-0 dark:opacity-30 opacity-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.15) 100%)',
                    borderRadius: '20px',
                  }}></div>

                  <div className="relative flex gap-2.5 flex-wrap items-center">
                    <span className="text-xs text-[#2E7D32] dark:text-[#00E5A0] self-center">
                      Quick Moderation:
                    </span>
                    <Button
                      onClick={() => {
                        setModerationModalContent({
                          type: "warning",
                          title: "Content Warning - 1st Offense",
                          message:
                            "Inappropriate language detected in your recent message. Please maintain respectful communication. Further violations may result in messaging restrictions.",
                        });
                        setShowModerationModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="h-8 px-4 text-xs rounded-full border-[1.5px] border-[#4CAF50]/25 dark:border-[#00C87D]/30 bg-gradient-to-br from-[#E8F5E9]/60 to-[#C8E6C9]/50 dark:from-[#0a2f1f]/60 dark:to-[#0c3a25]/50 text-[#1B5E20] dark:text-[#00E5A0] hover:shadow-[0_0_16px_rgba(76,175,80,0.25)] dark:hover:shadow-[0_0_20px_rgba(0,200,125,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      Test: 1st Offense
                    </Button>
                    <Button
                      onClick={() => {
                        setModerationModalContent({
                          type: "suspension",
                          title: "3-Day Account Suspension",
                          message:
                            "Your account has been suspended for 3 days due to multiple violations of our community guidelines.",
                        });
                        setShowModerationModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="h-8 px-4 text-xs rounded-full border-[1.5px] border-[#4CAF50]/25 dark:border-[#00C87D]/30 bg-gradient-to-br from-[#E8F5E9]/60 to-[#C8E6C9]/50 dark:from-[#0a2f1f]/60 dark:to-[#0c3a25]/50 text-[#1B5E20] dark:text-[#00E5A0] hover:shadow-[0_0_16px_rgba(76,175,80,0.25)] dark:hover:shadow-[0_0_20px_rgba(0,200,125,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      Test: Suspension
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Top 5 Members Section - Above Overview Cards */}
            <TopFiveMembersSection
              currentUser={currentUser}
              userType={userType}
            />

            {/* Overview Sections - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 relative z-0" style={{ gap: '18px' }}>
              {/* CvSU Market Overview */}
              <Card
                data-overview-cvsu
                className="overflow-hidden border-none glass-card relative z-0"
                style={{
                  border: '2px solid rgba(0, 128, 0, 0.22)',
                  borderRadius: '18px',
                  padding: '16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}
              >
                <style>{`
                  .dark [data-overview-cvsu] {
                    border: 1px solid rgba(20,184,166,0.30) !important;
                    box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important;
                  }
                `}</style>
                <CardHeader className="p-4 pb-3 mb-2 border-b border-[rgba(0,128,0,0.15)] dark:border-[rgba(20,184,166,0.30)] bg-transparent dark:bg-transparent">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#00612D]/10 dark:bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-[#00612D] dark:text-emerald-400" />
                      </div>
                      <span 
                        className="text-[#00612D] dark:text-emerald-400"
                        style={{ 
                          fontSize: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.3px'
                        }}
                      >
                        CvSU Market Overview
                      </span>
                    </CardTitle>
                    <Button
                      onClick={() => setCurrentView("cvsumarket")}
                      variant="ghost"
                      size="sm"
                      className="text-[#00612D] dark:text-emerald-400 hover:text-[#00612D] dark:hover:text-emerald-300 hover:bg-[#00612D]/10 dark:hover:bg-emerald-500/20 px-2 h-7"
                      style={{
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      View All
                      <ArrowRight className="ml-1" style={{ width: '11px', height: '11px' }} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-3">
                  {featuredCvSUProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No products available at the moment</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                      {featuredCvSUProducts
                        .slice(0, 2)
                        .map((product) => (
                        <div
                          key={product.id}
                          className="group cursor-pointer glass-card dark:bg-[var(--card)]/60 rounded-xl border overflow-hidden transition-all duration-300"
                          style={{
                            border: '1.5px solid rgba(0, 128, 0, 0.18)',
                            borderRadius: '18px',
                            padding: '10px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                            backdropFilter: 'blur(8px)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.015)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = 'rgba(0, 128, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(0, 128, 0, 0.18)';
                          }}
                        >
                          <div className="w-full overflow-hidden bg-muted mb-2" style={{ borderRadius: '12px', aspectRatio: '1', height: 'auto' }}>
                            <ImageWithFallback
                              src={getPrimaryImage(product)}
                              alt={product.name}
                              className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300 bg-white dark:bg-[var(--card)]"
                            />
                          </div>
                          <div style={{ paddingBottom: '2px' }}>
                            <h4 
                              className="line-clamp-2 leading-tight text-[#1A1A1A] dark:text-[#E9FFF8]"
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                letterSpacing: '0.15px'
                              }}
                            >
                              {product.name}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* For a Cause Overview */}
              <Card
                data-overview-cause
                className="overflow-hidden border-none bg-gradient-to-b from-white/92 to-[#f6fcf7] dark:bg-gradient-to-b dark:from-[#003726]/90 dark:to-[#021223] relative z-0"
                style={{
                  border: '2px solid rgba(0, 128, 0, 0.22)',
                  borderRadius: '18px',
                  padding: '16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}
              >
                <style>{`
                  .dark [data-overview-cause] {
                    border: 1px solid rgba(20,184,166,0.30) !important;
                    box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important;
                  }
                `}</style>
                <CardHeader className="p-4 pb-3 mb-2 border-b border-[rgba(0,128,0,0.15)] dark:border-[rgba(20,184,166,0.30)] bg-transparent dark:bg-transparent">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#F57C00]/10 dark:bg-amber-500/20 flex items-center justify-center">
                        <span className="text-lg">🧡</span>
                      </div>
                      <span 
                        className="text-[#00612D] dark:text-emerald-400"
                        style={{ 
                          fontSize: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.3px'
                        }}
                      >
                        For a Cause Overview
                      </span>
                    </CardTitle>
                    <Button
                      onClick={() =>
                        setSelectedCategory("For a Cause")
                      }
                      variant="ghost"
                      size="sm"
                      className="text-[#00612D] dark:text-emerald-400 hover:text-[#00612D] dark:hover:text-emerald-300 hover:bg-[#00612D]/10 dark:hover:bg-emerald-500/20 px-2 h-7"
                      style={{
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      View All
                      <ArrowRight className="ml-1" style={{ width: '11px', height: '11px' }} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-3">
                  {forACauseItems.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-4xl block mb-3">🧡</span>
                      <p className="text-muted-foreground">No causes available at the moment</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                      {/* Trending Cause */}
                      {forACauseItems.slice(0, 1).map((item) => {
                      const progress =
                        (item.raisedAmount / item.goalAmount) *
                        100;
                      const causeProduct = allProducts.find(
                        (p) => p.id === item.id,
                      );
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (causeProduct) {
                              setSelectedCategory(
                                "For a Cause",
                              );
                              setSelectedProduct(causeProduct);
                            }
                          }}
                          className="group cursor-pointer glass-card dark:bg-[#0F2820]/60 rounded-xl border overflow-hidden transition-all duration-300"
                          style={{
                            border: '1.5px solid rgba(0, 128, 0, 0.18)',
                            borderRadius: '18px',
                            padding: '10px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                            backdropFilter: 'blur(8px)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.015)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = 'rgba(0, 128, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(0, 128, 0, 0.18)';
                          }}
                        >
                          <div className="w-full overflow-hidden bg-muted relative mb-2" style={{ borderRadius: '12px', aspectRatio: '1', height: 'auto' }}>
                            <ImageWithFallback
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2">
                              {/* Trending Badge - Social Media Style */}
                              <div
                                className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                                style={{
                                  height: '19px',
                                  padding: '0 8px',
                                  borderRadius: '30px',
                                  backdropFilter: 'blur(7px)',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                                  opacity: 0.9
                                }}
                              >
                                {/* Light Mode Glass Background */}
                                <div
                                  className="absolute inset-0 dark:opacity-0 opacity-100"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.45)',
                                    border: '1px solid rgba(0,0,0,0.07)',
                                    borderRadius: '30px',
                                  }}
                                />
                                {/* Dark Mode Glass Background */}
                                <div
                                  className="absolute inset-0 dark:opacity-100 opacity-0"
                                  style={{
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '30px',
                                  }}
                                />
                                {/* Orange accent bar */}
                                <div
                                  className="absolute left-[6px] transition-all duration-150"
                                  style={{
                                    width: '2px',
                                    height: '70%',
                                    background: '#FF8A00',
                                    borderRadius: '1px',
                                    top: '15%'
                                  }}
                                />
                                <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                                  <span className="dark:text-[#F3F3F3] dark:opacity-85">Trending</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ paddingBottom: '2px' }}>
                            <h4 
                              className="line-clamp-2 leading-tight text-[#1A1A1A] dark:text-[#E9FFF8]"
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                letterSpacing: '0.15px',
                                marginBottom: '6px'
                              }}
                            >
                              {item.title}
                            </h4>
                            <div className="space-y-1.5">
                              <div 
                                className="bg-gray-200 dark:bg-[rgba(20,184,166,0.25)] rounded-full overflow-hidden"
                                style={{
                                  height: '6px',
                                  borderRadius: '4px',
                                  background: 'rgba(0,128,0,0.10)'
                                }}
                              >
                                <div
                                  className="h-full bg-gradient-to-r from-[#FFB300] to-[#F57C00] dark:from-emerald-400 dark:to-teal-500 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[#F57C00] dark:text-emerald-400 font-medium">
                                  ₱
                                  {item.raisedAmount.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground dark:text-white/60">
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Nearly Complete Cause */}
                    {forACauseItems.slice(4, 5).map((item) => {
                      const progress =
                        (item.raisedAmount / item.goalAmount) *
                        100;
                      const causeProduct = allProducts.find(
                        (p) => p.id === item.id,
                      );
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (causeProduct) {
                              setSelectedCategory(
                                "For a Cause",
                              );
                              setSelectedProduct(causeProduct);
                            }
                          }}
                          className="group cursor-pointer glass-card dark:bg-[#0F2820]/60 rounded-xl border overflow-hidden transition-all duration-300"
                          style={{
                            border: '1.5px solid rgba(0, 128, 0, 0.18)',
                            borderRadius: '18px',
                            padding: '10px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                            backdropFilter: 'blur(8px)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.015)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = 'rgba(0, 128, 0, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(0, 128, 0, 0.18)';
                          }}
                        >
                          <div className="w-full overflow-hidden bg-muted relative mb-2" style={{ borderRadius: '12px', aspectRatio: '1', height: 'auto' }}>
                            <ImageWithFallback
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2">
                              {/* Nearly Complete Badge - Social Media Style */}
                              <div
                                className="relative flex items-center transition-all duration-150 hover:opacity-100 hover:-translate-y-[2px]"
                                style={{
                                  height: '19px',
                                  padding: '0 8px',
                                  borderRadius: '30px',
                                  backdropFilter: 'blur(7px)',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                                  opacity: 0.9
                                }}
                              >
                                {/* Light Mode Glass Background */}
                                <div
                                  className="absolute inset-0 dark:opacity-0 opacity-100"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.45)',
                                    border: '1px solid rgba(0,0,0,0.07)',
                                    borderRadius: '30px',
                                  }}
                                />
                                {/* Dark Mode Glass Background */}
                                <div
                                  className="absolute inset-0 dark:opacity-100 opacity-0"
                                  style={{
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '30px',
                                  }}
                                />
                                {/* Orange accent bar */}
                                <div
                                  className="absolute left-[6px] transition-all duration-150"
                                  style={{
                                    width: '2px',
                                    height: '70%',
                                    background: '#FF8A00',
                                    borderRadius: '1px',
                                    top: '15%'
                                  }}
                                />
                                <span className="relative z-10" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.01em', color: '#2E2E2E', paddingLeft: '6px' }}>
                                  <span className="dark:text-[#F3F3F3] dark:opacity-85">Nearly Complete</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ paddingBottom: '2px' }}>
                            <h4 
                              className="line-clamp-2 leading-tight text-[#1A1A1A] dark:text-[#E9FFF8]"
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                letterSpacing: '0.15px',
                                marginBottom: '6px'
                              }}
                            >
                              {item.title}
                            </h4>
                            <div className="space-y-1.5">
                              <div 
                                className="bg-gray-200 dark:bg-[rgba(20,184,166,0.25)] rounded-full overflow-hidden"
                                style={{
                                  height: '6px',
                                  borderRadius: '4px',
                                  background: 'rgba(0,128,0,0.10)'
                                }}
                              >
                                <div
                                  className="h-full bg-gradient-to-r from-[#FFB300] to-[#F57C00] dark:from-emerald-400 dark:to-teal-500 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[#F57C00] dark:text-emerald-400 font-medium">
                                  ₱
                                  {item.raisedAmount.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground dark:text-white/60">
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Featured Student Business Section */}
            <FeaturedStudentBusiness
              featuredProducts={featuredProducts}
              currentUser={currentUser}
              onProductClick={(productId) => {
                const product = allProducts.find(
                  (p) => p.id === productId,
                );
                if (product) {
                  setSelectedProduct(product);
                }
              }}
            />

            {/* Product Grid - Show For a Cause Grid or Regular Product Grid */}
            <div
              ref={productGridRef}
              className="relative space-y-4"
            >
              {/* Loading Progress Bar */}
              {isLoadingProducts && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-muted overflow-hidden rounded-full z-10">
                  <div
                    className="h-full bg-primary animate-[shimmer_1s_ease-in-out_infinite]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, transparent, currentColor, transparent)",
                      backgroundSize: "200% 100%",
                      animation:
                        "shimmer 1s ease-in-out infinite",
                    }}
                  />
                </div>
              )}

              {/* Category Label */}
              {selectedCategory !== "all" && (
                <>
                  <div
                    className="flex items-center gap-2 px-4 py-2 bg-primary/5 dark:bg-primary/10 rounded-lg border-l-4 border-primary transition-all duration-300"
                    style={{
                      animation: "fadeInUp 0.4s ease-out",
                    }}
                  >
                    <span className="text-sm text-muted-foreground">
                      Showing results for:
                    </span>
                    <span className="text-sm text-primary">
                      {selectedCategory === "For a Cause"
                        ? "For a Cause"
                        : selectedCategory}
                    </span>
                    <span className="text-xs text-muted-foreground ml-3">
                      ({filteredProducts.length}{" "}
                      {filteredProducts.length === 1
                        ? "item"
                        : "items"}
                      )
                    </span>
                    <div style={{fontSize:12}} className="text-muted-foreground ml-4">Products total: {allProducts.length}{lastProductsSync ? ` • last sync: ${lastProductsSync}` : ''}</div>
                  </div>

                  {productsVisibilityIssue && (
                    <div className="mt-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Visibility warning:</strong> {productsVisibilityNote || 'Some products exist in the database but are not visible through the primary query. Check RLS, missing seller profiles, or active_products_view.'}
                    </div>
                  )}
                </>
              )}

              <div
                className="transition-all duration-400"
                style={{
                  opacity: isLoadingProducts ? 0.3 : 1,
                  transition: "opacity 400ms ease-in-out",
                }}
              >
                {selectedCategory === "For a Cause" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-[#FFB300]/20 flex items-center justify-center">
                        <span className="text-2xl">🧡</span>
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl text-[#F57C00]">
                          For a Cause
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Support student fundraising
                          initiatives
                        </p>
                      </div>
                    </div>
                    <ForACauseGrid
                      items={filteredProducts}
                      onItemClick={setSelectedProduct}
                    />
                  </div>
                ) : (
                  <>
                    {filteredProducts.length === 0 && (
                      <div className="mb-4 flex items-center justify-center gap-3">
                        <div className="text-sm text-muted-foreground">No products are showing right now.</div>
                        <Button size="sm" variant="outline" onClick={handleManualRefresh}>Refresh products</Button>
                        {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.')) && (
                          <>
                          <Button size="sm" variant="ghost" onClick={handleShowVisibilityCounts}>Check visibility counts</Button>
                          {visibilityCounts && (
                            <div className="text-xs text-muted-foreground">Counts - primary: {visibilityCounts.primary ?? '-'}, view: {visibilityCounts.view ?? '-'}, raw: {visibilityCounts.raw ?? '-'}</div>
                          )}
                          {/* Dev inline debug: show client list and filtered counts */}
                          <div className="text-xs text-muted-foreground">DEV: products: {products.length}, filtered: {filteredProducts.length}, category: {selectedCategory}, search: "{searchQuery}"</div>
                          </>
                        )}
                      </div>
                    )}
                    <ProductGrid
                      products={filteredProducts}
                      onProductClick={setSelectedProduct}
                      onSellerClick={setSelectedSeller}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </ErrorBoundary>

        {currentView === "cvsumarket" && (
          <div data-view-container {...(userType === "admin" ? { "data-admin-view": "" } : {})} style={{ background: isDarkMode ? 'var(--overview-cause-bg)' : 'transparent' }}>
            <CvSUMarket userType={userType} />
          </div>
        )}

        {currentView === "dashboard" && (
          <div data-view-container {...(userType === "admin" ? { "data-admin-view": "" } : {})}>
            <UserDashboard 
              currentUser={currentUser}
              isDarkMode={isDarkMode}
              isAdmin={userType === 'admin'}
              onRequestEdit={(product) => openEditModalAfterClose(product)}
            />
          </div>
        )}

        {currentView === "admin" && userType === "admin" && (
          <div data-view-container {...(userType === "admin" ? { "data-admin-view": "" } : {})}>
            {/* Admin Notification Banner */}
            {adminNotifications.length > 0 && (
              <AdminNotificationBanner
                notifications={adminNotifications}
                onDismiss={handleDismissAdminNotification}
                onViewUser={handleViewUserFromNotification}
              />
            )}
            <AdminDashboard
              currentUser={currentUser}
              onSendWarning={handleSendUserWarning}
            />
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          meetupLocations={meetupLocations}
          onSellerClick={setSelectedSeller}
          currentUser={currentUser}
          userType={userType}
          onRequestEdit={(product) => openEditModalAfterClose(product)}
          onProductUpdated={(updated) => {
            setProducts((prev) => prev.map((p: any) => (String(p.id) === String(updated.id) ? updated : p)));
            // Keep selected product in sync
            setSelectedProduct(updated);
          }}
          onProductDeleted={(productId) => {
            setProducts((prev) => prev.filter((p: any) => String(p.id) !== String(productId) && String(p.product_id) !== String(productId)));
            setSelectedProduct(null);
          }}
        />
      )}



      {/* App-level Edit Product Modal (opened when user requests edit from ProductDetail or Dashboard) */}
      <EditListingModal
        isOpen={isEditingModalOpen}
        onClose={closeEditModal}
        listing={editingListing || { id: 0, title: '', price: 0, status: 'available', views: 0, interested: 0, image: '', datePosted: '', description: '' }}
        onUpdateListing={handleUpdateListing}
        portalZIndex={32001}
      />

      {/* Seller Profile Modal (handled through OverlayManager to ensure consistent backdrop and behavior) */}
      {(() => {
        // Use the top-level optional overlay manager to avoid changing hook order
        if (optionalOverlayManager && selectedSeller && optionalOverlayManager.show) {
          optionalOverlayManager.show('profile', {
            userId: selectedSeller.id,
            currentUser: currentUser,
            isAdmin: currentUser?.isAdmin || false,
            onReport: handleReportSeller,
            onDelete: handleDeleteSeller,
          });
          setSelectedSeller(null);
          return null;
        }

        // fall back to inline modal when no overlay manager exists
        return selectedSeller ? (
          <SellerProfileModal
            sellerProfile={selectedSeller}
            sellerProducts={products.filter((product) => product.seller.id === selectedSeller.id)}
            onClose={() => setSelectedSeller(null)}
            onProductClick={(product) => setSelectedProduct(product)}
            currentUser={currentUser}
            isAdmin={currentUser?.isAdmin || false}
            onReport={handleReportSeller}
            onDelete={handleDeleteSeller}
          />
        ) : null;
      })()}

      {/* Report Seller Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent
          className="max-w-md"
          style={{ zIndex: 30000 }}
        >
          <DialogHeader className="text-left sticky top-0 bg-background z-50 pb-4 border-b">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle className="text-lg text-red-600">
                  Report: {reportTargetSeller?.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Report suspicious or inappropriate behavior to help maintain
                  a safe marketplace environment.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted transition-colors absolute right-4 top-4"
                onClick={() => {
                  setReportDialogOpen(false);
                  setReportReasonSeller("");
                  setReportDescriptionSeller("");
                  setReportProofSeller([]);
                }}
                type="button"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <label className="block text-sm mb-3">
                Reason for reporting{" "}
                <span className="inline-block px-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                  *
                </span>
              </label>
              <Select
                value={reportReasonSeller}
                onValueChange={setReportReasonSeller}
              >
                <SelectTrigger
                  className={`${!reportReasonSeller ? "border-red-200" : ""}`}
                >
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fraud">Fraud or Scam</SelectItem>
                  <SelectItem value="inappropriate">
                    Inappropriate Content
                  </SelectItem>
                  <SelectItem value="fake">
                    Fake or Misleading Listing
                  </SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="overpricing">
                    Extreme Overpricing
                  </SelectItem>
                  <SelectItem value="spam">
                    Spam or Excessive Posting
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm mb-3">
                Description{" "}
                <span className="inline-block px-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                  *
                </span>
              </label>
              <Textarea
                placeholder="Please provide detailed information about the issue..."
                value={reportDescriptionSeller}
                onChange={(e) => setReportDescriptionSeller(e.target.value)}
                rows={4}
                className={`${!reportDescriptionSeller.trim() ? "border-red-200" : ""}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters. Be specific about the issue.
              </p>
            </div>

            <div>
              <label className="block text-sm mb-3">
                Proof (optional - up to 3 files)
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleReportProofUpload}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-secondary"
                />
                {reportProofSeller.length > 0 && (
                  <div className="space-y-1">
                    {reportProofSeller.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted p-2 rounded"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReportProofFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setReportDialogOpen(false);
                  setReportReasonSeller("");
                  setReportDescriptionSeller("");
                  setReportProofSeller([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleReportSubmit} className="flex-1" disabled={reportSubmitting}>
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              False reports may result in account restrictions. Please only
              report legitimate concerns.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Seller Step 1 Dialog */}
      {currentUser?.isAdmin && deleteDialogStep === 1 && (
        <Dialog
          open={deleteDialogStep === 1}
          onOpenChange={(open) => !open && setDeleteDialogStep(0)}
        >
          <DialogContent
            className="sm:max-w-md border-2 border-red-200/50 dark:border-red-800/30 rounded-[24px]"
            style={{ zIndex: 30000 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                🔴 Delete Account
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed pt-2">
                Are you sure you want to delete this account?
                <br />
                <br />
                This action will notify the user and allow them{" "}
                <strong>30 days to appeal</strong>. If no appeal is submitted,
                the account becomes deactivated for the season, and will be
                permanently deleted at season reset.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm mb-2">
                  Reason for Deletion <span className="text-red-600">*</span>
                </label>
                <Select
                  value={deleteReasonSeller}
                  onValueChange={setDeleteReasonSeller}
                >
                  <SelectTrigger
                    className={`${!deleteReasonSeller ? "border-red-200" : ""}`}
                  >
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="violated_rules">
                      Violated marketplace rules
                    </SelectItem>
                    <SelectItem value="fraudulent">
                      Fraudulent activity
                    </SelectItem>
                    <SelectItem value="unresolved_warnings">
                      Multiple unresolved warnings
                    </SelectItem>
                    <SelectItem value="fake_listings">
                      Fake or misleading listings
                    </SelectItem>
                    <SelectItem value="user_request">User request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogStep(0);
                    setDeleteReasonSeller("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!deleteReasonSeller) {
                      toast.error("Please select a reason for deletion");
                      return;
                    }
                    setDeleteDialogStep(2);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={!deleteReasonSeller}
                >
                  Proceed to Notify User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Seller Step 2 Dialog */}
      {currentUser?.isAdmin && deleteDialogStep === 2 && (
        <Dialog
          open={deleteDialogStep === 2}
          onOpenChange={(open) => !open && setDeleteDialogStep(1)}
        >
          <DialogContent
            className="sm:max-w-md border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[24px]"
            style={{ zIndex: 30000 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#006400] dark:text-[#4ade80]">
                📨 Send Account Deletion Notice
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                This message will be sent to the user. They will have 30 days
                to submit an appeal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm mb-2">
                  Deletion Reason (Read-only)
                </label>
                <div className="p-3 rounded-lg bg-muted border text-sm">
                  {deleteReasonSeller === "violated_rules" &&
                    "Violated marketplace rules"}
                  {deleteReasonSeller === "fraudulent" && "Fraudulent activity"}
                  {deleteReasonSeller === "unresolved_warnings" &&
                    "Multiple unresolved warnings"}
                  {deleteReasonSeller === "fake_listings" &&
                    "Fake or misleading listings"}
                  {deleteReasonSeller === "user_request" && "User request"}
                  {deleteReasonSeller === "other" && "Other"}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Additional Admin Note (optional)
                </label>
                <Textarea
                  placeholder="Additional explanation (optional)…"
                  value={deleteAdminNote}
                  onChange={(e) => setDeleteAdminNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogStep(1);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    toast.success(
                      `Deletion notice sent to ${deleteTargetSeller?.name}. User has 30 days to appeal.`
                    );
                    setDeleteDialogStep(0);
                    setDeleteReasonSeller("");
                    setDeleteAdminNote("");
                    setDeleteTargetSeller(null);
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Confirm & Notify User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          currentUser={currentUser}
          onUpdateProfile={handleProfileUpdate}
          onClose={() => setShowProfileSettings(false)}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        currentUser={currentUser}
        onClose={() => setShowFeedback(false)}
        isDarkMode={isDarkMode}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        currentUser={currentUser}
        onUnreadCountChange={setNotificationUnreadCount}
      />

      {/* Post Product Modal */}
      <Dialog
        open={showPostProduct}
        onOpenChange={setShowPostProduct}
      >
        <DialogContent className="modal-standard overflow-visible">
          <DialogTitle className="sr-only">
            Post a Product
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create and post a new product listing to the
            marketplace
          </DialogDescription>
          <div className="modal-header-standard relative">
            <h2 className="text-lg">Post a Product</h2>
          </div>
          <div className="modal-content-standard">
            <PostProduct
              currentUser={currentUser}
              meetupLocations={meetupLocations}
              onClose={() => setShowPostProduct(false)}
              onProductPosted={(productData) => {
                // If a server-returned product is provided (has id), use it directly.
                // Otherwise fall back to creating a local demo product for example mode.
                const newProduct = productData.id
                  ? productData
                  : {
                      id: Date.now(),
                      title: productData.title,
                      description: productData.description,
                      price: parseInt(productData.price),
                      category: productData.category,
                      images: productData.images,
                      seller: {
                        ...currentUser,
                        rating: currentUser?.rating || 5.0,
                        totalRatings: currentUser?.totalRatings || 0,
                        creditScore: currentUser?.creditScore || 100,
                        successfulPurchases: currentUser?.successfulPurchases || 0,
                        reviews: currentUser?.reviews || []
                      },
                      condition: productData.condition || 'Brand New',
                      location: productData.location,
                      datePosted: productData.datePosted,
                      views: 0,
                      interested: 0
                    };

                // Normalize server product fields (datePosted compatibility)
                const normalized = newProduct.id
                  ? { ...newProduct, datePosted: newProduct.datePosted || newProduct.created_at, postedDate: newProduct.postedDate || newProduct.created_at }
                  : newProduct;

                // Add to products list
                (async () => {
                  // Defensive sanity checks: ensure product seller matches current session user
                  try {
                    const added = { ...normalized } as any;
                    if (added && added.seller && currentUser && added.seller.id !== currentUser.id) {
                      console.warn('Posted product seller mismatch in UI; product was created under a different authenticated account. Product id:', added.id, 'serverSellerId:', added.seller.id, 'sessionUserId:', currentUser.id);

                      // Add the server-returned product as-is to the UI so seller attribution remains correct
                      setProducts(prev => [added, ...prev]);

                      // Inform the user that the product was created under a different account and suggest re-sync
                      try { toast.warning('This product was created under a different account. Sign out and sign in with the correct account to post under your account.'); } catch (e) { /* noop */ }

                      // Trigger a background refetch to ensure canonical list is up-to-date
                      (async () => {
                        try {
                          const { getProductsWithFallback } = await import('./lib/services/products');
                          const fresh = await getProductsWithFallback();
                          setProducts(fresh || [added]);
                        } catch (e) {
                          console.warn('Failed to refetch products after posting (non-blocking):', e);
                        }
                      })();
                    } else {
                      setProducts(prev => [added, ...prev]);
                    }
                  } catch (e) {
                    console.error('Unexpected error handling posted product:', e);
                    setProducts(prev => [normalized, ...prev]);
                  }

                  setShowPostProduct(false);
                  // Switch to marketplace view to see the new product
                  setCurrentView('marketplace');
                })();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Post for a Cause Modal */}
      <Dialog
        open={showPostForCause}
        onOpenChange={setShowPostForCause}
      >
        <DialogContent className="modal-standard">
          <DialogTitle className="sr-only">
            Post for a Cause
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a fundraising listing to support your cause
          </DialogDescription>
          <div className="modal-header-standard relative">
            <div>
              <h2 className="text-lg">Post for a Cause</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a fundraising listing to support your
                cause. All proceeds from sales will go directly
                to your specified purpose.
              </p>
            </div>
          </div>
          <div className="modal-content-standard">
            <PostProduct
              currentUser={currentUser}
              meetupLocations={meetupLocations}
              onClose={() => setShowPostForCause(false)}
              onProductPosted={(productData) => {
                // Use server-returned product when available, otherwise create local one
                const newProduct = productData.id
                  ? productData
                  : {
                      id: Date.now(),
                      title: productData.title,
                      description: productData.description,
                      price: parseInt(productData.price),
                      category: 'For a Cause',
                      images: productData.images,
                      seller: {
                        ...currentUser,
                        rating: currentUser?.rating || 5.0,
                        totalRatings: currentUser?.totalRatings || 0,
                        creditScore: currentUser?.creditScore || 100,
                        successfulPurchases: currentUser?.successfulPurchases || 0,
                        reviews: currentUser?.reviews || []
                      },
                      condition: 'Brand New',
                      location: productData.location,
                      datePosted: productData.datePosted,
                      views: 0,
                      interested: 0,
                      cause: productData.cause,
                      organization: productData.organization,
                      goalAmount: parseInt(productData.goalAmount || productData.price),
                      isFundraiser: true
                    };

                // Normalize server product fields (datePosted compatibility)
                const normalized = newProduct.id
                  ? { ...newProduct, datePosted: newProduct.datePosted || newProduct.created_at, postedDate: newProduct.postedDate || newProduct.created_at }
                  : newProduct;

                // Add to products list with the same defensive checks as standard posting
                (async () => {
                  try {
                    const added = { ...normalized } as any;
                    if (added && added.seller && currentUser && added.seller.id !== currentUser.id) {
                      console.warn('Posted (for a cause) product seller mismatch in UI; overriding seller for immediate UX and refetching products to reconcile. Product id:', added.id, 'serverSellerId:', added.seller.id, 'sessionUserId:', currentUser.id);
                      added.seller = {
                        id: currentUser.id,
                        username: currentUser.username || currentUser.email,
                        name: currentUser.name,
                        avatar_url: currentUser.avatar_url,
                      };

                      try {
                        const { getProductsWithFallback } = await import('./lib/services/products');
                        const fresh = await getProductsWithFallback();
                        setProducts(fresh || [added]);
                      } catch (e) {
                        console.warn('Failed to refetch products after posting (non-blocking):', e);
                        setProducts(prev => [added, ...prev]);
                      }
                    } else {
                      setProducts(prev => [added, ...prev]);
                    }
                  } catch (e) {
                    console.error('Unexpected error handling posted product (for a cause):', e);
                    setProducts(prev => [normalized, ...prev]);
                  }

                  setShowPostForCause(false);
                  setCurrentView('marketplace');
                })();
              }}
              isFundraiser={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Marketing Office Info Modal */}
      <Dialog
        open={showMarketingSchedule}
        onOpenChange={setShowMarketingSchedule}
      >
        <DialogContent className="modal-standard !w-[400px]">
          <DialogTitle className="sr-only">
            CvSU Marketing Office
          </DialogTitle>
          <DialogDescription className="sr-only">
            View CvSU Marketing Office hours and location
          </DialogDescription>
          <div className="modal-header-standard relative">
            <h2 className="text-lg">CvSU Marketing Office</h2>
          </div>

          <div className="modal-content-standard !max-h-[300px]">
            <div className="space-y-6 text-center">
              {/* Opening Hours */}
              <div className="space-y-2">
                <div className="text-2xl">🕒</div>
                <div>
                  <div className="text-sm mb-1 text-muted-foreground">
                    Opening Hours:
                  </div>
                  <div className="text-base">
                    8:00 AM – 5:00 PM
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="text-2xl">��</div>
                <div>
                  <div className="text-sm mb-1 text-muted-foreground">
                    Location:
                  </div>
                  <div className="text-base">
                    International House 2, Near Gate 1
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer-standard">
            <Button
              onClick={() => setShowMarketingSchedule(false)}
              className="px-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Moderation Modal */}
      <Dialog
        open={showModerationModal}
        onOpenChange={setShowModerationModal}
      >
        <DialogContent className="modal-standard !w-[500px]">
          {moderationModalContent && (
            <>
              <DialogTitle className="sr-only">
                {moderationModalContent.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {moderationModalContent.message}
              </DialogDescription>
              <div className="modal-header-standard relative">
                <div className="flex items-center gap-2">
                  {moderationModalContent.type ===
                    "warning" && (
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Flag className="h-5 w-5 text-yellow-500" />
                    </div>
                  )}
                  {moderationModalContent.type === "ban" && (
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Flag className="h-5 w-5 text-orange-500" />
                    </div>
                  )}
                  {moderationModalContent.type ===
                    "suspension" && (
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  {moderationModalContent.type ===
                    "permanent" && (
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  <h2 className="text-lg">
                    {moderationModalContent.title}
                  </h2>
                </div>
              </div>

              <div className="modal-content-standard !max-h-[400px]">
                <div className="space-y-4">
                  <div
                    className={`rounded-lg p-4 ${
                      moderationModalContent.type === "warning"
                        ? "bg-yellow-500/10 border border-yellow-500/30"
                        : moderationModalContent.type === "ban"
                          ? "bg-orange-500/10 border border-orange-500/30"
                          : "bg-destructive/10 border border-destructive/30"
                    }`}
                  >
                    <p className="text-sm text-foreground">
                      {moderationModalContent.message}
                    </p>
                  </div>

                  {moderationModalContent.type ===
                    "warning" && (
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>What happens next?</strong>
                        <br />
                        This is your first warning. Please
                        review our community guidelines.
                        Additional violations may result in
                        messaging restrictions or account
                        suspension.
                      </p>
                    </div>
                  )}

                  {moderationModalContent.type === "ban" && (
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>Restriction Details:</strong>
                        <br />
                        Duration: 24 hours
                        <br />
                        Affected Features: Messaging, Comments
                        <br />
                        You can still browse and view products.
                      </p>
                    </div>
                  )}

                  {moderationModalContent.type ===
                    "suspension" && (
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>Suspension Details:</strong>
                        <br />
                        Duration: 3 days
                        <br />
                        Affected Features: All marketplace
                        activities
                        <br />
                        Your account will be automatically
                        restored after the suspension period.
                      </p>
                    </div>
                  )}

                  {moderationModalContent.type ===
                    "permanent" && (
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        <strong>Appeal Process:</strong>
                        <br />
                        If you believe this decision was made in
                        error, you may submit an appeal within 7
                        days by contacting
                        admins with your
                        cvsu email and case details.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer-standard">
                <Button
                  onClick={() => setShowModerationModal(false)}
                  variant={
                    moderationModalContent.type === "permanent"
                      ? "destructive"
                      : "default"
                  }
                >
                  {moderationModalContent.type === "permanent"
                    ? "I Understand"
                    : "Got it"}
                </Button>
                {(moderationModalContent.type ===
                  "suspension" ||
                  moderationModalContent.type ===
                    "permanent") && (
                  <Button
                    onClick={() => {
                      setShowModerationModal(false);
                      toast.info("Appeal feature coming soon");
                    }}
                    variant="outline"
                  >
                    Appeal
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="modal-standard !w-[500px]">
          <DialogTitle className="sr-only">
            Confirm Product Deletion
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirm that you want to delete this product from
            the marketplace
          </DialogDescription>
          <div className="modal-header-standard relative">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="text-lg">
                Confirm Product Deletion
              </h2>
            </div>
          </div>

          <div className="modal-content-standard !max-h-[300px]">
            <div className="space-y-4">
              <div className="rounded-lg p-4 bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-foreground mb-2">
                  Are you sure you want to delete this product?
                </p>
                {productToDelete && (
                  <div className="mt-3 p-3 bg-card rounded-lg border">
                    <p className="text-sm">
                      <strong>{productToDelete.title}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seller: {productToDelete.seller?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Price: ₱
                      {productToDelete.price?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                This action cannot be undone. The seller will be
                notified about the deletion.
              </p>
            </div>
          </div>

          <div className="modal-footer-standard">
            <Button
              onClick={() => {
                setShowDeleteConfirmation(false);
                setProductToDelete(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowDeleteConfirmation(false);
                setShowDeleteReason(true);
              }}
              variant="destructive"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Reason Dialog */}
      <Dialog
        open={showDeleteReason}
        onOpenChange={setShowDeleteReason}
      >
        <DialogContent className="modal-standard !w-[500px]">
          <DialogTitle className="sr-only">
            Reason for Deletion
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select a reason for deleting this product
          </DialogDescription>
          <div className="modal-header-standard relative">
            <h2 className="text-lg">Reason for Deletion</h2>
          </div>

          <div className="modal-content-standard !max-h-[400px]">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please select a reason for deleting this
                product. The seller will be notified with this
                reason.
              </p>

              <div className="space-y-2">
                <label className="block text-sm">
                  Select Reason:
                </label>
                <Select
                  value={deleteReason}
                  onValueChange={setDeleteReason}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inappropriate">
                      Inappropriate Content
                    </SelectItem>
                    <SelectItem value="prohibited">
                      Prohibited Item
                    </SelectItem>
                    <SelectItem value="misleading">
                      Misleading Information
                    </SelectItem>
                    <SelectItem value="duplicate">
                      Duplicate Product
                    </SelectItem>
                    <SelectItem value="spam">
                      Spam or Scam
                    </SelectItem>
                    <SelectItem value="violation">
                      Community Guidelines Violation
                    </SelectItem>
                    <SelectItem value="reported">
                      Multiple User Reports
                    </SelectItem>
                    <SelectItem value="other">
                      Other Policy Violation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deleteReason && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-xs text-orange-800 dark:text-orange-200">
                    <strong>Notification Preview:</strong>
                    <br />
                    "Your product '{productToDelete?.title}' has
                    been removed from the marketplace. Reason:{" "}
                    {deleteReason === "inappropriate"
                      ? "Inappropriate Content"
                      : deleteReason === "prohibited"
                        ? "Prohibited Item"
                        : deleteReason === "misleading"
                          ? "Misleading Information"
                          : deleteReason === "duplicate"
                            ? "Duplicate Product"
                            : deleteReason === "spam"
                              ? "Spam or Scam"
                              : deleteReason === "violation"
                                ? "Community Guidelines Violation"
                                : deleteReason === "reported"
                                  ? "Multiple User Reports"
                                  : "Other Policy Violation"}
                    . If you believe this was an error, please
                    contact admins."
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer-standard">
            <Button
              onClick={() => {
                setShowDeleteReason(false);
                setDeleteReason("");
                setProductToDelete(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!deleteReason) {
                  toast.error(
                    "Please select a reason for deletion",
                  );
                  return;
                }

                // Create notification for seller
                const newNotification = {
                  id: Date.now(),
                  type: "product_deleted",
                  title: "Product Removed",
                  message: `Your product "${productToDelete?.title}" has been removed from the marketplace. Reason: ${
                    deleteReason === "inappropriate"
                      ? "Inappropriate Content"
                      : deleteReason === "prohibited"
                        ? "Prohibited Item"
                        : deleteReason === "misleading"
                          ? "Misleading Information"
                          : deleteReason === "duplicate"
                            ? "Duplicate Product"
                            : deleteReason === "spam"
                              ? "Spam or Scam"
                              : deleteReason === "violation"
                                ? "Community Guidelines Violation"
                                : deleteReason === "reported"
                                  ? "Multiple User Reports"
                                  : "Other Policy Violation"
                  }. If you believe this was an error, please contact support.`,
                  date: new Date().toISOString(),
                  read: false,
                  sellerId: productToDelete?.seller?.id,
                };

                setNotifications((prev) => [
                  newNotification,
                  ...prev,
                ]);

                toast.success(
                  `Product deleted successfully. Seller has been notified.`,
                );
                setShowDeleteReason(false);
                setDeleteReason("");
                setProductToDelete(null);
              }}
              variant="destructive"
              disabled={!deleteReason}
            >
              Delete Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inactivity Management */}
      {isAuthenticated &&
        currentUser &&
        userType !== "admin" && (
          <InactivityManager
            currentUser={currentUser}
            onUserUpdate={setCurrentUser}
          />
        )}

      {/* Toast Notifications */}
      <Toaster />



      {/* Floating Widgets - REMOVED - Now displayed as cards in the dashboard stats overview */}

      {/* Daily Spin Modal */}
      {showDailySpinModal && (
        <DailySpinModal
          isOpen={showDailySpinModal}
          onClose={() => setShowDailySpinModal(false)}
            onSpinComplete={async (reward) => {
            setUserSpinsLeft((prev) => Math.max(0, prev - 1));

            // Optimistically update UI
            setUserIskoins((prev) => Number(prev) + reward); // REAL-TIME UPDATE
            setIskoinChange(reward); // Glow/animation effect
            setTimeout(() => setIskoinChange(undefined), 2000); // Reset animation

            // Persist to server atomically (increment iskons, decrement spins)
            try {
              if (currentUser?.id) {
                const result = await incrementUserCounters(String(currentUser.id), reward, -1);
                if (result.error) throw result.error;
                const row = result.data || (Array.isArray(result.data) ? result.data[0] : null);
                if (row) {
                  if (row.iskons !== undefined) setUserIskoins(Number(row.iskons));
                  if (row.spin_count !== undefined) setUserSpins(Number(row.spin_count));
                  if (row.total_spins !== undefined) setUserSpins(Number(row.total_spins));
                }
              }
            } catch (err: any) {
              console.error('Failed to persist spin result:', err);
              toast.error(err?.message || 'Failed to persist spin result. Your iskoin balance may be out of sync.');
            }
          }}
          availableSpins={userSpinsLeft}
          userCreditScore={currentUser?.creditScore || 100}
          currentIskoins={userIskoins} // 🔥 IMPORTANT
        />
      )}

      {/* Reward Chest Modal */}
      {showRewardChestModal && (
        <RewardChestModal
          isOpen={showRewardChestModal}
          onClose={() => setShowRewardChestModal(false)}
          userIskoins={userIskoins}
          onRedeem={async (reward) => {
            // Optimistic UI update
            setUserIskoins((prev) => Number(prev) - reward.cost);
            setIskoinChange(-reward.cost);
            setTimeout(() => setIskoinChange(undefined), 2000);
            toast.success(`Redeemed: ${reward.title}`);

            // Persist change to server (deduct iskoin cost)
            try {
              if (currentUser?.id) {
                const result = await incrementUserCounters(String(currentUser.id), -reward.cost, 0);
                if (result.error) throw result.error;
                const row = result.data || (Array.isArray(result.data) ? result.data[0] : null);
                if (row) {
                  if (row.iskons !== undefined) setUserIskoins(Number(row.iskons));
                if (row.spin_count !== undefined) setUserSpins(Number(row.spin_count));
                if (row.total_spins !== undefined) setUserSpins(Number(row.total_spins));
                }
              }
            } catch (err: any) {
              console.error('Failed to persist redemption:', err);
              toast.error(err?.message || 'Failed to persist redemption. Your iskoin balance may be out of sync.');
            }
          }}
          onIskoinChange={(amount) => {
            setUserIskoins((prev) => prev + amount);
            setIskoinChange(amount);
            setTimeout(() => setIskoinChange(undefined), 2000);
          }}
          userCreditScore={currentUser?.creditScore || 100}
          currentUser={currentUser}
          userProducts={products.filter(
            (p) =>
              p.seller?.id === currentUser?.id ||
              p.seller?.username === currentUser?.username,
          )}
          isAdmin={userType === 'admin'}
          isDarkMode={isDarkMode}
          meetupLocations={meetupLocations}
          onFeaturedProductAdd={(productData) => {
            // Add product to both products list and featured products
            const newProduct = {
              id: Date.now(),
              productId: Date.now(),
              userId: currentUser?.id,
              ...productData,
            };
            
            // Add to main products list
            setProducts(prev => [newProduct, ...prev]);
            
            // Add to featured products list
            setFeaturedProducts(prev => [newProduct, ...prev]);
            
            // Switch to homepage to see the featured product
            setCurrentView('home');
          }}
          onTrustedStudentAdd={(studentData) => {
            // Add the current user to the Trustworthy students board
            const newTrustedStudent = {
              id: Date.now(),
              userId: currentUser?.id || Date.now(),
              username: studentData.username,
              avatar: currentUser?.avatar,
              program: studentData.program || currentUser?.program,
              rating: studentData.rating || currentUser?.rating || 0,
              creditScore: studentData.creditScore || currentUser?.creditScore || 100,
              bio: studentData.bio || currentUser?.bio || '',
              showBio: studentData.showBio !== undefined ? studentData.showBio : true,
              expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              glowEffect: currentUser?.glowEffect,
              frameEffect: currentUser?.frameEffect,
              purchasedRewards: currentUser?.purchasedRewards || [],
            };
            
            // Add to top of Trustworthy students list
            setTrustedStudents(prev => [newTrustedStudent, ...prev]);
          }}
          onGlowNameActivate={async (glowData) => {
            // Persist glow effect (3 days) and update local state optimistically
            const expiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

            // Optimistic UI update
            setCurrentUser(prev => ({
              ...prev,
              glowEffect: {
                active: true,
                name: glowData.style,
                expiresAt: expiry,
              }
            }));

            try {
              // Persist to backend using userService
              if (currentUser?.id) {
                const result = await updateUser(String(currentUser.id), { glow_effect: glowData.style, glow_expiry: expiry });
                if (result.error) {
                  throw result.error;
                }

                // Merge returned server user (if provided) and ensure glowEffect is mapped
                if (result.data) {
                  setCurrentUser(prev => ({
                    ...prev,
                    ...result.data,
                    glowEffect: {
                      name: String(result.data.glow_effect),
                      active: result.data.glow_expiry ? new Date(result.data.glow_expiry) > new Date() : true,
                      expiresAt: result.data.glow_expiry || expiry
                    }
                  }));
                }

                toast.success('Glow effect saved and active for 3 days');
              }
            } catch (e) {
              console.error('Failed to persist glow effect:', e);
              toast.error('Failed to save glow effect. It will still appear locally until you refresh.');
            }
          }}
          onCollegeFrameActivate={(frameData) => {
            // Update current user with college frame
            setCurrentUser(prev => ({
              ...prev,
              frameEffect: {
                active: true,
                college: frameData.college,
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              }
            }));
          }}

        />
      )}

      {/* Season Reset Popup - Only shown after login when season resets */}
      {showSeasonResetPopup && seasonResetData && (
        <SeasonResetPopup
          isOpen={showSeasonResetPopup}
          onClose={() => setShowSeasonResetPopup(false)}
          previousScore={seasonResetData.previousScore}
          newScore={seasonResetData.newScore}
          season={seasonResetData.season}
          iskoinsLocked={seasonResetData.iskoinsLocked}
          totalIskoins={seasonResetData.totalIskoins}
        />
      )}


      {/* Chat Modal */}
      {isChatOpen && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setChatOpen(false)}
          currentUser={currentUser}
          otherUser={otherUser}
          product={selectedProduct}
          onRequestEdit={(product) => {
            // close chat and then open the app-level edit modal after the product detail removal
            setChatOpen(false);
            openEditModalAfterClose(product);
          }}
          onSellerClick={setSelectedSeller}
        />
      )}

      {/* Trustworthy Student Board Modal */}
      <TrustedStudentBoardModal
        isOpen={showTrustedStudentBoard}
        onClose={() => setShowTrustedStudentBoard(false)}
        trustedStudents={trustedStudents}
        currentUser={currentUser}
        onUserClick={(student) => {
          // Convert TrustedStudent to Seller format and open SellerProfile modal
          const sellerData = {
            id: student.userId,
            username: student.username,
            name: student.username,
            avatar: student.avatar,
            rating: student.rating,
            totalReviews: 0,
            creditScore: student.creditScore,
            program: student.program,
            bio: student.bio,
            joinedDate: new Date().toISOString(),
            location: "Cavite State University",
            totalSales: 0,
            responseTime: "Fast",
            completionRate: 100,
            verified: true,
          };
          setSelectedSeller(sellerData);
          setShowTrustedStudentBoard(false);
        }}
      />

      {/* Announcement Popup Manager */}
      {isAuthenticated && currentUser && (
        <AnnouncementPopupManager 
          userType={userType === 'admin' ? 'admin' : (currentUser.userType || 'buyer')} 
        />
      )}
    </div>
    <OverlayHost />
    </OverlayProvider>
    </AnnouncementProvider>
  );
}