import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Parish } from "@/features/teachers/types";

const PARISHES_COLLECTION = "parishes";

export const ParishService = {
  getAllParishes: async (): Promise<Parish[]> => {
    const querySnapshot = await getDocs(collection(db, PARISHES_COLLECTION));
    const parishes: Parish[] = [];
    querySnapshot.forEach((doc) => {
      parishes.push({ id: doc.id, ...doc.data() } as Parish);
    });
    return parishes;
  }
};
