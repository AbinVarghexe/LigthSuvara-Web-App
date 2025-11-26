import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { mockEvents } from '../data/mockData';
import { toast } from 'sonner@2.0.3';

export function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const event = isEdit ? mockEvents.find((e) => e.id === id) : null;

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    venue: event?.venue || '',
    eventDate: event?.eventDate || '',
    category: event?.category || 'General',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Event saved as draft successfully');
    navigate('/events');
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Event published successfully');
    navigate('/events');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/events" className="text-[#3B82F6] hover:underline inline-flex items-center gap-2">
        ← Back to Events
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="mb-6">{isEdit ? 'Edit Event' : 'Create New Event'}</h2>

        <form className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="h-11"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter event description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <Input
              id="venue"
              type="text"
              placeholder="Enter event venue"
              value={formData.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              className="h-11"
              required
            />
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date & Time *</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleChange('eventDate', e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => handleChange('category', val)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CML">CML</SelectItem>
                  <SelectItem value="Suvara">Suvara</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Event Banner Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#3B82F6] transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-1">
                Drag and drop your image here, or click to browse
              </p>
              <p className="text-gray-500 text-sm">
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </p>
              <input type="file" className="hidden" accept="image/*" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleSaveDraft}
              variant="outline"
              className="px-6"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={handlePublish}
              className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 px-6"
            >
              Publish Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
