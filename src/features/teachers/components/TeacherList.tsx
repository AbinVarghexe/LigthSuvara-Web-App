import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  School,
  Mail,
  Phone,
  BookOpen,
  User,
  Loader2,
  Trash2,
} from "lucide-react";
import { Teacher } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TeacherListProps {
  teachers: Teacher[];
  onAssignClick?: (teacher: Teacher) => void;
  showAssignAction?: boolean;
  assigningId?: string | null;
  onDeleteClick?: (teacher: Teacher) => void;
}

export function TeacherList({
  teachers,
  onAssignClick,
  showAssignAction = false,
  assigningId = null,
  onDeleteClick,
}: TeacherListProps) {
  if (teachers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed">
        <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-medium">No teachers found</h3>
        <p className="text-muted-foreground">
          Adjust filters or create a new teacher.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teachers.map((teacher) => (
        <Card
          key={teacher.id}
          className={`hover:shadow-md transition-shadow ${teacher.assigned ? "bg-muted/40 opacity-50 grayscale" : "bg-white"}`}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {teacher.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{teacher.name}</h3>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <School className="w-3 h-3 mr-1" />
                    {teacher.parishName}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {teacher.assigned ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> Assigned
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Available
                  </Badge>
                )}
                {onDeleteClick && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDeleteClick(teacher)}
                    title="Delete Teacher"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-foreground/80 mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{teacher.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {teacher.classes.map((cls) => (
                    <span
                      key={cls}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                    >
                      {cls}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1 self-center">
                    ({teacher.academicYear})
                  </span>
                </div>
              </div>
            </div>

            {showAssignAction && !teacher.assigned && (
              <Button
                className="w-full"
                onClick={() => onAssignClick?.(teacher)}
                disabled={!!assigningId}
              >
                {assigningId === teacher.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Teacher"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
