import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    User,
    Globe,
    FileText,
    Edit,
    Trash2,
    Loader2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { getEvent, deleteEvent, publishEvent, unpublishEvent, updateEventStatus, EventData } from '../../features/events/services/eventService';
import { useAuth } from '../../context/AuthContext';

export function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdminUser } = useAuth();
    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            try {
                const eventData = await getEvent(id);
                setEvent(eventData as EventData);
            } catch (error) {
                console.error("Error fetching event:", error);
                toast.error("Failed to load event details");
                navigate('/events');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id, navigate]);

    const handleApprove = async () => {
        if (!event || !event.id) return;
        setActionLoading(true);
        try {
            await updateEventStatus(event.id, 'approved');
            await publishEvent(event.id);
            setEvent({ ...event, status: 'approved', isPublic: true });
            toast.success('Event approved and published');
        } catch (error) {
            console.error("Error approving event:", error);
            toast.error("Failed to approve event");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!event || !event.id) return;
        setActionLoading(true);
        try {
            await updateEventStatus(event.id, 'rejected');
            await unpublishEvent(event.id);
            setEvent({ ...event, status: 'rejected', isPublic: false });
            toast.success('Event rejected');
        } catch (error) {
            console.error("Error rejecting event:", error);
            toast.error("Failed to reject event");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event || !event.id) return;
        setActionLoading(true);
        try {
            await deleteEvent(event.id);
            toast.success('Event deleted successfully');
            navigate('/events');
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("Failed to delete event");
            setShowDeleteDialog(false);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    to="/events"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>Created on {event.timestamp ? new Date((event.timestamp as any).seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                        <span>•</span>
                        <span className="uppercase">{event.category}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdminUser && (
                        <>
                            {(event.status === 'pending' || event.status === 'rejected') && (
                                <Button
                                    variant="outline"
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                            )}
                            {(event.status === 'pending' || event.status === 'approved') && (
                                <Button
                                    variant="outline"
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            )}
                        </>
                    )}

                    <Link to={`/events/${event.id}/edit`}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={actionLoading}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image */}
                    <div className="aspect-video w-full bg-gray-100 rounded-xl overflow-hidden">
                        {event.imageUrl ? (
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image Available
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Description</h2>
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {event.description}
                        </p>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-semibold mb-4">Event Details</h2>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Date & Time</p>
                                    <p className="text-sm text-gray-600">
                                        {event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <MapPin className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Location</p>
                                    <p className="text-sm text-gray-600">{event.place}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <User className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Created By</p>
                                    <p className="text-sm text-gray-600">{event.creatorSchoolName}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">Status</span>
                                    <StatusBadge status={event.isPublic ? 'Public' : 'Draft'} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event
                            "{event.title}" and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
