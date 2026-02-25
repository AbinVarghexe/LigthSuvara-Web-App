import { z } from "zod";

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  parishId?: string; // legacy field
  parishName?: string; // legacy field
  schoolId?: string; // ID of the school the teacher belongs to
  schoolName?: string; // stored for convenience/display
  classes: string[] | string;
  academicYear: string;
  assigned: boolean;
  assignedParishId: string | null;
  location?: {
    lat: number;
    long: number;
  };
  createdAt: string;
  dob: string; // ISO date string
  profilePicture?: string;
  qualification: string;
}

export interface Parish {
  id: string;
  name: string;
  forane: string;
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
  classes: z.array(z.string()).min(1, "Class is required").max(1, "Only one class can be selected"),
  academicYear: z.string().min(1, "Academic Year is required"),
  dob: z.string().min(1, "Date of Birth is required"),
  qualification: z.string().min(1, "Qualification is required"),
  profilePicture: z.string().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
