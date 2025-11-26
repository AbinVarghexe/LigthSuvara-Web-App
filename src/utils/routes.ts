import { createBrowserRouter } from 'react-router';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Events } from '../pages/Events';
import { EventDetail } from '../pages/EventDetail';
import { EventForm } from '../pages/EventForm';
import { Users } from '../pages/Users';
import { UserDetail } from '../pages/UserDetail';
import { Notifications } from '../pages/Notifications';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'events', Component: Events },
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
]);
