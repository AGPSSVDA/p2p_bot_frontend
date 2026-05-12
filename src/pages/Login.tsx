import { useState, FormEvent, useMemo } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Bot, Eye, EyeOff, Loader2, Lock, Mail, CheckCircle2, XCircle, ArrowLeft, KeyRound 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Login() {
  const { user, login, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const isReset = searchParams.has("reset-password");

  // Hooks must be at the top!
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const validations = useMemo(() => {
    return [
      { label: "At least 6 characters long", met: newPassword.length >= 6 },
      { label: "Contains at least one digit", met: /\d/.test(newPassword) },
      { label: "Contains a special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ];
  }, [newPassword]);

  const canReset = validations.every(v => v.met) && oldPassword.length > 0;

  // Conditional returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && !isReset) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) {
      toast.success("Welcome back!");
      nav("/", { replace: true });
    } else {
      toast.error("Invalid credentials or server error. Please try again.");
    }
  };

  const onResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setLoading(false);
      toast.success("Password updated successfully!");
      nav("/", { replace: true });
    } catch (error: any) {
      setLoading(false);
      const msg = error.response?.data?.message || "Failed to update password";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(circle_at_20%_20%,hsl(45_93%_49%/0.08),transparent_40%),radial-gradient(circle_at_80%_80%,hsl(45_93%_49%/0.06),transparent_40%)]" />

      <motion.div
        key={isReset ? "reset" : "login"}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md surface-card rounded-2xl p-7 sm:p-9 shadow-[var(--shadow-elevated)]"
      >
        <div className="flex flex-col items-center text-center mb-7 relative">
          {isReset && (
            <button 
              onClick={() => nav(-1)}
              className="absolute left-0 top-0 p-2 -ml-2 text-muted-foreground hover:text-foreground transition rounded-full hover:bg-surface-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <motion.div
            initial={{ scale: 0.6, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-[0_0_30px_-4px_hsl(var(--primary)/0.6)] mb-4"
          >
            {isReset ? <KeyRound className="h-7 w-7 text-primary-foreground" /> : <Bot className="h-7 w-7 text-primary-foreground" />}
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">{isReset ? "Reset Password" : "P2P Automation"}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isReset ? "Create a strong new password for your account" : "Sign in to your control panel"}
          </p>
        </div>

        <form onSubmit={isReset ? onResetSubmit : onSubmit} className="space-y-5">
          {!isReset ? (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                    className="w-full h-11 rounded-lg bg-surface-2 border border-border pl-10 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={show ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                    className="w-full h-11 rounded-lg bg-surface-2 border border-border pl-10 pr-10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Old Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showOld ? "text" : "password"} value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full h-11 rounded-lg bg-surface-2 border border-border pl-10 pr-10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
                    placeholder="Current password"
                  />
                  <button type="button" onClick={() => setShowOld((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showNew ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 rounded-lg bg-surface-2 border border-border pl-10 pr-10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
                    placeholder="Enter new password"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="space-y-2.5 p-4 rounded-xl bg-surface-2 border border-border">
                {validations.map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {v.met ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span className={cn(
                      "text-[11px] font-medium transition-colors",
                      v.met ? "text-success" : "text-muted-foreground"
                    )}>
                      {v.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <motion.button
            type="submit" 
            disabled={loading || (isReset && !canReset)}
            whileTap={{ scale: 0.98 }}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold text-sm shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.6)] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {isReset ? "Updating..." : "Signing in..."}</>
            ) : (
              isReset ? "Update Password" : "Sign in"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
