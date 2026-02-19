import { useEffect, useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  sendBroadcast,
  sendToAll,
  sendToSpecific,
  deleteNotification,
  updateNotification,
  uploadMessageImage,
  getBroadcasts,
  subscribeToNotifications,
  NotificationData,
} from "../../features/notifications/services/notificationService";
import { getUsers, UserData } from "../../features/users/services/userService";
import {
  Globe,
  Users,
  School,
  Loader2,
  Send,
  ImagePlus,
  X,
  History,
  Trash2,
  Eye,
  Clock,
  MessageSquare,
  Pencil,
  Megaphone,
} from "lucide-react";

export function Messages() {
  const [audience, setAudience] = useState("public");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<UserData[]>([]);

  // Image attachment state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // History state
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "public" | "allUsers" | "specific"
  >("all");

  // Detail dialog
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationData | null>(null);

  // Edit state
  const [editingNotification, setEditingNotification] =
    useState<NotificationData | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  // Latest announcement state
  const [latestAnnouncement, setLatestAnnouncement] =
    useState<NotificationData | null>(null);
  const [announcementLoading, setAnnouncementLoading] = useState(true);

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (historyFilter === "all") return true;
    const resolved =
      n.audience ||
      (n.recipientId === "public"
        ? "public"
        : n.recipientId === "all"
          ? "all"
          : "specific");
    if (historyFilter === "public") return resolved === "public";
    if (historyFilter === "allUsers") return resolved === "all";
    if (historyFilter === "specific") return resolved === "specific";
    return true;
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const users = await getUsers();
        setSchools(users.filter((u) => u.role === "school"));
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    const fetchLatestAnnouncement = async () => {
      try {
        setAnnouncementLoading(true);
        const broadcasts = await getBroadcasts();
        setLatestAnnouncement(broadcasts.length > 0 ? broadcasts[0] : null);
      } catch (error) {
        console.error("Error fetching latest announcement:", error);
      } finally {
        setAnnouncementLoading(false);
      }
    };
    fetchLatestAnnouncement();
  }, []);

  // Real-time subscription to notification history
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((data) => {
      // Deduplicate: for specific-audience messages keep only one entry per title+timestamp
      const seen = new Set<string>();
      const deduplicated: NotificationData[] = [];
      data.forEach((n) => {
        const key =
          n.audience === "specific"
            ? `${n.title}_${n.timestamp?.seconds || ""}`
            : n.id;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(n);
        }
      });
      setNotifications(deduplicated);
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Rate Limiting Check
    const lastSent = localStorage.getItem("lastNotificationSent");
    if (lastSent) {
      const timeSinceLast = Date.now() - parseInt(lastSent);
      const cooldown = 60000; // 1 minute
      if (timeSinceLast < cooldown) {
        const remaining = Math.ceil((cooldown - timeSinceLast) / 1000);
        toast.error(
          `Please wait ${remaining} seconds before sending another message.`,
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      // Upload image if present
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadMessageImage(imageFile);
        setUploadingImage(false);
      }

      if (audience === "public") {
        await sendBroadcast(title, message, imageUrl);
        toast.success("Broadcast sent successfully");
        // Refresh latest announcement preview
        const broadcasts = await getBroadcasts();
        setLatestAnnouncement(broadcasts.length > 0 ? broadcasts[0] : null);
      } else if (audience === "all") {
        await sendToAll(title, message, imageUrl);
        toast.success("Message sent to all users");
      } else if (audience === "specific") {
        if (selectedSchools.length === 0) {
          toast.error("Please select at least one school");
          setIsLoading(false);
          return;
        }
        const schoolNames = selectedSchools.map((id) => {
          const s = schools.find((sc) => sc.id === id);
          return (
            s?.schoolName || s?.schoolname || s?.fullName || s?.email || id
          );
        });
        await sendToSpecific(
          title,
          message,
          selectedSchools,
          schoolNames,
          imageUrl,
        );
        toast.success(`Message sent to ${selectedSchools.length} schools`);
      }

      // Update Rate Limit Timestamp
      localStorage.setItem("lastNotificationSent", Date.now().toString());

      // Reset form
      setTitle("");
      setMessage("");
      setSelectedSchools([]);
      setAudience("public");
      removeImage();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string, audience?: string) => {
    setDeletingId(id);
    try {
      await deleteNotification(id, audience);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSchool = (schoolId: string) => {
    setSelectedSchools((prev) =>
      prev.includes(schoolId)
        ? prev.filter((id) => id !== schoolId)
        : [...prev, schoolId],
    );
  };

  const openEditDialog = (n: NotificationData) => {
    setEditingNotification(n);
    setEditTitle(n.title);
    setEditBody(n.body);
    setEditImagePreview(n.imageUrl || null);
    setEditImageFile(null);
  };

  const closeEditDialog = () => {
    setEditingNotification(null);
    setEditTitle("");
    setEditBody("");
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editImageInputRef.current) editImageInputRef.current.value = "";
  };

  const handleUpdate = async () => {
    if (!editingNotification) return;
    if (!editTitle || !editBody) {
      toast.error("Title and body are required");
      return;
    }
    setIsUpdating(true);
    try {
      let imageUrl: string | null | undefined =
        editingNotification.imageUrl || null;

      if (editImageFile) {
        imageUrl = await uploadMessageImage(editImageFile);
      } else if (!editImagePreview) {
        imageUrl = null;
      }

      await updateNotification(
        editingNotification.id,
        {
          title: editTitle,
          body: editBody,
          imageUrl,
        },
        editingNotification.audience,
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === editingNotification.id
            ? {
                ...n,
                title: editTitle,
                body: editBody,
                imageUrl: imageUrl || undefined,
              }
            : n,
        ),
      );
      toast.success("Message updated successfully");
      closeEditDialog();
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "N/A";
    try {
      const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return date.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const getAudienceBadge = (n: NotificationData) => {
    const resolvedAudience =
      n.audience ||
      (n.recipientId === "public"
        ? "public"
        : n.recipientId === "all"
          ? "all"
          : "specific");

    if (resolvedAudience === "public") {
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
        >
          <Globe className="w-3 h-3 mr-1" /> Public
        </Badge>
      );
    }
    if (resolvedAudience === "all") {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
        >
          <Users className="w-3 h-3 mr-1" /> All Users
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
      >
        <School className="w-3 h-3 mr-1" /> Specific
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Send updates and announcements to your users
          </p>
        </div>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">
            <Send className="w-4 h-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Message History
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSend} className="space-y-8">
                {/* Audience Selection */}
                <div className="space-y-4">
                  <Label className="text-base">Target Audience</Label>
                  <RadioGroup
                    value={audience}
                    onValueChange={setAudience}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === "public" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <RadioGroupItem
                        value="public"
                        id="public"
                        className="mt-1"
                      />
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="public"
                          className="font-semibold cursor-pointer"
                        >
                          Public Broadcast
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Visible to everyone, including guests without an
                          account.
                        </p>
                      </div>
                      <Globe
                        className={`absolute right-4 top-4 w-5 h-5 ${audience === "public" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>

                    <div
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === "all" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <RadioGroupItem value="all" id="all" className="mt-1" />
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="all"
                          className="font-semibold cursor-pointer"
                        >
                          All Users
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Sent to all registered school accounts and admins.
                        </p>
                      </div>
                      <Users
                        className={`absolute right-4 top-4 w-5 h-5 ${audience === "all" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>

                    <div
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === "specific" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <RadioGroupItem
                        value="specific"
                        id="specific"
                        className="mt-1"
                      />
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor="specific"
                          className="font-semibold cursor-pointer"
                        >
                          Specific Schools
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Select specific schools to receive this message.
                        </p>
                      </div>
                      <School
                        className={`absolute right-4 top-4 w-5 h-5 ${audience === "specific" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                  </RadioGroup>
                </div>

                {/* School Picker */}
                {audience === "specific" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                    <Label>Select Schools</Label>
                    <div className="border border-border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 bg-muted/50">
                      {schools.map((school) => (
                        <div
                          key={school.id}
                          className="flex items-center space-x-2 bg-background p-3 rounded-md border border-border"
                        >
                          <Checkbox
                            id={school.id}
                            checked={selectedSchools.includes(school.id)}
                            onCheckedChange={() => toggleSchool(school.id)}
                          />
                          <Label
                            htmlFor={school.id}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            {school.schoolname ||
                              school.schoolName ||
                              school.fullName ||
                              school.email}
                          </Label>
                        </div>
                      ))}
                      {schools.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No schools found.
                        </p>
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

                  {/* Image Attachment */}
                  <div className="space-y-2">
                    <Label>Attach Image (optional)</Label>
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Attachment preview"
                          className="max-h-48 rounded-lg border border-border object-contain"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {imageFile?.name}
                        </p>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={imageInputRef}
                          onChange={handleImageSelect}
                        />
                        <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">
                          Click to attach an image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
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
                        {uploadingImage ? "Uploading image..." : "Sending..."}
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

          {/* Latest Announcement Preview */}
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Latest Announcement</CardTitle>
              </div>
              <CardDescription>
                Most recent public broadcast from announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {announcementLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : latestAnnouncement ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {latestAnnouncement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {latestAnnouncement.body}
                  </p>
                  {latestAnnouncement.imageUrl && (
                    <img
                      src={latestAnnouncement.imageUrl}
                      alt="Announcement image"
                      className="max-h-40 rounded-lg border border-border object-contain mt-2"
                    />
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(latestAnnouncement.timestamp)}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No announcements yet. Send your first public broadcast above.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-4 space-y-3">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Message History</CardTitle>
                  <CardDescription>
                    {filteredNotifications.length} of {notifications.length}{" "}
                    messages
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Live
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={historyFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHistoryFilter("all")}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                <Button
                  variant={historyFilter === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHistoryFilter("public")}
                  className="h-7 text-xs gap-1"
                >
                  <Globe className="w-3 h-3" /> Public Broadcast
                </Button>
                <Button
                  variant={historyFilter === "allUsers" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHistoryFilter("allUsers")}
                  className="h-7 text-xs gap-1"
                >
                  <Users className="w-3 h-3" /> All Users
                </Button>
                <Button
                  variant={historyFilter === "specific" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHistoryFilter("specific")}
                  className="h-7 text-xs gap-1"
                >
                  <School className="w-3 h-3" /> Specific Schools
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">
                    {notifications.length === 0
                      ? "No messages yet"
                      : "No messages match this filter"}
                  </p>
                  <p className="text-sm">
                    {notifications.length === 0
                      ? "Messages you send will appear here."
                      : "Try selecting a different filter."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 sm:p-5 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">
                              {n.title}
                            </h3>
                            {getAudienceBadge(n)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {n.body}
                          </p>
                          {n.imageUrl && (
                            <div className="pt-1">
                              <Badge
                                variant="outline"
                                className="text-xs gap-1"
                              >
                                <ImagePlus className="w-3 h-3" /> Image attached
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(n.timestamp)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedNotification(n)}
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => openEditDialog(n)}
                            title="Edit message"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(n.id, n.audience)}
                            disabled={deletingId === n.id}
                            title="Delete"
                          >
                            {deletingId === n.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(selectedNotification?.timestamp)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              {selectedNotification && getAudienceBadge(selectedNotification)}
              {selectedNotification?.audience === "specific" &&
                selectedNotification.recipientNames && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Sent to: {selectedNotification.recipientNames.join(", ")}
                  </p>
                )}
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <p className="text-sm whitespace-pre-wrap">
                {selectedNotification?.body}
              </p>
            </div>
            {selectedNotification?.imageUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attached Image</Label>
                <img
                  src={selectedNotification.imageUrl}
                  alt="Message attachment"
                  className="w-full max-h-80 object-contain rounded-lg border border-border bg-muted/30"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog
        open={!!editingNotification}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Update the title, body, or image of this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Message title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-body">Body</Label>
              <Textarea
                id="edit-body"
                className="min-h-[120px]"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="Message body"
              />
            </div>
            <div className="space-y-2">
              <Label>Image (optional)</Label>
              {editImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={editImagePreview}
                    alt="Edit preview"
                    className="max-h-48 rounded-lg border border-border object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeEditImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => editImageInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={editImageInputRef}
                    onChange={handleEditImageSelect}
                  />
                  <ImagePlus className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">
                    Click to attach an image
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={closeEditDialog}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
