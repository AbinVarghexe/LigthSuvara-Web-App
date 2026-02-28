import { useState, useEffect } from "react";
import {
    Plus,
    Loader2,
    Flame,
    BookOpen,
    GraduationCap,
    Users,
    HelpCircle,
    Star,
    Church,
    Bird,
    Heart,
    Lightbulb,
    Music,
    Save,
    Trash2,
    Edit2,
    Info,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
    getThemePrograms,
    saveThemePrograms,
    ThemeProgramsData,
    ProgramListItem,
} from "../../features/theme/services/themeService";

const availableIcons: Record<string, any> = {
    fire: Flame,
    bookOpenReader: BookOpen,
    graduationCap: GraduationCap,
    users: Users,
    circleQuestion: HelpCircle,
    handsHoldingChild: Heart,
    masksTheater: Music,
    star: Star,
    church: Church,
    cross: Plus,
    dove: Bird,
    heart: Heart,
    lightbulb: Lightbulb,
    music: Music,
};

export function ThemePrograms() {
    const [data, setData] = useState<ThemeProgramsData>({
        themeYear: "",
        themeMalayalam: "",
        themeEnglish: "",
        programs: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [programForm, setProgramForm] = useState<ProgramListItem>({
        title: "",
        desc: "",
        iconName: "star",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getThemePrograms();
                setData(result);
            } catch (error) {
                console.error("Error fetching theme data:", error);
                toast.error("Failed to load theme data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            await saveThemePrograms(data);
            toast.success("Theme and programs saved successfully");
        } catch (error) {
            console.error("Error saving theme data:", error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const openProgramDialog = (index: number | null = null) => {
        if (index !== null) {
            setProgramForm({ ...data.programs[index] });
            setEditingIndex(index);
        } else {
            setProgramForm({ title: "", desc: "", iconName: "star" });
            setEditingIndex(null);
        }
        setIsDialogOpen(true);
    };

    const handleSaveProgram = () => {
        if (!programForm.title.trim()) {
            toast.error("Program title is required");
            return;
        }

        const updatedPrograms = [...data.programs];
        if (editingIndex !== null) {
            updatedPrograms[editingIndex] = programForm;
        } else {
            updatedPrograms.push(programForm);
        }

        setData({ ...data, programs: updatedPrograms });
        setIsDialogOpen(false);
    };

    const handleDeleteProgram = (index: number) => {
        const updatedPrograms = data.programs.filter((_, i) => i !== index);
        setData({ ...data, programs: updatedPrograms });
        toast.success("Program removed from list");
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Theme & Programs
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage the yearly theme and promotional programs
                    </p>
                </div>
                <Button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save All Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Theme Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600" />
                                Theme of the Year
                            </CardTitle>
                            <CardDescription>
                                Configure the annual theme details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="themeYear">Academic Year</Label>
                                <Input
                                    id="themeYear"
                                    value={data.themeYear}
                                    onChange={(e) => setData({ ...data, themeYear: e.target.value })}
                                    placeholder="e.g., 2025-26"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="themeMalayalam">Theme (Malayalam)</Label>
                                <Input
                                    id="themeMalayalam"
                                    value={data.themeMalayalam}
                                    onChange={(e) => setData({ ...data, themeMalayalam: e.target.value })}
                                    placeholder="Enter Malayalam theme"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="themeEnglish">Theme (English)</Label>
                                <Input
                                    id="themeEnglish"
                                    value={data.themeEnglish}
                                    onChange={(e) => setData({ ...data, themeEnglish: e.target.value })}
                                    placeholder="Enter English theme"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Programs List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                    Our Programs
                                </CardTitle>
                                <CardDescription>
                                    List of key programs and initiatives
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openProgramDialog()}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Program
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {data.programs.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>No programs added yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.programs.map((program, index) => {
                                        const Icon = availableIcons[program.iconName] || Star;
                                        return (
                                            <Card key={index} className="overflow-hidden border-blue-100 hover:border-blue-300 transition-colors">
                                                <CardContent className="p-4 flex gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 truncate">{program.title}</h3>
                                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{program.desc}</p>
                                                        <div className="flex justify-end gap-2 mt-3">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                                onClick={() => openProgramDialog(index)}
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                                onClick={() => handleDeleteProgram(index)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Program Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingIndex !== null ? "Edit Program" : "Add New Program"}</DialogTitle>
                        <DialogDescription>
                            Enter the program details and select an appropriate icon.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="progTitle">Program Title</Label>
                            <Input
                                id="progTitle"
                                value={programForm.title}
                                onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                                placeholder="e.g., Uthanothsavam"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="progDesc">Description</Label>
                            <Textarea
                                id="progDesc"
                                value={programForm.desc}
                                onChange={(e) => setProgramForm({ ...programForm, desc: e.target.value })}
                                placeholder="Enter a brief description"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Select Icon</Label>
                            <div className="grid grid-cols-7 gap-2">
                                {Object.keys(availableIcons).map((iconKey) => {
                                    const IconComp = availableIcons[iconKey];
                                    const isSelected = programForm.iconName === iconKey;
                                    return (
                                        <button
                                            key={iconKey}
                                            type="button"
                                            onClick={() => setProgramForm({ ...programForm, iconName: iconKey })}
                                            className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center ${isSelected
                                                    ? "border-blue-600 bg-blue-50 text-blue-600"
                                                    : "border-transparent hover:bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            <IconComp className="w-5 h-5" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProgram} className="bg-blue-600 hover:bg-blue-700">
                            {editingIndex !== null ? "Update Program" : "Add Program"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
