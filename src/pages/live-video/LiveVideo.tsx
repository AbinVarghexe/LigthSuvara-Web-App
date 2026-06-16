import { useState, useEffect } from "react";
import {
    Loader2,
    Save,
    Radio,
    AlertCircle,
    Calendar,
    Clock,
    Play,
    Bell,
    Send,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import {
    getLiveVideoConfig,
    saveLiveVideoConfig,
    LiveVideoConfig,
} from "../../features/app-control/services/appControlService";
import { getYouTubeId } from "../../features/video-resources/services/videoResourceService";
import { sendLiveStreamNotification } from "../../features/notifications/services/notificationService";


export function LiveVideo() {
    const [liveConfig, setLiveConfig] = useState<LiveVideoConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Push notification states
    const [notifTitle, setNotifTitle] = useState("");
    const [notifBody, setNotifBody] = useState("Tune in now to watch our live broadcast!");
    const [sendingNotif, setSendingNotif] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await getLiveVideoConfig();
                setLiveConfig(config);
            } catch (error) {
                console.error("Error fetching live video config:", error);
                toast.error("Failed to load Live Video configuration");
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // Sync notification title when liveConfig is fetched or its title changes
    useEffect(() => {
        if (liveConfig?.title) {
            setNotifTitle(liveConfig.title);
        }
    }, [liveConfig?.title]);

    const handleSave = async () => {
        if (!liveConfig) return;
        setSaving(true);
        try {
            await saveLiveVideoConfig(liveConfig);
            toast.success("Live Video configuration saved successfully!");
        } catch (error) {
            console.error("Error saving live video config:", error);
            toast.error("Failed to save Live Video configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleSendNotification = async () => {
        if (!liveConfig) return;
        if (!notifTitle.trim() || !notifBody.trim()) {
            toast.error("Notification title and message body cannot be empty");
            return;
        }
        setSendingNotif(true);
        try {
            await sendLiveStreamNotification(notifTitle.trim(), notifBody.trim(), liveConfig.url);
            toast.success("Push notification broadcasted successfully!");
        } catch (error) {
            console.error("Error sending live stream notification:", error);
            toast.error("Failed to send push notification");
        } finally {
            setSendingNotif(false);
        }
    };


    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const ytId = liveConfig?.url ? getYouTubeId(liveConfig.url) : null;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Radio className="w-8 h-8 text-red-500 animate-pulse" />
                        Live Video Configuration
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure YouTube livestream settings, scheduler dates/times, and visibility parameters.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="hover:scale-105 transition-transform shadow-md">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Stream Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-border bg-card/45">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                                Stream Status & Information
                            </CardTitle>
                            <CardDescription>
                                Set title, toggle stream status, and manage the stream URL.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-accent/15 border-accent/25">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">Live Stream Active</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Toggle to show or hide the live stream banner on the mobile home screen.
                                    </p>
                                </div>
                                <Switch 
                                    id="is-live" 
                                    checked={liveConfig?.isLive || false}
                                    onCheckedChange={(checked: boolean) => setLiveConfig(prev => prev ? { ...prev, isLive: checked } : null)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="live-title">Stream Title / Label</Label>
                                <Input 
                                    id="live-title"
                                    value={liveConfig?.title || ""} 
                                    onChange={(e) => setLiveConfig(prev => prev ? { ...prev, title: e.target.value } : null)}
                                    placeholder="e.g. Holy Mass Live Broadcast"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="live-url">YouTube Link / URL</Label>
                                <Input 
                                    id="live-url"
                                    value={liveConfig?.url || ""} 
                                    onChange={(e) => setLiveConfig(prev => prev ? { ...prev, url: e.target.value } : null)}
                                    placeholder="https://www.youtube.com/watch?v=... or channel link"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border bg-card/45">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Schedule Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure start/end dates and times for the livestream banner visibility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 border rounded-xl p-4 bg-background/30 border-border/60">
                                <h3 className="font-semibold text-sm text-foreground/90 flex items-center gap-1.5 border-b pb-2">
                                    <Clock className="w-4 h-4 text-emerald-500" />
                                    Start Stream Schedule
                                </h3>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={liveConfig?.startDate || ""}
                                            onChange={(e) => setLiveConfig(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                                            className="w-full bg-background"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                                        <Input
                                            id="start-time"
                                            type="time"
                                            value={liveConfig?.startTime || ""}
                                            onChange={(e) => setLiveConfig(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                                            className="w-full bg-background"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 border rounded-xl p-4 bg-background/30 border-border/60">
                                <h3 className="font-semibold text-sm text-foreground/90 flex items-center gap-1.5 border-b pb-2">
                                    <Clock className="w-4 h-4 text-red-500" />
                                    End Stream Schedule
                                </h3>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="end-date" className="text-xs">End Date</Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            value={liveConfig?.endDate || ""}
                                            onChange={(e) => setLiveConfig(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                                            className="w-full bg-background"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="end-time" className="text-xs">End Time</Label>
                                        <Input
                                            id="end-time"
                                            type="time"
                                            value={liveConfig?.endTime || ""}
                                            onChange={(e) => setLiveConfig(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                                            className="w-full bg-background"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-sm border-border bg-card/45">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Play className="w-5 h-5 text-primary" />
                                Stream Video Preview
                            </CardTitle>
                            <CardDescription>
                                Live preview of the configured YouTube link.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center pb-6">
                            {liveConfig?.url && ytId ? (
                                <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow bg-black">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${ytId}`}
                                        title="Live stream preview"
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl border-border w-full min-h-[200px] bg-background/20 text-muted-foreground">
                                    <AlertCircle className="w-12 h-12 mb-3 opacity-40 text-primary" />
                                    <h4 className="font-semibold text-sm">No Active Video Preview</h4>
                                    <p className="text-xs max-w-[200px] mt-1">
                                        Enter a valid YouTube URL to view the live preview stream.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border bg-card/45 border-yellow-500/30">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bell className="w-5 h-5 text-yellow-500 animate-pulse" />
                                Send Push Notification
                            </CardTitle>
                            <CardDescription>
                                Broadcast a push notification regarding this live stream to all mobile users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-6">
                            <div className="space-y-2">
                                <Label htmlFor="notif-title">Notification Title</Label>
                                <Input
                                    id="notif-title"
                                    value={notifTitle}
                                    onChange={(e) => setNotifTitle(e.target.value)}
                                    placeholder="e.g. Holy Mass Live Broadcast"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notif-body">Notification Message</Label>
                                <Input
                                    id="notif-body"
                                    value={notifBody}
                                    onChange={(e) => setNotifBody(e.target.value)}
                                    placeholder="e.g. Tune in now to watch our live broadcast!"
                                />
                            </div>
                            <Button 
                                onClick={handleSendNotification} 
                                disabled={sendingNotif || !liveConfig?.url} 
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {sendingNotif ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Notification
                                    </>
                                )}
                            </Button>
                            {!liveConfig?.url && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Configure a YouTube URL first to enable notifications.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
