import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, FileDown } from "lucide-react";
import { toast } from "sonner";

import { AssignmentService } from "../services/assignmentService";
import { TeacherService } from "../services/teacherService";
import { ParishService } from "@/features/parishes/services/parishService";
import { Teacher, Parish } from "../types";

interface Assignment {
  id: string;
  teacherId: string;
  parishId: string;
  class: string;
  dateAssigned: any;
}

interface AssignmentHistoryProps {
  refreshTrigger: number;
}

export function AssignmentHistory({ refreshTrigger }: AssignmentHistoryProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters

  const [selectedForane, setSelectedForane] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsData, teachersData, parishesData] = await Promise.all([
        AssignmentService.getAssignments(),
        TeacherService.getTeachers(),
        ParishService.getAllParishes(),
      ]);
      setAssignments(assignmentsData as Assignment[]);
      setTeachers(teachersData);
      setParishes(parishesData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load assignment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleDelete = async (assignmentId: string, teacherId: string) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    try {
      await AssignmentService.deleteAssignment(assignmentId, teacherId);
      toast.success("Assignment deleted");
      loadData(); // Reload to refresh list and teacher status
    } catch (error) {
      toast.error("Failed to delete assignment");
    }
  };

  const generateReport = () => {
    // Generate PDF report for visible assignments
    // This assumes PdfService has a method for this, or we create one
    // distinct from the single letter generation
    toast.info("Report generation coming soon!");
  };

  // Filter Logic
  const filteredAssignments = assignments.filter((assignment) => {
    const teacher = teachers.find((t) => t.id === assignment.teacherId);
    const assignedParish = parishes.find((p) => p.id === assignment.parishId);

    if (!teacher || !assignedParish) return false;

    // Search
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchLower) ||
      assignedParish.name.toLowerCase().includes(searchLower);

    // Forane Filter
    const matchesForane =
      selectedForane === "All" || assignedParish.forane === selectedForane;

    return matchesSearch && matchesForane;
  });

  const uniqueForanes = Array.from(
    new Set(parishes.map((p) => p.forane).filter(Boolean)),
  ).sort();

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedForane} onValueChange={setSelectedForane}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Forane" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Foranes</SelectItem>
              {uniqueForanes.map((f) => (
                <SelectItem key={f as string} value={f as string}>
                  {f as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search Observer or Parish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Button variant="outline" onClick={generateReport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Assignment History ({filteredAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Observer Name</TableHead>
                <TableHead>Home Parish</TableHead>
                <TableHead>Assigned Parish</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => {
                const teacher = teachers.find(
                  (t) => t.id === assignment.teacherId,
                );
                const homeParish = parishes.find(
                  (p) => p.id === teacher?.parishId,
                );
                const assignedParish = parishes.find(
                  (p) => p.id === assignment.parishId,
                );

                if (!teacher || !assignedParish) return null;

                return (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {teacher.name}
                      <div className="text-xs text-muted-foreground">
                        {teacher.phone}
                      </div>
                    </TableCell>
                    <TableCell>{homeParish?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        {assignedParish.name}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {assignedParish.forane}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(assignment.id, teacher.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAssignments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No assignments found matching criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
