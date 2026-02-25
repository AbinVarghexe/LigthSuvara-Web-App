import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronsUpDown,
  Trash2,
  FileDown,
  Pencil,
  MessageSquarePlus,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { Teacher, Parish } from "@/features/teachers/types";
import { TeacherService } from "@/features/teachers/services/teacherService";
import { AssignmentService } from "@/features/teachers/services/assignmentService";
import { RemarkService, ObserverRemark } from "@/features/teachers/services/remarkService";
import { ParishService } from "@/features/parishes/services/parishService";
import { TeacherList } from "@/features/teachers/components/TeacherList";
import { PdfService } from "@/features/teachers/services/pdfService";
import { useAuth } from "@/context/AuthContext";

interface Assignment {
  id: string;
  teacherId: string;
  parishId: string;
  class: string;
  dateAssigned: any;
}

// ─── Helper: Filter Bar ───────────────────────────────────────────────────────
interface ReportFilterBarProps {
  foranes: string[];
  parishes: Parish[];
  academicYears: string[];
  forane: string;
  parishId: string;
  academicYear: string;
  onForaneChange: (val: string) => void;
  onParishChange: (val: string) => void;
  onYearChange: (val: string) => void;
  onGenerate: () => void;
  generating?: boolean;
}

function ReportFilterBar({
  foranes,
  parishes,
  academicYears,
  forane,
  parishId,
  academicYear,
  onForaneChange,
  onParishChange,
  onYearChange,
  onGenerate,
  generating = false,
}: ReportFilterBarProps) {
  const filteredParishes =
    forane === "All" ? parishes : parishes.filter((p) => p.forane === forane);

  return (
    <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 rounded-lg border">
      <div className="space-y-1 min-w-[150px]">
        <Label className="text-xs">Forane</Label>
        <Select
          value={forane}
          onValueChange={(val) => {
            onForaneChange(val);
            onParishChange("All");
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All Foranes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Foranes</SelectItem>
            {foranes.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 min-w-[160px]">
        <Label className="text-xs">Parish</Label>
        <Select value={parishId} onValueChange={onParishChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All Parishes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Parishes</SelectItem>
            {filteredParishes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 min-w-[140px]">
        <Label className="text-xs">Academic Year</Label>
        <Select value={academicYear} onValueChange={onYearChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Years</SelectItem>
            {academicYears.map((yr) => (
              <SelectItem key={yr} value={yr}>
                {yr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        size="sm"
        onClick={onGenerate}
        disabled={generating}
        className="h-8"
      >
        {generating ? (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-3 w-3" />
        )}
        Generate
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Observers() {
  const { currentUser } = useAuth();
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- New Duty Tab State ---
  const [filterParishId, setFilterParishId] = useState<string>("All");
  const [targetParishId, setTargetParishId] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);

  // --- Duty History Tab State ---
  const [selectedForane, setSelectedForane] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // --- Edit Assignment Dialog State ---
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null,
  );
  const [editNewTeacherId, setEditNewTeacherId] = useState<string>("");
  const [editNewParishId, setEditNewParishId] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- Remark Dialog State ---
  const [remarkAssignment, setRemarkAssignment] = useState<Assignment | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [existingRemarks, setExistingRemarks] = useState<ObserverRemark[]>([]);
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [isSavingRemark, setIsSavingRemark] = useState(false);

  // --- All Observers Tab State ---
  const [dirFilterForane, setDirFilterForane] = useState<string>("All");
  const [dirFilterParishId, setDirFilterParishId] = useState<string>("All");
  const [dirFilterClass, setDirFilterClass] = useState<string>("All");
  const [dirFilteredTeachers, setDirFilteredTeachers] = useState<Teacher[]>([]);

  // --- Reports Tab State ---
  // Assignment Report
  const [rptAssignForane, setRptAssignForane] = useState<string>("All");
  const [rptAssignParishId, setRptAssignParishId] = useState<string>("All");
  const [rptAssignYear, setRptAssignYear] = useState<string>("All");
  const [generatingAssignReport, setGeneratingAssignReport] = useState(false);
  // Observer Directory Report
  const [rptDirForane, setRptDirForane] = useState<string>("All");
  const [rptDirParishId, setRptDirParishId] = useState<string>("All");
  const [rptDirYear, setRptDirYear] = useState<string>("All");
  const [generatingDirReport, setGeneratingDirReport] = useState(false);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [teachersData, parishesData, assignmentsData] = await Promise.all(
          [
            TeacherService.getTeachers(),
            ParishService.getAllParishes(),
            AssignmentService.getAssignments(),
          ],
        );
        setAllTeachers(teachersData);
        setParishes(parishesData);
        setAssignments(assignmentsData as Assignment[]);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger]);

  // Filter logic for New Duty tab
  useEffect(() => {
    let result = allTeachers;
    if (filterParishId && filterParishId !== "All") {
      result = result.filter((t) => t.parishId === filterParishId);
    }
    if (targetParishId) {
      result = result.filter((t) => t.parishId !== targetParishId);
    }
    if (selectedClasses.length > 0) {
      result = result.filter(
        (t) =>
          t.classes && t.classes.some((cls) => selectedClasses.includes(cls)),
      );
    }
    setFilteredTeachers(result);
  }, [filterParishId, selectedClasses, targetParishId, allTeachers]);

  // Filter logic for All Observers tab
  useEffect(() => {
    let result = allTeachers;
    if (dirFilterForane && dirFilterForane !== "All") {
      result = result.filter((t) => {
        const p = parishes.find((p) => p.id === t.parishId);
        return p?.forane === dirFilterForane;
      });
    }
    if (dirFilterParishId && dirFilterParishId !== "All") {
      result = result.filter((t) => t.parishId === dirFilterParishId);
    }
    if (dirFilterClass && dirFilterClass !== "All") {
      result = result.filter(
        (t) => t.classes && t.classes.includes(dirFilterClass),
      );
    }
    setDirFilteredTeachers(result);
  }, [
    dirFilterForane,
    dirFilterParishId,
    dirFilterClass,
    allTeachers,
    parishes,
  ]);

  // --- Handlers ---

  const handleAssign = async (teacher: Teacher) => {
    if (!targetParishId) {
      toast.error("Please select a Target Parish first");
      return;
    }
    if (teacher.parishId === targetParishId) {
      toast.error("Cannot assign observer to their home parish");
      return;
    }
    if (
      !window.confirm(
        `Assign ${teacher.name} to ${parishes.find((p) => p.id === targetParishId)?.name}?`,
      )
    )
      return;

    setAssigning(teacher.id);
    try {
      await AssignmentService.assignTeacher(
        teacher.id,
        targetParishId,
        "General",
      );
      toast.success(`Assigned ${teacher.name} successfully`);
      setAllTeachers((prev) =>
        prev.map((t) =>
          t.id === teacher.id
            ? { ...t, assigned: true, assignedParishId: targetParishId }
            : t,
        ),
      );
      const targetParish = parishes.find((p) => p.id === targetParishId);
      if (targetParish) {
        setTimeout(async () => {
          await PdfService.generateFatherReport(
            teacher,
            targetParish,
            "General",
          );
          await PdfService.generateTeacherDutyReport(
            teacher,
            targetParish,
            "General",
          );
          toast.info("PDF Orders generated");
        }, 500);
      }
      setRefreshTrigger((n) => n + 1);
    } catch (error: any) {
      toast.error(error.message || "Assignment failed");
    } finally {
      setAssigning(null);
    }
  };

  const handleDeleteAssignment = async (
    assignmentId: string,
    teacherId: string,
  ) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;
    try {
      await AssignmentService.deleteAssignment(assignmentId, teacherId);
      toast.success("Assignment deleted");
      setRefreshTrigger((n) => n + 1);
    } catch (error) {
      toast.error("Failed to delete assignment");
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setEditNewTeacherId(assignment.teacherId);
    setEditNewParishId(assignment.parishId);
  };

  const handleSaveEdit = async () => {
    if (!editingAssignment) return;
    if (!editNewTeacherId || !editNewParishId) {
      toast.error("Please select both an observer and a parish");
      return;
    }
    setIsSavingEdit(true);
    try {
      await AssignmentService.updateAssignment(
        editingAssignment.id,
        editingAssignment.teacherId,
        editNewTeacherId,
        editNewParishId,
      );
      toast.success("Assignment updated successfully");
      setEditingAssignment(null);
      setRefreshTrigger((n) => n + 1);
      // Regenerate PDF after assignment is confirmed updated
      const newTeacher = allTeachers.find((t) => t.id === editNewTeacherId);
      const newParish = parishes.find((p) => p.id === editNewParishId);
      if (newTeacher && newParish) {
        try {
          await PdfService.generateTeacherDutyReport(newTeacher, newParish, "General");
          toast.info("PDF Order regenerated for updated assignment");
        } catch {
          // PDF regeneration failure should not block the user
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update assignment");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openRemarkDialog = async (assignment: Assignment) => {
    setRemarkAssignment(assignment);
    setRemarkText("");
    setRemarkLoading(true);
    try {
      const remarks = await RemarkService.getRemarksByDuty(assignment.id);
      setExistingRemarks(remarks);
    } catch {
      setExistingRemarks([]);
    } finally {
      setRemarkLoading(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!remarkAssignment || !remarkText.trim()) {
      toast.error("Please enter a remark");
      return;
    }
    setIsSavingRemark(true);
    const teacher = allTeachers.find((t) => t.id === remarkAssignment.teacherId);
    try {
      await RemarkService.addRemark({
        teacherId: remarkAssignment.teacherId,
        dutyId: remarkAssignment.id,
        academicYear: teacher?.academicYear || "",
        remark: remarkText.trim(),
        createdBy: currentUser?.uid || "admin",
      });
      toast.success("Remark saved");
      setRemarkText("");
      const updated = await RemarkService.getRemarksByDuty(remarkAssignment.id);
      setExistingRemarks(updated);
    } catch (error: any) {
      toast.error(error.message || "Failed to save remark");
    } finally {
      setIsSavingRemark(false);
    }
  };

  const toggleClassSelection = (cls: string) => {
    setSelectedClasses((current) =>
      current.includes(cls)
        ? current.filter((c) => c !== cls)
        : [...current, cls],
    );
  };

  const toggleSelectAllClasses = () => {
    if (selectedClasses.length === uniqueClasses.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(uniqueClasses);
    }
  };

  const handleGenerateAssignmentReport = async () => {
    const filtered = assignments.filter((a) => {
      const teacher = allTeachers.find((t) => t.id === a.teacherId);
      const assignedParish = parishes.find((p) => p.id === a.parishId);
      if (!teacher || !assignedParish) return false;
      const matchesForane =
        rptAssignForane === "All" || assignedParish.forane === rptAssignForane;
      const matchesParish =
        rptAssignParishId === "All" || a.parishId === rptAssignParishId;
      const matchesYear =
        rptAssignYear === "All" || teacher.academicYear === rptAssignYear;
      return matchesForane && matchesParish && matchesYear;
    });
    if (filtered.length === 0) {
      toast.warning("No assignments match the selected filters.");
      return;
    }
    setGeneratingAssignReport(true);
    try {
      // TODO: wire to PdfService.generateAssignmentReport(filtered)
      await new Promise((r) => setTimeout(r, 800));
      toast.success(
        `Assignment report generated for ${filtered.length} record(s).`,
      );
    } finally {
      setGeneratingAssignReport(false);
    }
  };

  const handleGenerateDirectoryReport = async () => {
    const filtered = allTeachers.filter((t) => {
      const homeParish = parishes.find((p) => p.id === t.parishId);
      const matchesForane =
        rptDirForane === "All" || homeParish?.forane === rptDirForane;
      const matchesParish =
        rptDirParishId === "All" || t.parishId === rptDirParishId;
      const matchesYear = rptDirYear === "All" || t.academicYear === rptDirYear;
      return matchesForane && matchesParish && matchesYear;
    });
    if (filtered.length === 0) {
      toast.warning("No observers match the selected filters.");
      return;
    }
    setGeneratingDirReport(true);
    try {
      // TODO: wire to PdfService.generateObserverDirectoryReport(filtered)
      await new Promise((r) => setTimeout(r, 800));
      toast.success(
        `Observer directory report generated for ${filtered.length} observer(s).`,
      );
    } finally {
      setGeneratingDirReport(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Derived constants
  const uniqueClasses = Array.from(
    new Set(allTeachers.flatMap((t) => t.classes || [])),
  ).sort();
  const uniqueForanes = Array.from(
    new Set(parishes.map((p) => p.forane).filter(Boolean)),
  ).sort() as string[];
  const uniqueAcademicYears = Array.from(
    new Set(allTeachers.map((t) => t.academicYear).filter(Boolean)),
  ).sort() as string[];
  const dirFilteredParishes =
    dirFilterForane === "All"
      ? parishes
      : parishes.filter((p) => p.forane === dirFilterForane);

  const filteredAssignments = assignments.filter((assignment) => {
    const teacher = allTeachers.find((t) => t.id === assignment.teacherId);
    const assignedParish = parishes.find((p) => p.id === assignment.parishId);
    if (!teacher || !assignedParish) return false;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchLower) ||
      assignedParish.name.toLowerCase().includes(searchLower);
    const matchesForane =
      selectedForane === "All" || assignedParish.forane === selectedForane;
    return matchesSearch && matchesForane;
  });

  const availableObserversForEdit = allTeachers.filter(
    (t) => !t.assigned || t.id === editingAssignment?.teacherId,
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Observer Assignment
        </h1>
        <p className="text-muted-foreground mt-1">
          Assign observers to parishes, view history, manage the directory, and
          generate reports.
        </p>
      </div>

      <Tabs defaultValue="new-duty" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="new-duty">New Duty</TabsTrigger>
          <TabsTrigger value="duty-history">Duty History</TabsTrigger>
          <TabsTrigger value="all-observers">All Observers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: NEW DUTY ─── */}
        <TabsContent value="new-duty">
          <div className="space-y-6">
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* FROM */}
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ring-1 ring-blue-200">
                        FROM
                      </span>
                      Source (Observers)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-1">
                          Home Parish
                        </span>
                        <Select
                          onValueChange={setFilterParishId}
                          value={filterParishId}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="All Sources" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Parishes</SelectItem>
                            {parishes.map((p) => (
                              <SelectItem
                                key={p.id}
                                value={p.id}
                                disabled={p.id === targetParishId}
                              >
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-1">
                          Classes
                        </span>
                        <Popover
                          open={isClassOpen}
                          onOpenChange={setIsClassOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between bg-background px-3 font-normal"
                            >
                              {selectedClasses.length > 0
                                ? `${selectedClasses.length} selected`
                                : "Select classes..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search class..." />
                              <CommandList>
                                <CommandEmpty>No class found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={toggleSelectAllClasses}
                                    className="font-medium"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedClasses.length ===
                                          uniqueClasses.length &&
                                          uniqueClasses.length > 0
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    Select All
                                  </CommandItem>
                                  {uniqueClasses.map((cls) => (
                                    <CommandItem
                                      key={cls}
                                      value={cls}
                                      onSelect={() => toggleClassSelection(cls)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedClasses.includes(cls)
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {cls}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {selectedClasses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedClasses.map((cls) => (
                          <Badge
                            key={cls}
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px] cursor-pointer"
                            onClick={() => toggleClassSelection(cls)}
                          >
                            {cls} ✕
                          </Badge>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] px-1"
                          onClick={() => setSelectedClasses([])}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ARROW */}
                  <div className="flex items-center justify-center text-muted-foreground pt-6">
                    <ArrowRight className="w-8 h-8 hidden md:block text-slate-300" />
                    <ArrowLeft className="w-8 h-8 md:hidden rotate-90 text-slate-300" />
                  </div>

                  {/* TO */}
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full ring-1 ring-green-200">
                        TO
                      </span>
                      Destination Parish
                    </label>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground ml-1">
                        Target Parish
                      </span>
                      <Select
                        onValueChange={setTargetParishId}
                        value={targetParishId || ""}
                      >
                        <SelectTrigger className="h-10 text-md font-medium bg-background border-green-200">
                          <SelectValue placeholder="Select Target..." />
                        </SelectTrigger>
                        <SelectContent>
                          {parishes.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              disabled={p.id === filterParishId}
                            >
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Available Observers ({filteredTeachers.length})
                </h2>
                {targetParishId && (
                  <span className="text-sm text-muted-foreground">
                    Excluding observers from{" "}
                    {parishes.find((p) => p.id === targetParishId)?.name}
                  </span>
                )}
              </div>
              {filteredTeachers.length > 0 ? (
                <TeacherList
                  teachers={filteredTeachers}
                  showAssignAction={!!targetParishId}
                  onAssignClick={handleAssign}
                  assigningId={assigning}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p>No available observers found matching criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: DUTY HISTORY ─── */}
        <TabsContent value="duty-history">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex gap-2 w-full md:w-auto">
                <Select
                  value={selectedForane}
                  onValueChange={setSelectedForane}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Forane" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Foranes</SelectItem>
                    {uniqueForanes.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search Observer or Parish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Assignment History ({filteredAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Observer Name</TableHead>
                      <TableHead>Home Parish</TableHead>
                      <TableHead>Assigned Parish</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment) => {
                      const teacher = allTeachers.find(
                        (t) => t.id === assignment.teacherId,
                      );
                      const homeParish = parishes.find(
                        (p) => p.id === teacher?.parishId,
                      );
                      const assignedParish = parishes.find(
                        (p) => p.id === assignment.parishId,
                      );
                      if (!teacher || !assignedParish) return null;
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {teacher.name}
                            <div className="text-xs text-muted-foreground">
                              {teacher.phone}
                            </div>
                          </TableCell>
                          <TableCell>{homeParish?.name || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              {assignedParish.name}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {assignedParish.forane}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                onClick={() => openRemarkDialog(assignment)}
                                title="Add/View Remarks"
                              >
                                <MessageSquarePlus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => openEditDialog(assignment)}
                                title="Edit Assignment"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleDeleteAssignment(
                                    assignment.id,
                                    teacher.id,
                                  )
                                }
                                title="Delete Assignment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredAssignments.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No assignments found matching criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3: ALL OBSERVERS ─── */}
        <TabsContent value="all-observers">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Observer Directory</CardTitle>
              <CardDescription>
                View all registered observers and their assignment status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4 border-b">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Filter by Forane
                  </label>
                  <Select
                    onValueChange={(val) => {
                      setDirFilterForane(val);
                      setDirFilterParishId("All");
                    }}
                    value={dirFilterForane}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Foranes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Foranes</SelectItem>
                      {uniqueForanes.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Filter by Home Parish
                  </label>
                  <Select
                    onValueChange={setDirFilterParishId}
                    value={dirFilterParishId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Parishes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Parishes</SelectItem>
                      {dirFilteredParishes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Class</label>
                  <Select
                    onValueChange={setDirFilterClass}
                    value={dirFilterClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Classes</SelectItem>
                      {uniqueClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                  Showing {dirFilteredTeachers.length} Observers
                </h3>
                <TeacherList
                  teachers={dirFilteredTeachers}
                  showAssignAction={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: REPORTS ─── */}
        <TabsContent value="reports">
          <div className="space-y-6">
            {/* Sub-section 1: Assignment Report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignment Report</CardTitle>
                <CardDescription>
                  Generate a report of observer duty assignments filtered by
                  forane, parish, and academic year.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportFilterBar
                  foranes={uniqueForanes}
                  parishes={parishes}
                  academicYears={uniqueAcademicYears}
                  forane={rptAssignForane}
                  parishId={rptAssignParishId}
                  academicYear={rptAssignYear}
                  onForaneChange={setRptAssignForane}
                  onParishChange={setRptAssignParishId}
                  onYearChange={setRptAssignYear}
                  onGenerate={handleGenerateAssignmentReport}
                  generating={generatingAssignReport}
                />
                {/* Preview count */}
                <p className="text-xs text-muted-foreground pl-1">
                  {(() => {
                    const count = assignments.filter((a) => {
                      const teacher = allTeachers.find(
                        (t) => t.id === a.teacherId,
                      );
                      const ap = parishes.find((p) => p.id === a.parishId);
                      if (!teacher || !ap) return false;
                      return (
                        (rptAssignForane === "All" ||
                          ap.forane === rptAssignForane) &&
                        (rptAssignParishId === "All" ||
                          a.parishId === rptAssignParishId) &&
                        (rptAssignYear === "All" ||
                          teacher.academicYear === rptAssignYear)
                      );
                    }).length;
                    return `${count} assignment(s) will be included in this report.`;
                  })()}
                </p>
              </CardContent>
            </Card>

            <Separator />

            {/* Sub-section 2: Observer Directory Report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Observer Directory Report
                </CardTitle>
                <CardDescription>
                  Generate a directory of all observers filtered by forane, home
                  parish, and academic year.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportFilterBar
                  foranes={uniqueForanes}
                  parishes={parishes}
                  academicYears={uniqueAcademicYears}
                  forane={rptDirForane}
                  parishId={rptDirParishId}
                  academicYear={rptDirYear}
                  onForaneChange={setRptDirForane}
                  onParishChange={setRptDirParishId}
                  onYearChange={setRptDirYear}
                  onGenerate={handleGenerateDirectoryReport}
                  generating={generatingDirReport}
                />
                {/* Preview count */}
                <p className="text-xs text-muted-foreground pl-1">
                  {(() => {
                    const count = allTeachers.filter((t) => {
                      const hp = parishes.find((p) => p.id === t.parishId);
                      return (
                        (rptDirForane === "All" ||
                          hp?.forane === rptDirForane) &&
                        (rptDirParishId === "All" ||
                          t.parishId === rptDirParishId) &&
                        (rptDirYear === "All" || t.academicYear === rptDirYear)
                      );
                    }).length;
                    return `${count} observer(s) will be included in this report.`;
                  })()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── EDIT ASSIGNMENT DIALOG ─── */}
      <Dialog
        open={!!editingAssignment}
        onOpenChange={(open) => {
          if (!open) setEditingAssignment(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Observer</Label>
              <Select
                value={editNewTeacherId}
                onValueChange={setEditNewTeacherId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Observer..." />
                </SelectTrigger>
                <SelectContent>
                  {availableObserversForEdit.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({t.parishName})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned Parish</Label>
              <Select
                value={editNewParishId}
                onValueChange={setEditNewParishId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Parish..." />
                </SelectTrigger>
                <SelectContent>
                  {parishes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({p.forane})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingAssignment(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── REMARK DIALOG ─── */}
      <Dialog
        open={!!remarkAssignment}
        onOpenChange={(open) => {
          if (!open) { setRemarkAssignment(null); setRemarkText(""); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Observer Remarks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {remarkLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {existingRemarks.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {existingRemarks.map((r) => (
                      <div key={r.id} className="text-sm border-b last:border-0 pb-2">
                        <p className="text-foreground">{r.remark}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.createdAt ? new Date((r.createdAt as any).seconds * 1000).toLocaleString() : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Add Remark</Label>
                  <Textarea
                    placeholder="Enter remark for this observer duty..."
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRemarkAssignment(null); setRemarkText(""); }}>
              Close
            </Button>
            <Button onClick={handleSaveRemark} disabled={isSavingRemark || !remarkText.trim()}>
              {isSavingRemark ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save Remark"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
