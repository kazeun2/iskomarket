import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Shield, User } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';
import { isExampleMode } from '../utils/exampleMode';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  isDarkMode?: boolean;
}

// Mock feedback data from all users
const mockAllUserFeedback = [
  {
    id: 1,
    type: 'bug',
    message: 'The search function sometimes returns incorrect results when searching for textbooks. It shows electronics instead.',
    user: {
      name: 'Maria Bendo',
      email: 'maria.bendo@cvsu.edu.ph',
      id: 1
    },
    timestamp: '2024-12-30T14:30:00Z',
    status: 'pending'
  },
  {
    id: 2,
    type: 'feature',
    message: 'It would be great to have a saved items feature so we can bookmark products we\'re interested in buying later.',
    user: {
      name: 'Pauleen Kim Angon',
      email: 'pauleen.angon@cvsu.edu.ph',
      id: 2
    },
    timestamp: '2024-12-29T10:15:00Z',
    status: 'pending'
  },
  {
    id: 3,
    type: 'usability',
    message: 'The dark mode is really nice! But could the contrast be a bit higher on some buttons? They\'re hard to see sometimes.',
    user: {
      name: 'Hazel Anne Perez',
      email: 'hazel.perez@cvsu.edu.ph',
      id: 3
    },
    timestamp: '2024-12-28T16:45:00Z',
    status: 'reviewed'
  },
  {
    id: 4,
    type: 'performance',
    message: 'The marketplace page loads slowly when there are many products displayed. Can this be optimized?',
    user: {
      name: 'John Santos',
      email: 'john.santos@cvsu.edu.ph',
      id: 4
    },
    timestamp: '2024-12-27T09:20:00Z',
    status: 'pending'
  },
  {
    id: 5,
    type: 'security',
    message: 'Is my personal information secure when I post products? I\'m concerned about privacy.',
    user: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@cvsu.edu.ph',
      id: 5
    },
    timestamp: '2024-12-26T11:30:00Z',
    status: 'reviewed'
  },
  {
    id: 6,
    type: 'general',
    message: 'Love the For a Cause section! This is such a great way to help fellow students. Keep up the good work!',
    user: {
      name: 'Mark Cruz',
      email: 'mark.cruz@cvsu.edu.ph',
      id: 6
    },
    timestamp: '2024-12-25T15:10:00Z',
    status: 'reviewed'
  },
  {
    id: 7,
    type: 'bug',
    message: 'When I try to edit my profile, the changes don\'t save properly. I have to refresh and try multiple times.',
    user: {
      name: 'Jane Mendoza',
      email: 'jane.mendoza@cvsu.edu.ph',
      id: 7
    },
    timestamp: '2024-12-24T13:45:00Z',
    status: 'pending'
  },
  {
    id: 8,
    type: 'feature',
    message: 'Can we have a rating system for buyers too? Not just sellers. This would help ensure trustworthy transactions.',
    user: {
      name: 'Alex Rivera',
      email: 'alex.rivera@cvsu.edu.ph',
      id: 8
    },
    timestamp: '2024-12-23T08:25:00Z',
    status: 'reviewed'
  }
];

export function FeedbackModal({ isOpen, onClose, currentUser, isDarkMode = false }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  
  const isAdmin = currentUser?.isAdmin;

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', description: 'Report technical issues or website errors' },
    { value: 'feature', label: 'Feature Request', description: 'Suggest new features or improvements for IskoMarket' },
    { value: 'usability', label: 'User Experience', description: 'Share feedback about website design and usability' },
    { value: 'performance', label: 'Performance Issue', description: 'Report slow loading or website performance problems' },
    { value: 'security', label: 'Security Concern', description: 'Report website security or privacy concerns' },
    { value: 'general', label: 'General Feedback', description: 'Share your overall thoughts about IskoMarket' },
    { value: 'other', label: 'Other', description: 'Website-related feedback not covered above' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackType || !message.trim()) {
      toast.error('Please select a feedback type and enter your message.');
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, this would send to your backend/admin system
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock feedback submission
      const feedbackData = {
        category: feedbackType,
        subject: 'Website Feedback',
        description: message.trim(),
        user: {
          name: currentUser?.name,
          email: currentUser?.email,
          id: currentUser?.id
        },
        timestamp: new Date().toISOString(),
        status: 'submitted'
      };
      
      // In production: API.submitFeedback(feedbackData)
      
      toast.success('Thank you! Your feedback has been sent to the admin team.', {
        description: 'We appreciate your input and will review it shortly.'
      });

      // Reset form
      setFeedbackType('');
      setMessage('');
      onClose();

    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResponse = async (feedbackId: number) => {
    if (!responseMessage.trim()) {
      toast.error('Please enter a response message');
      return;
    }

    setIsSendingResponse(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would send the response to the backend
      const feedback = mockAllUserFeedback.find(f => f.id === feedbackId);
      
      toast.success('Response sent successfully!', {
        description: `Your response has been sent to ${feedback?.user.name}`
      });
      
      setRespondingTo(null);
      setResponseMessage('');
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setIsSendingResponse(false);
    }
  };

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter feedback based on example mode
  const availableFeedback = isExampleMode(currentUser) ? mockAllUserFeedback : [];
  
  const filteredFeedback = availableFeedback.filter(fb => {
    if (filterStatus === 'all') return true;
    return fb.status === filterStatus;
  });

  const getFeedbackTypeLabel = (type: string) => {
    return feedbackTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-standard bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] rounded-[24px] max-w-3xl w-full max-h-[90vh] overflow-hidden border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 shadow-2xl dark:shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2)] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Section - Two Rows */}
        <div className="px-8 pt-6 pb-4 border-b border-[#cfe8ce] dark:border-[#14b8a6]/20 flex-shrink-0">
          {/* Top Row - Title and X Button */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[24px] font-bold text-[#006400] dark:text-[#4ade80] flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              {isAdmin ? 'All User Feedback' : 'Send Feedback'}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#006400]/10 dark:hover:bg-[#14b8a6]/10 transition-all text-[#006400] dark:text-[#4ade80]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom Row - Filter and Badge */}
          {isAdmin ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-[13px] font-medium text-[#006400] dark:text-[#4ade80]">
                  Filter:
                </label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-[180px] h-9 rounded-full bg-[var(--card)] dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 text-[#006400] dark:text-[#4ade80] hover:border-[#006400] dark:hover:border-[#14b8a6] transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({availableFeedback.length})</SelectItem>
                    <SelectItem value="pending">Pending ({availableFeedback.filter(f => f.status === 'pending').length})</SelectItem>
                    <SelectItem value="reviewed">Reviewed ({availableFeedback.filter(f => f.status === 'reviewed').length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 text-foreground border-0 text-[11px] px-3 py-1">
                <Shield className="h-3 w-3 mr-1" />
                Admin View
              </Badge>
            </div>
          ) : (
            <p className="text-[14px] text-[#006400]/60 dark:text-[#4ade80]/60">
              Help us improve IskoMarket by sharing your thoughts about the website, reporting technical issues, or suggesting new features.
            </p>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="flex-1 overflow-y-auto px-8 py-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cfe8ce transparent'
          }}
        >
          {isAdmin ? (
            /* Admin View - All User Feedback */
            <div className="space-y-6">
              {filteredFeedback.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-[#006400]/20 dark:text-[#4ade80]/20" />
                  <p className="text-[#006400]/60 dark:text-[#4ade80]/60">No feedback found</p>
                </div>
              ) : (
                filteredFeedback.map((feedback) => (
                  <div 
                    key={feedback.id}
                    className="bg-[var(--card)] dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 rounded-[20px] p-6 shadow-lg dark:shadow-[0_0_20px_rgba(20,184,166,0.15)] hover:shadow-xl transition-all"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 100, 0, 0.08)'
                    }}
                  >
                    {/* User Info and Tags Row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      {/* Left - User Info */}
                      <div>
                        <h3 className="text-[16px] font-semibold text-[#006400] dark:text-[#4ade80] mb-1">
                          {feedback.user.name}
                        </h3>
                        <p className="text-[13px] text-[#006400]/60 dark:text-[#4ade80]/60">
                          {feedback.user.email}
                        </p>
                      </div>

                      {/* Right - Tags in Single Row */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          className="bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-foreground border-0 text-[11px] px-2 py-1"
                        >
                          {getFeedbackTypeLabel(feedback.type)}
                        </Badge>
                        <Badge 
                          className={
                            feedback.status === 'pending'
                              ? 'bg-amber-500 dark:bg-amber-400 text-foreground border-0 text-[11px] px-2 py-1'
                              : 'bg-emerald-500 dark:bg-emerald-400 text-foreground border-0 text-[11px] px-2 py-1'
                          }
                        >
                          {feedback.status === 'pending' ? '🔔 Pending' : '✓ Reviewed'}
                        </Badge>
                      </div>
                    </div>

                    {/* Message Box - Chat-like Card */}
                    <div className="bg-[var(--card)] dark:bg-[var(--card)] rounded-[16px] p-4 mb-3 border border-[#cfe8ce] dark:border-[#14b8a6]/10">
                      <p className="text-[14px] text-[#006400] dark:text-[#4ade80] leading-relaxed">
                        {feedback.message}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <p className="text-[12px] text-[#006400]/50 dark:text-[#4ade80]/50 mb-4 text-right">
                      {new Date(feedback.timestamp).toLocaleDateString()} at{' '}
                      {new Date(feedback.timestamp).toLocaleTimeString()}
                    </p>

                    {/* Response Section */}
                    {respondingTo === feedback.id ? (
                      <div className="mt-4 space-y-3 pt-4 border-t-2 border-[#cfe8ce] dark:border-[#14b8a6]/20">
                        <label className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                          Admin Response:
                        </label>
                        <Textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder={`Write your response to ${feedback.user.name}...`}
                          className="min-h-[100px] resize-none bg-[var(--card)] dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80]"
                          maxLength={500}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSendResponse(feedback.id)}
                            disabled={isSendingResponse || !responseMessage.trim()}
                            className="flex-1 h-10 rounded-[12px] bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-foreground hover:scale-105 transition-all"
                          >
                            {isSendingResponse ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-2" />
                                Send Response
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseMessage('');
                            }}
                            className="h-10 rounded-[12px] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 text-[#006400] dark:text-[#4ade80] hover:bg-[#006400]/5 dark:hover:bg-[#14b8a6]/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRespondingTo(feedback.id)}
                        className="w-full h-10 rounded-[12px] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 text-[#006400] dark:text-[#4ade80] hover:bg-[#006400]/5 dark:hover:bg-[#14b8a6]/10 transition-all"
                      >
                        <MessageSquare className="h-3 w-3 mr-2" />
                        Respond to Feedback
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Student View - Feedback Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type Selection */}
              <div className="space-y-3">
                <label className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                  What type of website feedback do you have?
                </label>
                <Select value={feedbackType} onValueChange={setFeedbackType}>
                  <SelectTrigger className="h-12 bg-[var(--card)] dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80]">
                    <SelectValue placeholder="Select feedback type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {feedbackTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected feedback type info */}
              {feedbackType && (
                <div className="bg-[var(--card)] dark:bg-[var(--card)] rounded-[16px] p-4 border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20">
                  <Badge className="bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-foreground border-0 mb-2">
                    {feedbackTypes.find(t => t.value === feedbackType)?.label}
                  </Badge>
                  <p className="text-[13px] text-[#006400]/70 dark:text-[#4ade80]/70">
                    {feedbackTypes.find(t => t.value === feedbackType)?.description}
                  </p>
                </div>
              )}

              {/* Message */}
              <div className="space-y-3">
                <label className="text-[14px] font-medium text-[#006400] dark:text-[#4ade80]">
                  Your message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide detailed information about your website feedback (e.g., what page you were on, what happened, what you expected to happen)..."
                  className="min-h-[140px] resize-none bg-[var(--card)] dark:bg-[var(--card)] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 focus:border-[#006400] dark:focus:border-[#14b8a6] rounded-[12px] text-[#006400] dark:text-[#4ade80] placeholder:text-[#006400]/40 dark:placeholder:text-[#4ade80]/40"
                  maxLength={1000}
                />
                <div className="flex justify-between text-[12px] text-[#006400]/60 dark:text-[#4ade80]/60">
                  <span>Be specific about website issues to help us improve IskoMarket</span>
                  <span>{message.length}/1000</span>
                </div>
              </div>

              {/* User Info Display */}
              <div className="bg-[var(--card)] dark:bg-[var(--card)] rounded-[16px] p-4 border border-[#cfe8ce] dark:border-[#14b8a6]/10">
                <div className="text-[13px] text-[#006400]/70 dark:text-[#4ade80]/70">
                  Submitted by: <span className="font-medium text-[#006400] dark:text-[#4ade80]">{currentUser?.name}</span> 
                  {' '}({currentUser?.email})
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 h-11 rounded-[12px] border-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 text-[#006400] dark:text-[#4ade80] hover:bg-[#006400]/5 dark:hover:bg-[#14b8a6]/10 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!feedbackType || !message.trim() || isSubmitting}
                  className="flex-1 h-11 rounded-[12px] bg-gradient-to-r from-[#006400] to-[#228b22] dark:from-[#14b8a6] dark:to-[#0d9488] text-foreground hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Send Feedback</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Additional Info */}
              <div className="border-t-2 border-[#cfe8ce] dark:border-[#14b8a6]/20 pt-4">
                <div className="text-[12px] text-[#006400]/60 dark:text-[#4ade80]/60 space-y-1">
                  <p>• Your website feedback helps us make IskoMarket better for all students</p>
                  <p>• We typically respond to website feedback within 2-3 business days</p>
                </div>
              </div>
            </form>
          )}
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
