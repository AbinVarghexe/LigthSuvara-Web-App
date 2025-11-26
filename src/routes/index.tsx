import { createBrowserRouter } from 'react-router';
import { Layout } from '../components/layout/Layout';
import { Login } from '../pages/auth/Login';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Events } from '../pages/events/Events';
import { EventApprovals } from '../pages/events/EventApprovals';
import { EventDetail } from '../pages/events/EventDetail';
import { EventForm } from '../pages/events/EventForm';
import { Users } from '../pages/users/Users';
import { UserDetail } from '../pages/users/UserDetail';
import { Notifications } from '../pages/notifications/Notifications';
import { Reports } from '../pages/reports/Reports';
import { Settings } from '../pages/settings/Settings';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { NotAuthorized } from '../pages/auth/NotAuthorized';

export const router = createBrowserRouter([
    {
        path: '/login',
        Component: Login,
    },
    {
        path: '/not-authorized',
        Component: NotAuthorized,
    },
    {
        path: '/',
        Component: ProtectedRoute,
        children: [
            {
                path: '/',
                Component: Layout,
                children: [
                    { index: true, Component: Dashboard },
                    { path: 'events', Component: Events },
                    { path: 'events/approvals', Component: EventApprovals },
                    { path: 'events/new', Component: EventForm },
                    { path: 'events/:id', Component: EventDetail },
                    { path: 'events/:id/edit', Component: EventForm },
                    { path: 'users', Component: Users },
                    { path: 'users/:id', Component: UserDetail },
                    { path: 'notifications', Component: Notifications },
                    { path: 'reports', Component: Reports },
                    { path: 'settings', Component: Settings },
                ],
            },
        ],
    },
]);
