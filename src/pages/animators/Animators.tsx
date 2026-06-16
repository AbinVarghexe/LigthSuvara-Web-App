import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Loader2,
  User,
  School,
  Trash2,
  UserPlus,
  X,
  Users,
  HelpCircle,
  BarChart2,
  Edit2,
  MoreVertical,
  KeyRound,
  UserX,
  UserCheck,
  Eye,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getAnimators,
  createAnimator,
  addAssignment,
  removeAssignment,
  getUnassignedSchools,
  deleteAnimator,
  getAnimatorStats,
  AnimatorWithUser,
  AnimatorAssignment,
  updateAnimator,
  getAcademicYear,
  formatAcademicYear,
} from "../../features/animators/services/animatorService";
import { Marks } from "../marks/Marks";
import { Questions } from "../questions/Questions";
import { UserData, getUsers, resetUserPasswordByAdmin, toggleUserDisabledStatus } from "../../features/users/services/userService";
import { Link } from "react-router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";

interface SchoolData {
  id: string;
  schoolname?: string;
  schoolName?: string;
  parish?: string;
  forane?: string;
}

interface ForaneParish {
  id: string;
  name: string;
  saint?: string;
  place?: string;
  code?: string;
}

interface ForaneData {
  id: string;
  name: string;
  parishes: ForaneParish[];
}

export function AnimatorsList() {
  const [animators, setAnimators] = useState<AnimatorWithUser[]>([]);
  const [unassignedSchools, setUnassignedSchools] = useState<SchoolData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAnimator, setSelectedAnimator] =
    useState<AnimatorWithUser | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
    fullyAssigned: 0,
  });
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedYear, setSelectedYear] = useState(getAcademicYear());
  const [allAnimatorsLoaded, setAllAnimatorsLoaded] = useState<string[]>([]);

  // Build year list from actual assignment data (fallback to current year)
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    allAnimatorsLoaded.forEach(y => yearsSet.add(y));
    // Always include current year
    yearsSet.add(getAcademicYear());
    return Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, [allAnimatorsLoaded]);

  // Form state for creating animator
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phoneNumber: "",
    address: "",
    parishId: "",
    parishName: "",
  });

  // Form state for editing animator
  const [editFormData, setEditFormData] = useState<Partial<AnimatorWithUser>>({
    name: "",
    phoneNumber: "",
    address: "",
    parishId: "",
    parishName: "",
  });

  // Assignment form state
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animatorsData, schoolsData, statsData, usersData] = await Promise.all([
        getAnimators(),
        getUnassignedSchools(selectedYear),
        getAnimatorStats(selectedYear),
        getUsers(),
      ]);
      setAnimators(animatorsData);
      setUnassignedSchools(schoolsData as SchoolData[]);
      setStats(statsData);
      setAllUsers(usersData);
      // Collect all unique years from assignment data
      const yearsFromData = new Set<string>();
      animatorsData.forEach(a => a.assignments.forEach(asg => {
        if (asg.year) yearsFromData.add(asg.year);
      }));
      setAllAnimatorsLoaded(Array.from(yearsFromData));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load animators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const handleCreateAnimator = async () => {
    if (!formData.email || !formData.password || !formData.name || !formData.parishId) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await createAnimator(
        formData.email,
        formData.password,
        formData.name,
        formData.parishId,
        formData.parishName,
        formData.phoneNumber,
        formData.address,
      );
      toast.success("Animator created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        email: "",
        password: "",
        name: "",
        phoneNumber: "",
        address: "",
        parishId: "",
        parishName: "",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating animator:", error);
      toast.error(error.message || "Failed to create animator");
    }
  };

  const openEditDialog = (animator: AnimatorWithUser) => {
    setSelectedAnimator(animator);
    setEditFormData({
      name: animator.name,
      phoneNumber: animator.phoneNumber || "",
      address: animator.address || "",
      parishId: animator.parishId || "",
      parishName: animator.parishName || animator.parish || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAnimator = async () => {
    if (!selectedAnimator) return;
    if (!editFormData.name) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      await updateAnimator(selectedAnimator.id, editFormData);
      toast.success("Animator updated successfully");
      setIsEditDialogOpen(false);
      setSelectedAnimator(null);
      fetchData();
    } catch (error: any) {
      console.error("Error updating animator:", error);
      toast.error(error.message || "Failed to update animator");
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedAnimator || !selectedSchoolId) {
      toast.error("Please select a school");
      return;
    }

    const school = unassignedSchools.find((s) => s.id === selectedSchoolId);
    if (!school) {
      toast.error("School not found");
      return;
    }

    // Validation: Animator cannot be assigned to their own home parish
    const homeParish = selectedAnimator.parishName?.toLowerCase().trim() || "";
    const schoolName = (school.schoolname || school.schoolName || "").toLowerCase().trim();
    const schoolParish = (school.parish || "").toLowerCase().trim();

    if (homeParish && (
      schoolName.includes(homeParish) ||
      homeParish.includes(schoolName) ||
      (schoolParish && homeParish.includes(schoolParish))
    )) {
      toast.error(`Animators cannot be assigned to their home parish (${selectedAnimator.parishName})`);
      return;
    }

    const assignment: AnimatorAssignment = {
      unitId: `${selectedAnimator.id}_${school.id}_${selectedYear}`,
      schoolUserId: school.id,
      schoolname: school.schoolname || school.schoolName || "",
      parish: school.parish || "",
      forane: school.forane || "",
      year: selectedYear,
    };

    try {
      await addAssignment(selectedAnimator.id, assignment);
      toast.success("School assigned successfully");
      setIsAssignDialogOpen(false);
      setSelectedSchoolId("");
      setSelectedAnimator(null);
      fetchData();
    } catch (error: any) {
      console.error("Error assigning school:", error);
      toast.error(error.message || "Failed to assign school");
    }
  };

  const handleRemoveAssignment = async (
    animatorId: string,
    assignment: AnimatorAssignment,
  ) => {
    try {
      await removeAssignment(animatorId, assignment);
      toast.success("Assignment removed successfully");
      fetchData();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Failed to remove assignment");
    }
  };

  const handleDeleteAnimator = async (animatorId: string) => {
    try {
      await deleteAnimator(animatorId);
      toast.success("Animator deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting animator:", error);
      toast.error("Failed to delete animator");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimator) return;
    if (resetNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setActionLoading(true);
    try {
      await resetUserPasswordByAdmin(selectedAnimator.id, resetNewPassword);
      toast.success("Animator password updated successfully!");
      setIsResetDialogOpen(false);
      setResetNewPassword("");
      setSelectedAnimator(null);
    } catch (error: any) {
      console.error("Error resetting animator password:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDisabled = async () => {
    if (!selectedAnimator) return;
    setActionLoading(true);
    const newDisabledState = !selectedAnimator.disabled;
    try {
      await toggleUserDisabledStatus(selectedAnimator.id, newDisabledState);
      toast.success(newDisabledState ? "Animator has been disabled" : "Animator has been enabled");
      setIsDisableDialogOpen(false);
      setSelectedAnimator(null);
      fetchData();
    } catch (error: any) {
      console.error("Error toggling animator disabled status:", error);
      toast.error(error.message || "Failed to update animator status");
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignDialog = (animator: AnimatorWithUser) => {
    setSelectedAnimator(animator);
    setIsAssignDialogOpen(true);
  };

  const filteredAnimators = animators.filter(
    (animator) =>
      animator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animator.email.toLowerCase().includes(searchTerm.toLowerCase()),
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
          Animator Management
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setFormData({
              email: "",
              password: "",
              name: "",
              phoneNumber: "",
              address: "",
              parishId: "",
              parishName: "",
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Animator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Animator</DialogTitle>
              <DialogDescription>
                Add a new animator account to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter name"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password (min 6 characters)"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="Enter phone number"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter address"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School *</Label>
                <Select
                  value={formData.parishId}
                  onValueChange={(value) => {
                    const schools = allUsers.filter((u) => u.role === "school");
                    const selectedSchool = schools.find((s) => s.id === value);
                    setFormData({
                      ...formData,
                      parishId: value,
                      parishName: selectedSchool ? (selectedSchool.schoolname || selectedSchool.schoolName || selectedSchool.fullName || selectedSchool.name || "") : "",
                    });
                  }}
                >
                  <SelectTrigger id="school">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter((u) => u.role === "school")
                      .map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.schoolname || school.schoolName || school.name || school.fullName || school.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAnimator}>
                Create Animator
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-500">Total Animators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.assigned}
            </div>
            <p className="text-sm text-gray-500">With Assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {stats.unassigned}
            </div>
            <p className="text-sm text-gray-500">No Assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats.fullyAssigned}
            </div>
            <p className="text-sm text-gray-500">Fully Assigned (7/7)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search animators by name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[240px]">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Years</SelectItem>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={yr}>
                      Academic Year {formatAcademicYear(yr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animators Grid */}
      {filteredAnimators.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No animators found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnimators.map((animator) => {
            const assignmentsForYear = selectedYear === "All"
              ? animator.assignments
              : animator.assignments.filter((a) => a.year === selectedYear);
            return (
              <Card key={animator.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={animator.profileImageUrl} />
                        <AvatarFallback>
                          {animator.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {animator.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{animator.email}</p>
                        {(animator.parishName || animator.parish) && (
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                            {animator.parishName || animator.parish}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        variant={
                          assignmentsForYear.length === 0
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {selectedYear === "All" ? assignmentsForYear.length : `${assignmentsForYear.length}/7`}
                      </Badge>
                      {animator.disabled && (
                        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-xs font-semibold px-2 py-0.5">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Assignments:</p>
                    {assignmentsForYear.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        No schools assigned{selectedYear !== "All" ? ` for ${formatAcademicYear(selectedYear)}` : ""}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {assignmentsForYear.map((assignment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <School className="h-4 w-4 text-gray-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {assignment.schoolname}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs text-gray-500 truncate">
                                    {assignment.parish}
                                  </p>
                                  {assignment.year && (
                                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                                      {formatAcademicYear(assignment.year)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleRemoveAssignment(animator.id, assignment)
                              }
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(selectedYear !== "All" && assignmentsForYear.length < 7) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openAssignDialog(animator)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign School
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/users/${animator.id}`} className="flex items-center w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(animator)}>
                          <Edit2 className="w-4 h-4 mr-2 text-blue-500" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedAnimator(animator);
                          setIsResetDialogOpen(true);
                        }}>
                          <KeyRound className="w-4 h-4 mr-2 text-purple-500" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedAnimator(animator);
                          setIsDisableDialogOpen(true);
                        }}>
                          {animator.disabled ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                              Enable Animator
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4 mr-2 text-amber-600" />
                              Disable Animator
                            </>
                          )}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Animator
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Animator</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {animator.name}?
                                This will also remove all their assignments.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAnimator(animator.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign School to {selectedAnimator?.name}
            </DialogTitle>
            <DialogDescription>
              Select a school to assign to this animator. Maximum 7 schools per
              animator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select School</Label>
              <Select
                value={selectedSchoolId}
                onValueChange={setSelectedSchoolId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a school..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const filtered = unassignedSchools.filter(school => {
                      if (!selectedAnimator) return true;
                      const homeParish = selectedAnimator.parishName?.toLowerCase().trim() || "";
                      const schoolName = (school.schoolname || school.schoolName || "").toLowerCase().trim();
                      const schoolParish = (school.parish || "").toLowerCase().trim();

                      if (homeParish && (
                        schoolName.includes(homeParish) ||
                        homeParish.includes(schoolName) ||
                        (schoolParish && homeParish.includes(schoolParish))
                      )) {
                        return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <SelectItem value="none" disabled>
                          No eligible schools available
                        </SelectItem>
                      );
                    }

                    return filtered.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.schoolname || school.schoolName} -{" "}
                        {school.parish}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAssignment}
              disabled={!selectedSchoolId || unassignedSchools.length === 0}
            >
              Assign School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Animator</DialogTitle>
            <DialogDescription>
              Update animator profile details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phoneNumber">Phone Number</Label>
              <Input
                id="edit-phoneNumber"
                value={editFormData.phoneNumber || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phoneNumber: e.target.value,
                  })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-school">School *</Label>
              <Select
                value={editFormData.parishId}
                onValueChange={(value) => {
                  const schools = allUsers.filter((u) => u.role === "school");
                  const selectedSchool = schools.find((s) => s.id === value);
                  setEditFormData({
                    ...editFormData,
                    parishId: value,
                    parishName: selectedSchool ? (selectedSchool.schoolname || selectedSchool.schoolName || selectedSchool.fullName || selectedSchool.name || "") : "",
                  });
                }}
              >
                <SelectTrigger id="edit-school">
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter((u) => u.role === "school")
                    .map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.schoolname || school.schoolName || school.name || school.fullName || school.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateAnimator}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedAnimator?.disabled ? "Enable Animator Account" : "Disable Animator Account"}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAnimator?.disabled
                ? `This will enable the animator account for ${selectedAnimator?.name} and allow them to log in again.`
                : `This will temporarily disable the animator account for ${selectedAnimator?.name}, preventing them from logging in or entering marks.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAnimator(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleDisabled}
              className={selectedAnimator?.disabled ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedAnimator?.disabled ? (
                "Enable Animator"
              ) : (
                "Disable Animator"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
        setIsResetDialogOpen(open);
        if (!open) {
          setResetNewPassword("");
          setSelectedAnimator(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Animator Password</DialogTitle>
            <DialogDescription>
              Assign a new password for {selectedAnimator?.name}. The password must be at least 6 characters long.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetPassword">New Password</Label>
              <Input
                id="resetPassword"
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsResetDialogOpen(false);
                  setResetNewPassword("");
                  setSelectedAnimator(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AnimatorProfilesView() {
  const [animators, setAnimators] = useState<AnimatorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnimator, setSelectedAnimator] = useState<AnimatorWithUser | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Forane & Parish Filters
  const [foranesData, setForanesData] = useState<ForaneData[]>([]);
  const [parishesPerForane, setParishesPerForane] = useState<Record<string, ForaneParish[]>>({});
  const [loadingParishes, setLoadingParishes] = useState<Record<string, boolean>>({});
  const [selectedForaneFilter, setSelectedForaneFilter] = useState<string>("all");
  const [selectedParishFilter, setSelectedParishFilter] = useState<string>("all");

  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
      .toLowerCase()
      .replace(/(^|[\s.])([a-z])/g, (_, sep, char) => sep + char.toUpperCase());
  };

  const fetchForanes = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'foranes'), orderBy('name')));
      const foranes: ForaneData[] = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name as string,
        parishes: [],
      }));
      setForanesData(foranes);
    } catch (e) {
      console.error('Failed to load foranes', e);
    }
  };

  const fetchParishesForForane = async (foraneId: string) => {
    if (parishesPerForane[foraneId] || loadingParishes[foraneId]) return;
    setLoadingParishes(prev => ({ ...prev, [foraneId]: true }));
    try {
      const snap = await getDocs(
        query(collection(db, 'foranes', foraneId, 'parishes'), orderBy('name'))
      );
      const parishes: ForaneParish[] = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name as string,
        saint: d.data().saint as string | undefined,
        place: d.data().place as string | undefined,
        code: d.data().code as string | undefined,
      }));
      setParishesPerForane(prev => ({ ...prev, [foraneId]: parishes }));
    } catch (e) {
      console.error('Failed to load parishes for forane', foraneId, e);
    } finally {
      setLoadingParishes(prev => ({ ...prev, [foraneId]: false }));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAnimators();
      setAnimators(data);
      await fetchForanes();
    } catch (error) {
      console.error("Error loading animator profiles:", error);
      toast.error("Failed to load animator profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedForaneFilter && selectedForaneFilter !== "all") {
      const foraneDoc = foranesData.find(
        f => f.name.toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim()
      );
      if (foraneDoc && !parishesPerForane[foraneDoc.id]) {
        fetchParishesForForane(foraneDoc.id);
      }
    }
  }, [selectedForaneFilter, foranesData]);

  const getAvailableParishes = (): string[] => {
    if (selectedForaneFilter !== "all") {
      const foraneDoc = foranesData.find(
        f => f.name.toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim()
      );
      if (foraneDoc && parishesPerForane[foraneDoc.id]) {
        return parishesPerForane[foraneDoc.id]
          .map(p => p.place || p.saint || p.name)
          .filter((p): p is string => !!p);
      }
      const filtered = animators.filter(u => (u.parishName || u.parish || "").toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim());
      return Array.from(new Set(filtered.map(u => u.parishName || u.parish || "")))
        .filter(Boolean)
        .sort();
    } else {
      return Array.from(new Set(animators.map(u => u.parishName || u.parish || "")))
        .filter(Boolean)
        .sort();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimator) return;
    if (resetNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setActionLoading(true);
    try {
      await resetUserPasswordByAdmin(selectedAnimator.id, resetNewPassword);
      toast.success("Animator password updated successfully!");
      setIsResetDialogOpen(false);
      setResetNewPassword("");
      setSelectedAnimator(null);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDisabled = async () => {
    if (!selectedAnimator) return;
    setActionLoading(true);
    const newDisabledState = !selectedAnimator.disabled;
    try {
      await toggleUserDisabledStatus(selectedAnimator.id, newDisabledState);
      toast.success(newDisabledState ? "Animator has been disabled" : "Animator has been enabled");
      setIsDisableDialogOpen(false);
      setSelectedAnimator(null);
      fetchData();
    } catch (error: any) {
      console.error("Error toggling disabled status:", error);
      toast.error(error.message || "Failed to update animator status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAnimators = animators.filter((animator) => {
    // Search term check
    const name = animator.name || "";
    const matchesSearch = animator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Forane check
    if (selectedForaneFilter !== "all") {
      const animatorParish = (animator.parishName || animator.parish || "").toLowerCase().trim();
      const foraneDoc = foranesData.find(
        f => f.name.toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim()
      );
      if (foraneDoc) {
        const hasParishInForane = parishesPerForane[foraneDoc.id]?.some(
          p => {
            const pName = (p.place || p.saint || p.name || "").toLowerCase().trim();
            return animatorParish.includes(pName) || pName.includes(animatorParish);
          }
        ) || false;
        if (!hasParishInForane) return false;
      }
    }

    // Parish check
    if (selectedParishFilter !== "all") {
      const animatorParish = (animator.parishName || animator.parish || "").toLowerCase().trim();
      const filterParish = selectedParishFilter.toLowerCase().trim();
      if (!animatorParish.includes(filterParish) && !filterParish.includes(animatorParish)) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search animators by email or name..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-[220px]">
            <Select
              value={selectedForaneFilter}
              onValueChange={(val) => {
                setSelectedForaneFilter(val);
                setSelectedParishFilter("all");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Foranes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Foranes</SelectItem>
                {foranesData.map((f) => (
                  <SelectItem key={f.id} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-[220px]">
            <Select
              value={selectedParishFilter}
              onValueChange={(val) => {
                setSelectedParishFilter(val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Parishes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parishes</SelectItem>
                {getAvailableParishes().map((pName) => (
                  <SelectItem key={pName} value={pName}>
                    {toTitleCase(pName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnimators.map((user) => {
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.profileImageUrl}
                          alt={user.name || "User"}
                          loading="lazy"
                        />
                        <AvatarFallback>
                          {(user.name || user.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                        <span>{user.name || "Unnamed User"}</span>
                      </h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {user.email}
                      </p>
                      {(user.parishName || user.parish) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Parish: {user.parishName || user.parish}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedAnimator(user);
                        setIsResetDialogOpen(true);
                      }}>
                        <KeyRound className="w-4 h-4 mr-2 text-purple-500" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedAnimator(user);
                        setIsDisableDialogOpen(true);
                      }}>
                        {user.disabled ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                            Enable Animator
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 mr-2 text-amber-600" />
                            Disable Animator
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Animator
                    </Badge>
                    {user.disabled && (
                      <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-xs font-semibold px-2 py-0.5">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-end text-sm text-muted-foreground">
                  <Link
                    to={`/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Profile
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredAnimators.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border animate-in fade-in duration-200">
            No animators found matching the filters or search.
          </div>
        )}
      </div>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedAnimator?.disabled ? "Enable Animator Account" : "Disable Animator Account"}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAnimator?.disabled
                ? `This will enable the animator account for ${selectedAnimator?.name} and allow them to log in again.`
                : `This will temporarily disable the animator account for ${selectedAnimator?.name}, preventing them from logging in or entering marks.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAnimator(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleDisabled}
              className={selectedAnimator?.disabled ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedAnimator?.disabled ? (
                "Enable Animator"
              ) : (
                "Disable Animator"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
        setIsResetDialogOpen(open);
        if (!open) {
          setResetNewPassword("");
          setSelectedAnimator(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Animator Password</DialogTitle>
            <DialogDescription>
              Assign a new password for {selectedAnimator?.name}. The password must be at least 6 characters long.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetPasswordView">New Password</Label>
              <Input
                id="resetPasswordView"
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsResetDialogOpen(false);
                  setResetNewPassword("");
                  setSelectedAnimator(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Animators() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="animators" className="space-y-4">
        <TabsList>
          <TabsTrigger value="animators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Animators
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Animator Profiles
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="marks" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Marks
          </TabsTrigger>
        </TabsList>
        <TabsContent value="animators" className="space-y-4">
          <AnimatorsList />
        </TabsContent>
        <TabsContent value="profiles" className="space-y-4">
          <AnimatorProfilesView />
        </TabsContent>
        <TabsContent value="questions" className="space-y-4">
          <Questions />
        </TabsContent>
        <TabsContent value="marks" className="space-y-4">
          <Marks />
        </TabsContent>
      </Tabs>
    </div>
  );
}
