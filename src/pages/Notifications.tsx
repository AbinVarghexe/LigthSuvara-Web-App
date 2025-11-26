import { useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { mockNotifications, schools } from '../data/mockData';
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

export function Notifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState('Public');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSchoolToggle = (school: string) => {
    setSelectedSchools((prev) =>
      prev.includes(school)
        ? prev.filter((s) => s !== school)
        : [...prev, school]
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification sent successfully');
    setTitle('');
    setBody('');
    setAudienceType('Public');
    setSelectedSchools([]);
  };

  const handleDelete = () => {
    toast.success('Notification deleted successfully');
    setDeleteId(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Notification</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>

        {/* Create Notification Tab */}
        <TabsContent value="create">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h3 className="mb-6">Send New Notification</h3>
            
            <form onSubmit={handleSend} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">Message Body *</Label>
                <Textarea
                  id="body"
                  placeholder="Enter notification message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              {/* Audience Selector */}
              <div className="space-y-4">
                <Label>Audience *</Label>
                <RadioGroup value={audienceType} onValueChange={setAudienceType}>
                  <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="Public" id="public" />
                    <Label htmlFor="public" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Public Announcement</p>
                        <p className="text-sm text-gray-600">
                          Broadcast to all as a public announcement
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="All" id="all" />
                    <Label htmlFor="all" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">All Users</p>
                        <p className="text-sm text-gray-600">
                          Send to all registered users' notifications
                        </p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="Specific" id="specific" className="mt-1" />
                    <Label htmlFor="specific" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium mb-3">Specific Schools</p>
                        {audienceType === 'Specific' && (
                          <div className="space-y-2 mt-2">
                            {schools.map((school) => (
                              <div key={school} className="flex items-center space-x-2">
                                <Checkbox
                                  id={school}
                                  checked={selectedSchools.includes(school)}
                                  onCheckedChange={() => handleSchoolToggle(school)}
                                />
                                <label
                                  htmlFor={school}
                                  className="text-sm text-gray-700 cursor-pointer"
                                >
                                  {school}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Send Button */}
              <div className="pt-4">
                <Button type="submit" className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 px-8">
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="mb-4">Notification History</h3>
            
            <div className="space-y-3">
              {mockNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base">{notif.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          notif.type === 'Public'
                            ? 'bg-green-100 text-green-800'
                            : notif.type === 'All'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {notif.type}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{notif.body}</p>
                      {notif.targets && (
                        <p className="text-gray-500 text-xs mb-2">
                          Sent to: {notif.targets.join(', ')}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs">
                        Sent: {new Date(notif.sentTime).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(notif.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification from history?
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
