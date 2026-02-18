import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Parish } from "@/features/teachers/types";

export const seedParishes = async () => {
  const parishesCollection = collection(db, "parishes");

  const demoParishes: Omit<Parish, "id">[] = [
    { name: "St. Mary's Cathedral", forane: "Ernakulam", location: { lat: 9.967, long: 76.242 } },
    { name: "St. Thomas Forane Church", forane: "Edappally", location: { lat: 9.980, long: 76.280 } },
    { name: "Little Flower Church", forane: "Ernakulam", location: { lat: 10.010, long: 76.310 } },
    { name: "St. George's Church", forane: "Edappally", location: { lat: 9.990, long: 76.350 } },
    { name: "Sacred Heart Church", forane: "Tripunithura", location: { lat: 9.950, long: 76.330 } },
    { name: "St. Joseph's Church", forane: "Tripunithura", location: { lat: 9.940, long: 76.290 } },
    { name: "Holy Family Church", forane: "Angamaly", location: { lat: 10.020, long: 76.340 } },
    { name: "St. Jude's Church", forane: "Angamaly", location: { lat: 10.005, long: 76.360 } },
    { name: "Infant Jesus Church", forane: "Palluruthy", location: { lat: 9.975, long: 76.320 } },
    { name: "St. Sebastian's Church", forane: "Palluruthy", location: { lat: 9.960, long: 76.300 } },
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const parishData of demoParishes) {
    try {
      // Check if a parish with this name already exists
      const q = query(parishesCollection, where("name", "==", parishData.name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Update existing parish with new data (e.g. forane)
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, "parishes", docId);
        await updateDoc(docRef, {
           forane: parishData.forane,
           location: parishData.location
        });
        console.log(`Updated ${parishData.name} with new data.`);
        skippedCount++; // Technically existing, but updated. We can count as skipped for creation.
        continue;
      }

      const docRef = await addDoc(parishesCollection, parishData);
      console.log(`Added ${parishData.name} with ID: ${docRef.id}`);
      addedCount++;
    } catch (error) {
      console.error(`Error processing ${parishData.name}:`, error);
    }
  }

  return { added: addedCount, skipped: skippedCount };
};
