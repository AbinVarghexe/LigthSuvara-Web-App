import { useState, useEffect, useCallback, useMemo } from "react";
import { uploadFile } from "../../lib/upload";
import { cn } from "../../lib/utils";
import {
  Plus,
  Search,
  Loader2,
  Calendar,
  Users,
  Trash2,
  Edit,
  Eye,
  ChevronRight,
  Phone,
  Clock,
  FileText,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { toast } from "sonner";
import {
  createProgram,
  updateProgram,
  deleteProgram,
  getRegistrationStats,
  getProgramRegistrations,
  subscribeToPrograms,
  ProgramData,
  ProgramRegistration,
  CustomField,
} from "../../features/programs/services/programService";
import { sendNewProgramNotification } from "../../features/notifications/services/notificationService";
import { Timestamp } from "firebase/firestore";
import { PremiumProgramPdfService } from "../../features/reports/services/programPdfService";
import { getUsers, UserData } from "../../features/users/services/userService";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

// Mobile Card Component
interface ProgramCardProps {
  program: ProgramData;
  status: {
    label: string;
    variant: "secondary" | "outline" | "destructive" | "default";
  };
  registrationCount: number;
  formatDate: (date: Date | Timestamp | undefined) => string;
  openEditDialog: (program: ProgramData) => void;
  handleDeleteProgram: (id: string) => void;
  onViewDetails: (program: ProgramData) => void;
}

const ProgramCard = ({
  program,
  status,
  registrationCount,
  formatDate,
  openEditDialog,
  handleDeleteProgram,
  onViewDetails,
}: ProgramCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{program.name}</CardTitle>
            {program.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {program.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {program.isCountOnly && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 text-[11px]">
                  Count Only
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-800 flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                {registrationCount}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEditDialog(program)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Program</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{program.name}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteProgram(program.id!)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(program.startDate)} - {formatDate(program.endDate)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => onViewDetails(program)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
};

const getInitialStudentFields = (): CustomField[] => [
  { id: 'name', name: "Name", type: "text", isMandatory: true },
  { id: 'phone', name: "Phone Number", type: "phone", isMandatory: false },
  {
    id: 'class',
    name: "Class",
    type: "select",
    isMandatory: false,
    options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
  },
];

const getInitialTeacherFields = (): CustomField[] => [
  { id: 'name', name: "Name", type: "text", isMandatory: true },
  { id: 'phone', name: "Phone Number", type: "phone", isMandatory: false },
];

export function Programs() {
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramData | null>(
    null,
  );
  const [registrationCounts, setRegistrationCounts] = useState<
    Record<string, number>
  >({});

  // Detail view state
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(
    null,
  );
  const [detailRegistrations, setDetailRegistrations] = useState<
    ProgramRegistration[]
  >([]);
  const [detailStats, setDetailStats] = useState<{
    total: number;
    pending: number;
    approved: number;
    locked: number;
    rejected: number;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Detail view filters & user metadata
  const [users, setUsers] = useState<UserData[]>([]);
  const [detailForaneFilter, setDetailForaneFilter] = useState("All");
  const [detailParishFilter, setDetailParishFilter] = useState("All");
  const [detailDateFilter, setDetailDateFilter] = useState("All");
  const [detailSortOrder, setDetailSortOrder] = useState<"forane" | "date-desc" | "date-asc" | "name-asc" | "name-desc">("forane");
  const [isDetailMaximized, setIsDetailMaximized] = useState(false);
  const [isReceiptMaximized, setIsReceiptMaximized] = useState(false);

  // PDF Export Progress & Timer Modal state
  const [pdfExportProgress, setPdfExportProgress] = useState<{
    isOpen: boolean;
    statusText: string;
    progressPercent: number;
    secondsElapsed: number;
  }>({
    isOpen: false,
    statusText: "",
    progressPercent: 0,
    secondsElapsed: 0,
  });

  useEffect(() => {
    let timer: any;
    if (pdfExportProgress.isOpen) {
      timer = setInterval(() => {
        setPdfExportProgress(prev => ({
          ...prev,
          secondsElapsed: prev.secondsElapsed + 1,
        }));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pdfExportProgress.isOpen]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: true,
    isCountOnly: false,
    targetAudience: "student" as 'student' | 'teacher' | 'both',
    paymentRequired: false,
    registrationFee: 0,
    advancePercentage: 100,
    advanceType: "percentage" as 'percentage' | 'fixed',
    advanceValue: 100,
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    qrCodeUrl: "",
  });

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [studentFields, setStudentFields] = useState<CustomField[]>(() => getInitialStudentFields());
  const [teacherFields, setTeacherFields] = useState<CustomField[]>(() => getInitialTeacherFields());

  const addField = (role: 'student' | 'teacher') => {
    const newField: CustomField = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      type: "text",
      isMandatory: false,
      options: [],
    };
    if (role === 'student') {
      setStudentFields([...studentFields, newField]);
    } else {
      setTeacherFields([...teacherFields, newField]);
    }
  };

  const removeField = (role: 'student' | 'teacher', id: string) => {
    if (role === 'student') {
      setStudentFields(studentFields.filter(f => f.id !== id));
    } else {
      setTeacherFields(teacherFields.filter(f => f.id !== id));
    }
  };

  const updateField = (role: 'student' | 'teacher', id: string, updates: Partial<CustomField>) => {
    const fields = role === 'student' ? studentFields : teacherFields;
    const updated = fields.map(f => {
      if (f.id === id) {
        const merged = { ...f, ...updates };
        const isClass = merged.name.trim().toLowerCase() === 'class';
        if (isClass) {
          merged.type = 'select';
          if (!merged.options || merged.options.length === 0) {
            merged.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
          }
        }
        return merged;
      }
      return f;
    });
    if (role === 'student') {
      setStudentFields(updated);
    } else {
      setTeacherFields(updated);
    }
  };

  const getClassPresetValue = (options?: string[]) => {
    if (!options || options.length === 0) return "custom";
    const sorted = [...options].sort((a, b) => Number(a) - Number(b));
    const str = sorted.join(",");
    if (str === "1,2,3,4,5,6,7,8,9,10,11,12") return "1-12";
    if (str === "1,2,3,4") return "1-4";
    if (str === "1,2,3,4,5") return "1-5";
    if (str === "1,2,3,4,5,6,7") return "1-7";
    if (str === "1,2,3,4,5,6,7,8,9,10") return "1-10";
    if (str === "5,6,7,8,9,10") return "5-10";
    if (str === "8,9,10,11,12") return "8-12";
    if (str === "10,11,12") return "10-12";
    return "custom";
  };

  const handlePresetClassChange = (role: 'student' | 'teacher', fieldId: string, preset: string) => {
    let opts: string[] = [];
    switch (preset) {
      case "1-12":
        opts = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        break;
      case "1-4":
        opts = ["1", "2", "3", "4"];
        break;
      case "1-5":
        opts = ["1", "2", "3", "4", "5"];
        break;
      case "1-7":
        opts = ["1", "2", "3", "4", "5", "6", "7"];
        break;
      case "1-10":
        opts = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        break;
      case "5-10":
        opts = ["5", "6", "7", "8", "9", "10"];
        break;
      case "8-12":
        opts = ["8", "9", "10", "11", "12"];
        break;
      case "10-12":
        opts = ["10", "11", "12"];
        break;
      default:
        opts = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        break;
    }
    updateField(role, fieldId, { options: opts, type: 'select' });
  };

  const renderFieldsBuilder = (role: 'student' | 'teacher') => {
    const fields = role === 'student' ? studentFields : teacherFields;
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-sm">
            {role === 'student' ? 'Student Registration Fields' : 'Teacher Registration Fields'}
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure registration fields for {role === 'student' ? 'students' : 'teachers'}. You can edit, set required, or delete any field (including Phone Number).
        </p>

        <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
          {fields.map((field) => {
            const isClassField = field.name.trim().toLowerCase() === 'class' || field.type === 'select';
            const selectedOptions = field.options || ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

            return (
              <div key={field.id} className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Field Label</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const isClass = newName.trim().toLowerCase() === 'class';
                        updateField(role, field.id, {
                          name: newName,
                          type: isClass ? 'select' : field.type,
                          options: isClass && (!field.options || field.options.length === 0)
                            ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
                            : field.options
                        });
                      }}
                      placeholder="e.g. Name, Phone Number, Class"
                      className="h-8 text-xs"
                    />
                  </div>

                  {isClassField && (
                    <div className="w-full sm:w-48 space-y-1">
                      <Label className="text-xs">Allowed Classes Dropdown</Label>
                      <Select
                        value={getClassPresetValue(field.options)}
                        onValueChange={(val) => handlePresetClassChange(role, field.id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-300">
                          <SelectValue placeholder="Select classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-12">Classes 1 to 12 (Default)</SelectItem>
                          <SelectItem value="1-4">Classes 1 to 4</SelectItem>
                          <SelectItem value="1-5">Classes 1 to 5</SelectItem>
                          <SelectItem value="1-7">Classes 1 to 7</SelectItem>
                          <SelectItem value="1-10">Classes 1 to 10</SelectItem>
                          <SelectItem value="5-10">Classes 5 to 10</SelectItem>
                          <SelectItem value="8-12">Classes 8 to 12</SelectItem>
                          <SelectItem value="10-12">Classes 10 to 12</SelectItem>
                          <SelectItem value="custom">Custom Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-3 sm:pt-5">
                    <div className="flex items-center space-x-1.5">
                      <Switch
                        id={`mandatory-${role}-${field.id}`}
                        checked={field.isMandatory}
                        onCheckedChange={(checked) => updateField(role, field.id, { isMandatory: checked })}
                      />
                      <Label htmlFor={`mandatory-${role}-${field.id}`} className="text-xs cursor-pointer select-none">Required</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(role, field.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isClassField && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Class Dropdown Options ({selectedOptions.length} Classes Selected)
                      </Label>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2 py-0"
                          onClick={() => updateField(role, field.id, { options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] })}
                        >
                          Select All (1-12)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2 py-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => updateField(role, field.id, { options: [] })}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
                      {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map((clsNum) => {
                        const isChecked = selectedOptions.includes(clsNum);
                        return (
                          <button
                            key={clsNum}
                            type="button"
                            onClick={() => {
                              const newOpts = isChecked
                                ? selectedOptions.filter((o) => o !== clsNum)
                                : [...selectedOptions, clsNum].sort((a, b) => Number(a) - Number(b));
                              updateField(role, field.id, { options: newOpts });
                            }}
                            className={cn(
                              "px-2 py-1 text-xs rounded border text-center transition-all font-medium select-none flex items-center justify-center gap-1",
                              isChecked
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                            )}
                          >
                            <span>Class {clsNum}</span>
                            {isChecked && <span className="text-[10px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {fields.length === 0 && (
            <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs">
              No custom fields defined. Click the button below to add one.
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addField(role)}
          className="w-full border-dashed flex items-center justify-center gap-1.5 text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5" /> Add Field
        </Button>
      </div>
    );
  };

  // Real-time subscription to programs & users metadata
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPrograms(async (programsData) => {
      setPrograms(programsData);
      setLoading(false);

      // Fetch registration counts independently
      try {
        const counts: Record<string, number> = {};
        for (const program of programsData) {
          if (program.id) {
            const stats = await getRegistrationStats(program.id);
            counts[program.id] = stats.total;
          }
        }
        setRegistrationCounts(counts);
      } catch (statsError) {
        console.error("Error fetching registration stats:", statsError);
      }
    });

    const fetchUsersList = async () => {
      try {
        const uList = await getUsers();
        setUsers(uList);
      } catch (e) {
        console.error("Error fetching users list:", e);
      }
    };
    fetchUsersList();

    return () => unsubscribe();
  }, []);

  // Compute available Foranes & Parishes for filtering in detail view
  const availableForanes = useMemo(() => {
    const set = new Set<string>();
    detailRegistrations.forEach((reg) => {
      const schoolInfo = users.find((u) => u.uid === reg.schoolUserId || u.id === reg.schoolUserId);
      const forane = schoolInfo?.forane;
      if (forane) set.add(forane);
    });
    return Array.from(set).sort();
  }, [detailRegistrations, users]);

  const availableParishes = useMemo(() => {
    const set = new Set<string>();
    detailRegistrations.forEach((reg) => {
      const schoolInfo = users.find((u) => u.uid === reg.schoolUserId || u.id === reg.schoolUserId);
      const regForane = schoolInfo?.forane || 'Unknown Forane';
      const regParish = reg.schoolName || schoolInfo?.schoolName || schoolInfo?.schoolname;
      if (detailForaneFilter === "All" || regForane === detailForaneFilter) {
        if (regParish) set.add(regParish);
      }
    });
    return Array.from(set).sort();
  }, [detailRegistrations, users, detailForaneFilter]);

  const availableSubmissionDates = useMemo(() => {
    const dateMap = new Map<string, { key: string; label: string; time: number }>();
    detailRegistrations.forEach((reg) => {
      if (reg.submittedAt) {
        const d = reg.submittedAt.toDate();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        if (!dateMap.has(key)) {
          const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          dateMap.set(key, { key, label, time: startOfDay });
        }
      }
    });
    return Array.from(dateMap.values()).sort((a, b) => b.time - a.time);
  }, [detailRegistrations]);

  const filteredDetailRegistrations = useMemo(() => {
    const filtered = detailRegistrations.filter((reg) => {
      const schoolInfo = users.find((u) => u.uid === reg.schoolUserId || u.id === reg.schoolUserId);
      const regForane = schoolInfo?.forane || 'Unknown Forane';
      const regParish = reg.schoolName || schoolInfo?.schoolName || schoolInfo?.schoolname || 'Unknown Parish';

      const matchForane = detailForaneFilter === "All" || regForane === detailForaneFilter;
      const matchParish = detailParishFilter === "All" || regParish === detailParishFilter;

      let matchDate = true;
      if (detailDateFilter !== "All") {
        if (!reg.submittedAt) {
          matchDate = false;
        } else {
          const d = reg.submittedAt.toDate();
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          matchDate = key === detailDateFilter;
        }
      }

      return matchForane && matchParish && matchDate;
    });

    return filtered.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
      return detailSortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [detailRegistrations, users, detailForaneFilter, detailParishFilter, detailDateFilter, detailSortOrder]);

  const openDetailDialog = useCallback(async (program: ProgramData) => {
    setSelectedProgram(program);
    setDetailForaneFilter("All");
    setDetailParishFilter("All");
    setDetailDateFilter("All");
    setDetailSortOrder("desc");
    setIsDetailMaximized(false);
    setIsDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailRegistrations([]);
    setDetailStats(null);

    try {
      const [registrations, stats] = await Promise.all([
        getProgramRegistrations(program.id!),
        getRegistrationStats(program.id!),
      ]);
      setDetailRegistrations(registrations);
      setDetailStats(stats);
    } catch (error) {
      console.error("Error fetching program details:", error);
      toast.error("Failed to load program details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCreateProgram = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createProgram({
        name: formData.name,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isActive: formData.isActive,
        isCountOnly: formData.isCountOnly,
        targetAudience: formData.targetAudience,
        studentFields: formData.isCountOnly ? [] : (formData.targetAudience === 'teacher' ? [] : studentFields),
        teacherFields: formData.isCountOnly ? [] : (formData.targetAudience === 'student' ? [] : teacherFields),
        paymentDetails: {
          isRequired: formData.paymentRequired,
          registrationFee: Number(formData.registrationFee) || 0,
          advancePercentage: formData.advanceType === 'percentage' ? (Number(formData.advanceValue) || 100) : 100,
          advanceType: formData.advanceType,
          advanceValue: Number(formData.advanceValue) || 0,
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          qrCodeUrl: formData.qrCodeUrl,
        }
      });

      // Send popup notification to all schools (Skip for Test Programs)
      const isTestProgram = formData.name.toLowerCase().includes("test");
      if (!isTestProgram) {
        try {
          await sendNewProgramNotification(formData.name);
        } catch (notifError) {
          console.error("Error sending new program notification:", notifError);
        }
      } else {
        toast.info("Skipped sending notifications (Test Program detected)");
      }

      toast.success("Program created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating program:", error);
      toast.error("Failed to create program");
    }
  };

  const handleUpdateProgram = async () => {
    if (
      !editingProgram?.id ||
      !formData.name ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await updateProgram(editingProgram.id, {
        name: formData.name,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isActive: formData.isActive,
        isCountOnly: formData.isCountOnly,
        targetAudience: formData.targetAudience,
        studentFields: formData.isCountOnly ? [] : (formData.targetAudience === 'teacher' ? [] : studentFields),
        teacherFields: formData.isCountOnly ? [] : (formData.targetAudience === 'student' ? [] : teacherFields),
        paymentDetails: {
          isRequired: formData.paymentRequired,
          registrationFee: Number(formData.registrationFee) || 0,
          advancePercentage: formData.advanceType === 'percentage' ? (Number(formData.advanceValue) || 100) : 100,
          advanceType: formData.advanceType,
          advanceValue: Number(formData.advanceValue) || 0,
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          qrCodeUrl: formData.qrCodeUrl,
        }
      });
      toast.success("Program updated successfully");
      setIsEditDialogOpen(false);
      setEditingProgram(null);
      resetForm();
    } catch (error) {
      console.error("Error updating program:", error);
      toast.error("Failed to update program");
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    try {
      await deleteProgram(programId);
      toast.success("Program deleted successfully");
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error("Failed to delete program");
    }
  };

  const openEditDialog = (program: ProgramData) => {
    setEditingProgram(program);
    const startDate =
      program.startDate instanceof Timestamp
        ? program.startDate.toDate()
        : new Date(program.startDate);
    const endDate =
      program.endDate instanceof Timestamp
        ? program.endDate.toDate()
        : new Date(program.endDate);

    setFormData({
      name: program.name,
      description: program.description || "",
      startDate: toLocalDateTimeString(startDate),
      endDate: toLocalDateTimeString(endDate),
      isActive: program.isActive,
      isCountOnly: !!program.isCountOnly,
      targetAudience: program.targetAudience || "student",
      paymentRequired: program.paymentDetails?.isRequired || false,
      registrationFee: program.paymentDetails?.registrationFee || 0,
      advancePercentage: program.paymentDetails?.advancePercentage !== undefined ? program.paymentDetails.advancePercentage : 100,
      advanceType: program.paymentDetails?.advanceType || "percentage",
      advanceValue: program.paymentDetails?.advanceValue !== undefined
        ? program.paymentDetails.advanceValue
        : (program.paymentDetails?.advancePercentage !== undefined ? program.paymentDetails.advancePercentage : 100),
      bankName: program.paymentDetails?.bankName || "",
      accountName: program.paymentDetails?.accountName || "",
      accountNumber: program.paymentDetails?.accountNumber || "",
      ifscCode: program.paymentDetails?.ifscCode || "",
      qrCodeUrl: program.paymentDetails?.qrCodeUrl || "",
    });

    const stFields = (program.studentFields && program.studentFields.length > 0)
      ? program.studentFields
      : getInitialStudentFields();
    const tcFields = (program.teacherFields && program.teacherFields.length > 0)
      ? program.teacherFields
      : getInitialTeacherFields();

    setStudentFields(stFields);
    setTeacherFields(tcFields);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      isActive: true,
      isCountOnly: false,
      targetAudience: "student",
      paymentRequired: false,
      registrationFee: 0,
      advancePercentage: 100,
      advanceType: "percentage",
      advanceValue: 100,
      bankName: "",
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      qrCodeUrl: "",
    });
    setStudentFields(getInitialStudentFields());
    setTeacherFields(getInitialTeacherFields());
  };

  const getStatusColor = (status: ProgramRegistration["status"]) => {
    switch (status) {
      case "pending_parish":
        return "bg-yellow-100 text-yellow-800";
      case "approved_parish":
        return "bg-green-100 text-green-800";
      case "locked":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: ProgramRegistration["status"]) => {
    switch (status) {
      case "pending_parish":
        return "Pending";
      case "approved_parish":
        return "Approved";
      case "locked":
        return "Locked";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "N/A";
    try {
      const d = date instanceof Timestamp ? date.toDate() : new Date(date);
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return "Invalid Date";
    }
  };

  const toLocalDateTimeString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getProgramStatus = (program: ProgramData) => {
    const now = new Date();
    const startDate =
      program.startDate instanceof Timestamp
        ? program.startDate.toDate()
        : new Date(program.startDate);
    const endDate =
      program.endDate instanceof Timestamp
        ? program.endDate.toDate()
        : new Date(program.endDate);

    if (!program.isActive) {
      return { label: "Inactive", variant: "secondary" as const };
    }
    if (now < startDate) {
      return { label: "Upcoming", variant: "outline" as const };
    }
    if (now > endDate) {
      return { label: "Closed", variant: "destructive" as const };
    }
    return { label: "Active", variant: "default" as const };
  };

  const handleExportRegistrations = async (role: "student" | "teacher", format: "csv" | "pdf") => {
    if (!selectedProgram || filteredDetailRegistrations.length === 0) return;

    const customFields = role === 'student'
      ? selectedProgram.studentFields || []
      : selectedProgram.teacherFields || [];

    const roleRegs = filteredDetailRegistrations.filter((r: ProgramRegistration) => {
      if (role === 'student') {
        return !r.type || r.type === 'student';
      }
      return r.type === 'teacher';
    });

    if (roleRegs.length === 0) {
      toast.error(`No registered ${role}s found for the selected filters`);
      return;
    }

    const pd = selectedProgram.paymentDetails;
    const regFee = pd?.registrationFee || 0;
    const advType = pd?.advanceType || 'percentage';
    const advValue = pd?.advanceValue !== undefined ? pd.advanceValue : (pd?.advancePercentage !== undefined ? pd.advancePercentage : 100);
    let advPerHead = regFee;
    if (advType === 'fixed') {
      advPerHead = advValue;
    } else {
      advPerHead = regFee * (advValue / 100);
    }

    const totalCount = roleRegs.reduce((sum: number, r: ProgramRegistration) => sum + (r.isCountOnly ? (r.studentCount || 1) : 1), 0);
    const approvedCount = roleRegs.filter((r: ProgramRegistration) => r.status === 'approved_parish' || r.status === 'locked').reduce((sum: number, r: ProgramRegistration) => sum + (r.isCountOnly ? (r.studentCount || 1) : 1), 0);
    const pendingCount = roleRegs.filter((r: ProgramRegistration) => r.status === 'pending_parish').reduce((sum: number, r: ProgramRegistration) => sum + (r.isCountOnly ? (r.studentCount || 1) : 1), 0);
    const paidCount = roleRegs.filter((r: ProgramRegistration) => !!r.paymentScreenshotUrl).reduce((sum: number, r: ProgramRegistration) => sum + (r.isCountOnly ? (r.studentCount || 1) : 1), 0);

    if (format === "csv") {
      // Complete Excel/CSV metadata & summary information rows
      const summaryLines = [
        `"SUVARA ADMINISTRATIVE REPORT - ${role.toUpperCase()} REGISTRY"`,
        `"Program Name","${(selectedProgram.name || '').replace(/"/g, '""')}"`,
        `"Forane Filter","${detailForaneFilter}"`,
        `"Parish Filter","${detailParishFilter}"`,
        `"Export Date","${new Date().toLocaleDateString()}"`,
        `"Total ${role === 'teacher' ? 'Teachers' : 'Students'}","${totalCount}"`,
        `"Total Approved","${approvedCount}"`,
        `"Total Pending","${pendingCount}"`,
        ...(pd?.isRequired ? [
          `"Registration Fee","₹${regFee}"`,
          `"Total Full Expected","₹${totalCount * regFee}"`,
          `"Total Advance Expected","₹${(totalCount * advPerHead).toFixed(1)}"`,
          `"Advance Amount Received","₹${(paidCount * advPerHead).toFixed(1)}"`
        ] : []),
        ""
      ];

      const headers = [
        "#",
        role === 'teacher' ? "Teacher Name" : "Student Name",
        "Phone",
        "School/Parish",
        "Approval Status",
        ...(pd?.isRequired ? ["Payment Status"] : []),
        ...customFields.map(f => `"${f.name.replace(/"/g, '""')}"`),
        "Submitted At",
      ];

      const sortedRegistrations = [...roleRegs].sort((a, b) =>
        (a.schoolName || "").localeCompare(b.schoolName || ""),
      );

      const rows = sortedRegistrations.map((reg, index) => {
        const row = [
          index + 1,
          `"${(reg.studentName || 'N/A').replace(/"/g, '""')}"`,
          `"${(reg.studentPhone || 'N/A').replace(/"/g, '""')}"`,
          `"${(reg.schoolName || 'N/A').replace(/"/g, '""')}"`,
          `"${getStatusLabel(reg.status)}"`,
        ];

        if (pd?.isRequired) {
          row.push(reg.paymentScreenshotUrl ? '"Paid"' : '"Unpaid"');
        }

        customFields.forEach(field => {
          const val = reg.customFieldValues?.[field.id];
          let displayVal = "";
          if (val !== undefined && val !== null) {
            if (typeof val === 'boolean') displayVal = val ? 'Yes' : 'No';
            else displayVal = String(val);
          }
          row.push(`"${displayVal.replace(/"/g, '""')}"`);
        });

        row.push(reg.submittedAt ? `"${reg.submittedAt.toDate().toLocaleDateString()}"` : '"N/A"');
        return row.join(",");
      });

      const csvContent = [...summaryLines, headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const safeForaneStr = detailForaneFilter.replace(/\s+/g, "_");
      link.download = `${selectedProgram.name.replace(/\s+/g, "_")}_${role}s_${safeForaneStr}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success(`${role === 'teacher' ? 'Teachers' : 'Students'} CSV Exported successfully`);
    } else if (format === "pdf") {
      try {
        setPdfExportProgress({
          isOpen: true,
          statusText: "Initializing PDF Export...",
          progressPercent: 5,
          secondsElapsed: 0,
        });
        const uList = users.length > 0 ? users : await getUsers();
        await PremiumProgramPdfService.generateReport(
          roleRegs,
          selectedProgram.name,
          detailForaneFilter,
          detailParishFilter,
          uList,
          role,
          customFields,
          selectedProgram.paymentDetails,
          detailDateFilter,
          detailSortOrder,
          (statusText, percent) => {
            setPdfExportProgress(prev => ({
              ...prev,
              statusText,
              progressPercent: percent,
            }));
          }
        );
        toast.success(`${role === 'teacher' ? 'Teachers' : 'Students'} PDF Exported successfully`);
      } catch (err) {
        console.error("PDF generation failed", err);
        toast.error("Failed to generate PDF");
      } finally {
        setTimeout(() => {
          setPdfExportProgress(prev => ({ ...prev, isOpen: false }));
        }, 800);
      }
    }
  };

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Programs
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
              <DialogDescription>
                Add a new educational program with optional custom fields.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter program name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter program description (optional)"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience / Participant Type</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(val: any) => {
                    setFormData({ ...formData, targetAudience: val });
                    if (val === 'student' && studentFields.length === 0) {
                      setStudentFields(getInitialStudentFields());
                    } else if (val === 'teacher' && teacherFields.length === 0) {
                      setTeacherFields(getInitialTeacherFields());
                    }
                  }}
                >
                  <SelectTrigger id="targetAudience">
                    <SelectValue placeholder="Select who can register" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isCountOnly"
                  checked={formData.isCountOnly}
                  onCheckedChange={(checked: boolean) => {
                    setFormData({ ...formData, isCountOnly: checked });
                    if (!checked) {
                      if (studentFields.length === 0) setStudentFields(getInitialStudentFields());
                      if (teacherFields.length === 0) setTeacherFields(getInitialTeacherFields());
                    }
                  }}
                />
                <div className="flex flex-col">
                  <Label htmlFor="isCountOnly" className="font-semibold cursor-pointer">
                    Count-Only Registration
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Schools will only submit total participant count without filling individual participant details.
                  </span>
                </div>
              </div>

              {/* Payment Details Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="paymentRequired"
                    checked={formData.paymentRequired}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({ ...formData, paymentRequired: checked })
                    }
                  />
                  <Label htmlFor="paymentRequired" className="font-semibold cursor-pointer">Requires Payment Registration</Label>
                </div>

                {formData.paymentRequired && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-500 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registrationFee">Registration Fee (₹)</Label>
                        <Input
                          id="registrationFee"
                          type="number"
                          value={formData.registrationFee || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, registrationFee: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="e.g. 100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advanceType">Advance Type</Label>
                        <select
                          id="advanceType"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.advanceType}
                          onChange={(e) =>
                            setFormData({ ...formData, advanceType: e.target.value as 'percentage' | 'fixed', advanceValue: e.target.value === 'percentage' ? 100 : formData.registrationFee })
                          }
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advanceValue">
                          {formData.advanceType === 'percentage' ? 'Advance Value (%)' : 'Advance Value (₹)'}
                        </Label>
                        <Input
                          id="advanceValue"
                          type="number"
                          min="0"
                          max={formData.advanceType === 'percentage' ? 100 : formData.registrationFee}
                          value={formData.advanceValue || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, advanceValue: parseFloat(e.target.value) || 0 })
                          }
                          placeholder={formData.advanceType === 'percentage' ? 'e.g. 50' : 'e.g. 100'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={formData.bankName}
                          onChange={(e) =>
                            setFormData({ ...formData, bankName: e.target.value })
                          }
                          placeholder="e.g. State Bank of India"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Holder Name</Label>
                        <Input
                          id="accountName"
                          value={formData.accountName}
                          onChange={(e) =>
                            setFormData({ ...formData, accountName: e.target.value })
                          }
                          placeholder="e.g. Light Suvara Catechetical Centre"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={formData.accountNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, accountNumber: e.target.value })
                          }
                          placeholder="Enter account number"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode">IFSC Code / Routing Code</Label>
                        <Input
                          id="ifscCode"
                          value={formData.ifscCode}
                          onChange={(e) =>
                            setFormData({ ...formData, ifscCode: e.target.value })
                          }
                          placeholder="Enter IFSC code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>QR Code for Payment</Label>
                        <div className="flex items-center gap-3">
                          {formData.qrCodeUrl && (
                            <div className="relative w-10 h-10 border rounded overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                              <img src={formData.qrCodeUrl} alt="QR Preview" className="object-contain w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input
                              type="file"
                              accept="image/*"
                              className="h-9 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    toast.loading("Uploading QR Code...", { id: "qr-upload" });
                                    const url = await uploadFile(file, `programs/qr_codes/${Date.now()}_${file.name}`);
                                    setFormData(prev => ({ ...prev, qrCodeUrl: url }));
                                    toast.success("QR Code uploaded successfully", { id: "qr-upload" });
                                  } catch (err) {
                                    console.error(err);
                                    toast.error("Failed to upload QR Code", { id: "qr-upload" });
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                {formData.isCountOnly ? (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm flex items-center gap-3">
                    <Users className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-xs sm:text-sm">Count-Only Mode Active</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Individual participant fields are disabled because supporters will only submit participant counts.
                      </p>
                    </div>
                  </div>
                ) : (
                  formData.targetAudience === 'student' ? renderFieldsBuilder('student') : renderFieldsBuilder('teacher')
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateProgram}>Create Program</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search programs..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Programs List */}
      <div className="space-y-4">
        {filteredPrograms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No programs found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>All Programs</CardTitle>
                <CardDescription>
                  Manage educational programs and view registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registrations</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrograms.map((program) => {
                      const status = getProgramStatus(program);
                      return (
                        <TableRow key={program.id}>
                          <TableCell>
                            <button
                              className="text-left hover:underline focus:outline-none"
                              onClick={() => openDetailDialog(program)}
                            >
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                {program.name}
                              </span>
                              {program.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {program.description}
                                </p>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>{formatDate(program.startDate)}</TableCell>
                          <TableCell>{formatDate(program.endDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant={status.variant}>
                                {status.label}
                              </Badge>
                              {program.isCountOnly && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 text-[10px]">
                                  Count Only
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              {registrationCounts[program.id!] || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDetailDialog(program)}
                                title="View Details & Registrations"
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(program)}
                                title="Edit Program"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Program
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {program.name}"? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteProgram(program.id!)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredPrograms.map((program) => {
                const status = getProgramStatus(program);
                return (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    status={status}
                    registrationCount={registrationCounts[program.id!] || 0}
                    formatDate={formatDate}
                    openEditDialog={openEditDialog}
                    handleDeleteProgram={handleDeleteProgram}
                    onViewDetails={openDetailDialog}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Update program details and custom fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Program Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter program name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter program description (optional)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-targetAudience">Target Audience / Participant Type</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(val: any) => {
                  setFormData({ ...formData, targetAudience: val });
                  if (val === 'student' && studentFields.length === 0) {
                    setStudentFields(getInitialStudentFields());
                  } else if (val === 'teacher' && teacherFields.length === 0) {
                    setTeacherFields(getInitialTeacherFields());
                  }
                }}
              >
                <SelectTrigger id="edit-targetAudience">
                  <SelectValue placeholder="Select who can register" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isCountOnly"
                checked={formData.isCountOnly}
                onCheckedChange={(checked: boolean) => {
                  setFormData({ ...formData, isCountOnly: checked });
                  if (!checked) {
                    if (studentFields.length === 0) setStudentFields(getInitialStudentFields());
                    if (teacherFields.length === 0) setTeacherFields(getInitialTeacherFields());
                  }
                }}
              />
              <div className="flex flex-col">
                <Label htmlFor="edit-isCountOnly" className="font-semibold cursor-pointer">
                  Count-Only Registration
                </Label>
                <span className="text-xs text-muted-foreground">
                  Schools will only submit total participant count without filling individual participant details.
                </span>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-paymentRequired"
                  checked={formData.paymentRequired}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, paymentRequired: checked })
                  }
                />
                <Label htmlFor="edit-paymentRequired" className="font-semibold cursor-pointer">Requires Payment Registration</Label>
              </div>

              {formData.paymentRequired && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-500 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-registrationFee">Registration Fee (₹)</Label>
                      <Input
                        id="edit-edit-registrationFee"
                        type="number"
                        value={formData.registrationFee || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, registrationFee: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-advanceType">Advance Type</Label>
                      <select
                        id="edit-advanceType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.advanceType}
                        onChange={(e) =>
                          setFormData({ ...formData, advanceType: e.target.value as 'percentage' | 'fixed', advanceValue: e.target.value === 'percentage' ? 100 : formData.registrationFee })
                        }
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-advanceValue">
                        {formData.advanceType === 'percentage' ? 'Advance Value (%)' : 'Advance Value (₹)'}
                      </Label>
                      <Input
                        id="edit-advanceValue"
                        type="number"
                        min="0"
                        max={formData.advanceType === 'percentage' ? 100 : formData.registrationFee}
                        value={formData.advanceValue || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, advanceValue: parseFloat(e.target.value) || 0 })
                        }
                        placeholder={formData.advanceType === 'percentage' ? 'e.g. 50' : 'e.g. 100'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-bankName">Bank Name</Label>
                      <Input
                        id="edit-bankName"
                        value={formData.bankName}
                        onChange={(e) =>
                          setFormData({ ...formData, bankName: e.target.value })
                        }
                        placeholder="e.g. State Bank of India"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-accountName">Account Holder Name</Label>
                      <Input
                        id="edit-accountName"
                        value={formData.accountName}
                        onChange={(e) =>
                          setFormData({ ...formData, accountName: e.target.value })
                        }
                        placeholder="e.g. Light Suvara Catechetical Centre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-accountNumber">Account Number</Label>
                      <Input
                        id="edit-accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, accountNumber: e.target.value })
                        }
                        placeholder="Enter account number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-ifscCode">IFSC Code / Routing Code</Label>
                      <Input
                        id="edit-ifscCode"
                        value={formData.ifscCode}
                        onChange={(e) =>
                          setFormData({ ...formData, ifscCode: e.target.value })
                        }
                        placeholder="Enter IFSC code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>QR Code for Payment</Label>
                      <div className="flex items-center gap-3">
                        {formData.qrCodeUrl && (
                          <div className="relative w-10 h-10 border rounded overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <img src={formData.qrCodeUrl} alt="QR Preview" className="object-contain w-full h-full" />
                          </div>
                        )}
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            className="h-9 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  toast.loading("Uploading QR Code...", { id: "qr-upload" });
                                  const url = await uploadFile(file, `programs/qr_codes/${Date.now()}_${file.name}`);
                                  setFormData(prev => ({ ...prev, qrCodeUrl: url }));
                                  toast.success("QR Code uploaded successfully", { id: "qr-upload" });
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Failed to upload QR Code", { id: "qr-upload" });
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              {formData.isCountOnly ? (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm flex items-center gap-3">
                  <Users className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-xs sm:text-sm">Count-Only Mode Active</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      Individual participant fields are disabled because supporters will only submit participant counts.
                    </p>
                  </div>
                </div>
              ) : (
                formData.targetAudience === 'student' ? renderFieldsBuilder('student') : renderFieldsBuilder('teacher')
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProgram}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Program Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className={cn(
          "w-full overflow-y-auto transition-all duration-200",
          isDetailMaximized
            ? "max-w-[98vw] w-[98vw] h-[95vh] max-h-[95vh] p-6"
            : "max-w-[95vw] lg:max-w-6xl max-h-[90vh]"
        )}>
          <DialogHeader className="pr-8">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <FileText className="h-5 w-5 text-blue-600" />
                {selectedProgram?.name}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsDetailMaximized(!isDetailMaximized)}
                title={isDetailMaximized ? "Restore Default Size" : "Expand Full Screen"}
              >
                {isDetailMaximized ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 text-blue-600" />
                    <span className="hidden sm:inline font-medium">Restore</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 text-blue-600" />
                    <span className="hidden sm:inline font-medium">Expand Window</span>
                  </>
                )}
              </Button>
            </div>
            {selectedProgram?.description && (
              <DialogDescription className="mt-1 text-xs">
                {selectedProgram.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Program Info */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(selectedProgram?.startDate)} –{" "}
                  {formatDate(selectedProgram?.endDate)}
                </span>
              </div>
              {selectedProgram && (
                <Badge variant={getProgramStatus(selectedProgram).variant}>
                  {getProgramStatus(selectedProgram).label}
                </Badge>
              )}
            </div>

            {/* Registration Stats & Filters Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Registered Members ({filteredDetailRegistrations.reduce((acc: number, r: ProgramRegistration) => acc + (r.isCountOnly ? (r.studentCount || 1) : 1), 0)})
              </h3>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Forane Filter Dropdown */}
                <div className="w-36 sm:w-44">
                  <Select value={detailForaneFilter} onValueChange={(val) => { setDetailForaneFilter(val); setDetailParishFilter("All"); }}>
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectValue placeholder="Forane: All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Forane: All</SelectItem>
                      {availableForanes.map((f: string) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Parish Filter Dropdown */}
                <div className="w-40 sm:w-52">
                  <Select value={detailParishFilter} onValueChange={setDetailParishFilter}>
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectValue placeholder="Parish: All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Parish: All</SelectItem>
                      {availableParishes.map((p: string) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submission Date Filter Dropdown */}
                <div className="w-36 sm:w-44">
                  <Select value={detailDateFilter} onValueChange={setDetailDateFilter}>
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectValue placeholder="Date: All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Date: All</SelectItem>
                      {availableSubmissionDates.map((d) => (
                        <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order Dropdown */}
                <div className="w-48 sm:w-60">
                  <Select value={detailSortOrder} onValueChange={(val: "forane" | "date-desc" | "date-asc" | "name-asc" | "name-desc") => setDetailSortOrder(val)}>
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <SelectValue placeholder="Sort Parishes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forane">Forane Sorting</SelectItem>
                      <SelectItem value="date-desc">Parish: Newest Registered First</SelectItem>
                      <SelectItem value="date-asc">Parish: Oldest Registered First</SelectItem>
                      <SelectItem value="name-asc">Parish Name (A to Z)</SelectItem>
                      <SelectItem value="name-desc">Parish Name (Z to A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Centered Green Export Button Bar */}
            {detailRegistrations.length > 0 && (
              <div className="flex justify-center items-center w-full py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="h-8.5 px-5 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-500 rounded-lg transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-52">
                    {(selectedProgram?.targetAudience === undefined || selectedProgram.targetAudience === "both" || selectedProgram.targetAudience === "student") && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleExportRegistrations("student", "csv")}
                          className="cursor-pointer"
                        >
                          Export Students (CSV)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportRegistrations("student", "pdf")}
                          className="cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
                        >
                          Export Students (PDF)
                        </DropdownMenuItem>
                      </>
                    )}
                    {(selectedProgram?.targetAudience === undefined || selectedProgram.targetAudience === "both" || selectedProgram.targetAudience === "teacher") && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleExportRegistrations("teacher", "csv")}
                          className="cursor-pointer"
                        >
                          Export Teachers (CSV)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportRegistrations("teacher", "pdf")}
                          className="cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
                        >
                          Export Teachers (PDF)
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : detailStats ? (
              (() => {
                const studentRegs = filteredDetailRegistrations.filter(r => !r.type || r.type === 'student');
                const teacherRegs = filteredDetailRegistrations.filter(r => r.type === 'teacher');

                const getStatsForRole = (regs: ProgramRegistration[]) => {
                  const countStudents = (arr: ProgramRegistration[]) => {
                    return arr.reduce((sum, reg) => sum + (reg.isCountOnly ? (reg.studentCount || 1) : 1), 0);
                  };
                  return {
                    total: countStudents(regs),
                    pending: countStudents(regs.filter(r => r.status === 'pending_parish')),
                    approved: countStudents(regs.filter(r => r.status === 'approved_parish')),
                    locked: countStudents(regs.filter(r => r.status === 'locked')),
                    rejected: countStudents(regs.filter(r => r.status === 'rejected'))
                  };
                };

                const sStats = getStatsForRole(studentRegs);
                const tStats = getStatsForRole(teacherRegs);

                const renderStatsSummary = (stats: typeof sStats) => (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stats.total}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                        {stats.pending}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">
                        Pending
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-center">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {stats.approved}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500">
                        Approved
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {stats.locked}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500">
                        Locked
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                        {stats.rejected}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500">
                        Rejected
                      </p>
                    </div>
                  </div>
                );

                const renderRegistrationsList = (role: 'student' | 'teacher', regs: ProgramRegistration[]) => {
                  if (regs.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p>No registered {role}s yet</p>
                      </div>
                    );
                  }

                  const customFields = role === 'student'
                    ? selectedProgram?.studentFields || []
                    : selectedProgram?.teacherFields || [];

                  // Group parishes and sort them by submission date (which parish registered first/last) or forane/alphabetically
                  const parishMap = new Map<string, { schoolName: string; forane: string; submissionTime: number; dateFormatted: string }>();
                  regs.forEach((r: ProgramRegistration) => {
                    const sName = r.schoolName || 'Unknown Parish';
                    const schoolInfo = users.find((u: UserData) => u.uid === r.schoolUserId || u.id === r.schoolUserId);
                    const fName = schoolInfo?.forane || 'Unknown Forane';
                    const t = r.submittedAt?.toMillis ? r.submittedAt.toMillis() : (r.submittedAt ? new Date(r.submittedAt).getTime() : 0);
                    const dStr = r.submittedAt ? r.submittedAt.toDate().toLocaleDateString() : '';
                    if (!parishMap.has(sName)) {
                      parishMap.set(sName, { schoolName: sName, forane: fName, submissionTime: t, dateFormatted: dStr });
                    } else {
                      const entry = parishMap.get(sName)!;
                      if (t > 0 && (entry.submissionTime === 0 || t < entry.submissionTime)) {
                        entry.submissionTime = t;
                        entry.dateFormatted = dStr;
                      }
                    }
                  });

                  const sortedParishes = Array.from(parishMap.values()).sort((a, b) => {
                    if (detailSortOrder === 'forane') {
                      const foraneComp = a.forane.localeCompare(b.forane);
                      if (foraneComp !== 0) return foraneComp;
                      return a.schoolName.localeCompare(b.schoolName);
                    }
                    if (detailSortOrder === 'name-asc') {
                      return a.schoolName.localeCompare(b.schoolName);
                    }
                    if (detailSortOrder === 'name-desc') {
                      return b.schoolName.localeCompare(a.schoolName);
                    }
                    if (detailSortOrder === 'date-asc') {
                      if (a.submissionTime > 0 && b.submissionTime > 0 && a.submissionTime !== b.submissionTime) {
                        return a.submissionTime - b.submissionTime;
                      }
                      if (a.submissionTime > 0 && b.submissionTime === 0) return -1;
                      if (b.submissionTime > 0 && a.submissionTime === 0) return 1;
                      return a.schoolName.localeCompare(b.schoolName);
                    }
                    // date-desc (default)
                    if (a.submissionTime > 0 && b.submissionTime > 0 && a.submissionTime !== b.submissionTime) {
                      return b.submissionTime - a.submissionTime;
                    }
                    if (a.submissionTime > 0 && b.submissionTime === 0) return -1;
                    if (b.submissionTime > 0 && a.submissionTime === 0) return 1;
                    return a.schoolName.localeCompare(b.schoolName);
                  });

                  return (
                    <div className="space-y-6">
                      {sortedParishes.map(({ schoolName, dateFormatted }) => {
                        const rawSchoolRegs = regs.filter((r: ProgramRegistration) => (r.schoolName || 'Unknown Parish') === schoolName);
                        // Sort members alphabetically by student/teacher name
                        const schoolRegs = [...rawSchoolRegs].sort((a, b) => {
                          const nameA = a.studentName || '';
                          const nameB = b.studentName || '';
                          return nameA.localeCompare(nameB);
                        });
                        const totalSchoolCount = schoolRegs.reduce(
                          (sum, reg) => sum + (reg.isCountOnly ? (reg.studentCount || 1) : 1),
                          0
                        );
                        const schoolPaidCount = schoolRegs.filter((r: ProgramRegistration) => !!r.paymentScreenshotUrl).reduce(
                          (sum, reg) => sum + (reg.isCountOnly ? (reg.studentCount || 1) : 1),
                          0
                        );
                        const pd = selectedProgram?.paymentDetails;
                        const schoolRegFee = pd?.registrationFee || 0;
                        const schoolAdvType = pd?.advanceType || 'percentage';
                        const schoolAdvValue = pd?.advanceValue !== undefined ? pd.advanceValue : (pd?.advancePercentage !== undefined ? pd.advancePercentage : 100);
                        let schoolAdvPerHead = schoolRegFee;
                        if (schoolAdvType === 'fixed') {
                          schoolAdvPerHead = schoolAdvValue;
                        } else {
                          schoolAdvPerHead = schoolRegFee * (schoolAdvValue / 100);
                        }
                        const schoolHasAdvance = schoolAdvPerHead < schoolRegFee;
                        const schoolAmountPerPerson = schoolHasAdvance ? schoolAdvPerHead : schoolRegFee;
                        const schoolAmountReceived = schoolPaidCount * schoolAmountPerPerson;
                        const showPaymentAmount = pd?.isRequired && schoolRegFee > 0;
                        return (
                          <div key={schoolName} className="space-y-3">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-1 flex justify-between items-center flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{schoolName}</span>
                                {dateFormatted && (
                                  <Badge variant="secondary" className="text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    Submitted: {dateFormatted}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {showPaymentAmount && (
                                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                    ₹{schoolAmountReceived.toFixed(1)} received
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {totalSchoolCount} {role === 'student' ? 'students' : 'teachers'}
                                </Badge>
                              </div>
                            </h4>
                            <div className="hidden sm:block rounded-lg border overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>{role === 'teacher' ? 'Teacher Name' : 'Student Name'}</TableHead>
                                    <TableHead>Phone</TableHead>
                                    {customFields.map(f => (
                                      <TableHead key={f.id}>{f.name}</TableHead>
                                    ))}
                                    {selectedProgram?.paymentDetails?.isRequired && (
                                      <TableHead>Payment Receipt</TableHead>
                                    )}
                                    <TableHead>Status</TableHead>
                                    <TableHead
                                      className="cursor-pointer select-none hover:text-blue-600 transition-colors"
                                      onClick={() => setDetailSortOrder(prev => prev === 'date-desc' ? 'date-asc' : 'date-desc')}
                                      title="Click to toggle submission date sort"
                                    >
                                      <div className="flex items-center gap-1">
                                        <span>Submitted</span>
                                        {detailSortOrder === 'date-desc' ? (
                                          <ArrowDown className="h-3 w-3 text-blue-600" />
                                        ) : detailSortOrder === 'date-asc' ? (
                                          <ArrowUp className="h-3 w-3 text-blue-600" />
                                        ) : null}
                                      </div>
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {schoolRegs.map((reg, idx) => (
                                    <TableRow key={reg.id}>
                                      <TableCell className="text-gray-500">
                                        {idx + 1}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {reg.isCountOnly
                                          ? `${reg.studentCount} ${role === 'teacher' ? 'Teachers' : 'Students'}`
                                          : reg.studentName}
                                      </TableCell>
                                      <TableCell>
                                        {reg.isCountOnly
                                          ? "-"
                                          : reg.studentPhone}
                                      </TableCell>
                                      {customFields.map(field => {
                                        const val = reg.customFieldValues?.[field.id];
                                        let displayVal = "-";
                                        if (val !== undefined && val !== null) {
                                          if (typeof val === 'boolean') displayVal = val ? 'Yes' : 'No';
                                          else displayVal = String(val);
                                        }
                                        return (
                                          <TableCell key={field.id}>
                                            {displayVal}
                                          </TableCell>
                                        );
                                      })}
                                      {selectedProgram?.paymentDetails?.isRequired && (
                                        <TableCell>
                                          {reg.paymentScreenshotUrl ? (
                                            <div className="flex flex-col gap-1 items-start">
                                              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[10px] py-0.5 px-1.5 font-bold">
                                                Paid
                                              </Badge>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[10px] text-blue-600 dark:text-blue-400 p-0 flex items-center gap-1"
                                                onClick={() => setReceiptUrl(reg.paymentScreenshotUrl!)}
                                              >
                                                <Eye className="h-3 w-3" /> View Receipt
                                              </Button>
                                            </div>
                                          ) : (
                                            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[10px] py-0.5 px-1.5 font-bold">
                                              Unpaid
                                            </Badge>
                                          )}
                                        </TableCell>
                                      )}
                                      <TableCell>
                                        <Badge
                                          className={getStatusColor(reg.status)}
                                          variant="secondary"
                                        >
                                          {getStatusLabel(reg.status)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-gray-500 text-xs">
                                        {reg.submittedAt
                                          ? reg.submittedAt
                                            .toDate()
                                            .toLocaleDateString()
                                          : "N/A"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Mobile cards */}
                            <div className="sm:hidden space-y-3">
                              {schoolRegs.map((reg, idx) => (
                                <Card key={reg.id}>
                                  <CardContent className="p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">
                                        {idx + 1}.{" "}
                                        {reg.isCountOnly
                                          ? `${reg.studentCount} ${role === 'teacher' ? 'Teachers' : 'Students'} (Bulk)`
                                          : reg.studentName}
                                      </span>
                                      <Badge
                                        className={getStatusColor(reg.status)}
                                        variant="secondary"
                                      >
                                        {getStatusLabel(reg.status)}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Phone className="h-3 w-3" />
                                      {reg.isCountOnly
                                        ? "-"
                                        : reg.studentPhone}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Clock className="h-3 w-3" />
                                      {reg.submittedAt
                                        ? reg.submittedAt
                                          .toDate()
                                          .toLocaleDateString()
                                        : "N/A"}
                                    </div>
                                    {!reg.isCountOnly && customFields.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                        {customFields.map(field => {
                                          const val = reg.customFieldValues?.[field.id];
                                          let displayVal = "-";
                                          if (val !== undefined && val !== null) {
                                            if (typeof val === 'boolean') displayVal = val ? 'Yes' : 'No';
                                            else displayVal = String(val);
                                          }
                                          return (
                                            <div key={field.id} className="text-gray-500">
                                              <span className="font-medium text-gray-700 dark:text-gray-300">{field.name}: </span>
                                              {displayVal}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {selectedProgram?.paymentDetails?.isRequired && (
                                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Payment Status:</span>
                                        {reg.paymentScreenshotUrl ? (
                                          <div className="flex items-center gap-2">
                                            <Badge className="bg-green-100 text-green-800 border-green-200 py-0.5 px-1.5 text-[10px] font-bold">
                                              Paid
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
                                              onClick={() => setReceiptUrl(reg.paymentScreenshotUrl!)}
                                            >
                                              View Receipt
                                            </Button>
                                          </div>
                                        ) : (
                                          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 py-0.5 px-1.5 text-[10px] font-bold">
                                            Unpaid
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                };

                const targetAudience = selectedProgram?.targetAudience || "both";
                const showStudents = targetAudience === "both" || targetAudience === "student";
                const showTeachers = targetAudience === "both" || targetAudience === "teacher";

                return (
                  <div className="space-y-6">
                    {selectedProgram?.paymentDetails?.isRequired && (() => {
                      const pd = selectedProgram.paymentDetails;
                      const regFee = pd.registrationFee || 0;
                      const advType = pd.advanceType || 'percentage';
                      const advValue = pd.advanceValue !== undefined ? pd.advanceValue : (pd.advancePercentage !== undefined ? pd.advancePercentage : 100);

                      let advancePerHead = regFee;
                      let advanceLabel = "";
                      if (advType === 'fixed') {
                        advancePerHead = advValue;
                        advanceLabel = `₹${advValue} fixed`;
                      } else {
                        advancePerHead = regFee * (advValue / 100);
                        advanceLabel = `${advValue}%`;
                      }
                      const hasAdvance = advancePerHead < regFee;

                      const totalRegistrants = (sStats?.total || 0) + (tStats?.total || 0);
                      const approvedRegistrants = (sStats?.approved || 0) + (sStats?.locked || 0) + (tStats?.approved || 0) + (tStats?.locked || 0);

                      const totalExpectedFull = totalRegistrants * regFee;
                      const totalExpectedAdvance = totalRegistrants * advancePerHead;

                      const allRegs = [...(filteredDetailRegistrations || [])];
                      const paidRegs = allRegs.filter(r => r.paymentScreenshotUrl);
                      const paidCount = paidRegs.reduce((sum, reg) => sum + (reg.isCountOnly ? (reg.studentCount || 1) : 1), 0);
                      const amountPerPaidPerson = hasAdvance ? advancePerHead : regFee;
                      const totalAmountReceived = paidCount * amountPerPaidPerson;

                      return (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Registration Fee</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              ₹{regFee}
                              {hasAdvance && (
                                <span className="text-xs text-muted-foreground block font-normal">
                                  (Advance: {advanceLabel} / ₹{advancePerHead.toFixed(1)})
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Full Amount Expected</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              ₹{totalExpectedFull}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Advance Expected</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              ₹{totalExpectedAdvance.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Approved</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {approvedRegistrants}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Advance Amount Received</p>
                            <p className="text-lg font-bold text-green-700 dark:text-green-300">
                              ₹{totalAmountReceived % 1 === 0 ? totalAmountReceived : totalAmountReceived.toFixed(1)} / ₹{totalExpectedAdvance % 1 === 0 ? totalExpectedAdvance : totalExpectedAdvance.toFixed(1)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              ({paidCount} of {totalRegistrants} paid × ₹{amountPerPaidPerson % 1 === 0 ? amountPerPaidPerson : amountPerPaidPerson.toFixed(1)})
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {showStudents && showTeachers ? (
                      <Tabs defaultValue="students" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="students">Students ({sStats.total})</TabsTrigger>
                          <TabsTrigger value="teachers">Teachers ({tStats.total})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="students" className="space-y-4 py-4">
                          {renderStatsSummary(sStats)}
                          {renderRegistrationsList('student', studentRegs)}
                        </TabsContent>

                        <TabsContent value="teachers" className="space-y-4 py-4">
                          {renderStatsSummary(tStats)}
                          {renderRegistrationsList('teacher', teacherRegs)}
                        </TabsContent>
                      </Tabs>
                    ) : showStudents ? (
                      <div className="space-y-4 py-4">
                        {renderStatsSummary(sStats)}
                        {renderRegistrationsList('student', studentRegs)}
                      </div>
                    ) : (
                      <div className="space-y-4 py-4">
                        {renderStatsSummary(tStats)}
                        {renderRegistrationsList('teacher', teacherRegs)}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      {/* Receipt View Dialog */}
      <Dialog open={!!receiptUrl} onOpenChange={(open) => {
        if (!open) {
          setReceiptUrl(null);
          setIsReceiptMaximized(false);
        }
      }}>
        <DialogContent className={cn(
          "flex flex-col items-center justify-between p-6 transition-all duration-200",
          isReceiptMaximized ? "max-w-[96vw] w-[96vw] h-[94vh] max-h-[94vh]" : "max-w-2xl max-h-[88vh]"
        )}>
          <DialogHeader className="w-full flex flex-row items-center justify-between border-b pb-3 pr-6">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-bold">Payment Receipt / Screenshot</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {receiptUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex items-center gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                    onClick={() => window.open(receiptUrl, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open Full Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex items-center gap-1.5"
                    onClick={() => setIsReceiptMaximized(!isReceiptMaximized)}
                  >
                    {isReceiptMaximized ? (
                      <>
                        <Minimize2 className="h-3.5 w-3.5" /> Restore
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-3.5 w-3.5" /> Full Screen
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>
          
          <div className={cn(
            "w-full flex-1 flex items-center justify-center overflow-auto my-3 rounded-lg border bg-slate-900/5 dark:bg-slate-900/40 p-2",
            isReceiptMaximized ? "max-h-[80vh]" : "max-h-[62vh]"
          )}>
            {receiptUrl && (
              <img
                src={receiptUrl}
                alt="Payment screenshot"
                className="max-w-full max-h-full object-contain rounded shadow-sm"
              />
            )}
          </div>

          <DialogFooter className="w-full flex flex-row items-center justify-between gap-3 pt-2 border-t">
            {receiptUrl && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1.5"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = receiptUrl;
                  link.target = "_blank";
                  link.download = `payment_receipt_${Date.now()}.jpg`;
                  link.click();
                }}
              >
                <Download className="h-3.5 w-3.5" /> Download Screenshot
              </Button>
            )}
            <Button className="bg-blue-600 hover:bg-blue-700 text-xs px-6" onClick={() => {
              setReceiptUrl(null);
              setIsReceiptMaximized(false);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* PDF Generation Progress & Timer Modal */}
      <Dialog open={pdfExportProgress.isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md w-full p-6 text-center space-y-4 shadow-xl border-blue-100 dark:border-blue-900">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-full text-blue-600 dark:text-blue-400 animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Generating PDF Report
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Please wait while payment proof screenshots are retrieved and compiled into the document.
            </DialogDescription>
          </div>

          {/* Status & Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span className="truncate max-w-[240px] text-left">{pdfExportProgress.statusText}</span>
              <span className="text-blue-600 dark:text-blue-400">{pdfExportProgress.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${pdfExportProgress.progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Elapsed Timer Counter */}
          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 py-2 px-3 rounded-lg border border-gray-100 dark:border-gray-800">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span>Time Elapsed:</span>
            <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
              {Math.floor(pdfExportProgress.secondsElapsed / 60)
                .toString()
                .padStart(2, "0")}
              :
              {(pdfExportProgress.secondsElapsed % 60)
                .toString()
                .padStart(2, "0")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
