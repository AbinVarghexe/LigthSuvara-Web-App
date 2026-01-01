import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { sendBroadcast, sendToAll, sendToSpecific } from '../../features/notifications/services/notificationService';
import { getUsers, UserData } from '../../features/users/services/userService';
import { Globe, Users, School, Loader2, Send } from 'lucide-react';

export function Messages() {
    const [audience, setAudience] = useState('public');
    const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [schools, setSchools] = useState<UserData[]>([]);

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const users = await getUsers();
                setSchools(users.filter(u => u.role === 'school'));
            } catch (error) {
                console.error("Error fetching schools:", error);
            }
        };
        fetchSchools();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Rate Limiting Check
        const lastSent = localStorage.getItem('lastNotificationSent');
        if (lastSent) {
            const timeSinceLast = Date.now() - parseInt(lastSent);
            const cooldown = 60000; // 1 minute
            if (timeSinceLast < cooldown) {
                const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
                toast.error(`Please wait ${remaining} seconds before sending another message.`);
                return;
            }
        }

        setIsLoading(true);
        try {
            if (audience === 'public') {
                await sendBroadcast(title, message);
                toast.success('Broadcast sent successfully');
            } else if (audience === 'all') {
                await sendToAll(title, message);
                toast.success('Message sent to all users');
            } else if (audience === 'specific') {
                if (selectedSchools.length === 0) {
                    toast.error('Please select at least one school');
                    setIsLoading(false);
                    return;
                }
                await sendToSpecific(title, message, selectedSchools);
                toast.success(`Message sent to ${selectedSchools.length} schools`);
            }

            // Update Rate Limit Timestamp
            localStorage.setItem('lastNotificationSent', Date.now().toString());

            // Reset form
            setTitle('');
            setMessage('');
            setSelectedSchools([]);
            setAudience('public');

        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSchool = (schoolId: string) => {
        setSelectedSchools(prev =>
            prev.includes(schoolId)
                ? prev.filter(id => id !== schoolId)
                : [...prev, schoolId]
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                    <p className="text-muted-foreground mt-1">Send updates and announcements to your users</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSend} className="space-y-8">
                        {/* Audience Selection */}
                        <div className="space-y-4">
                            <Label className="text-base">Target Audience</Label>
                            <RadioGroup value={audience} onValueChange={setAudience} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === 'public' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <RadioGroupItem value="public" id="public" className="mt-1" />
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="public" className="font-semibold cursor-pointer">Public Broadcast</Label>
                                        <p className="text-sm text-muted-foreground">Visible to everyone, including guests without an account.</p>
                                    </div>
                                    <Globe className={`absolute right-4 top-4 w-5 h-5 ${audience === 'public' ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>

                                <div className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <RadioGroupItem value="all" id="all" className="mt-1" />
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="all" className="font-semibold cursor-pointer">All Users</Label>
                                        <p className="text-sm text-muted-foreground">Sent to all registered school accounts and admins.</p>
                                    </div>
                                    <Users className={`absolute right-4 top-4 w-5 h-5 ${audience === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>

                                <div className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === 'specific' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                    <RadioGroupItem value="specific" id="specific" className="mt-1" />
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="specific" className="font-semibold cursor-pointer">Specific Schools</Label>
                                        <p className="text-sm text-muted-foreground">Select specific schools to receive this message.</p>
                                    </div>
                                    <School className={`absolute right-4 top-4 w-5 h-5 ${audience === 'specific' ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                            </RadioGroup>
                        </div>

                        {/* School Picker (Only visible when 'specific' is selected) */}
                        {audience === 'specific' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                                <Label>Select Schools</Label>
                                <div className="border border-border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 bg-muted/50">
                                    {schools.map((school) => (
                                        <div key={school.id} className="flex items-center space-x-2 bg-background p-3 rounded-md border border-border">
                                            <Checkbox
                                                id={school.id}
                                                checked={selectedSchools.includes(school.id)}
                                                onCheckedChange={() => toggleSchool(school.id)}
                                            />
                                            <Label htmlFor={school.id} className="flex-1 cursor-pointer font-normal">
                                                {school.schoolname || school.schoolName || school.fullName || school.email}
                                            </Label>
                                        </div>
                                    ))}
                                    {schools.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-2">No schools found.</p>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground text-right">
                                    {selectedSchools.length} schools selected
                                </p>
                            </div>
                        )}

                        {/* Message Content */}
                        <div className="space-y-6 pt-4 border-t border-border">
                            <div className="space-y-2">
                                <Label htmlFor="title">Message Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Important Update: Sunday School Exam"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message Body</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Type your message here..."
                                    className="min-h-[150px]"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 min-w-[150px]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
