import { collection, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Parish } from "@/features/teachers/types";

const PARISHES_COLLECTION = "parishes";

export interface Forane {
  id: string;
  name: string;
  code?: string;
}

export const ParishService = {
  getAllParishes: async (): Promise<Parish[]> => {
    const querySnapshot = await getDocs(collection(db, PARISHES_COLLECTION));
    const parishes: Parish[] = [];
    querySnapshot.forEach((doc) => {
      parishes.push({ id: doc.id, ...doc.data() } as Parish);
    });
    return parishes;
  },

  /**
   * Fetch Forane details by Forane code
   */
  getForaneByCode: async (code: string): Promise<Forane | null> => {
    const q = query(collection(db, "foranes"), where("code", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Forane;
  },

  /**
   * Fetch Parish details by Parish code across all Foranes
   */
  getParishByCode: async (code: string): Promise<(Parish & { foraneId?: string; place?: string; code?: string }) | null> => {
    // To avoid requiring a Collection Group index in Firestore,
    // we fetch all foranes first, then query their parishes subcollections in parallel.
    try {
      const foranesSnap = await getDocs(collection(db, "foranes"));
      const queries = foranesSnap.docs.map(async (foraneDoc) => {
        const parishesRef = collection(db, "foranes", foraneDoc.id, "parishes");
        const q = query(parishesRef, where("code", "==", code));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          return { id: docSnap.id, ...docSnap.data(), foraneId: foraneDoc.id } as Parish & { foraneId?: string; place?: string; code?: string };
        }
        return null;
      });

      const results = await Promise.all(queries);
      const found = results.find(r => r !== null);
      return found || null;
    } catch (e) {
      console.error("Failed to query parish by code:", e);
      return null;
    }
  },

  /**
   * Add a new Forane to the database
   */
  addForane: async (name: string): Promise<Forane> => {
    const id = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    await setDoc(doc(db, "foranes", id), { name });
    return { id, name };
  },

  /**
   * Add a new Parish under a specific Forane
   */
  addParish: async (
    foraneId: string,
    parishData: { name: string; saint: string; place: string; code: string }
  ): Promise<any> => {
    const parishId = parishData.place.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const parishDocRef = doc(db, "foranes", foraneId, "parishes", parishId);
    await setDoc(parishDocRef, parishData);
    return { id: parishId, ...parishData };
  }
};

