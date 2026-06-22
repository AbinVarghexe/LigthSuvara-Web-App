import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  type: "document" | "youtube" | "drive" | "link" | "video" | "audio" | "pdf" | "ppt" | "image" | "quiz";
  customColor?: string;
}

export interface Chapter {
  id: string;
  title: string;
  resources: ResourceItem[];
}

export interface ClassResources {
  classNum: number;
  chapters: Chapter[];
}

const RESOURCES_COLLECTION = "video_resources";

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

export interface ResourceSection {
  id: string;
  title: string;
  icon: string; // e.g. "GraduationCap", "BookOpen", "Youtube", "Music", "Video", "FileText", "FolderDot", "HelpCircle", "ExternalLink", "Heart"
  customColor: string;
  order: number;
}

export interface SectionResources {
  sectionId: string;
  chapters: Chapter[];
}

const SECTIONS_DOC_ID = "sections_config";

// Fetch all dynamic resource sections
export const getResourceSections = async (): Promise<ResourceSection[]> => {
  const docRef = doc(db, RESOURCES_COLLECTION, SECTIONS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return (data.sections || []).sort((a: ResourceSection, b: ResourceSection) => a.order - b.order);
  } else {
    // Return default sections (Class 1 to Class 12)
    const defaults: ResourceSection[] = [];
    // Seed Class 1-12
    for (let i = 1; i <= 12; i++) {
      defaults.push({
        id: `class_${i}`,
        title: `Class ${i}`,
        icon: "GraduationCap",
        customColor: "#3B82F6",
        order: i,
      });
    }

    await setDoc(docRef, { sections: defaults });
    return defaults;
  }
};

// Save all dynamic resource sections
export const saveResourceSections = async (sections: ResourceSection[]): Promise<void> => {
  const docRef = doc(db, RESOURCES_COLLECTION, SECTIONS_DOC_ID);
  await setDoc(docRef, { sections }, { merge: true });
};

// Fetch resources for a specific section (by sectionId)
export const getSectionResources = async (sectionId: string): Promise<SectionResources> => {
  const docRef = doc(db, RESOURCES_COLLECTION, sectionId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      sectionId,
      chapters: data.chapters || [],
    };
  } else {
    return {
      sectionId,
      chapters: [],
    };
  }
};

// Save resources for a specific section
export const saveSectionResources = async (sectionResources: SectionResources): Promise<void> => {
  const docRef = doc(db, RESOURCES_COLLECTION, sectionResources.sectionId);
  await setDoc(docRef, { chapters: sectionResources.chapters }, { merge: true });
};

// Fetch resources for a specific class (1-12) - Deprecated, use getSectionResources
export const getClassResources = async (classNum: number): Promise<ClassResources> => {
  const sectionId = `class_${classNum}`;
  const res = await getSectionResources(sectionId);
  return {
    classNum,
    chapters: res.chapters,
  };
};

// Save resources for a specific class - Deprecated, use saveSectionResources
export const saveClassResources = async (classResources: ClassResources): Promise<void> => {
  const sectionId = `class_${classResources.classNum}`;
  await saveSectionResources({ sectionId, chapters: classResources.chapters });
};

// Initialize seeding for all classes (deprecated, does nothing now)
export const seedAllClassResources = async (): Promise<void> => {
  // Seeding disabled
};
