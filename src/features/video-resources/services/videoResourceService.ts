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

// Initial seeding data
const SEED_DATA: Record<number, Chapter[]> = {
  1: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_1_1",
          title: "PPT",
          url: "https://drive.google.com/file/d/1FXjF8sTwPMbF0w-nuoR_QHjgxSqOntBt/view?usp=drivesdk",
          type: "drive",
        },
        {
          id: "r_1_2",
          title: "Action song 1",
          url: "https://youtu.be/aSfWBmQUuP8",
          type: "youtube",
        },
        {
          id: "r_1_3",
          title: "Action song 2",
          url: "https://youtu.be/HNf_oczA1Ek",
          type: "youtube",
        },
        {
          id: "r_1_4",
          title: "God Creation - Story",
          url: "https://youtu.be/YalBsd56iTQ",
          type: "youtube",
        },
      ],
    },
  ],
  2: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_2_1",
          title: "PPT",
          url: "https://drive.google.com/file/d/1G8BMOXUSNu8z4qUO2F5-P6TLu0mQ4OHz/view?usp=drivesdk",
          type: "drive",
        },
        {
          id: "r_2_2",
          title: "ദൈവത്തിൻ കരവിരുത്",
          url: "https://youtu.be/MF7s5tHumFw",
          type: "youtube",
        },
        {
          id: "r_2_3",
          title: "ദൈവത്തിന്റെ സൃഷ്ടി",
          url: "https://youtu.be/dQUubLxYIXs",
          type: "youtube",
        },
        {
          id: "r_2_4",
          title: "സൃഷ്ടിയുടെ ചിത്രങ്ങൾ",
          url: "https://drive.google.com/file/d/1E80JwIwuJTdzEyXrAFwfvae8y5gf1y0r/view?usp=drivesdk",
          type: "drive",
        },
      ],
    },
  ],
  4: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_4_1",
          title: "മുന്തിരി ചെടിയും ശാഖകളും",
          url: "https://www.youtube.com/watch?v=MgVMjjxy0EQ",
          type: "youtube",
        },
        {
          id: "r_4_2",
          title: "മുന്തിരി വള്ളി (ടീച്ചേഴ്സിന്)",
          url: "https://www.youtube.com/watch?v=_weg95LGqjA",
          type: "youtube",
        },
      ],
    },
  ],
  5: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_5_1",
          title: "ബൈബിളിലെ പുസ്തകങ്ങൾ പാട്ട് - 1",
          url: "https://youtu.be/BcWqL2kToAA",
          type: "youtube",
        },
        {
          id: "r_5_2",
          title: "ബൈബിളിലെ പുസ്തകങ്ങൾ പാട്ട് - 2",
          url: "https://youtu.be/nTX2tpONAqM",
          type: "youtube",
        },
      ],
    },
  ],
  6: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_6_1",
          title: "മംഗളവാർത്തയെ കുറിച്ചുള്ള വീഡിയോ (animation)",
          url: "https://youtu.be/Z1OLLwtCqtM",
          type: "youtube",
        },
        {
          id: "r_6_2",
          title: "മംഗള വാർത്ത",
          url: "https://youtu.be/Z1OLLwtCqtM",
          type: "youtube",
        },
        {
          id: "r_6_3",
          title: "മുഖ്യദൂതന്മാർ",
          url: "https://youtu.be/51eO5hcfC8s",
          type: "youtube",
        },
        {
          id: "r_6_4",
          title: "ഈശോ ജനിച്ച സ്ഥലം ഇന്ന്",
          url: "https://youtu.be/QEh4bknrNVA",
          type: "youtube",
        },
        {
          id: "r_6_5",
          title: "സന്തോഷകരമായ ദിവ്യരഹസ്യങ്ങൾ (ചിത്രങ്ങൾ)",
          url: "https://drive.google.com/drive/folders/1JY3k_Z_UUynRk_PVozF-2aCFLjeE_4hD",
          type: "drive",
        },
      ],
    },
  ],
  7: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_7_1",
          title: "10 കൽപ്പനകൾ",
          url: "https://youtu.be/HWykQ3gtaDQ",
          type: "youtube",
        },
      ],
    },
  ],
  9: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_9_1",
          title: "മാവേലിന്റെയും കായേന്റെയും ബലി",
          url: "https://youtu.be/xxNvbkWcNy4",
          type: "youtube",
        },
        {
          id: "r_9_2",
          title: "ഈശോയുടെ കുരിശിന്റെ চുവട്ടിലെ വ്യക്തികൾ",
          url: "https://www.youtube.com/watch?v=eJ4OLAdPrbg",
          type: "youtube",
        },
      ],
    },
  ],
  10: [
    {
      id: "ch_1",
      title: "Chapter 1",
      resources: [
        {
          id: "r_10_1",
          title: "മിഷൻ പ്രവർത്തനങ്ങൾ - ഭാഗം 1",
          url: "https://qr.me-qr.com/GljFUynw",
          type: "link",
        },
        {
          id: "r_10_2",
          title: "മിഷൻ പ്രവർത്തനങ്ങൾ - ഭാഗം 2",
          url: "https://qr.me-qr.com/rrqjY72U",
          type: "link",
        },
        {
          id: "r_10_3",
          title: "മിഷൻ പ്രവർത്തനങ്ങൾ - ഭാഗം 3",
          url: "https://qr.me-qr.com/0CMVIDpq",
          type: "link",
        },
        {
          id: "r_10_4",
          title: "സഭ സ്വഭാവത്താലെ പ്രേക്ഷിതയാണ്",
          url: "https://youtube.com/watch?v=Ek5qPkobUzI&feature=share",
          type: "youtube",
        },
      ],
    },
  ],
};

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
    // If not exists in Firestore, check if we have seed data.
    let defaultChapters: Chapter[] = [];
    if (sectionId.startsWith("class_")) {
      const classNum = parseInt(sectionId.replace("class_", ""));
      defaultChapters = SEED_DATA[classNum] || [];
    }
    // Seed it to Firestore so it is stored
    await setDoc(docRef, { chapters: defaultChapters });
    return {
      sectionId,
      chapters: defaultChapters,
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

// Initialize seeding for all classes (to make sure all seed data is written at once if needed)
export const seedAllClassResources = async (): Promise<void> => {
  for (let i = 1; i <= 12; i++) {
    const docId = `class_${i}`;
    const docRef = doc(db, RESOURCES_COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const defaultChapters = SEED_DATA[i] || [];
      await setDoc(docRef, { chapters: defaultChapters });
    }
  }
};

