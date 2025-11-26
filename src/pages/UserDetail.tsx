import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  School,
  Shield,
  Calendar,
  MoreVertical,
  Loader2,
  User as UserIcon,
  Trash2,
  UserCog
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { getUser, updateUserRole, deleteUser, getEventsByUser, UserData } from '../services/userService';
import { EventData } from '../services/eventService';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [userEvents, setUserEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      if (!id) return;
      try {
        const [userData, eventsData] = await Promise.all([
          getUser(id),
          getEventsByUser(id)
        ]);
        setUser(userData);
        setUserEvents(eventsData as EventData[]);
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user details");
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndEvents();
  }, [id, navigate]);

  const handleRoleChange = async (newRole: 'admin' | 'school') => {
    if (!user || !user.id) return;
    setActionLoading(true);
    try {
      await updateUserRole(user.id, newRole);
      setUser({ ...user, role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !user.id) return;
    setActionLoading(true);
    try {
      await deleteUser(user.id);
      toast.success('User deleted successfully');
      navigate('/users');
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
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

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/users"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user details and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="w-4 h-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRoleChange(user.role === 'admin' ? 'school' : 'admin')}>
                <UserCog className="w-4 h-4 mr-2" />
                {user.role === 'admin' ? 'Demote to School' : 'Promote to Admin'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user.schoolname || user.schoolName || user.fullName || 'Unnamed User'}
            </h2>
            <div className="flex justify-center mb-6">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${user.role === 'admin'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                {user.role === 'admin' ? (
                  <Shield className="w-3 h-3" />
                ) : (
                  <School className="w-3 h-3" />
                )}
                {user.role === 'admin' ? 'Administrator' : 'School Account'}
              </span>
            </div>

            <div className="space-y-4 text-left pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{user.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined {new Date().toLocaleDateString()}</span> {/* Placeholder for createdAt */}
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Events */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{userEvents.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Public Events</p>
              <p className="text-2xl font-bold text-green-600">
                {userEvents.filter(e => e.isPublic).length}
              </p>
            </div>
          </div>

          {/* Recent Events List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Created Events</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {userEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500">
                        {event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={event.isPublic ? 'Public' : 'Draft'} />
                    <Link
                      to={`/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
              {userEvents.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No events created by this user yet.
                </div>
              )}
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
              This action cannot be undone. This will permanently delete the user account
              and remove their access to the system.
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
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
