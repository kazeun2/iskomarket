import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { PriorityBadge, isTopFiveBuyer } from './PriorityBadge';

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: number;
    name: string;
    avatar?: string;
    isPriorityBuyer?: boolean;
  };
}

export function ConversationModal({ isOpen, onClose, contact }: ConversationModalProps) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! Is the textbook still available?",
      sender: 'them',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      text: "Yes, it's still available! Are you interested?",
      sender: 'me',
      timestamp: '1 hour ago'
    },
    {
      id: 3,
      text: "Great! What's the condition like? Any highlighting or notes?",
      sender: 'them',
      timestamp: '45 minutes ago'
    },
    {
      id: 4,
      text: "It's in excellent condition. No highlighting at all, just a few pencil notes that can be erased.",
      sender: 'me',
      timestamp: '30 minutes ago'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'me',
      timestamp: ''
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isPriorityBuyer = contact.isPriorityBuyer ?? isTopFiveBuyer(contact.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard w-full max-w-[720px] max-h-[90vh] flex flex-col p-0 rounded-2xl shadow-elev-3 gap-0 overflow-hidden">
        {/* Header - Fixed */}
        <DialogHeader 
          className={`px-4 py-4 border-b flex-shrink-0 ${
            isPriorityBuyer 
              ? 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800' 
              : 'bg-background border-border'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Avatar className={`h-10 w-10 ${isPriorityBuyer ? 'ring-2 ring-orange-400' : ''}`}>
              <AvatarFallback className={isPriorityBuyer ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100' : 'bg-accent/20 text-accent-foreground'}>
                {contact.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base truncate">{contact.name}</DialogTitle>
                {isPriorityBuyer && (
                  <PriorityBadge size="sm" variant="compact" showIcon={true} />
                )}
              </div>
              <DialogDescription className="text-sm text-muted-foreground truncate">
                {isPriorityBuyer ? '⚡ Priority buyer - faster response expected' : 'Active now'}
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="modal-close-button-standard"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-0">
          <div className="space-y-3 max-w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`px-4 py-2.5 ${
                    message.sender === 'me'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  style={{
                    maxWidth: '70%',
                    borderRadius: '20px',
                    borderBottomRightRadius: message.sender === 'me' ? '4px' : '20px',
                    borderBottomLeftRadius: message.sender === 'me' ? '20px' : '4px'
                  }}
                >
                  <p 
                    className="text-sm whitespace-pre-wrap leading-relaxed break-words"
                    style={{
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {message.text}
                  </p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'me' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground/70'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Fixed at Bottom */}
        <div className="px-4 py-4 border-t border-border flex-shrink-0 bg-background">
          <div className="flex gap-3">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-10"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}