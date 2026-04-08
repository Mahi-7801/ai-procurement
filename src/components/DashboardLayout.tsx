import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, UserRole } from "@/lib/mock-data";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  AlertTriangle,
  ClipboardList,
  LogOut,
  Shield,
  Users,
  Settings,
  MessageSquare,
  FilePenLine,
  CheckCircle2,
  GitMerge,
  CloudUpload,
  Zap,
  Activity,
  Brain,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

// Define which roles can access each module
const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR", "EVALUATION_COMMITTEE", "APPROVING_AUTHORITY", "RTGS_AUDITOR", "INTERNAL_VIGILANCE"] as UserRole[],
  },
  {
    label: "RFP Drafting",
    icon: FilePenLine,
    path: "/dashboard/draft",
    roles: ["ADMIN", "PROCUREMENT_OFFICER"] as UserRole[],
  },
  {
    label: "Pre-RFP Validator",
    icon: CheckCircle2,
    path: "/dashboard/validator",
    roles: ["ADMIN", "PROCUREMENT_OFFICER"] as UserRole[],
  },
  {
    label: "Tenders",
    icon: ClipboardList,
    path: "/dashboard/tenders",
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] as UserRole[],
  },
  {
    label: "RFP Process",
    icon: GitMerge,
    path: "/dashboard/rfp-process",
    roles: ["ADMIN", "PROCUREMENT_OFFICER"] as UserRole[],
  },
  {
    label: "Bid Evaluation",
    icon: Zap,
    path: "/dashboard/evaluations",
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "EVALUATION_COMMITTEE", "APPROVING_AUTHORITY"] as UserRole[],
  },
  {
    label: "Communication",
    icon: MessageSquare,
    path: "/dashboard/communications",
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] as UserRole[],
  },
  {
    label: "Monitoring",
    icon: Activity,
    path: "/dashboard/contract-monitoring",
    roles: ["ADMIN", "PROCUREMENT_OFFICER"] as UserRole[],
  },
  {
    label: "AI Models",
    icon: Brain,
    path: "/dashboard/ai-models",
    roles: ["ADMIN", "PROCUREMENT_OFFICER"] as UserRole[],
  },
];

const navGroups = [
  {
    label: "Workspace",
    items: ["Dashboard", "RFP Drafting", "Pre-RFP Validator"],
  },
  {
    label: "Procurement",
    items: ["Tenders", "RFP Process", "Bid Evaluation"],
  },
  {
    label: "Operations",
    items: ["Communication", "Monitoring", "AI Models"],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(auth.role)
  );

  const currentPage =
    navItems.find((n) => n.path === location.pathname)?.label || "Dashboard";

  const initials = (auth.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "linear-gradient(180deg, #0f2a55 0%, #0d2347 100%)" }}>
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 shadow-inner">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[13px] font-black text-white leading-tight tracking-tight">
              RTGS Procurement
            </h1>
            <p className="text-[10px] text-white/50 font-medium mt-0.5">
              Govt. of Andhra Pradesh
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5 scrollbar-hide">
        {navGroups.map((group) => {
          const groupItems = visibleItems.filter((item) =>
            group.items.includes(item.label)
          );
          if (groupItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 px-2 mb-2 font-roboto">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group",
                        isActive
                          ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
                          : "text-white/60 hover:text-white hover:bg-white/8"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                        isActive
                          ? "bg-blue-400/30 text-blue-200"
                          : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70"
                      )}>
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/8 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-400/40 flex items-center justify-center text-white font-black text-xs ring-2 ring-white/20 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-white truncate leading-none">
              {auth.username || "Officer"}
            </p>
            <p className="text-[10px] text-white/45 font-medium mt-0.5 truncate">
              {roleLabels[auth.role]}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white/45 hover:text-white hover:bg-white/8 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-x-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 justify-between shrink-0 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="w-5 h-5 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-none">
                <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Access procurement modules and management tools</SheetDescription>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <span className="hidden xs:inline-block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                RTGS Portal
              </span>
              <ChevronRight className="hidden xs:block w-3 h-3 text-slate-300" />
              <h2 className="text-sm font-black text-slate-800 truncate max-w-[120px] sm:max-w-none">{currentPage}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <div className="h-8 w-[1px] bg-slate-200 mx-0.5 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-[11px] font-bold text-slate-900 leading-none">
                  {auth.username}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                  {auth.user?.email || "No Email"}
                </span>
              </div>
              <span className="hidden sm:flex h-7 px-3 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-700 uppercase tracking-wider items-center">
                {roleLabels[auth.role]}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-xs shadow-sm shadow-slate-200/50">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
