import { useEffect, useState } from 'react';
import { Calendar, Users, School, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router';
import { getEvents, EventData } from '../services/eventService';
import { getUsers, UserData } from '../services/userService';
import { getNotifications } from '../services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function Dashboard() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, usersData, notificationsData] = await Promise.all([
          getEvents(),
          getUsers(),
          getNotifications()
        ]);
        setEvents(eventsData as EventData[]);
        setUsers(usersData);
        setNotifications(notificationsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const publicEvents = events.filter(e => e.isPublic).length;
  const draftEvents = events.length - publicEvents;
  const schoolCount = users.filter(u => u.role === 'school').length;

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Events"
          value={events.length}
          icon={Calendar}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Public Events"
          value={publicEvents}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Draft Events"
          value={draftEvents}
          icon={FileText}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
        />
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Total Schools"
          value={schoolCount}
          icon={School}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Events Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Link to="/events" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 5).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <Link to={`/events/${event.id}`} className="hover:underline text-blue-600">
                        {event.title}
                      </Link>
                    </TableCell>
                    <TableCell>{event.creatorSchoolName}</TableCell>
                    <TableCell>
                      {event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={event.isPublic ? 'Public' : 'Draft'} />
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No events found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <Link to="/notifications" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <h4 className="font-medium text-sm">{notif.title}</h4>
                  <p className="text-gray-500 text-xs line-clamp-2">{notif.body}</p>
                  <span className="text-xs text-gray-400 mt-1">
                    {notif.timestamp ? new Date(notif.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                  </span>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No notifications sent yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
