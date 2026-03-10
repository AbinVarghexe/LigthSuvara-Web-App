import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  ChevronRight,
  ArrowLeft,
  Loader2,
  School,
  User,
  Phone,
  Calendar,
  Info,
  Building,
  Mail,
  MapPin,
  ClipboardList,
  Church,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import {
  subscribeToAllRegistrations,
  ProgramRegistration,
} from "../../features/programs/services/programService";
import { getUsers, UserData } from "../../features/users/services/userService";

type DrillDownLevel = "programs" | "schools" | "students";

export function ProgramRegistrations() {
  const [registrations, setRegistrations] = useState<ProgramRegistration[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation State
  const [level, setLevel] = useState<DrillDownLevel>("programs");
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(
    null,
  );
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // Filters for School List (Level 2)
  const [searchSchoolsQuery, setSearchSchoolsQuery] = useState("");
  const [selectedForane, setSelectedForane] = useState("All");
  const [selectedParishId, setSelectedParishId] = useState("All");

  // School Profile Dialog
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSchoolId, setProfileSchoolId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribeRegistrations = subscribeToAllRegistrations((data) => {
      // Filter for approved/locked as per Flutter logic
      const filtered = data.filter(
        (reg) => reg.status === "approved_parish" || reg.status === "locked",
      );
      setRegistrations(filtered);
      setLoading(false);
    });

    const fetchUsers = async () => {
      try {
        const userData = await getUsers();
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();

    return () => unsubscribeRegistrations();
  }, []);

  // Helpers
  const getSchoolName = (
    schoolId: string,
    fallback: string = "Unknown School",
  ) => {
    const user = users.find((u) => u.id === schoolId);
    return user?.schoolName || user?.schoolname || user?.name || fallback;
  };

  const getSchoolProfile = (schoolId: string) => {
    return users.find((u) => u.id === schoolId);
  };

  // Geographic Memos (similar to Analytics)
  const uniqueForanes = useMemo(() => {
    return Array.from(
      new Set(
        users
          .filter((u) => u.role === "school")
          .map((u) => u.forane)
          .filter(Boolean),
      ),
    ).sort() as string[];
  }, [users]);

  const dynamicParishesForFilter = useMemo(() => {
    const parishes = users
      .filter((u) => u.role === "school")
      .map((u) => ({
        id: u.uid || u.id,
        name: u.schoolName || u.schoolname || "Unknown",
        forane: u.forane || "Unknown Forane",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (selectedForane === "All") return parishes;
    return parishes.filter((p) => p.forane === selectedForane);
  }, [users, selectedForane]);

  // Aggregations
  const programGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    registrations.forEach((reg) => {
      const name = reg.programName || "Unknown Program";
      const count = reg.isCountOnly ? reg.studentCount || 1 : 1;
      groups[name] = (groups[name] || 0) + count;
    });
    return Object.entries(groups)
      .map(([name, count]) => ({ name, count }))
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [registrations, searchQuery]);

  const schoolGroups = useMemo(() => {
    if (!selectedProgramName) return [];

    const groups: Record<
      string,
      { count: number; fallbackName: string; isCountOnly: boolean }
    > = {};
    registrations
      .filter((reg) => reg.programName === selectedProgramName)
      .forEach((reg) => {
        const sid = reg.schoolUserId || "unknown";
        const count = reg.isCountOnly ? reg.studentCount || 1 : 1;

        if (!groups[sid]) {
          groups[sid] = {
            count: 0,
            fallbackName: reg.schoolName || "Unknown School",
            isCountOnly: !!reg.isCountOnly,
          };
        }
        groups[sid].count += count;
      });

    return Object.entries(groups)
      .map(([id, data]) => ({
        id,
        name: getSchoolName(id, data.fallbackName),
        count: data.count,
        isCountOnly: data.isCountOnly,
      }))
      .filter((s) => {
        // Apply geographic and search filters
        const user = users.find((u) => u.id === s.id || u.uid === s.id);
        const schoolName = s.name;
        const schoolForane = user?.forane || "Unknown Forane";
        const schoolParishId = s.id;

        // 1. Search Filter
        if (
          searchSchoolsQuery &&
          !schoolName.toLowerCase().includes(searchSchoolsQuery.toLowerCase())
        ) {
          return false;
        }

        // 2. Forane Filter
        if (selectedForane !== "All" && schoolForane !== selectedForane) {
          return false;
        }

        // 3. Parish Filter
        if (selectedParishId !== "All" && schoolParishId !== selectedParishId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.count - a.count); // Rank by students
  }, [
    registrations,
    selectedProgramName,
    users,
    searchSchoolsQuery,
    selectedForane,
    selectedParishId,
  ]);

  const studentList = useMemo(() => {
    if (!selectedProgramName || !selectedSchoolId) return [];
    return registrations
      .filter(
        (reg) =>
          reg.programName === selectedProgramName &&
          reg.schoolUserId === selectedSchoolId,
      )
      .sort((a, b) => {
        const timeA = a.submittedAt?.toMillis() || 0;
        const timeB = b.submittedAt?.toMillis() || 0;
        return timeB - timeA;
      });
  }, [registrations, selectedProgramName, selectedSchoolId]);

  // Actions
  const handleProgramClick = (name: string) => {
    setSelectedProgramName(name);
    setLevel("schools");
  };

  const handleSchoolClick = (id: string) => {
    setSelectedSchoolId(id);
    setLevel("students");
  };

  const goBack = () => {
    if (level === "students") {
      setLevel("schools");
      setSelectedSchoolId(null);
    } else if (level === "schools") {
      setLevel("programs");
      setSelectedProgramName(null);
      // Reset filters when going back to programs
      setSearchSchoolsQuery("");
      setSelectedForane("All");
      setSelectedParishId("All");
    }
  };

  const openProfile = (id: string) => {
    setProfileSchoolId(id);
    setIsProfileOpen(true);
  };

  const currentSchoolProfile = profileSchoolId
    ? getSchoolProfile(profileSchoolId)
    : null;

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header & Breadcrumbs/Back Button */}
      <div className="flex items-center gap-4">
        {level !== "programs" && (
          <Button
            variant="outline"
            size="icon"
            onClick={goBack}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {level === "programs" && "Program Registrations"}
            {level === "schools" && selectedProgramName}
            {level === "students" && getSchoolName(selectedSchoolId || "")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {level === "programs" &&
              "Overview of students registered across all active programs"}
            {level === "schools" &&
              "Distribution of registrations per participating school"}
            {level === "students" && `Student list for ${selectedProgramName}`}
          </p>
        </div>
      </div>

      {/* Level 1: Programs list */}
      {level === "programs" && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Programs..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {programGroups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No active registrations found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programGroups.map((p) => (
                <Card
                  key={p.name}
                  className="cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-blue-500"
                  onClick={() => handleProgramClick(p.name)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground leading-tight">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {p.count} Students
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Level 2: School distribution */}
      {
        level === "schools" && (
          <div className="space-y-6">
            {/* Schools Level Filter Bar */}
            <Card className="shadow-sm border-none bg-background/60 backdrop-blur-md z-10">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {/* Search */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                      <Search className="h-3 w-3" /> Search
                    </Label>
                    <Input
                      placeholder="Search school name..."
                      value={searchSchoolsQuery}
                      onChange={(e) => setSearchSchoolsQuery(e.target.value)}
                      className="h-9 bg-background border-input"
                    />
                  </div>

                  {/* Forane */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                      <MapPin className="h-3 w-3" /> Forane
                    </Label>
                    <Select
                      value={selectedForane}
                      onValueChange={(v) => {
                        setSelectedForane(v);
                        setSelectedParishId("All");
                      }}
                    >
                      <SelectTrigger className="h-9 bg-background border-input">
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

                  {/* Parish */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 ml-1">
                      <Church className="h-3 w-3" /> Parish/School
                    </Label>
                    <Select
                      value={selectedParishId}
                      onValueChange={setSelectedParishId}
                    >
                      <SelectTrigger className="h-9 bg-background border-input">
                        <SelectValue placeholder="All Parishes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Parishes</SelectItem>
                        {dynamicParishesForFilter.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {schoolGroups.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-20 text-center text-muted-foreground italic">
                  No schools found matching the current filters.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schoolGroups.map((s) => (
                  <Card
                    key={s.id}
                    className="cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => handleSchoolClick(s.id)}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                          <School className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground leading-tight">
                            {s.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              {s.count} Students
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      }

      {/* Level 3: Student list */}
      {
        level === "students" && (
          <div className="space-y-4">
            {studentList.map((st, idx) => (
              <Card key={st.id || idx}>
                <CardContent className="p-5 flex items-center gap-5">
                  <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                    {st.isCountOnly ? (
                      <span className="font-bold text-primary">
                        +{st.studentCount}
                      </span>
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">
                      {st.isCountOnly
                        ? `${st.studentCount} Students (Consolidated)`
                        : st.studentName}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {st.isCountOnly ? (
                          <School className="h-3.5 w-3.5" />
                        ) : (
                          <Phone className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {st.isCountOnly
                            ? "Bulk Registration"
                            : st.studentPhone || "No Phone"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Submitted:{" "}
                          {st.submittedAt?.toDate().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {st.isCountOnly ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openProfile(st.schoolUserId)}
                      >
                        <Info className="h-5 w-5 text-primary" />
                      </Button>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                      >
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }

      {/* School Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Building className="h-5 w-5" />
              School Profile
            </DialogTitle>
          </DialogHeader>
          {currentSchoolProfile ? (
            <div className="space-y-5 py-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Institution
                </p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {currentSchoolProfile.schoolName ||
                    currentSchoolProfile.schoolname ||
                    currentSchoolProfile.name}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    icon: User,
                    label: "Contact Person",
                    value: currentSchoolProfile.fullName || "Not Set",
                  },
                  {
                    icon: Phone,
                    label: "Phone Number",
                    value: currentSchoolProfile.phoneNumber || "Not Set",
                  },
                  {
                    icon: Mail,
                    label: "Email Address",
                    value: currentSchoolProfile.email || "Not Set",
                  },
                  {
                    icon: MapPin,
                    label: "Forane / Parish",
                    value: `${currentSchoolProfile.forane || "Unknown"} Forane`,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="font-semibold text-foreground">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Profile data not found.
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setIsProfileOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
