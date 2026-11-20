import React, { useState, useMemo } from "react";
import {
  Calendar,
  School,
  MapPin,
  User,
  Clock,
  Search,
  Filter,
  CalendarDays,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AnimatorWithUser,
  AnimatorAssignment,
  formatAcademicYear,
} from "../services/animatorService";

interface AssignmentSchedulePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animators: AnimatorWithUser[];
  selectedYear: string;
}

export interface FlattenedAssignment {
  id: string; // unique key
  animatorId: string;
  animatorName: string;
  animatorAddress?: string;
  animatorEmail: string;
  animatorPhone?: string;
  animatorImage?: string;
  homeParish?: string;
  schoolUserId: string;
  schoolName: string;
  parish: string;
  forane: string;
  year: string;
  assignedDate?: string; // YYYY-MM-DD
}

export function AssignmentSchedulePreview({
  open,
  onOpenChange,
  animators,
  selectedYear,
}: AssignmentSchedulePreviewProps) {
  const [viewMode, setViewMode] = useState<"date" | "forane" | "animator">("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [foraneFilter, setForaneFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Date formatting helper
  const formatDateFull = (dateStr?: string): string => {
    if (!dateStr) return "Unscheduled";
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr?: string): string => {
    if (!dateStr) return "No date set";
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Flatten assignments for the selected academic year
  const allAssignments = useMemo(() => {
    const list: FlattenedAssignment[] = [];
    animators.forEach((animator) => {
      const filteredAsgs =
        selectedYear === "All"
          ? animator.assignments
          : animator.assignments.filter((a) => a.year === selectedYear);

      filteredAsgs.forEach((asg, idx) => {
        list.push({
          id: `${animator.id}_${asg.schoolUserId}_${asg.year}_${idx}`,
          animatorId: animator.id,
          animatorName: animator.name,
          animatorAddress: animator.address,
          animatorEmail: animator.email,
          animatorPhone: animator.phoneNumber,
          animatorImage: animator.profileImageUrl,
          homeParish: animator.parishName || animator.parish,
          schoolUserId: asg.schoolUserId,
          schoolName: asg.schoolname,
          parish: asg.parish,
          forane: asg.forane || "General",
          year: asg.year,
          assignedDate: asg.assignedDate?.trim() || undefined,
        });
      });
    });
    return list;
  }, [animators, selectedYear]);

  // Distinct lists for dropdowns
  const availableForanes = useMemo(() => {
    const set = new Set<string>();
    allAssignments.forEach((a) => {
      if (a.forane) set.add(a.forane.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allAssignments]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    allAssignments.forEach((a) => {
      if (a.assignedDate) set.add(a.assignedDate);
    });
    return Array.from(set).sort();
  }, [allAssignments]);

  // Filtered assignments based on search and dropdowns
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter((asg) => {
      // Forane filter
      if (foraneFilter !== "all" && asg.forane.toLowerCase() !== foraneFilter.toLowerCase()) {
        return false;
      }

      // Date filter
      if (dateFilter === "scheduled" && !asg.assignedDate) return false;
      if (dateFilter === "unscheduled" && asg.assignedDate) return false;
      if (
        dateFilter !== "all" &&
        dateFilter !== "scheduled" &&
        dateFilter !== "unscheduled" &&
        asg.assignedDate !== dateFilter
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = asg.animatorName.toLowerCase().includes(q);
        const matchesAddress = (asg.animatorAddress || "").toLowerCase().includes(q);
        const matchesSchool = asg.schoolName.toLowerCase().includes(q);
        const matchesParish = asg.parish.toLowerCase().includes(q);
        const matchesForane = asg.forane.toLowerCase().includes(q);
        const matchesDate = (asg.assignedDate || "").toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesAddress &&
          !matchesSchool &&
          !matchesParish &&
          !matchesForane &&
          !matchesDate
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allAssignments, foraneFilter, dateFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = allAssignments.length;
    const scheduled = allAssignments.filter((a) => !!a.assignedDate).length;
    const unscheduled = total - scheduled;
    const distinctAnimators = new Set(allAssignments.map((a) => a.animatorId)).size;
    const distinctSchools = new Set(allAssignments.map((a) => a.schoolUserId)).size;
    return { total, scheduled, unscheduled, distinctAnimators, distinctSchools };
  }, [allAssignments]);

  // 1. Grouped by Date structure
  const groupedByDate = useMemo(() => {
    const groups: { [dateKey: string]: FlattenedAssignment[] } = {};
    const unscheduledList: FlattenedAssignment[] = [];

    filteredAssignments.forEach((asg) => {
      if (asg.assignedDate) {
        if (!groups[asg.assignedDate]) {
          groups[asg.assignedDate] = [];
        }
        groups[asg.assignedDate].push(asg);
      } else {
        unscheduledList.push(asg);
      }
    });

    // Sort items within each date by Forane, then School
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const foraneComp = a.forane.localeCompare(b.forane);
        if (foraneComp !== 0) return foraneComp;
        return a.schoolName.localeCompare(b.schoolName);
      });
    });

    const sortedDates = Object.keys(groups).sort();
    return {
      scheduledDates: sortedDates.map((dateKey) => ({
        date: dateKey,
        assignments: groups[dateKey],
      })),
      unscheduled: unscheduledList,
    };
  }, [filteredAssignments]);

  // 2. Grouped by Forane structure
  const groupedByForane = useMemo(() => {
    const groups: { [foraneKey: string]: FlattenedAssignment[] } = {};
    filteredAssignments.forEach((asg) => {
      const f = asg.forane || "General";
      if (!groups[f]) groups[f] = [];
      groups[f].push(asg);
    });

    // Sort assignments inside each forane by date (earliest first, unscheduled last)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (a.assignedDate && b.assignedDate) {
          const c = a.assignedDate.localeCompare(b.assignedDate);
          if (c !== 0) return c;
        } else if (a.assignedDate && !b.assignedDate) {
          return -1;
        } else if (!a.assignedDate && b.assignedDate) {
          return 1;
        }
        return a.schoolName.localeCompare(b.schoolName);
      });
    });

    const sortedForanes = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedForanes.map((foraneName) => ({
      forane: foraneName,
      assignments: groups[foraneName],
    }));
  }, [filteredAssignments]);

  // 3. Grouped by Animator structure
  const groupedByAnimator = useMemo(() => {
    const groups: {
      [animatorId: string]: {
        animator: {
          id: string;
          name: string;
          address?: string;
          email: string;
          phone?: string;
          image?: string;
          homeParish?: string;
        };
        assignments: FlattenedAssignment[];
      };
    } = {};

    filteredAssignments.forEach((asg) => {
      if (!groups[asg.animatorId]) {
        groups[asg.animatorId] = {
          animator: {
            id: asg.animatorId,
            name: asg.animatorName,
            address: asg.animatorAddress,
            email: asg.animatorEmail,
            phone: asg.animatorPhone,
            image: asg.animatorImage,
            homeParish: asg.homeParish,
          },
          assignments: [],
        };
      }
      groups[asg.animatorId].assignments.push(asg);
    });

    // Sort assignments of each animator chronologically by date
    Object.values(groups).forEach((g) => {
      g.assignments.sort((a, b) => {
        if (a.assignedDate && b.assignedDate) {
          return a.assignedDate.localeCompare(b.assignedDate);
        }
        if (a.assignedDate && !b.assignedDate) return -1;
        if (!a.assignedDate && b.assignedDate) return 1;
        return a.schoolName.localeCompare(b.schoolName);
      });
    });

    // Sort animators alphabetically by name
    return Object.values(groups).sort((a, b) =>
      a.animator.name.localeCompare(b.animator.name)
    );
  }, [filteredAssignments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>Assignment Schedule Preview</span>
                    <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800 font-medium">
                      Academic Year {selectedYear === "All" ? "All Years" : formatAcademicYear(selectedYear)}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Clear chronological schedule ordered by assignment dates and foranes
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/60 dark:border-blue-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Total: {stats.total} assignments</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium border border-purple-200/60 dark:border-purple-800">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              <span>Scheduled: {stats.scheduled}</span>
            </div>
            {stats.unscheduled > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60 dark:border-amber-800">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>Pending Date: {stats.unscheduled}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              <Users className="h-3.5 w-3.5 text-gray-500" />
              <span>{stats.distinctAnimators} animators</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              <School className="h-3.5 w-3.5 text-gray-500" />
              <span>{stats.distinctSchools} Sunday schools</span>
            </div>
          </div>
        </DialogHeader>

        {/* View Switcher & Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("date")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "date"
                    ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-purple-600" />
                <span>Group by Date</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("forane")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "forane"
                    ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>Group by Forane</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("animator")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "animator"
                    ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>Group by Animator</span>
              </button>
            </div>

            {/* Live Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search animator, school, parish..."
                className="pl-8 text-xs h-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filters:
            </span>

            {/* Forane Select */}
            <div className="w-[180px]">
              <Select value={foraneFilter} onValueChange={setForaneFilter}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="All Foranes" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Foranes</SelectItem>
                  {availableForanes.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Select */}
            <div className="w-[200px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="scheduled">Has Scheduled Date</SelectItem>
                  <SelectItem value="unscheduled">Pending Date ({stats.unscheduled})</SelectItem>
                  {availableDates.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/40">
                        Scheduled Dates ({availableDates.length})
                      </div>
                      {availableDates.map((d) => (
                        <SelectItem key={d} value={d}>
                          {formatDateShort(d)}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {(foraneFilter !== "all" || dateFilter !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-red-600 px-2 cursor-pointer"
                onClick={() => {
                  setForaneFilter("all");
                  setDateFilter("all");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </Button>
            )}

            <div className="ml-auto text-muted-foreground text-[11px]">
              Showing {filteredAssignments.length} of {allAssignments.length} assignments
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50 dark:bg-gray-950/20">
          {filteredAssignments.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                No assignments found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search terms or filters above.
              </p>
            </div>
          ) : viewMode === "date" ? (
            /* ================= VIEW 1: GROUPED BY DATE ================= */
            <div className="space-y-6">
              {groupedByDate.scheduledDates.map(({ date, assignments }) => (
                <div
                  key={date}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  {/* Date Header Banner */}
                  <div className="px-4 py-3 bg-purple-50/70 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-600 text-white rounded-lg shadow-sm">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                          {formatDateFull(date)}
                        </h3>
                        <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                          Scheduled Sunday School Evaluations
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2.5 py-0.5">
                      {assignments.length} {assignments.length === 1 ? "Assignment" : "Assignments"}
                    </Badge>
                  </div>

                  {/* Assignments Grid */}
                  <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {assignments.map((asg) => (
                      <div
                        key={asg.id}
                        className="p-3.5 rounded-lg border border-gray-150 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all space-y-2.5"
                      >
                        {/* Animator Header */}
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700 shrink-0">
                            <AvatarImage src={asg.animatorImage} />
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                              {asg.animatorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                              {asg.animatorName}
                              {asg.animatorAddress ? ` ${asg.animatorAddress}` : ""}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {asg.animatorEmail}
                            </p>
                          </div>
                        </div>

                        {/* Destination School & Parish */}
                        <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 space-y-1">
                          <div className="flex items-start gap-1.5">
                            <School className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {asg.schoolName}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">
                                {asg.parish}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-muted-foreground font-normal truncate"
                            >
                              📍 {asg.forane}
                            </Badge>
                            {asg.animatorPhone && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5" />
                                {asg.animatorPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Unscheduled Section */}
              {groupedByDate.unscheduled.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                          Pending Date Scheduling
                        </h3>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          Assigned to schools but evaluation date has not been set yet
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-amber-300 text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 text-xs">
                      {groupedByDate.unscheduled.length} Assignments
                    </Badge>
                  </div>

                  <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groupedByDate.unscheduled.map((asg) => (
                      <div
                        key={asg.id}
                        className="p-3.5 rounded-lg border border-dashed border-amber-200 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/10 space-y-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-bold">
                              {asg.animatorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">
                              {asg.animatorName}
                              {asg.animatorAddress ? ` ${asg.animatorAddress}` : ""}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {asg.animatorEmail}
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-amber-100 dark:border-amber-900/30">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            🏫 {asg.schoolName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {asg.parish} • {asg.forane}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === "forane" ? (
            /* ================= VIEW 2: GROUPED BY FORANE ================= */
            <div className="space-y-6">
              {groupedByForane.map(({ forane, assignments }) => (
                <div
                  key={forane}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  {/* Forane Header Banner */}
                  <div className="px-4 py-3 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                          {forane} Forane
                        </h3>
                        <p className="text-[11px] text-blue-700 dark:text-blue-300">
                          Sunday School assignments within {forane}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-800 dark:text-blue-200 bg-blue-100/50 text-xs">
                      {assignments.length} {assignments.length === 1 ? "Assignment" : "Assignments"}
                    </Badge>
                  </div>

                  {/* Assignments Table/List */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {assignments.map((asg) => (
                      <div
                        key={asg.id}
                        className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        {/* School & Parish */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 shrink-0 mt-0.5">
                            <School className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {asg.schoolName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              Parish: {asg.parish}
                            </p>
                          </div>
                        </div>

                        {/* Date Scheduled */}
                        <div className="sm:w-[200px] shrink-0">
                          {asg.assignedDate ? (
                            <div className="inline-flex items-center gap-1.5 text-xs bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold">
                              <Calendar className="h-3 w-3 text-purple-600" />
                              <span>{formatDateShort(asg.assignedDate)}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                              <Clock className="h-3 w-3" />
                              <span>Date pending</span>
                            </span>
                          )}
                        </div>

                        {/* Assigned Animator */}
                        <div className="flex items-center gap-2 sm:w-[220px] shrink-0">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-[11px] font-bold">
                              {asg.animatorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                              {asg.animatorName}
                              {asg.animatorAddress ? ` ${asg.animatorAddress}` : ""}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {asg.animatorEmail}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= VIEW 3: GROUPED BY ANIMATOR ================= */
            <div className="space-y-4">
              {groupedByAnimator.map(({ animator, assignments }) => (
                <div
                  key={animator.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-sm p-4 space-y-3"
                >
                  {/* Animator Profile Row */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                        <AvatarImage src={animator.image} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                          {animator.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {animator.name}
                          {animator.address ? ` ${animator.address}` : ""}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{animator.email}</span>
                          {animator.phone && <span>• {animator.phone}</span>}
                          {animator.homeParish && <span>• Home: {animator.homeParish}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {assignments.length} {assignments.length === 1 ? "Assignment" : "Assignments"}
                    </Badge>
                  </div>

                  {/* Ordered Assignment List of this animator */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {assignments.map((asg, index) => (
                      <div
                        key={asg.id}
                        className="p-3 rounded-lg border border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-start gap-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                              {asg.schoolName}
                            </p>
                            {asg.assignedDate ? (
                              <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] px-2 py-0 shrink-0 font-semibold">
                                <Calendar className="h-2.5 w-2.5 mr-1" />
                                {formatDateShort(asg.assignedDate)}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                                Date pending
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            Parish: {asg.parish} • Forane: {asg.forane}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
