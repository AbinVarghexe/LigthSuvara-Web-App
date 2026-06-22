import { useState, useEffect } from "react";
import {
  getClassResources,
  saveClassResources,
  ClassResources,
  Chapter,
  ResourceItem,
  getYouTubeId,
  isDriveLink,
} from "../../features/video-resources/services/videoResourceService";
import {
  FileText,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Youtube,
  Play,
  X,
  AlertCircle,
  FolderDot,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFile } from "../../lib/upload";

export function VideoResources() {
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [resourcesData, setResourcesData] = useState<ClassResources | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Dialog States
  const [chapterDialogOpen, setChapterDialogOpen] = useState<boolean>(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

  // Form States
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>("");

  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [resourceTitle, setResourceTitle] = useState<string>("");
  const [resourceUrl, setResourceUrl] = useState<string>("");
  const [resourceType, setResourceType] = useState<ResourceItem["type"]>("link");
  
  // File Upload states
  const [sourceMode, setSourceMode] = useState<"link" | "file">("link");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "chapter" | "resource";
    chapterId: string;
    resourceId?: string;
  } | null>(null);

  // Video Player Modal State
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Fetch data when class changes
  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      try {
        const data = await getClassResources(selectedClass);
        setResourcesData(data);
      } catch (err) {
        console.error("Error loading resources:", err);
        toast.error("Failed to load class resources");
      } finally {
        setLoading(false);
      }
    };
    loadResources();
  }, [selectedClass]);

  // Smart URL parser to guess resource type
  useEffect(() => {
    if (!resourceUrl || sourceMode === "file") return;
    const isYt = getYouTubeId(resourceUrl);
    if (isYt) {
      setResourceType("youtube");
    } else if (isDriveLink(resourceUrl)) {
      if (resourceUrl.includes("presentation") || resourceUrl.toLowerCase().includes("ppt")) {
        setResourceType("document");
      } else {
        setResourceType("drive");
      }
    } else if (resourceUrl.toLowerCase().endsWith(".pdf") || resourceUrl.toLowerCase().endsWith(".docx") || resourceUrl.toLowerCase().endsWith(".pptx")) {
      setResourceType("document");
    }
  }, [resourceUrl, sourceMode]);

  // Handle saving data to Firestore
  const persistChanges = async (updatedData: ClassResources) => {
    try {
      await saveClassResources(updatedData);
      setResourcesData(updatedData);
      toast.success("Changes saved successfully!");
    } catch (err) {
      console.error("Error saving changes:", err);
      toast.error("Failed to save changes to Firestore");
    }
  };

  // Chapter operations
  const handleOpenChapterDialog = (chapter?: Chapter) => {
    if (chapter) {
      setEditingChapter(chapter);
      setChapterTitle(chapter.title);
    } else {
      setEditingChapter(null);
      setChapterTitle("");
    }
    setChapterDialogOpen(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterTitle.trim()) {
      toast.error("Chapter Title is required");
      return;
    }

    if (!resourcesData) return;

    let updatedChapters = [...resourcesData.chapters];

    if (editingChapter) {
      // Edit existing
      updatedChapters = updatedChapters.map((c) =>
        c.id === editingChapter.id ? { ...c, title: chapterTitle } : c
      );
    } else {
      // Add new
      const newChapter: Chapter = {
        id: `ch_${Date.now()}`,
        title: chapterTitle,
        resources: [],
      };
      updatedChapters.push(newChapter);
    }

    const updatedData = { ...resourcesData, chapters: updatedChapters };
    await persistChanges(updatedData);
    setChapterDialogOpen(false);
  };

  // Resource operations
  const handleOpenResourceDialog = (chapterId: string, resource?: ResourceItem) => {
    setActiveChapterId(chapterId);
    setSourceMode("link");
    setSelectedFile(null);
    setUploading(false);
    if (resource) {
      setEditingResource(resource);
      setResourceTitle(resource.title);
      setResourceUrl(resource.url);
      setResourceType(resource.type);
    } else {
      setEditingResource(null);
      setResourceTitle("");
      setResourceUrl("");
      setResourceType("link");
    }
    setResourceDialogOpen(true);
  };

  const handleSaveResource = async () => {
    if (!resourceTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    if (sourceMode === "link" && !resourceUrl.trim()) {
      toast.error("URL is required");
      return;
    }

    if (sourceMode === "file" && !selectedFile && !editingResource) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!resourcesData) return;

    let finalUrl = resourceUrl.trim();
    let finalType = resourceType;

    try {
      if (sourceMode === "file" && selectedFile) {
        setUploading(true);
        const path = `video_resources/class_${selectedClass}/${Date.now()}_${selectedFile.name}`;
        finalUrl = await uploadFile(selectedFile, path);
        
        // Auto deduce type from file properties
        if (selectedFile.type.startsWith("image/") || selectedFile.name.toLowerCase().endsWith(".pdf") || selectedFile.name.toLowerCase().endsWith(".ppt") || selectedFile.name.toLowerCase().endsWith(".pptx") || selectedFile.name.toLowerCase().endsWith(".doc") || selectedFile.name.toLowerCase().endsWith(".docx")) {
          finalType = "document";
        } else {
          finalType = "link";
        }
      } else if (sourceMode === "link") {
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = `https://${finalUrl}`;
        }
      }

      const updatedChapters = resourcesData.chapters.map((ch) => {
        if (ch.id !== activeChapterId) return ch;

        let updatedResources = [...ch.resources];
        if (editingResource) {
          // Edit existing resource
          updatedResources = updatedResources.map((r) =>
            r.id === editingResource.id
              ? { ...r, title: resourceTitle, url: finalUrl, type: finalType }
              : r
          );
        } else {
          // Add new resource
          const newResource: ResourceItem = {
            id: `res_${Date.now()}`,
            title: resourceTitle,
            url: finalUrl,
            type: finalType,
          };
          updatedResources.push(newResource);
        }
        return { ...ch, resources: updatedResources };
      });

      const updatedData = { ...resourcesData, chapters: updatedChapters };
      await persistChanges(updatedData);
      setResourceDialogOpen(false);
    } catch (error: any) {
      console.error("Upload/Save error:", error);
      toast.error(error?.message || "Failed to upload file/save resource");
    } finally {
      setUploading(false);
    }
  };

  // Delete Confirmations
  const triggerDeleteConfirm = (type: "chapter" | "resource", chapterId: string, resourceId?: string) => {
    setDeleteTarget({ type, chapterId, resourceId });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!deleteTarget || !resourcesData) return;

    let updatedChapters = [...resourcesData.chapters];

    if (deleteTarget.type === "chapter") {
      updatedChapters = updatedChapters.filter((c) => c.id !== deleteTarget.chapterId);
    } else if (deleteTarget.type === "resource" && deleteTarget.resourceId) {
      updatedChapters = updatedChapters.map((ch) => {
        if (ch.id !== deleteTarget.chapterId) return ch;
        return {
          ...ch,
          resources: ch.resources.filter((r) => r.id !== deleteTarget.resourceId),
        };
      });
    }

    const updatedData = { ...resourcesData, chapters: updatedChapters };
    await persistChanges(updatedData);
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // Render resource icon / styling helper
  const getResourceDetails = (type: ResourceItem["type"]) => {
    switch (type) {
      case "youtube":
        return {
          icon: <Youtube className="w-5 h-5 text-red-500" />,
          bgColor: "bg-red-500/10 border-red-500/20",
          textColor: "text-red-600 dark:text-red-400",
          label: "YouTube Video",
        };
      case "drive":
        return {
          icon: <FolderDot className="w-5 h-5 text-amber-500" />,
          bgColor: "bg-amber-500/10 border-amber-500/20",
          textColor: "text-amber-600 dark:text-amber-400",
          label: "Google Drive Folder",
        };
      case "document":
        return {
          icon: <FileText className="w-5 h-5 text-blue-500" />,
          bgColor: "bg-blue-500/10 border-blue-500/20",
          textColor: "text-blue-600 dark:text-blue-400",
          label: "PPT / Document",
        };
      case "link":
      default:
        return {
          icon: <ExternalLink className="w-5 h-5 text-emerald-500" />,
          bgColor: "bg-emerald-500/10 border-emerald-500/20",
          textColor: "text-emerald-600 dark:text-emerald-400",
          label: "Web Link",
        };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl animate-fade-in">
      {/* Header section with Glassmorphic design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Video & Reference Resources
          </h1>
          <p className="text-muted-foreground mt-1">
            Access, view, and manage study materials, video content, and documentation for students.
          </p>
        </div>
      </div>

      {/* Class buttons selector grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground/80">Select Class</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((classNum) => {
            const isSelected = selectedClass === classNum;
            return (
              <button
                key={classNum}
                onClick={() => setSelectedClass(classNum)}
                className={`
                  h-14 rounded-xl border font-bold text-base transition-all duration-300 flex flex-col items-center justify-center cursor-pointer shadow-sm
                  ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary scale-105 shadow-primary/25 shadow-md"
                      : "bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-accent/50 hover:scale-102"
                  }
                `}
              >
                <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Class</span>
                <span className="text-lg leading-tight">{classNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-border my-6" />

      {/* Main Contents */}
      {loading ? (
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded-lg w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse bg-card border-border">
                <CardHeader className="h-20 bg-muted/30 rounded-t-xl"></CardHeader>
                <CardContent className="h-32"></CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-semibold">
                Class {selectedClass}
              </span>
              <span>Course Chapters</span>
            </h2>

            <Button
              size="sm"
              onClick={() => handleOpenChapterDialog()}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" /> Add Chapter
            </Button>
          </div>

          {resourcesData?.chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-dashed border-border shadow-inner text-center">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                There are no chapters or educational links added for Class {selectedClass} yet.
              </p>
              <Button onClick={() => handleOpenChapterDialog()} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create First Chapter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {resourcesData?.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group/chapter"
                >
                  <div className="flex justify-between items-start border-b border-border/60 pb-3">
                    <div>
                      <h3 className="text-xl font-bold text-foreground/90">{chapter.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {chapter.resources.length} resource{chapter.resources.length === 1 ? "" : "s"} available
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenChapterDialog(chapter)}
                        className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => triggerDeleteConfirm("chapter", chapter.id)}
                        className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Resource cards list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {chapter.resources.map((resource) => {
                      const details = getResourceDetails(resource.type);
                      const ytId = getYouTubeId(resource.url);

                      return (
                        <div
                          key={resource.id}
                          className="relative flex flex-col justify-between border border-border/80 rounded-xl bg-card/40 hover:bg-accent/10 hover:border-primary/20 transition-all duration-300 group/card p-4 hover:shadow-sm"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${details.bgColor} ${details.textColor}`}
                              >
                                {details.label}
                              </span>

                              <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenResourceDialog(chapter.id, resource)}
                                  className="p-1 text-muted-foreground hover:text-primary rounded-md hover:bg-accent"
                                  title="Edit Resource"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => triggerDeleteConfirm("resource", chapter.id, resource.id)}
                                  className="p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-accent"
                                  title="Delete Resource"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* YouTube Thumbnail Preview */}
                            {resource.type === "youtube" && ytId ? (
                              <div
                                onClick={() => setActiveVideoId(ytId)}
                                className="relative aspect-video w-full rounded-lg overflow-hidden group/thumb cursor-pointer shadow bg-black"
                              >
                                <img
                                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                                  alt={resource.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105 opacity-90 group-hover/thumb:opacity-100"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/thumb:bg-black/45 transition-colors">
                                  <div className="p-2.5 bg-primary/95 text-primary-foreground rounded-full shadow-lg scale-90 group-hover/thumb:scale-100 transition-transform duration-300">
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            <h4 className="font-semibold text-foreground leading-snug break-words">
                              {resource.title}
                            </h4>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%]">
                              {details.icon}
                              {resource.url.replace(/https?:\/\/(www\.)?/, "").substring(0, 20)}...
                            </span>

                            {resource.type === "youtube" && ytId ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs font-medium text-primary hover:bg-primary/10 gap-1"
                                  onClick={() => setActiveVideoId(ytId)}
                                >
                                  Watch <Play className="w-3.5 h-3.5 fill-current" />
                                </Button>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-accent"
                                  title="Open in YouTube"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            ) : (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                              >
                                Open File <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => handleOpenResourceDialog(chapter.id)}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-primary/40 rounded-xl bg-card/20 hover:bg-accent/5 transition-all text-muted-foreground hover:text-primary min-h-[160px] cursor-pointer"
                    >
                      <Plus className="w-8 h-8 mb-2" />
                      <span className="font-medium text-sm">Add Resource Link</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingChapter ? "Edit Chapter Title" : "Create New Chapter"}</DialogTitle>
            <DialogDescription>
              Provide a name for the chapter. You can add files and YouTube videos inside this chapter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chapterTitle" className="text-right">
                Title
              </Label>
              <Input
                id="chapterTitle"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. Chapter 1: Story of Creation"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChapter}>Save Chapter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={(open) => !uploading && setResourceDialogOpen(open)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource Material" : "Add Resource Material"}</DialogTitle>
            <DialogDescription>
              Link a YouTube video, a Google Drive folder, a PowerPoint slide, or upload a document directly from your device.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resourceTitle" className="text-right">
                Title
              </Label>
              <Input
                id="resourceTitle"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="e.g. Action Song / PPT"
                className="col-span-3"
                disabled={uploading}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Source</Label>
              <div className="col-span-3 flex gap-2">
                <Button
                  type="button"
                  variant={sourceMode === "link" ? "default" : "outline"}
                  onClick={() => setSourceMode("link")}
                  className="flex-1"
                  disabled={uploading}
                >
                  Web Link
                </Button>
                <Button
                  type="button"
                  variant={sourceMode === "file" ? "default" : "outline"}
                  onClick={() => setSourceMode("file")}
                  className="flex-1"
                  disabled={uploading}
                >
                  Upload File
                </Button>
              </div>
            </div>

            {sourceMode === "link" ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="resourceUrl" className="text-right">
                    URL / Link
                  </Label>
                  <Input
                    id="resourceUrl"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://youtu.be/... or drive link"
                    className="col-span-3"
                    disabled={uploading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="resourceType" className="text-right">
                    Type
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={resourceType}
                      onValueChange={(value: any) => setResourceType(value)}
                      disabled={uploading}
                    >
                      <SelectTrigger id="resourceType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube Video</SelectItem>
                        <SelectItem value="drive">Google Drive Link</SelectItem>
                        <SelectItem value="document">PPT / Document</SelectItem>
                        <SelectItem value="link">Web Link</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-primary" /> System auto-detects type from URLs on paste.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="fileUpload" className="text-right mt-2">
                  File
                </Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="fileUpload"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="cursor-pointer"
                    disabled={uploading}
                  />
                  {editingResource && !selectedFile && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Currently linked: <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">View uploaded file</a>. Select a new file only if you want to replace it.
                    </p>
                  )}
                  {selectedFile && (
                    <p className="text-[11px] text-muted-foreground">
                      Selected file size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSaveResource} disabled={uploading}>
              {uploading ? "Uploading file..." : "Save Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExecute}>
              Delete Permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom YouTube Player Modal */}
      <AnimatePresence>
        {activeVideoId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-border shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveVideoId(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* YouTube IFrame Embed */}
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
