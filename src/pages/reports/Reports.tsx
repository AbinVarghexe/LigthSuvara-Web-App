import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Download,
  Calendar,
  Loader2,
  TrendingUp,
  Filter,
  Church,
  BookUser,
  GraduationCap,
  UserCheck,
  Eye,
  BarChart3,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  PolarGrid,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../components/ui/chart";

import { createMalayalamPDF } from "../../lib/pdfFonts";
import { EventData, getEvents } from "../../features/events/services/eventService";
import { EventPdfService } from "../../features/events/services/eventPdfService";
import { PremiumSundaySchoolPdfService } from "../../features/reports/services/sundaySchoolPdfService";
import { PremiumTeacherClassPdfService } from "../../features/reports/services/teacherClassPdfService";
import { PremiumAnimatorObserverPdfService } from "../../features/reports/services/animatorObserverPdfServices";
import { UserData, getUsers } from "../../features/users/services/userService";
import { getAnimators, AnimatorWithUser } from "../../features/animators/services/animatorService";
import {
  getPrograms,
  getProgramRegistrations,
  ProgramData,
  ProgramRegistration
} from "../../features/programs/services/programService";
import { PremiumProgramPdfService } from "../../features/reports/services/programPdfService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../context/AuthContext";
import { TeacherService } from "../../features/teachers/services/teacherService";
import { AssignmentService } from "../../features/teachers/services/assignmentService";
import { Teacher } from "../../features/teachers/types";

// ─── Shared Filter Bar ────────────────────────────────────────────────────────
interface FilterBarProps {
  foranes: string[];
  parishes?: { id: string; name: string; forane?: string }[];
  academicYears?: string[];
  forane: string;
  parishId?: string;
  academicYear?: string;
  onForaneChange: (v: string) => void;
  onParishChange?: (v: string) => void;
  onYearChange?: (v: string) => void;
  onGenerate: () => void;
  generating?: boolean;
  extraLabel?: string;
}

function FilterBar({
  foranes,
  parishes = [],
  academicYears = [],
  forane,
  parishId = "All",
  academicYear = "All",
  onForaneChange,
  onParishChange,
  onYearChange,
  onGenerate,
  generating = false,
  extraLabel = "Generate Report",
}: FilterBarProps) {
  const filteredParishes =
    forane === "All"
      ? parishes
      : parishes.filter((p) => (p as any).forane === forane);
  return (
    <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 rounded-lg border">
      <div className="space-y-1 min-w-[150px]">
        <Label className="text-xs text-muted-foreground">Forane</Label>
        <Select
          value={forane}
          onValueChange={(v) => {
            onForaneChange(v);
            onParishChange?.("All");
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
      {onParishChange && (
        <div className="space-y-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Parish</Label>
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
      )}
      {onYearChange && academicYears.length > 0 && (
        <div className="space-y-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Academic Year</Label>
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
      )}
      <Button
        size="sm"
        onClick={onGenerate}
        disabled={generating}
        className="h-8"
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="mr-2 h-3 w-3" />
            {extraLabel}
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  description,
  count,
  countLabel,
}: {
  icon: any;
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {count !== undefined && (
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {count} {countLabel || "records"}
        </Badge>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Reports() {
  const { isAdminUser } = useAuth();

  // Events data
  const [events, setEvents] = useState<EventData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);

  // Teachers / Observers data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Programs data
  const [programsList, setProgramsList] = useState<ProgramData[]>([]);
  const [registrations, setRegistrations] = useState<ProgramRegistration[]>([]);

  const [loading, setLoading] = useState(true);

  // ── Events Report state ──
  const [selectedEventId, setSelectedEventId] = useState("");
  const [generatingEventPdf, setGeneratingEventPdf] = useState(false);
  const [reportType, setReportType] = useState<
    "all" | "year" | "month" | "week"
  >("year");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString(),
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [evtForane, setEvtForane] = useState("All");
  const [evtSchool, setEvtSchool] = useState("All");
  const [evtRole, setEvtRole] = useState("All");

  // ── Sunday School Report state ──
  const [ssForane, setSsForane] = useState("All");
  const [ssParish, setSsParish] = useState("All");
  // Academic Year isn't strictly needed for Sunday School entities based on new requirements
  const [generatingSs, setGeneratingSs] = useState(false);

  // ── Class-wise Teacher Report state ──
  const [tmClassForane, setTmClassForane] = useState("All");
  const [tmClassParish, setTmClassParish] = useState("All");
  const [tmClassYear, setTmClassYear] = useState("All");
  const [tmClassFilter, setTmClassFilter] = useState("All");
  const [generatingTmClass, setGeneratingTmClass] = useState(false);

  // ── Programs Report state ──
  const [pgForane, setPgForane] = useState("All");
  const [pgParish, setPgParish] = useState("All");
  const [pgYear, setPgYear] = useState("All");
  const [pgSelectedProgramId, setPgSelectedProgramId] = useState("All");
  const [generatingPg, setGeneratingPg] = useState(false);

  // ── Animator Management Report state ──
  const [amForane, setAmForane] = useState("All");
  const [amParish, setAmParish] = useState("All");
  const [amYear, setAmYear] = useState("All");
  const [generatingAm, setGeneratingAm] = useState(false);

  // ── Observer Reports state ──
  const [obsAssignForane, setObsAssignForane] = useState("All");
  const [obsAssignParish, setObsAssignParish] = useState("All");
  const [obsAssignYear, setObsAssignYear] = useState("All");
  const [generatingObsAssign, setGeneratingObsAssign] = useState(false);

  const [obsDirForane, setObsDirForane] = useState("All");
  const [obsDirParish, setObsDirParish] = useState("All");
  const [obsDirYear, setObsDirYear] = useState("All");
  const [generatingObsDir, setGeneratingObsDir] = useState(false);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          eventsData,
          usersData,
          teachersData,
          assignmentsData,
          programsData,
          registrationsData,
        ] = await Promise.all([
          getEvents(),
          getUsers(),
          TeacherService.getTeachers({ includeDeleted: true }),
          AssignmentService.getAssignments(),
          getPrograms(),
          getProgramRegistrations(),
        ]);
        setEvents(eventsData as EventData[]);
        setUsers(usersData);
        setTeachers(teachersData);
        setAssignments(assignmentsData as any[]);
        setProgramsList(programsData);
        setRegistrations(registrationsData);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSchoolNames = useMemo(() => {
    const names = new Set<string>();
    users.forEach((u) => {
      if (u.role === "school") {
        const matchForane = evtForane === "All" || u.forane === evtForane;
        if (matchForane) {
          const n = u.schoolName || u.schoolname;
          if (n) names.add(n);
        }
      }
    });
    return Array.from(names).sort();
  }, [users, evtForane]);

  const dynamicParishes = useMemo(() => {
    return users
      .filter((u) => u.role === "school")
      .map((u) => ({
        id: u.uid || u.id,
        name: u.schoolName || u.schoolname || "Unknown",
        forane: u.forane || "Unknown Forane",
        location: { lat: 0, long: 0 }
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const uniqueForanes = useMemo(
    () =>
      Array.from(
        new Set(
          users
            .filter((u) => u.role === "school")
            .map((u) => u.forane)
            .filter(Boolean),
        ),
      ).sort() as string[],
    [users],
  );

  const uniqueAcademicYears = useMemo(
    () =>
      Array.from(
        new Set(teachers.map((t) => t.academicYear).filter(Boolean)),
      ).sort() as string[],
    [teachers],
  );

  const getEventDate = (event: EventData) =>
    event.date
      ? new Date(
        (event.date as any).seconds
          ? (event.date as any).seconds * 1000
          : event.date,
      )
      : new Date();

  const filteredEvents = events.filter((event) => {
    if (evtForane !== "All" && event.creatorForane !== evtForane) return false;
    if (evtSchool !== "All") {
      const creator = users.find(
        (u) => u.uid === event.creatorId || u.id === event.creatorId,
      );
      const s =
        event.lastEditedByName ||
        (event as any).creatorSchoolName ||
        creator?.schoolName ||
        creator?.schoolname ||
        "";
      if (s !== evtSchool) return false;
    }
    if (evtRole !== "All") {
      const creator = users.find(
        (u) => u.uid === event.creatorId || u.id === event.creatorId,
      );
      if (!creator || creator.role !== evtRole) return false;
    }
    if (reportType === "all") return true;
    const d = getEventDate(event);
    if (reportType === "year")
      return d.getFullYear().toString() === selectedYear;
    if (reportType === "month")
      return (
        d.getFullYear().toString() === selectedYear &&
        d.getMonth().toString() === selectedMonth
      );
    if (reportType === "week" && selectedDate) {
      const target = new Date(selectedDate);
      const start = new Date(target);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return true;
  });

  // ── Chart data ──
  let chartData: { name: string; events: number }[] = [];
  if (reportType === "week") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    filteredEvents.forEach((e) => {
      counts[getEventDate(e).getDay()]++;
    });
    chartData = days.map((day, i) => ({ name: day, events: counts[i] }));
  } else if (reportType === "month") {
    const dim = new Date(
      parseInt(selectedYear),
      parseInt(selectedMonth) + 1,
      0,
    ).getDate();
    const counts = new Array(dim).fill(0);
    filteredEvents.forEach((e) => {
      const d = getEventDate(e).getDate() - 1;
      if (d >= 0 && d < dim) counts[d]++;
    });
    chartData = Array.from({ length: dim }, (_, i) => ({
      name: (i + 1).toString(),
      events: counts[i],
    }));
  } else if (reportType === "year") {
    const mths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const counts = new Array(12).fill(0);
    filteredEvents.forEach((e) => {
      counts[getEventDate(e).getMonth()]++;
    });
    chartData = mths.map((m, i) => ({ name: m, events: counts[i] }));
  } else {
    const yc: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      const y = getEventDate(e).getFullYear().toString();
      yc[y] = (yc[y] || 0) + 1;
    });
    chartData = Object.entries(yc)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, events]) => ({ name, events }));
  }

  const categoryCount = filteredEvents.reduce(
    (acc: Record<string, number>, event) => {
      const cat =
        (event.category || "").toLowerCase() === "cml" ? "CML" : "Suvara";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {},
  );

  const categoryData = [
    {
      category: "cml",
      count: categoryCount["CML"] || 0,
      fill: "var(--color-cml)",
    },
    {
      category: "suvara",
      count: categoryCount["Suvara"] || 0,
      fill: "var(--color-suvara)",
    },
  ];

  const blueShades = [
    "hsl(217,91%,60%)",
    "hsl(217,91%,50%)",
    "hsl(217,91%,70%)",
    "hsl(217,91%,40%)",
    "hsl(217,91%,80%)",
  ];
  const schoolEventCount = filteredEvents.reduce(
    (acc: Record<string, number>, event) => {
      const creator = users.find(
        (u) => u.uid === event.creatorId || u.id === event.creatorId,
      );
      const school =
        event.lastEditedByName ||
        (event as any).creatorSchoolName ||
        creator?.schoolName ||
        creator?.schoolname ||
        "Unknown";
      acc[school] = (acc[school] || 0) + 1;
      return acc;
    },
    {},
  );
  const schoolActivity = Object.entries(schoolEventCount)
    .map(([school, evts], i) => ({
      school,
      events: evts,
      fill: blueShades[i % blueShades.length],
    }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 5);

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );
  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const eventsChartConfig = {
    events: { label: "Events", color: "hsl(217,91%,60%)" },
  };
  const categoryChartConfig = {
    count: { label: "Events" },
    cml: { label: "CML", color: "hsl(217,91%,60%)" },
    suvara: { label: "Suvara", color: "hsl(217,91%,75%)" },
  } satisfies ChartConfig;
  const schoolChartConfig = {
    events: { label: "Events", color: "hsl(217,91%,50%)" },
  };

  // ── PDF / CSV helpers ──
  const handleGenerateEventPDF = async () => {
    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return;
    setGeneratingEventPdf(true);
    try {
      await EventPdfService.generateEventPdf(event);
      toast.success("Event report generated successfully");
    } catch {
      toast.error("Failed to generate event PDF");
    } finally {
      setGeneratingEventPdf(false);
    }
  };

  const handleExportEvents = async (format: string) => {
    if (format === "csv") {
      const headers = [
        "Title",
        "Date",
        "Category",
        "School",
        "Forane",
        "Creator Role",
        "Status",
      ];
      const csv = [
        headers.join(","),
        ...filteredEvents.map((e) => {
          const creator = users.find(
            (u) => u.uid === e.creatorId || u.id === e.creatorId,
          );
          return [
            `"${e.title}"`,
            getEventDate(e).toLocaleDateString(),
            e.category,
            `"${e.lastEditedByName || (e as any).creatorSchoolName || ""}"`,
            `"${e.creatorForane || creator?.forane || ""}"`,
            creator?.role || "unknown",
            e.isPublic ? "Published" : "Draft",
          ].join(",");
        }),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `events_report_${reportType}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success("CSV Exported");
    } else {
      const doc = await createMalayalamPDF();
      doc.setFontSize(18);
      doc.setFont("NotoSansMalayalam", "bold");
      doc.text(`Events Report - ${reportType.toUpperCase()}`, 14, 20);
      let y = 35;
      doc.setFontSize(12);
      doc.setFont("NotoSansMalayalam", "normal");
      filteredEvents.forEach((e, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `${i + 1}. ${e.title} (${getEventDate(e).toLocaleDateString()}) - ${e.isPublic ? "Published" : "Draft"}`,
          14,
          y,
        );
        y += 10;
      });
      doc.save(`events_report_${reportType}.pdf`);
      toast.success("PDF Exported");
    }
  };

  const obsAssignCount = assignments.filter((a) => {
    const t = teachers.find((t) => t.id === a.teacherId);
    if (!t) return false;
    const hp = dynamicParishes.find((p) => p.id === (t.parishId || (t as any).schoolId));

    return (
      (obsAssignForane === "All" || hp?.forane === obsAssignForane) &&
      (obsAssignParish === "All" || (t.parishId || (t as any).schoolId) === obsAssignParish) &&
      (obsAssignYear === "All" || t.academicYear === obsAssignYear)
    );
  }).length;

  const obsDirCount = teachers.filter((t) => !t.deleted).filter((t) => {
    const hp = dynamicParishes.find((p) => p.id === (t.parishId || (t as any).schoolId));

    return (
      (obsDirForane === "All" || hp?.forane === obsDirForane) &&
      (obsDirParish === "All" || (t.parishId || (t as any).schoolId) === obsDirParish) &&
      (obsDirYear === "All" || t.academicYear === obsDirYear)
    );
  }).length;

  // Sunday School users count
  const ssCount = users.filter((u) => {
    const isSchoolRole = u.role === "school";
    const matchForane = ssForane === "All" || u.forane === ssForane;
    const matchParish =
      ssParish === "All" ||
      u.uid === ssParish ||
      u.id === ssParish;
    return isSchoolRole && matchForane && matchParish;
  }).length;

  // Unique classes across all teachers
  const uniqueClasses = Array.from(
    new Set(teachers.filter((t) => !t.deleted).flatMap((t) => t.classes || [])),
  ).sort();

  // Class-wise teacher count & breakdown
  const tmClassFiltered = teachers.filter((t) => !t.deleted).filter((t) => {
    const hp = dynamicParishes.find((p) => p.id === (t.parishId || (t as any).schoolId));

    return (
      (tmClassForane === "All" || hp?.forane === tmClassForane) &&
      (tmClassParish === "All" || (t.parishId || (t as any).schoolId) === tmClassParish) &&
      (tmClassYear === "All" || t.academicYear === tmClassYear) &&
      (tmClassFilter === "All" ||
        (t.classes && t.classes.includes(tmClassFilter)))
    );
  });
  const tmClassCount = tmClassFiltered.length;

  // Breakdown: how many teachers per class (respecting forane/parish/year filters, ignoring class filter)
  const tmClassBreakdown: { cls: string; count: number }[] = uniqueClasses
    .map((cls) => ({
      cls,
      count: teachers.filter((t) => !t.deleted).filter((t) => {
        const hp = dynamicParishes.find((p) => p.id === (t.parishId || (t as any).schoolId));

        return (
          (tmClassForane === "All" || hp?.forane === tmClassForane) &&
          (tmClassParish === "All" || (t.parishId || (t as any).schoolId) === tmClassParish) &&
          (tmClassYear === "All" || t.academicYear === tmClassYear) &&
          t.classes?.includes(cls)
        );
      }).length,
    }))
    .filter((row) => row.count > 0);

  // ─── Real PDF Handlers (using derived data) ───

  const handleGenerateSundaySchoolReport = async () => {
    const filteredUsers = users.filter((u) => {
      const isSchoolRole = u.role === "school";
      const matchForane = ssForane === "All" || u.forane === ssForane;
      const matchParish =
        ssParish === "All" ||
        u.uid === ssParish ||
        u.id === ssParish;
      return isSchoolRole && matchForane && matchParish;
    });

    if (filteredUsers.length === 0) {
      toast.warning("No Sunday School records found.");
      return;
    }
    setGeneratingSs(true);
    try {
      await PremiumSundaySchoolPdfService.generateReport(
        filteredUsers,
        ssForane,
        ssParish === "All" ? "All" : (dynamicParishes.find(p => p.id === ssParish)?.name || ssParish),
      );
      toast.success("Sunday School report generated");
    } catch {
      toast.error("Failed to generate Sunday School report");
    } finally {
      setGeneratingSs(false);
    }
  };

  const handleGenerateTeacherClassReport = async () => {
    if (tmClassFiltered.length === 0) {
      toast.warning("No teachers found.");
      return;
    }
    setGeneratingTmClass(true);
    try {
      await PremiumTeacherClassPdfService.generateReport(
        tmClassFiltered,
        dynamicParishes,
        tmClassYear,
        tmClassFilter,
        tmClassForane,
        tmClassParish === "All" ? "All" : (dynamicParishes.find(p => p.id === tmClassParish)?.name || tmClassParish),
      );
      toast.success("Teacher report generated");
    } catch {
      toast.error("Failed to generate teacher report");
    } finally {
      setGeneratingTmClass(false);
    }
  };

  const handleGenerateAnimatorReport = async () => {
    setGeneratingAm(true);
    try {
      const allAnimators = await getAnimators();

      const filteredAnimators: AnimatorWithUser[] = allAnimators.filter((a) => {
        const pInfo = dynamicParishes.find(p => p.id === a.parishId);

        const matchForane = amForane === "All" ||
          (a.parishName && a.parishName.toLowerCase().includes(amForane.toLowerCase())) ||
          (pInfo?.forane?.trim().toLowerCase() === amForane.trim().toLowerCase());

        const selectedParish = dynamicParishes.find(p => p.id === amParish);
        const matchParish = amParish === "All" ||
          a.parishId === amParish ||
          (selectedParish && a.parishName &&
            a.parishName.trim().toLowerCase() === selectedParish.name.trim().toLowerCase());

        return matchForane && matchParish;
      });

      if (filteredAnimators.length === 0) {
        toast.warning("No animators found.");
        return;
      }

      await PremiumAnimatorObserverPdfService.generateAnimatorReport(filteredAnimators, dynamicParishes, amForane, amParish);
      toast.success("Animator report generated");
    } catch (error) {
      console.error("Animator report error:", error);
      toast.error("Failed to generate animator report");
    } finally {
      setGeneratingAm(false);
    }
  };

  const handleGenerateObsAssignReport = async () => {
    const filtered = assignments.filter((a) => {
      const t = teachers.find((t) => t.id === a.teacherId);
      if (!t) return false;
      const hp = dynamicParishes.find((p) => p.id === (t.parishId || (t as any).schoolId));

      return (
        (obsAssignForane === "All" || hp?.forane === obsAssignForane) &&
        (obsAssignParish === "All" || (t.parishId || (t as any).schoolId) === obsAssignParish) &&
        (obsAssignYear === "All" || t.academicYear === obsAssignYear)
      );
    });

    if (filtered.length === 0) {
      toast.warning("No assignments found.");
      return;
    }
    setGeneratingObsAssign(true);
    try {
      await PremiumAnimatorObserverPdfService.generateObserverAssignmentReport(
        filtered,
        teachers,
        users,
        obsAssignForane,
        obsAssignParish,
        obsAssignYear,
      );
      toast.success("Assignment report generated");
    } catch {
      toast.error("Failed to generate assignment report");
    } finally {
      setGeneratingObsAssign(false);
    }
  };

  const handleGenerateObsDirReport = async () => {
    const filtered = teachers.filter((t) => !t.deleted).filter((t) => {
      const hp = dynamicParishes.find((p) => p.id === (t.parishId || (t as any).schoolId));

      return (
        (obsDirForane === "All" || hp?.forane === obsDirForane) &&
        (obsDirParish === "All" || (t.parishId || (t as any).schoolId) === obsDirParish) &&
        (obsDirYear === "All" || t.academicYear === obsDirYear)
      );
    });

    if (filtered.length === 0) {
      toast.warning("No observers found.");
      return;
    }

    setGeneratingObsDir(true);
    try {
      await PremiumAnimatorObserverPdfService.generateObserverDirectoryReport(
        filtered,
        users,
        obsDirForane,
        obsDirParish,
        obsDirYear,
      );
      toast.success("Directory report generated");
    } catch {
      toast.error("Failed to generate directory report");
    } finally {
      setGeneratingObsDir(false);
    }
  };

  const handleGenerateProgramReport = async () => {
    const filtered = registrations.filter((r) => {
      const matchProgram = pgSelectedProgramId === "All" || r.programId === pgSelectedProgramId;
      const schoolInfo = users.find(u => u.uid === r.schoolUserId || u.id === r.schoolUserId);
      const matchForane = pgForane === "All" ||
        (schoolInfo?.forane === pgForane) ||
        (dynamicParishes.find(p => p.id === r.parishUserId)?.forane === pgForane);
      const matchParish = pgParish === "All" || r.parishUserId === pgParish || r.schoolUserId === pgParish;

      return matchProgram && matchForane && matchParish;
    });

    if (filtered.length === 0) {
      toast.warning("No registrations found for the selected filters.");
      return;
    }

    setGeneratingPg(true);
    try {
      const programName = pgSelectedProgramId === "All" ? "All Programs" :
        programsList.find(p => p.id === pgSelectedProgramId)?.name || "Program";

      await PremiumProgramPdfService.generateReport(
        filtered,
        programName,
        pgForane,
        pgParish === "All" ? "All Parishes" : (dynamicParishes.find(p => p.id === pgParish)?.name || "All Parishes"),
        users
      );
      toast.success("Program report generated");
    } catch (error) {
      console.error("Program report error:", error);
      toast.error("Failed to generate program report");
    } finally {
      setGeneratingPg(false);
    }
  };


  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">
          Access Denied. Admin privileges required.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-[calc(100vw-2rem)] md:w-[calc(100vw-4rem)] lg:w-[calc(100vw-20rem)]">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Generate and export reports for each section. Use the filters to
          narrow down records.
        </p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 w-full justify-start bg-muted p-1 rounded-lg">
          <TabsTrigger
            value="events"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            Events
          </TabsTrigger>
          <TabsTrigger
            value="sunday-school"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <Church className="w-3.5 h-3.5" />
            Sunday School
          </TabsTrigger>
          <TabsTrigger
            value="teachers"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <BookUser className="w-3.5 h-3.5" />
            Teachers
          </TabsTrigger>
          <TabsTrigger
            value="programs"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Programs
          </TabsTrigger>
          <TabsTrigger
            value="animators"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Animators
          </TabsTrigger>
          <TabsTrigger
            value="observers"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            Observers
          </TabsTrigger>
        </TabsList>

        {/* ─── EVENTS ─── */}
        <TabsContent value="events" className="space-y-6">
          {/* Individual Event PDF */}
          <Card>
            <CardHeader>
              <SectionHeader
                icon={FileText}
                title="Individual Event Report"
                description="Generate a detailed PDF for a single event"
                count={events.length}
                countLabel="events"
              />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select
                    value={selectedEventId}
                    onValueChange={setSelectedEventId}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id || ""}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateEventPDF}
                  disabled={!selectedEventId || generatingEventPdf}
                  className="w-full sm:w-auto"
                >
                  {generatingEventPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Analytics */}
          <Card>
            <CardHeader>
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <SectionHeader
                  icon={Calendar}
                  title="Events Analytics"
                  description="Charts and statistics for events"
                  count={filteredEvents.length}
                  countLabel="filtered events"
                />
                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                    value={reportType}
                    onValueChange={(v) => setReportType(v as any)}
                  >
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  {reportType !== "all" && (
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger className="w-[100px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {reportType === "month" && (
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {reportType === "week" && (
                    <input
                      type="date"
                      className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportEvents("pdf")}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportEvents("csv")}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Entity Filters */}
            <div className="px-6 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Filter by
                </span>
                {(evtForane !== "All" ||
                  evtSchool !== "All" ||
                  evtRole !== "All") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setEvtForane("All");
                        setEvtSchool("All");
                        setEvtRole("All");
                      }}
                    >
                      Clear all
                    </Button>
                  )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={evtForane} onValueChange={setEvtForane}>
                  <SelectTrigger className="h-9">
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
                <Select value={evtSchool} onValueChange={setEvtSchool}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Schools / Parishes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Schools / Parishes</SelectItem>
                    {filteredSchoolNames.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={evtRole} onValueChange={setEvtRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="school">Sunday School</SelectItem>
                    <SelectItem value="animator">Animator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(evtForane !== "All" ||
                evtSchool !== "All" ||
                evtRole !== "All") && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {evtForane !== "All" && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setEvtForane("All")}
                      >
                        Forane: {evtForane} ✕
                      </Badge>
                    )}
                    {evtSchool !== "All" && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setEvtSchool("All")}
                      >
                        School: {evtSchool} ✕
                      </Badge>
                    )}
                    {evtRole !== "All" && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setEvtRole("All")}
                      >
                        Role: {evtRole} ✕
                      </Badge>
                    )}
                  </div>
                )}
            </div>

            <CardContent className="p-6 space-y-8">
              <div>
                <h4 className="mb-4 font-medium text-sm">Events Over Time</h4>
                <ChartContainer
                  config={eventsChartConfig}
                  className="h-[250px] w-full"
                >
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(v) => v.slice(0, 3)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                      dataKey="events"
                      fill="var(--color-events)"
                      radius={8}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="flex flex-col shadow-none border">
                  <CardHeader className="items-center pb-0">
                    <CardTitle className="text-base font-medium">
                      Category Distribution
                    </CardTitle>
                    <CardDescription>CML vs Suvara</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    <ChartContainer
                      config={categoryChartConfig}
                      className="mx-auto aspect-square max-h-[220px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                          data={categoryData}
                          dataKey="count"
                          nameKey="category"
                          stroke="0"
                        />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      Total {filteredEvents.length} events{" "}
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-muted-foreground">
                      Showing distribution for selected period
                    </div>
                  </CardFooter>
                </Card>
                <Card className="flex flex-col shadow-none border">
                  <CardHeader className="items-center pb-0">
                    <CardTitle className="text-base font-medium">
                      Most Active Schools
                    </CardTitle>
                    <CardDescription>Top 5 by event creation</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    <ChartContainer
                      config={schoolChartConfig}
                      className="mx-auto aspect-square max-h-[220px]"
                    >
                      <RadialBarChart
                        data={schoolActivity}
                        innerRadius={30}
                        outerRadius={100}
                      >
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent hideLabel nameKey="school" />
                          }
                        />
                        <PolarGrid gridType="circle" />
                        <RadialBar dataKey="events" />
                      </RadialBarChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      Top {schoolActivity.length} Active Schools{" "}
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-muted-foreground">
                      Based on current filters
                    </div>
                  </CardFooter>
                </Card>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-6 border-t">
                {[
                  {
                    label: "Total Events",
                    value: filteredEvents.length,
                    color: "text-blue-600",
                  },
                  {
                    label: "Published",
                    value: filteredEvents.filter((e) => e.isPublic).length,
                    color: "text-green-600",
                  },
                  {
                    label: "Active Schools",
                    value: schoolActivity.length,
                    color: "text-blue-600",
                  },
                  {
                    label: "By Sunday School",
                    value: filteredEvents.filter((e) => {
                      const c = users.find(
                        (u) => u.uid === e.creatorId || u.id === e.creatorId,
                      );
                      return c?.role === "school";
                    }).length,
                    color: "text-indigo-600",
                  },
                  {
                    label: "By Animators",
                    value: filteredEvents.filter((e) => {
                      const c = users.find(
                        (u) => u.uid === e.creatorId || u.id === e.creatorId,
                      );
                      return c?.role === "animator";
                    }).length,
                    color: "text-orange-600",
                  },
                  {
                    label: "By Admin",
                    value: filteredEvents.filter((e) => {
                      const c = users.find(
                        (u) => u.uid === e.creatorId || u.id === e.creatorId,
                      );
                      return c?.role === "admin";
                    }).length,
                    color: "text-purple-600",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-gray-600 text-sm mb-1">{label}</p>
                    <p className={`text-3xl font-semibold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SUNDAY SCHOOL ─── */}
        <TabsContent value="sunday-school" className="space-y-4">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={Church}
                title="Sunday School Report"
                description="Export Sunday School member data by forane and parish"
                count={ssCount}
                countLabel="members"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <FilterBar
                foranes={uniqueForanes}
                parishes={dynamicParishes.map((p) => ({ id: p.id, name: p.name, forane: p.forane }))}
                forane={ssForane}
                parishId={ssParish}
                onForaneChange={setSsForane}
                onParishChange={setSsParish}
                onGenerate={handleGenerateSundaySchoolReport}
                generating={generatingSs}
                extraLabel="Export Report"
              />

              <p className="text-xs text-muted-foreground pl-1">
                {ssCount} member(s) will be included in this report.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TEACHERS ─── */}
        <TabsContent value="teachers" className="space-y-4">
          {/* Class-wise Report */}
          <Card>
            <CardHeader>
              <SectionHeader
                icon={BookUser}
                title="Class-wise Teacher Report"
                description="Export teachers grouped by class, filtered by forane, parish, and academic year"
                count={tmClassCount}
                countLabel="teachers"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 rounded-lg border">
                <div className="space-y-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">
                    Forane
                  </Label>
                  <Select
                    value={tmClassForane}
                    onValueChange={(v) => {
                      setTmClassForane(v);
                      setTmClassParish("All");
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All Foranes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Foranes</SelectItem>
                      {uniqueForanes.map(
                        (f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[160px]">
                  <Label className="text-xs text-muted-foreground">
                    Parish
                  </Label>
                  <Select
                    value={tmClassParish}
                    onValueChange={setTmClassParish}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All Parishes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Parishes</SelectItem>
                      {(tmClassForane === "All"
                        ? dynamicParishes
                        : dynamicParishes.filter((p) => p.forane === tmClassForane)
                      ).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[140px]">
                  <Label className="text-xs text-muted-foreground">
                    Academic Year
                  </Label>
                  <Select value={tmClassYear} onValueChange={setTmClassYear}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Years</SelectItem>
                      {uniqueAcademicYears.map((yr) => (
                        <SelectItem key={yr} value={yr}>
                          {yr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[140px]">
                  <Label className="text-xs text-muted-foreground">Class</Label>
                  <Select
                    value={tmClassFilter}
                    onValueChange={setTmClassFilter}
                  >
                    <SelectTrigger className="h-8 text-sm">
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
                <Button
                  size="sm"
                  className="h-8"
                  disabled={generatingTmClass}
                  onClick={handleGenerateTeacherClassReport}
                >
                  {generatingTmClass ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-3 w-3" />
                      Export Report
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pl-1">
                {tmClassCount} teacher(s) will be included in this report
                {tmClassFilter !== "All"
                  ? ` (Class: ${tmClassFilter})`
                  : " across all classes"}
                .
              </p>
              {/* Class breakdown preview */}
              {tmClassBreakdown.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">
                          Class
                        </th>
                        <th className="text-right px-4 py-2 font-medium">
                          Teachers
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tmClassBreakdown.map(({ cls, count }) => (
                        <tr
                          key={cls}
                          className="border-t hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-2">{cls}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant="secondary">{count}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PROGRAMS ─── */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={GraduationCap}
                title="Programs Report"
                description="Export program participation data filtered by program, forane and parish"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg border space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Program</Label>
                  <Select value={pgSelectedProgramId} onValueChange={setPgSelectedProgramId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Programs</SelectItem>
                      {programsList.map((p) => (
                        <SelectItem key={p.id} value={p.id || ""}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FilterBar
                  foranes={uniqueForanes}
                  parishes={dynamicParishes.map((p) => ({ id: p.id, name: p.name, forane: p.forane }))}
                  academicYears={uniqueAcademicYears}
                  forane={pgForane}
                  parishId={pgParish}
                  academicYear={pgYear}
                  onForaneChange={setPgForane}
                  onParishChange={setPgParish}
                  onYearChange={setPgYear}
                  onGenerate={handleGenerateProgramReport}
                  generating={generatingPg}
                  extraLabel="Export Program PDF"
                />
              </div>

              <p className="text-xs text-muted-foreground pl-1">
                {registrations.filter((r) => {
                  const matchProgram = pgSelectedProgramId === "All" || r.programId === pgSelectedProgramId;
                  const schoolInfo = users.find(u => u.uid === r.schoolUserId || u.id === r.schoolUserId);
                  const matchForane = pgForane === "All" ||
                    (schoolInfo?.forane === pgForane) ||
                    (dynamicParishes.find(p => p.id === r.parishUserId)?.forane === pgForane);
                  const matchParish = pgParish === "All" || r.parishUserId === pgParish || r.schoolUserId === pgParish;
                  return matchProgram && matchForane && matchParish;
                }).length} record(s) matched your filters.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ANIMATORS ─── */}
        <TabsContent value="animators" className="space-y-4">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={UserCheck}
                title="Animator Management Report"
                description="Export animator records filtered by forane, parish, and academic year"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <FilterBar
                foranes={uniqueForanes}
                parishes={dynamicParishes.map((p) => ({ id: p.id, name: p.name, forane: p.forane }))}
                academicYears={uniqueAcademicYears}
                forane={amForane}
                parishId={amParish}
                academicYear={amYear}
                onForaneChange={setAmForane}
                onParishChange={setAmParish}
                onYearChange={setAmYear}
                onGenerate={handleGenerateAnimatorReport}
                generating={generatingAm}
                extraLabel="Export Report"
              />
              <p className="text-xs text-muted-foreground pl-1">
                Animator data will be included based on selected filters.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── OBSERVERS ─── */}
        <TabsContent value="observers" className="space-y-4">
          {/* Assignment Report */}
          <Card>
            <CardHeader>
              <SectionHeader
                icon={Eye}
                title="Observer Assignment Report"
                description="Export observer duty assignments filtered by forane, parish, and academic year"
                count={obsAssignCount}
                countLabel="assignments"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <FilterBar
                foranes={uniqueForanes}
                parishes={dynamicParishes.map((p) => ({ id: p.id, name: p.name, forane: p.forane }))}
                academicYears={uniqueAcademicYears}
                forane={obsAssignForane}
                parishId={obsAssignParish}
                academicYear={obsAssignYear}
                onForaneChange={setObsAssignForane}
                onParishChange={setObsAssignParish}
                onYearChange={setObsAssignYear}
                onGenerate={handleGenerateObsAssignReport}
                generating={generatingObsAssign}
                extraLabel="Export Report"
              />
              <p className="text-xs text-muted-foreground pl-1">
                {obsAssignCount} assignment(s) will be included in this report.
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Directory Report */}
          <Card>
            <CardHeader>
              <SectionHeader
                icon={Eye}
                title="Observer Directory Report"
                description="Export the full observer directory filtered by forane, home parish, and academic year"
                count={obsDirCount}
                countLabel="observers"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <FilterBar
                foranes={uniqueForanes}
                parishes={dynamicParishes.map((p) => ({ id: p.id, name: p.name, forane: p.forane }))}
                academicYears={uniqueAcademicYears}
                forane={obsDirForane}
                parishId={obsDirParish}
                academicYear={obsDirYear}
                onForaneChange={setObsDirForane}
                onParishChange={setObsDirParish}
                onYearChange={setObsDirYear}
                onGenerate={handleGenerateObsDirReport}
                generating={generatingObsDir}
                extraLabel="Export Report"
              />
              <p className="text-xs text-muted-foreground pl-1">
                {obsDirCount} observer(s) will be included in this report.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
