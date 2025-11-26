import { useParams, useNavigate, Link } from 'react-router';
import { Mail, Phone, School, Trash2, KeyRound, UserCog } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { StatusBadge } from '../components/StatusBadge';
import { mockUsers, mockEvents } from '../data/mockData';
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

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Link to="/users">
          <Button className="mt-4">Back to Users</Button>
        </Link>
      </div>
    );
  }

  const userEvents = mockEvents.filter((e) => e.createdBy === user.id);

  const handleDelete = () => {
    toast.success('User deleted successfully');
    navigate('/users');
  };

  const handleChangeRole = () => {
    toast.success('User role changed successfully');
  };

  const handleResetPassword = () => {
    toast.success('Password reset email sent successfully');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/users" className="text-[#3B82F6] hover:underline inline-flex items-center gap-2">
        ← Back to Users
      </Link>

      {/* User Profile Banner */}
      <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] h-32 rounded-xl"></div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 -mt-16 relative">
        <div className="flex items-start gap-6 mb-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2>{user.name}</h2>
              <StatusBadge status={user.role} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-5 h-5" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-5 h-5" />
                <span>{user.phone}</span>
              </div>
              {user.schoolName && (
                <div className="flex items-center gap-2 text-gray-600">
                  <School className="w-5 h-5" />
                  <span>{user.schoolName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Button onClick={handleChangeRole} className="bg-[#1E40AF] hover:bg-[#1E40AF]/90">
            <UserCog className="w-4 h-4 mr-2" />
            Change Role
          </Button>
          <Button variant="outline" onClick={handleResetPassword}>
            <KeyRound className="w-4 h-4 mr-2" />
            Reset Password
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user account for "{user.name}".
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

      {/* Events Created by User */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="mb-4">Events Created ({userEvents.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Title</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Event Date</th>
              </tr>
            </thead>
            <tbody>
              {userEvents.length > 0 ? (
                userEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link to={`/events/${event.id}`} className="text-[#1E40AF] hover:underline">
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
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No events created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
