import { Link, useLocation } from 'react-router';
import { Home, Calendar, Users, Bell, BarChart3, Settings, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Approvals', href: '/events/approvals', icon: CheckCircle, adminOnly: true },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const location = useLocation();
    const { isAdminUser } = useAuth();

    const handleLogout = () => {
        // Mock logout
        window.location.href = '/login';
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">LS</span>
                    </div>
                    <div>
                        <h2 className="text-lg text-[#1E40AF]">Light Suvara</h2>
                        <p className="text-xs text-gray-500">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        if (item.adminOnly && !isAdminUser) return null;
                        const isActive = location.pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-[#1E40AF] text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
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
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
