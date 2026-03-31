import { useState, useEffect, useMemo } from "react";
import {
    Loader2,
    Plus,
    Trash2,
    Edit2,
    Users,
    ChevronRight,
    Search,
    Download,
    Eye,
    TrendingUp,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    Clock,
    Briefcase,
    Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import { Switch } from "../../components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";
import {
    getPublicPrograms,
    savePublicProgram,
    deletePublicProgram,
    getPublicRegistrations,
    deletePublicRegistration,
    savePublicRegistration,
    ProgramMetadata,
    PublicRegistration as RegistrationType,
} from "../../features/public-registration/services/publicRegistrationService";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { 
    BarChart, 
    Bar, 
    XAxis,
    YAxis, 
    ResponsiveContainer, 
    Tooltip as RechartTooltip, 
    Cell,
} from "recharts";

const COLORS = ['#1E3A8A', '#BC8A3A', '#2563EB', '#D97706', '#3B82F6', '#F59E0B'];

function DateTimePicker({ 
    date, 
    onChange, 
    label 
}: { 
    date: Timestamp | undefined; 
    onChange: (date: Timestamp) => void; 
    label: string 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(date?.toDate());
    
    // 12-hour clock state
    const d = date?.toDate() || new Date();
    const [hours, setHours] = useState(d.getHours() % 12 || 12);
    const [minutes, setMinutes] = useState(d.getMinutes());
    const [period, setPeriod] = useState(d.getHours() >= 12 ? "PM" : "AM");

    useEffect(() => {
        if (date) {
            const dt = date.toDate();
            setSelectedDate(dt);
            setHours(dt.getHours() % 12 || 12);
            setMinutes(dt.getMinutes());
            setPeriod(dt.getHours() >= 12 ? "PM" : "AM");
        }
    }, [date]);

    const updateDateTime = (newD?: Date, newH?: number, newM?: number, newP?: string, close = false) => {
        const targetDate = newD || selectedDate;
        const targetHours = newH !== undefined ? newH : hours;
        const targetMinutes = newM !== undefined ? newM : minutes;
        const targetPeriod = newP || period;

        if (targetDate) {
            const finalDate = new Date(targetDate);
            let hours24 = targetHours % 12;
            if (targetPeriod === "PM") hours24 += 12;
            finalDate.setHours(hours24);
            finalDate.setMinutes(targetMinutes);
            onChange(Timestamp.fromDate(finalDate));
        }
        if (close) setIsOpen(false);
    };

    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-sm font-normal h-12 border-input bg-background hover:bg-accent/5 transition-all shadow-sm rounded-xl px-4",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                        <span className="flex-1 truncate">
                            {date ? format(date.toDate(), "MMMM do, yyyy h:mm aa") : "Select Schedule"}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-[340px] p-0 shadow-2xl border-primary/20 bg-background overflow-hidden rounded-2xl" 
                    align="start" 
                    collisionPadding={16}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden scroll-smooth [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] focus:outline-none" tabIndex={-1}>
                        <div className="p-2 flex justify-center translate-y-1">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(day) => {
                                    if (day) {
                                        setSelectedDate(day);
                                        updateDateTime(day, undefined, undefined, undefined, true);
                                    }
                                }}
                                initialFocus
                                className="w-full h-auto scale-[0.95] origin-top"
                            />
                        </div>
                        <div className="px-5 py-5 border-t bg-muted/20 space-y-4">
                            <div className="flex flex-col gap-3.5">
                                <div className="flex items-center justify-between pb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 px-2 rounded-md bg-primary/10">
                                            <Clock className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-extrabold uppercase text-primary/80 tracking-[0.25em]">Picker Time</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-primary/40 animate-ping" />
                                        <span className="text-[8px] font-black uppercase text-muted-foreground/40">Scroll for more</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-background/90 backdrop-blur-md p-3.5 rounded-2xl border border-primary/10 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Select value={hours.toString()} onValueChange={(v) => {
                                            const h = parseInt(v);
                                            setHours(h);
                                            updateDateTime(undefined, h, undefined, undefined, false);
                                        }}>
                                            <SelectTrigger className="w-15 h-10 text-sm font-bold border-primary/10 shadow-sm bg-background hover:border-primary/40 transition-all rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <SelectItem key={i + 1} value={(i + 1).toString()} className="text-sm font-medium">{ (i + 1).toString().padStart(2, '0') }</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-lg font-bold text-muted-foreground/30">:</span>
                                        <Select value={minutes.toString()} onValueChange={(v) => {
                                            const m = parseInt(v);
                                            setMinutes(m);
                                            updateDateTime(undefined, undefined, m, undefined, false);
                                        }}>
                                            <SelectTrigger className="w-15 h-10 text-sm font-bold border-primary/10 shadow-sm bg-background hover:border-primary/40 transition-all rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 60 }).map((_, i) => (
                                                <SelectItem key={i} value={i.toString()} className="text-sm">{i.toString().padStart(2, '0')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Select value={period} onValueChange={(v: any) => {
                                    setPeriod(v);
                                    updateDateTime(undefined, undefined, undefined, v, true);
                                }}>
                                    <SelectTrigger className="w-20 h-10 text-sm font-black border-primary/10 shadow-sm bg-primary/5 text-primary hover:bg-primary/10 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AM" className="text-sm font-bold">AM</SelectItem>
                                        <SelectItem value="PM" className="text-sm font-bold">PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function PublicRegistration() {
    const [programs, setPrograms] = useState<ProgramMetadata[]>([]);
    const [registrations, setRegistrations] = useState<RegistrationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("programs");
    const [searchTerm, setSearchTerm] = useState("");
    
    // View Detail State
    const [selectedReg, setSelectedReg] = useState<RegistrationType | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Registration Dialog State
    const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
    const [editingRegId, setEditingRegId] = useState<string | undefined>(undefined);
    const [regForm, setRegForm] = useState<Partial<RegistrationType>>({});

    // Program Dialog State
    const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState<string | undefined>(undefined);
    const [programForm, setProgramForm] = useState<Partial<ProgramMetadata>>({
        name: "",
        isActive: true,
        regInfo: "",
        startDate: Timestamp.now(),
        endDate: Timestamp.now(),
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [progs, regs] = await Promise.all([
                getPublicPrograms(),
                getPublicRegistrations(),
            ]);
            setPrograms(progs);
            setRegistrations(regs);
        } catch (error) {
            console.error("Error fetching public registration data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Analytics Data
    const analytics = useMemo(() => {
        const total = registrations.length;
        const programCounts = programs.map(p => ({
            name: p.name,
            count: registrations.filter(r => r.programId === p.id).length
        })).filter(p => p.count > 0);

        const recent = [...registrations]
            .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
            .slice(0, 5);

        return { total, programCounts, recent };
    }, [registrations, programs]);

    const openProgramDialog = (program?: ProgramMetadata) => {
        if (program) {
            setProgramForm({ ...program });
            setEditingProgramId(program.id);
        } else {
            setProgramForm({
                name: "",
                isActive: true,
                regInfo: "",
                startDate: Timestamp.now(),
                endDate: Timestamp.now(),
            });
            setEditingProgramId(undefined);
        }
        setIsProgramDialogOpen(true);
    };

    const openRegDialog = (reg: RegistrationType) => {
        setRegForm({ ...reg });
        setEditingRegId(reg.id);
        setIsRegDialogOpen(true);
    };

    const handleSaveProgram = async () => {
        if (!programForm.name?.trim()) {
            toast.error("Program name is required");
            return;
        }
        try {
            await savePublicProgram(programForm, editingProgramId);
            toast.success(editingProgramId ? "Program updated" : "Program created");
            setIsProgramDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving program:", error);
            toast.error("Failed to save program");
        }
    };

    const handleSaveRegistration = async () => {
        if (!editingRegId) return;
        
        // Ensure program name is updated if programId changed
        const selectedProgram = programs.find(p => p.id === regForm.programId);
        const dataToSave = {
            ...regForm,
            programTitle: selectedProgram?.name || regForm.programTitle
        };

        try {
            await savePublicRegistration(dataToSave, editingRegId);
            toast.success("Registration updated");
            setIsRegDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving registration:", error);
            toast.error("Failed to save registration");
        }
    };

    const handleDeleteProgram = async (id: string) => {
        if (!confirm("Are you sure you want to delete this program?")) return;
        try {
            await deletePublicProgram(id);
            toast.success("Program deleted");
            fetchData();
        } catch (error) {
            console.error("Error deleting program:", error);
            toast.error("Failed to delete program");
        }
    };
    
    const handleDeleteRegistration = async (id: string) => {
        if (!confirm("Are you sure you want to delete this registration?")) return;
        try {
            await deletePublicRegistration(id);
            toast.success("Registration deleted");
            fetchData(); // Refresh both lists
        } catch (error) {
            console.error("Error deleting registration:", error);
            toast.error("Failed to delete registration");
        }
    };

    const handleExportCSV = () => {
        if (registrations.length === 0) {
            toast.error("No registrations to export");
            return;
        }

        const headers = ["Name", "Phone", "Email", "Qualification", "Current Status", "Academic Background", "Address", "Program", "Date"];
        const rows = registrations.map(reg => [
            reg.name || reg.applicantName || "",
            reg.phone || reg.applicantMobile || "",
            reg.email || "",
            reg.qualification || "N/A",
            reg.currentStatus || "N/A",
            reg.academicBackground || reg.applicantClass || "",
            `"${(reg.address || reg.applicantPlace || "").replace(/"/g, '""')}"`,
            reg.programTitle,
            format(reg.timestamp.toDate(), "yyyy-MM-dd HH:mm")
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `registrations_${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredRegistrations = registrations.filter(reg => {
        const name = reg.name || reg.applicantName || "";
        const phone = reg.phone || reg.applicantMobile || "";
        const title = reg.programTitle || "";
        const qualification = reg.qualification || "";
        const currentStatus = reg.currentStatus || "";
        const search = searchTerm.toLowerCase();
        
        return name.toLowerCase().includes(search) ||
               phone.includes(search) ||
               title.toLowerCase().includes(search) ||
               qualification.toLowerCase().includes(search) ||
               currentStatus.toLowerCase().includes(search);
    });

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Public Registration</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage programs and analyze user submissions
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[500px] h-11">
                    <TabsTrigger value="programs" className="h-full">Manage Programs</TabsTrigger>
                    <TabsTrigger value="submissions" className="h-full">View Submissions & Analytics</TabsTrigger>
                </TabsList>

                {/* Programs Tab */}
                <TabsContent value="programs" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Registration Programs</h2>
                        <Button onClick={() => openProgramDialog()}>
                            <Plus className="w-4 h-4 mr-2" /> Create Program
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {programs.map((program) => (
                            <Card key={program.id} className="relative group overflow-hidden border-primary/10 hover:border-primary/30 transition-all">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${program.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {program.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProgramDialog(program)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProgram(program.id!)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl mt-2">{program.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{program.regInfo || "No additional information"}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>{format(program.startDate.toDate(), "PPP p")} - {format(program.endDate.toDate(), "PPP p")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>{registrations.filter(r => r.programId === program.id).length} Submissions</span>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                        onClick={() => {
                                            setActiveTab("submissions");
                                            setSearchTerm(program.name || "");
                                        }}
                                    >
                                        View Registrations <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Submissions Tab */}
                <TabsContent value="submissions" className="space-y-6">
                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1 bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <p className="text-3xl font-bold text-primary">{analytics.total}</p>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Total Registrations</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Top Programs</p>
                                        {analytics.programCounts.slice(0, 3).map((p, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="truncate mr-2">{p.name}</span>
                                                <span className="font-bold">{p.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Registration Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px] pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.programCounts} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            interval={0}
                                        />
                                        <YAxis hide />
                                        <RechartTooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                                            {analytics.programCounts.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name, phone, or program..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleExportCSV}>
                                <Download className="w-4 h-4 mr-2" /> Export CSV
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Applicant</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Occupation/Status</TableHead>
                                    <TableHead>Qualification</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRegistrations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No registrations found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRegistrations.map((reg) => (
                                        <TableRow key={reg.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <div className="font-medium">{reg.name || reg.applicantName}</div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{reg.email || "No email"}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-0.5 rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                                                    {reg.programTitle}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-[11px] font-medium max-w-[100px] truncate">
                                                {reg.currentStatus || "N/A"}
                                            </TableCell>
                                            <TableCell className="text-[11px] font-medium max-w-[100px] truncate">
                                                {reg.qualification || reg.academicBackground || reg.applicantClass || "N/A"}
                                            </TableCell>
                                            <TableCell className="text-sm whitespace-nowrap">{reg.phone || reg.applicantMobile}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(reg.timestamp.toDate(), "dd MMM yy")}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => openRegDialog(reg)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => {
                                                        setSelectedReg(reg);
                                                        setIsDetailOpen(true);
                                                    }}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors" onClick={() => handleDeleteRegistration(reg.id!)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Program Dialog */}
            <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingProgramId ? "Edit Program" : "Create New Program"}</DialogTitle>
                        <DialogDescription>Configure public registration metadata</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Program Name</Label>
                                <Input 
                                    value={programForm.name} 
                                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} 
                                    placeholder="e.g., Faith Fest 2026"
                                />
                            </div>
                            <DateTimePicker 
                                label="Start Date & Time"
                                date={programForm.startDate}
                                onChange={(date) => setProgramForm({ ...programForm, startDate: date })}
                            />
                            <DateTimePicker 
                                label="End Date & Time"
                                date={programForm.endDate}
                                onChange={(date) => setProgramForm({ ...programForm, endDate: date })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Registration Info (Instructions)</Label>
                            <Textarea 
                                value={programForm.regInfo} 
                                onChange={(e) => setProgramForm({ ...programForm, regInfo: e.target.value })} 
                                placeholder="Instructions for applicants..."
                                rows={4}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="is-active" 
                                checked={programForm.isActive} 
                                onCheckedChange={(val) => setProgramForm({ ...programForm, isActive: val })}
                            />
                            <Label htmlFor="is-active">Active and Visible for Registration</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProgram}>
                            {editingProgramId ? "Update Program" : "Create Program"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Registration Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0">
                    {selectedReg && (
                        <div className="flex flex-col">
                            {/* Header Gradient */}
                            <div className="bg-gradient-to-br from-primary to-primary-foreground h-32 relative">
                                <div className="absolute -bottom-10 left-6">
                                    <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white">
                                        <Users className="w-12 h-12 text-primary" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 pb-8 px-6 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedReg.name || selectedReg.applicantName}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3" /> {selectedReg.qualification || selectedReg.academicBackground || selectedReg.applicantClass || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p>
                                            <p className="text-sm font-semibold">{selectedReg.phone || selectedReg.applicantMobile}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</p>
                                            <p className="text-sm font-semibold">{selectedReg.email || "Not provided"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Status / Occupation</p>
                                            <p className="text-sm font-semibold">{selectedReg.currentStatus || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Address / Location</p>
                                            <p className="text-sm font-semibold">{selectedReg.address || selectedReg.applicantPlace || "N/A"}</p>
                                        </div>
                                    </div>

                                    {(selectedReg.applicantSchool || selectedReg.applicantClass) && (
                                        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border-l-4 border-yellow-500">
                                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-yellow-600">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Academic Details (Legacy)</p>
                                                <p className="text-sm font-semibold">{selectedReg.applicantSchool} - {selectedReg.applicantClass}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold border-t">
                                    <span>Registered On</span>
                                    <span>{format(selectedReg.timestamp.toDate(), "PPPP")}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Registration Edit Dialog */}
            <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Registration</DialogTitle>
                        <DialogDescription>Modify applicant details and program assignment</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Applicant Name</Label>
                                <Input 
                                    value={regForm.name || regForm.applicantName || ""} 
                                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input 
                                    value={regForm.phone || regForm.applicantMobile || ""} 
                                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input 
                                    value={regForm.email || ""} 
                                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Program Selection</Label>
                                <Select 
                                    value={regForm.programId} 
                                    onValueChange={(val) => setRegForm({ ...regForm, programId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => (
                                            <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Qualification</Label>
                                <Input 
                                    value={regForm.qualification || ""} 
                                    onChange={(e) => setRegForm({ ...regForm, qualification: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Current Status / Occupation</Label>
                                <Input 
                                    value={regForm.currentStatus || ""} 
                                    onChange={(e) => setRegForm({ ...regForm, currentStatus: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Academic Background</Label>
                                <Input 
                                    value={regForm.academicBackground || regForm.applicantClass || ""} 
                                    onChange={(e) => setRegForm({ ...regForm, academicBackground: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Address</Label>
                                <Textarea 
                                    value={regForm.address || regForm.applicantPlace || ""} 
                                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })} 
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRegDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRegistration}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

