import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation } from 'react-router';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/events': 'Events',
    '/events/new': 'Create Event',
    '/users': 'Users',
    '/notifications': 'Notifications',
    '/reports': 'Reports',
    '/settings': 'Settings'
};

export function Layout() {
    const location = useLocation();

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
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64">
                <Header title={title} />
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
