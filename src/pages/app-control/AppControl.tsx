import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import {
    Loader2,
    Save,
    Image as ImageIcon,
    Plus,
    Trash2,
    Edit2,
    Type,
    Layout as LayoutIcon,
    Phone,
    FileText,
    ExternalLink,
    Play,
    X,
    AlertCircle,
    FolderDot,
    Film,
    Music,
    HelpCircle,
    Presentation,
    GraduationCap,
    Youtube,
    BookOpen,
    FolderOpen,
    ArrowUp,
    ArrowDown,
    Radio,
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
import { Textarea } from "../../components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
    getLoginScreenConfig,
    saveLoginScreenConfig,
    LoginScreenConfig,
    CarouselItem,
} from "../../features/app-control/services/appControlService";
import {
    getSectionResources,
    saveSectionResources,
    getResourceSections,
    saveResourceSections,
    ResourceSection,
    SectionResources,
    Chapter,
    ResourceItem,
    getYouTubeId,
    isDriveLink,
    seedAllClassResources,
} from "../../features/video-resources/services/videoResourceService";
import { uploadFile } from "../../lib/upload";

export function AppControl() {
    const [loginConfig, setLoginConfig] = useState<LoginScreenConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"login" | "resources">("login");

    // Carousel Dialog State
    const [isCarouselDialogOpen, setIsCarouselDialogOpen] = useState(false);
    const [editingCarouselIndex, setEditingCarouselIndex] = useState<number | null>(null);
    const [carouselForm, setCarouselForm] = useState<CarouselItem>({
        name: "",
        role: "",
        label: "",
        message: "",
        image: "",
    });

    // Resource Sections (Top-level Buttons) states
    const [sections, setSections] = useState<ResourceSection[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [loadingSections, setLoadingSections] = useState<boolean>(true);
    
    // Section Dialog States
    const [sectionDialogOpen, setSectionDialogOpen] = useState<boolean>(false);
    const [editingSection, setEditingSection] = useState<ResourceSection | null>(null);
    const [sectionTitle, setSectionTitle] = useState<string>("");
    const [sectionIcon, setSectionIcon] = useState<string>("GraduationCap");
    const [sectionColor, setSectionColor] = useState<string>("#3B82F6");
    const [sectionDeleteConfirmOpen, setSectionDeleteConfirmOpen] = useState<boolean>(false);
    const [sectionToDelete, setSectionToDelete] = useState<ResourceSection | null>(null);

    // Resources Management States
    const [resourcesData, setResourcesData] = useState<SectionResources | null>(null);
    const [loadingResources, setLoadingResources] = useState<boolean>(false);

    // Dialog States
    const [chapterDialogOpen, setChapterDialogOpen] = useState<boolean>(false);
    const [resourceDialogOpen, setResourceDialogOpen] = useState<boolean>(false);
    const [resourceDeleteConfirmOpen, setResourceDeleteConfirmOpen] = useState<boolean>(false);

    // Chapter Form States
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [chapterTitle, setChapterTitle] = useState<string>("");

    // Resource Form States
    const [activeChapterId, setActiveChapterId] = useState<string>("");
    const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
    const [resourceTitle, setResourceTitle] = useState<string>("");
    const [resourceUrl, setResourceUrl] = useState<string>("");
    const [resourceType, setResourceType] = useState<"document" | "youtube" | "drive" | "link" | "video" | "audio" | "pdf" | "ppt" | "image" | "quiz">("link");
    const [customColor, setCustomColor] = useState<string>("#3B82F6");
    const [sourceMode, setSourceMode] = useState<"link" | "file">("link");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadingResource, setUploadingResource] = useState<boolean>(false);

    const [resourceDeleteTarget, setResourceDeleteTarget] = useState<{
        type: "chapter" | "resource";
        chapterId: string;
        resourceId?: string;
    } | null>(null);

    // Video Player Modal State
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

    const AVAILABLE_ICONS = [
        { name: "GraduationCap", label: "Graduation Cap" },
        { name: "BookOpen", label: "Book Open" },
        { name: "Youtube", label: "YouTube" },
        { name: "Music", label: "Music" },
        { name: "Film", label: "Video/Film" },
        { name: "FileText", label: "Document" },
        { name: "FolderDot", label: "Folder" },
        { name: "HelpCircle", label: "Help/Quiz" },
        { name: "Heart", label: "Heart" },
        { name: "Trophy", label: "Trophy" },
        { name: "Calendar", label: "Calendar" },
        { name: "Info", label: "Info" },
        { name: "Play", label: "Play Button" },
        { name: "Bookmark", label: "Bookmark" },
        { name: "MapPin", label: "Location" },
        { name: "Image", label: "Gallery/Image" },
    ];

    const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
        const IconComponent = (LucideIcons as any)[name];
        if (!IconComponent) {
            return <HelpCircle className={className} style={style} />;
        }
        return <IconComponent className={className} style={style} />;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const login = await getLoginScreenConfig();
                setLoginConfig(login);
                await seedAllClassResources();
            } catch (error) {
                console.error("Error fetching app control data:", error);
                toast.toast ? toast.toast({ description: "Failed to load configuration" }) : toast.error("Failed to load configuration");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch resource sections
    useEffect(() => {
        if (activeTab !== "resources") return;
        const fetchSections = async () => {
            setLoadingSections(true);
            try {
                const data = await getResourceSections();
                setSections(data);
                if (data.length > 0 && !selectedSectionId) {
                    setSelectedSectionId(data[0].id);
                }
            } catch (error) {
                console.error("Error loading sections:", error);
                toast.error("Failed to load resource buttons");
            } finally {
                setLoadingSections(false);
            }
        };
        fetchSections();
    }, [activeTab]);

    // Fetch resources for selected section
    useEffect(() => {
        if (activeTab !== "resources" || !selectedSectionId) return;
        const loadResources = async () => {
            setLoadingResources(true);
            try {
                const data = await getSectionResources(selectedSectionId);
                setResourcesData(data);
            } catch (err) {
                console.error("Error loading resources:", err);
                toast.error("Failed to load section resources");
            } finally {
                setLoadingResources(false);
            }
        };
        loadResources();
    }, [selectedSectionId, activeTab]);

    // Persist resources changes
    const persistResourcesChanges = async (updatedData: SectionResources) => {
        try {
            await saveSectionResources(updatedData);
            setResourcesData(updatedData);
            toast.success("Resource changes saved successfully!");
        } catch (err) {
            console.error("Error saving resources:", err);
            toast.error("Failed to save resources to Firestore");
        }
    };

    // Section Button CRUD operations
    const handleOpenSectionDialog = (section?: ResourceSection) => {
        if (section) {
            setEditingSection(section);
            setSectionTitle(section.title);
            setSectionIcon(section.icon);
            setSectionColor(section.customColor || "#3B82F6");
        } else {
            setEditingSection(null);
            setSectionTitle("");
            setSectionIcon("GraduationCap");
            setSectionColor("#3B82F6");
        }
        setSectionDialogOpen(true);
    };

    const handleSaveSection = async () => {
        if (!sectionTitle.trim()) {
            toast.error("Button Label is required");
            return;
        }

        let updatedSections = [...sections];
        if (editingSection) {
            updatedSections = updatedSections.map((s) =>
                s.id === editingSection.id
                    ? {
                          ...s,
                          title: sectionTitle,
                          icon: sectionIcon,
                          customColor: sectionColor,
                      }
                    : s
            );
        } else {
            const newId = `custom_section_${Date.now()}`;
            const newSection: ResourceSection = {
                id: newId,
                title: sectionTitle,
                icon: sectionIcon,
                customColor: sectionColor,
                order: sections.length > 0 ? Math.max(...sections.map((s) => s.order)) + 1 : 1,
            };
            updatedSections.push(newSection);
            setSelectedSectionId(newId);
        }

        try {
            await saveResourceSections(updatedSections);
            setSections(updatedSections);
            toast.success("Mobile resource buttons updated successfully!");
            setSectionDialogOpen(false);
        } catch (error) {
            console.error("Error saving sections:", error);
            toast.error("Failed to save mobile resource buttons");
        }
    };

    const handleMoveSection = async (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const updatedSections = [...sections];
        const temp = updatedSections[index];
        updatedSections[index] = updatedSections[targetIndex];
        updatedSections[targetIndex] = temp;

        const reordered = updatedSections.map((s, idx) => ({ ...s, order: idx + 1 }));

        try {
            await saveResourceSections(reordered);
            setSections(reordered);
        } catch (error) {
            console.error("Error sorting sections:", error);
            toast.error("Failed to save new section order");
        }
    };

    const triggerSectionDeleteConfirm = (section: ResourceSection) => {
        setSectionToDelete(section);
        setSectionDeleteConfirmOpen(true);
    };

    const handleSectionDeleteExecute = async () => {
        if (!sectionToDelete) return;
        const updatedSections = sections.filter((s) => s.id !== sectionToDelete.id);

        try {
            await saveResourceSections(updatedSections);
            setSections(updatedSections);
            toast.success("Resource button deleted successfully!");
            if (selectedSectionId === sectionToDelete.id) {
                if (updatedSections.length > 0) {
                    setSelectedSectionId(updatedSections[0].id);
                } else {
                    setSelectedSectionId("");
                    setResourcesData(null);
                }
            }
        } catch (error) {
            console.error("Error deleting section:", error);
            toast.error("Failed to delete resource button");
        } finally {
            setSectionDeleteConfirmOpen(false);
            setSectionToDelete(null);
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
            updatedChapters = updatedChapters.map((c) =>
                c.id === editingChapter.id ? { ...c, title: chapterTitle } : c
            );
        } else {
            const newChapter: Chapter = {
                id: `ch_${Date.now()}`,
                title: chapterTitle,
                resources: [],
            };
            updatedChapters.push(newChapter);
        }

        const updatedData = { ...resourcesData, chapters: updatedChapters };
        await persistResourcesChanges(updatedData);
        setChapterDialogOpen(false);
    };

    // Resource operations
    const handleOpenResourceDialog = (chapterId: string, resource?: ResourceItem) => {
        setActiveChapterId(chapterId);
        setSourceMode("link");
        setSelectedFile(null);
        setUploadingResource(false);
        if (resource) {
            setEditingResource(resource);
            setResourceTitle(resource.title);
            setResourceUrl(resource.url);
            setResourceType(resource.type);
            setCustomColor(resource.customColor || "#3B82F6");
        } else {
            setEditingResource(null);
            setResourceTitle("");
            setResourceUrl("");
            setResourceType("link");
            setCustomColor("#3B82F6");
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
                setUploadingResource(true);
                const path = `video_resources/${selectedSectionId}/${Date.now()}_${selectedFile.name}`;
                finalUrl = await uploadFile(selectedFile, path);
                
                const nameLower = selectedFile.name.toLowerCase();
                if (selectedFile.type.startsWith("image/") || nameLower.endsWith(".png") || nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg") || nameLower.endsWith(".webp") || nameLower.endsWith(".gif")) {
                    finalType = "image";
                } else if (nameLower.endsWith(".pdf")) {
                    finalType = "pdf";
                } else if (nameLower.endsWith(".ppt") || nameLower.endsWith(".pptx")) {
                    finalType = "ppt";
                } else if (selectedFile.type.startsWith("video/") || nameLower.endsWith(".mp4") || nameLower.endsWith(".mov") || nameLower.endsWith(".avi")) {
                    finalType = "video";
                } else if (selectedFile.type.startsWith("audio/") || nameLower.endsWith(".mp3") || nameLower.endsWith(".wav") || nameLower.endsWith(".m4a")) {
                    finalType = "audio";
                } else if (selectedFile.type.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document") || nameLower.endsWith(".docx") || nameLower.endsWith(".doc")) {
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
                    updatedResources = updatedResources.map((r) =>
                        r.id === editingResource.id
                            ? { ...r, title: resourceTitle, url: finalUrl, type: finalType, customColor }
                            : r
                    );
                } else {
                    const newResource: ResourceItem = {
                        id: `res_${Date.now()}`,
                        title: resourceTitle,
                        url: finalUrl,
                        type: finalType,
                        customColor,
                    };
                    updatedResources.push(newResource);
                }
                return { ...ch, resources: updatedResources };
            });

            const updatedData = { ...resourcesData, chapters: updatedChapters };
            await persistResourcesChanges(updatedData);
            setResourceDialogOpen(false);
        } catch (error: any) {
            console.error("Upload/Save error:", error);
            toast.error(error?.message || "Failed to upload file/save resource");
        } finally {
            setUploadingResource(false);
        }
    };

    const triggerResourceDeleteConfirm = (type: "chapter" | "resource", chapterId: string, resourceId?: string) => {
        setResourceDeleteTarget({ type, chapterId, resourceId });
        setResourceDeleteConfirmOpen(true);
    };

    const handleResourceDeleteExecute = async () => {
        if (!resourceDeleteTarget || !resourcesData) return;

        let updatedChapters = [...resourcesData.chapters];
        if (resourceDeleteTarget.type === "chapter") {
            updatedChapters = updatedChapters.filter((c) => c.id !== resourceDeleteTarget.chapterId);
        } else if (resourceDeleteTarget.type === "resource" && resourceDeleteTarget.resourceId) {
            updatedChapters = updatedChapters.map((ch) => {
                if (ch.id !== resourceDeleteTarget.chapterId) return ch;
                return {
                    ...ch,
                    resources: ch.resources.filter((r) => r.id !== resourceDeleteTarget.resourceId),
                };
            });
        }

        const updatedData = { ...resourcesData, chapters: updatedChapters };
        await persistResourcesChanges(updatedData);
        setResourceDeleteConfirmOpen(false);
        setResourceDeleteTarget(null);
    };

    // Auto detect type
    useEffect(() => {
        if (!resourceUrl || sourceMode === "file") return;
        const isYt = getYouTubeId(resourceUrl);
        const lowercaseUrl = resourceUrl.toLowerCase();
        
        if (isYt) {
            setResourceType("youtube");
            setCustomColor("#EF4444");
        } else if (isDriveLink(resourceUrl)) {
            if (lowercaseUrl.includes("presentation") || lowercaseUrl.includes("ppt")) {
                setResourceType("ppt");
                setCustomColor("#F97316");
            } else {
                setResourceType("drive");
                setCustomColor("#F59E0B");
            }
        } else if (lowercaseUrl.endsWith(".pdf")) {
            setResourceType("pdf");
            setCustomColor("#EF4444");
        } else if (lowercaseUrl.endsWith(".ppt") || lowercaseUrl.endsWith(".pptx")) {
            setResourceType("ppt");
            setCustomColor("#F97316");
        } else if (lowercaseUrl.endsWith(".mp4") || lowercaseUrl.endsWith(".mov") || lowercaseUrl.endsWith(".avi") || lowercaseUrl.endsWith(".mkv")) {
            setResourceType("video");
            setCustomColor("#06B6D4");
        } else if (lowercaseUrl.endsWith(".mp3") || lowercaseUrl.endsWith(".wav") || lowercaseUrl.endsWith(".m4a") || lowercaseUrl.endsWith(".aac")) {
            setResourceType("audio");
            setCustomColor("#6366F1");
        } else if (lowercaseUrl.endsWith(".png") || lowercaseUrl.endsWith(".jpg") || lowercaseUrl.endsWith(".jpeg") || lowercaseUrl.endsWith(".webp") || lowercaseUrl.endsWith(".gif")) {
            setResourceType("image");
            setCustomColor("#EC4899");
        } else if (lowercaseUrl.includes("docs.google.com/forms") || lowercaseUrl.includes("quizizz") || lowercaseUrl.includes("forms")) {
            setResourceType("quiz");
            setCustomColor("#8B5CF6");
        }
    }, [resourceUrl, sourceMode]);

    const PRESET_COLORS = [
        { name: "Red", hex: "#EF4444" },
        { name: "Orange", hex: "#F97316" },
        { name: "Amber", hex: "#F59E0B" },
        { name: "Green", hex: "#10B981" },
        { name: "Teal", hex: "#14B8A6" },
        { name: "Blue", hex: "#3B82F6" },
        { name: "Indigo", hex: "#6366F1" },
        { name: "Violet", hex: "#8B5CF6" },
        { name: "Pink", hex: "#EC4899" },
        { name: "Slate", hex: "#64748B" },
    ];

    const getResourceDetails = (resource: ResourceItem) => {
        const type = resource.type;
        const color = resource.customColor || "#3B82F6";
        const inlineBgStyle = { backgroundColor: `${color}12`, borderColor: `${color}25` };
        const inlineTextStyle = { color: color };

        switch (type) {
            case "youtube":
                return {
                    icon: <Youtube className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "YouTube Video",
                };
            case "drive":
                return {
                    icon: <FolderDot className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "Google Drive",
                };
            case "pdf":
                return {
                    icon: <FileText className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "PDF Document",
                };
            case "ppt":
                return {
                    icon: <Presentation className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "PowerPoint",
                };
            case "document":
                return {
                    icon: <FileText className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "Document",
                };
            case "video":
                return {
                    icon: <Film className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "Video File",
                };
            case "audio":
                return {
                    icon: <Music className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "Audio File",
                };
            case "image":
                return {
                    icon: <Image className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "Image/Photo",
                };
            case "quiz":
                return {
                    icon: <HelpCircle className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "Quiz / Form",
                };
            case "link":
            default:
                return {
                    icon: <ExternalLink className="w-5 h-5" style={inlineTextStyle} />,
                    bgStyle: inlineBgStyle,
                    textStyle: inlineTextStyle,
                    label: "Web Link",
                };
        }
    };

    const handleSaveLoginConfig = async () => {
        if (!loginConfig) return;
        setSaving(true);
        try {
            await saveLoginScreenConfig(loginConfig);
            toast.success("Login screen configuration saved");
        } catch (error) {
            console.error("Error saving login config:", error);
            toast.error("Failed to save login configuration");
        } finally {
            setSaving(false);
        }
    };



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, path: string, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(path);
        try {
            const url = await uploadFile(file, `login_assets/${Date.now()}_${file.name}`);
            callback(url);
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
        } finally {
            setUploading(null);
        }
    };

    const openCarouselDialog = (index: number | null = null) => {
        if (index !== null && loginConfig) {
            setCarouselForm({ ...loginConfig.carousel[index] });
            setEditingCarouselIndex(index);
        } else {
            setCarouselForm({ name: "", role: "", label: "", message: "", image: "" });
            setEditingCarouselIndex(null);
        }
        setIsCarouselDialogOpen(true);
    };

    const handleSaveCarouselItem = () => {
        if (!loginConfig) return;
        const updatedCarousel = [...loginConfig.carousel];
        if (editingCarouselIndex !== null) {
            updatedCarousel[editingCarouselIndex] = carouselForm;
        } else {
            updatedCarousel.push(carouselForm);
        }
        setLoginConfig({ ...loginConfig, carousel: updatedCarousel });
        setIsCarouselDialogOpen(false);
    };

    const handleDeleteCarouselItem = (index: number) => {
        if (!loginConfig) return;
        const updatedCarousel = loginConfig.carousel.filter((_, i) => i !== index);
        setLoginConfig({ ...loginConfig, carousel: updatedCarousel });
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const bishopItem = loginConfig?.carousel.find(item => item.role.toLowerCase().includes("bishop"));
    const directorItem = loginConfig?.carousel.find(item => item.role.toLowerCase().includes("director"));
    
    const generalCarousel = loginConfig?.carousel.filter(item => 
        item !== bishopItem && item !== directorItem
    ) || [];

    const pastoralLeaders = [
        { role: "Bishop", item: bishopItem },
        { role: "Director", item: directorItem }
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">App Control Menu</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure application settings, theme, login page elements, and mobile resource buttons.
                    </p>
                </div>
                {activeTab === "login" && (
                    <Button onClick={handleSaveLoginConfig} disabled={saving} className="hover:scale-105 transition-transform shadow-md">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border gap-6">
                <button
                    onClick={() => setActiveTab("login")}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 px-1 cursor-pointer flex items-center gap-2 ${
                        activeTab === "login"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <LayoutIcon className="w-4 h-4" />
                    Login Screen Config
                </button>
                <button
                    onClick={() => setActiveTab("resources")}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 px-1 cursor-pointer flex items-center gap-2 ${
                        activeTab === "resources"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Mobile Resource Buttons
                </button>
            </div>

            {activeTab === "login" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    {/* Daily Verse Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Type className="w-5 h-5 text-primary" />
                                Daily Verse
                            </CardTitle>
                            <CardDescription>Configure the scripture verse shown on the login screen</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Verse Title</Label>
                                <Input 
                                    value={loginConfig?.verseTitle} 
                                    onChange={(e) => setLoginConfig(prev => prev ? { ...prev, verseTitle: e.target.value } : null)}
                                    placeholder="Default: Daily Verse"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Verse Text</Label>
                                <Textarea 
                                    value={loginConfig?.verseText} 
                                    onChange={(e) => setLoginConfig(prev => prev ? { ...prev, verseText: e.target.value } : null)}
                                    placeholder="Enter the scripture text"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Verse Reference</Label>
                                <Input 
                                    value={loginConfig?.verseRef} 
                                    onChange={(e) => setLoginConfig(prev => prev ? { ...prev, verseRef: e.target.value } : null)}
                                    placeholder="e.g., John 3:16"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-accent/10 border-accent/20">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">Hide Verse Text</Label>
                                    <p className="text-[10px] text-muted-foreground">Automatically shows image in full clarity</p>
                                </div>
                                <Switch 
                                    id="hide-text" 
                                    checked={loginConfig?.hideVerseText || false}
                                    onCheckedChange={(checked: boolean) => setLoginConfig(prev => prev ? { ...prev, hideVerseText: checked } : null)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Text Color</Label>
                                    <Select 
                                        value={loginConfig?.verseTextColor || "white"} 
                                        onValueChange={(val: any) => setLoginConfig(prev => prev ? { ...prev, verseTextColor: val } : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="white">White</SelectItem>
                                            <SelectItem value="black">Black</SelectItem>
                                            <SelectItem value="gold">Gold</SelectItem>
                                            <SelectItem value="blue">Blue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Title BG Color</Label>
                                    <Select 
                                        value={loginConfig?.verseTitleBgColor || "gold"} 
                                        onValueChange={(val: any) => setLoginConfig(prev => prev ? { ...prev, verseTitleBgColor: val } : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="white">White</SelectItem>
                                            <SelectItem value="black">Black</SelectItem>
                                            <SelectItem value="gold">Gold</SelectItem>
                                            <SelectItem value="blue">Blue</SelectItem>
                                            <SelectItem value="transparent">Transparent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Background Image</Label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            id="verse-bg-upload"
                                            onChange={(e) => handleFileUpload(e, "verse-bg", (url) => setLoginConfig(prev => prev ? { ...prev, verseBgImage: url } : null))}
                                        />
                                        <Button 
                                            variant="outline" 
                                            onClick={() => document.getElementById("verse-bg-upload")?.click()}
                                            disabled={uploading === "verse-bg"}
                                            className="w-full"
                                        >
                                            {uploading === "verse-bg" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {loginConfig?.verseBgImage && (
                                <div className="mt-2 relative group">
                                    <img src={loginConfig.verseBgImage} alt="Verse Background" className="w-full h-32 object-cover rounded-lg border" />
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setLoginConfig(prev => prev ? { ...prev, verseBgImage: "" } : null)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pastoral Messages Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutIcon className="w-5 h-5 text-primary" />
                                Pastoral Leaders
                            </CardTitle>
                            <CardDescription>Edit messages from Bishop and Director</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pastoralLeaders.map((leader, i) => {
                                    const originalIndex = leader.item ? (loginConfig?.carousel.indexOf(leader.item) ?? -1) : -1;
                                    return (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-accent/20 border-accent/30 relative overflow-hidden">
                                            {leader.item?.image ? (
                                                <img src={leader.item.image} alt={leader.item.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center border-2 border-white shadow-sm">
                                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{leader.role}</p>
                                                <p className="font-bold truncate text-lg">
                                                    {leader.item?.name || `No ${leader.role} Added`}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate italic">
                                                    {leader.item?.message ? `"${leader.item.message.substring(0, 40)}..."` : "Edit to add message"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button 
                                                    size="sm" 
                                                    className="h-9 px-4"
                                                    onClick={() => {
                                                        if (originalIndex !== -1) {
                                                            openCarouselDialog(originalIndex);
                                                        } else {
                                                            const newForm = { 
                                                                name: "", 
                                                                role: leader.role, 
                                                                label: `${leader.role.toUpperCase()}'S MESSAGE`, 
                                                                message: "", 
                                                                image: "" 
                                                            };
                                                            setCarouselForm(newForm);
                                                            setEditingCarouselIndex(null);
                                                            setIsCarouselDialogOpen(true);
                                                        }
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                                {leader.item && originalIndex !== -1 && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive self-end" onClick={() => handleDeleteCarouselItem(originalIndex)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* General Carousel Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutIcon className="w-5 h-5 text-primary" />
                                    General Carousel
                                </CardTitle>
                                <CardDescription>Other slides for the login screen carousel</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openCarouselDialog()}>
                                <Plus className="w-4 h-4 mr-2" /> Add Slide
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {generalCarousel.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                        No general slides added yet
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {generalCarousel.map((item, index) => {
                                            const originalIndex = loginConfig?.carousel.indexOf(item);
                                            return (
                                                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-sm">{item.name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{item.role}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCarouselDialog(originalIndex!)}>
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCarouselItem(originalIndex!)}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="w-5 h-5 text-primary" />
                                Contact Information
                            </CardTitle>
                            <CardDescription>Configure the administrator phone number for the mobile app</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Admin Phone Number</Label>
                                <Input 
                                    type="tel"
                                    value={loginConfig?.contactPhone || ""} 
                                    onChange={(e) => setLoginConfig(prev => prev ? { ...prev, contactPhone: e.target.value } : null)}
                                    placeholder="e.g., +919447601251"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Mobile Resource Buttons Selector Grid */}
                    <div className="space-y-4 bg-card p-6 border rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-foreground/80 flex items-center gap-2">
                                    <LayoutIcon className="w-5 h-5 text-primary" />
                                    Mobile App Resource Buttons
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Create, edit, reorder or delete main resource sections rendered in the mobile app.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleOpenSectionDialog()}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Button Section
                            </Button>
                        </div>

                        {loadingSections ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {sections.map((section, index) => {
                                    const isSelected = selectedSectionId === section.id;
                                    const sectionColor = section.customColor || "#3B82F6";
                                    return (
                                        <div
                                            key={section.id}
                                            onClick={() => setSelectedSectionId(section.id)}
                                            className={`
                                                relative h-20 rounded-xl border p-3 transition-all duration-300 flex flex-col justify-between cursor-pointer group/sec shadow-sm select-none
                                                ${
                                                    isSelected
                                                        ? "border-primary scale-102 shadow-md"
                                                        : "bg-background border-border hover:border-primary/50"
                                                }
                                            `}
                                            style={isSelected ? { boxShadow: `${sectionColor}25 0px 4px 12px`, borderColor: sectionColor } : {}}
                                        >
                                            <div className="flex justify-between items-start gap-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <DynamicIcon
                                                        name={section.icon}
                                                        className="w-4 h-4 shrink-0"
                                                        style={{ color: sectionColor }}
                                                    />
                                                    <span className="font-bold text-sm truncate leading-tight" style={isSelected ? { color: sectionColor } : {}}>
                                                        {section.title}
                                                    </span>
                                                </div>

                                                {/* Action buttons on hover */}
                                                <div className="opacity-0 group-hover/sec:opacity-100 flex items-center bg-background/90 backdrop-blur-sm px-1 py-0.5 rounded border border-border gap-0.5 absolute top-1 right-1 transition-opacity z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (index > 0) handleMoveSection(index, "up");
                                                        }}
                                                        disabled={index === 0}
                                                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (index < sections.length - 1) handleMoveSection(index, "down");
                                                        }}
                                                        disabled={index === sections.length - 1}
                                                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenSectionDialog(section);
                                                        }}
                                                        className="p-0.5 text-muted-foreground hover:text-primary cursor-pointer"
                                                        title="Edit Button"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            triggerSectionDeleteConfirm(section);
                                                        }}
                                                        className="p-0.5 text-muted-foreground hover:text-destructive cursor-pointer"
                                                        title="Delete Button"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end mt-auto">
                                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                                    Order: {section.order}
                                                </span>
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: sectionColor }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Resources List Area */}
                    {loadingResources ? (
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
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-card p-4 border rounded-xl shadow-sm">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <span
                                        className="px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                                        style={{
                                            backgroundColor: `${sections.find((s) => s.id === selectedSectionId)?.customColor || "#3B82F6"}15`,
                                            color: sections.find((s) => s.id === selectedSectionId)?.customColor || "#3B82F6",
                                        }}
                                    >
                                        <DynamicIcon
                                            name={sections.find((s) => s.id === selectedSectionId)?.icon || "GraduationCap"}
                                            className="w-4 h-4"
                                        />
                                        {sections.find((s) => s.id === selectedSectionId)?.title || "Select Section"}
                                    </span>
                                    <span className="text-foreground/80">Active Resource Chapters</span>
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
                                    <h3 className="text-xl font-semibold mb-2">No Chapters Found</h3>
                                    <p className="text-muted-foreground max-w-sm mb-6">
                                        There are no resource chapters configured for this section yet.
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
                                                        {chapter.resources.length} active button{chapter.resources.length === 1 ? "" : "s"} rendered in mobile app
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenChapterDialog(chapter)}
                                                        className="h-8 w-8 hover:text-primary hover:bg-primary/10 cursor-pointer"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => triggerResourceDeleteConfirm("chapter", chapter.id)}
                                                        className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Resource cards list */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                                                {chapter.resources.map((resource) => {
                                                    const details = getResourceDetails(resource);
                                                    const ytId = getYouTubeId(resource.url);

                                                    return (
                                                        <div
                                                            key={resource.id}
                                                            className="relative flex flex-col justify-between border rounded-xl bg-card/40 hover:bg-accent/10 hover:border-primary/20 transition-all duration-300 group/card p-4 hover:shadow-sm"
                                                            style={details.bgStyle}
                                                        >
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <span
                                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shadow-sm"
                                                                        style={{ ...details.bgStyle, ...details.textStyle }}
                                                                    >
                                                                        {details.label}
                                                                    </span>

                                                                    <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleOpenResourceDialog(chapter.id, resource)}
                                                                            className="p-1 text-muted-foreground hover:text-primary rounded-md hover:bg-accent cursor-pointer"
                                                                            title="Edit Resource"
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => triggerResourceDeleteConfirm("resource", chapter.id, resource.id)}
                                                                            className="p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-accent cursor-pointer"
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
                                                                        Open Link <ExternalLink className="w-3.5 h-3.5" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                <button
                                                    onClick={() => handleOpenResourceDialog(chapter.id)}
                                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-primary/45 rounded-xl bg-card/25 hover:bg-accent/5 transition-all text-muted-foreground hover:text-primary min-h-[150px] cursor-pointer"
                                                >
                                                    <Plus className="w-8 h-8 mb-2" />
                                                    <span className="font-medium text-sm">Add Resource Button</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Dialogs for Login Tab */}
            <Dialog open={isCarouselDialogOpen} onOpenChange={setIsCarouselDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingCarouselIndex !== null ? "Edit Slide" : "Add New Slide"}</DialogTitle>
                        <DialogDescription>Configure the leader message details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={carouselForm.name} onChange={(e) => setCarouselForm({ ...carouselForm, name: e.target.value })} placeholder="e.g., Mar Jose Pulickal" />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input value={carouselForm.role} onChange={(e) => setCarouselForm({ ...carouselForm, role: e.target.value })} placeholder="e.g., Bishop" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Label</Label>
                            <Input value={carouselForm.label} onChange={(e) => setCarouselForm({ ...carouselForm, label: e.target.value })} placeholder="e.g., BISHOP'S MESSAGE" />
                        </div>
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea value={carouselForm.message} onChange={(e) => setCarouselForm({ ...carouselForm, message: e.target.value })} placeholder="Full message..." rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label>Photo</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    id="carousel-img-upload"
                                    onChange={(e) => handleFileUpload(e, "carousel", (url) => setCarouselForm({ ...carouselForm, image: url }))}
                                />
                                <Button 
                                    variant="outline" 
                                    onClick={() => document.getElementById("carousel-img-upload")?.click()}
                                    disabled={uploading === "carousel"}
                                    className="w-full"
                                >
                                    {uploading === "carousel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                                    Upload Photo
                                </Button>
                            </div>
                            {carouselForm.image && <img src={carouselForm.image} alt="Preview" className="w-20 h-20 rounded-full object-cover border mx-auto mt-2" />}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCarouselDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveCarouselItem}>
                            {editingCarouselIndex !== null ? "Update Slide" : "Add Slide"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Chapter Dialog */}
            <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingChapter ? "Edit Chapter Title" : "Create New Chapter"}</DialogTitle>
                        <DialogDescription>
                            Provide a name for the chapter grouping. You can add button links to videos, PPTs, or documents inside.
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
            <Dialog open={resourceDialogOpen} onOpenChange={(open) => !uploadingResource && setResourceDialogOpen(open)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingResource ? "Edit Resource Button" : "Add Resource Button"}</DialogTitle>
                        <DialogDescription>
                            Create a custom button icon linked to a file upload, video stream, google drive or website url.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="resourceTitle" className="text-right">
                                Button Label
                            </Label>
                            <Input
                                id="resourceTitle"
                                value={resourceTitle}
                                onChange={(e) => setResourceTitle(e.target.value)}
                                placeholder="e.g. Action Song / Reference Slide"
                                className="col-span-3"
                                disabled={uploadingResource}
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
                                    disabled={uploadingResource}
                                >
                                    Web Link
                                </Button>
                                <Button
                                    type="button"
                                    variant={sourceMode === "file" ? "default" : "outline"}
                                    onClick={() => setSourceMode("file")}
                                    className="flex-1"
                                    disabled={uploadingResource}
                                >
                                    Upload File
                                </Button>
                            </div>
                        </div>

                        {sourceMode === "link" ? (
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
                                    disabled={uploadingResource}
                                />
                            </div>
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
                                        disabled={uploadingResource}
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

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="resourceType" className="text-right">
                                Button Icon Type
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={resourceType}
                                    onValueChange={(value: any) => setResourceType(value)}
                                    disabled={uploadingResource}
                                >
                                    <SelectTrigger id="resourceType">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="youtube">YouTube Video</SelectItem>
                                        <SelectItem value="drive">Google Drive Link</SelectItem>
                                        <SelectItem value="pdf">PDF Document</SelectItem>
                                        <SelectItem value="ppt">PowerPoint (PPT)</SelectItem>
                                        <SelectItem value="document">General Document</SelectItem>
                                        <SelectItem value="video">Video File</SelectItem>
                                        <SelectItem value="audio">Audio File</SelectItem>
                                        <SelectItem value="image">Image File</SelectItem>
                                        <SelectItem value="quiz">Quiz / Feedback Form</SelectItem>
                                        <SelectItem value="link">Web Link</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-primary" /> Auto-detected on pasting links / uploading files.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Button Theme Color</Label>
                            <div className="col-span-3 flex flex-wrap gap-2 items-center">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.hex}
                                        type="button"
                                        onClick={() => setCustomColor(color.hex)}
                                        className={`w-7 h-7 rounded-full transition-transform border-2 cursor-pointer ${
                                            customColor === color.hex
                                                ? "scale-110 shadow-md border-black dark:border-white"
                                                : "border-transparent hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="w-8 h-8 rounded border cursor-pointer p-0 overflow-hidden"
                                    title="Custom Color Picker"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResourceDialogOpen(false)} disabled={uploadingResource}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveResource} disabled={uploadingResource}>
                            {uploadingResource ? "Uploading file..." : "Save Button"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resource Delete Confirmation Dialog */}
            <Dialog open={resourceDeleteConfirmOpen} onOpenChange={setResourceDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this {resourceDeleteTarget?.type}? This will remove the button from the mobile application.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setResourceDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleResourceDeleteExecute}>
                            Delete Permanent
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* YouTube Iframe Player Modal */}
            {activeVideoId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-border shadow-2xl">
                        <button
                            onClick={() => setActiveVideoId(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
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
                    </div>
                </div>
            )}

            {/* Section Dialog (Add / Edit top-level resource button) */}
            <Dialog open={sectionDialogOpen} onOpenChange={(open) => setSectionDialogOpen(open)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{editingSection ? "Edit Resource Button" : "Add Resource Button"}</DialogTitle>
                        <DialogDescription>
                            Configure the top-level button section displayed on the mobile app's resource page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sectionTitle" className="text-right">
                                Button Label
                            </Label>
                            <Input
                                id="sectionTitle"
                                value={sectionTitle}
                                onChange={(e) => setSectionTitle(e.target.value)}
                                placeholder="e.g. Class 1 / Saints / Holy Mass"
                                className="col-span-3"
                            />
                        </div>



                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sectionIcon" className="text-right">
                                Button Icon
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={sectionIcon}
                                    onValueChange={(val) => setSectionIcon(val)}
                                >
                                    <SelectTrigger id="sectionIcon">
                                        <SelectValue placeholder="Select Icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_ICONS.map((icon) => (
                                            <SelectItem key={icon.name} value={icon.name}>
                                                <div className="flex items-center gap-2">
                                                    <DynamicIcon name={icon.name} className="w-4 h-4" />
                                                    <span>{icon.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Theme Color</Label>
                            <div className="col-span-3 flex flex-wrap gap-2 items-center">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.hex}
                                        type="button"
                                        onClick={() => setSectionColor(color.hex)}
                                        className={`w-7 h-7 rounded-full transition-transform border-2 cursor-pointer ${
                                            sectionColor === color.hex
                                                ? "scale-110 shadow-md border-black dark:border-white"
                                                : "border-transparent hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={sectionColor}
                                    onChange={(e) => setSectionColor(e.target.value)}
                                    className="w-8 h-8 rounded border cursor-pointer p-0 overflow-hidden"
                                    title="Custom Color Picker"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSection}>Save Section Button</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Section Delete Confirmation Dialog */}
            <Dialog open={sectionDeleteConfirmOpen} onOpenChange={setSectionDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the resource button "{sectionToDelete?.title}"? This will hide the button in the mobile app.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setSectionDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleSectionDeleteExecute}>
                            Delete Permanent
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
