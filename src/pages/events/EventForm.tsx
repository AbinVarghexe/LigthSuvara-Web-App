import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Calendar, Image as ImageIcon, Loader2, MapPin, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { createEvent, getEvent, updateEvent, EventData } from '../../features/events/services/eventService';
import { getUser } from '../../features/users/services/userService';
import { useAuth } from '../../context/AuthContext';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

// ... (imports)

export function EventForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser, isAdminUser } = useAuth(); // Get isAdminUser
    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<Omit<EventData, 'date'> & { date: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const event = await getEvent(id) as EventData;
                if (event) {
                    reset({
                        title: event.title,
                        description: event.description,
                        place: event.place,
                        date: event.date ? new Date((event.date as any).seconds ? (event.date as any).seconds * 1000 : event.date).toISOString().split('T')[0] : '',
                        category: event.category,
                        isPublic: event.isPublic
                    });
                    if (event.imageUrl) {
                        setImagePreview(event.imageUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching event:", error);
                toast.error("Failed to load event details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [id, reset]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: any) => {
        if (!currentUser) {
            toast.error("You must be logged in to create an event");
            return;
        }

        setIsLoading(true);
        try {
            // Fetch user details to get school name and forane
            const userDetails = await getUser(currentUser.uid);
            const schoolName = userDetails?.schoolName || userDetails?.schoolname || userDetails?.fullName || 'Unknown';
            const forane = userDetails?.forane;

            // Prepare event data
            const eventData: EventData = {
                title: data.title,
                description: data.description,
                place: data.place,
                date: new Date(data.date),
                category: data.category,
                isPublic: data.isPublic || false,
                status: isAdminUser ? 'approved' : 'pending', // Set status based on role
                creatorId: currentUser.uid,
                creatorSchoolName: schoolName,
                ...(forane ? { creatorForane: forane } : {}),
                ...(imagePreview ? { imageUrl: imagePreview } : {})
            };

            if (id) {
                // If editing, keep existing status unless admin changes it (logic could be refined)
                // For now, let's assume editing doesn't reset status to pending for admins, 
                // but maybe for users it should? 
                // Let's keep it simple: if admin, approved. If user, pending (re-review).
                await updateEvent(id, eventData);
                toast.success('Event updated successfully');
            } else {
                await createEvent(eventData);
                if (isAdminUser) {
                    toast.success('Event created successfully');
                } else {
                    toast.success('Event submitted for review');
                }
            }
            navigate('/events');
        } catch (error) {
            console.error("Error saving event:", error);
            toast.error("Failed to save event");
        } finally {
            setIsLoading(false);
        }
    };

    // ... (loading check)

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    to="/events"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {id ? 'Edit Event' : 'Create New Event'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Fill in the details below to {id ? 'update the' : 'create a new'} event
                    </p>
                </div>
            </div>

            {!isAdminUser && (
                <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Approval Required</AlertTitle>
                    <AlertDescription>
                        Events submitted by school accounts require admin approval before they become visible to the public.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Info Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold border-b border-gray-100 pb-4">
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                {...register('title', { required: 'Title is required' })}
                                placeholder="e.g., Annual Sunday School Day"
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                onValueChange={(value: string) => setValue('category', value as 'cml' | 'suvara')}
                                defaultValue={watch('category')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cml">CML</SelectItem>
                                    <SelectItem value="suvara">Suvara</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="date"
                                    type="date"
                                    className="pl-10"
                                    {...register('date', { required: 'Date is required' })}
                                />
                            </div>
                            {errors.date && (
                                <p className="text-sm text-red-500">{errors.date.message as string}</p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="place">Venue / Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="place"
                                    className="pl-10"
                                    placeholder="e.g., St. Mary's Church Hall"
                                    {...register('place', { required: 'Location is required' })}
                                />
                            </div>
                            {errors.place && (
                                <p className="text-sm text-red-500">{errors.place.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter detailed event description..."
                                className="min-h-[120px]"
                                {...register('description', { required: 'Description is required' })}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Media Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-lg font-semibold border-b border-gray-100 pb-4">
                        Event Media
                    </h2>

                    <div className="space-y-4">
                        <Label>Event Image</Label>
                        <div className="flex items-center gap-6">
                            <div className="relative w-40 h-40 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group hover:border-blue-400 transition-colors">
                                {imagePreview ? (
                                    <>
                                        <ImageWithFallback
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-xs font-medium">Change Image</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Click to upload</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <div className="flex-1 text-sm text-gray-500">
                                <p className="font-medium text-gray-700 mb-1">Upload Guidelines</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Recommended size: 1200x630px</li>
                                    <li>Max file size: 5MB</li>
                                    <li>Supported formats: JPG, PNG, WEBP</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link to="/events">
                        <Button type="button" variant="outline" className="px-6">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        className="px-8 bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {id ? 'Update Event' : 'Create Event'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
