import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { getEvents, updateEventStatus, EventData } from '../../features/events/services/eventService';
import { getUsers } from '../../features/users/services/userService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

export function EventApprovals() {
    const { isAdminUser, currentUser } = useAuth();
    const [events, setEvents] = useState<EventData[]>([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [foraneFilter, setForaneFilter] = useState('All');


    // Hardcoded forane names
    const foraneNames = [
        'Mundakayam',
        'Kumily',
        'Kanjirappally',
        'Anakkara',
        'Erumely',
        'Ponkunnam',
        'Kattappana',
        'Upputhara',
        'Ranny',
        'Pathanamthitta',
        'Velichiyani',
        'Mundiyeruma',
        'Peruvanthanam'
    ];

    useEffect(() => {
        fetchPendingEvents();
    }, [foraneFilter, currentUser]);

    const fetchPendingEvents = async () => {
        try {
            setLoading(true);
            await getUsers();


            // Fetch current user's forane
            if (currentUser) {
                // current user forane state check removed since it is unused
            }

            // Fetch events with forane filter from backend
            const foraneToQuery = foraneFilter !== 'All' ? foraneFilter : undefined;
            const allEvents = await getEvents(undefined, foraneToQuery);
            // Filter for draft events
            const draftEvents = (allEvents as EventData[]).filter(event => !event.isPublic);
            setEvents(draftEvents);
        } catch (error) {
            console.error("Error fetching draft events:", error);
            toast.error("Failed to load draft events");
        } finally {
            setLoading(false);
        }
    };

    // Events are already filtered by forane from backend
    const filteredEvents = events;

    const handleAction = async (eventId: string, status: 'approved' | 'rejected') => {
        if (!eventId) return;
        setActionLoading(eventId);
        try {
            await updateEventStatus(eventId, status);
            toast.success(`Event ${status} successfully`);
            // Remove from list
            setEvents(events.filter(e => e.id !== eventId));
        } catch (error) {
            console.error(`Error marking event as ${status}:`, error);
            toast.error(`Failed to ${status} event`);
        } finally {
            setActionLoading(null);
        }
    };

    if (!isAdminUser) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Access Denied. Admin privileges required.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Approvals</h1>
                <p className="text-gray-500">Review and manage pending event submissions</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Pending Requests</CardTitle>
                        <CardDescription>
                            {events.length} event{events.length !== 1 ? 's' : ''} waiting for approval
                        </CardDescription>
                    </div>
                    <div className="relative min-w-[160px]">
                        <select
                            className="w-full pl-3 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={foraneFilter}
                            onChange={(e) => setForaneFilter(e.target.value)}
                        >
                            <option value="All">All Foranes</option>
                            {foraneNames.map(forane => (
                                <option key={forane} value={forane}>{forane}</option>
                            ))}
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Event Details</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {event.imageUrl ? (
                                                    <ImageWithFallback src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{event.title}</h3>
                                                <p className="text-sm text-gray-500 truncate max-w-[200px]">{event.place}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="uppercase">
                                            {event.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {event.creatorSchoolName}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/events/${event.id}`}>
                                                <Button variant="ghost" size="icon" title="View Details">
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleAction(event.id!, 'approved')}
                                                disabled={actionLoading === event.id}
                                                title="Approve"
                                            >
                                                {actionLoading === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleAction(event.id!, 'rejected')}
                                                disabled={actionLoading === event.id}
                                                title="Reject"
                                            >
                                                {actionLoading === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredEvents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                        No pending events found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
