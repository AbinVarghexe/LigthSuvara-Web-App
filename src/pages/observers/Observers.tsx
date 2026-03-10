import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Trash2,
  FileDown,
  MessageSquarePlus,
  Calendar,
  History,
  Eye,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { PremiumAnimatorObserverPdfService } from "../../features/reports/services/animatorObserverPdfServices";
import { IndividualObserverPdfService } from "../../features/reports/services/individualObserverPdfService";

import { Teacher } from "@/features/teachers/types";
import { TeacherService } from "@/features/teachers/services/teacherService";
import { AssignmentService } from "@/features/teachers/services/assignmentService";
import {
  RemarkService,
  ObserverRemark,
} from "@/features/teachers/services/remarkService";
import { TeacherList } from "@/features/teachers/components/TeacherList";
import { useAuth } from "@/context/AuthContext";
import { getUsers, UserData } from "@/features/users/services/userService";

// --- Helper: Filter Bar ---
function ReportFilterBar({
  foranes,
  schools,
  academicYears,
  forane,
  schoolId,
  academicYear,
  onForaneChange,
  onSchoolChange,
  onYearChange,
  onGenerate,
  generating = false,
}: any) {
  const filteredSchools =
    forane === "All"
      ? schools
      : schools.filter((s: any) => s.forane === forane);

  return (
    <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 rounded-lg border">
      <div className="space-y-1 min-w-[150px]">
        <Label className="text-xs">Forane</Label>
        <Select
          value={forane}
          onValueChange={(val) => {
            onForaneChange(val);
            onSchoolChange("All");
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All Foranes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Foranes</SelectItem>
            {foranes.map((f: any) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 min-w-[160px]">
        <Label className="text-xs">School</Label>
        <Select value={schoolId} onValueChange={onSchoolChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All Schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Schools</SelectItem>
            {filteredSchools.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.schoolname || s.name}
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
            {academicYears.map((yr: any) => (
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [sourceParishes, setSourceParishes] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2025-26");

  // No-op for now

  // No-op for now
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  // --- Assignments Tab State ---
  const [assignmentSubTab, setAssignmentSubTab] = useState<
    "unassigned" | "assigned"
  >("unassigned");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTargetSchool, setSelectedTargetSchool] = useState<any | null>(
    null,
  );
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [assignFilterForane, setAssignFilterForane] = useState<string>("All");
  const [assignFilterParishId, setAssignFilterParishId] =
    useState<string>("All");
  const [assignFilterClass, setAssignFilterClass] = useState<string>("All");
  const [assignFilterSchoolForane, setAssignFilterSchoolForane] =
    useState<string>("All");

  // --- All Observers Tab State ---
  const [dirFilterForane, setDirFilterForane] = useState<string>("All");
  const [dirFilterParishId, setDirFilterParishId] = useState<string>("All");
  const [dirFilterClass, setDirFilterClass] = useState<string>("All");
  const [dirFilteredTeachers, setDirFilteredTeachers] = useState<Teacher[]>([]);

  // --- Submission View State ---
  const [viewSubmissionAssignment, setViewSubmissionAssignment] = useState<
    any | null
  >(null);

  // --- Remark Dialog State ---
  const [remarkAssignment, setRemarkAssignment] = useState<any | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [existingRemarks, setExistingRemarks] = useState<ObserverRemark[]>([]);
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [isSavingRemark, setIsSavingRemark] = useState(false);

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
        const [usersData, teachersData, assignmentsData] = await Promise.all([
          getUsers(),
          TeacherService.getTeachers(),
          AssignmentService.getAssignments(),
        ]);
        const allUsersRaw = usersData as UserData[];
        const groupByName = (users: any[]) => {
          const map = new Map<string, any>();
          users.forEach((u) => {
            const name =
              (u as any).schoolname ||
              (u as any).name ||
              (u as any).displayName ||
              u.email;
            const id = u.uid || u.id;
            if (map.has(name)) {
              const existing = map.get(name);
              if (!existing.ids.includes(id)) {
                existing.ids.push(id);
              }
            } else {
              map.set(name, {
                ...u,
                id, // primary id for selected state
                ids: [id],
                name,
              });
            }
          });
          return Array.from(map.values());
        };

        const sourceParishesList = groupByName(
          allUsersRaw.filter((u) => u.role === "parish" || u.role === "school"),
        );
        const schoolsList = groupByName(
          allUsersRaw.filter((u) => u.role === "school"),
        );

        setAllUsers(usersData);
        setAllTeachers(teachersData);
        setSourceParishes(sourceParishesList);
        setSchools(schoolsList);
        setAssignments(assignmentsData);

        // Fetch expiration date
        const expDoc =
          await AssignmentService.getExpirationDate(selectedAcademicYear);
        if (expDoc) setExpirationDate(expDoc);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger, selectedAcademicYear]);

  // School filters for main Assignments view
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

  // Filtered Schools for Assignments tab
  const schoolsWithStatus = schools.map((s) => {
    const assignment = assignments.find(
      (a) =>
        a.targetSchoolId === s.id && a.academicYear === selectedAcademicYear,
    );
    return { ...s, assignment };
  });

  const filteredSchools = schoolsWithStatus.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      (s as any).schoolname
        ?.toLowerCase()
        .includes(schoolSearchQuery.toLowerCase());
    const matchesTab =
      assignmentSubTab === "assigned" ? !!s.assignment : !s.assignment;
    const matchesForane =
      assignFilterSchoolForane === "All" ||
      (s as any).forane === assignFilterSchoolForane;
    return matchesSearch && matchesTab && matchesForane;
  });

  // Filter logic for All Observers tab

  // Filter logic for All Observers tab
  useEffect(() => {
    let result = allTeachers;
    if (dirFilterForane && dirFilterForane !== "All") {
      result = result.filter((t: any) => {
        const p = sourceParishes.find((s: any) =>
          s.ids
            ? s.ids.includes(t.parishId || t.schoolId)
            : s.id === (t.parishId || t.schoolId),
        );
        return p?.forane === dirFilterForane;
      });
    }
    if (dirFilterParishId && dirFilterParishId !== "All") {
      const selected = sourceParishes.find((p) => p.id === dirFilterParishId);
      if (selected && selected.ids) {
        result = result.filter((t: any) =>
          selected.ids.includes(t.parishId || t.schoolId),
        );
      } else {
        result = result.filter(
          (t: any) => (t.parishId || t.schoolId) === dirFilterParishId,
        );
      }
    }
    if (dirFilterClass && dirFilterClass !== "All") {
      result = result.filter(
        (t: any) => t.classes && t.classes.includes(dirFilterClass),
      );
    }
    setDirFilteredTeachers(result);
  }, [
    dirFilterForane,
    dirFilterParishId,
    dirFilterClass,
    allTeachers,
    sourceParishes,
  ]);

  // --- Handlers ---

  // --- Handlers ---
  const handleAssign = async (teacher: Teacher) => {
    if (!selectedTargetSchool) return;
    setAssigning(teacher.id);
    try {
      await AssignmentService.assignTeacher(
        teacher,
        selectedTargetSchool,
        selectedAcademicYear,
        "Observer",
      );
      toast.success(`Assigned ${teacher.name} successfully`);
      setIsAssignDialogOpen(false);
      setRefreshTrigger((n) => n + 1);
    } catch (error: any) {
      toast.error(error.message || "Assignment failed");
    } finally {
      setAssigning(null);
    }
  };

  const handleDelete = async (assignmentId: string, teacherId: string) => {
    if (!window.confirm("Are you sure you want to remove this assignment?"))
      return;
    try {
      await AssignmentService.deleteAssignment(assignmentId, teacherId);
      toast.success("Assignment removed");
      setRefreshTrigger((n) => n + 1);
    } catch (error) {
      toast.error("Failed to remove assignment");
    }
  };

  const fetchRemarks = async (assignmentId: string) => {
    setRemarkLoading(true);
    try {
      const remarks = await RemarkService.getRemarksByDuty(assignmentId);
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
    const teacher = allTeachers.find(
      (t: any) => t.id === remarkAssignment.teacherId,
    );
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
      fetchRemarks(remarkAssignment.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to save remark");
    } finally {
      setIsSavingRemark(false);
    }
  };

  const handleGenerateAssignmentReport = async () => {
    const filtered = assignments.filter((a) => {
      const teacher = allTeachers.find((t: any) => t.id === a.teacherId);
      const assignedParish = schools.find((p: any) =>
        p.ids ? p.ids.includes(a.targetSchoolId) : p.id === a.targetSchoolId,
      );
      if (!teacher || !assignedParish) return false;

      sourceParishes.find((p: any) =>
        p.ids
          ? p.ids.includes(teacher.parishId || teacher.schoolId)
          : p.id === (teacher.parishId || teacher.schoolId),
      );

      const matchesForane =
        rptAssignForane === "All" || assignedParish.forane === rptAssignForane;

      const selectedSource = schools.find((p) => p.id === rptAssignParishId);
      const matchesParish =
        rptAssignParishId === "All" ||
        (selectedSource?.ids
          ? selectedSource.ids.includes(a.targetSchoolId)
          : a.targetSchoolId === rptAssignParishId);

      const matchesYear =
        rptAssignYear === "All" || a.academicYear === rptAssignYear;
      return matchesForane && matchesParish && matchesYear;
    });
    if (filtered.length === 0) {
      toast.warning("No assignments match the selected filters.");
      return;
    }
    setGeneratingAssignReport(true);
    try {
      await PremiumAnimatorObserverPdfService.generateObserverAssignmentReport(
        filtered,
        allTeachers,
        allUsers as any,
        rptAssignForane,
        rptAssignParishId,
        rptAssignYear,
      );
      toast.success(
        `Assignment report generated for ${filtered.length} record(s).`,
      );
    } finally {
      setGeneratingAssignReport(false);
    }
  };

  const handleGenerateDirectoryReport = async () => {
    const filtered = allTeachers.filter((t: any) => {
      const homeParish = sourceParishes.find((p: any) =>
        p.ids
          ? p.ids.includes(t.parishId || t.schoolId)
          : p.id === (t.parishId || t.schoolId),
      );

      const matchesForane =
        rptDirForane === "All" || homeParish?.forane === rptDirForane;

      const selectedSource = sourceParishes.find(
        (p) => p.id === rptDirParishId,
      );
      const matchesParish =
        rptDirParishId === "All" ||
        (selectedSource?.ids
          ? selectedSource.ids.includes(t.parishId || t.schoolId)
          : (t.parishId || t.schoolId) === rptDirParishId);

      const matchesYear = rptDirYear === "All" || t.academicYear === rptDirYear;
      return matchesForane && matchesParish && matchesYear;
    });
    if (filtered.length === 0) {
      toast.warning("No observers match the selected filters.");
      return;
    }
    setGeneratingDirReport(true);
    try {
      await PremiumAnimatorObserverPdfService.generateObserverDirectoryReport(
        filtered,
        allUsers as any,
        rptDirForane,
        rptDirParishId,
        rptDirYear,
      );
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
    new Set(sourceParishes.map((p: any) => p.forane).filter(Boolean)),
  ).sort() as string[];
  const uniqueAcademicYears = Array.from(
    new Set(allTeachers.map((t) => t.academicYear).filter(Boolean)),
  ).sort() as string[];
  const dirFilteredParishes =
    dirFilterForane === "All"
      ? sourceParishes
      : sourceParishes.filter((p: any) => p.forane === dirFilterForane);

  // Unique foranes from schools for assignment dialog filter
  const uniqueAssignForanes = Array.from(
    new Set(schools.map((s: any) => s.forane).filter(Boolean)),
  ).sort() as string[];

  // No-op for now

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 uppercase">
            Observer Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage school observers, view assignments, and generate reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const dateInput = document.createElement("input");
              dateInput.type = "date";
              dateInput.onchange = async (e) => {
                const newDate = (e.target as HTMLInputElement).value;
                if (newDate) {
                  try {
                    await AssignmentService.setExpirationDate(
                      selectedAcademicYear,
                      new Date(newDate),
                    );
                    setExpirationDate(new Date(newDate));
                    toast.success("Expiration date updated");
                  } catch (err) {
                    toast.error("Failed to update date");
                  }
                }
              };
              dateInput.click();
            }}
          >
            <Calendar className="h-4 w-4" />
            {expirationDate
              ? new Date(expirationDate).toLocaleDateString()
              : "Set Expiration"}
          </Button>
          <Select
            value={selectedAcademicYear}
            onValueChange={setSelectedAcademicYear}
          >
            <SelectTrigger className="w-[120px] bg-indigo-900 text-white border-none shadow-sm focus:ring-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4 opacity-70" />
                <SelectValue placeholder="Year" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {uniqueAcademicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="all-observers">Observer Directory</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card text-card-foreground p-4 rounded-lg shadow-sm border">
              <div className="bg-muted p-1 rounded-lg flex gap-1">
                <Button
                  variant={
                    assignmentSubTab === "unassigned" ? "secondary" : "ghost"
                  }
                  size="sm"
                  className={cn(
                    "rounded-md px-6 font-semibold",
                    assignmentSubTab === "unassigned"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setAssignmentSubTab("unassigned")}
                >
                  Unassigned
                </Button>
                <Button
                  variant={
                    assignmentSubTab === "assigned" ? "secondary" : "ghost"
                  }
                  size="sm"
                  className={cn(
                    "rounded-md px-6 font-semibold",
                    assignmentSubTab === "assigned"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setAssignmentSubTab("assigned")}
                >
                  Assigned
                </Button>
              </div>
              <div className="relative w-full md:w-80">
                <Input
                  placeholder="Search schools..."
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </span>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select
                  value={assignFilterSchoolForane}
                  onValueChange={setAssignFilterSchoolForane}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map((school) => (
                <Card
                  key={school.id}
                  className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="p-4 flex gap-4 items-start">
                      <div
                        className={cn(
                          "p-3 rounded-xl",
                          school.assignment
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                            : "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
                        )}
                      >
                        <ArrowRight className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-indigo-950 dark:text-indigo-100 truncate max-w-[200px]">
                          {school.schoolname || school.name}
                        </h3>
                        {school.assignment ? (
                          <>
                            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                              Observer: {school.assignment.teacherName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              From: {school.assignment.sourceSchoolName}
                            </p>
                            <div className="flex justify-between items-center mt-3">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-300 px-2"
                              >
                                {school.assignment.accessCode}
                              </Badge>
                              <div className="flex gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-indigo-500 hover:bg-indigo-50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    >
                                      <FileDown className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-56 font-medium"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast.info(
                                          "Generating Duty Order PDF...",
                                        );
                                        IndividualObserverPdfService.generateDutyOrderPdf(
                                          school.assignment,
                                          expirationDate
                                            ? expirationDate.toISOString()
                                            : null,
                                        ).catch(() =>
                                          toast.error("Failed to generate PDF"),
                                        );
                                      }}
                                    >
                                      Duty Order (Observer)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast.info(
                                          "Generating Admin Report PDF...",
                                        );
                                        IndividualObserverPdfService.generateAdminReportPdf(
                                          school.assignment,
                                          expirationDate
                                            ? expirationDate.toISOString()
                                            : null,
                                        ).catch(() =>
                                          toast.error("Failed to generate PDF"),
                                        );
                                      }}
                                    >
                                      Assignment Record (Admin)
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-indigo-500 hover:bg-indigo-50"
                                  onClick={() =>
                                    setViewSubmissionAssignment(
                                      school.assignment,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-indigo-700 hover:bg-indigo-50"
                                  onClick={() => {
                                    setRemarkAssignment(school.assignment);
                                    setRemarkText("");
                                  }}
                                >
                                  <MessageSquarePlus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:bg-red-50"
                                  onClick={() =>
                                    handleDelete(
                                      school.assignment.id,
                                      school.assignment.teacherId,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground italic">
                              No observer assigned
                            </p>
                            <Button
                              className="w-full mt-4 bg-indigo-900 hover:bg-indigo-800 text-white font-bold"
                              onClick={() => {
                                setSelectedTargetSchool(school);
                                setAssignFilterForane("All");
                                setAssignFilterParishId("All");
                                setAssignFilterClass("All");
                                setAssignSearchQuery("");
                                setIsAssignDialogOpen(true);
                              }}
                            >
                              Assign
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredSchools.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-3">
                  <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto">
                    <History className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No {assignmentSubTab} schools found.
                  </p>
                </div>
              )}
            </div>
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
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Schools</SelectItem>
                      {dirFilteredParishes.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.schoolname || p.name}
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
                  schools={schools}
                  academicYears={uniqueAcademicYears}
                  forane={rptAssignForane}
                  schoolId={rptAssignParishId}
                  academicYear={rptAssignYear}
                  onForaneChange={setRptAssignForane}
                  onSchoolChange={setRptAssignParishId}
                  onYearChange={setRptAssignYear}
                  onGenerate={handleGenerateAssignmentReport}
                  generating={generatingAssignReport}
                />
                {/* Preview count */}
                <p className="text-xs text-muted-foreground pl-1">
                  {(() => {
                    const filtered = assignments.filter((a) => {
                      const teacher = allTeachers.find(
                        (t) => t.id === a.teacherId,
                      );
                      const ap = schools.find((p: any) =>
                        p.ids
                          ? p.ids.includes(a.targetSchoolId)
                          : p.id === a.targetSchoolId,
                      );
                      if (!teacher || !ap) return false;

                      const selectedSource = schools.find(
                        (p) => p.id === rptAssignParishId,
                      );
                      const matchesParish =
                        rptAssignParishId === "All" ||
                        (selectedSource?.ids
                          ? selectedSource.ids.includes(a.targetSchoolId)
                          : a.targetSchoolId === rptAssignParishId);

                      return (
                        (rptAssignForane === "All" ||
                          ap.forane === rptAssignForane) &&
                        matchesParish &&
                        (rptAssignYear === "All" ||
                          a.academicYear === rptAssignYear)
                      );
                    });
                    return `${filtered.length} assignment(s) will be included in this report.`;
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
                  schools={schools}
                  academicYears={uniqueAcademicYears}
                  forane={rptDirForane}
                  schoolId={rptDirParishId}
                  academicYear={rptDirYear}
                  onForaneChange={setRptDirForane}
                  onSchoolChange={setRptDirParishId}
                  onYearChange={setRptDirYear}
                  onGenerate={handleGenerateDirectoryReport}
                  generating={generatingDirReport}
                />
                {/* Preview count */}
                <p className="text-xs text-muted-foreground pl-1">
                  {(() => {
                    const filtered = allTeachers.filter((t: any) => {
                      const hp = sourceParishes.find((p: any) =>
                        p.ids
                          ? p.ids.includes(t.parishId || t.schoolId)
                          : p.id === (t.parishId || t.schoolId),
                      );
                      const selectedSource = sourceParishes.find(
                        (p) => p.id === rptDirParishId,
                      );
                      const matchesParish =
                        rptDirParishId === "All" ||
                        (selectedSource?.ids
                          ? selectedSource.ids.includes(
                            t.parishId || t.schoolId,
                          )
                          : (t.parishId || t.schoolId) === rptDirParishId);

                      return (
                        (rptDirForane === "All" ||
                          hp?.forane === rptDirForane) &&
                        matchesParish &&
                        (rptDirYear === "All" || t.academicYear === rptDirYear)
                      );
                    });
                    return `${filtered.length} observer(s) will be included in this report.`;
                  })()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── ADD ASSIGNMENT DIALOG (2-STEP) ─── */}
      <Dialog
        open={isAssignDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsAssignDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-3xl bg-white border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-indigo-950 text-white rounded-t-none">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl font-bold">
                  Assign Observer
                </DialogTitle>
                <p className="text-indigo-300 text-xs mt-1 uppercase font-bold tracking-wider">
                  Target:{" "}
                  {selectedTargetSchool?.schoolname ||
                    selectedTargetSchool?.name}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-indigo-400 text-indigo-200"
              >
                {selectedAcademicYear}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Filters Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Forane
                </Label>
                <Select
                  value={assignFilterForane}
                  onValueChange={(val) => {
                    setAssignFilterForane(val);
                    setAssignFilterParishId("All"); // reset school when forane changes
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Foranes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Foranes</SelectItem>
                    {uniqueAssignForanes.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  School
                </Label>
                <Select
                  value={assignFilterParishId}
                  onValueChange={setAssignFilterParishId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Schools</SelectItem>
                    {schools
                      .filter(
                        (s) =>
                          s.id !== selectedTargetSchool?.id &&
                          (assignFilterForane === "All" ||
                            s.forane === assignFilterForane),
                      )
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Class
                </Label>
                <Select
                  value={assignFilterClass}
                  onValueChange={setAssignFilterClass}
                >
                  <SelectTrigger className="h-9">
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
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Search Name
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Search..."
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    className="h-9 pl-9"
                  />
                  <History className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Selection Area */}
            <div className="border rounded-xl bg-slate-50/50 overflow-hidden">
              <div className="p-3 border-b bg-white flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-600 uppercase">
                  Available Observers
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">
                  {
                    allTeachers.filter((t) => {
                      const teacherSchool = schools.find(
                        (s) => s.id === t.schoolId,
                      );
                      const matchesForane =
                        assignFilterForane === "All" ||
                        teacherSchool?.forane === assignFilterForane;
                      const matchesSchool =
                        assignFilterParishId === "All" ||
                        t.schoolId === assignFilterParishId;
                      const matchesClass =
                        assignFilterClass === "All" ||
                        (t.classes &&
                          (Array.isArray(t.classes)
                            ? t.classes.includes(assignFilterClass)
                            : String(t.classes) === assignFilterClass));
                      const matchesSearch = t.name
                        .toLowerCase()
                        .includes(assignSearchQuery.toLowerCase());
                      const isEligible =
                        t.schoolId !== selectedTargetSchool?.id &&
                        !assignments.some(
                          (a) =>
                            a.teacherId === t.id &&
                            a.academicYear === selectedAcademicYear,
                        );
                      return (
                        matchesForane &&
                        matchesSchool &&
                        matchesClass &&
                        matchesSearch &&
                        isEligible
                      );
                    }).length
                  }{" "}
                  found
                </span>
              </div>
              <div className="h-[300px] overflow-y-auto p-2 space-y-1">
                {allTeachers
                  .filter((t) => {
                    const teacherSchool = schools.find(
                      (s) => s.id === t.schoolId,
                    );
                    const matchesForane =
                      assignFilterForane === "All" ||
                      teacherSchool?.forane === assignFilterForane;
                    const matchesSchool =
                      assignFilterParishId === "All" ||
                      t.schoolId === assignFilterParishId;
                    const matchesClass =
                      assignFilterClass === "All" ||
                      (t.classes &&
                        (Array.isArray(t.classes)
                          ? t.classes.includes(assignFilterClass)
                          : String(t.classes) === assignFilterClass));
                    const matchesSearch = t.name
                      .toLowerCase()
                      .includes(assignSearchQuery.toLowerCase());
                    const isEligible =
                      t.schoolId !== selectedTargetSchool?.id &&
                      !assignments.some(
                        (a) =>
                          a.teacherId === t.id &&
                          a.academicYear === selectedAcademicYear,
                      );
                    return (
                      matchesForane &&
                      matchesSchool &&
                      matchesClass &&
                      matchesSearch &&
                      isEligible
                    );
                  })
                  .map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
                    >
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {teacher.name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {(teacher as any).schoolName ||
                            schools.find(
                              (s) => s.id === (teacher as any).schoolId,
                            )?.name}{" "}
                          • Class{" "}
                          {Array.isArray(teacher.classes)
                            ? teacher.classes.join(", ")
                            : teacher.classes || "N/A"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs"
                        onClick={() => handleAssign(teacher)}
                        disabled={!!assigning}
                      >
                        {assigning === teacher.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Assign"
                        )}
                      </Button>
                    </div>
                  ))}
                {allTeachers.filter((t) => {
                  const teacherSchool = schools.find(
                    (s) => s.id === t.schoolId,
                  );
                  const matchesForane =
                    assignFilterForane === "All" ||
                    teacherSchool?.forane === assignFilterForane;
                  const matchesSchool =
                    assignFilterParishId === "All" ||
                    t.schoolId === assignFilterParishId;
                  const matchesClass =
                    assignFilterClass === "All" ||
                    (t.classes &&
                      (Array.isArray(t.classes)
                        ? t.classes.includes(assignFilterClass)
                        : String(t.classes) === assignFilterClass));
                  const matchesSearch = t.name
                    .toLowerCase()
                    .includes(assignSearchQuery.toLowerCase());
                  const isEligible =
                    t.schoolId !== selectedTargetSchool?.id &&
                    !assignments.some(
                      (a) =>
                        a.teacherId === t.id &&
                        a.academicYear === selectedAcademicYear,
                    );
                  return (
                    matchesForane &&
                    matchesSchool &&
                    matchesClass &&
                    matchesSearch &&
                    isEligible
                  );
                }).length === 0 && (
                    <div className="py-20 text-center text-slate-400 italic text-sm">
                      No eligible observers found matching your filters.
                    </div>
                  )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t items-center gap-2">
            <p className="text-[10px] text-slate-400 mr-auto ml-2">
              Note: Teachers already assigned for {selectedAcademicYear} are
              hidden.
            </p>
            <Button
              variant="ghost"
              onClick={() => setIsAssignDialogOpen(false)}
              className="text-slate-500"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── SUBMISSION VIEW DIALOG ─── */}
      <Dialog
        open={!!viewSubmissionAssignment}
        onOpenChange={(open) => {
          if (!open) setViewSubmissionAssignment(null);
        }}
      >
        <DialogContent className="max-w-lg bg-white border-none shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-950 to-indigo-700 p-6 text-white">
            <div className="flex justify-between items-start mb-1">
              <DialogTitle className="text-lg font-bold text-white">
                Observer Submission
              </DialogTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold uppercase border px-2",
                  viewSubmissionAssignment?.remarks
                    ? "border-green-400 text-green-300 bg-green-900/30"
                    : "border-yellow-400 text-yellow-300 bg-yellow-900/30",
                )}
              >
                {viewSubmissionAssignment?.remarks ? "Submitted" : "Pending"}
              </Badge>
            </div>
            <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">
              {selectedAcademicYear}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Observer + School card */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-indigo-700">
                    {viewSubmissionAssignment?.teacherName?.[0] ?? "?"}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-indigo-950 text-base leading-tight">
                    {viewSubmissionAssignment?.teacherName ??
                      "Unknown Observer"}
                  </p>
                  <p className="text-[11px] text-indigo-500 font-semibold uppercase tracking-wide">
                    Observer
                  </p>
                </div>
              </div>
              <div className="border-t border-indigo-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Target School
                  </p>
                  <p className="text-sm font-bold text-indigo-950 mt-0.5">
                    {viewSubmissionAssignment?.targetSchoolName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Submitted
                  </p>
                  <p className="text-sm font-bold text-indigo-950 mt-0.5">
                    {viewSubmissionAssignment?.remarksSubmittedAt
                      ? new Date(
                        (viewSubmissionAssignment.remarksSubmittedAt as any)
                          .seconds * 1000,
                      ).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "Pending"}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Metrics */}
            <div className="border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">#</span>
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  Attendance Metrics
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500 font-medium">
                  Total Attendance
                </p>
                <p className="text-lg font-bold text-indigo-900">
                  {viewSubmissionAssignment?.totalAttendance ?? (
                    <span className="text-slate-400 text-sm italic">N/A</span>
                  )}
                </p>
              </div>
              <div className="border-t pt-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">
                  Absentees
                </p>
                <p className="text-sm text-indigo-900 font-medium leading-relaxed whitespace-pre-line">
                  {viewSubmissionAssignment?.absentees || (
                    <span className="italic text-slate-400">None reported</span>
                  )}
                </p>
              </div>
            </div>

            {/* Observer Remarks */}
            <div className="border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Eye className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  Observer Remarks
                </p>
              </div>
              <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-line">
                {viewSubmissionAssignment?.remarks || (
                  <span className="italic text-slate-400">
                    No remarks submitted yet.
                  </span>
                )}
              </p>
            </div>
          </div>

          <DialogFooter className="px-6 pb-5">
            <Button
              variant="outline"
              onClick={() => setViewSubmissionAssignment(null)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── REMARK DIALOG ─── */}
      <Dialog
        open={!!remarkAssignment}
        onOpenChange={(open) => {
          if (!open) {
            setRemarkAssignment(null);
            setRemarkText("");
          }
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
                      <div
                        key={r.id}
                        className="text-sm border-b last:border-0 pb-2"
                      >
                        <p className="text-foreground">{r.remark}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.createdAt
                            ? new Date(
                              (r.createdAt as any).seconds * 1000,
                            ).toLocaleString()
                            : ""}
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
            <Button
              variant="outline"
              onClick={() => {
                setRemarkAssignment(null);
                setRemarkText("");
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleSaveRemark}
              disabled={isSavingRemark || !remarkText.trim()}
            >
              {isSavingRemark ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
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
