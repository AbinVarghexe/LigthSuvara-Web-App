import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  MoreVertical,
  Shield,
  School,
  Loader2,
  Upload,
  Download,
  FileSpreadsheet,
  Sparkles,
  UserPlus,
  Trash2,
  Church,
  Plus,
  Users as UsersIcon,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
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
  getUsers,
  UserData,
  bulkCreateUsers,
  deleteUser,
} from "../../features/users/services/userService";
import { Card, CardContent } from "../../components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

interface NewUser extends Partial<UserData> {
  password?: string;
}

interface ForaneParish {
  id: string;
  name: string;
  saint?: string;
}

interface ForaneData {
  id: string;
  name: string;
  parishes: ForaneParish[];
}

export function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"school" | "parish">("school");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdminDeleting, setIsAdminDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newUsers, setNewUsers] = useState<NewUser[]>([{
    email: "",
    fullName: "",
    name: "",
    role: "school",
    schoolname: "",
    schoolName: "",
    phoneNumber: "",
    password: "",
    forane: "",
    parish: "",
    address: "",
    parishId: "",
    parishName: "",
    schoolId: "",
  }]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAllUsersMode, setShowAllUsersMode] = useState(false);
  const [allUsersRoleFilter, setAllUsersRoleFilter] = useState<string>("all");

  // Foranes + Parishes from Firestore
  const [foranesData, setForanesData] = useState<ForaneData[]>([]);
  const [parishesPerForane, setParishesPerForane] = useState<Record<string, ForaneParish[]>>({});
  const [loadingParishes, setLoadingParishes] = useState<Record<string, boolean>>({});

  const fetchForanes = useCallback(async () => {
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
  }, []);

  const fetchParishesForForane = useCallback(async (foraneId: string) => {
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
      }));
      setParishesPerForane(prev => ({ ...prev, [foraneId]: parishes }));
    } catch (e) {
      console.error('Failed to load parishes for forane', foraneId, e);
    } finally {
      setLoadingParishes(prev => ({ ...prev, [foraneId]: false }));
    }
  }, [parishesPerForane, loadingParishes]);

  // Standardize names: convert ALL-CAPS to Title Case (e.g. "ST.GEORGE CHURCH" → "St.George Church")
  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
      .toLowerCase()
      .replace(/(^|[\s.])([a-z])/g, (_, sep, char) => sep + char.toUpperCase());
  };

  const getAutofilledName = (saintOrSchoolName: string, parishName: string): string => {
    let baseName = saintOrSchoolName || "";
    const parish = parishName || "";

    const suffixesToStrip = ["cathedral", "church", "school"];
    let words = baseName.trim().split(/\s+/);
    if (words.length > 1) {
      const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
      if (suffixesToStrip.includes(lastWord)) {
        words.pop();
        baseName = words.join(" ");
      }
    }
    baseName = baseName.trim();

    if (baseName && parish) {
      const formattedBase = toTitleCase(baseName);
      const formattedParish = toTitleCase(parish);
      if (formattedBase.toLowerCase() === formattedParish.toLowerCase()) {
        return formattedBase;
      } else if (formattedBase.toLowerCase().includes(formattedParish.toLowerCase())) {
        return formattedBase;
      } else {
        return `${formattedBase} ${formattedParish}`;
      }
    } else if (baseName) {
      return toTitleCase(baseName);
    } else if (parish) {
      return toTitleCase(parish);
    }
    return "";
  };

  const handleCreateUser = async () => {
    const invalidUsers = newUsers.filter(u => !u.email || !u.role || !u.password);
    if (invalidUsers.length > 0) {
      toast.error("Email, role, and password are required for all users");
      return;
    }
    setIsCreating(true);
    try {
      const result = await bulkCreateUsers(newUsers);
      if (result.success && result.created > 0) {
        toast.success(`Successfully created ${result.created} user(s)`);
        setIsCreateDialogOpen(false);
        setNewUsers([{
          email: "",
          fullName: "",
          name: "",
          role: "school",
          schoolname: "",
          phoneNumber: "",
          password: "",
          forane: "",
          parish: "",
          address: "",
          parishId: "",
          parishName: "",
          schoolId: "",
        }]);
        fetchUsers();
      } else {
        const errMsg = result.errors?.[0]?.error || "Failed to create users";
        toast.error(errMsg);
      }
    } catch (error: any) {
      console.error("Error creating users:", error);
      toast.error(error.message || "Failed to create users");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsAdminDeleting(true);
    try {
      const result = await deleteUser(userToDelete.id || userToDelete.uid);
      if (result.success) {
        toast.success("User deleted successfully");
        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error("Failed to delete user account");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsAdminDeleting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchForanes();
  }, []);

  const filteredUsers = users
    .filter((user) => {
      if (user.role !== activeTab) return false;
      const name = user.schoolName || user.schoolname || user.fullName || "";
      return (
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const nameA = (a.schoolName || a.schoolname || a.fullName || "").toLowerCase();
      const nameB = (b.schoolName || b.schoolname || b.fullName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const schoolCount = users.filter((u) => u.role === "school").length;
  const parishCount = users.filter((u) => u.role === "parish").length;

  const allUsersFilteredList = users
    .filter((user) => {
      if (allUsersRoleFilter !== "all" && user.role !== allUsersRoleFilter) return false;
      const name = user.schoolName || user.schoolname || user.fullName || "";
      return (
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const nameA = (a.schoolName || a.schoolname || a.fullName || "").toLowerCase();
      const nameB = (b.schoolName || b.schoolname || b.fullName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const downloadTemplate = () => {
    const headers = [
      "email",
      "fullName",
      "role",
      "schoolname",
      "phoneNumber",
      "password",
      "forane",
      "parish",
    ];
    const sample = [
      "stdominicsschool@test.com,Akhil,school,St Dominics Kanjirapally,9061782311,Password123,Kanjirapally,Kanjirapally",
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      sample.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "school_user_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(row => row.trim());
        if (rows.length < 2) {
          toast.warning("CSV file is empty or only contains headers");
          setIsUploading(false);
          return;
        }

        const headers = rows[0].split(",").map((h) => h.trim());
        const newUsers: Partial<UserData>[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;

          // Robust split by comma that ignores commas inside double quotes
          const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim());
          const user: any = {};

          headers.forEach((header, index) => {
            let val = values[index]?.replace(/^"|"$/g, '').trim();
            if (val) {
              user[header] = val;
            }
          });

          // Basic validation for required fields before adding to import list
          if (user.email) {
            if (!user.role) user.role = "school";
            
            // Password is required for new accounts
            if (!user.password) {
              console.warn(`Skipping user ${user.email}: Missing password`);
              continue;
            }
            
            if (user.password.length < 6) {
              console.warn(`Skipping user ${user.email}: Password too short`);
              continue;
            }

            newUsers.push(user);
          }
        }

        if (newUsers.length > 0) {
          const result = await bulkCreateUsers(newUsers);

          if (result.success) {
            toast.success(`Successfully created ${result.created} users`);
          } else {
            toast.warning(
              `Created ${result.created} users, ${result.failed} failed. See console for details.`
            );
            console.log("Bulk creation results:", result);
          }

          setIsDialogOpen(false);
          fetchUsers();
        } else {
          toast.warning("No valid users (email and role required) found in CSV");
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Failed to process CSV file. Ensure it's in the correct format.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showAllUsersMode) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchTerm("");
                setShowAllUsersMode(false);
              }}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">All Registered Users</h1>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
            Total Database Users:{" "}
            <span className="font-semibold text-foreground">{users.length}</span>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email or name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select
                value={allUsersRoleFilter}
                onValueChange={(val) => setAllUsersRoleFilter(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="school">Sunday School</SelectItem>
                  <SelectItem value="parish">Parish</SelectItem>
                  <SelectItem value="animator">Animator</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Count display */}
        <div className="flex items-center gap-2 px-1 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-muted-foreground">Filtered Users:</span>
          <span className="text-foreground font-semibold">
            {allUsersFilteredList.length}
          </span>
        </div>

        {/* Users List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allUsersFilteredList.map((user) => {
            const lastActiveDate = user.lastActiveAt?.seconds ? new Date(user.lastActiveAt.seconds * 1000) : null;
            const isOnline = lastActiveDate && (new Date().getTime() - lastActiveDate.getTime()) < 300000;

            return (
              <Card key={user.id} className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={user.profileImageUrl}
                            alt={user.fullName || "User"}
                            loading="lazy"
                          />
                          <AvatarFallback>
                            {(user.fullName || user.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full shadow-sm"></span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {user.schoolname ||
                            user.schoolName ||
                            user.fullName ||
                            "Unnamed User"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/users/${user.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                          onSelect={() => {
                            setUserToDelete(user);
                            setIsDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={`gap-1.5 ${user.role === "admin"
                        ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400"
                        : user.role === "animator"
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
                        : user.role === "parish"
                          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                    >
                      {user.role === "admin" ? (
                        <Shield className="w-3 h-3" />
                      ) : user.role === "animator" ? (
                        <Sparkles className="w-3 h-3" />
                      ) : user.role === "parish" ? (
                        <Church className="w-3 h-3" />
                      ) : (
                        <School className="w-3 h-3" />
                      )}
                      {user.role === "admin"
                        ? "Administrator"
                        : user.role === "animator"
                          ? "Animator"
                          : user.role === "parish"
                            ? "Parish"
                            : "Sunday School"}
                    </Badge>
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
            )
          })}
          {allUsersFilteredList.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
              No users found matching the filter or search criteria.
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete the account for{" "}
                <span className="font-semibold text-foreground">
                  {userToDelete?.schoolname || userToDelete?.schoolName || userToDelete?.fullName || userToDelete?.email}
                </span>
                ?
                <br />
                <br />
                <span className="text-red-500 font-medium italic text-xs">
                  This will permanently delete the account from Firebase Authentication and all profile data from Firestore. This action cannot be undone.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isAdminDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isAdminDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isAdminDeleting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                ) : (
                  "Delete Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Sunday School / Parish Management</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-muted-foreground mr-1">
            Total Users:{" "}
            <span className="font-medium text-foreground">{users.length}</span>
          </div>

          <Button
            variant="outline"
            className="border-border hover:bg-muted text-foreground"
            onClick={() => {
              setSearchTerm("");
              setShowAllUsersMode(true);
            }}
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            All Users
          </Button>

          {/* Create Individual User */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Create New Users</DialogTitle>
                <DialogDescription>
                  Add one or more Sunday school or parish user accounts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {newUsers.map((user, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg relative bg-muted/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">User {index + 1}</span>
                      {newUsers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const updated = [...newUsers];
                            updated.splice(index, 1);
                            setNewUsers(updated);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`email-${index}`}>Email *</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          placeholder="user@example.com"
                          value={user.email}
                          onChange={(e) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, email: e.target.value };
                            setNewUsers(updated);
                          }}
                        />
                      </div>

                      {user.role === "animator" ? (
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Full Name *</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Enter Full Name"
                            value={user.name || ""}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, name: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                      ) : user.role === "school" ? (
                        <div className="space-y-2">
                          <Label htmlFor={`fullName-${index}`}>Full Name</Label>
                          <Input
                            id={`fullName-${index}`}
                            placeholder="John Doe"
                            value={user.fullName || ""}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, fullName: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`role-${index}`}>Role *</Label>
                        <Select
                          value={user.role}
                          onValueChange={(val) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, role: val as any, forane: "", parish: "", schoolname: "", schoolName: "", schoolId: "", name: "" };
                            setNewUsers(updated);
                          }}
                        >
                          <SelectTrigger id={`role-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="animator">Animator</SelectItem>
                            <SelectItem value="parish">Parish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Forane only shown for school and animator roles; parish uses it inside Link to School group */}
                      {user.role !== "parish" && (
                        <div className="space-y-2">
                          <Label htmlFor={`forane-${index}`}>Forane *</Label>
                          <Select
                            value={user.forane || ""}
                            onValueChange={(val) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, forane: val, parish: "", schoolname: "", schoolName: "" };
                              setNewUsers(updated);
                              const foraneDoc = foranesData.find(f => f.name === val);
                              if (foraneDoc) fetchParishesForForane(foraneDoc.id);
                            }}
                          >
                            <SelectTrigger id={`forane-${index}`}>
                              <SelectValue placeholder="Select forane" />
                            </SelectTrigger>
                            <SelectContent>
                              {foranesData.map((f) => (
                                <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {user.role === "school" && (
                      (() => {
                        const foraneDoc = foranesData.find(f => f.name === user.forane);
                        const foraneId = foraneDoc?.id ?? "";
                        const availableParishes = foraneId ? (parishesPerForane[foraneId] ?? []) : [];
                        const usedParishNames = new Set(
                          users
                            .filter(u => u.role === "school" && u.parish)
                            .map(u => (u.parish ?? "").toLowerCase().trim())
                        );
                        const isLoadingP = loadingParishes[foraneId] ?? false;
                        return (
                          <div className="space-y-2">
                            <Label htmlFor={`parish-select-${index}`}>Parish *</Label>
                            <Select
                              value={user.parish || ""}
                              disabled={!user.forane}
                              onValueChange={(val) => {
                                const selectedParish = availableParishes.find(p => p.name === val);
                                const saint = selectedParish?.saint || "";
                                const schoolNameCombined = getAutofilledName(saint, val);
                                const updated = [...newUsers];
                                updated[index] = {
                                  ...user,
                                  parish: val,
                                  schoolname: schoolNameCombined,
                                  schoolName: schoolNameCombined,
                                };
                                setNewUsers(updated);
                              }}
                            >
                              <SelectTrigger id={`parish-select-${index}`}>
                                {isLoadingP
                                  ? <span className="text-muted-foreground text-sm flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
                                  : <SelectValue placeholder={user.forane ? "Select parish" : "Select a forane first"} />}
                              </SelectTrigger>
                              <SelectContent>
                                {availableParishes.length === 0 && !isLoadingP && (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    {user.forane ? "No parishes found" : "Select a forane first"}
                                  </div>
                                )}
                                {availableParishes.map((p) => {
                                  const alreadyUsed = usedParishNames.has(p.name.toLowerCase().trim());
                                  return (
                                    <SelectItem key={p.id} value={p.name} disabled={alreadyUsed}>
                                      <span className={alreadyUsed ? "text-muted-foreground line-through" : ""}>
                                        {toTitleCase(p.name)}{p.saint ? ` — ${toTitleCase(p.saint)}` : ""}
                                      </span>
                                      {alreadyUsed && <span className="ml-2 text-xs text-muted-foreground">(already registered)</span>}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })()
                    )}

                    {user.role === "school" && (
                      <div className="space-y-2">
                        <Label htmlFor={`schoolname-${index}`}>School Name</Label>
                        <Input
                          id={`schoolname-${index}`}
                          placeholder={user.forane ? "Select a parish above to auto-fill" : "St. Mary's School"}
                          value={user.schoolname || ""}
                          onChange={(e) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, schoolname: e.target.value };
                            setNewUsers(updated);
                          }}
                        />
                        {user.schoolname && (
                          <p className="text-xs text-muted-foreground">Auto-filled from parish — edit if needed</p>
                        )}
                      </div>
                    )}

                    {user.role === "animator" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`address-${index}`}>Address</Label>
                          <Input
                            id={`address-${index}`}
                            placeholder="Enter Address"
                            value={user.address}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, address: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`parishDropdown-${index}`}>Parish *</Label>
                          <Select
                            value={user.parishId}
                            onValueChange={(val) => {
                              const selectedParish = users.find(u => u.id === val || u.uid === val);
                              const updated = [...newUsers];
                              updated[index] = { 
                                ...user, 
                                parishId: val, 
                                parishName: selectedParish?.schoolname || selectedParish?.schoolName || selectedParish?.fullName || "" 
                              };
                              setNewUsers(updated);
                            }}
                          >
                            <SelectTrigger id={`parishDropdown-${index}`}>
                              <SelectValue placeholder="Select Parish" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(
                                users
                                  .filter(u => (u.role === "parish" || u.role === "school") && (!user.forane || u.forane === user.forane))
                                  .reduce((acc, current) => {
                                    const name = current.schoolname || current.schoolName || current.fullName || current.email;
                                    if (!acc.has(name)) {
                                      acc.set(name, current);
                                    }
                                    return acc;
                                  }, new Map<string, typeof users[0]>())
                                  .values()
                              ).map((p) => (
                                <SelectItem key={p.id} value={p.id || ""}>
                                  {p.schoolname || p.schoolName || p.fullName || p.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {user.role === "parish" && (
                      <div className="space-y-4">
                        <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link to School</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`parish-forane-${index}`}>Forane</Label>
                              <Select
                                value={user.forane || ""}
                                onValueChange={(val) => {
                                  const updated = [...newUsers];
                                  updated[index] = { ...user, forane: val, schoolId: "", schoolName: "", parish: "", name: "" };
                                  setNewUsers(updated);
                                }}
                              >
                                <SelectTrigger id={`parish-forane-${index}`}>
                                  <SelectValue placeholder="Filter by forane" />
                                </SelectTrigger>
                                <SelectContent>
                                  {foranesData.map((f) => (
                                    <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`schoolSelect-${index}`}>School *</Label>
                              <Select
                                value={user.schoolId || ""}
                                onValueChange={(val) => {
                                  const selectedSchool = users.find(u => u.id === val || u.uid === val);
                                  const schoolName = selectedSchool?.schoolname || selectedSchool?.schoolName || "";
                                  const parish = selectedSchool?.parish || "";
                                  const autofilledName = getAutofilledName(schoolName, parish);
                                  const updated = [...newUsers];
                                  updated[index] = {
                                    ...user,
                                    schoolId: val,
                                    schoolName: selectedSchool?.schoolname || selectedSchool?.schoolName || "",
                                    forane: selectedSchool?.forane || user.forane || "",
                                    parish: selectedSchool?.parish || "",
                                    name: autofilledName,
                                  };
                                  setNewUsers(updated);
                                }}
                              >
                                <SelectTrigger id={`schoolSelect-${index}`}>
                                  <SelectValue placeholder="Select school" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const assignedSchoolIds = new Set(
                                      users.filter(u => u.role === "parish" && u.schoolId).map(u => u.schoolId)
                                    );
                                    return users
                                      .filter(u => u.role === "school" && (!user.forane || u.forane === user.forane) && !assignedSchoolIds.has(u.id || u.uid))
                                      .map(s => (
                                        <SelectItem key={s.id} value={s.id || ""}>
                                          {s.schoolname || s.schoolName || s.email}
                                        </SelectItem>
                                      ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {user.parish && (
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <Church className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                              <span className="text-xs text-green-700 dark:text-green-300">
                                Parish auto-filled: <strong>{toTitleCase(user.parish)}</strong>
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Parish Name *</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Enter Parish Name"
                            value={user.name || ""}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, name: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                      </div>
                    )}



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`phone-${index}`}>Phone Number</Label>
                        <Input
                          id={`phone-${index}`}
                          placeholder="Phone Number"
                          value={user.phoneNumber}
                          onChange={(e) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, phoneNumber: e.target.value };
                            setNewUsers(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`password-${index}`}>Password *</Label>
                        <Input
                          id={`password-${index}`}
                          type="password"
                          placeholder="Min 6 characters"
                          value={user.password}
                          onChange={(e) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, password: e.target.value };
                            setNewUsers(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    const lastUser = newUsers[newUsers.length - 1];
                    setNewUsers([...newUsers, {
                      email: "",
                      fullName: "",
                      name: "",
                      role: lastUser?.role || "school",
                      forane: lastUser?.forane || "",
                      parish: lastUser?.parish || "",
                      parishId: lastUser?.parishId || "",
                      parishName: lastUser?.parishName || "",
                      schoolId: lastUser?.schoolId || "",
                      schoolName: lastUser?.schoolName || "",
                      password: "",
                      address: "",
                    }]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another User
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    `Create ${newUsers.length} User(s)`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Upload Users</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to add multiple users at once.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        CSV Template
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Download format guide
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                      <p className="text-sm text-gray-600">
                        Processing file...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload CSV
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max file size: 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs
        defaultValue="school"
        className="w-full"
        onValueChange={(val) => setActiveTab(val as "school" | "parish")}
      >
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="school">Sunday Schools</TabsTrigger>
          <TabsTrigger value="parish">Parishes</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email or school name..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 px-1 text-sm font-medium">
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-muted-foreground">
          Total {activeTab === "school" ? "Sunday Schools" : "Parishes"}:
        </span>
        <span className="text-foreground font-semibold">
          {activeTab === "school" ? schoolCount : parishCount}
        </span>
        {searchTerm && (
          <span className="text-xs text-muted-foreground ml-2">
            ({filteredUsers.length} matching search)
          </span>
        )}
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          // Check if user was active in the last 5 mins (300000 ms)
          const lastActiveDate = user.lastActiveAt?.seconds ? new Date(user.lastActiveAt.seconds * 1000) : null;
          const isOnline = lastActiveDate && (new Date().getTime() - lastActiveDate.getTime()) < 300000;

          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.profileImageUrl}
                          alt={user.fullName || "User"}
                          loading="lazy"
                        />
                        <AvatarFallback>
                          {(user.fullName || user.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full shadow-sm"></span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {user.schoolname ||
                          user.schoolName ||
                          user.fullName ||
                          "Unnamed User"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/users/${user.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onSelect={() => {
                          setUserToDelete(user);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className={`gap-1.5 ${user.role === "admin"
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400"
                      : user.role === "animator"
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
                      : user.role === "parish"
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                  >
                    {user.role === "admin" ? (
                      <Shield className="w-3 h-3" />
                    ) : user.role === "animator" ? (
                      <Sparkles className="w-3 h-3" />
                    ) : user.role === "parish" ? (
                      <Church className="w-3 h-3" />
                    ) : (
                      <School className="w-3 h-3" />
                    )}
                    {user.role === "admin"
                      ? "Administrator"
                      : user.role === "animator"
                        ? "Animator"
                        : user.role === "parish"
                          ? "Parish"
                          : "Sunday School"}
                  </Badge>
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
          )
        })}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the account for{" "}
              <span className="font-semibold text-foreground">
                {userToDelete?.schoolname || userToDelete?.schoolName || userToDelete?.fullName || userToDelete?.email}
              </span>
              ?
              <br />
              <br />
              <span className="text-red-500 font-medium italic text-xs">
                This will permanently delete the account from Firebase Authentication and all profile data from Firestore. This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isAdminDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isAdminDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isAdminDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
