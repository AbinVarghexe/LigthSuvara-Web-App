import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronsUpDown,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { Teacher, Parish } from "../types";
import { TeacherService } from "../services/teacherService";
import { AssignmentService } from "../services/assignmentService";
import { ParishService } from "@/features/parishes/services/parishService";
import { TeacherList } from "./TeacherList";
import { PdfService } from "../services/pdfService";

interface TeacherAssignmentProps {
  refreshTrigger: number; // Prop to trigger refresh from parent
}

export function TeacherAssignment({ refreshTrigger }: TeacherAssignmentProps) {
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);

  // Assignment Tab State
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [filterParishId, setFilterParishId] = useState<string>("All");
  const [targetParishId, setTargetParishId] = useState<string | null>(null);

  // Multi-Select Class State
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isClassOpen, setIsClassOpen] = useState(false);

  // Directory Tab State
  const [dirFilteredTeachers, setDirFilteredTeachers] = useState<Teacher[]>([]);
  const [dirFilterClass, setDirFilterClass] = useState<string>("All");
  const [dirFilterParishId, setDirFilterParishId] = useState<string>("All");

  const [parishes, setParishes] = useState<Parish[]>([]);

  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [teachersData, parishesData] = await Promise.all([
          TeacherService.getTeachers(),
          ParishService.getAllParishes(),
        ]);
        setAllTeachers(teachersData);
        setParishes(parishesData);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger]);

  // Apply Filters for Assignment Tab
  useEffect(() => {
    let result = allTeachers;

    // Filter by Source Parish
    if (filterParishId && filterParishId !== "All") {
      result = result.filter((t) => t.parishId === filterParishId);
    }

    // Automatically filter out teachers from the Target Parish if selected
    if (targetParishId) {
      result = result.filter((t) => t.parishId !== targetParishId);
    }

    // Filter by Classes (Multi-Select)
    if (selectedClasses.length > 0) {
      result = result.filter(
        (t) =>
          t.classes && t.classes.some((cls) => selectedClasses.includes(cls)),
      );
    }

    setFilteredTeachers(result);
  }, [filterParishId, selectedClasses, targetParishId, allTeachers]);

  // Apply Filters for Directory Tab
  useEffect(() => {
    let result = allTeachers;

    if (dirFilterParishId && dirFilterParishId !== "All") {
      result = result.filter((t) => t.parishId === dirFilterParishId);
    }

    if (dirFilterClass && dirFilterClass !== "All") {
      result = result.filter(
        (t) => t.classes && t.classes.includes(dirFilterClass),
      );
    }

    setDirFilteredTeachers(result);
  }, [dirFilterParishId, dirFilterClass, allTeachers]);

  const handleDirectAssign = async (teacher: Teacher) => {
    if (!targetParishId) {
      toast.error("Please select a Target Parish first");
      return;
    }

    if (teacher.parishId === targetParishId) {
      toast.error("Cannot assign teacher to their home parish");
      return;
    }

    if (
      !window.confirm(
        `Assign ${teacher.name} to ${parishes.find((p) => p.id === targetParishId)?.name}?`,
      )
    ) {
      return;
    }

    setAssigning(teacher.id);

    try {
      await AssignmentService.assignTeacher(
        teacher.id,
        targetParishId,
        "General",
      );

      toast.success(`Assigned ${teacher.name} successfully`);

      setAllTeachers((prev) =>
        prev.map((t) =>
          t.id === teacher.id
            ? { ...t, assigned: true, assignedParishId: targetParishId }
            : t,
        ),
      );

      const targetParish = parishes.find((p) => p.id === targetParishId);
      if (targetParish) {
        setTimeout(async () => {
          await PdfService.generateFatherReport(teacher, targetParish, "General");
          await PdfService.generateTeacherDutyReport(
            teacher,
            targetParish,
            "General",
          );
          toast.info("PDF Orders generated");
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.message || "Assignment failed");
    } finally {
      setAssigning(null);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!window.confirm(`Are you sure you want to delete ${teacher.name}?`))
      return;

    try {
      await TeacherService.deleteTeacher(teacher.id);
      toast.success("Teacher deleted successfully");
      setAllTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
    } catch (error) {
      toast.error("Failed to delete teacher");
      console.error(error);
    }
  };

  const toggleClassSelection = (cls: string) => {
    setSelectedClasses((current) =>
      current.includes(cls)
        ? current.filter((c) => c !== cls)
        : [...current, cls],
    );
  };

  const toggleSelectAllClasses = () => {
    if (selectedClasses.length === uniqueClasses.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(uniqueClasses);
    }
  };

  if (loading) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  const uniqueClasses = Array.from(
    new Set(allTeachers.flatMap((t) => t.classes || [])),
  ).sort();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="list">All Teachers</TabsTrigger>
          <TabsTrigger value="assignment">Assignment Panel</TabsTrigger>
        </TabsList>

        {/* TAB 1: ALL TEACHERS LIST */}
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Teacher Directory</CardTitle>
              <CardDescription>
                View and manage all registered teachers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Directory Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Filter by Home Parish
                  </label>
                  <Select
                    onValueChange={setDirFilterParishId}
                    value={dirFilterParishId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Parishes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Parishes</SelectItem>
                      {parishes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Class</label>
                  <Select
                    onValueChange={setDirFilterClass}
                    value={dirFilterClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Classes</SelectItem>
                      {uniqueClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Directory Results */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                  Showing {dirFilteredTeachers.length} Teachers
                </h3>
                <TeacherList
                  teachers={dirFilteredTeachers}
                  showAssignAction={false}
                  onDeleteClick={handleDelete}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ASSIGNMENT PANEL (PR STYLE) */}
        <TabsContent value="assignment">
          <div className="space-y-6">
            {/* PR-Style Selection Bar */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* LEFT: FROM (SOURCE) */}
                  <div className="flex-1 w-full space-y-4">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ring-1 ring-blue-200">
                        FROM
                      </span>
                      Source (Teachers)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Source Parish */}
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-1">
                          Home Parish
                        </span>
                        <Select
                          onValueChange={setFilterParishId}
                          value={filterParishId}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="All Sources" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Parishes</SelectItem>
                            {parishes.map((p) => (
                              <SelectItem
                                key={p.id}
                                value={p.id}
                                disabled={p.id === targetParishId}
                              >
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Source Classes (Multi-Select) */}
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-1">
                          Classes
                        </span>
                        <Popover
                          open={isClassOpen}
                          onOpenChange={setIsClassOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isClassOpen}
                              className="w-full justify-between bg-background px-3 font-normal"
                            >
                              {selectedClasses.length > 0
                                ? `${selectedClasses.length} selected`
                                : "Select classes..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search class..." />
                              <CommandList>
                                <CommandEmpty>No class found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={toggleSelectAllClasses}
                                    className="font-medium"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedClasses.length ===
                                          uniqueClasses.length &&
                                          uniqueClasses.length > 0
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    Select All
                                  </CommandItem>
                                  {uniqueClasses.map((cls) => (
                                    <CommandItem
                                      key={cls}
                                      value={cls}
                                      onSelect={() => toggleClassSelection(cls)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedClasses.includes(cls)
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {cls}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {/* Selected Classes Tags */}
                    {selectedClasses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedClasses.map((cls) => (
                          <Badge
                            key={cls}
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px] cursor-pointer"
                            onClick={() => toggleClassSelection(cls)}
                          >
                            {cls} ✕
                          </Badge>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] px-1"
                          onClick={() => setSelectedClasses([])}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* MIDDLE: DIRECTION ARROW */}
                  <div className="flex items-center justify-center text-muted-foreground pt-6">
                    <ArrowRight className="w-8 h-8 hidden md:block text-slate-300" />
                    <ArrowLeft className="w-8 h-8 md:hidden rotate-90 text-slate-300" />
                  </div>

                  {/* RIGHT: TO (TARGET) */}
                  <div className="flex-1 w-full space-y-4">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full ring-1 ring-green-200">
                        TO
                      </span>
                      Destination (Assign Here)
                    </label>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground ml-1">
                        Target Parish
                      </span>
                      <Select
                        onValueChange={setTargetParishId}
                        value={targetParishId || ""}
                      >
                        <SelectTrigger className="h-10 text-md font-medium bg-background border-green-200 ring-offset-green-50">
                          <SelectValue placeholder="Select Target..." />
                        </SelectTrigger>
                        <SelectContent>
                          {parishes.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              disabled={p.id === filterParishId}
                            >
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Available Teachers found ({filteredTeachers.length})
                </h2>
                {targetParishId && (
                  <span className="text-sm text-muted-foreground">
                    Excluding teachers from{" "}
                    {parishes.find((p) => p.id === targetParishId)?.name}
                  </span>
                )}
              </div>

              {filteredTeachers.length > 0 ? (
                <TeacherList
                  teachers={filteredTeachers}
                  showAssignAction={!!targetParishId}
                  onAssignClick={handleDirectAssign}
                  assigningId={assigning}
                  onDeleteClick={handleDelete}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p>No available teachers found matching criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
