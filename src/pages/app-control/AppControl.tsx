import { useState, useEffect } from "react";
import {
    Loader2,
    Save,
    Image as ImageIcon,
    Plus,
    Trash2,
    Edit2,
    Type,
    Layout as LayoutIcon,
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
import { uploadFile } from "../../lib/upload";

export function AppControl() {
    const [loginConfig, setLoginConfig] = useState<LoginScreenConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const login = await getLoginScreenConfig();
                setLoginConfig(login);
            } catch (error) {
                console.error("Error fetching app control data:", error);
                toast.error("Failed to load configuration");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">App Control Menu</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage login screen visual identity and pastoral messages
                    </p>
                </div>
                <Button onClick={handleSaveLoginConfig} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCarouselDialog(originalIndex)}>
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
            </div>

            {/* Carousel Slide Dialog */}
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
        </div>
    );
}
