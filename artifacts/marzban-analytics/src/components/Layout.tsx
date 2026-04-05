import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Server,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronRight,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { href: "/", label: "Genel Bakis", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/users", label: "Kullanicilar", icon: <Users className="w-5 h-5" /> },
  { href: "/nodes", label: "Nodelar", icon: <Server className="w-5 h-5" /> },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hostname = auth ? new URL(auth.baseUrl).hostname : "";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Marzban</div>
              <div className="text-xs text-muted-foreground truncate max-w-[140px]">{hostname}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    active
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                >
                  <span className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}>
                    {item.icon}
                  </span>
                  {item.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 mb-2">
            <Activity className="w-4 h-4 text-chart-2" />
            <span className="text-xs text-muted-foreground">Canli izleme</span>
            <span className="w-2 h-2 rounded-full bg-chart-2 animate-pulse ml-auto" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
          >
            <LogOut className="w-5 h-5" />
            Cikis Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-sm">Marzban Analytics</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border z-50 flex flex-col lg:hidden"
            >
              <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Marzban</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[120px]">{hostname}</div>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-sidebar-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                  const active = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <a
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                          active ? "bg-primary/10 text-primary border border-primary/20" : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <span className={active ? "text-primary" : "text-muted-foreground"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-sidebar-border">
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Cikis Yap
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
