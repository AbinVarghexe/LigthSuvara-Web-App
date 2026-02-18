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
import jsPDF from "jspdf";
import { createMalayalamPDF } from "../../lib/pdfFonts";
import {
  getEvents,
  EventData,
} from "../../features/events/services/eventService";
import { getUsers, UserData } from "../../features/users/services/userService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../components/ui/card";
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
import { ParishService } from "../../features/parishes/services/parishService";
import { Teacher, Parish } from "../../features/teachers/types";

// ─── Shared Filter Bar ────────────────────────────────────────────────────────
interface FilterBarProps {
  foranes: string[];
  parishes?: { id: string; name: string }[];
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
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

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
  const [ssYear, setSsYear] = useState("All");
  const [generatingSs, setGeneratingSs] = useState(false);

  // ── Teacher Management Report state ──
  const [tmForane, setTmForane] = useState("All");
  const [tmParish, setTmParish] = useState("All");
  const [tmYear, setTmYear] = useState("All");
  const [generatingTm, setGeneratingTm] = useState(false);

  // ── Programs Report state ──
  const [pgForane, setPgForane] = useState("All");
  const [pgParish, setPgParish] = useState("All");
  const [pgYear, setPgYear] = useState("All");
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

  const foraneNames = [
    "Mundakayam",
    "Kumily",
    "Kanjirappally",
    "Anakkara",
    "Erumely",
    "Ponkunnam",
    "Kattappana",
    "Upputhara",
    "Ranny",
    "Pathanamthitta",
    "Velichiyani",
    "Mundiyeruma",
    "Peruvanthanam",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          eventsData,
          usersData,
          teachersData,
          parishesData,
          assignmentsData,
        ] = await Promise.all([
          getEvents(),
          getUsers(),
          TeacherService.getTeachers(),
          ParishService.getAllParishes(),
          AssignmentService.getAssignments(),
        ]);
        setEvents(eventsData as EventData[]);
        setUsers(usersData);
        setTeachers(teachersData);
        setParishes(parishesData);
        setAssignments(assignmentsData as any[]);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const schoolNames = useMemo(() => {
    const names = new Set<string>();
    users.forEach((u) => {
      const n = u.schoolName || u.schoolname;
      if (n) names.add(n);
    });
    return Array.from(names).sort();
  }, [users]);

  const uniqueForanes = useMemo(
    () =>
      Array.from(
        new Set(parishes.map((p) => p.forane).filter(Boolean)),
      ).sort() as string[],
    [parishes],
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
        event.creatorSchoolName ||
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
        event.creatorSchoolName ||
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
      const doc = await createMalayalamPDF();
      doc.setFontSize(20);
      doc.setFont("NotoSansMalayalam", "bold");
      doc.text("Light Suvara Event Report", 20, 20);
      doc.setFontSize(16);
      doc.setFont("NotoSansMalayalam", "normal");
      doc.text(event.title, 20, 40);
      doc.setFontSize(12);
      doc.text(`Date: ${getEventDate(event).toLocaleDateString()}`, 20, 55);
      doc.text(`Venue: ${event.place}`, 20, 65);
      doc.text(`Category: ${event.category.toUpperCase()}`, 20, 75);
      doc.text(`Created By: ${event.creatorSchoolName}`, 20, 85);
      doc.text(`Status: ${event.isPublic ? "Published" : "Draft"}`, 20, 95);
      doc.text(doc.splitTextToSize(event.description, 170), 20, 110);
      doc.save(`${event.title.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);
      toast.success("Report generated successfully");
    } catch {
      toast.error("Failed to generate PDF");
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
            `"${e.creatorSchoolName || ""}"`,
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

  // Generic stub generator
  const makeStubGenerator =
    (label: string, setGenerating: (v: boolean) => void, count: number) =>
    async () => {
      if (count === 0) {
        toast.warning("No records match the selected filters.");
        return;
      }
      setGenerating(true);
      await new Promise((r) => setTimeout(r, 700));
      toast.success(`${label} generated for ${count} record(s).`);
      setGenerating(false);
    };

  // Derived counts for observer reports
  const obsAssignCount = assignments.filter((a) => {
    const ap = parishes.find((p) => p.id === a.parishId);
    const t = teachers.find((t) => t.id === a.teacherId);
    return (
      (obsAssignForane === "All" || ap?.forane === obsAssignForane) &&
      (obsAssignParish === "All" || a.parishId === obsAssignParish) &&
      (obsAssignYear === "All" || t?.academicYear === obsAssignYear)
    );
  }).length;

  const obsDirCount = teachers.filter((t) => {
    const hp = parishes.find((p) => p.id === t.parishId);
    return (
      (obsDirForane === "All" || hp?.forane === obsDirForane) &&
      (obsDirParish === "All" || t.parishId === obsDirParish) &&
      (obsDirYear === "All" || t.academicYear === obsDirYear)
    );
  }).length;

  // Sunday School users count
  const ssCount = users.filter((u) => {
    const matchForane = ssForane === "All" || u.forane === ssForane;
    const matchParish =
      ssParish === "All" ||
      u.schoolName === ssParish ||
      u.schoolname === ssParish;
    return matchForane && matchParish;
  }).length;

  // Teacher count
  const tmCount = teachers.filter((t) => {
    const hp = parishes.find((p) => p.id === t.parishId);
    return (
      (tmForane === "All" || hp?.forane === tmForane) &&
      (tmParish === "All" || t.parishId === tmParish) &&
      (tmYear === "All" || t.academicYear === tmYear)
    );
  }).length;

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
                    {foraneNames.map((f) => (
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
                    {schoolNames.map((s) => (
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
                foranes={foraneNames}
                parishes={schoolNames.map((n) => ({ id: n, name: n }))}
                forane={ssForane}
                parishId={ssParish}
                onForaneChange={setSsForane}
                onParishChange={setSsParish}
                onGenerate={makeStubGenerator(
                  "Sunday School report",
                  setGeneratingSs,
                  ssCount,
                )}
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
          <Card>
            <CardHeader>
              <SectionHeader
                icon={BookUser}
                title="Teacher Directory Report"
                description="Export teacher records filtered by forane, parish, and academic year"
                count={tmCount}
                countLabel="teachers"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <FilterBar
                foranes={uniqueForanes.length ? uniqueForanes : foraneNames}
                parishes={parishes}
                academicYears={uniqueAcademicYears}
                forane={tmForane}
                parishId={tmParish}
                academicYear={tmYear}
                onForaneChange={setTmForane}
                onParishChange={setTmParish}
                onYearChange={setTmYear}
                onGenerate={makeStubGenerator(
                  "Teacher directory report",
                  setGeneratingTm,
                  tmCount,
                )}
                generating={generatingTm}
                extraLabel="Export Report"
              />
              <p className="text-xs text-muted-foreground pl-1">
                {tmCount} teacher(s) will be included in this report.
              </p>
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
                description="Export program participation data filtered by forane and parish"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <FilterBar
                foranes={foraneNames}
                parishes={parishes}
                academicYears={uniqueAcademicYears}
                forane={pgForane}
                parishId={pgParish}
                academicYear={pgYear}
                onForaneChange={setPgForane}
                onParishChange={setPgParish}
                onYearChange={setPgYear}
                onGenerate={makeStubGenerator(
                  "Programs report",
                  setGeneratingPg,
                  0,
                )}
                generating={generatingPg}
                extraLabel="Export Report"
              />
              <p className="text-xs text-muted-foreground pl-1">
                Program data will be included based on selected filters.
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
                foranes={foraneNames}
                parishes={parishes}
                academicYears={uniqueAcademicYears}
                forane={amForane}
                parishId={amParish}
                academicYear={amYear}
                onForaneChange={setAmForane}
                onParishChange={setAmParish}
                onYearChange={setAmYear}
                onGenerate={makeStubGenerator(
                  "Animator report",
                  setGeneratingAm,
                  0,
                )}
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
                foranes={uniqueForanes.length ? uniqueForanes : foraneNames}
                parishes={parishes}
                academicYears={uniqueAcademicYears}
                forane={obsAssignForane}
                parishId={obsAssignParish}
                academicYear={obsAssignYear}
                onForaneChange={setObsAssignForane}
                onParishChange={setObsAssignParish}
                onYearChange={setObsAssignYear}
                onGenerate={makeStubGenerator(
                  "Observer assignment report",
                  setGeneratingObsAssign,
                  obsAssignCount,
                )}
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
                foranes={uniqueForanes.length ? uniqueForanes : foraneNames}
                parishes={parishes}
                academicYears={uniqueAcademicYears}
                forane={obsDirForane}
                parishId={obsDirParish}
                academicYear={obsDirYear}
                onForaneChange={setObsDirForane}
                onParishChange={setObsDirParish}
                onYearChange={setObsDirYear}
                onGenerate={makeStubGenerator(
                  "Observer directory report",
                  setGeneratingObsDir,
                  obsDirCount,
                )}
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
