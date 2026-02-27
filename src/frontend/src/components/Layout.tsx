import { Link, useRouter } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import {
  Car,
  LayoutDashboard,
  MapPin,
  History,
  LogOut,
  Menu,
  X,
  Zap,
  MapIcon,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const userNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Book a Ride", href: "/book", icon: <Car size={18} /> },
  { label: "Map & Demand", href: "/map", icon: <MapIcon size={18} /> },
  { label: "My Rides", href: "/rides", icon: <History size={18} /> },
];

const driverNavItems: NavItem[] = [
  { label: "Dashboard", href: "/driver/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "My Map", href: "/driver/map", icon: <MapPin size={18} /> },
  { label: "Ride Requests", href: "/driver/requests", icon: <Users size={18} /> },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === "driver" ? driverNavItems : userNavItems;
  const currentPath = router.state.location.pathname;

  const handleLogout = () => {
    logout();
    void router.navigate({ to: "/" });
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 ride-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">RideRapid</span>
            <div className="text-xs text-sidebar-foreground/50 font-mono">v1.0</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-3">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 nav-item-hover",
                isActive
                  ? "bg-sidebar-primary/25 text-white border-l-[3px] border-sidebar-primary pl-[9px]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <span className={cn(isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")}>
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent mb-2">
          <div className="w-8 h-8 rounded-full ride-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "Guest"}</div>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs mt-0.5",
                user?.role === "driver"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30"
              )}
            >
              {user?.role === "driver" ? "Driver" : "Rider"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-sidebar sidebar-glow z-20 animate-slide-in-left">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm border-0 cursor-default"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border shadow-sm">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 ride-gradient rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-foreground">RideRapid</span>
          </div>
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-2 rounded-lg hover:bg-muted"
            >
              <X size={20} />
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
