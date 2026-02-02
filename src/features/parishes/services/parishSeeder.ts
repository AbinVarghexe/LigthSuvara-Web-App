import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Parish } from "@/features/teachers/types";

export const seedParishes = async () => {
  const parishesCollection = collection(db, "parishes");

  const demoParishes: Omit<Parish, "id">[] = [
    { name: "St. Mary's Cathedral", location: { lat: 9.967, long: 76.242 } },
    { name: "St. Thomas Forane Church", location: { lat: 9.980, long: 76.280 } },
    { name: "Little Flower Church", location: { lat: 10.010, long: 76.310 } },
    { name: "St. George's Church", location: { lat: 9.990, long: 76.350 } },
    { name: "Sacred Heart Church", location: { lat: 9.950, long: 76.330 } },
    { name: "St. Joseph's Church", location: { lat: 9.940, long: 76.290 } },
    { name: "Holy Family Church", location: { lat: 10.020, long: 76.340 } },
    { name: "St. Jude's Church", location: { lat: 10.005, long: 76.360 } },
    { name: "Infant Jesus Church", location: { lat: 9.975, long: 76.320 } },
    { name: "St. Sebastian's Church", location: { lat: 9.960, long: 76.300 } },
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const parishData of demoParishes) {
    try {
      // Check if a parish with this name already exists to avoid duplicates
      const q = query(parishesCollection, where("name", "==", parishData.name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`Skipping ${parishData.name}: Already exists.`);
        skippedCount++;
        continue;
      }

      const docRef = await addDoc(parishesCollection, parishData);
      console.log(`Added ${parishData.name} with ID: ${docRef.id}`);
      addedCount++;
    } catch (error) {
      console.error(`Error adding ${parishData.name}:`, error);
    }
  }

  return { added: addedCount, skipped: skippedCount };
};
