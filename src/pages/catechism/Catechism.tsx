import { useState, useEffect } from "react";
import {
  getCatechismHours,
  createCatechismHour,
  updateCatechismHour,
  deleteCatechismHour,
  CatechismHourData,
} from "../../features/catechism/services/catechismService";
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
  BookOpen,
  Eye,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { uploadFile } from "../../lib/upload";

// Helper to get next Saturday's date
const getNextSaturday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
  return targetDate.toISOString().split("T")[0];
};

export function Catechism() {
  const [entries, setEntries] = useState<CatechismHourData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [listTab, setListTab] = useState<"all" | "active" | "history">("all");

  // Dialog States
  const [entryDialogOpen, setEntryDialogOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState<boolean>(false);

  // Form States
  const [editingEntry, setEditingEntry] = useState<CatechismHourData | null>(null);
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>(getNextSaturday());
  
  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<CatechismHourData | null>(null);

  // Load entries
  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await getCatechismHours();
      setEntries(data);
    } catch (err) {
      console.error("Error loading catechism hours:", err);
      toast.error("Failed to load Catechism Hour entries");
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

  const handleOpenEntryDialog = (entry?: CatechismHourData) => {
    setSelectedFile(null);
    setImagePreview(null);
    if (entry) {
      setEditingEntry(entry);
      setTitle(entry.title || "");
      setNotes(entry.notes || "");
      setExistingImageUrl(entry.imageUrl || null);
      
      const parsedDate = entry.date instanceof Timestamp 
        ? entry.date.toDate() 
        : new Date(entry.date);
      setTargetDate(parsedDate.toISOString().split("T")[0]);
    } else {
      setEditingEntry(null);
      setTitle("");
      setNotes("");
      setTargetDate(getNextSaturday());
      setExistingImageUrl(null);
    }
    setEntryDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!targetDate) {
      toast.error("Please select a target Saturday date");
      return;
    }

    if (!title.trim() && !notes.trim() && !selectedFile && !existingImageUrl) {
      toast.error("Please add a title, notes, or an image to save");
      return;
    }

    setUploading(true);
    try {
      let finalImageUrl = existingImageUrl;

      if (selectedFile) {
        const path = `catechism_hours/${Date.now()}_${selectedFile.name}`;
        finalImageUrl = await uploadFile(selectedFile, path);
      }

      const payload = {
        title: title.trim(),
        notes: notes.trim(),
        date: new Date(targetDate),
        imageUrl: finalImageUrl,
      };

      if (editingEntry?.id) {
        await updateCatechismHour(editingEntry.id, payload);
        toast.success("Entry updated successfully");
      } else {
        await createCatechismHour(payload);
        toast.success("Entry created successfully");
      }

      setEntryDialogOpen(false);
      loadEntries();
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
      await deleteCatechismHour(deleteTargetId);
      toast.success("Entry deleted successfully");
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      loadEntries();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete entry");
    }
  };

  const handleOpenPreview = (entry: CatechismHourData) => {
    setPreviewEntry(entry);
    setPreviewDialogOpen(true);
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "N/A";
    try {
      const d = date instanceof Timestamp ? date.toDate() : new Date(date);
      return d.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Check if entry is currently active (target Saturday date is today or in the future)
  const isEntryActive = (entry: CatechismHourData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = entry.date instanceof Timestamp ? entry.date.toDate() : new Date(entry.date);
    target.setHours(23, 59, 59, 999);
    return today <= target;
  };

  // Filter based on search term
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

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8 max-w-7xl">
      {/* Header section with Glassmorphic design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Catechism Hour - വിശ്വാസപരിശീലന മണിക്കൂർ 
          </h1>
          <p className="text-muted-foreground">
            Catechism Hour - Upload weekly study material, images, and text notes for Saturdays.
          </p>
        </div>
        <Button
          onClick={() => handleOpenEntryDialog()}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Entry
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border w-full sm:max-w-md shadow-sm">
          <Search className="text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search weekly topics or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
          />
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-muted/65 p-1 rounded-xl gap-1 border border-border/40 shrink-0">
          <button
            onClick={() => setListTab("all")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              listTab === "all" ? "bg-background text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({searchedEntries.length})
          </button>
          <button
            onClick={() => setListTab("active")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              listTab === "active" ? "bg-background text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({searchedEntries.filter(isEntryActive).length})
          </button>
          <button
            onClick={() => setListTab("history")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              listTab === "history" ? "bg-background text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History ({searchedEntries.filter((e) => !isEntryActive(e)).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground text-sm">Loading weekly notes...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-dashed border-border shadow-inner text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Entries Found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            There are no weekly study materials uploaded yet in this category.
          </p>
          <Button onClick={() => handleOpenEntryDialog()} className="bg-blue-600 hover:bg-blue-700">
            Create First Entry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => {
            const active = isEntryActive(entry);
            return (
              <Card key={entry.id} className={`group overflow-hidden border-2 bg-card hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col justify-between relative ${
                active 
                  ? "border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 ring-2 ring-blue-500/20 scale-[1.01]" 
                  : "border-border/80"
              }`}>
                {active && (
                  <div className="absolute top-0 right-0 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-bl-2xl z-10 flex items-center gap-1.5 shadow-md uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </div>
                )}
                <div>
                  {entry.imageUrl ? (
                    <div className="aspect-video w-full overflow-hidden bg-muted relative">
                      <img
                        src={entry.imageUrl}
                        alt={entry.title || ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                      <BookOpen className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(entry.date)}
                      </div>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        active ? "bg-blue-600 text-white dark:bg-blue-500 shadow-sm" : "bg-muted text-muted-foreground"
                      }`}>
                        {active ? "Active" : "History"}
                      </span>
                    </div>
                    {entry.title && (
                      <CardTitle className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {entry.title}
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed break-words whitespace-pre-wrap">
                      {entry.notes}
                    </p>
                  </CardContent>
                </div>

                <CardContent className="pt-0 pb-4 border-t border-border/50 mt-auto flex items-center justify-between gap-2 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenPreview(entry)}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> View Details
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEntryDialog(entry)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => triggerDeleteConfirm(entry.id!)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={(open) => !uploading && setEntryDialogOpen(open)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              {editingEntry ? "Edit Weekly Material" : "Add Weekly Material"}
            </DialogTitle>
            <DialogDescription>
              Upload study notes, summary topics, and reference images for Saturday Catechism Hour.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="font-semibold text-sm">Topic Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. പ്രാർത്ഥനയുടെ ശക്തി (Power of Prayer)"
                disabled={uploading}
                className="rounded-xl border-border focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="targetDate" className="font-semibold text-sm">Target Saturday Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={uploading}
                  className="rounded-xl border-border focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Attachment Image (optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer rounded-xl border-border file:bg-blue-50 dark:file:bg-blue-950/20 file:text-blue-600 dark:file:text-blue-400 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-2"
                />
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

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="font-semibold text-sm">Study Notes & Text Summary (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write study guide summary, references, or text notes here..."
                rows={6}
                disabled={uploading}
                className="rounded-xl border-border focus:ring-blue-500 resize-y whitespace-pre-wrap font-sans text-sm leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)} disabled={uploading} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveEntry} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : "Save Material"}
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
              Are you sure you want to delete this weekly entry? This action is permanent and cannot be undone.
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

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl">
          {previewEntry && (
            <>
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <Calendar className="w-4 h-4" />
                  {formatDate(previewEntry.date)}
                </div>
                {previewEntry.title && (
                  <DialogTitle className="text-2xl font-bold tracking-tight leading-tight">
                    {previewEntry.title}
                  </DialogTitle>
                )}
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {previewEntry.imageUrl && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border shadow-sm">
                    <img
                      src={previewEntry.imageUrl}
                      alt={previewEntry.title || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {previewEntry.notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Study Material & Notes</h4>
                    <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/40 p-5 rounded-2xl border border-border/60">
                      {previewEntry.notes}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="border-t border-border/40 pt-4 mt-2">
                <Button onClick={() => setPreviewDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Close Preview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
