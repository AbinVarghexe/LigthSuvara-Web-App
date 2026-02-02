import { z } from "zod";

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  parishId: string; // ID of the parish the teacher belongs to
  parishName: string; // stored for convenience/display
  classes: string[];
  academicYear: string;
  assigned: boolean;
  assignedParishId: string | null;
  location: {
    lat: number;
    long: number;
  };
  createdAt: string; 
}

export interface Parish {
  id: string;
  name: string;
  location: {
    lat: number;
    long: number;
  };
}

export interface Assignment {
  id: string;
  teacherId: string;
  parishId: string;
  classId: string;
  dateAssigned: string;
}

// Zod Schemas for Validation
export const createTeacherSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email address"),
  parishId: z.string().min(1, "Parish is required"),
  classes: z.array(z.string()).min(1, "At least one class is required"),
  academicYear: z.string().min(1, "Academic Year is required"),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
