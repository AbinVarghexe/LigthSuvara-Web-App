import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
    Loader2,
    Users,
    Trophy,
    BarChart4,
    LayoutDashboard,
    ArrowUpRight,
    Search,
    Church,
    MapPin,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../../components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
    subscribeToAllRegistrations,
    subscribeToPrograms,
    ProgramRegistration,
    ProgramData,
} from "../../features/programs/services/programService";
import { getUsers, UserData } from "../../features/users/services/userService";

export function ProgramAnalytics() {
    const [registrations, setRegistrations] = useState<ProgramRegistration[]>([]);
    const [programs, setPrograms] = useState<ProgramData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [selectedProgramFilter, setSelectedProgramFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedForane, setSelectedForane] = useState("All");
    const [selectedParishId, setSelectedParishId] = useState("All");

    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        const unsubRegs = subscribeToAllRegistrations((data) => {
            // Valid status per flutter code
            const valid = data.filter(r => r.status === "approved_parish" || r.status === "locked");
            setRegistrations(valid);
            setLoading(false);
        });

        const unsubProgs = subscribeToPrograms((data) => {
            setPrograms(data);
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

        return () => {
            unsubRegs();
            unsubProgs();
        };
    }, []);

    // Derived Geographic Data
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

    const dynamicParishes = useMemo(() => {
        const parishes = users
            .filter((u) => u.role === "school")
            .map((u) => ({
                id: u.uid || u.id,
                name: u.schoolName || u.schoolname || "Unknown",
                forane: u.forane || "Unknown Forane",
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (selectedForane === "All") return parishes;
        return parishes.filter(p => p.forane === selectedForane);
    }, [users, selectedForane]);

    // Stats calculation
    const stats = useMemo(() => {
        let total = 0;
        const pCounts: Record<string, number> = {};
        const sCounts: Record<string, number> = {};
        const sNames: Record<string, string> = {};
        const existingProgramIds = new Set(programs.map(p => p.id));

        registrations.forEach((reg) => {
            if (!existingProgramIds.has(reg.programId)) {
                return;
            }
            const pName = reg.programName || "Unknown Program";
            const sid = reg.schoolUserId || "unknown";

            // 1. Program Filter
            if (selectedProgramFilter !== "All" && pName !== selectedProgramFilter) {
                return;
            }

            // Get School Data for further filtering
            const user = users.find(u => u.id === sid || u.uid === sid);
            const schoolName = user?.schoolName || user?.schoolname || user?.name || reg.schoolName || "Unknown School";
            const schoolForane = user?.forane || "Unknown Forane";
            const schoolParishId = user?.uid || user?.id || sid;

            // 2. Search Filter (by school name)
            if (searchQuery && !schoolName.toLowerCase().includes(searchQuery.toLowerCase())) {
                return;
            }

            // 3. Forane Filter
            if (selectedForane !== "All" && schoolForane !== selectedForane) {
                return;
            }

            // 4. Parish Filter
            if (selectedParishId !== "All" && schoolParishId !== selectedParishId) {
                return;
            }

            const countToAdd = reg.isCountOnly ? (reg.studentCount || 1) : 1;
            total += countToAdd;

            // Program Distribution
            pCounts[pName] = (pCounts[pName] || 0) + countToAdd;

            // School Ranking
            sCounts[sid] = (sCounts[sid] || 0) + countToAdd;
            if (!sNames[sid]) sNames[sid] = schoolName;
        });

        // Sort Program Performance
        const performance = Object.entries(pCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const maxCount = performance.length > 0 ? performance[0].count : 0;

        // Sort Top Schools
        const leaderboard = Object.entries(sCounts)
            .map(([id, count]) => ({ id, name: sNames[id], count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5

        return { total, performance, leaderboard, maxCount };
    }, [registrations, programs, selectedProgramFilter, users, searchQuery, selectedForane, selectedParishId]);

    const activeProgram = useMemo(() => {
        return programs.find(p => p.name === selectedProgramFilter);
    }, [programs, selectedProgramFilter]);

    const audienceLabel = useMemo(() => {
        if (selectedProgramFilter === "All") return "Participants";
        if (activeProgram?.targetAudience === "teacher") return "Teachers";
        if (activeProgram?.targetAudience === "both") return "Participants";
        return "Students";
    }, [selectedProgramFilter, activeProgram]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Program Analytics</h1>
                    <p className="text-sm text-muted-foreground tracking-tight">Real-time registration insights and school rankings</p>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="shadow-sm border-none bg-white/60 backdrop-blur-md dark:bg-card/60 sticky top-0 z-20">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Search */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 ml-1">
                                <Search className="h-3 w-3" /> Search Schools
                            </Label>
                            <Input
                                placeholder="Search school name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 bg-white dark:bg-gray-800 border-gray-200"
                            />
                        </div>

                        {/* Program */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 ml-1">
                                <BarChart4 className="h-3 w-3" /> Program
                            </Label>
                            <Select value={selectedProgramFilter} onValueChange={setSelectedProgramFilter}>
                                <SelectTrigger className="h-9 bg-white dark:bg-gray-800 border-gray-200">
                                    <SelectValue placeholder="All Programs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Programs</SelectItem>
                                    {programs.map((p) => (
                                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Forane */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 ml-1">
                                <MapPin className="h-3 w-3" /> Forane
                            </Label>
                            <Select
                                value={selectedForane}
                                onValueChange={(v) => {
                                    setSelectedForane(v);
                                    setSelectedParishId("All");
                                }}
                            >
                                <SelectTrigger className="h-9 bg-white dark:bg-gray-800 border-gray-200">
                                    <SelectValue placeholder="All Foranes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Foranes</SelectItem>
                                    {uniqueForanes.map((f) => (
                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Parish */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 ml-1">
                                <Church className="h-3 w-3" /> Parish
                            </Label>
                            <Select value={selectedParishId} onValueChange={setSelectedParishId}>
                                <SelectTrigger className="h-9 bg-white dark:bg-gray-800 border-gray-200">
                                    <SelectValue placeholder="All Parishes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Parishes</SelectItem>
                                    {dynamicParishes.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Stats Card */}
            <Card className="bg-gradient-to-br from-blue-700 to-blue-600 text-white border-none shadow-lg overflow-hidden relative">
                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                    <BarChart4 size={200} />
                </div>
                <CardContent className="p-8 relative z-10">
                    <div className="flex items-center gap-2 text-blue-100 mb-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">
                            Total Registrations
                        </span>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-6xl font-bold tracking-tighter">{stats.total}</h2>
                        <div className="flex flex-col">
                            <span className="text-blue-100 text-lg font-medium leading-none">Registered</span>
                            <span className="text-blue-100 text-lg font-medium">{audienceLabel}</span>
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-transparent py-1 px-4 text-xs">
                            {stats.performance.length} Programs Covered
                        </Badge>
                        {(selectedForane !== "All" || selectedParishId !== "All") && (
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-transparent py-1 px-4 text-xs">
                                Geographically Filtered
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance List */}
                <Card className="shadow-sm border-none bg-white/50 backdrop-blur-md dark:bg-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Program Performance</CardTitle>
                                <CardDescription>Registration volume distribution</CardDescription>
                            </div>
                            <Users className="h-5 w-5 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {stats.performance.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground italic">No registration data matching the filters.</div>
                        ) : (
                            stats.performance.map((p, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                                        <span className="font-extrabold text-blue-600">{p.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${(p.count / (stats.maxCount || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Top Participating Schools */}
                <Card className="shadow-sm border-none bg-white/50 backdrop-blur-md dark:bg-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Top Participating Schools</CardTitle>
                                <CardDescription>Institutions with most sign-ups</CardDescription>
                            </div>
                            <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        {stats.leaderboard.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground italic">No participants found matching criteria.</div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {stats.leaderboard.map((s, i) => {
                                    const rank = i + 1;
                                    return (
                                        <div
                                            key={s.id}
                                            className="flex items-center group px-6 py-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-10 flex-shrink-0">
                                                <span className={`
                          h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold
                          ${rank === 1 ? "bg-yellow-100 text-yellow-700" : ""}
                          ${rank === 2 ? "bg-gray-100 text-gray-600" : ""}
                          ${rank === 3 ? "bg-orange-100 text-orange-700" : ""}
                          ${rank > 3 ? "text-gray-400" : ""}
                        `}>
                                                    #{rank}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0 mx-2">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{s.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{s.count}</span>
                                                <ArrowUpRight className="h-3 w-3 text-blue-400" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="mt-4 px-6 mb-2">
                            <Button variant="ghost" className="w-full text-blue-600 text-xs font-semibold uppercase tracking-tighter" onClick={() => navigate("/program-registrations")}>
                                View All Registrations
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
