import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Teacher } from "../types";
import { TeacherService } from "../services/teacherService";
import { getUsers, UserData } from "@/features/users/services/userService";
import { TeacherList } from "./TeacherList";

interface TeacherAssignmentProps {
  refreshTrigger: number;
  onEditTeacher?: (teacher: Teacher) => void;
}

export function TeacherAssignment({
  refreshTrigger,
  onEditTeacher,
}: TeacherAssignmentProps) {
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [dirFilteredTeachers, setDirFilteredTeachers] = useState<Teacher[]>([]);
  const [dirFilterClass, setDirFilterClass] = useState<string>("All");
  const [dirFilterForane, setDirFilterForane] = useState<string>("All");
  const [dirFilterSchoolId, setDirFilterSchoolId] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [teachersData, usersData] = await Promise.all([
          TeacherService.getTeachers(),
          getUsers(),
        ]);
        const allUsers = usersData as UserData[];
        const schoolsList = allUsers
          .filter((u) => u.role === "school")
          .map((u) => ({
            ...u,
            id: u.uid || u.id,
            name:
              (u as any).schoolname ||
              (u as any).name ||
              (u as any).displayName ||
              u.email,
            forane: (u as any).forane || "",
          }));
        setAllTeachers(teachersData);
        setSchools(schoolsList);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    let result = allTeachers;

    if (dirFilterForane && dirFilterForane !== "All") {
      result = result.filter((t) => {
        const teacherSchool = schools.find((s) => s.id === t.schoolId);
        return teacherSchool?.forane === dirFilterForane;
      });
    }

    if (dirFilterSchoolId && dirFilterSchoolId !== "All") {
      result = result.filter((t) => t.schoolId === dirFilterSchoolId);
    }

    if (dirFilterClass && dirFilterClass !== "All") {
      result = result.filter((t) => {
        if (!t.classes) return false;
        return Array.isArray(t.classes)
          ? t.classes.includes(dirFilterClass)
          : String(t.classes) === dirFilterClass;
      });
    }

    setDirFilteredTeachers(result);
  }, [dirFilterForane, dirFilterSchoolId, dirFilterClass, allTeachers, schools]);

  // Clean up selected IDs if they are filtered out
  useEffect(() => {
    setSelectedTeacherIds(prev => prev.filter(id => dirFilteredTeachers.some(t => t.id === id)));
  }, [dirFilteredTeachers]);

  const handleDelete = async (teacher: Teacher) => {
    if (!window.confirm(`Are you sure you want to delete ${teacher.name}?`))
      return;
    try {
      await TeacherService.deleteTeacher(teacher.id);
      toast.success("Teacher deleted successfully");
      setAllTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
    } catch (error) {
      toast.error("Failed to delete teacher");
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedTeacherIds) {
      try {
        await TeacherService.deleteTeacher(id);
        successCount++;
      } catch (error) {
        console.error("Error deleting teacher:", id, error);
        failCount++;
      }
    }
    toast.success(`Successfully deleted ${successCount} teacher(s).`);
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} teacher(s).`);
    }
    setSelectedTeacherIds([]);
    setIsBulkDeleteDialogOpen(false);
    setAllTeachers((prev) => prev.filter((t) => !selectedTeacherIds.includes(t.id)));
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  const uniqueClasses = Array.from(
    new Set(
      allTeachers.flatMap((t) =>
        Array.isArray(t.classes) ? t.classes : t.classes ? [String(t.classes)] : []
      )
    )
  ).sort();

  const uniqueForanes = Array.from(
    new Set(schools.map((s) => s.forane).filter(Boolean))
  ).sort() as string[];

  const filteredSchools =
    dirFilterForane === "All"
      ? schools
      : schools.filter((s) => s.forane === dirFilterForane);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Teacher Directory</CardTitle>
        <CardDescription>
          View and manage all registered teachers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4 border-b">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Forane</label>
            <Select
              onValueChange={(val) => {
                setDirFilterForane(val);
                setDirFilterSchoolId("All");
              }}
              value={dirFilterForane}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Foranes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Foranes</SelectItem>
                {uniqueForanes.map((forane) => (
                  <SelectItem key={forane} value={forane}>
                    {forane}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Sunday School</label>
            <Select
              onValueChange={setDirFilterSchoolId}
              value={dirFilterSchoolId}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Schools</SelectItem>
                {filteredSchools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Class</label>
            <Select onValueChange={setDirFilterClass} value={dirFilterClass}>
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

        <div className="pt-2">
          {dirFilteredTeachers.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 mb-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTeacherIds.length === dirFilteredTeachers.length && dirFilteredTeachers.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTeacherIds(dirFilteredTeachers.map(t => t.id));
                    } else {
                      setSelectedTeacherIds([]);
                    }
                  }}
                  id="select-all-teachers"
                />
                <label htmlFor="select-all-teachers" className="text-sm font-medium cursor-pointer">
                  Select All ({dirFilteredTeachers.length} profiles)
                </label>
              </div>
              {selectedTeacherIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedTeacherIds.length})
                </Button>
              )}
            </div>
          )}

          <h3 className="text-sm font-medium mb-4 text-muted-foreground">
            Showing {dirFilteredTeachers.length} Teachers
          </h3>
          <TeacherList
            teachers={dirFilteredTeachers}
            showAssignAction={false}
            showStatus={false}
            onDeleteClick={handleDelete}
            onEditClick={onEditTeacher}
            selectedIds={selectedTeacherIds}
            onToggleSelect={(id) => {
              setSelectedTeacherIds(prev =>
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
              );
            }}
          />
        </div>

        <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Multiple Teachers</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedTeacherIds.length} selected teacher(s)?
                This action is permanent and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Permanent
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
