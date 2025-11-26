import { useParams, useNavigate, Link } from 'react-router';
import { Calendar, MapPin, School, Edit, Trash2, Globe, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { mockEvents } from '../data/mockData';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event not found</p>
        <Link to="/events">
          <Button className="mt-4">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const handleTogglePublish = () => {
    const newStatus = event.status === 'Public' ? 'Draft' : 'Public';
    toast.success(`Event ${newStatus === 'Public' ? 'published' : 'unpublished'} successfully`);
  };

  const handleDelete = () => {
    toast.success('Event deleted successfully');
    navigate('/events');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/events" className="text-[#3B82F6] hover:underline inline-flex items-center gap-2">
        ← Back to Events
      </Link>

      {/* Event Banner Image */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-80 object-cover"
        />
      </div>

      {/* Event Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1>{event.title}</h1>
              <span className="inline-flex px-3 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {event.category}
              </span>
              <StatusBadge status={event.status} />
            </div>
            
            <div className="flex flex-wrap gap-6 text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(event.eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <School className="w-5 h-5" />
                <span>{event.schoolName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-3">Description</h3>
          <p className="text-gray-700 leading-relaxed">{event.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Link to={`/events/${event.id}/edit`}>
            <Button className="bg-[#1E40AF] hover:bg-[#1E40AF]/90">
              <Edit className="w-4 h-4 mr-2" />
              Edit Event
            </Button>
          </Link>
          <Button variant="outline" onClick={handleTogglePublish}>
            {event.status === 'Public' ? (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event "{event.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
