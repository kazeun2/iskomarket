// Stable auth flow. Do not change without updating tests.
import { getSupabase } from '@/lib/supabaseClient'
import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GraduationCap,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import iskoMarketLogo from "figma:asset/3b968d3684aca43d11e97d92782eb8bb2dea6d18.png";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ThemeToggle } from "./ThemeToggle";
import { VerifyEmail } from "./VerifyEmail";
import { OtpVerifyModal } from './OtpVerifyModal'
import { NewPasswordModal } from './NewPasswordModal'

// Note: example/demo accounts removed — using Supabase auth and DB only

interface AuthPageProps {
  onAuthenticated: (userData: any) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function AuthPage({
  onAuthenticated,
  isDarkMode,
  onToggleTheme,
}: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] =
    useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] =
    useState(1); // 1: email, 2: code, 3: new password
  const [registrationStep, setRegistrationStep] = useState(1); // 1: form, 2: verification, 3: success
  // Control the Verify modal (floating) — prefer modal over inline card
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null); // { email, username, password }

  // Login attempt tracking
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isLoginLocked, setIsLoginLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Forgot password form state
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>(
    {},
  );
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);
  const [sentCode, setSentCode] = useState(""); // Store the generated code for verification (password reset demo)

  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false);
  const [isNewPasswordOpen, setIsNewPasswordOpen] = useState(false);
  const [pendingResetOtp, setPendingResetOtp] = useState<string | null>(null);
  // Email used for the current reset flow (captured at Send Code time to avoid races/edits after sending)
  const [resetFlowEmail, setResetFlowEmail] = useState<string>('')

  // Admin email list
  const ADMIN_EMAILS = [
    "mariakazandra.bendo@cvsu.edu.ph",
  ];

  // Lockout timer effect
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => {
        setLockoutTimer(lockoutTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (lockoutTimer === 0 && isLoginLocked) {
      setIsLoginLocked(false);
      setLoginAttempts(0);
    }
  }, [lockoutTimer, isLoginLocked]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateCvsuEmail = (email: string) => {
    const cvsuDomains = ["@cvsu.edu.ph"];
    return cvsuDomains.some((domain) =>
      email.toLowerCase().endsWith(domain),
    );
  };

  // Compute a simple username from a CvSU email address.
  // Rule: take local part (before @), then take the first dot-separated segment (e.g., example.admin -> example),
  // strip any non-alphanumeric/underscore chars and lowercase it.
  const computeUsernameFromEmail = (email: string | undefined | null) => {
    if (!email) return '';
    const local = String(email).split('@')[0] || '';
    const firstSegment = local.split('.')[0] || local.split('_')[0] || local;
    const cleaned = firstSegment.replace(/[^a-zA-Z0-9_]/g, '');
    // No truncation - keep full derived username and lowercase it
    return cleaned.toLowerCase();
  }; 



  const validatePassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    );
  };

  const isAdminEmail = (email: string) => {
    return ADMIN_EMAILS.some(
      (adminEmail) =>
        adminEmail.toLowerCase() === email.toLowerCase(),
    );
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoginLocked) return;

    setIsLoading(true);
    setErrors({});

    try {
      const newErrors: Record<string, string> = {};

      if (!loginForm.email) {
        newErrors.email = "Email is required";
      } else if (!validateCvsuEmail(loginForm.email)) {
        newErrors.email =
          "Please use your CvSU email address (@cvsu.edu.ph)";
      }

      if (!loginForm.password) {
        newErrors.password = "Password is required";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      const supabase = getSupabase();

      // Attempt sign in with Supabase
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginForm.email,
          password: loginForm.password,
        });

        if (error) {
          // Debug: log full SDK error for investigation (dev-only)
          console.error('signInWithPassword error', error)
          if (import.meta.env.DEV) {
            try {
              const { data: currentUserData } = await supabase.auth.getUser()
              console.debug('supabase.auth.getUser after failed signIn', currentUserData)
              setLastAuthError(JSON.stringify({ sdkError: error, currentUser: currentUserData }, null, 2))
            } catch (e) {
              console.warn('Error calling supabase.auth.getUser after failed signIn', e)
            }
          } else {
            setLastAuthError(JSON.stringify(error, null, 2))
          }

          // Increment attempts
          setLoginAttempts((prev: number) => {
            const attempts = prev + 1;

            if (attempts >= 5) {
              setIsLoginLocked(true);
              setLockoutTimer(300); // 5 minutes
            }

            return attempts;
          });

          const emsg = error.message || '';
          const lower = emsg.toLowerCase();
          // Handle explicit 'email not confirmed' messages with a clear instruction
          if (lower.includes('email not confirmed') || lower.includes('email not verified') || lower.includes('not confirmed') || lower.includes('not verified')) {
            setErrors({ general: 'Please verify your CvSU email before signing in. Check your inbox for the verification message.' });
            setLastAuthError(JSON.stringify(error, null, 2));
            setIsLoading(false);
            return;
          }

          // Map common Supabase credential message to a friendly, short message
          if (emsg.toLowerCase().includes('invalid login credentials') || emsg.toLowerCase().includes('invalid email or password')) {
            setErrors({ general: 'Invalid email or password. Please try again.' });
            setIsLoading(false);
            return;
          }

          // If Supabase rejected credentials for another reason, check if a profile exists for the email to decide how to show an error
          try {
            const { data: existing } = await supabase.from('users').select('id').eq('email', loginForm.email).maybeSingle();
            if (existing) {
              setErrors({ general: 'Invalid email or password. Please try again.' });
            } else {
              setErrors({ password: emsg });
            }
          } catch (e) {
            // If lookup fails, fallback to raw message
            setErrors({ password: emsg });
          }

          setIsLoading(false);
          return;
        }

        // Successful login
        const user = data.user;
        if (!user) {
          setErrors({ general: 'Login failed. No user returned.' });
          setIsLoading(false);
          return;
        }

        // Try to fetch the user's profile row to include extra metadata
        let profile: any = null;
        try {
          const { data: profileData, error: profileFetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileFetchError) {
            console.warn('Failed to fetch user profile after login:', profileFetchError);
          } else {
            profile = profileData;
          }
        } catch (pfErr) {
          console.warn('Error fetching profile after login:', pfErr);
        }

        onAuthenticated({
          id: user.id,
          email: user.email,
          username: profile?.username || computeUsernameFromEmail(user.email),
          name: profile?.username || computeUsernameFromEmail(user.email),
          isAdmin: profile?.is_admin ?? isAdminEmail(user.email || ""),
          date_registered: profile?.created_at || user.created_at,
        });

        setLoginAttempts(0);
        setIsLoginLocked(false);
        setIsLoading(false);
        return;
      } catch (supabaseErr) {
        // No longer falling back to local/demo storage — Supabase should be available
        console.warn('Supabase login failed or not reachable', supabaseErr);
        setErrors({ general: 'Authentication service is unavailable. Please check your network or Supabase configuration.' });
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ general: "Unexpected error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setErrors({});

  try {
    // ======================
    // STEP 1: VALIDATION
    // ======================
    if (registrationStep === 1) {
      const newErrors: Record<string, string> = {};

      // Email must be a CvSU email
      if (!registerForm.email) {
        newErrors.email = "Email is required";
      } else if (!validateCvsuEmail(registerForm.email)) {
        newErrors.email =
          "Please use your CvSU email address (@cvsu.edu.ph)";
      } else if (isAdminEmail(registerForm.email)) {
        newErrors.email =
          "Admin accounts cannot register. Please log in directly.";
      }

      // Username will be derived from email automatically; ensure derivation yields a non-empty id
      const derivedUsername = computeUsernameFromEmail(registerForm.email);
      if (!derivedUsername) {
        newErrors.email = 'Unable to extract a username from the provided email address';
      }

      if (!registerForm.password) {
        newErrors.password = "Password is required";
      } else if (!validatePassword(registerForm.password)) {
        newErrors.password =
          "Password must be at least 8 characters with uppercase, lowercase, and number";
      }

      if (!registerForm.password) {
        newErrors.password = "Password is required";
      } else if (!validatePassword(registerForm.password)) {
        newErrors.password =
          "Password must be at least 8 characters with uppercase, lowercase, and number";
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      // Initiate registration (create auth user with password) and send verification via Supabase
      try {
        const { initiateRegistration } = await import('@/lib/auth')
        try {
          const derivedUsername = computeUsernameFromEmail(registerForm.email.trim());
          await initiateRegistration({
            email: registerForm.email.trim(),
            username: derivedUsername,
            password: registerForm.password,
          })

          // Clear any existing form-level errors
          setErrors({})

          // Open the floating verification modal (single verification UI) and keep pending user data for the modal
          const pending = { email: registerForm.email.trim(), username: derivedUsername, password: registerForm.password }
          setPendingUserData(pending)
          setIsVerifyModalOpen(true)

          toast.success('Verification email sent. Please check your inbox and enter the latest code in the verification modal.')
          setIsLoading(false)
          return
        } catch (authErr) {
          console.error('Signup (initiate) error:', authErr)
          const msg = authErr?.message || ''
          if ((msg && msg.toLowerCase().includes('already registered')) || msg.toLowerCase().includes('duplicate')) {
            setErrors({ general: 'An account with this email already exists. Please sign in or reset your password.' })
          } else if (msg && msg.toLowerCase().includes('rate')) {
            setErrors({ general: 'Too many requests. Please try again later.' })
          } else {
            setErrors({ general: msg || 'Unable to register. Please try again later.' })
          }
          setIsLoading(false)
          return
        }
      } catch (authErr: any) {
        console.error('Signup (initiate) error:', authErr)
        const msg = authErr?.message || ''
        if ((msg && msg.toLowerCase().includes('already registered')) || msg.toLowerCase().includes('duplicate')) {
          setErrors({ general: 'An account with this email already exists. Please sign in or reset your password.' })
        } else if (msg && msg.toLowerCase().includes('rate')) {
          setErrors({ general: 'Too many requests. Please try again later.' })
        } else {
          setErrors({ general: msg || 'Unable to send verification email. Please try again later.' })
        }
        setIsLoading(false)
        return;
      }

      // Legacy automatic sign-in and profile creation logic removed — OTP signup flow handles verification separately.
      // After sending OTP above we return early to show the verification screen.
    
    }

  } catch (err) {
    setErrors({
      general: "Registration failed. Please try again.",
    });
  } finally {
    setIsLoading(false);
  }
};


  const handleResendVerificationEmail = async () => {
    if (!pendingUserData?.email) {
      setErrors({ general: 'No pending registration to resend code for.' })
      return
    }

    if (resendCooldown > 0) return;

    setIsLoading(true)
    try {
      const { resendSignupOtp } = await import('@/lib/auth')
      await resendSignupOtp(pendingUserData.email, pendingUserData.username)
      setResendCooldown(30)
      toast.success('Verification code resent. Please check your email.')
    } catch (err: any) {
      console.error('Resend verification error:', err)
      setErrors({ general: err?.message || 'Failed to resend verification email.' })
    } finally {
      setIsLoading(false)
    }
  };

  const handleResendPasswordResetCode = async () => {
    if (resendCooldown > 0) return;

    if (!forgotPasswordForm.email) {
      setErrors({ general: 'Please enter an email address to resend the reset code.' });
      return;
    }

    setIsLoading(true);
    try {
      const email = (resetFlowEmail || forgotPasswordForm.email || '').trim()
      try { console.log('[RESET] resending OTP to', email) } catch (e) { /* no-op */ }
      const { sendPasswordResetOtp } = await import('@/lib/auth')
      await sendPasswordResetOtp(email)
      setResendCooldown(60);
      toast.success('Password reset code resent. Please check your inbox.')
    } catch (err: any) {
      console.error('Resend password reset error:', err);
      setErrors({ general: err?.message || 'Unable to resend password reset code. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Dev-only helper to inspect current Auth user and email confirmation status
  const debugAuthUser = async () => {
    try {
      const supabase = getSupabase();
      const { data: userData, error } = await supabase.auth.getUser();
      console.debug('debugAuthUser result', { userData, error });
      setLastAuthError(JSON.stringify({ userData, error }, null, 2));
      // If the SDK returns a user object, show its email_confirmed_at
      if (userData?.user) {
        toast.success(`email_confirmed_at: ${userData.user.email_confirmed_at || 'null'}`)
      } else {
        toast.error('No auth user found (no session).')
      }
    } catch (e) {
      console.error('debugAuthUser failed', e);
      toast.error('Debug failed: check console for details.');
    }
  };

  const handleProceedToLogin = () => {
    setRegistrationStep(1);
    setActiveTab("login");
    setLoginForm({ email: registerForm.email, password: "" });
    setRegisterForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setPendingUserData(null);
    setErrors({});
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      // Validate email
      if (!forgotPasswordForm.email) {
        setErrors({ email: 'Email is required' });
        setIsLoading(false);
        return;
      }

      if (!validateCvsuEmail(forgotPasswordForm.email)) {
        setErrors({ email: 'Please use your CvSU email address (@cvsu.edu.ph)' });
        setIsLoading(false);
        return;
      }

      const supabase = getSupabase();

      // Ensure the email exists in our users table
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', forgotPasswordForm.email)
        .single();

      if (profileErr || !profile) {
        // In test-stub mode allow proceeding even if a profile isn't present. This lets
        // E2E tests run without requiring a pre-existing test account in the DB.
        const runtimeStub = (typeof window !== 'undefined' && (window as any).__TEST_RESET_STUB__ === true)
        if (import.meta.env.VITE_TEST_RESET_STUB === 'true' || runtimeStub) {
          console.warn('TEST RESET STUB enabled — proceeding without a profile lookup match')
        } else {
          setErrors({ email: 'No account found with this email address' });
          setIsLoading(false);
          return;
        }
      }

      const email = forgotPasswordForm.email.trim()
      // Capture the current email used for this reset flow to avoid races if the user edits the input later
      setResetFlowEmail(email)

      // Debug: show the exact email we're about to send a reset code to (helpful for diagnosing stale/hard-coded addresses)
      try { console.log('[RESET] sending OTP to', email) } catch (e) { /* no-op */ }

      // If test stub mode is enabled (compile-time env OR runtime window flag), skip calling Supabase and open the OTP modal directly
      const runtimeStub = (typeof window !== 'undefined' && (window as any).__TEST_RESET_STUB__ === true)
      if (import.meta.env.VITE_TEST_RESET_STUB === 'true' || runtimeStub) {
        setForgotPasswordStep(2)
        setIsPasswordResetFlow(true)
        setIsVerifyModalOpen(true)
        setResendCooldown(60)
        toast.success('Verification code sent for password reset (stub). Please check your inbox and enter the code in the verification modal.')
      } else {
        // Use OTP-based recovery flow instead of link-based reset. Send recovery OTP via Supabase.
        const { sendPasswordResetOtp } = await import('@/lib/auth')
        await sendPasswordResetOtp(email)

        // Open the OTP modal for recovery and proceed to the 'enter code' step
        setForgotPasswordStep(2)
        setIsPasswordResetFlow(true)
        setIsVerifyModalOpen(true)
        setResendCooldown(60)
        toast.success('Verification code sent for password reset. Please check your inbox and enter the code in the verification modal.')
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      // Surface the actual message when present so developers/operators can see guidance
      setErrors({ general: error?.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotPasswordForm({
      email: "",
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setSentCode("");
    setErrors({});
  };

  return (
    <div className="min-h-screen h-screen relative flex flex-col overflow-y-auto auth-transition bg-neutral-50 dark:bg-neutral-900">
      {/* Premium Radial Gradient Background - Light & Dark Mode */}
      <div
        className="absolute inset-0"
        style={{
          background: isDarkMode
            ? `linear-gradient(135deg, #0c251b 0%, #092017 100%)`
            : `radial-gradient(circle at center, #E7F4EC 0%, #CDE7D7 100%)`,
        }}
      >
        {/* Film-Grain Texture (Dark Mode Only) */}
        {isDarkMode && (
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          />
        )}

        {/* Soft Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? `radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%)`
              : `radial-gradient(circle at center, transparent 50%, rgba(0, 100, 0, 0.03) 100%)`,
          }}
        />
      </div>

      {/* Top App Header with Theme Toggle */}
      <div 
        className="w-full relative z-20 flex justify-end"
        style={{
          height: "56px",
          paddingTop: "16px",
          paddingRight: "16px",
          paddingLeft: "0px",
        }}
      >
        <div className="opacity-80 hover:opacity-100 transition-opacity">
          <ThemeToggle
            isDark={isDarkMode}
            onToggle={onToggleTheme}
            size="sm"
          />
        </div>
      </div>

      {/* Centered Content Container */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 relative z-10">
        <div
          className="w-full max-w-[400px]"
          data-view-container
        >
        {/* Modern Brand Header - Left-Aligned with Logo */}
        <div
          className="flex items-center justify-center mb-5 animate-in fade-in slide-in-from-bottom-3"
          style={{
            // Explicitly include fill-mode in shorthand to avoid mixing shorthand + non-shorthand warnings
            animation: "fadeInUp 280ms ease-out 0ms 1 normal both",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Logo Container with Soft Glow */}
            <div className="relative flex-shrink-0">
              {/* Soft Glow Behind Logo */}
              {!isDarkMode && (
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    filter: "blur(20px)",
                    background:
                      "radial-gradient(circle, rgba(0, 100, 0, 0.15) 0%, transparent 70%)",
                    transform: "scale(1.4)",
                  }}
                />
              )}

              {/* Logo Box */}
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-[12px] flex items-center justify-center relative
                  bg-gradient-to-br from-green-50/90 via-green-100/70 to-emerald-50/90 
                  dark:from-green-900/50 dark:via-emerald-900/40 dark:to-green-950/50
                  border border-green-200/50 dark:border-green-700/40
                  overflow-visible backdrop-blur-sm"
                style={{
                  boxShadow: `
                    0 2px 12px rgba(34, 197, 94, 0.12),
                    0 0 0 1px rgba(78, 255, 161, 0.06),
                    inset 0 1px 2px rgba(255, 255, 255, 0.15),
                    inset 0 -1px 3px rgba(0, 0, 0, 0.06)
                  `,
                }}
              >
                {/* Inner Radial Gradient */}
                <div
                  className="absolute inset-0 opacity-75 rounded-[20px]"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(78, 255, 161, 0.28) 0%, transparent 70%)",
                  }}
                />

                {/* Logo Image with Enhanced Visibility */}
                <div className="relative">
                  {/* Light Mode: Mint Glow Behind Icon */}
                  {!isDarkMode && (
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        filter: "blur(12px)",
                        background:
                          "radial-gradient(circle, rgba(51, 210, 124, 0.13) 0%, transparent 70%)",
                        transform: "scale(1.2)",
                      }}
                    />
                  )}

                  {/* Dark Mode: Premium Outer Glow with #45F3A6 */}
                  {isDarkMode && (
                    <>
                      <div
                        className="absolute inset-0 opacity-[0.14]"
                        style={{
                          filter: "blur(16px)",
                          background:
                            "radial-gradient(circle, rgba(69, 243, 166, 0.14) 0%, transparent 60%)",
                          transform: "scale(1.5)",
                        }}
                      />

                      {/* Inner Glow Layer */}
                      <div
                        className="absolute inset-0 opacity-[0.14] rounded-full"
                        style={{
                          filter: "blur(10px)",
                          background:
                            "radial-gradient(circle, rgba(69, 243, 166, 0.15) 0%, transparent 50%)",
                          transform: "scale(1.2)",
                        }}
                      />

                      {/* Soft Off-White Glow Behind Icon */}
                      <div
                        className="absolute inset-0 opacity-[0.13]"
                        style={{
                          filter: "blur(10px)",
                          background:
                            "radial-gradient(circle, rgba(247, 246, 242, 0.15) 0%, transparent 50%)",
                          transform: "scale(1.15)",
                        }}
                      />
                    </>
                  )}

                  <img
                    src={iskoMarketLogo}
                    alt="IskoMarket Logo"
                    className="h-8 w-8 md:h-10 md:w-10 object-contain relative z-10"
                    style={{
                      filter: isDarkMode
                        ? "brightness(3.5) saturate(0.1) drop-shadow(0 2px 8px rgba(247, 246, 242, 0.3))"
                        : "brightness(1.15) contrast(1.08) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))",
                      opacity: isDarkMode ? "1" : "0.95",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Brand Text - Left Aligned */}
            <div className="flex flex-col items-start justify-center">
              {/* Title with Premium Glow */}
              <div className="relative">
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: 600,
                    fontFamily:
                      "Inter, system-ui, -apple-system, sans-serif",
                    letterSpacing: isDarkMode
                      ? "0.01em"
                      : "0.006em",
                    lineHeight: "1.1",
                    color: isDarkMode ? "#F7F6F2" : "#006400",
                    filter: isDarkMode
                      ? "drop-shadow(0 0 14px rgba(48, 209, 88, 0.07))"
                      : "none",
                  }}
                  className="md:text-[30px]"
                >
                  IskoMarket
                </h1>

                {/* Mint Accent Line */}
                <div
                  className="absolute left-0 -bottom-1 h-[1px] bg-[#32CD32] opacity-40"
                  style={{
                    width: "100%",
                  }}
                />
              </div>

              {/* Subtitle with Enhanced Visibility */}
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 400,
                  fontFamily:
                    "Inter, system-ui, -apple-system, sans-serif",
                  letterSpacing: isDarkMode
                    ? "0.015em"
                    : "0.015em",
                  lineHeight: "1.4",
                  marginTop: "6px",
                  color: isDarkMode ? "#D9D7D2" : "#006400",
                  opacity: isDarkMode ? 1 : 0.85,
                  filter: isDarkMode
                    ? "drop-shadow(0 0 8px rgba(48, 209, 88, 0.04))"
                    : "none",
                }}
                className="md:text-[16px]"
              >
                Cavite State University – Main Campus
              </p>
            </div>
          </div>
        </div>

        <Card
          className="shadow-lg relative overflow-visible"
          style={{
            borderRadius: "20px",
            backgroundColor: isDarkMode ? "rgba(15, 45, 29, 0.7)" : "#F7F9F4",
            border: isDarkMode
              ? "1px solid rgba(20, 184, 166, 0.15)"
              : "1px solid rgba(0, 100, 0, 0.12)",
            boxShadow: isDarkMode
              ? "0 0 0 1px rgba(20, 184, 166, 0.1), 0 0 30px rgba(20, 184, 166, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
              : "0 2px 12px rgba(0, 100, 0, 0.06)",
            backdropFilter: isDarkMode ? "blur(16px)" : "none",
          }}
        >
          <CardContent className="px-7 pb-8 pt-8">
            {/* Auth Mode Buttons - Hidden on registration step 3 */}
            {!showForgotPassword &&
              !(
                activeTab === "register" &&
                registrationStep === 3
              ) && (
                <div className="flex space-x-2 mb-[18px]">
                  <Button
                    variant={
                      activeTab === "login"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setActiveTab("login")}
                    className="flex-1 transition-all duration-300 hover:-translate-y-0.5"
                    style={
                      activeTab === "login"
                        ? {
                            background: isDarkMode
                              ? "linear-gradient(135deg, #0c8f4a 0%, #067232 100%)"
                              : "#007A24",
                            color: "#ffffff",
                            border: "none",
                            height: "44px",
                            borderRadius: "22px",
                            fontSize: "14px",
                            fontWeight: 500,
                            boxShadow: isDarkMode
                              ? "0 0 20px rgba(12, 143, 74, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)"
                              : "0 2px 8px rgba(0, 122, 36, 0.2)",
                          }
                        : {
                            backgroundColor: "transparent",
                            color: isDarkMode
                              ? "#B9EFB9"
                              : "#006400",
                            border: isDarkMode
                              ? "1px solid rgba(20, 184, 166, 0.2)"
                              : "1px solid #8FBF91",
                            height: "44px",
                            borderRadius: "22px",
                            fontSize: "14px",
                            fontWeight: 500,
                          }
                    }
                  >
                    Sign In
                  </Button>
                  <Button
                    variant={
                      activeTab === "register"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setActiveTab("register")}
                    className="flex-1 transition-all duration-300 hover:-translate-y-0.5"
                    style={
                      activeTab === "register"
                        ? {
                            background: isDarkMode
                              ? "linear-gradient(135deg, #0c8f4a 0%, #067232 100%)"
                              : "#007A24",
                            color: "#ffffff",
                            border: "none",
                            height: "44px",
                            borderRadius: "22px",
                            fontSize: "14px",
                            fontWeight: 500,
                            boxShadow: isDarkMode
                              ? "0 0 20px rgba(12, 143, 74, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)"
                              : "0 2px 8px rgba(0, 122, 36, 0.2)",
                          }
                        : {
                            backgroundColor: "transparent",
                            color: isDarkMode
                              ? "#B9EFB9"
                              : "#006400",
                            border: isDarkMode
                              ? "1px solid rgba(20, 184, 166, 0.2)"
                              : "1px solid #8FBF91",
                            height: "44px",
                            borderRadius: "22px",
                            fontSize: "14px",
                            fontWeight: 500,
                          }
                    }
                  >
                    Register
                  </Button>
                </div>
              )}

            {/* Login Form */}
            {activeTab === "login" && !showForgotPassword && (
              <div className="space-y-3">
                <form
                  onSubmit={handleLogin}
                  className="space-y-3"
                >
                  <div>
                    <label
                      className="block mb-2"
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: isDarkMode
                          ? "#B9EFB9"
                          : "#006400",
                      }}
                    >
                      CvSU Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{
                          color: isDarkMode
                            ? "rgba(255, 255, 255, 0.3)"
                            : "#8FBF91",
                        }}
                      />
                      <Input
                        type="email"
                        placeholder="your.name@cvsu.edu.ph"
                        value={loginForm.email}
                        onChange={(e) => {
                          setLoginForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }));
                        }}
                        className="pl-10 pr-3.5 transition-all duration-300"
                        style={{
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.06)"
                            : "#ffffff",
                          border: isDarkMode
                            ? "1px solid rgba(20, 184, 166, 0.2)"
                            : "1px solid #8FBF91",
                          borderRadius: "12px",
                          color: isDarkMode
                            ? "#D8F6D8"
                            : "#006400",
                          fontSize: "14px",
                          height: "46px",
                          boxShadow: isDarkMode
                            ? "inset 0 2px 4px rgba(0, 0, 0, 0.3)"
                            : "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
                        }}
                        onFocus={(e) => {
                          if (isDarkMode) {
                            e.target.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(20, 184, 166, 0.15), 0 0 20px rgba(20, 184, 166, 0.2)";
                            e.target.style.borderColor = "rgba(20, 184, 166, 0.4)";
                          }
                        }}
                        onBlur={(e) => {
                          if (isDarkMode) {
                            e.target.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.3)";
                            e.target.style.borderColor = "rgba(20, 184, 166, 0.2)";
                          }
                        }}
                      />
                    </div>
                    {errors.email && (
                      <div className="flex items-center space-x-1 mt-1.5 text-sm text-red-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      className="block mb-2"
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: isDarkMode
                          ? "#B9EFB9"
                          : "#006400",
                      }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{
                          color: isDarkMode
                            ? "rgba(255, 255, 255, 0.3)"
                            : "#8FBF91",
                        }}
                      />
                      <Input
                        type={
                          showPassword ? "text" : "password"
                        }
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }));
                        }}
                        className="pl-10 pr-10 transition-all duration-300"
                        style={{
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.06)"
                            : "#ffffff",
                          border: isDarkMode
                            ? "1px solid rgba(20, 184, 166, 0.2)"
                            : "1px solid #8FBF91",
                          borderRadius: "12px",
                          color: isDarkMode
                            ? "#D8F6D8"
                            : "#006400",
                          fontSize: "14px",
                          height: "46px",
                          boxShadow: isDarkMode
                            ? "inset 0 2px 4px rgba(0, 0, 0, 0.3)"
                            : "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
                        }}
                        onFocus={(e) => {
                          if (isDarkMode) {
                            e.target.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(20, 184, 166, 0.15), 0 0 20px rgba(20, 184, 166, 0.2)";
                            e.target.style.borderColor = "rgba(20, 184, 166, 0.4)";
                          }
                        }}
                        onBlur={(e) => {
                          if (isDarkMode) {
                            e.target.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.3)";
                            e.target.style.borderColor = "rgba(20, 184, 166, 0.2)";
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110"
                        style={{
                          color: isDarkMode
                            ? "rgba(20, 184, 166, 0.6)"
                            : "#8FBF91",
                          filter: isDarkMode && showPassword
                            ? "drop-shadow(0 0 8px rgba(20, 184, 166, 0.5))"
                            : "none",
                        }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="flex items-center space-x-1 mt-1.5 text-sm text-red-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errors.password}</span>
                      </div>
                    )}
                  </div>

                  {/* Login attempts warning */}
                  {isLoginLocked && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/20">
                      <div className="flex items-center space-x-1 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Account Temporarily Locked
                        </span>
                      </div>
                      <p className="text-xs">
                        Please wait {lockoutTimer} seconds or
                        reset your password to continue.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setErrors({});
                          setForgotPasswordForm({ email: loginForm.email, code: '', newPassword: '', confirmNewPassword: '' });
                        }}
                        className="text-xs text-primary mt-2 block cursor-pointer"
                      >
                        → Reset Password Now
                      </button>
                    </div>
                  )}

                  {errors.general && !isLoginLocked && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                      <div className="flex items-center space-x-1 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.general}</span>
                      </div>
                      {errors.general.includes(
                        "Account not found",
                      ) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Don't have an account? Click the{" "}
                          <strong>Register</strong> button above
                          to create one.
                        </div>
                      )}

                      {/* If the account exists but credentials failed, offer a quick reset action */}

                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full mt-1 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
                    disabled={isLoading || isLoginLocked}
                    style={{
                      background:
                        isLoading || isLoginLocked
                          ? isDarkMode
                            ? "#0C662A"
                            : "#A7C9A7"
                          : isDarkMode
                            ? "linear-gradient(135deg, #0c8f4a 0%, #067232 100%)"
                            : "#007A24",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      height: "44px",
                      borderRadius: "22px",
                      boxShadow:
                        isLoading || isLoginLocked
                          ? "none"
                          : isDarkMode
                            ? "0 0 25px rgba(12, 143, 74, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)"
                            : "0 2px 8px rgba(0, 122, 36, 0.2)",
                    }}
                  >
                    {isLoading
                      ? "Signing In..."
                      : isLoginLocked
                        ? `Locked (${lockoutTimer}s)`
                        : "Sign In to IskoMarket"}
                  </Button>

                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setErrors({});
                      }}
                      className="relative transition-all duration-300 cursor-pointer hover:-translate-y-[1px] group"
                      style={{
                        fontFamily:
                          "Inter, system-ui, -apple-system, sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: isDarkMode
                          ? "#B9EFB9"
                          : "#007A24",
                        filter: isDarkMode
                          ? "drop-shadow(0 0 14px rgba(46, 204, 113, 0.08))"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isDarkMode
                          ? "#D8F6D8"
                          : "#006400";
                        const underline = e.currentTarget.querySelector('.hover-underline') as HTMLElement;
                        if (underline) {
                          underline.style.width = "100%";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isDarkMode
                          ? "#B9EFB9"
                          : "#007A24";
                        const underline = e.currentTarget.querySelector('.hover-underline') as HTMLElement;
                        if (underline) {
                          underline.style.width = "0%";
                        }
                      }}
                    >
                      Forgot your password?
                      <span 
                        className="hover-underline absolute bottom-0 left-0 h-[2px] bg-current transition-all duration-300"
                        style={{ width: "0%" }}
                      />
                    </button>

                  </div>
                </form>
              </div>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword && (
              <div className="space-y-3">
                <div className="text-center mb-3">
                  <h3 className="text-lg font-medium mb-2">
                    Reset Your Password
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {forgotPasswordStep === 1 &&
                      "Enter your CvSU email address to receive a password reset code."}
                    {forgotPasswordStep === 2 &&
                      "Follow the instructions in the email to reset your password"}
                    {forgotPasswordStep === 3 &&
                      "Create a new password for your account"}
                  </p>
                </div>

                <form
                  onSubmit={handleForgotPassword}
                  className="space-y-3"
                >
                  {forgotPasswordStep === 1 && (
                    <div>
                      <label className="block text-sm mb-2">
                        CvSU Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="your.name@cvsu.edu.ph"
                          value={forgotPasswordForm.email}
                          onChange={(e) =>
                            setForgotPasswordForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="pl-10"
                        />
                      </div>
                      {errors.email && (
                        <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.email}</span>
                        </div>
                      )}

                      {/* Action buttons for reset */}
                      <div className="flex gap-3 mt-4">
                        <Button variant="outline" type="button" onClick={() => { handleBackToLogin(); setActiveTab('login'); }}>
                          Cancel
                        </Button>
                        <div className="flex-1">
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending…' : 'Send Code'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {forgotPasswordStep === 2 && (
                    <div className="bg-muted/50 p-3 rounded text-sm space-y-2">
                      <p className="text-muted-foreground">
                        We've sent a password reset email to:
                      </p>
                      <p className="font-medium">
                        {forgotPasswordForm.email}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">
                        Please check your inbox and follow the instructions to reset your password.
                      </p>
                    </div>
                  )}

                  {forgotPasswordStep === 3 && (
                    <>
                      <div>
                        <div className="bg-green-50 p-4 rounded">
                          <div className="text-sm">
                            A password reset email has been sent. Please check your inbox and follow the instructions to complete the reset.
                          </div>
                        </div>

                        <div className="mt-2 text-right">
                          <Button
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordStep(1);
                              setForgotPasswordForm({ email: '', code: '', newPassword: '', confirmNewPassword: '' });
                              setSentCode('');
                            }}
                          >
                            Return to Sign In
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </form>
              </div>
            )}

            {/* Registration Form */}
            {activeTab === "register" &&
              !showForgotPassword && (
                <div className="space-y-3">
                  {registrationStep === 1 && (
                    <div
                      className="text-center text-sm text-muted-foreground mb-3"
                      style={{ display: "none" }}
                    >
                      {/* Description removed per user request */}
                    </div>
                  )}

                  {registrationStep === 3 && (
                    <div className="text-center py-8">
                      <div className="mb-4 px-4 py-2 rounded-md bg-green-50 text-green-800 text-sm inline-block">Your CvSU email has been verified. Please sign in to continue.</div>
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-2xl mb-3">
                        Email Verified!
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Your account has been successfully
                        created. You can now proceed to login.
                      </p>
                    </div>
                  )}
                  <form
                    onSubmit={handleRegister}
                    className="space-y-3"
                  >
                    {/* Step 1: Registration Form */}
                    {registrationStep === 1 && (
                      <>
                        {/* Username Preview (derived from CvSU email) */}
                        <div>
                          <label className="block text-sm mb-2">
                            Username
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Derived from email"
                              value={computeUsernameFromEmail(registerForm.email)}
                              readOnly
                              className="pl-10 bg-muted/30"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Your username will be automatically derived from your CvSU email and cannot be changed.</div>
                        </div> 

                        {/* Email */}
                        <div>
                          <label className="block text-sm mb-2">
                            CvSU Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="your.name@cvsu.edu.ph"
                              value={registerForm.email}
                              onChange={(e) =>
                                setRegisterForm((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className="pl-10"
                            />
                          </div>
                          {errors.email && (
                            <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm mb-2">
                            Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={
                                showPassword
                                  ? "text"
                                  : "password"
                              }
                              placeholder="Create a strong password"
                              value={registerForm.password}
                              onChange={(e) =>
                                setRegisterForm((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              className="pl-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword(!showPassword)
                              }
                              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>{errors.password}</span>
                            </div>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-sm mb-2">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={
                                showConfirmPassword
                                  ? "text"
                                  : "password"
                              }
                              placeholder="Confirm your password"
                              value={
                                registerForm.confirmPassword
                              }
                              onChange={(e) =>
                                setRegisterForm((prev) => ({
                                  ...prev,
                                  confirmPassword:
                                    e.target.value,
                                }))
                              }
                              className="pl-10 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(
                                  !showConfirmPassword,
                                )
                              }
                              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>
                                {errors.confirmPassword}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}



                    {errors.general && (
                      <div className="flex items-center space-x-1 text-sm text-destructive bg-destructive/10 p-3 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.general}</span>
                      </div>
                    )}
                    {lastAuthError && (
                      <details className="mt-2 text-xs text-muted-foreground">
                        <summary className="cursor-pointer">Show error details</summary>
                        <pre className="whitespace-pre-wrap text-xs mt-1 p-2 bg-muted/10 rounded">{lastAuthError}</pre>
                      </details>
                    )}

                    {/* Submit Button - Changes based on step */}
                    {registrationStep === 1 && (
                      <Button
                        type="submit"
                        className="w-full mt-1 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
                        disabled={isLoading}
                        style={{
                          background: isLoading
                            ? isDarkMode
                              ? "#0C662A"
                              : "#A7C9A7"
                            : isDarkMode
                              ? "linear-gradient(135deg, #0c8f4a 0%, #067232 100%)"
                              : "#007A24",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "14px",
                          fontWeight: 500,
                          height: "44px",
                          borderRadius: "22px",
                          boxShadow: isLoading
                            ? "none"
                            : isDarkMode
                              ? "0 0 25px rgba(12, 143, 74, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)"
                              : "0 2px 8px rgba(0, 122, 36, 0.2)",
                        }}
                      >
                        {isLoading
                          ? "Processing..."
                          : "Register"}
                      </Button>
                    )}





                    {registrationStep === 3 && (
                      <div className="space-y-4">
                        <Button
                          type="button"
                          onClick={handleProceedToLogin}
                          className="w-full"
                          style={{
                            backgroundColor: isDarkMode
                              ? "#0E7A33"
                              : "#007A24",
                            color: "#ffffff",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: 500,
                            height: "44px",
                            borderRadius: "22px",
                          }}
                        >
                          Proceed to Login
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              )}
          </CardContent>
        </Card>


        {/* Floating Verify Email modal (single source of truth) */}
        <VerifyEmail
          open={isVerifyModalOpen && !isPasswordResetFlow}
          email={pendingUserData?.email || ''}
          username={pendingUserData?.username || ''}
          password={pendingUserData?.password || ''}
          resendCooldown={resendCooldown}
          setResendCooldown={setResendCooldown}
          onCancel={() => {
            setIsVerifyModalOpen(false);
            setPendingUserData(null);
          }}
          onVerified={(user: any) => {
            setIsVerifyModalOpen(false);
            // Move user back to Sign In so they can sign in with password (don't auto sign-in)
            setActiveTab('login');
            setLoginForm({ email: pendingUserData?.email || '', password: '' });
            setPendingUserData(null);
            setRegistrationStep(3);
          }}
        />

        {/* OTP modal for password reset (recovery) */}
        <OtpVerifyModal
          open={isVerifyModalOpen && isPasswordResetFlow}
          title="Reset your password"
          description="Enter the exact numeric code from the most recent email we sent to your CvSU inbox to proceed with resetting your password."
          email={resetFlowEmail}
          // Use reset-specific OTP length (default 8). Ops: set VITE_RESET_OTP_LENGTH or configure Supabase auth.email.otp_length = 8
          codeLength={Number(import.meta.env.VITE_RESET_OTP_LENGTH || 8)}
          resendCooldown={resendCooldown}
          setResendCooldown={setResendCooldown}
          onCancel={() => {
            setIsVerifyModalOpen(false);
            setIsPasswordResetFlow(false);
            setForgotPasswordStep(1);
          }}
          onVerify={async (code: string) => {
            const email = (resetFlowEmail || forgotPasswordForm.email || '').trim()

            // 1) Stub mode for deterministic E2E
            try {
              const runtimeStub = typeof window !== 'undefined' && (window as any).__TEST_VERIFY_OTP_STUB__ === true
              const buildStub = import.meta.env.VITE_TEST_VERIFY_OTP_STUB === 'true' || import.meta.env.VITE_TEST_RESET_STUB === 'true'
              const stubValid = (typeof window !== 'undefined' && (window as any).__TEST_VERIFY_OTP_VALID__) || (import.meta.env.VITE_TEST_VERIFY_OTP_VALID) || '12345678'
              if (buildStub || runtimeStub) {
                if (code === stubValid) {
                  setPendingResetOtp(code)
                  setIsVerifyModalOpen(false)
                  setIsPasswordResetFlow(false)
                  setIsNewPasswordOpen(true)
                  return { ok: true }
                }
                return { errorMessage: 'Invalid or expired code. Please try again.' }
              }
            } catch (e) { /* ignore stub detection errors */ }

            // 2) Production: verify directly with Supabase using the client-side anon key
            try {
              // Sanity: ensure code matches expected length
              const expected = Number(import.meta.env.VITE_RESET_OTP_LENGTH || 8)
              if (!new RegExp(`^\\d{${expected}}$`).test(code)) {
                return { errorMessage: `Please enter the verification code (${expected} digits).` }
              }

              const supabase = getSupabase()
              const token = (code || '').trim()

              const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' } as any)

              if (verifyError) {
                const msg = (verifyError?.message || '').toString().toLowerCase()
                if (msg.includes('token has expired') || msg.includes('expired') || msg.includes('otp_expired') || msg.includes('invalid') || msg.includes('is invalid') || msg.includes('invalid token') || msg.includes('forbidden')) {
                  return { errorMessage: 'Incorrect or expired code. Please try again.' }
                }
                if (msg.includes('too many') || msg.includes('rate limit') || (verifyError as any)?.status === 429) {
                  return { errorMessage: 'Too many attempts. Try again in a few minutes.' }
                }
                console.error('verifyOtp unexpected error (sdk):', verifyError)
                return { errorMessage: 'Verification failed. Please try again later.' }
              }

              // Success: advance to Set New Password
              setPendingResetOtp(code)
              setIsVerifyModalOpen(false)
              setIsPasswordResetFlow(false)
              setIsNewPasswordOpen(true)
              return { ok: true }
            } catch (e: any) {
              console.error('verifyOtp exception:', e)
              return { errorMessage: 'Verification failed. Please try again later.' }
            }
          }}
          onResend={async () => {
            await handleResendPasswordResetCode()
          }}
        />

        <NewPasswordModal
          open={isNewPasswordOpen}
          email={resetFlowEmail}
          otp={pendingResetOtp}
          onCancel={() => {
            setIsNewPasswordOpen(false)
            // Back to login screen
            setActiveTab('login')
            setShowForgotPassword(false)
            setForgotPasswordStep(1)
            setPendingResetOtp(null)
          }}
          onSuccess={() => {
            setIsNewPasswordOpen(false)
            setPendingResetOtp(null)
            // After successful password reset, send the user back to the login screen.
            setActiveTab('login')
            setShowForgotPassword(false)
            setForgotPasswordStep(1)
          }}
        />

        </div>
      </div>
    </div>
  );
}