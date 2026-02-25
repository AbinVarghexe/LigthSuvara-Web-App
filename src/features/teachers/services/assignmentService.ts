import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { TeacherService } from "./teacherService";
import { calculateDistance } from "@/lib/utils";

const ASSIGNMENTS_COLLECTION = "assignments";

export const AssignmentService = {
  /**
   * Assign a teacher to a parish (Observer)
   */
  assignTeacher: async (
    teacher: any,
    targetSchool: any,
    academicYear: string,
    type: string = "Observer"
  ) => {
    const teacherId = teacher.id;
    const targetSchoolId = targetSchool.id;

    // 1. Check if the target school already has an assignment for this year
    const schoolQ = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("targetSchoolId", "==", targetSchoolId),
      where("academicYear", "==", academicYear),
      where("type", "==", type)
    );
    const schoolExisting = await getDocs(schoolQ);
    if (!schoolExisting.empty) {
      throw new Error("This school already has an assigned observer for this year.");
    }

    // 2. Check if the teacher is already assigned for this year
    const teacherQ = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("teacherId", "==", teacherId),
      where("academicYear", "==", academicYear),
      where("type", "==", type)
    );
    const teacherExisting = await getDocs(teacherQ);
    if (!teacherExisting.empty) {
      throw new Error("This observer is already assigned somewhere else for this year.");
    }

    // 3. Generate Access Code (6 digits)
    const accessCode = (Math.floor(Math.random() * 900000) + 100000).toString();

    // 4. Create Assignment Record aligning with Flutter
    await addDoc(collection(db, ASSIGNMENTS_COLLECTION), {
      teacherId,
      teacherName: teacher.name,
      teacherPhone: teacher.phone || "",
      sourceSchoolId: teacher.parishId || teacher.schoolId || "",
      sourceSchoolName: teacher.parishName || teacher.schoolName || "",
      targetSchoolId: targetSchoolId,
      targetSchoolName: targetSchool.schoolname || targetSchool.name || "",
      accessCode,
      academicYear,
      assignedAt: serverTimestamp(),
      type: type,
    });

    // 5. Update Teacher Status (Optional, keeping for web app internal state)
    await TeacherService.setAssigned(teacherId, targetSchoolId);

    return true;
  },

  /**
   * Get recommended teachers sorted by distance
   */
  getRecommendations: async (
    targetParish: { id: string; location: { lat: number; long: number } },
    allTeachers: any[], // Pass in teachers to avoid re-fetching inside logic
    classFilter?: string
  ) => {
    // Filter eligible teachers
    const eligible = allTeachers.filter(t =>
      !t.assigned &&
      t.parishId !== targetParish.id && // Cannot inspect own parish
      (!classFilter || t.classes.includes(classFilter))
    );

    // Calculate distances
    const withDistance = eligible.map(t => {
      const dist = calculateDistance(
        targetParish.location.lat,
        targetParish.location.long,
        t.location.lat,
        t.location.long
      );
      return { ...t, distance: dist };
    });

    // Sort by distance ASC
    return withDistance.sort((a, b) => a.distance - b.distance);
  },

  /**
   * Auto-assign teachers to multiple parishes
   */
  autoAssignTeachers: async (
    targetParishes: { id: string; location: { lat: number; long: number }; name: string }[],
    allTeachers: any[],
    classId: string = "General"
  ) => {
    const assignments: any[] = [];
    const errors: string[] = [];

    // Get currently assigned teacher IDs to avoid double booking in this batch
    const newlyAssignedTeacherIds = new Set<string>();

    for (const parish of targetParishes) {
      try {
        // 1. Check existing assignment for this parish/class
        const q = query(
          collection(db, ASSIGNMENTS_COLLECTION),
          where("parishId", "==", parish.id),
          where("class", "==", classId) // Ideally check class context too, but schema logic varies
        );
        const existing = await getDocs(q);

        // If already has assignment, skip
        // (In a real app, maybe we overwrite? For now, let's skip to be safe)
        if (!existing.empty) {
          errors.push(`${parish.name}: Already has a teacher assigned.`);
          continue;
        }

        // 2. Find best candidate
        // Filter eligible
        const eligible = allTeachers.filter(t =>
          !t.assigned &&
          !newlyAssignedTeacherIds.has(t.id) &&
          t.parishId !== parish.id &&
          t.classes.includes(classId)
        );

        if (eligible.length === 0) {
          errors.push(`${parish.name}: No eligible teachers found.`);
          continue;
        }

        // Sort by distance
        eligible.sort((a, b) => {
          const distA = calculateDistance(parish.location.lat, parish.location.long, a.location.lat, a.location.long);
          const distB = calculateDistance(parish.location.lat, parish.location.long, b.location.lat, b.location.long);
          return distA - distB;
        });

        const bestTeacher = eligible[0];

        // 3. Assign
        await AssignmentService.assignTeacher(bestTeacher.id, parish.id, classId);

        // Track locally
        newlyAssignedTeacherIds.add(bestTeacher.id);
        assignments.push({ parish: parish.name, teacher: bestTeacher.name });

      } catch (err: any) {
        errors.push(`${parish.name}: ${err.message}`);
      }
    }

    return { assignments, errors };
  },

  /**
   * Get all assignments
   */
  getAssignments: async () => {
    const q = query(collection(db, ASSIGNMENTS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Delete an assignment
   */
  deleteAssignment: async (assignmentId: string, teacherId: string) => {
    // 1. Delete assignment doc
    await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId));

    // 2. Update Teacher Status (Unassign)
    await TeacherService.setAssigned(teacherId, null);
  },

  /**
   * Update an assignment (reassign observer or change target school)
   */
  updateAssignment: async (assignmentId: string, oldTeacherId: string, newTeacherId: string, newSchoolId: string) => {
    // 1. Validate: check the new school doesn't already have a DIFFERENT assignment
    const schoolQ = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("targetSchoolId", "==", newSchoolId)
    );
    const schoolExisting = await getDocs(schoolQ);
    const schoolConflict = schoolExisting.docs.find((d) => d.id !== assignmentId);
    if (schoolConflict) {
      throw new Error("The selected school already has an assigned observer.");
    }

    // 2. Validate: check the new teacher is not already assigned to a different school
    if (newTeacherId !== oldTeacherId) {
      const teacherQ = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("teacherId", "==", newTeacherId)
      );
      const teacherExisting = await getDocs(teacherQ);
      const teacherConflict = teacherExisting.docs.find((d) => d.id !== assignmentId);
      if (teacherConflict) {
        throw new Error("The selected observer is already assigned to another school.");
      }
    }

    // 3. Unassign old teacher (if changed)
    if (oldTeacherId && oldTeacherId !== newTeacherId) {
      await TeacherService.setAssigned(oldTeacherId, null);
    }

    // 4. Assign new teacher
    if (newTeacherId) {
      await TeacherService.setAssigned(newTeacherId, newSchoolId);
    }

    // 5. Update Assignment Doc
    await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId), {
      teacherId: newTeacherId,
      targetSchoolId: newSchoolId
    });
  },

  /**
   * Get global expiration date for an academic year
   */
  getExpirationDate: async (academicYear: string) => {
    try {
      const docRef = doc(db, "settings", "observer_dates", "years", academicYear);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.expirationDate) {
          return (data.expirationDate as any).toDate();
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching expiration date:", error);
      return null;
    }
  },

  /**
   * Set global expiration date for an academic year
   */
  setExpirationDate: async (academicYear: string, date: Date) => {
    const docRef = doc(db, "settings", "observer_dates", "years", academicYear);
    await setDoc(docRef, {
      expirationDate: date,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};

