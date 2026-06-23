import { Link, useLocation } from "react-router";
import {
  Home,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  X,
  GraduationCap,
  UserCheck,
  MessageSquare,
  BookUser,
  Church,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  Activity,
  UserPlus,
  ShieldCheck,
  Video,
  Sparkles,
  Radio,
  BookOpen,
  Flame,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { logout, getUserRole } from "../../features/auth/services/authService";
import { logUserAccess } from "../../features/logs/services/logService";

// Define navigation item type
interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Technical Users", href: "/users", icon: Church },
  {
    name: "Teacher Management",
    href: "/teachers",
    icon: BookUser,
    adminOnly: true,
  },
  {
    name: "Programs",
    href: "/programs",
    icon: GraduationCap,
    adminOnly: true,
    children: [
      { name: "Manage Programs", href: "/programs", icon: GraduationCap },
      {
        name: "Registrations",
        href: "/program-registrations",
        icon: UserCheck,
      },
      { name: "Analytics", href: "/program-analytics", icon: BarChart3 },
    ],
  },
  {
    name: "Animator Management",
    href: "/animators",
    icon: UserCheck,
    adminOnly: true,
  },
  {
    name: "Observers",
    href: "/observers",
    icon: Eye,
    adminOnly: true,
  },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  {
    name: "Public Registration",
    href: "/public-registration",
    icon: UserPlus,
    adminOnly: true,
  },
  { name: "Video Resources", href: "/video-resources", icon: Video },
  { name: "Saints", href: "/saints", icon: Sparkles },
  { name: "Catechetical Hour (വിശ്വാസപരിശീലന മണിക്കൂർ)", href: "/catechism", icon: BookOpen },
  { name: "Word of Life (ജീവൻ്റെ വചനം)", href: "/word-of-life", icon: Flame },
  {
    name: "Theme & Programs",
    href: "/theme",
    icon: Info,
    adminOnly: true,
  },
  {
    name: "App Control",
    href: "/app-control",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    name: "Live Video",
    href: "/live-video",
    icon: Radio,
    adminOnly: true,
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    adminOnly: true,
  },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  {
    name: "Logs",
    href: "/logs",
    icon: Activity,
    adminOnly: true,
  },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function Sidebar({ isOpen, onClose, onRefresh }: SidebarProps) {
  const location = useLocation();
  const { isAdminUser, currentUser } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Animator Management",
  ]);

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        const role = await getUserRole(currentUser);
        await logUserAccess(
          { uid: currentUser.uid, email: currentUser.email },
          role || 'user',
          'LOGOUT'
        );
      }
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
                w-64 bg-card border-r border-border h-screen flex flex-col 
                fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300
                ${
                  isOpen
                    ? "translate-x-0"
                    : "-translate-x-full lg:translate-x-0"
                }
            `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent lg:hidden"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img
              src="/assets/Logo-Bg-Dark.svg"
              alt="Light Suvara"
              className="w-10 h-10 rounded-lg block dark:hidden"
            />
            <img
              src="/assets/Logo-Bg-Light.svg"
              alt="Light Suvara"
              className="w-10 h-10 rounded-lg hidden dark:block"
            />
            <div>
              <h2 className="text-lg dark:text-white text-black font-semibold">
                Light Suvara
              </h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              if (item.adminOnly && !isAdminUser) return null;

              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems.includes(item.name);

              const isActive =
                !hasChildren &&
                (location.pathname === item.href ||
                  (item.href !== "/" &&
                    location.pathname.startsWith(item.href)));

              // Check if any child is active to highlight parent if needed (optional)
              const isChildActive = item.children?.some(
                (child) => location.pathname === child.href,
              );

              return (
                <li key={item.name}>
                  {hasChildren ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleExpand(item.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                          isChildActive
                            ? "text-primary bg-primary/10"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 ml-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>

                      {isExpanded && (
                        <ul className="pl-6 space-y-1">
                          {item.children!.map((child) => {
                            if (child.adminOnly && !isAdminUser) return null;
                            const isChildActive =
                              location.pathname === child.href;

                            return (
                              <li key={child.name}>
                                <Link
                                  to={child.href}
                                  onClick={() => {
                                    if (location.pathname === child.href) {
                                      onRefresh?.();
                                    }
                                    onClose();
                                  }}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                                    isChildActive
                                      ? "bg-primary text-primary-foreground"
                                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  }`}
                                >
                                  <child.icon className="w-4 h-4" />
                                  <span className="font-medium">
                                    {child.name}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => {
                        if (
                          location.pathname === item.href ||
                          location.pathname.startsWith(item.href + "/")
                        ) {
                          onRefresh?.();
                        }
                        onClose();
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
