import { useState } from 'react';
import { Edit, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner@2.0.3';

export function Settings() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@lightsuvara.com',
    phone: '+1 234-567-8900',
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully');
    setIsEditOpen(false);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password changed successfully');
    setIsPasswordOpen(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Admin Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="mb-6">Admin Profile</h3>
        
        <div className="flex items-start gap-8">
          {/* Profile Picture */}
          <div className="text-center">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" alt="Admin" />
              <AvatarFallback className="text-3xl">AU</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-600 mb-2 block">Full Name</Label>
                <p className="font-medium text-gray-900">{profileData.name}</p>
              </div>
              <div>
                <Label className="text-gray-600 mb-2 block">Email Address</Label>
                <p className="font-medium text-gray-900">{profileData.email}</p>
              </div>
              <div>
                <Label className="text-gray-600 mb-2 block">Phone Number</Label>
                <p className="font-medium text-gray-900">{profileData.phone}</p>
              </div>
              <div>
                <Label className="text-gray-600 mb-2 block">Role</Label>
                <p className="font-medium text-gray-900">System Administrator</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#1E40AF] hover:bg-[#1E40AF]/90">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input
                          id="edit-name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email Address</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                          id="edit-phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#1E40AF] hover:bg-[#1E40AF]/90">
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and a new password
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePasswordChange}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsPasswordOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#1E40AF] hover:bg-[#1E40AF]/90">
                        Change Password
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="mb-6">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-gray-600 mb-2 block">System Version</Label>
            <p className="font-medium text-gray-900">v2.1.0</p>
          </div>
          <div>
            <Label className="text-gray-600 mb-2 block">Last Login</Label>
            <p className="font-medium text-gray-900">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <Label className="text-gray-600 mb-2 block">Platform</Label>
            <p className="font-medium text-gray-900">Light Suvara Admin Panel</p>
          </div>
          <div>
            <Label className="text-gray-600 mb-2 block">Status</Label>
            <p className="font-medium text-green-600">● Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
