import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { TeacherService } from "./teacherService";
import { calculateDistance } from "@/lib/utils";

const ASSIGNMENTS_COLLECTION = "assignments";

export const AssignmentService = {
  /**
   * Assign a teacher to a parish
   */
  assignTeacher: async (teacherId: string, parishId: string, classId: string = "General") => {
    // 1. Validation: Check if parish already has an assignment for this academic year/class context?
    // Requirement: "One parish -> one teacher only" 
    // We assume this means generally for the inspection period.
    
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("parishId", "==", parishId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error("This parish already has an assigned teacher.");
    }

    // 2. Create Assignment Record
    await addDoc(collection(db, ASSIGNMENTS_COLLECTION), {
      teacherId,
      parishId,
      class: classId,
      dateAssigned: serverTimestamp() // Firestore timestamp
    });

    // 3. Update Teacher Status
    await TeacherService.setAssigned(teacherId, parishId);
    
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
    const { deleteDoc, doc } = await import("firebase/firestore");
    await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId));

    // 2. Update Teacher Status (Unassign)
    // @ts-ignore - allowing null for unassignment
    await TeacherService.setAssigned(teacherId, null);
  },

  /**
   * Update an assignment
   */
  updateAssignment: async (assignmentId: string, oldTeacherId: string, newTeacherId: string, newParishId: string) => {
     // 1. Unassign old teacher
     if (oldTeacherId && oldTeacherId !== newTeacherId) {
         // @ts-ignore - allowing null for unassignment
         await TeacherService.setAssigned(oldTeacherId, null);
     }
     
     // 2. Assign new teacher (if changed)
     if (newTeacherId) {
         await TeacherService.setAssigned(newTeacherId, newParishId);
     }

     // 3. Update Assignment Doc
     const { updateDoc, doc } = await import("firebase/firestore");
     await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId), {
         teacherId: newTeacherId,
         parishId: newParishId
     });
  }
};

