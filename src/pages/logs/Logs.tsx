import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { getUserLogs, UserLog } from "../../features/logs/services/logService";
import { Activity, Loader2, Search, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export function Logs() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getUserLogs();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "MMM d, yyyy h:mm a");
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setSelectedDevice("all");
    setSelectedAction("all");
    setCurrentPage(1);
  };

  // Filtering Logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      (log.userEmail && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      selectedRole === "all" ||
      (log.role && log.role.toLowerCase() === selectedRole.toLowerCase());

    const matchesDevice =
      selectedDevice === "all" ||
      (log.device && log.device.toLowerCase() === selectedDevice.toLowerCase());

    const matchesAction =
      selectedAction === "all" ||
      (log.action && log.action.toLowerCase() === selectedAction.toLowerCase());

    return matchesSearch && matchesRole && matchesDevice && matchesAction;
  });

  // Pagination Logic
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  // Reset page if page count changes to be out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system access and user activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle>User Login History</CardTitle>
            </div>
            <CardDescription>
              A record of all successful user logins.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtration Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-2">
            <div className="flex-1 flex flex-wrap items-center gap-3">
              {/* Search bar */}
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>

              {/* Role Filter */}
              <div className="w-[150px]">
                <Select
                  value={selectedRole}
                  onValueChange={(val) => {
                    setSelectedRole(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="parish">Parish</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Device Filter */}
              <div className="w-[150px]">
                <Select
                  value={selectedDevice}
                  onValueChange={(val) => {
                    setSelectedDevice(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Filter */}
              <div className="w-[150px]">
                <Select
                  value={selectedAction}
                  onValueChange={(val) => {
                    setSelectedAction(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              {(searchTerm || selectedRole !== "all" || selectedDevice !== "all" || selectedAction !== "all") && (
                <Button
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="h-9 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
                >
                  Reset
                  <RotateCcw className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No logs found matching filters.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.userEmail || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              log.role === "admin"
                                ? "bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-400/20"
                                : "bg-green-50 text-green-700 ring-green-700/10 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20"
                            }`}
                          >
                            {log.role || "user"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/10 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-500/20 capitalize">
                            {log.device || "web"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20 capitalize">
                            {log.action?.toLowerCase() || "unknown"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(startIndex + pageSize, totalItems)}
                  </span>{" "}
                  of <span className="font-medium">{totalItems}</span> entries
                </div>

                <div className="flex items-center gap-6">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Rows per page
                    </span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        setPageSize(Number(val));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
