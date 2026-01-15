import React, { useState } from 'react';
import { User, Mail, Save, X, Upload, Camera, CheckCircle, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { UserAvatarWithHighlight } from './UserAvatarWithHighlight';
import { Badge } from './ui/badge';

interface ProfileSettingsProps {
  currentUser: any;
  onUpdateProfile: (updatedUser: any) => void;
  onClose: () => void;
}

export function ProfileSettings({ currentUser, onUpdateProfile, onClose }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    username: currentUser?.username || currentUser?.name || '',
    email: currentUser?.email || '',
    program: currentUser?.program || '',
    bio: currentUser?.bio || '',
    avatar: currentUser?.avatar || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const updatedUser = {
      ...currentUser,
      ...formData,
      name: formData.username.trim()
    };
    onUpdateProfile(updatedUser);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server
      // For demo purposes, we'll use a URL object
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        avatar: imageUrl
      }));
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-standard bg-[var(--card)] dark:bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header Section - Compact and clean */}
        <div className="px-8 pt-6 pb-4 border-b border-[#cfe8ce] dark:border-[#14b8a6]/20">
          <h2 className="text-[24px] font-bold text-[#006400] dark:text-[#4ade80] mb-1">
            Profile Settings
          </h2>
          <p className="text-[14px] text-[#006400]/60 dark:text-[#4ade80]/60">
            Manage your personal information and account preferences.
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cfe8ce transparent'
        }}>
          {/* Profile Info Card - Horizontal Layout */}
          <div 
            className="bg-[var(--card)] dark:bg-[var(--card)] dark:backdrop-blur-sm border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[20px] p-6 shadow-lg dark:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
            style={{
              boxShadow: '0 4px 16px rgba(0, 100, 0, 0.08)'
            }}
          >
            <div className="flex items-center gap-6">
              {/* Avatar on Left */}
              <div className="relative flex-shrink-0">
                <UserAvatarWithHighlight
                  user={{
                    name: formData.username || currentUser?.name || 'User',
                    username: currentUser?.username || 'user',
                    avatar: formData.avatar,
                    creditScore: currentUser?.creditScore || 70,
                    rank: currentUser?.rank,
                    role: currentUser?.role || 'buyer',
                    glowEffect: currentUser?.glowEffect
                  }}
                  size="xl"
                  showRankTag={true}
                  showTooltip={false}
                />
                {/* Change Photo Button Overlay */}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-white rounded-full p-2 cursor-pointer hover:scale-110 transition-all shadow-lg z-10"
                  title="Change photo"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name and Email Stacked on Right */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[20px] font-semibold text-[#006400] dark:text-[#4ade80] mb-2">
                  {currentUser?.name || 'User'}
                </h3>
                <p className="text-[13px] text-[#006400]/60 dark:text-[#4ade80]/60">
                  {currentUser?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Information Section */}
          <div className="space-y-6">
            <h4 className="text-[16px] font-semibold text-[#006400] dark:text-[#4ade80]">
              Edit Information
            </h4>

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 10);
                    handleInputChange('username', value);
                  }}
                  placeholder="Enter your username"
                  maxLength={10}
                  className="h-12 pr-14 bg-white dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#006400]/60 dark:text-[#4ade80]/60 pointer-events-none">
                  {formData.username.length}/10
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your CvSU email"
                className="h-12 bg-white dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40 transition-all"
              />
            </div>

            {/* Program/Course Field */}
            <div className="space-y-2">
              <Label htmlFor="program" className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                Program/Course
              </Label>
              <Input
                id="program"
                value={formData.program}
                onChange={(e) => handleInputChange('program', e.target.value)}
                placeholder="e.g., BS Computer Science"
                className="h-12 bg-white dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40 transition-all"
              />
            </div>

            {/* Bio Field */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                Bio (Optional)
              </Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Share something about yourself that other users should know…"
                className="h-12 bg-white dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40 transition-all"
              />
            </div>
          </div>

          {/* Dividing Line */}
          <div className="border-t-2 border-[#cfe8ce] dark:border-[#14b8a6]/20"></div>

          {/* Account Information Section - Two Column Grid */}
          <div className="space-y-4">
            <h4 className="text-[16px] font-semibold text-[#006400] dark:text-[#4ade80] mb-6">
              Account Information
            </h4>
            
            {/* Two-Column Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Type */}
              <div className="flex items-start justify-between">
                <div className="flex-shrink-0 w-32">
                  <Label className="text-[13px] text-[#006400]/60 dark:text-[#4ade80]/60">
                    Account Type
                  </Label>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                    {currentUser?.isAdmin ? 'Administrator' : 'Student'}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-start justify-between">
                <div className="flex-shrink-0 w-32">
                  <Label className="text-[13px] text-[#006400]/60 dark:text-[#4ade80]/60">
                    Member Since
                  </Label>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                    {currentUser?.dateRegistered 
                      ? new Date(currentUser.dateRegistered).toLocaleDateString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Action Bar */}
        <div className="px-8 py-4 border-t-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 bg-[var(--card)] dark:bg-[var(--card)] dark:backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {/* Cancel Button - Left */}
            <Button 
              onClick={onClose}
              variant="outline"
              className="h-11 px-6 rounded-[12px] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 text-[#006400] dark:text-[#4ade80] hover:bg-[#006400]/5 dark:hover:bg-[#14b8a6]/10 transition-all"
            >
              Cancel
            </Button>

            {/* Save Changes Button - Right */}
            <Button 
              onClick={handleSave}
              className="h-11 px-6 rounded-[12px] bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-white hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cfe8ce;
          border-radius: 3px;
        }
        .dark .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(20, 184, 166, 0.3);
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #006400;
        }
        .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(20, 184, 166, 0.5);
        }
      `}</style>
    </div>
  );
}
