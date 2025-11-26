import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, Edit, Trash2, Plus, Globe, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StatusBadge } from '../components/StatusBadge';
import { mockEvents, categories, statuses } from '../data/mockData';
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
} from '../components/ui/alert-dialog';

export function Events() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || event.category === category;
    const matchesStatus = status === 'All' || event.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleTogglePublish = (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Public' ? 'Draft' : 'Public';
    toast.success(`Event ${newStatus === 'Public' ? 'published' : 'unpublished'} successfully`);
  };

  const handleDelete = () => {
    toast.success('Event deleted successfully');
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((stat) => (
                <SelectItem key={stat} value={stat}>
                  {stat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Image</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Title</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Created By</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Event Date</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/events/${event.id}`} className="text-[#1E40AF] hover:underline font-medium">
                      {event.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {event.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="py-3 px-4 text-gray-700">{event.schoolName}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(event.eventDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleTogglePublish(event.id, event.status)}
                      >
                        {event.status === 'Public' ? (
                          <FileText className="w-4 h-4 text-gray-600" />
                        ) : (
                          <Globe className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      <Link to={`/events/${event.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setDeleteId(event.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Add Button */}
      <Link to="/events/new">
        <Button className="fixed bottom-8 right-8 h-14 px-6 bg-[#1E40AF] hover:bg-[#1E40AF]/90 rounded-full shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Event
        </Button>
      </Link>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
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
  );
}
