import { Link, useLocation } from "react-router";
import {
  Home,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut,
  X,
  GraduationCap,
  HelpCircle,
  UserCheck,
  ClipboardList,
  MessageSquare,
  BookUser,
  Church,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Sunday School", href: "/users", icon: Church },
  { name: "Teachers", href: "/teachers", icon: BookUser, adminOnly: true },
  { name: "Programs", href: "/programs", icon: GraduationCap, adminOnly: true },
  { name: "Questions", href: "/questions", icon: HelpCircle, adminOnly: true },
  { name: "Animators", href: "/animators", icon: UserCheck, adminOnly: true },
  { name: "Marks", href: "/marks", icon: ClipboardList, adminOnly: true },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { isAdminUser } = useAuth();

  const handleLogout = () => {
    window.location.href = "/login";
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
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => onClose()}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
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
