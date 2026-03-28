import { doc, setDoc, collection, query, getDocs, orderBy, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";

export interface ProgramMetadata {
    id?: string;
    name: string;
    isActive: boolean;
    startDate: Timestamp;
    endDate: Timestamp;
    regInfo?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    timestamp?: Timestamp; // Keep for compatibility
}

export interface PublicRegistration {
    id?: string;
    programId: string;
    programTitle: string;
    // New fields from DB screenshot
    name: string;
    phone: string;
    email?: string;
    address?: string;
    academicBackground?: string;
    qualification?: string; // New field
    currentStatus?: string; // New field
    timestamp: Timestamp;
    
    // Legacy support (older fields)
    applicantName?: string;
    applicantMobile?: string;
    applicantSchool?: string;
    applicantPlace?: string;
    applicantClass?: string;
    parentName?: string;
    parentMobile?: string;
}

const PROGRAMS_COLLECTION = "public_registration_programs";
const REGISTRATIONS_COLLECTION = "public_registrations";

export const getPublicPrograms = async (): Promise<ProgramMetadata[]> => {
    // Try sorting by createdAt or updatedAt if timestamp is missing
    const q = query(collection(db, PROGRAMS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const programs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgramMetadata));
    
    // Sort in memory to handle inconsistent field names (createdAt vs timestamp)
    return programs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || a.timestamp?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || b.timestamp?.toMillis() || 0;
        return timeB - timeA;
    });
};

export const savePublicProgram = async (program: Partial<ProgramMetadata>, id?: string): Promise<string> => {
    const docRef = id ? doc(db, PROGRAMS_COLLECTION, id) : doc(collection(db, PROGRAMS_COLLECTION));
    const now = Timestamp.now();
    const data = {
        ...program,
        updatedAt: now,
        timestamp: now, // Keep both for safety
    };
    if (!id) {
        (data as any).createdAt = now;
    }
    await setDoc(docRef, data, { merge: true });
    return docRef.id;
};

export const deletePublicProgram = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, PROGRAMS_COLLECTION, id));
};

export const getPublicRegistrations = async (programId?: string): Promise<PublicRegistration[]> => {
    const q = query(collection(db, REGISTRATIONS_COLLECTION), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const registrations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublicRegistration));
    
    if (programId) {
        return registrations.filter(reg => reg.programId === programId);
    }
    return registrations;
};

export const deletePublicRegistration = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, REGISTRATIONS_COLLECTION, id));
};
