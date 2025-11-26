import { useEffect, useState } from 'react';
import { Calendar, Users, School, FileText, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router';
import { getEvents, EventData } from '../../features/events/services/eventService';
import { getUsers, UserData } from '../../features/users/services/userService';
import { getNotifications } from '../../features/notifications/services/notificationService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useAuth } from '../../context/AuthContext';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../components/ui/chart';

export function Dashboard() {
    const { isAdminUser, currentUser } = useAuth();
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

    const filteredEvents = events.filter(event => {
        if (isAdminUser) return true;
        const isApprovedPublic = event.status === 'approved' && event.isPublic;
        const isMyEvent = currentUser?.uid && event.creatorId === currentUser.uid;
        return isApprovedPublic || !!isMyEvent;
    });

    const publicEvents = events.filter(e => e.isPublic).length;
    const draftEvents = events.length - publicEvents;
    const schoolCount = users.filter(u => u.role === 'school').length;

    const getEventDate = (event: EventData) => {
        return event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date) : new Date();
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - i), 1);
        return {
            month: months[d.getMonth()],
            year: d.getFullYear(),
            monthIndex: d.getMonth(),
        };
    });

    const chartData = last6Months.map(({ month, year, monthIndex }) => {
        const eventsCount = events.filter(event => {
            const eventDate = getEventDate(event);
            return eventDate.getMonth() === monthIndex && eventDate.getFullYear() === year;
        }).length;
        return {
            name: month,
            events: eventsCount,
        };
    });

    const chartConfig = {
        events: {
            label: "Events",
            color: "hsl(var(--chart-1))",
        },
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
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

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <CardTitle>Events Trend</CardTitle>
                    </div>
                    <CardDescription>Event creation trend over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={chartData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                type="monotone"
                                dataKey="events"
                                stroke="var(--color-events)"
                                strokeWidth={2}
                                dot={{
                                    fill: "var(--color-events)",
                                    r: 4,
                                }}
                                activeDot={{
                                    r: 6,
                                }}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Events</CardTitle>
                        <Link to="/events" className="text-sm text-blue-600 hover:underline">
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[200px]">Title</TableHead>
                                        <TableHead className="min-w-[150px]">School</TableHead>
                                        <TableHead className="min-w-[100px]">Date</TableHead>
                                        <TableHead className="min-w-[100px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEvents.slice(0, 5).map((event) => (
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
                                                <StatusBadge status={event.status || (event.isPublic ? 'approved' : 'pending')} />
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
                        </div>
                    </CardContent>
                </Card>

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
