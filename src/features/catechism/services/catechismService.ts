import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

export interface CatechismHourData {
  id?: string;
  title: string;
  notes: string;
  imageUrl?: string | null;
  date: Date | Timestamp;
  createdAt?: any;
}

const COLLECTION_NAME = "catechism_hours";

// Fetch all entries sorted by target date descending
export const getCatechismHours = async (): Promise<CatechismHourData[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as CatechismHourData[];
};

// Create a new entry
export const createCatechismHour = async (data: Omit<CatechismHourData, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update an existing entry
export const updateCatechismHour = async (
  id: string,
  data: Partial<Omit<CatechismHourData, "id">>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
};

// Delete an entry
export const deleteCatechismHour = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
