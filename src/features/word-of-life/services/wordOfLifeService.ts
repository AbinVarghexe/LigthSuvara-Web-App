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

export interface WordOfLifeData {
  id?: string;
  title: string;
  notes: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  createdAt?: any;
}

const COLLECTION_NAME = "word_of_life";

// Fetch all entries sorted by start date descending
export const getWordOfLifeEntries = async (): Promise<WordOfLifeData[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as WordOfLifeData[];
};

// Create a new entry
export const createWordOfLifeEntry = async (data: Omit<WordOfLifeData, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update an existing entry
export const updateWordOfLifeEntry = async (
  id: string,
  data: Partial<Omit<WordOfLifeData, "id">>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
};

// Delete an entry
export const deleteWordOfLifeEntry = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
