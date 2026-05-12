import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Megaphone, ListOrdered, MessageSquare,
  Wallet, FileBarChart2, LogOut, Menu, X, Bot, ChevronLeft, KeyRound
} from "lucide-react";

import { useState, ReactNode, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Overview",   icon: LayoutDashboard },
  { to: "/ads", label: "Ads",     icon: Megaphone },
  { to: "/orders", label: "Orders", icon: ListOrdered },
  { to: "/chat", label: "Chat",   icon: MessageSquare },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/tds", label: "TDS",     icon: FileBarChart2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { botRunning } = useSystem();
  const nav = useNavigate();
  const location = useLocation();
  const navGridRef = useRef<HTMLDivElement | null>(null);
  const [indicatorLeft, setIndicatorLeft] = useState<number | null>(null);

  useEffect(() => {
    const grid = navGridRef.current;
    if (!grid) {
      setIndicatorLeft(null);
      return;
    }
    const active = grid.querySelector('[aria-current="page"]') as HTMLElement | null;
    if (!active) {
      setIndicatorLeft(null);
      return;
    }
    const gridRect = grid.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const left = activeRect.left + activeRect.width / 2 - gridRect.left;
    setIndicatorLeft(left);

    const onResize = () => {
      const g = navGridRef.current;
      if (!g) return;
      const a = g.querySelector('[aria-current="page"]') as HTMLElement | null;
      if (!a) return setIndicatorLeft(null);
      const gr = g.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      setIndicatorLeft(ar.left + ar.width / 2 - gr.left);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    nav("/login");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-300 sticky top-0 h-screen",
          collapsed ? "w-[76px]" : "w-[248px]"
        )}
      >
        <div className={cn(
          "h-16 flex items-center border-b border-border transition-all duration-300",
          collapsed ? "justify-center px-2 gap-1" : "justify-between px-4 gap-2.5"
        )}>
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shrink-0 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold leading-none">P2P Bot</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Automation</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-muted-foreground hover:text-primary transition shrink-0"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>



        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:text-foreground hover:bg-surface-2"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="navActive"
                      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-r-full shadow-[0_0_10px_hsl(var(--primary))]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          {!collapsed && (
            <div className="rounded-lg bg-surface-2 px-3 py-2.5 flex items-center gap-2.5">
              <span className={cn(
                "h-2 w-2 rounded-full",
                botRunning ? "bg-success animate-pulse-glow" : "bg-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}


          {!collapsed && (
            <button 
              onClick={() => nav("/login?reset-password")}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:text-primary hover:bg-primary/10 transition"
            >
              <KeyRound className="h-[18px] w-[18px]" />
              <span>Reset Password</span>
            </button>
          )}


          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header (mobile + desktop) */}
        <header className="lg:hidden sticky top-0 z-40 h-14 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="font-bold text-sm">P2P Bot</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border",
              botRunning ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground border-border"
            )}>
              {botRunning ? "● Live" : "● Off"}
            </span>
            <button
              onClick={() => setMobileOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-surface-2"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="px-4 lg:px-8 py-5 lg:py-7 max-w-[1400px] mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
            <div className="relative">
              <div ref={navGridRef} className="grid grid-cols-6 h-16">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "w-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition relative",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )
                    }
                  >
                    <>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </>
                  </NavLink>
                ))}
              </div>

              {/* Single animated indicator positioned from active element's geometry */}
              {indicatorLeft !== null && (
                <motion.div
                  aria-hidden
                  initial={false}
                  animate={{ left: indicatorLeft }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-0 h-0.5 w-8 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]"
                  style={{ transform: "translateX(-50%)" }}
                />
              )}
            </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-sidebar border-l border-border z-50 flex flex-col lg:hidden"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-border">
                <p className="font-semibold text-sm">Menu</p>
                <button onClick={() => setMobileOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-surface-2"
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <div className="p-3 border-t border-border space-y-1">
                <div className="px-3 py-3 mb-2 rounded-lg bg-surface-2 flex items-center gap-2.5">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    botRunning ? "bg-success animate-pulse-glow" : "bg-muted-foreground"
                  )} />
                  <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
                </div>

                
                <button 
                  onClick={() => { nav("/login?reset-password"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/70 hover:text-primary hover:bg-primary/10 transition"
                >
                  <KeyRound className="h-[18px] w-[18px]" />
                  <span>Reset Password</span>
                </button>

                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  <span>Sign out</span>
                </button>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
