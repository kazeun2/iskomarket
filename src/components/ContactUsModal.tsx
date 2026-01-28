import React from "react";
import { X, Mail, Facebook, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface AdminContact {
  name: string;
  email: string;
  facebook: string;
}

const adminContacts: AdminContact[] = [
  {
    name: "Maria Kazandra Bendo",
    email: "mariakazandra.bendo@cvsu.edu.ph",
    facebook: "facebook.com/kzndrx",
  },
];

export function ContactUsModal({
  isOpen,
  onClose,
  isDarkMode = false,
}: ContactUsModalProps) {
  const handleCopyEmail = (email: string, name: string) => {
    // Fallback copy method that works without Clipboard API
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(() => {
          toast.success("Email copied to clipboard!", {
            description: `${name}'s email has been copied.`,
          });
        }).catch(() => {
          // If Clipboard API fails, use fallback
          fallbackCopy(email, name);
        });
      } else {
        // Use fallback method
        fallbackCopy(email, name);
      }
    } catch (err) {
      fallbackCopy(email, name);
    }
  };

  const fallbackCopy = (email: string, name: string) => {
    // Create temporary textarea
    const textArea = document.createElement("textarea");
    textArea.value = email;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast.success("Email copied to clipboard!", {
        description: `${name}'s email has been copied.`,
      });
    } catch (err) {
      toast.error("Failed to copy email", {
        description: "Please copy the email manually.",
      });
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`
          sm:max-w-[420px] 
          max-h-[85vh]
          rounded-2xl
          ${
            isDarkMode
              ? "bg-gradient-to-br from-[#003726] to-[#021223] border-[#14b8a6]/20"
              : "bg-white border-[#cfe8ce]"
          }
          border-2
          ${
            isDarkMode
              ? "shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2),0_8px_32px_rgba(0,55,38,0.4)]"
              : "shadow-[0_8px_32px_rgba(0,100,0,0.08),0_2px_8px_rgba(0,100,0,0.04)]"
          }
          overflow-hidden
        `}
      >
        {/* Noise Overlay - Dark Mode Only */}
        {isDarkMode && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* Ambient glow - Dark Mode Only */}
        {isDarkMode && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        )}

        {/* Header - Fixed with X Button */}
        <DialogHeader className="relative pb-4">
          <DialogDescription className="sr-only">
            Contact the admin team for assistance, questions, or
            to report an issue
          </DialogDescription>
          <DialogTitle
            className={`
              text-2xl
              ${isDarkMode ? "text-[#4ade80]" : "text-[#006400]"}
            `}
          >
            Contact Us
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="relative space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] pr-2 custom-scrollbar">
          {/* Intro Text */}
          <p
            className={`
              text-sm leading-relaxed
              ${isDarkMode ? "text-[#C7EAC3]/90" : "text-[#004d1a]/80"}
            `}
          >
            Reach out to our admin team if you need assistance,
            have questions, or want to report an issue.
          </p>

          {/* Admin Contact Cards */}
          <div className="space-y-3 pt-2">
            {adminContacts.map((admin, index) => (
              <div
                key={index}
                className={`
                  relative
                  rounded-xl p-4
                  border
                  transition-all duration-200
                  ${
                    isDarkMode
                      ? "bg-gradient-to-br from-[#0a2f1f]/40 to-[#0c3a25]/40 border-[#14b8a6]/20 hover:border-[#14b8a6]/40 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                      : "bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]/50 border-[#cfe8ce] hover:border-[#4CAF50]/40 hover:shadow-[0_4px_16px_rgba(76,175,80,0.12)]"
                  }
                `}
              >
                <div className="flex items-start">
                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name */}
                    <h3
                      className={`
                        ${isDarkMode ? "text-[#4ade80]" : "text-[#1B5E20]"}
                      `}
                    >
                      {admin.name}
                    </h3>

                    {/* Email */}
                    <div className="flex items-start gap-2">
                      <Mail
                        className={`
                          h-4 w-4 flex-shrink-0 mt-0.5
                          ${isDarkMode ? "text-[#14b8a6]/70" : "text-[#4CAF50]/70"}
                        `}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`
                            text-xs break-all
                            ${isDarkMode ? "text-[#C7EAC3]/80" : "text-[#004d1a]/70"}
                          `}
                        >
                          {admin.email}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleCopyEmail(
                            admin.email,
                            admin.name,
                          )
                        }
                        className={`
                          p-1.5 rounded-lg
                          transition-all duration-200
                          ${
                            isDarkMode
                              ? "hover:bg-[#14b8a6]/10 text-[#14b8a6]/70 hover:text-[#14b8a6]"
                              : "hover:bg-[#4CAF50]/10 text-[#4CAF50]/70 hover:text-[#4CAF50]"
                          }
                        `}
                        title="Copy email"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Facebook */}
                    <div className="flex items-start gap-2">
                      <Facebook
                        className={`
                          h-4 w-4 flex-shrink-0 mt-0.5
                          ${isDarkMode ? "text-[#14b8a6]/70" : "text-[#4CAF50]/70"}
                        `}
                      />
                      <a
                        href={`https://${admin.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                          text-xs break-all
                          transition-colors duration-200
                          ${
                            isDarkMode
                              ? "text-[#14b8a6]/80 hover:text-[#14b8a6]"
                              : "text-[#4CAF50]/80 hover:text-[#4CAF50]"
                          }
                          hover:underline
                        `}
                      >
                        {admin.facebook}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div
            className={`
              mt-4 p-3 rounded-lg
              ${
                isDarkMode
                  ? "bg-[#14b8a6]/5 border border-[#14b8a6]/10"
                  : "bg-[#E8F5E9] border border-[#4CAF50]/20"
              }
            `}
          >
            <p
              className={`
                text-xs leading-relaxed
                ${isDarkMode ? "text-[#C7EAC3]/70" : "text-[#004d1a]/60"}
              `}
            >
              <strong
                className={
                  isDarkMode
                    ? "text-[#4ade80]"
                    : "text-[#1B5E20]"
                }
              >
                Note:
              </strong>{" "}
              For urgent matters, please contact us via email.
              We typically respond within 24-48 hours.
            </p>
          </div>

          {/* Close Button */}
          <div className="pt-2">
            <Button
              onClick={onClose}
              className={`
                w-full h-10 rounded-xl
                transition-all duration-200
                ${
                  isDarkMode
                    ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#0f766e] text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]"
                    : "bg-gradient-to-r from-[#4CAF50] to-[#45a049] hover:from-[#45a049] hover:to-[#3d8b40] text-white shadow-[0_4px_12px_rgba(76,175,80,0.25)] hover:shadow-[0_6px_16px_rgba(76,175,80,0.35)]"
                }
              `}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}