import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

export interface SaintResourceItem {
  id: string;
  title: string;
  url: string;
  type: "document" | "youtube" | "drive" | "link";
}

export interface SaintCategory {
  id: string;
  title: string;
  resources: SaintResourceItem[];
}

export interface SaintsData {
  categories: SaintCategory[];
}

const SAINTS_COLLECTION = "saints_resources";
const DOCUMENT_ID = "all";

// Helper function to extract YouTube Video ID
export function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Check if url is a Drive link
export function isDriveLink(url: string): boolean {
  return url.includes("drive.google.com");
}

// Fetch all saints resources
export const getSaintsResources = async (): Promise<SaintsData> => {
  const docRef = doc(db, SAINTS_COLLECTION, DOCUMENT_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      categories: data.categories || [],
    };
  } else {
    const defaultData: SaintsData = { categories: [] };
    await setDoc(docRef, defaultData);
    return defaultData;
  }
};

// Save all saints resources
export const saveSaintsResources = async (saintsData: SaintsData): Promise<void> => {
  const docRef = doc(db, SAINTS_COLLECTION, DOCUMENT_ID);
  await setDoc(docRef, { categories: saintsData.categories }, { merge: true });
};
