import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, ShoppingCart, Store, Star, MessageSquare, Flag, Trash2, X, BarChart3 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { SellerProfile } from './SellerProfile';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TrustworthyBadge } from './TrustworthyBadge';
import { RankTierCompact } from './RankTier';
import { toast } from 'sonner';
import { filterExampleData } from '../utils/exampleMode';
import { submitReport, uploadReportProof } from '../services/reportService';

interface Product {
  id: number;
  title: string;
  price: number;
  images: string[];
  condition: string;
  description: string;
  category: string;
  location: string;
  datePosted: string;
  views: number;
  interested: number;
}

interface TopMember {
  id: number;
  name: string;
  username: string;
  course: string;
  completedTransactions: number;
  rank: number;
  rankTitle: string;
  avatar: string;
  isActive: boolean;
  creditScore: number;
  reportsThisMonth: number;
  products?: Product[];
  rating?: number;
  totalRatings?: number;
  program?: string;
  bio?: string;
  reviews?: Array<{
    buyerId: number;
    rating: number;
    comment: string;
    date: string;
  }>;
}

interface TopFiveMembersSectionProps {
  topBuyers?: TopMember[];
  topSellers?: TopMember[];
  currentUser?: any;
  userType?: string;
}

const RANK_BADGES = [
  { rank: 1, label: '#1', color: 'from-yellow-400 to-yellow-600' },
  { rank: 2, label: '#2', color: 'from-gray-300 to-gray-500' },
  { rank: 3, label: '#3', color: 'from-orange-400 to-orange-600' },
  { rank: 4, label: '#4', color: 'from-blue-400 to-blue-600' },
  { rank: 5, label: '#5', color: 'from-purple-400 to-purple-600' },
];

const defaultTopBuyers: TopMember[] = [
  {
    id: 1,
    name: 'Maria Bendo',
    username: 'MariaBendo',
    course: 'BS Computer Science',
    program: 'BS Computer Science',
    completedTransactions: 47,
    rank: 1,
    rankTitle: 'Elite IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 98,
    reportsThisMonth: 0,
    rating: 5.0,
    totalRatings: 23,
    bio: 'Top buyer with a passion for finding quality tech gear and gadgets!',
  },
  {
    id: 2,
    name: 'Hazel Perez',
    username: 'HazelP',
    course: 'BS Information Technology',
    program: 'BS Information Technology',
    completedTransactions: 38,
    rank: 2,
    rankTitle: 'Trusted IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 94,
    reportsThisMonth: 1,
    rating: 4.9,
    totalRatings: 18,
    bio: 'Trusted buyer and avid collector of books and study materials.',
  },
  {
    id: 3,
    name: 'Pauleen Angon',
    username: 'PauAngon',
    course: 'BS Computer Engineering',
    program: 'BS Computer Engineering',
    completedTransactions: 29,
    rank: 3,
    rankTitle: 'Reliable IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 87,
    reportsThisMonth: 2,
    rating: 4.8,
    totalRatings: 20,
  },
  {
    id: 4,
    name: 'John Santos',
    username: 'JohnnyS',
    course: 'BS Civil Engineering',
    program: 'BS Civil Engineering',
    completedTransactions: 21,
    rank: 4,
    rankTitle: 'Active IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 78,
    reportsThisMonth: 3,
    rating: 4.7,
    totalRatings: 15,
  },
  {
    id: 5,
    name: 'Ana Garcia',
    username: 'AnaG',
    course: 'BS Business Administration',
    program: 'BS Business Administration',
    completedTransactions: 15,
    rank: 5,
    rankTitle: 'Trainee IskoMember',
    avatar: '',
    isActive: false,
    creditScore: 55,
    reportsThisMonth: 4,
    rating: 4.5,
    totalRatings: 10,
  }
];

const defaultTopSellers: TopMember[] = [
  {
    id: 6,
    name: 'Carlos Reyes',
    username: 'CarlosR',
    course: 'BS Accountancy',
    program: 'BS Accountancy',
    completedTransactions: 52,
    rank: 1,
    rankTitle: 'Elite IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 97,
    reportsThisMonth: 0,
    rating: 5.0,
    totalRatings: 26,
    products: [
      {
        id: 301,
        title: 'Complete Art Supply Set',
        description: 'Unused art supplies, perfect for students',
        price: 2500,
        category: 'School Supplies',
        images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'],
        condition: 'Brand New',
        location: 'Main Campus',
        datePosted: '2024-01-15',
        views: 45,
        interested: 8
      },
      {
        id: 302,
        title: 'Scientific Calculator',
        description: 'Casio fx-991EX, barely used',
        price: 800,
        category: 'Electronics',
        images: ['https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400'],
        condition: 'Like New',
        location: 'Engineering Building',
        datePosted: '2024-01-14',
        views: 32,
        interested: 5
      }
    ]
  },
  {
    id: 7,
    name: 'Sofia Martinez',
    username: 'SofiaM',
    course: 'BS Psychology',
    program: 'BS Psychology',
    completedTransactions: 41,
    rank: 2,
    rankTitle: 'Trusted IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 92,
    reportsThisMonth: 0,
    rating: 4.9,
    totalRatings: 19,
    products: [
      {
        id: 303,
        title: 'Psychology Textbook Bundle',
        description: 'Psychology 101-103 books, excellent condition',
        price: 1500,
        category: 'Books',
        images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'],
        condition: 'Good',
        location: 'Library',
        datePosted: '2024-01-13',
        views: 28,
        interested: 6
      },
      {
        id: 304,
        title: 'Study Lamp - LED',
        description: 'Energy-efficient LED study lamp',
        price: 650,
        category: 'Electronics',
        images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400'],
        condition: 'Like New',
        location: 'Dormitory',
        datePosted: '2024-01-12',
        views: 20,
        interested: 4
      }
    ]
  },
  {
    id: 8,
    name: 'Miguel Torres',
    username: 'MiguelT',
    course: 'BS Architecture',
    program: 'BS Architecture',
    completedTransactions: 35,
    rank: 3,
    rankTitle: 'Reliable IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 88,
    reportsThisMonth: 1,
    rating: 4.8,
    totalRatings: 17,
    products: [
      {
        id: 305,
        title: 'Professional Drawing Tools',
        description: 'Complete drafting and drawing tools set',
        price: 1200,
        category: 'School Supplies',
        images: ['https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400'],
        condition: 'Like New',
        location: 'Architecture Building',
        datePosted: '2024-01-12',
        views: 24,
        interested: 4
      },
      {
        id: 306,
        title: 'Blueprint Holder',
        description: 'Large blueprint/poster holder tube',
        price: 400,
        category: 'School Supplies',
        images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400'],
        condition: 'Good',
        location: 'Architecture Building',
        datePosted: '2024-01-11',
        views: 15,
        interested: 2
      }
    ]
  },
  {
    id: 9,
    name: 'Lisa Chen',
    username: 'LisaC',
    course: 'BS Biology',
    program: 'BS Biology',
    completedTransactions: 28,
    rank: 4,
    rankTitle: 'Active IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 81,
    reportsThisMonth: 2,
    rating: 4.7,
    totalRatings: 14,
    products: [
      {
        id: 307,
        title: 'Lab Coat - Size M',
        description: 'White lab coat, gently used',
        price: 350,
        category: 'Clothing',
        images: ['https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400'],
        condition: 'Good',
        location: 'Science Building',
        datePosted: '2024-01-11',
        views: 18,
        interested: 3
      },
      {
        id: 308,
        title: 'Microscope Slides Pack',
        description: 'Pack of 50 microscope slides',
        price: 200,
        category: 'Lab Equipment',
        images: ['https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400'],
        condition: 'Brand New',
        location: 'Science Building',
        datePosted: '2024-01-10',
        views: 12,
        interested: 2
      }
    ]
  },
  {
    id: 10,
    name: 'David Kim',
    username: 'DavidK',
    course: 'BS Nursing',
    program: 'BS Nursing',
    completedTransactions: 22,
    rank: 5,
    rankTitle: 'Active IskoMember',
    avatar: '',
    isActive: true,
    creditScore: 75,
    reportsThisMonth: 1,
    rating: 4.6,
    totalRatings: 12,
    products: [
      {
        id: 309,
        title: 'Nursing Kit Essentials',
        description: 'Complete nursing kit for clinical use',
        price: 950,
        category: 'Medical Supplies',
        images: ['https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400'],
        condition: 'Brand New',
        location: 'Nursing Building',
        datePosted: '2024-01-10',
        views: 21,
        interested: 5
      },
      {
        id: 310,
        title: 'Stethoscope',
        description: 'Professional stethoscope, barely used',
        price: 1200,
        category: 'Medical Supplies',
        images: ['https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400'],
        condition: 'Like New',
        location: 'Nursing Building',
        datePosted: '2024-01-09',
        views: 30,
        interested: 7
      }
    ]
  },
];

export function TopFiveMembersSection(_: TopFiveMembersSectionProps) {
  // Leaderboard removed and archived on 2025-12-20. This stub keeps imports stable across the app.
  return null;
}

export default TopFiveMembersSection




      