import { addDoc, collection, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Teacher } from "../types";

export const SeedService = {
  seedDemoData: async () => {
    // 1. Create a Demo Parish if not exists
    const parishRef = doc(db, "parishes", "demo-parish-01");
    await setDoc(parishRef, {
      name: "St. Thomas Church, Demo Town",
      forane: "Edappally",
      location: {
        lat: 9.9312, 
        long: 76.2673 // Kochi coordinates approx
      }
    }, { merge: true });

    // 2. Create another Parish for distance testing
    const parishRef2 = doc(db, "parishes", "demo-parish-02");
    await setDoc(parishRef2, {
        name: "St. Mary's Basilica, Nearby City",
        forane: "Ernakulam",
        location: {
            lat: 9.9658,
            long: 76.2421 // Slightly northwest
        }
    }, { merge: true });

    // 3. Create a Demo Teacher
    const demoTeacher: Omit<Teacher, "id"> = {
      name: "Demo Teacher",
      phone: "9998887776",
      email: "demo.teacher@example.com",
      parishId: "demo-parish-02", // Different parish so they can inspect demo-parish-01
      parishName: "St. Mary's Basilica, Nearby City",
      classes: ["Class 5", "Class 10"],
      academicYear: "2024-2025",
      assigned: false,
      assignedParishId: null,
      location: {
        lat: 9.9658,
        long: 76.2421
      },
      createdAt: new Date().toISOString(),
      dob: "1990-01-01",
      qualification: "B.Ed, MA English",
      profilePicture: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix"
    };

    // Check if demo teacher exists to avoid duplicates on multiple clicks
    const q = query(
        collection(db, "teachers"), 
        where("email", "==", demoTeacher.email)
    );
    const existing = await getDocs(q);
    
    if (existing.empty) {
        await addDoc(collection(db, "teachers"), demoTeacher);
        return { success: true, message: "Demo data created: 2 Parishes, 1 Teacher" };
    } else {
        return { success: true, message: "Demo data already exists (Parishes updated)" };
    }
  }
};
