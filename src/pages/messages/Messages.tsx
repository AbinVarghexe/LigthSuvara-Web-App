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
import { Switch } from "../../components/ui/switch";
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
  sendUpdateNotification,
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
  Smartphone,
} from "lucide-react";
import updateBanner from "../../assets/update_banner.png";

export function Messages() {
  const [audience, setAudience] = useState("public");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<UserData[]>([]);
  const [parishes, setParishes] = useState<UserData[]>([]);

  // Image attachment state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Play Store update state
  const [updateTitle, setUpdateTitle] = useState("New Update Available");
  const [updateMessage, setUpdateMessage] = useState("New update available, update via Play Store");
  const [updateImageFile, setUpdateImageFile] = useState<File | null>(null);
  const [updateImagePreview, setUpdateImagePreview] = useState<string | null>(updateBanner);
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);
  const [uploadingUpdateImage, setUploadingUpdateImage] = useState(false);
  const updateImageInputRef = useRef<HTMLInputElement>(null);
  const [updateNotificationOnly, setUpdateNotificationOnly] = useState(false);

  const handleUpdateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUpdateImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUpdateImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeUpdateImage = () => {
    setUpdateImageFile(null);
    setUpdateImagePreview(null);
    if (updateImageInputRef.current) updateImageInputRef.current.value = "";
  };

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle || !updateMessage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSendingUpdate(true);
    try {
      let imageUrl: string | undefined;
      if (updateImageFile) {
        setUploadingUpdateImage(true);
        imageUrl = await uploadMessageImage(updateImageFile);
        setUploadingUpdateImage(false);
      } else if (updateImagePreview === updateBanner) {
        setUploadingUpdateImage(true);
        const response = await fetch(updateBanner);
        const blob = await response.blob();
        const defaultFile = new File([blob], "update_banner.png", { type: "image/png" });
        imageUrl = await uploadMessageImage(defaultFile);
        setUploadingUpdateImage(false);
      }

      await sendUpdateNotification(updateTitle, updateMessage, imageUrl, updateNotificationOnly);
      toast.success("App Update notification broadcasted successfully");

      // Refresh latest announcement preview
      const broadcasts = await getBroadcasts();
      setLatestAnnouncement(broadcasts.length > 0 ? broadcasts[0] : null);

      // Reset update image to default banner and keep standard text defaults
      setUpdateImageFile(null);
      setUpdateImagePreview(updateBanner);
      if (updateImageInputRef.current) updateImageInputRef.current.value = "";
      setUpdateNotificationOnly(false);
    } catch (error) {
      console.error("Error sending update message:", error);
      toast.error("Failed to send update message");
    } finally {
      setIsSendingUpdate(false);
      setUploadingUpdateImage(false);
    }
  };

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
  const [viewersDialogOpen, setViewersDialogOpen] = useState(false);

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
    const fetchUsers = async () => {
      try {
        const users = await getUsers();
        setSchools(users.filter((u) => u.role === "school"));
        setParishes(users.filter((u) => u.role === "parish"));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
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
        await sendBroadcast(title, message, imageUrl, false);
        toast.success("Broadcast sent successfully");
        // Refresh latest announcement preview
        const broadcasts = await getBroadcasts();
        setLatestAnnouncement(broadcasts.length > 0 ? broadcasts[0] : null);
      } else if (audience === "all") {
        await sendToAll(title, message, imageUrl, false);
        toast.success("Message sent to all users");
      } else if (audience === "specific") {
        if (selectedSchools.length === 0) {
          toast.error("Please select at least one school");
          setIsLoading(false);
          return;
        }
        const unitNames = selectedSchools.map((id) => {
          const s = schools.find((sc) => sc.id === id);
          return (
            s?.schoolname || s?.schoolName || s?.fullName || s?.email || id
          );
        });
        await sendToSpecific(
          title,
          message,
          selectedSchools,
          unitNames,
          imageUrl,
          false,
        );
        toast.success(`Message sent to ${selectedSchools.length} school(s)`);
      }

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

  const handleDelete = async (id: string, audience?: string, groupId?: string) => {
    setDeletingId(id);
    try {
      await deleteNotification(id, audience, groupId);
      if (audience === 'specific' && groupId) {
        setNotifications((prev) => prev.filter((n) => n.groupId !== groupId));
      } else {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
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
          <TabsTrigger value="app-update">
            <Smartphone className="w-4 h-4 mr-2" />
            App Update
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
                    <Label
                      htmlFor="public"
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === "public" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <RadioGroupItem
                        value="public"
                        id="public"
                        className="mt-1"
                      />
                      <div className="grid gap-1.5 flex-1">
                        <span className="font-semibold text-foreground">
                          Public Broadcast
                        </span>
                        <p className="text-sm text-muted-foreground font-normal">
                          Visible to everyone, including guests without an
                          account.
                        </p>
                      </div>
                      <Globe
                        className={`absolute right-4 top-4 w-5 h-5 ${audience === "public" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </Label>

                    <Label
                      htmlFor="all"
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === "all" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <RadioGroupItem value="all" id="all" className="mt-1" />
                      <div className="grid gap-1.5 flex-1">
                        <span className="font-semibold text-foreground">
                          All Users
                        </span>
                        <p className="text-sm text-muted-foreground font-normal">
                          Sent to all registered school accounts and admins.
                        </p>
                      </div>
                      <Users
                        className={`absolute right-4 top-4 w-5 h-5 ${audience === "all" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </Label>

                    <Label
                      htmlFor="specific"
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${audience === "specific" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <RadioGroupItem
                        value="specific"
                        id="specific"
                        className="mt-1"
                      />
                      <div className="grid gap-1.5 flex-1">
                        <span className="font-semibold text-foreground">
                          Specific School
                        </span>
                        <p className="text-sm text-muted-foreground font-normal">
                          Select specific Sunday schools to receive this.
                        </p>
                      </div>
                      <School
                        className={`absolute right-4 top-4 w-5 h-5 ${audience === "specific" ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </Label>
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
                      {selectedSchools.length} school(s) selected
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
                          onClick={(e) => e.stopPropagation()}
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

        {/* App Update Tab */}
        <TabsContent value="app-update" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <form onSubmit={handleSendUpdate} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Play Store Update Notification</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Notify users about a new version of the app on Google Play Store.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="update-title">Notification Title</Label>
                    <Input
                      id="update-title"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      placeholder="e.g., New Update Available"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="update-message">Notification Body</Label>
                    <Textarea
                      id="update-message"
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      placeholder="e.g., New update available, update via Play Store"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Play Store Link</Label>
                    <Input
                      value="https://play.google.com/store/apps/details?id=com.lightsuvara.app"
                      disabled
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      This link is automatically embedded and will open on click.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Attach Image (optional)</Label>
                    {updateImagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={updateImagePreview}
                          alt="Update attachment preview"
                          className="max-h-40 rounded-lg border border-border object-contain"
                        />
                        <button
                          type="button"
                          onClick={removeUpdateImage}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => updateImageInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={updateImageInputRef}
                          onChange={handleUpdateImageSelect}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">Click to upload custom banner image</p>
                      </div>
                    )}
                  </div>

                  {/* Push Notification Only Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50 border-border">
                    <div className="space-y-0.5 max-w-[80%]">
                      <Label htmlFor="update-notification-only-toggle" className="text-sm font-semibold">Send as notification only</Label>
                      <p className="text-xs text-muted-foreground">
                        Sends a push notification to users immediately, but does not display it as a message on their in-app screens or history lists.
                      </p>
                    </div>
                    <Switch
                      id="update-notification-only-toggle"
                      checked={updateNotificationOnly}
                      onCheckedChange={setUpdateNotificationOnly}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSendingUpdate}
                  >
                    {isSendingUpdate ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploadingUpdateImage ? "Uploading image..." : "Sending..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Update Notification
                      </>
                    )}
                  </Button>
                </form>

                {/* Preview Section */}
                <div className="flex flex-col justify-start space-y-4 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8">
                  <h4 className="text-sm font-semibold text-foreground">Notification Preview</h4>
                  <p className="text-xs text-muted-foreground">
                    This is how the push notification will appear on user devices.
                  </p>
                  
                  {/* Phone Notification Drawer Mockup */}
                  <div className="w-full max-w-sm mx-auto bg-black rounded-[32px] p-3 shadow-2xl border-4 border-neutral-800">
                    <div className="bg-neutral-900 rounded-[24px] overflow-hidden p-3 min-h-[220px] text-white flex flex-col justify-between">
                      {/* Top Bar Status */}
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 px-2 pb-2">
                        <span>12:00 PM</span>
                        <div className="flex gap-1.5 items-center">
                          <span className="w-2.5 h-2.5 bg-neutral-400 rounded-sm inline-block"></span>
                        </div>
                      </div>

                      {/* Notification Container */}
                      <div className="bg-neutral-800/90 backdrop-blur-md rounded-2xl p-3 border border-neutral-700/50 flex flex-col gap-2 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
                              <span className="text-[10px] font-bold text-primary">LS</span>
                            </div>
                            <span className="text-[11px] font-medium text-neutral-300">Light Suvara</span>
                          </div>
                          <span className="text-[9px] text-neutral-400">now</span>
                        </div>

                        <div>
                          <h5 className="text-xs font-semibold text-white">{updateTitle}</h5>
                          <p className="text-[11px] text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">{updateMessage}</p>
                        </div>

                        {updateImagePreview && (
                          <div className="mt-1.5 overflow-hidden rounded-lg max-h-24 bg-neutral-950 border border-neutral-700/50">
                            <img src={updateImagePreview} alt="Attached Notification image" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[9px] text-primary font-medium mt-1 pt-1.5 border-t border-neutral-700/40">
                          <Smartphone className="w-3 h-3" />
                          <span>Tap to update via Play Store</span>
                        </div>
                      </div>

                      {/* Bottom indicator */}
                      <div className="w-20 h-1 bg-neutral-600 rounded-full mx-auto mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
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
                            {n.notificationOnly && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30"
                              >
                                Notification Only
                              </Badge>
                            )}
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
                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(n.timestamp)}
                            </div>
                            {n.readBy && n.readBy.length > 0 && (
                              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-medium">
                                <Eye className="w-3 h-3" />
                                Seen by {n.readBy.length}
                              </div>
                            )}
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
                            onClick={() => handleDelete(n.id, n.audience, n.groupId)}
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
                    Sent to Observer(s): {selectedNotification.recipientNames.join(", ")}
                  </p>
                )}
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <p className="text-sm whitespace-pre-wrap">
                {selectedNotification?.body}
              </p>
            </div>
            {selectedNotification?.readBy &&
              selectedNotification.readBy.length > 0 && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Viewed by {selectedNotification.readBy.length} schools
                    </span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-blue-700 dark:text-blue-300 h-auto p-0 font-semibold"
                    onClick={() => setViewersDialogOpen(true)}
                  >
                    View Details
                  </Button>
                </div>
              )}
            {selectedNotification?.imageUrl && (
              <div className="space-y-2 mt-4">
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

      {/* Viewers List Dialog */}
      <Dialog open={viewersDialogOpen} onOpenChange={setViewersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Viewed By</DialogTitle>
            <DialogDescription>
              Schools that have opened this notification
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-2">
            {selectedNotification?.readBy?.map((uid) => {
              const school = schools.find((s) => s.id === uid);
              const parish = !school ? parishes.find((p) => p.id === uid) : undefined;
              const user = school || parish;
              const displayName =
                user?.schoolname ||
                user?.schoolName ||
                user?.fullName ||
                user?.name ||
                user?.email ||
                "Unknown User";
              const name = parish ? `${displayName} (Parish)` : displayName;
              const location = user?.forane || "";

              return (
                <div
                  key={uid}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <School className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    {location && (
                      <p className="text-xs text-muted-foreground truncate">
                        {location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {(!selectedNotification?.readBy ||
              selectedNotification.readBy.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">
                  No schools have viewed this message yet.
                </p>
              )}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setViewersDialogOpen(false)}>Close</Button>
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
