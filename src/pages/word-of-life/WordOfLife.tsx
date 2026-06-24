import { useState, useEffect } from "react";
import {
  getWordOfLifeEntries,
  createWordOfLifeEntry,
  updateWordOfLifeEntry,
  deleteWordOfLifeEntry,
  WordOfLifeData,
} from "../../features/word-of-life/services/wordOfLifeService";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X,
  AlertCircle,
  Loader2,
  Search,
  Flame,
  BookOpen,
  Video,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { uploadFile } from "../../lib/upload";

// Helper to get formatted date string for inputs (YYYY-MM-DD)
const formatDateString = (date: Date) => {
  return date.toISOString().split("T")[0];
};

// Helper to get today's date
const getTodayString = () => {
  return formatDateString(new Date());
};

// Helper to get date 7 days from now
const getNextWeekString = () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return formatDateString(nextWeek);
};

// Helper to get YouTube Video ID
const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function WordOfLife() {
  const [entries, setEntries] = useState<WordOfLifeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [listTab, setListTab] = useState<"all" | "active" | "history">("all");

  // Dialog States
  const [entryDialogOpen, setEntryDialogOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

  // Form States
  const [editingEntry, setEditingEntry] = useState<WordOfLifeData | null>(null);
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [endDate, setEndDate] = useState<string>(getNextWeekString());
  
  // YouTube states
  const [isYoutube, setIsYoutube] = useState<boolean>(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  
  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Video Upload states
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Load entries
  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await getWordOfLifeEntries();
      setEntries(data);
      if (data.length > 0) {
        setSelectedEntryId((prev) => prev || data[0].id || null);
      }
    } catch (err) {
      console.error("Error loading word of life entries:", err);
      toast.error("Failed to load Word of Life entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleOpenEntryDialog = (entry?: WordOfLifeData) => {
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedVideoFile(null);
    setVideoPreviewUrl(null);
    if (entry) {
      setEditingEntry(entry);
      setTitle(entry.title || "");
      setNotes(entry.notes || "");
      setExistingImageUrl(entry.imageUrl || null);
      setExistingVideoUrl(entry.videoUrl || null);
      
      const parsedStart = entry.startDate instanceof Timestamp 
        ? entry.startDate.toDate() 
        : new Date(entry.startDate);
      const parsedEnd = entry.endDate instanceof Timestamp 
        ? entry.endDate.toDate() 
        : new Date(entry.endDate);

      setStartDate(formatDateString(parsedStart));
      setEndDate(formatDateString(parsedEnd));

      // Handle youtube url detection
      const ytId = entry.videoUrl ? getYoutubeId(entry.videoUrl) : null;
      if (ytId) {
        setIsYoutube(true);
        setYoutubeUrl(entry.videoUrl || "");
      } else {
        setIsYoutube(false);
        setYoutubeUrl("");
      }
    } else {
      setEditingEntry(null);
      setTitle("");
      setNotes("");
      setStartDate(getTodayString());
      setEndDate(getNextWeekString());
      setExistingImageUrl(null);
      setExistingVideoUrl(null);
      setIsYoutube(false);
      setYoutubeUrl("");
    }
    setEntryDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before or equal to the end date");
      return;
    }

    const hasMedia = selectedFile || existingImageUrl || selectedVideoFile || existingVideoUrl || (isYoutube && youtubeUrl.trim());
    if (!title.trim() && !notes.trim() && !hasMedia) {
      toast.error("Please add a title, verse/notes, an image, or a video/YouTube link to save");
      return;
    }

    setUploading(true);
    try {
      let finalImageUrl = existingImageUrl;
      let finalVideoUrl = isYoutube ? youtubeUrl.trim() : existingVideoUrl;

      if (selectedFile) {
        const path = `word_of_life/${Date.now()}_${selectedFile.name}`;
        finalImageUrl = await uploadFile(selectedFile, path);
      }

      if (isYoutube) {
        finalVideoUrl = youtubeUrl.trim();
      } else if (selectedVideoFile) {
        const path = `word_of_life/videos/${Date.now()}_${selectedVideoFile.name}`;
        finalVideoUrl = await uploadFile(selectedVideoFile, path);
      } else if (existingVideoUrl && getYoutubeId(existingVideoUrl)) {
        // If they toggled youtube off and didn't provide a new file, but there was an existing youtube link, clear it
        finalVideoUrl = null;
      }

      const payload = {
        title: title.trim(),
        notes: notes.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
      };

      let newId = editingEntry?.id;
      if (editingEntry?.id) {
        await updateWordOfLifeEntry(editingEntry.id, payload);
        toast.success("Entry updated successfully");
      } else {
        newId = await createWordOfLifeEntry(payload);
        toast.success("Entry created successfully");
      }

      setEntryDialogOpen(false);
      loadEntries();
      if (newId) {
        setSelectedEntryId(newId);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.message || "Failed to save entry");
    } finally {
      setUploading(false);
    }
  };

  const triggerDeleteConfirm = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteWordOfLifeEntry(deleteTargetId);
      toast.success("Entry deleted successfully");
      setDeleteConfirmOpen(false);
      
      const remaining = entries.filter((e) => e.id !== deleteTargetId);
      setEntries(remaining);
      
      if (selectedEntryId === deleteTargetId) {
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id || null : null);
      }
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete entry");
    }
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "N/A";
    try {
      const d = date instanceof Timestamp ? date.toDate() : new Date(date);
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Check if entry is currently active (today falls between start and end date inclusive)
  const isEntryActive = (entry: WordOfLifeData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = entry.startDate instanceof Timestamp ? entry.startDate.toDate() : new Date(entry.startDate);
    start.setHours(0, 0, 0, 0);

    const end = entry.endDate instanceof Timestamp ? entry.endDate.toDate() : new Date(entry.endDate);
    end.setHours(23, 59, 59, 999);

    return today >= start && today <= end;
  };

  // Filter entries based on search term
  const searchedEntries = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter based on tab selection
  const filteredEntries = searchedEntries.filter((e) => {
    if (listTab === "active") return isEntryActive(e);
    if (listTab === "history") return !isEntryActive(e);
    return true;
  });

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || null;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-emerald-500 animate-pulse" />
            ജീവൻ്റെ വചനം (Word of Life)
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage weekly scripture reading and reflections. Entries automatically transition into history after their end dates.
          </p>
        </div>
        <Button
          onClick={() => handleOpenEntryDialog()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02] text-xs h-9 px-4"
        >
          <Plus className="w-4 h-4" /> Add Weekly Entry
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground text-xs">Loading weekly verses...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-dashed border-border shadow-inner text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Entries Found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            There are no weekly verses or reflections uploaded yet.
          </p>
          <Button onClick={() => handleOpenEntryDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Create First Entry
          </Button>
        </div>
      ) : (
        /* Split Master-Detail Layout */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[65vh]">
          {/* Left Column: Master List Panel */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4 border-r border-border/60 pr-0 md:pr-6">
            {/* List Search Bar */}
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-xl border border-border shadow-sm">
              <Search className="text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-xs"
              />
            </div>

            {/* Active vs History Tab Selectors */}
            <div className="flex bg-muted/65 p-1 rounded-xl gap-1.5 border border-border/40 shrink-0">
              <button
                onClick={() => setListTab("all")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  listTab === "all" ? "bg-background text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({searchedEntries.length})
              </button>
              <button
                onClick={() => setListTab("active")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  listTab === "active" ? "bg-background text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active ({searchedEntries.filter(isEntryActive).length})
              </button>
              <button
                onClick={() => setListTab("history")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  listTab === "history" ? "bg-background text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                History ({searchedEntries.filter((e) => !isEntryActive(e)).length})
              </button>
            </div>

            {/* List View Container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[50vh] pr-1">
              {filteredEntries.map((entry) => {
                const isSelected = entry.id === selectedEntryId;
                const active = isEntryActive(entry);
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntryId(entry.id || null)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex gap-3 items-center group relative overflow-hidden ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-500 dark:text-emerald-50 shadow-md ring-2 ring-emerald-500/20"
                        : active
                        ? "bg-emerald-50/10 border-emerald-500/80 shadow-md shadow-emerald-500/15 hover:bg-emerald-50/20 text-foreground ring-1 ring-emerald-500/10"
                        : "bg-card border-border hover:bg-accent/40 text-foreground"
                    }`}
                  >
                    {/* Active Accent Border Indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500 rounded-r-md" />
                    )}

                    {entry.imageUrl ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-muted relative">
                        <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
                        {entry.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                            <Video className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ) : entry.videoUrl ? (
                      <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0 text-emerald-600">
                        <Video className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0 text-emerald-600">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {formatDate(entry.startDate)} - {formatDate(entry.endDate)}
                        </span>
                        <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          active ? "bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm" : "bg-muted text-muted-foreground"
                        }`}>
                          {active ? "Active" : "History"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold truncate leading-snug">
                        {entry.title || "Weekly Reflections"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 truncate font-normal">
                        {entry.notes || "No additional text summary."}
                      </p>
                    </div>
                  </button>
                );
              })}
              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No matching entries found.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Reader Panel */}
          <div className="md:col-span-7 lg:col-span-8">
            {selectedEntry ? (
              <Card className="border border-border/80 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm h-full flex flex-col">
                <div className="p-6 space-y-6 flex-1 flex flex-col">
                  {/* Detail Panel Controls Header */}
                  <div className="flex justify-between items-start gap-4 border-b border-border/60 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(selectedEntry.startDate)} to {formatDate(selectedEntry.endDate)}
                      </div>
                      {selectedEntry.title && (
                        <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
                          {selectedEntry.title}
                        </h2>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEntryDialog(selectedEntry)}
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => triggerDeleteConfirm(selectedEntry.id!)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Detail Panel Video Content */}
                  {selectedEntry.videoUrl && (
                    <div className="rounded-xl overflow-hidden border border-border shadow-inner bg-black shrink-0 aspect-video">
                      {getYoutubeId(selectedEntry.videoUrl) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${getYoutubeId(selectedEntry.videoUrl)}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full object-contain max-h-[35vh]"
                        />
                      ) : (
                        <video
                          src={selectedEntry.videoUrl}
                          controls
                          className="w-full max-h-[35vh] object-contain"
                          preload="metadata"
                        />
                      )}
                    </div>
                  )}

                  {/* Detail Panel Image Content */}
                  {selectedEntry.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-border shadow-inner max-h-[25vh] bg-muted shrink-0">
                      <img
                        src={selectedEntry.imageUrl}
                        alt={selectedEntry.title || ""}
                        className="w-full h-full object-contain max-h-[25vh]"
                      />
                    </div>
                  )}

                  {/* Detail Panel Verse / Reflection Content */}
                  {selectedEntry.notes ? (
                    <div className="flex-1 space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scripture Verse & reflections</h4>
                      <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/40 p-5 rounded-xl border border-border/50 max-h-[35vh] overflow-y-auto">
                        {selectedEntry.notes}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 border border-dashed rounded-xl text-muted-foreground text-xs">
                      No text summary or reflection verse added for this week.
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full border border-dashed border-border rounded-2xl bg-card/20 text-muted-foreground text-xs py-20">
                Select an entry from the list to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={(open) => !uploading && setEntryDialogOpen(open)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-600" />
              {editingEntry ? "Edit Weekly Verse" : "Add Weekly Verse"}
            </DialogTitle>
            <DialogDescription>
              Upload weekly scripture reflections, quote cards, and scripture verses.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="font-semibold text-sm">Topic Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. വചനം മാംസമായി (Word became flesh)"
                disabled={uploading}
                className="rounded-xl border-border focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="font-semibold text-sm">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={uploading}
                  className="rounded-xl border-border focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="font-semibold text-sm">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={uploading}
                  className="rounded-xl border-border focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 py-1">
              <Switch
                id="youtube-toggle"
                checked={isYoutube}
                onCheckedChange={(checked) => {
                  setIsYoutube(checked);
                  if (checked) {
                    setSelectedVideoFile(null);
                    setVideoPreviewUrl(null);
                  } else {
                    setYoutubeUrl("");
                  }
                }}
                disabled={uploading}
              />
              <Label htmlFor="youtube-toggle" className="font-medium text-xs cursor-pointer flex items-center gap-1">
                Use YouTube Video Link
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Attachment Image (optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer rounded-xl border-border file:bg-emerald-50 dark:file:bg-emerald-950/20 file:text-emerald-600 dark:file:text-emerald-400 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-2"
                />
              </div>
              <div className="space-y-1.5">
                {isYoutube ? (
                  <>
                    <Label htmlFor="youtubeUrl" className="font-semibold text-sm flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-emerald-600" /> YouTube Video Link (optional)
                    </Label>
                    <Input
                      id="youtubeUrl"
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={uploading}
                      className="rounded-xl border-border focus:ring-emerald-500"
                    />
                  </>
                ) : (
                  <>
                    <Label className="font-semibold text-sm flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-emerald-600" /> Attachment Video (optional)
                    </Label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      disabled={uploading}
                      className="cursor-pointer rounded-xl border-border file:bg-emerald-50 dark:file:bg-emerald-950/20 file:text-emerald-600 dark:file:text-emerald-400 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-2"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Image Preview */}
            {(imagePreview || existingImageUrl) && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted border border-border shadow-inner">
                <img
                  src={imagePreview || existingImageUrl || ""}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                    setExistingImageUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Video Preview */}
            {isYoutube ? (
              youtubeUrl && getYoutubeId(youtubeUrl) && (
                <div className="relative w-full rounded-xl overflow-hidden bg-black border border-border shadow-inner aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeId(youtubeUrl)}`}
                    title="YouTube video preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full max-h-[220px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setYoutubeUrl("");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            ) : (
              (videoPreviewUrl || existingVideoUrl) && (
                <div className="relative w-full rounded-xl overflow-hidden bg-black border border-border shadow-inner">
                  <video
                    src={videoPreviewUrl || existingVideoUrl || ""}
                    controls
                    className="w-full max-h-[220px] object-contain"
                    preload="metadata"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVideoFile(null);
                      setVideoPreviewUrl(null);
                      setExistingVideoUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="font-semibold text-sm">Verse, Reflections & Text (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write the scripture verse quote or reflections here..."
                rows={6}
                disabled={uploading}
                className="rounded-xl border-border focus:ring-emerald-500 resize-y whitespace-pre-wrap font-sans text-sm leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)} disabled={uploading} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveEntry} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this weekly verse entry? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExecute} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Delete Permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
