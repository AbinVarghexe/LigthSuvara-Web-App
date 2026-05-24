import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Teacher, CreateTeacherInput } from "../types";

const TEACHERS_COLLECTION = "teachers";

export const TeacherService = {
  /**
   * Add a new teacher to Firestore
   */
  addTeacher: async (data: CreateTeacherInput, schoolId: string, schoolName: string): Promise<string> => {
    // Check for duplicates (Email + Academic Year) - Only if email is provided
    if (data.email) {
      const q = query(
        collection(db, TEACHERS_COLLECTION),
        where("email", "==", data.email),
        where("academicYear", "==", data.academicYear)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error("A teacher with this email already exists for the selected academic year.");
      }
    }

    const newTeacher = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      dob: data.dob,
      academicYear: data.academicYear,
      classes: data.classes,
      qualification: data.qualification,
      profilePicture: data.profilePicture || null,
      schoolId,
      schoolName,
      assigned: false,
      assignedParishId: null,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, TEACHERS_COLLECTION), newTeacher);
    return docRef.id;
  },

  /**
   * Update an existing teacher
   */
  updateTeacher: async (teacherId: string, data: Partial<CreateTeacherInput>): Promise<void> => {
    const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
    await updateDoc(teacherRef, {
      ...data,
    });
  },

  /**
   * Get all teachers, optionally filtered
   */
  getTeachers: async (filters?: { parishId?: string; classId?: string; includeDeleted?: boolean }): Promise<Teacher[]> => {
    let q = collection(db, TEACHERS_COLLECTION);

    // Note: Complex filtering might require compound indexes
    // For now, we can fetch and filter in memory if dataset is small, 
    // or apply basic filters here.

    if (filters?.classId) {
      // filtering by array-contains for classes would be:
      // q = query(q, where("classes", "array-contains", filters.classId));
      // But we handled that in the UI mostly or via a separate specific query function
    }

    const querySnapshot = await getDocs(q);
    const teachers: Teacher[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter out deleted teachers in memory unless includeDeleted is true
      if (!filters?.includeDeleted && data.deleted === true) {
        return;
      }
      teachers.push({ id: doc.id, ...data } as Teacher);
    });

    return teachers;
  },

  /**
   * Update teacher assigned status.
   * Pass a parish ID to mark as assigned, or null to unassign.
   */
  setAssigned: async (teacherId: string, assignedParishId: string | null) => {
    const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
    await updateDoc(teacherRef, {
      assigned: assignedParishId !== null,
      assignedParishId: assignedParishId
    });
  },

  /**
   * Delete a teacher
   */
  deleteTeacher: async (teacherId: string) => {
    try {
      const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
      await updateDoc(teacherRef, { deleted: true });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      throw error;
    }
  }
};
