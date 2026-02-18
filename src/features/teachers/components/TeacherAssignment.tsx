import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

import { Teacher, Parish } from "../types";
import { TeacherService } from "../services/teacherService";
import { ParishService } from "@/features/parishes/services/parishService";
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
  const [dirFilteredTeachers, setDirFilteredTeachers] = useState<Teacher[]>([]);
  const [dirFilterClass, setDirFilterClass] = useState<string>("All");
  const [dirFilterForane, setDirFilterForane] = useState<string>("All");
  const [dirFilterParishId, setDirFilterParishId] = useState<string>("All");
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    let result = allTeachers;
    if (dirFilterForane && dirFilterForane !== "All") {
      result = result.filter((t) => {
        const teacherParish = parishes.find((p) => p.id === t.parishId);
        return teacherParish?.forane === dirFilterForane;
      });
    }
    if (dirFilterParishId && dirFilterParishId !== "All") {
      result = result.filter((t) => t.parishId === dirFilterParishId);
    }
    if (dirFilterClass && dirFilterClass !== "All") {
      result = result.filter(
        (t) => t.classes && t.classes.includes(dirFilterClass),
      );
    }
    setDirFilteredTeachers(result);
  }, [
    dirFilterForane,
    dirFilterParishId,
    dirFilterClass,
    allTeachers,
    parishes,
  ]);

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

  const uniqueForanes = Array.from(
    new Set(parishes.map((p) => p.forane).filter(Boolean)),
  ).sort() as string[];

  const filteredParishes =
    dirFilterForane === "All"
      ? parishes
      : parishes.filter((p) => p.forane === dirFilterForane);

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
                setDirFilterParishId("All");
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
            <label className="text-sm font-medium">Filter by Home Parish</label>
            <Select
              onValueChange={setDirFilterParishId}
              value={dirFilterParishId}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Parishes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Parishes</SelectItem>
                {filteredParishes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
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
          <h3 className="text-sm font-medium mb-4 text-muted-foreground">
            Showing {dirFilteredTeachers.length} Teachers
          </h3>
          <TeacherList
            teachers={dirFilteredTeachers}
            showAssignAction={false}
            onDeleteClick={handleDelete}
            onEditClick={onEditTeacher}
          />
        </div>
      </CardContent>
    </Card>
  );
}
