import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface ProgramData {
    id?: string;
    name: string;
    description?: string;
    startDate: Date | Timestamp;
    endDate: Date | Timestamp;
    isActive: boolean;
    createdAt?: Timestamp;
}

export interface ProgramRegistration {
    id?: string;
    programId: string;
    programName: string;
    studentName: string;
    studentPhone: string;
    schoolUserId: string;
    schoolName: string;
    parishUserId: string;
    status: 'pending_parish' | 'approved_parish' | 'locked' | 'rejected';
    isCountOnly?: boolean;
    studentCount?: number;
    submittedAt?: Timestamp;
    approvedAt?: Timestamp;
}

// Program CRUD Operations
export const getPrograms = async () => {
    const q = query(collection(db, 'programs'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgramData[];
};

export const getActivePrograms = async () => {
    const q = query(
        collection(db, 'programs'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgramData[];
};

export const getProgram = async (programId: string) => {
    const docRef = doc(db, 'programs', programId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ProgramData;
    } else {
        throw new Error("No such program!");
    }
};

export const createProgram = async (programData: Omit<ProgramData, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, 'programs'), {
        ...programData,
        createdAt: serverTimestamp()
    });
};

export const updateProgram = async (programId: string, programData: Partial<ProgramData>) => {
    const docRef = doc(db, 'programs', programId);
    return await updateDoc(docRef, programData);
};

export const deleteProgram = async (programId: string) => {
    return await deleteDoc(doc(db, 'programs', programId));
};

export const toggleProgramStatus = async (programId: string, isActive: boolean) => {
    const docRef = doc(db, 'programs', programId);
    return await updateDoc(docRef, { isActive });
};

// Registration Operations
export const getProgramRegistrations = async (programId?: string) => {
    let q;
    if (programId) {
        q = query(
            collection(db, 'program_registrations'),
            where('programId', '==', programId)
        );
    } else {
        q = query(collection(db, 'program_registrations'), orderBy('submittedAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgramRegistration[];

    // Sort in memory since we removed the composite index requirement
    return registrations.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis() || 0;
        const timeB = b.submittedAt?.toMillis() || 0;
        return timeB - timeA;
    });
};

export const getRegistrationsByStatus = async (status: ProgramRegistration['status']) => {
    const q = query(
        collection(db, 'program_registrations'),
        where('status', '==', status)
    );
    const snapshot = await getDocs(q);
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgramRegistration[];

    return registrations.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis() || 0;
        const timeB = b.submittedAt?.toMillis() || 0;
        return timeB - timeA;
    });
};

export const updateRegistrationStatus = async (
    registrationId: string,
    status: ProgramRegistration['status']
) => {
    const docRef = doc(db, 'program_registrations', registrationId);
    const updateData: Record<string, unknown> = { status };
    if (status === 'approved_parish') {
        updateData.approvedAt = serverTimestamp();
    }
    return await updateDoc(docRef, updateData);
};

export const getRegistrationStats = async (programId?: string) => {
    const registrations = await getProgramRegistrations(programId);
    
    const countStudents = (regs: ProgramRegistration[]) => {
        return regs.reduce((sum, reg) => sum + (reg.isCountOnly ? (reg.studentCount || 1) : 1), 0);
    };

    const stats = {
        total: countStudents(registrations),
        pending: countStudents(registrations.filter(r => r.status === 'pending_parish')),
        approved: countStudents(registrations.filter(r => r.status === 'approved_parish')),
        locked: countStudents(registrations.filter(r => r.status === 'locked')),
        rejected: countStudents(registrations.filter(r => r.status === 'rejected'))
    };
    return stats;
};

/** Real-time listener for programs. Returns an unsubscribe function. */
export const subscribeToPrograms = (
    callback: (programs: ProgramData[]) => void
) => {
    const q = query(collection(db, 'programs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const programs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProgramData));
        callback(programs);
    }, (error) => {
        console.error('Error subscribing to programs:', error);
    });
};

export const subscribeToAllRegistrations = (
    callback: (registrations: ProgramRegistration[]) => void
) => {
    const q = query(
        collection(db, 'program_registrations'),
        orderBy('submittedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const registrations = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProgramRegistration));
        callback(registrations);
    }, (error) => {
        console.error('Error subscribing to all registrations:', error);
    });
};
