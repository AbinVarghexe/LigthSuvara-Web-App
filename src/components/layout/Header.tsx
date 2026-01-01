import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Menu, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { ModeToggle } from '../mode-toggle';
import { useEffect, useState } from 'react';
import { getNotifications } from '../../features/notifications/services/notificationService';

import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    title: string;
    onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const notifications = await getNotifications();
                if (notifications.length > 0) {
                    const latestNotif = notifications[0] as any;
                    const lastReadTime = localStorage.getItem('lastNotificationReadTime');
                    
                    if (!lastReadTime) {
                        setHasUnread(true);
                    } else {
                        const latestTimestamp = latestNotif.timestamp?.seconds * 1000 || Date.now();
                        if (latestTimestamp > parseInt(lastReadTime)) {
                            setHasUnread(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking notifications:", error);
            }
        };

        checkNotifications();
    }, []);

    useEffect(() => {
        if (location.pathname === '/notifications') {
            setHasUnread(false);
            localStorage.setItem('lastNotificationReadTime', Date.now().toString());
        }
    }, [location.pathname]);

    return (
        <div className="bg-background border-b border-border px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-accent lg:hidden"
                    >
                        <Menu className="w-6 h-6 text-foreground" />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <Link to="/notifications" className="relative p-2 rounded-full hover:bg-accent transition-colors">
                        <Bell className="w-5 h-5 text-foreground" />
                        {hasUnread && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </Link>

                    {/* Theme Toggle */}
                    <ModeToggle />

                    <div className="text-right hidden sm:block">
                        <p className="font-medium text-foreground">{currentUser?.displayName || 'Admin User'}</p>
                        <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                    </div>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || 'User'} loading="lazy" />
                        <AvatarFallback>
                            {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    );
}
