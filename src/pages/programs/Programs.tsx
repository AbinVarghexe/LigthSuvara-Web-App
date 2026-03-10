import { useState, useEffect, useCallback } from "react";
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
  School,
  Clock,
  FileText,
  Download,
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
} from "../../features/programs/services/programService";
import { Timestamp } from "firebase/firestore";
import { PremiumProgramPdfService } from "../../features/reports/services/programPdfService";
import { getUsers } from "../../features/users/services/userService";

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

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  // Real-time subscription to programs
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

    return () => unsubscribe();
  }, []);

  const openDetailDialog = useCallback(async (program: ProgramData) => {
    setSelectedProgram(program);
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
      });
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
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      isActive: program.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
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
      if (date instanceof Timestamp) {
        return date.toDate().toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
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

  const handleExportRegistrations = async (format: "csv" | "pdf") => {
    if (!selectedProgram || detailRegistrations.length === 0) return;

    if (format === "csv") {
      const headers = [
        "Student Name",
        "Phone",
        "School",
        "Status",
        "Submitted At",
      ];

      const sortedRegistrations = [...detailRegistrations].sort((a, b) =>
        (a.schoolName || "").localeCompare(b.schoolName || ""),
      );

      const csv = [
        headers.join(","),
        ...sortedRegistrations.map((reg) =>
          [
            `"${reg.studentName}"`,
            `"${reg.studentPhone}"`,
            `"${reg.schoolName}"`,
            getStatusLabel(reg.status),
            reg.submittedAt
              ? reg.submittedAt.toDate().toLocaleDateString()
              : "N/A",
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedProgram.name.replace(/\s+/g, "_")}_registrations_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success("CSV Exported successfully");
    } else if (format === "pdf") {
      try {
        toast.info("Generating PDF, please wait...");
        // Fetch users to try and lookup forane/parish metadata if needed by report
        const users = await getUsers();
        await PremiumProgramPdfService.generateReport(
          detailRegistrations,
          selectedProgram.name,
          "All", // Using "All" forane context from within program detail
          "All", // Using "All" parish context
          users,
        );
        toast.success("PDF Exported successfully");
      } catch (err) {
        console.error("PDF generation failed", err);
        toast.error("Failed to generate PDF");
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
              <DialogDescription>
                Add a new educational program for student registration.
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
                    type="date"
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
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
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
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Update program details.</DialogDescription>
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
                  type="date"
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
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {selectedProgram?.name}
            </DialogTitle>
            {selectedProgram?.description && (
              <DialogDescription>
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

            {/* Registration Stats */}
            <div className="flex justify-between items-center mt-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Registered Members ({detailStats?.total || 0})
              </h3>
              {detailRegistrations.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleExportRegistrations("csv")}
                    >
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportRegistrations("pdf")}
                    >
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : detailStats ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {detailStats.total}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                      {detailStats.pending}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      Pending
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-center">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {detailStats.approved}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Approved
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {detailStats.locked}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Locked
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {detailStats.rejected}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">
                      Rejected
                    </p>
                  </div>
                </div>

                {/* Registrations Table */}
                <div>
                  {detailRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p>No registrations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Array.from(
                        new Set(
                          detailRegistrations.map((reg) => reg.schoolName),
                        ),
                      )
                        .sort()
                        .map((schoolName) => {
                          const schoolRegs = detailRegistrations.filter(
                            (reg) => reg.schoolName === schoolName,
                          );
                          return (
                            <div key={schoolName} className="space-y-3">
                              <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-1 flex justify-between items-center">
                                <span>{schoolName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {schoolRegs.reduce(
                                    (sum, reg) =>
                                      sum +
                                      (reg.isCountOnly
                                        ? reg.studentCount || 1
                                        : 1),
                                    0,
                                  )}{" "}
                                  students
                                </Badge>
                              </h4>
                              {/* Desktop table */}
                              <div className="hidden sm:block rounded-lg border overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>#</TableHead>
                                      <TableHead>Student Name</TableHead>
                                      <TableHead>Phone</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Submitted</TableHead>
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
                                            ? `${reg.studentCount} Students`
                                            : reg.studentName}
                                        </TableCell>
                                        <TableCell>
                                          {reg.isCountOnly
                                            ? "-"
                                            : reg.studentPhone}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            className={getStatusColor(
                                              reg.status,
                                            )}
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
                                            ? `${reg.studentCount} Students (Bulk)`
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
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
