import { useState, useEffect } from "react";
import { Plus, Search, Filter, Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  getEvents,
  updateEventStatus,
  EventData,
} from "../../features/events/services/eventService";
import { getUsers, UserData } from "../../features/users/services/userService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAuth } from "../../context/AuthContext";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

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

  // Approvals state
  const [approvalEvents, setApprovalEvents] = useState<EventData[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approvalForaneFilter, setApprovalForaneFilter] = useState("All");

  // Determine active tab from URL
  const activeTab = location.pathname === "/events/approvals" ? "approvals" : "events";

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
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersData = await getUsers();
        setUsers(usersData);

        // Fetch current user's forane
        let userForane: string | null = null;
        if (currentUser) {
          const currentUserData = usersData.find(
            (u) => u.uid === currentUser.uid
          );
          if (currentUserData?.forane) {
            userForane = currentUserData.forane;
          }
        }

        // Fetch events based on user role
        // If admin, fetch all (undefined). If user, fetch only their forane.
        const foraneScope = isAdminUser ? undefined : userForane || undefined;
        const eventsData = await getEvents(undefined, foraneScope);
        const typedEvents = eventsData as EventData[];
        setEvents(typedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, isAdminUser]);

  // Fetch approval events
  useEffect(() => {
    if (!isAdminUser) return;
    const fetchApprovalEvents = async () => {
      try {
        setApprovalLoading(true);
        const foraneToQuery = approvalForaneFilter !== "All" ? approvalForaneFilter : undefined;
        const allEvents = await getEvents(undefined, foraneToQuery);
        const draftEvents = (allEvents as EventData[]).filter(
          (event) => !event.isPublic
        );
        setApprovalEvents(draftEvents);
      } catch (error) {
        console.error("Error fetching draft events:", error);
        toast.error("Failed to load draft events");
      } finally {
        setApprovalLoading(false);
      }
    };
    fetchApprovalEvents();
  }, [approvalForaneFilter, currentUser, isAdminUser]);

  const handleApprovalAction = async (
    eventId: string,
    status: "approved" | "rejected"
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
    const matchesForane =
      foraneFilter === "All" ||
      event.creatorForane === foraneFilter ||
      (event.place &&
        event.place.toLowerCase().includes(foraneFilter.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter !== "All") {
      if (statusFilter === "Draft")
        matchesStatus = !event.isPublic; // Legacy support
      else matchesStatus = event.status === statusFilter;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesForane;
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
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
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
          navigate(value === "approvals" ? "/events/approvals" : "/events", { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="events">All Events</TabsTrigger>
          {isAdminUser && (
            <TabsTrigger value="approvals">
              Approvals
              {approvalEvents.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                  {approvalEvents.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6 mt-4">
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search events..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors"
              >
                <Link to={`/events/${event.id}`} className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
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
                      <h3 className="font-medium text-gray-900 truncate pr-2">
                        {event.title}
                      </h3>
                      <StatusBadge
                        status={
                          event.status ||
                          (event.isPublic ? "approved" : "pending")
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {event.place}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
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
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const creator = users.find((u) => u.id === event.creatorId);
                  const schoolName =
                    event.creatorSchoolName &&
                    event.creatorSchoolName !== "Admin"
                      ? event.creatorSchoolName
                      : creator?.schoolName ||
                        creator?.schoolname ||
                        creator?.fullName ||
                        "Unknown";

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
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
                            <h3 className="font-medium text-gray-900">
                              {event.title}
                            </h3>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
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
                      <TableCell className="text-gray-600">
                        {schoolName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex flex-col">
                          <span>{formatDate(event.timestamp)}</span>
                          {event.updatedAt && (
                            <span className="text-xs text-gray-400">
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
                        <Link
                          to={`/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No events found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Approvals Tab */}
        {isAdminUser && (
          <TabsContent value="approvals" className="space-y-6 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>
                    {approvalEvents.length} event
                    {approvalEvents.length !== 1 ? "s" : ""} waiting for approval
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
                      {approvalEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                              {event.imageUrl ? (
                                <ImageWithFallback
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <h3 className="font-medium text-gray-900 truncate">
                                {event.title}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
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
                                  Reject
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
                            <TableHead>Created By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvalEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                    {event.imageUrl ? (
                                      <ImageWithFallback
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                        No Img
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900">
                                      {event.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
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
                              <TableCell className="text-gray-600">
                                {event.creatorSchoolName}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {event.date
                                  ? new Date(
                                      (event.date as any).seconds
                                        ? (event.date as any).seconds * 1000
                                        : event.date
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link to={`/events/${event.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4 text-gray-500" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() =>
                                      handleApprovalAction(event.id!, "approved")
                                    }
                                    disabled={actionLoading === event.id}
                                    title="Approve"
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
                                      handleApprovalAction(event.id!, "rejected")
                                    }
                                    disabled={actionLoading === event.id}
                                    title="Reject"
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
                          ))}
                          {approvalEvents.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center text-gray-500"
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
      </Tabs>
    </div>
  );
}
