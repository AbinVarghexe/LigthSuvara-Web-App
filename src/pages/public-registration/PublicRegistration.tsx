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
    FileText,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { PremiumPublicRegistrationPdfService } from "../../features/reports/services/publicRegistrationPdfService";
import * as XLSX from "xlsx";
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
import { CustomField } from "../../features/programs/services/programService";
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
                >
                    <div 
                        className="max-h-[480px] overflow-y-auto overflow-x-hidden scroll-smooth [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] focus:outline-none" 
                        tabIndex={-1}
                        onWheel={(e) => {
                            e.stopPropagation();
                            e.currentTarget.scrollTop += e.deltaY;
                        }}
                    >
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
                                            <SelectContent position="popper" className="max-h-60 overflow-y-auto">
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
                                        <SelectContent position="popper" className="max-h-60 overflow-y-auto">
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

const getPredefinedFields = (): CustomField[] => [
    { id: "name", name: "Name", type: "text", isMandatory: true },
    { id: "phone", name: "Phone Number", type: "text", isMandatory: true },
    { id: "email", name: "Email", type: "text", isMandatory: false },
    { id: "qualification", name: "Qualification", type: "text", isMandatory: false },
    { id: "currentStatus", name: "Current Status / Occupation", type: "text", isMandatory: false },
    { id: "address", name: "Address", type: "text", isMandatory: false },
];
const getProgramStatus = (program: ProgramMetadata) => {
    const now = new Date();
    const startDate = program.startDate instanceof Timestamp ? program.startDate.toDate() : new Date(program.startDate);
    const endDate = program.endDate instanceof Timestamp ? program.endDate.toDate() : new Date(program.endDate);

    if (!program.isActive) {
        return { label: "Inactive", className: "bg-gray-100 text-gray-500" };
    }
    if (now < startDate) {
        return { label: "Upcoming", className: "bg-blue-100 text-blue-700" };
    }
    if (now > endDate) {
        return { label: "Closed", className: "bg-red-100 text-red-700" };
    }
    return { label: "Active", className: "bg-green-100 text-green-700" };
};

export function PublicRegistration() {
    const [programs, setPrograms] = useState<ProgramMetadata[]>([]);
    const [registrations, setRegistrations] = useState<RegistrationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("programs");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
    
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
        customFields: [],
    });

    const getFieldValue = (reg: RegistrationType, fieldId: string): string => {
        if (reg.customFieldValues && reg.customFieldValues[fieldId] !== undefined) {
            const val = reg.customFieldValues[fieldId];
            if (typeof val === 'boolean') return val ? 'Yes' : 'No';
            return String(val);
        }
        switch (fieldId) {
            case 'name':
                return reg.name || reg.applicantName || "";
            case 'phone':
                return reg.phone || reg.applicantMobile || "";
            case 'email':
                return reg.email || "";
            case 'address':
                return reg.address || reg.applicantPlace || "";
            case 'academicBackground':
                return reg.academicBackground || reg.applicantClass || "";
            case 'qualification':
                return reg.qualification || "";
            case 'currentStatus':
                return reg.currentStatus || "";
            default:
                return "";
        }
    };

    const handleGetFormValue = (fieldId: string): any => {
        if (regForm.customFieldValues && regForm.customFieldValues[fieldId] !== undefined) {
            return regForm.customFieldValues[fieldId];
        }
        switch (fieldId) {
            case 'name':
                return regForm.name || regForm.applicantName || "";
            case 'phone':
                return regForm.phone || regForm.applicantMobile || "";
            case 'email':
                return regForm.email || "";
            case 'address':
                return regForm.address || regForm.applicantPlace || "";
            case 'academicBackground':
                return regForm.academicBackground || regForm.applicantClass || "";
            case 'qualification':
                return regForm.qualification || "";
            case 'currentStatus':
                return regForm.currentStatus || "";
            default:
                return "";
        }
    };

    const handleSetFormValue = (fieldId: string, value: any) => {
        switch (fieldId) {
            case 'name':
                setRegForm(prev => ({ ...prev, name: value }));
                break;
            case 'phone':
                setRegForm(prev => ({ ...prev, phone: value }));
                break;
            case 'email':
                setRegForm(prev => ({ ...prev, email: value }));
                break;
            case 'qualification':
                setRegForm(prev => ({ ...prev, qualification: value }));
                break;
            case 'currentStatus':
                setRegForm(prev => ({ ...prev, currentStatus: value }));
                break;
            case 'academicBackground':
                setRegForm(prev => ({ ...prev, academicBackground: value }));
                break;
            case 'address':
                setRegForm(prev => ({ ...prev, address: value }));
                break;
            default:
                setRegForm(prev => ({
                    ...prev,
                    customFieldValues: {
                        ...(prev.customFieldValues || {}),
                        [fieldId]: value
                    }
                }));
                break;
        }
    };

    const addField = () => {
        const newField: CustomField = {
            id: "field_" + Math.random().toString(36).substring(2, 9),
            name: "",
            type: "text",
            isMandatory: false,
            options: [],
        };
        setProgramForm(prev => ({
            ...prev,
            customFields: [...(prev.customFields || []), newField]
        }));
    };

    const removeField = (id: string) => {
        setProgramForm(prev => ({
            ...prev,
            customFields: (prev.customFields || []).filter(f => f.id !== id)
        }));
    };

    const updateField = (id: string, updates: Partial<CustomField>) => {
        setProgramForm(prev => ({
            ...prev,
            customFields: (prev.customFields || []).map(f => {
                if (f.id === id) {
                    return { ...f, ...updates };
                }
                return f;
            })
        }));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const fields = [...(programForm.customFields || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= fields.length) return;
        
        const temp = fields[index];
        fields[index] = fields[targetIndex];
        fields[targetIndex] = temp;

        setProgramForm(prev => ({
            ...prev,
            customFields: fields
        }));
    };

    const renderFieldsBuilder = () => {
        const fields = programForm.customFields || [];
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label className="font-semibold text-sm">
                        Registration Fields Config
                    </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                    Customize the fields to be filled by applicants. Predefined fields are populated by default.
                </p>

                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col gap-3 p-3 bg-muted/30 dark:bg-gray-800/40 rounded-xl border border-primary/10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Field Label</Label>
                                    <Input
                                        value={field.name}
                                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                                        placeholder="e.g. Email Address, Age"
                                        className="h-8 text-xs rounded-lg"
                                    />
                                </div>
                                <div className="w-32 space-y-1">
                                    <Label className="text-xs">Field Type</Label>
                                    <Select
                                        value={['name', 'phone', 'email', 'qualification', 'currentStatus', 'address'].includes(field.id) ? field.id : field.type}
                                        onValueChange={(val: any) => {
                                            const updates: Partial<CustomField> = {};
                                            const predefined = ['name', 'phone', 'email', 'qualification', 'currentStatus', 'address'];
                                            
                                            if (val === 'name') {
                                                updates.id = 'name';
                                                updates.type = 'text';
                                            } else if (val === 'phone') {
                                                updates.id = 'phone';
                                                updates.type = 'text';
                                            } else if (val === 'email') {
                                                updates.id = 'email';
                                                updates.type = 'text';
                                            } else if (val === 'qualification') {
                                                updates.id = 'qualification';
                                                updates.type = 'text';
                                            } else if (val === 'currentStatus') {
                                                updates.id = 'currentStatus';
                                                updates.type = 'text';
                                            } else if (val === 'address') {
                                                updates.id = 'address';
                                                updates.type = 'text';
                                            } else {
                                                updates.type = val;
                                                // If switching away from a predefined ID, revert to random ID
                                                if (predefined.includes(field.id)) {
                                                    updates.id = "field_" + Math.random().toString(36).substring(2, 9);
                                                }
                                            }
                                            updateField(field.id, updates);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Yes/No</SelectItem>
                                            <SelectItem value="select">Dropdown</SelectItem>
                                            <SelectItem value="name">Name Field (id: name)</SelectItem>
                                            <SelectItem value="phone">Phone Number Field (id: phone)</SelectItem>
                                            <SelectItem value="email">Email Field (id: email)</SelectItem>
                                            <SelectItem value="qualification">Qualification Field (id: qualification)</SelectItem>
                                            <SelectItem value="currentStatus">Current Status Field (id: currentStatus)</SelectItem>
                                            <SelectItem value="address">Address Field (id: address)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2 sm:pt-5">
                                    <div className="flex items-center space-x-1.5">
                                        <Switch
                                            id={`mandatory-${field.id}`}
                                            checked={field.isMandatory}
                                            onCheckedChange={(checked) => updateField(field.id, { isMandatory: checked })}
                                        />
                                        <Label htmlFor={`mandatory-${field.id}`} className="text-xs cursor-pointer select-none">Required</Label>
                                    </div>
                                    <div className="flex items-center gap-0.5 ml-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => moveField(index, 'up')}
                                            disabled={index === 0}
                                            className="h-7 w-7 text-muted-foreground hover:bg-primary/10 rounded-md"
                                        >
                                            <span className="text-xs">▲</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => moveField(index, 'down')}
                                            disabled={index === fields.length - 1}
                                            className="h-7 w-7 text-muted-foreground hover:bg-primary/10 rounded-md"
                                        >
                                            <span className="text-xs">▼</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeField(field.id)}
                                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md ml-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            {field.type === 'select' && (
                                <div className="space-y-1.5 pt-1 border-t border-dashed border-primary/5">
                                    <Label className="text-xs">Dropdown Options (Comma-separated)</Label>
                                    <Input
                                        value={field.options?.join(', ') || ""}
                                        onChange={(e) => updateField(field.id, { 
                                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                                        })}
                                        placeholder="e.g. Option 1, Option 2, Option 3"
                                        className="h-8 text-xs rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs">
                            No registration fields defined. Click the button below to add one.
                        </div>
                    )}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    className="w-full border-dashed flex items-center justify-center gap-1.5 text-xs h-8 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" /> Add Custom Field
                </Button>
            </div>
        );
    };

    const openProgramDialog = (program?: ProgramMetadata) => {
        if (program) {
            // Use existing fields if present, else fallback to predefined fields
            const existingFields = program.customFields !== undefined
                ? program.customFields
                : getPredefinedFields();

            setProgramForm({ 
                ...program,
                customFields: existingFields
            });
            setEditingProgramId(program.id);
        } else {
            setProgramForm({
                name: "",
                isActive: true,
                regInfo: "",
                startDate: Timestamp.now(),
                endDate: Timestamp.now(),
                customFields: getPredefinedFields(),
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
            
            // Dynamically filter out 'academicBackground' from existing program schemas
            const cleanedProgs = progs.map(p => {
                if (p.customFields) {
                    return {
                        ...p,
                        customFields: p.customFields.filter(f => f.id !== 'academicBackground')
                    };
                }
                return p;
            });

            setPrograms(cleanedProgs);
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

    const filteredRegistrations = useMemo(() => {
        return registrations.filter(reg => {
            if (selectedProgramId !== "all" && reg.programId !== selectedProgramId) {
                return false;
            }
            
            const name = reg.name || reg.applicantName || "";
            const phone = reg.phone || reg.applicantMobile || "";
            const program = programs.find(p => p.id === reg.programId);
            const title = program?.name || reg.programTitle || "";
            const qualification = reg.qualification || "";
            const currentStatus = reg.currentStatus || "";
            const search = searchTerm.toLowerCase();
            
            return name.toLowerCase().includes(search) ||
                   phone.includes(search) ||
                   title.toLowerCase().includes(search) ||
                   qualification.toLowerCase().includes(search) ||
                   currentStatus.toLowerCase().includes(search);
        }).map(reg => {
            const program = programs.find(p => p.id === reg.programId);
            return {
                ...reg,
                programTitle: program?.name || reg.programTitle
            };
        });
    }, [registrations, selectedProgramId, searchTerm, programs]);

    const activeProgram = useMemo(() => {
        return programs.find(p => p.id === selectedProgramId);
    }, [programs, selectedProgramId]);

    const tableFields = useMemo(() => {
        if (activeProgram && activeProgram.customFields !== undefined) {
            return activeProgram.customFields;
        }
        return getPredefinedFields();
    }, [activeProgram]);

    const visibleTableFields = useMemo(() => {
        return tableFields.filter(f => f.id !== 'email');
    }, [tableFields]);

    const selectedRegProgram = useMemo(() => {
        if (!selectedReg) return null;
        return programs.find(p => p.id === selectedReg.programId);
    }, [selectedReg, programs]);

    const selectedRegFields = useMemo(() => {
        if (selectedRegProgram && selectedRegProgram.customFields !== undefined) {
            return selectedRegProgram.customFields;
        }
        return getPredefinedFields();
    }, [selectedRegProgram]);

    const editingRegProgram = useMemo(() => {
        if (!regForm.programId) return null;
        return programs.find(p => p.id === regForm.programId);
    }, [regForm.programId, programs]);

    const editingRegFields = useMemo(() => {
        if (editingRegProgram && editingRegProgram.customFields !== undefined) {
            return editingRegProgram.customFields;
        }
        return getPredefinedFields();
    }, [editingRegProgram]);

    const getFieldIcon = (fieldId: string) => {
        switch (fieldId) {
            case 'phone':
                return <Phone className="w-5 h-5" />;
            case 'email':
                return <Mail className="w-5 h-5" />;
            case 'address':
                return <MapPin className="w-5 h-5" />;
            case 'academicBackground':
            case 'qualification':
                return <GraduationCap className="w-5 h-5" />;
            case 'currentStatus':
                return <Briefcase className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
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

    const handleExportExcel = () => {
        const regsToExport = filteredRegistrations;
        if (regsToExport.length === 0) {
            toast.error("No registrations to export");
            return;
        }

        let headers: string[] = [];
        let rows: string[][] = [];

        if (selectedProgramId !== "all" && activeProgram) {
            const fields = activeProgram.customFields || getPredefinedFields();
            headers = [...fields.map(f => f.name), "Date"];
            rows = regsToExport.map(reg => {
                const row = fields.map(field => {
                    return getFieldValue(reg, field.id);
                });
                row.push(format(reg.timestamp.toDate(), "yyyy-MM-dd HH:mm"));
                return row;
            });
        } else {
            // Default columns for all programs export
            headers = ["Name", "Phone", "Email", "Qualification", "Current Status", "Address", "Program", "Date"];
            rows = regsToExport.map(reg => [
                reg.name || reg.applicantName || "",
                reg.phone || reg.applicantMobile || "",
                reg.email || "",
                reg.qualification || "N/A",
                reg.currentStatus || "N/A",
                reg.address || reg.applicantPlace || "",
                reg.programTitle,
                format(reg.timestamp.toDate(), "yyyy-MM-dd HH:mm")
            ]);
        }

        const sheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Autofit columns by finding max length of contents
        const colWidths = headers.map((_, colIndex) => {
            let maxLen = 10; // minimum width
            sheetData.forEach(row => {
                const cellValue = row[colIndex];
                if (cellValue !== null && cellValue !== undefined) {
                    const len = String(cellValue).length;
                    if (len > maxLen) {
                        maxLen = len;
                    }
                }
            });
            return { wch: maxLen + 3 };
        });
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

        const fileNameSuffix = selectedProgramId !== "all" && activeProgram 
            ? activeProgram.name.replace(/\s+/g, "_") 
            : "all";
        
        XLSX.writeFile(workbook, `registrations_${fileNameSuffix}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const [exportingPDF, setExportingPDF] = useState(false);

    const handleExportPDF = async () => {
        const regsToExport = filteredRegistrations;
        if (regsToExport.length === 0) {
            toast.error("No registrations to export");
            return;
        }

        setExportingPDF(true);
        toast.info("Generating registrations PDF...");

        try {
            const programName = selectedProgramId !== "all" && activeProgram
                ? activeProgram.name
                : "All Programs";

            await PremiumPublicRegistrationPdfService.generateReport(
                regsToExport,
                programName,
                tableFields,
                selectedProgramId
            );
            toast.success("PDF generated successfully");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setExportingPDF(false);
        }
    };

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
                        {programs.map((program) => {
                            const status = getProgramStatus(program);
                            return (
                                <Card key={program.id} className="relative group overflow-hidden border-primary/10 hover:border-primary/30 transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${status.className}`}>
                                                {status.label}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <Button 
                                                    size="icon" 
                                                    variant="outline" 
                                                    className="h-8 w-8 border-primary/10 hover:bg-primary/10 hover:text-primary transition-colors bg-background" 
                                                    onClick={() => openProgramDialog(program)}
                                                    title="Edit Program"
                                                >
                                                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="outline" 
                                                    className="h-8 w-8 text-destructive border-destructive/10 hover:bg-destructive/10 hover:text-destructive transition-colors bg-background" 
                                                    onClick={() => handleDeleteProgram(program.id!)}
                                                    title="Delete Program"
                                                >
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
                                                setSelectedProgramId(program.id || "all");
                                                setSearchTerm("");
                                            }}
                                        >
                                            View Registrations <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
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
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by name, phone, or program..." 
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-64">
                                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by Program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Programs</SelectItem>
                                        {programs.map(p => (
                                            <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleExportExcel}>
                                <Download className="w-4 h-4 mr-2" /> Export Excel
                            </Button>
                            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleExportPDF} disabled={exportingPDF}>
                                {exportingPDF ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {selectedProgramId === "all" && <TableHead>Program</TableHead>}
                                    {visibleTableFields.map(field => (
                                        <TableHead key={field.id}>{field.name}</TableHead>
                                    ))}
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRegistrations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleTableFields.length + (selectedProgramId === "all" ? 3 : 2)} className="text-center py-10 text-muted-foreground">
                                            No registrations found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRegistrations.map((reg) => (
                                        <TableRow key={reg.id} className="hover:bg-muted/50 transition-colors">
                                            {selectedProgramId === "all" && (
                                                <TableCell>
                                                    <span className="px-2 py-0.5 rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                                                        {reg.programTitle}
                                                    </span>
                                                </TableCell>
                                            )}
                                            {visibleTableFields.map(field => (
                                                <TableCell key={field.id} className="text-sm">
                                                    {field.id === 'name' ? (
                                                        <div>
                                                            <div className="font-medium">{getFieldValue(reg, 'name')}</div>
                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{reg.email || "No email"}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="max-w-[150px] truncate">
                                                            {getFieldValue(reg, field.id) || "N/A"}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}
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
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>{editingProgramId ? "Edit Program" : "Create New Program"}</DialogTitle>
                        <DialogDescription>Configure public registration metadata and fields schema</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                        
                        <div className="mt-6 pt-6 border-t border-primary/10">
                            {renderFieldsBuilder()}
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
                                <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                                    {selectedRegFields
                                        .filter(f => f.id !== 'name')
                                        .map(field => {
                                            const val = getFieldValue(selectedReg, field.id);
                                            if (!val) return null;
                                            return (
                                                <div key={field.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                                                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary">
                                                        {getFieldIcon(field.id)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{field.name}</p>
                                                        <p className="text-sm font-semibold">{val}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                                <Label>Program Selection</Label>
                                <Select 
                                    value={regForm.programId} 
                                    onValueChange={(val) => {
                                        const selectedProg = programs.find(p => p.id === val);
                                        setRegForm(prev => ({
                                            ...prev,
                                            programId: val,
                                            programTitle: selectedProg?.name || prev.programTitle
                                        }));
                                    }}
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

                            {editingRegFields.map(field => {
                                const value = handleGetFormValue(field.id);
                                const isFullWidth = field.id === 'name' || field.id === 'address' || field.id === 'academicBackground' || field.type === 'select';
                                
                                return (
                                    <div key={field.id} className={cn("space-y-2", isFullWidth ? "col-span-2" : "col-span-1")}>
                                        <Label>{field.name} {field.isMandatory && <span className="text-destructive">*</span>}</Label>
                                        {field.type === 'boolean' ? (
                                            <div className="flex items-center space-x-2 h-10">
                                                <Switch
                                                    id={`edit-reg-${field.id}`}
                                                    checked={!!value}
                                                    onCheckedChange={(val) => handleSetFormValue(field.id, val)}
                                                />
                                                <Label htmlFor={`edit-reg-${field.id}`} className="font-normal text-sm cursor-pointer select-none">
                                                    {value ? 'Yes' : 'No'}
                                                </Label>
                                            </div>
                                        ) : field.type === 'select' ? (
                                            <Select
                                                value={value}
                                                onValueChange={(val) => handleSetFormValue(field.id, val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${field.name}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options?.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : field.id === 'address' ? (
                                            <Textarea
                                                value={value}
                                                onChange={(e) => handleSetFormValue(field.id, e.target.value)}
                                                rows={3}
                                            />
                                        ) : (
                                            <Input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                value={value}
                                                onChange={(e) => handleSetFormValue(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                            />
                                        )}
                                    </div>
                                );
                            })}
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

