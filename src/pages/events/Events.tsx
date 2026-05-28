import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Download,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  subscribeToEvents,
  updateEventStatus,
  EventData,
} from "../../features/events/services/eventService";
import { getUsers, UserData } from "../../features/users/services/userService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { getUser } from "../../features/users/services/userService";
import { useAuth } from "../../context/AuthContext";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { EventPdfService } from "../../features/events/services/eventPdfService";


export function Events() {
  const { isAdminUser, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [foraneFilter, setForaneFilter] = useState("All");
  const [academicYearFilter, setAcademicYearFilter] = useState("All");
  const [dateFromFilter, setDateFromFilter] = useState("");

  // Approvals state
  const [approvalEvents, setApprovalEvents] = useState<EventData[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approvalForaneFilter, setApprovalForaneFilter] = useState("All");

  // Approved events state
  const [approvedEvents, setApprovedEvents] = useState<EventData[]>([]);
  const [approvedLoading, setApprovedLoading] = useState(true);
  const [approvedForaneFilter, setApprovedForaneFilter] = useState("All");
  const [approvedSearchTerm, setApprovedSearchTerm] = useState("");

  // Private events state
  const [privateEvents, setPrivateEvents] = useState<EventData[]>([]);
  const [privateLoading, setPrivateLoading] = useState(true);
  const [privateForaneFilter, setPrivateForaneFilter] = useState("All");
  const [privateSearchTerm, setPrivateSearchTerm] = useState("");
  const [downloadingEventId, setDownloadingEventId] = useState<string | null>(null);

  // Determine active tab from URL
  const activeTab =
    location.pathname === "/events/approvals"
      ? "pending-review"
      : location.pathname === "/events/approved"
        ? "public"
        : location.pathname === "/events/private"
          ? "private"
          : "events";

  // Hardcoded forane names
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
    const init = async () => {
      try {
        setLoading(true);
        const usersData = await getUsers();
        setUsers(usersData);

        // Fetch current user's forane
        let userForane: string | null = null;
        if (currentUser) {
          const currentUserData = usersData.find(
            (u) => u.uid === currentUser.uid,
          );
          if (currentUserData?.forane) {
            userForane = currentUserData.forane;
          }
        }

        // Subscribe to events based on user role
        const foraneScope = isAdminUser ? undefined : userForane || undefined;
        const unsubscribe = subscribeToEvents(
          (eventsData) => {
            setEvents(eventsData);
            setLoading(false);
          },
          undefined,
          foraneScope,
        );

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
        return undefined;
      }
    };

    let unsubscribe: (() => void) | undefined;
    init().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, isAdminUser]);

  // Subscribe to approval events (real-time)
  useEffect(() => {
    if (!isAdminUser) return;
    setApprovalLoading(true);
    const unsubscribe = subscribeToEvents(
      (allEvents) => {
        const draftEvents = allEvents.filter(
          (event) => event.status === "pending" || (!event.status && !event.isPublic)
        );
        setApprovalEvents(draftEvents);
        setApprovalLoading(false);
      },
      undefined,
      undefined,
    );

    return () => unsubscribe();
  }, [currentUser, isAdminUser]);

  // Subscribe to approved events (real-time)
  useEffect(() => {
    setApprovedLoading(true);
    const unsubscribe = subscribeToEvents(
      (allEvents) => {
        const approved = allEvents.filter(
          (event) => event.status === "approved",
        );
        setApprovedEvents(approved);
        setApprovedLoading(false);
      },
      "approved",
      undefined,
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to private events (real-time)
  useEffect(() => {
    if (!isAdminUser) return;
    setPrivateLoading(true);
    const unsubscribe = subscribeToEvents(
      (allEvents) => {
        const privates = allEvents.filter(
          (event) => event.status === "rejected",
        );
        setPrivateEvents(privates);
        setPrivateLoading(false);
      },
      "rejected",
      undefined,
    );

    return () => unsubscribe();
  }, [isAdminUser]);

  const handleApprovalAction = async (
    eventId: string,
    status: "approved" | "rejected",
  ) => {
    if (!eventId) return;
    setActionLoading(eventId);
    try {
      await updateEventStatus(eventId, status);
      toast.success(`Event ${status} successfully`);
      setApprovalEvents(approvalEvents.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error(`Error marking event as ${status}:`, error);
      toast.error(`Failed to ${status} event`);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper: normalize event date to a JS Date object
  const toDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date?.seconds) return new Date(date.seconds * 1000);
    return null;
  };

  // Helper: derive academic year from event date (June-May cycle)
  const getAcademicYear = (date: Date): string => {
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    if (month >= 6) return `${year}-${year + 1}`;
    return `${year - 1}-${year}`;
  };

  const handleDownloadEvent = async (event: EventData) => {
    if (!event.id) return;
    setDownloadingEventId(event.id);
    try {
      await EventPdfService.generateEventPdf(event);
      toast.success("Event report downloaded");
    } catch (error) {
      console.error("Error downloading event PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingEventId(null);
    }
  };

  // Generate PDF report for filtered events
  const handleGenerateEventReport = async () => {
    if (filteredEvents.length === 0) {
      toast.warning("No events match the selected filters. Please adjust filters before generating a report.");
      return;
    }
    toast.loading("Building beautiful events report...", { id: "ev-pdf" });
    try {
      // Load SUVARA logo as base64
      let logoHtml = '';
      try {
        const resp = await fetch('/assets/app_logo.png');
        const blob = await resp.blob();
        const base64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
        });
        logoHtml = `<img src="${base64}" style="width:70px;height:70px;object-fit:contain;border-radius:8px;" alt="Logo" />`;
      } catch { logoHtml = ''; }

      // Helper: convert event date to formatted string
      const fmtDate = (date: any): string => {
        if (!date) return 'N/A';
        const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      };

      const statusColor = (s?: string) => {
        if (s === 'approved') return { bg: '#dcfce7', text: '#166534', label: 'Approved' };
        if (s === 'rejected') return { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' };
        return { bg: '#fef9c3', text: '#854d0e', label: 'Pending' };
      };

      const categoryColor = (c?: string) => {
        if (c === 'cml') return { bg: '#ede9fe', text: '#5b21b6', label: 'CML' };
        return { bg: '#dbeafe', text: '#1e40af', label: 'Suvara' };
      };

      const activeFilters = [
        academicYearFilter !== 'All' ? `Year: ${academicYearFilter}` : '',
        categoryFilter !== 'All' ? `Category: ${categoryFilter.toUpperCase()}` : '',
        statusFilter !== 'All' ? `Status: ${statusFilter}` : '',
        foraneFilter !== 'All' ? `Forane: ${foraneFilter}` : '',
        dateFromFilter ? `From: ${dateFromFilter}` : '',
      ].filter(Boolean);

      // Pre-fetch actual creator details to avoid "Admin" or "N/A"
      const eventsWithResolvedCreators = await Promise.all(
        filteredEvents.map(async (event) => {
          let resolvedSchool = (event as any).creatorSchoolName || 'N/A';
          let resolvedForane = (event as any).creatorForane || (event as any).forane || 'N/A';

          if (event.creatorId) {
            try {
              const user = await getUser(event.creatorId);
              if (user) {
                // Prioritize authentic DB data over stale/cached event metadata
                resolvedSchool =
                  event.lastEditedByName ||
                  (event as any).creatorSchoolName ||
                  user.schoolName || user.schoolname || user.fullName || resolvedSchool;
                resolvedForane = user.forane || resolvedForane;
              }
            } catch (err) {
              console.warn("Could not fetch user for consolidated report", err);
            }
          }

          return {
            ...event,
            resolvedSchool,
            resolvedForane
          };
        })
      );

      // Build event cards HTML - Text Focused, Premium Layout
      const eventCardsHtml = eventsWithResolvedCreators.map((event, i) => {
        const sc = statusColor(event.status || (event.isPublic ? 'approved' : 'pending'));
        const cc = categoryColor(event.category);

        return `
          <div style="background:#fff;border-radius:12px;overflow:hidden;margin-bottom:20px;padding:24px;border:1px solid #e5e7eb;page-break-inside:avoid;box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#f3f4f6;color:#4b5563;border-radius:50%;font-size:12px;font-weight:700;">${i + 1}</span>
                <h3 style="margin:0;font-size:18px;font-weight:700;color:#111827;">${event.title}</h3>
              </div>
              <div style="display:flex;gap:8px;">
                <span style="background:${cc.bg};color:${cc.text};padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${cc.label}</span>
                <span style="background:${sc.bg};color:${sc.text};padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${sc.label}</span>
              </div>
            </div>
            
            ${event.description ? `<p style="margin:0 0 20px 0;font-size:13px;color:#374151;line-height:1.6;">${event.description}</p>` : ''}
            
            <div style="display:grid;grid-template-columns: 1fr 1fr;gap:16px;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #f3f4f6;">
              <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#6b7280;">
                <span style="font-size:14px;">📍</span>
                <span><strong>Place:</strong> ${event.place || 'N/A'}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#6b7280;">
                <span style="font-size:14px;">📅</span>
                <span><strong>Date:</strong> ${fmtDate(event.date)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#6b7280;">
                <span style="font-size:14px;">🏫</span>
                <span><strong>School:</strong> ${(event as any).resolvedSchool || 'N/A'}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#6b7280;">
                <span style="font-size:14px;">🗺️</span>
                <span><strong>Forane:</strong> ${(event as any).resolvedForane || 'N/A'}</span>
              </div>
            </div>
          </div>`;
      }).join('');

      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const filterBadges = activeFilters.map(f =>
        `<span style="background:rgba(255,255,255,0.1);padding:4px 14px;border-radius:6px;font-size:11px;border: 1px solid rgba(255,255,255,0.2);font-weight:500;">${f}</span>`
      ).join('');

      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #fff; color: #111827; }
  .header { background: #1e3a8a; color: white; padding: 48px 50px; }
  .header-top { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
  .org-title { font-size: 32px; font-weight: 800; letter-spacing: 1px; }
  .org-sub { font-size: 11px; opacity: 0.8; margin-top: 4px; letter-spacing: 1px; font-weight: 600; }
  .report-name { font-size: 16px; font-weight: 500; opacity: 0.9; margin-top: 12px; }
  .filters-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
  .summary-bar { background: #f8fafc; padding: 24px 50px; border-bottom: 1px solid #e2e8f0; display: flex; gap: 48px; }
  .stat { text-align: left; }
  .stat-num { font-size: 28px; font-weight: 800; color: #1e3a8a; }
  .stat-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .content { padding: 40px 50px; }
  .footer { padding: 32px 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; margin-top: 40px; }
</style>
</head><body>

<div class="header">
  <div class="header-top">
    ${logoHtml}
    <div>
      <div class="org-title">SUVARA</div>
      <div class="org-sub">CENTRE FOR CATECHESIS, EPARCHY OF KANJIRAPALLY</div>
      <div class="report-name">Events Document Report &mdash; ${today}</div>
    </div>
  </div>
  ${filterBadges ? `<div class="filters-row">${filterBadges}</div>` : ''}
</div>

<div class="summary-bar">
  <div class="stat">
    <div class="stat-num">${filteredEvents.length}</div>
    <div class="stat-label">Total Volume</div>
  </div>
  <div class="stat">
    <div class="stat-num">${filteredEvents.filter(e => e.status === 'approved').length}</div>
    <div class="stat-label">Approved</div>
  </div>
  <div class="stat">
    <div class="stat-num">${filteredEvents.filter(e => !e.status || e.status === 'pending').length}</div>
    <div class="stat-label">Pending Review</div>
  </div>
  <div class="stat">
    <div class="stat-num">${filteredEvents.filter(e => e.category === 'cml').length}</div>
    <div class="stat-label">CML Events</div>
  </div>
  <div class="stat">
    <div class="stat-num">${filteredEvents.filter(e => e.category === 'suvara').length}</div>
    <div class="stat-label">Suvara Phase</div>
  </div>
</div>

<div class="content">
  ${eventCardsHtml}
</div>

<div class="footer">
  This is an official document generated by the SUVARA Administrative Interface <br/> ${today} &bull; ${filteredEvents.length} distinct events logged
</div>

</body></html>`;

      // Create hidden container div
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1000px'; // Wider for better horizontal spacing
      container.style.backgroundColor = '#fff';

      // We only need the inner content for DIV injection
      const bodyContent = htmlContent.match(/<body>([\s\S]*)<\/body>/)?.[1] || htmlContent;
      const styleContent = htmlContent.match(/<style>([\s\S]*)<\/style>/)?.[0] || '';

      container.innerHTML = `${styleContent}${bodyContent}`;
      document.body.appendChild(container);

      try {
        toast.loading("Rendering high-quality document...", { id: "ev-pdf" });
        await new Promise(r => setTimeout(r, 800)); // Layout is simpler now, shorter wait

        toast.loading("Generating vector-grade PDF...", { id: "ev-pdf" });
        const canvas = await html2canvas(container, {
          scale: 3, // Increased scale for sharp text and fine lines
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 1000,
          windowWidth: 1000,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfH = (imgProps.height * pdfW) / imgProps.width;
        let leftH = pdfH;
        let pos = 0;

        pdf.addImage(imgData, 'PNG', 0, pos, pdfW, pdfH);
        leftH -= pageH;

        while (leftH > 0) {
          pos = leftH - pdfH;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, pos, pdfW, pdfH);
          leftH -= pageH;
        }

        const dateStr = new Date().toISOString().split('T')[0];
        pdf.save(`suvara_events_report_${dateStr}.pdf`);
        toast.success(`Events report generated — ${filteredEvents.length} event(s)`, { id: "ev-pdf" });
      } finally {
        document.body.removeChild(container);
      }
    } catch (error: any) {
      console.error("Error generating events PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`, { id: "ev-pdf" });
    }
  };

  // Derived academic years available from events
  const availableAcademicYears = Array.from(
    new Set(
      events.map((e) => {
        const d = toDate(e.date);
        return d ? getAcademicYear(d) : null;
      }).filter(Boolean),
    ),
  ).sort() as string[];

  const getEventForane = (event: EventData) => {
    const creator = users.find((u) => u.uid === event.creatorId || u.id === event.creatorId);
    return creator?.forane || event.creatorForane || (event as any).forane || "";
  };

  const filteredEvents = events.filter((event) => {
    // Visibility Check
    if (!isAdminUser) {
      const isCreator = currentUser && event.creatorId === currentUser.uid;
      const isRejected = event.status === "rejected";
      const isApproved =
        event.status === "approved" || (event.isPublic && !event.status);

      if (!isCreator && (!isApproved || isRejected)) return false;
    }

    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" ||
      event.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesForane = foraneFilter === "All" || getEventForane(event) === foraneFilter;

    let matchesStatus = true;
    if (statusFilter !== "All") {
      if (statusFilter === "Draft")
        matchesStatus = !event.isPublic; // Legacy support
      else matchesStatus = event.status === statusFilter;
    }

    // Academic year filter
    let matchesAcademicYear = true;
    if (academicYearFilter !== "All") {
      const d = toDate(event.date);
      matchesAcademicYear = d ? getAcademicYear(d) === academicYearFilter : false;
    }

    // Date from filter
    let matchesDateFrom = true;
    if (dateFromFilter) {
      const d = toDate(event.date);
      matchesDateFrom = d ? d >= new Date(dateFromFilter) : false;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesForane && matchesAcademicYear && matchesDateFrom;
  });

  const filteredApprovedEvents = approvedEvents.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(approvedSearchTerm.toLowerCase());
    const matchesForane = approvedForaneFilter === "All" || getEventForane(event) === approvedForaneFilter;
    return matchesSearch && matchesForane;
  });

  const filteredPrivateEvents = privateEvents.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(privateSearchTerm.toLowerCase());
    const matchesForane = privateForaneFilter === "All" || getEventForane(event) === privateForaneFilter;
    return matchesSearch && matchesForane;
  });

  const filteredApprovalEvents = approvalEvents.filter((event) => {
    const matchesForane = approvalForaneFilter === "All" || getEventForane(event) === approvalForaneFilter;
    return matchesForane;
  });

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    try {
      // Handle Firestore Timestamp
      if (date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString();
      }
      // Handle Date object or string
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Invalid Date";
      return d.toLocaleDateString();
    } catch (e) {
      return "Error";
    }
  };

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
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <Link to="/events/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "pending-review")
            navigate("/events/approvals", { replace: true });
          else if (value === "public")
            navigate("/events/approved", { replace: true });
          else if (value === "private")
            navigate("/events/private", { replace: true });
          else navigate("/events", { replace: true });
        }}
      >
        <TabsList>
          {isAdminUser && (
            <TabsTrigger value="pending-review">
              Pending Review
              {approvalEvents.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 px-1.5 text-[10px]"
                >
                  {approvalEvents.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="events">All Events</TabsTrigger>
          <TabsTrigger value="public">
            Public Events
            {approvedEvents.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 px-1.5 text-[10px] bg-green-100 text-green-700"
              >
                {approvedEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          {isAdminUser && (
            <TabsTrigger value="private">
              Private Events
              {privateEvents.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 px-1.5 text-[10px] bg-red-100 text-red-700"
                >
                  {privateEvents.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search events..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      <option value="cml">CML</option>
                      <option value="suvara">Suvara</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Status</option>
                      <option value="pending">Draft / Pending</option>
                      <option value="approved">Public</option>
                      <option value="rejected">Private</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={foraneFilter}
                      onChange={(e) => setForaneFilter(e.target.value)}
                    >
                      <option value="All">All Foranes</option>
                      {foraneNames.map((forane) => (
                        <option key={forane} value={forane}>
                          {forane}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Enhanced Report Filters */}
              <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-border">
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <Label className="text-xs text-muted-foreground">Academic Year</Label>
                  <select
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={academicYearFilter}
                    onChange={(e) => setAcademicYearFilter(e.target.value)}
                  >
                    <option value="All">All Years</option>
                    {availableAcademicYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">From Date</Label>
                  <Input
                    type="date"
                    className="w-40"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>

                {isAdminUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateEventReport}
                    className="ml-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF ({filteredEvents.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="md:hidden">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <Link to={`/events/${event.id}`} className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                        {event.imageUrl ? (
                          <ImageWithFallback
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src="/assets/Logo-Bg-Light.svg"
                            alt="Placeholder"
                            className="w-full h-full object-cover opacity-80"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-foreground truncate pr-2">
                            {event.title}
                          </h3>
                          <StatusBadge
                            status={
                              event.status ||
                              (event.isPublic ? "approved" : "pending")
                            }
                          />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {event.place}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-1.5 uppercase"
                          >
                            {event.category}
                          </Badge>
                          <span>•</span>
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-4 flex justify-end px-4 pb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownloadEvent(event);
                        }}
                        disabled={downloadingEventId === event.id}
                      >
                        {downloadingEventId === event.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Download PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Event Details</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last Edited By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => {
                      const creator = users.find(
                        (u) => u.id === event.creatorId,
                      );
                      const schoolName =
                        event.lastEditedByName ||
                        (event as any).creatorSchoolName ||
                        creator?.schoolName ||
                        creator?.schoolname ||
                        creator?.fullName ||
                        "Unknown";

                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden">
                                {event.imageUrl ? (
                                  <ImageWithFallback
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src="/assets/Logo-Bg-Light.svg"
                                    alt="Placeholder"
                                    className="w-full h-full object-cover opacity-80"
                                  />
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">
                                  {event.title}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {event.place}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="uppercase">
                              {event.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {schoolName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex flex-col">
                              <span>{formatDate(event.timestamp)}</span>
                              {event.updatedAt && (
                                <span className="text-xs text-muted-foreground">
                                  Updated: {formatDate(event.updatedAt)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={
                                event.status ||
                                (event.isPublic ? "approved" : "pending")
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/events/${event.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                              >
                                View
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => handleDownloadEvent(event)}
                                disabled={downloadingEventId === event.id}
                              >
                                {downloadingEventId === event.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredEvents.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No events found matching your filters.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Events Tab */}
        <TabsContent value="public" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Approved Events</CardTitle>
                <CardDescription>
                  {filteredApprovedEvents.length} of {approvedEvents.length}{" "}
                  approved event{approvedEvents.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search approved..."
                    className="pl-9"
                    value={approvedSearchTerm}
                    onChange={(e) => setApprovedSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative min-w-[160px]">
                  <select
                    className="w-full pl-3 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={approvedForaneFilter}
                    onChange={(e) => setApprovedForaneFilter(e.target.value)}
                  >
                    <option value="All">All Foranes</option>
                    {foraneNames.map((forane) => (
                      <option key={forane} value={forane}>
                        {forane}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {approvedLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="md:hidden">
                    {filteredApprovedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <Link to={`/events/${event.id}`} className="flex gap-4">
                          <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                            {event.imageUrl ? (
                              <ImageWithFallback
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src="/assets/Logo-Bg-Light.svg"
                                alt="Placeholder"
                                className="w-full h-full object-cover opacity-80"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-foreground truncate pr-2">
                                {event.title}
                              </h3>
                              <Badge className="bg-green-100 text-green-700 shrink-0">
                                Approved
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {event.place}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5 uppercase"
                              >
                                {event.category}
                              </Badge>
                              <span>•</span>
                              <span>{formatDate(event.timestamp)}</span>
                              {event.creatorForane && (
                                <>
                                  <span>•</span>
                                  <span>{event.creatorForane}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">
                            Event Details
                          </TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Last Edited By</TableHead>
                          <TableHead>Forane</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApprovedEvents.map((event) => {
                          const creator = users.find(
                            (u) => u.id === event.creatorId,
                          );
                          const schoolName =
                            event.lastEditedByName ||
                            (event as any).creatorSchoolName ||
                            creator?.schoolName ||
                            creator?.schoolname ||
                            creator?.fullName ||
                            "Unknown";

                          return (
                            <TableRow key={event.id}>
                              <TableCell>
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden">
                                    {event.imageUrl ? (
                                      <ImageWithFallback
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <img
                                        src="/assets/Logo-Bg-Light.svg"
                                        alt="Placeholder"
                                        className="w-full h-full object-cover opacity-80"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-foreground">
                                      {event.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                      {event.place}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="uppercase"
                                >
                                  {event.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {schoolName}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {creator?.forane || event.creatorForane || (event as any).forane || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                <div className="flex flex-col">
                                  <span>{formatDate(event.timestamp)}</span>
                                  {event.updatedAt && (
                                    <span className="text-xs text-muted-foreground">
                                      Updated: {formatDate(event.updatedAt)}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    to={`/events/${event.id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                                  >
                                    View
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => handleDownloadEvent(event)}
                                    disabled={downloadingEventId === event.id}
                                  >
                                    {downloadingEventId === event.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredApprovedEvents.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="h-24 text-center text-muted-foreground"
                            >
                              No approved events found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        {isAdminUser && (
          <TabsContent value="pending-review" className="space-y-6 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>
                    {filteredApprovalEvents.length} event
                    {filteredApprovalEvents.length !== 1 ? "s" : ""} waiting for
                    approval
                  </CardDescription>
                </div>
                <div className="relative min-w-[160px]">
                  <select
                    className="w-full pl-3 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={approvalForaneFilter}
                    onChange={(e) => setApprovalForaneFilter(e.target.value)}
                  >
                    <option value="All">All Foranes</option>
                    {foraneNames.map((forane) => (
                      <option key={forane} value={forane}>
                        {forane}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {approvalLoading ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <>
                    {/* Mobile View */}
                    <div className="md:hidden">
                      {filteredApprovalEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                              {event.imageUrl ? (
                                <ImageWithFallback
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <h3 className="font-medium text-foreground truncate">
                                {event.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {event.place}
                              </p>
                              <div className="flex items-center gap-2">
                                <Link to={`/events/${event.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4 mr-1" /> View
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() =>
                                    handleApprovalAction(event.id!, "approved")
                                  }
                                  disabled={actionLoading === event.id}
                                >
                                  {actionLoading === event.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleApprovalAction(event.id!, "rejected")
                                  }
                                  disabled={actionLoading === event.id}
                                >
                                  {actionLoading === event.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4 mr-1" />
                                  )}
                                  Private
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[300px]">
                              Event Details
                            </TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Last Edited By</TableHead>
                            <TableHead>Forane</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApprovalEvents.map((event) => {
                            const creator = users.find(
                              (u) => u.id === event.creatorId,
                            );
                            const schoolName =
                              event.lastEditedByName ||
                              (event as any).creatorSchoolName ||
                              creator?.schoolName ||
                              creator?.schoolname ||
                              creator?.fullName ||
                              "Unknown";

                            return (
                              <TableRow key={event.id}>
                                <TableCell>
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                                      {event.imageUrl ? (
                                        <ImageWithFallback
                                          src={event.imageUrl}
                                          alt={event.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                          No Img
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-foreground">
                                        {event.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {event.place}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="uppercase"
                                  >
                                    {event.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {schoolName}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {creator?.forane || event.creatorForane || (event as any).forane || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDate(event.timestamp)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link to={`/events/${event.id}`}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="View Details"
                                      >
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() =>
                                        handleApprovalAction(
                                          event.id!,
                                          "approved",
                                        )
                                      }
                                      disabled={actionLoading === event.id}
                                      title="Publish"
                                    >
                                      {actionLoading === event.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() =>
                                        handleApprovalAction(
                                          event.id!,
                                          "rejected",
                                        )
                                      }
                                      disabled={actionLoading === event.id}
                                      title="Make Private"
                                    >
                                      {actionLoading === event.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredApprovalEvents.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No pending events found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Private Events Tab */}
        {isAdminUser && (
          <TabsContent value="private" className="space-y-6 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Private Events</CardTitle>
                  <CardDescription>
                    {filteredPrivateEvents.length} of {privateEvents.length}{" "}
                    private event{privateEvents.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search private..."
                      className="pl-9"
                      value={privateSearchTerm}
                      onChange={(e) => setPrivateSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative min-w-[160px]">
                    <select
                      className="w-full pl-3 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={privateForaneFilter}
                      onChange={(e) => setPrivateForaneFilter(e.target.value)}
                    >
                      <option value="All">All Foranes</option>
                      {foraneNames.map((forane) => (
                        <option key={forane} value={forane}>
                          {forane}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {privateLoading ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <>
                    {/* Mobile View */}
                    <div className="md:hidden">
                      {filteredPrivateEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <Link to={`/events/${event.id}`} className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                              {event.imageUrl ? (
                                <ImageWithFallback
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src="/assets/Logo-Bg-Light.svg"
                                  alt="Placeholder"
                                  className="w-full h-full object-cover opacity-80"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-foreground truncate pr-2">
                                  {event.title}
                                </h3>
                                <Badge className="bg-red-100 text-red-700 shrink-0">
                                  Private
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {event.place}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-5 px-1.5 uppercase"
                                >
                                  {event.category}
                                </Badge>
                                <span>•</span>
                                <span>{formatDate(event.timestamp)}</span>
                                {event.creatorForane && (
                                  <>
                                    <span>•</span>
                                    <span>{event.creatorForane}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[300px]">
                              Event Details
                            </TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Last Edited By</TableHead>
                            <TableHead>Forane</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPrivateEvents.map((event) => {
                            const creator = users.find(
                              (u) => u.id === event.creatorId,
                            );
                            const schoolName =
                              event.lastEditedByName ||
                              (event as any).creatorSchoolName ||
                              creator?.schoolName ||
                              creator?.schoolname ||
                              creator?.fullName ||
                              "Unknown";

                            return (
                              <TableRow key={event.id}>
                                <TableCell>
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden">
                                      {event.imageUrl ? (
                                        <ImageWithFallback
                                          src={event.imageUrl}
                                          alt={event.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <img
                                          src="/assets/Logo-Bg-Light.svg"
                                          alt="Placeholder"
                                          className="w-full h-full object-cover opacity-80"
                                        />
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-foreground">
                                        {event.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {event.place}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="uppercase"
                                  >
                                    {event.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {schoolName}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {creator?.forane || event.creatorForane || (event as any).forane || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  <div className="flex flex-col">
                                    <span>{formatDate(event.timestamp)}</span>
                                    {event.updatedAt && (
                                      <span className="text-xs text-muted-foreground">
                                        Updated: {formatDate(event.updatedAt)}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Link
                                      to={`/events/${event.id}`}
                                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                                    >
                                      View
                                    </Link>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                      onClick={() => handleDownloadEvent(event)}
                                      disabled={downloadingEventId === event.id}
                                    >
                                      {downloadingEventId === event.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Download className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredPrivateEvents.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No private events found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
