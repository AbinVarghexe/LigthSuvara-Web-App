import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation } from 'react-router';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/events': 'Events',
    '/events/new': 'Create Event',
    '/events/approvals': 'Event Approvals',
    '/users': 'Users',
    '/programs': 'Programs',
    '/questions': 'Question Bank',
    '/animators': 'Animators',
    '/marks': 'Marks',
    '/notifications': 'Notifications',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/calendar': 'Calendar'
};

export function Layout() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Get title based on path
    let title = pageTitles[location.pathname] || 'Dashboard';

    // Handle dynamic routes
    if (location.pathname.startsWith('/events/') && location.pathname.includes('/edit')) {
        title = 'Edit Event';
    } else if (location.pathname.startsWith('/events/') && location.pathname !== '/events/new') {
        title = 'Event Details';
    } else if (location.pathname.startsWith('/users/')) {
        title = 'User Details';
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onRefresh={handleRefresh}
            />
            <div className="flex-1 flex flex-col lg:ml-64">
                <Header title={title} onMenuClick={() => setIsSidebarOpen(true)} />
                <main
                    key={`${location.pathname}-${refreshKey}`}
                    className="flex-1 p-2 sm:p-6 lg:p-8 animate-in fade-in duration-500"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
