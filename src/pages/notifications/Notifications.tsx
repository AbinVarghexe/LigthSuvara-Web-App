import { useEffect, useState } from 'react';
import { Bell, Globe, School, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getNotifications } from '../../features/notifications/services/notificationService';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [visibleCount, setVisibleCount] = useState(4);

    // Fetch notification history on component mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 4);
    };

    const handleReset = () => {
        setVisibleCount(4);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loadingHistory ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.slice(0, visibleCount).map((notif) => (
                                <div key={notif.id} className="p-6 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-foreground">{notif.title}</h3>
                                        <span className="text-xs text-muted-foreground">
                                            {notif.timestamp ? new Date(notif.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm mb-4">{notif.body}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={notif.isBroadcast ? "default" : "secondary"}
                                                className="gap-1.5"
                                            >
                                                {notif.isBroadcast ? (
                                                    <>
                                                        <Globe className="w-3 h-3" />
                                                        Broadcast
                                                    </>
                                                ) : (
                                                    <>
                                                        <School className="w-3 h-3" />
                                                        Specific
                                                    </>
                                                )}
                                            </Badge>
                                            {!notif.isBroadcast && notif.recipientId !== 'all' && (
                                                <span className="text-xs text-muted-foreground">
                                                    To: {notif.recipientId}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                                    <p>No notifications sent yet</p>
                                </div>
                            )}
                            
                            {notifications.length > 5 && (
                                <div className="p-4 flex justify-center bg-muted/20">
                                    {visibleCount < notifications.length ? (
                                        <Button variant="default" onClick={handleShowMore} className="gap-2 px- py-1 rounded-full">
                                            Show More
                                            <ChevronDown className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button variant="default" onClick={handleReset} className="gap-2 px-2 py-1 rounded-full">
                                            Show Less
                                            <ChevronUp className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
