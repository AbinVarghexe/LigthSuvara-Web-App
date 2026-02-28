import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Maximize2,
  X,
  Download,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/common/StatusBadge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  getEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  updateEventStatus,
  EventData,
} from "../../features/events/services/eventService";
import { EventPdfService } from "../../features/events/services/eventPdfService";
import { getUser } from "../../features/users/services/userService";
import { useAuth } from "../../context/AuthContext";

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdminUser, currentUser } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [creatorName, setCreatorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const eventData = (await getEvent(id)) as EventData;
        setEvent(eventData);

        if (eventData.creatorId) {
          try {
            const user = await getUser(eventData.creatorId);
            const name =
              (eventData as any).creatorSchoolName &&
                (eventData as any).creatorSchoolName !== "Admin"
                ? (eventData as any).creatorSchoolName
                : user?.schoolName || user?.schoolname || user?.fullName || "Unknown";
            setCreatorName(name);
          } catch {
            setCreatorName((eventData as any).creatorSchoolName || "Unknown");
          }
        } else {
          setCreatorName((eventData as any).creatorSchoolName || "Unknown");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event details");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  useEffect(() => {
    if (!event || loading) return;
    if (!isAdminUser) {
      const isCreator = currentUser && event.creatorId === currentUser.uid;
      const isApproved = event.status === "approved" || (event.isPublic && !event.status);
      if (!isCreator && !isApproved) {
        toast.error("You are not authorized to view this event.");
        navigate("/events");
      }
    }
  }, [event, loading, isAdminUser, currentUser, navigate]);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    try {
      if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
      const d = new Date(date);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const canEdit = isAdminUser || (currentUser && event?.creatorId === currentUser.uid);

  const handleApprove = async () => {
    if (!event?.id) return;
    setActionLoading(true);
    try {
      await updateEventStatus(event.id, "approved");
      await publishEvent(event.id);
      setEvent({ ...event, status: "approved", isPublic: true });
      toast.success("Event approved and published");
    } catch { toast.error("Failed to approve event"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!event?.id) return;
    setActionLoading(true);
    try {
      await updateEventStatus(event.id, "rejected");
      await unpublishEvent(event.id);
      setEvent({ ...event, status: "rejected", isPublic: false });
      toast.success("Event rejected");
    } catch { toast.error("Failed to reject event"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    setActionLoading(true);
    try {
      await deleteEvent(event.id);
      toast.success("Event deleted successfully");
      navigate("/events");
    } catch {
      toast.error("Failed to delete event");
      setShowDeleteDialog(false);
    } finally { setActionLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!event) return;
    setDownloadingPdf(true);
    try {
      await EventPdfService.generateEventPdf(event);
      toast.success("Event report downloaded");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-2">
        <Link to="/events" className="p-2 hover:bg-accent rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <span>Created on {formatDate((event as any).timestamp)}</span>
            <span>•</span>
            <span className="uppercase">{event.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isAdminUser && (
            <>
              {(event.status === "pending" || event.status === "rejected") && (
                <Button variant="outline" size="sm" onClick={handleApprove} disabled={actionLoading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
              )}
              {(event.status === "pending" || event.status === "approved") && (
                <Button variant="outline" size="sm" onClick={handleReject} disabled={actionLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              )}
            </>
          )}

          {/* Universal Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1" />
            )}
            Download PDF
          </Button>

          {canEdit && (
            <>
              <Link to={`/events/${event.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={actionLoading}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — image + description */}
        <div className="md:col-span-2 space-y-5">
          {/* Image with full-view button */}
          <div className="relative aspect-video w-full bg-gray-100 rounded-xl overflow-hidden group">
            {event.imageUrl ? (
              <>
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setShowFullImage(true)}
                  className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="View full image"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <img
                src="/assets/Logo-Bg-Light.svg"
                alt="Placeholder"
                className="w-full h-full object-cover opacity-80"
              />
            )}
          </div>

          {/* Description */}
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {event.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Right sidebar — event details */}
        <div className="space-y-4">
          <div className="bg-card p-5 rounded-xl shadow-sm border border-border space-y-4">
            <h2 className="text-base font-bold text-foreground">Event Details</h2>

            <DetailRow
              color="blue"
              icon={<Calendar className="w-4 h-4 text-blue-600" />}
              label="Event Date"
              value={formatDate(event.timestamp)}
            />
            <DetailRow
              color="green"
              icon={<Calendar className="w-4 h-4 text-green-600" />}
              label="Created At"
              value={formatDate((event as any).createdAt)}
            />
            {(event as any).updatedAt && (
              <DetailRow
                color="orange"
                icon={<Calendar className="w-4 h-4 text-orange-600" />}
                label="Last Updated"
                value={formatDate((event as any).updatedAt)}
              />
            )}
            <DetailRow
              color="purple"
              icon={<MapPin className="w-4 h-4 text-purple-600" />}
              label="Location"
              value={event.place || "N/A"}
            />
            <DetailRow
              color="orange"
              icon={<User className="w-4 h-4 text-orange-600" />}
              label="Created By"
              value={creatorName || "N/A"}
            />
            <DetailRow
              color="teal"
              icon={<MapPin className="w-4 h-4 text-teal-600" />}
              label="Forane"
              value={(event as any).forane || (event as any).creatorForane || "N/A"}
            />

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Status</span>
              <StatusBadge status={event.isPublic ? "Public" : "Draft"} />
            </div>
          </div>
        </div>
      </div>

      {/* Full image lightbox */}
      {showFullImage && event.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={() => setShowFullImage(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={event.imageUrl}
            alt={event.title}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event "{event.title}".
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
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailRow({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20",
    green: "bg-green-50 dark:bg-green-900/20",
    orange: "bg-orange-50 dark:bg-orange-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
    teal: "bg-teal-50 dark:bg-teal-900/20",
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${bg[color] || "bg-gray-50"}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
