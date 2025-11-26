import { Link, useLocation } from 'react-router';
import { Home, Calendar, Users, Bell, BarChart3, Settings, LogOut, CheckCircle, X } from 'lucide-react';
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

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const { isAdminUser } = useAuth();

    const handleLogout = () => {
        window.location.href = '/login';
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                w-64 bg-white border-r border-gray-200 h-screen flex flex-col 
                fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

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
                                        onClick={() => onClose()}
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
        </>
    );
}
