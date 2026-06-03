import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, storage, auth, functions } from '../../../config/firebase';
import { compressImage } from '../../../lib/imageCompression';

export interface UserData {
    id: string;
    uid: string;
    email: string;
    role: 'admin' | 'school' | 'animator' | 'parish';
    schoolname?: string;
    schoolName?: string;
    fullName?: string;
    name?: string;
    phoneNumber?: string;
    address?: string;
    parishId?: string;
    parishName?: string;
    profileImageUrl?: string;
    forane?: string;
    parish?: string;
    schoolId?: string;
    parishCode?: string;
    code?: string;
    lastActiveAt?: any; // Firestore Timestamp
}

export const getUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserData));
};

export const getUser = async (userId: string) => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserData;
    } else {
        throw new Error("No such user!");
    }
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'school' | 'animator') => {
    return await updateDoc(doc(db, 'users', userId), { role: newRole });
};

export const deleteUser = async (userId: string) => {
    const deleteUserFunction = httpsCallable<{ uid: string }, { success: boolean }>(
        functions,
        'deleteUser'
    );
    try {
        const result = await deleteUserFunction({ uid: userId });
        return result.data;
    } catch (error: any) {
        console.error('Error calling deleteUser function:', error);
        throw new Error(error.message || 'Failed to delete user');
    }
};

export const updateUserActivity = async (userId: string) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            lastActiveAt: new Date(),
        });
    } catch (error) {
        console.error('Error updating user activity:', error);
    }
};

export const getEventsByUser = async (userId: string) => {
    const q = query(
        collection(db, 'events'),
        where('creatorId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getParishes = async (): Promise<UserData[]> => {
    const q = query(
        collection(db, 'users'),
        where('role', '==', 'parish')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    let fileToUpload: File | Blob = file;
    if (file.type.startsWith("image/") && file.type !== "image/gif") {
        fileToUpload = await compressImage(file);
    }
    const finalFileName = fileToUpload instanceof File ? fileToUpload.name : file.name;
    const storageRef = ref(storage, `profile-images/${userId}/${finalFileName}`);
    await uploadBytes(storageRef, fileToUpload);
    return await getDownloadURL(storageRef);
};

export const updateUserProfile = async (userId: string, data: Partial<UserData>) => {
    // Update Firestore
    await updateDoc(doc(db, 'users', userId), data);

    // Update Auth Profile if imageUrl or displayName is provided
    if (auth.currentUser && auth.currentUser.uid === userId) {
        const profileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
        if (data.fullName !== undefined) {
            profileUpdates.displayName = data.fullName || null;
        }
        if (data.profileImageUrl !== undefined) {
            profileUpdates.photoURL = data.profileImageUrl || null;
        }
        if (Object.keys(profileUpdates).length > 0) {
            await updateProfile(auth.currentUser, profileUpdates);
        }
    }
};

export interface BulkCreateResponse {
    success: boolean;
    created: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
}

export const bulkCreateUsers = async (users: Partial<UserData>[]): Promise<BulkCreateResponse> => {
    const errors: Array<{ email: string; error: string }> = [];
    const validUsers: Partial<UserData>[] = [];

    // Helper to strip dots, apostrophes, spaces and non-alphanumeric chars for robust entity checking
    const cleanEntityName = (name: string): string => {
        return (name || '')
            .toLowerCase()
            .replace(/\./g, '')
            .replace(/'s/gi, '')
            .replace(/[^a-z0-9]/gi, '')
            .trim();
    };

    // 1. Internal duplicate checking (within the uploaded array)
    const seenEmails = new Set<string>();
    const seenSchools = new Set<string>();
    const seenParishes = new Set<string>(); // key format: `foraneName|parishName`
    const seenSchoolParishCodes = new Set<string>();
    const seenParishParishCodes = new Set<string>();

    const normalizedUsers = users.map((u, index) => {
        const email = (u.email || '').toLowerCase().trim();
        const role = u.role || '';
        
        // For school role
        const rawSchoolName = u.schoolName || u.schoolname || (u as any).schoolnam || (u as any).school_name || (u as any).school || '';
        const schoolNameNorm = cleanEntityName(rawSchoolName);
        
        // For parish role
        const rawParishName = u.parish || u.parishName || (u as any).parishname || (u as any).parish_name || '';
        const parishNameNorm = cleanEntityName(rawParishName);
        const foraneNorm = cleanEntityName(u.forane || '');
        const parishKey = `${foraneNorm}|${parishNameNorm}`;

        return {
            original: u,
            index,
            email,
            role,
            schoolNameNorm,
            parishKey,
            parishNameNorm,
            rawSchoolName,
            rawParishName
        };
    });

    const uniqueBatchUsers: typeof normalizedUsers = [];

    for (const item of normalizedUsers) {
        if (!item.email) {
            errors.push({ email: 'unknown', error: 'Missing required field: email' });
            continue;
        }

        if (seenEmails.has(item.email)) {
            errors.push({ email: item.original.email || 'unknown', error: 'Duplicate email in batch' });
            continue;
        }
        seenEmails.add(item.email);

        const parishCodeNorm = (item.original.parishCode || '').trim();
        if (parishCodeNorm) {
            if (item.role === 'school') {
                if (seenSchoolParishCodes.has(parishCodeNorm)) {
                    errors.push({ email: item.original.email || 'unknown', error: `Duplicate Sunday School Parish Code in batch: ${parishCodeNorm}` });
                    continue;
                }
                seenSchoolParishCodes.add(parishCodeNorm);
            } else if (item.role === 'parish') {
                if (seenParishParishCodes.has(parishCodeNorm)) {
                    errors.push({ email: item.original.email || 'unknown', error: `Duplicate Parish Parish Code in batch: ${parishCodeNorm}` });
                    continue;
                }
                seenParishParishCodes.add(parishCodeNorm);
            }
        }

        if (item.role === 'school' && item.schoolNameNorm) {
            if (seenSchools.has(item.schoolNameNorm)) {
                errors.push({ email: item.original.email || 'unknown', error: `Duplicate Sunday School name in batch: ${item.rawSchoolName}` });
                continue;
            }
            seenSchools.add(item.schoolNameNorm);
        }

        if (item.role === 'parish' && item.parishNameNorm) {
            if (seenParishes.has(item.parishKey)) {
                errors.push({ email: item.original.email || 'unknown', error: `Duplicate Parish name in batch under same Forane: ${item.rawParishName}` });
                continue;
            }
            seenParishes.add(item.parishKey);
        }

        uniqueBatchUsers.push(item);
    }

    // Fetch all existing emails in DB for the batch
    const duplicateEmailsInDb = new Set<string>();
    const emailsToCheck = uniqueBatchUsers.map(u => u.email).filter(Boolean);
    if (emailsToCheck.length > 0) {
        try {
            const usersRef = collection(db, 'users');
            const chunkSize = 30;
            for (let i = 0; i < emailsToCheck.length; i += chunkSize) {
                const chunk = emailsToCheck.slice(i, i + chunkSize);
                const q = query(usersRef, where('email', 'in', chunk));
                const snap = await getDocs(q);
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.email) {
                        duplicateEmailsInDb.add(data.email.toLowerCase().trim());
                    }
                });
            }
        } catch (err) {
            console.error('Error querying emails in Firestore:', err);
        }
    }

    // Fetch all existing school users to prevent duplicate schoolNames or parishCodes, and mapping parishCode to school IDs
    const existingSchools = new Set<string>();
    const existingSchoolParishCodes = new Set<string>();
    const schoolIdByCode = new Map<string, { id: string; name: string }>();
    if (uniqueBatchUsers.some(u => u.role === 'school' || u.role === 'parish')) {
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'school'));
            const snap = await getDocs(q);
            snap.docs.forEach(doc => {
                const data = doc.data();
                const sName = data.schoolName || data.schoolname || '';
                const norm = cleanEntityName(sName);
                if (norm) {
                    existingSchools.add(norm);
                }
                const pCode = data.parishCode || '';
                if (pCode) {
                    existingSchoolParishCodes.add(pCode.trim());
                    schoolIdByCode.set(pCode.trim(), { id: doc.id, name: sName });
                }
            });
        } catch (err) {
            console.error('Error querying schools in Firestore:', err);
        }
    }

    // Fetch all existing parish users to prevent duplicate parishes under the same forane or duplicate parishCodes
    const existingParishes = new Set<string>();
    const existingParishCodes = new Set<string>();
    if (uniqueBatchUsers.some(u => u.role === 'parish')) {
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'parish'));
            const snap = await getDocs(q);
            snap.docs.forEach(doc => {
                const data = doc.data();
                const pName = data.parish || data.parishName || '';
                const fName = data.forane || '';
                const normP = cleanEntityName(pName);
                const normF = cleanEntityName(fName);
                if (normP) {
                    existingParishes.add(`${normF}|${normP}`);
                }
                const pCode = data.parishCode || '';
                if (pCode) {
                    existingParishCodes.add(pCode.trim());
                }
            });
        } catch (err) {
            console.error('Error querying parishes in Firestore:', err);
        }
    }

    // 2. Validate against DB
    for (const item of uniqueBatchUsers) {
        if (duplicateEmailsInDb.has(item.email)) {
            errors.push({
                email: item.original.email || 'unknown',
                error: 'Email is already in use by another user'
            });
            continue;
        }

        const parishCodeNorm = (item.original.parishCode || '').trim();

        if (item.role === 'school') {
            if (parishCodeNorm && existingSchoolParishCodes.has(parishCodeNorm)) {
                errors.push({
                    email: item.original.email || 'unknown',
                    error: `A Sunday School with Parish Code '${parishCodeNorm}' is already registered`
                });
                continue;
            }
            if (item.schoolNameNorm && existingSchools.has(item.schoolNameNorm)) {
                errors.push({
                    email: item.original.email || 'unknown',
                    error: `A Sunday School named '${item.rawSchoolName}' is already registered`
                });
                continue;
            }
        }

        if (item.role === 'parish') {
            if (parishCodeNorm && existingParishCodes.has(parishCodeNorm)) {
                errors.push({
                    email: item.original.email || 'unknown',
                    error: `A Parish with Parish Code '${parishCodeNorm}' is already registered`
                });
                continue;
            }
            if (item.parishNameNorm && existingParishes.has(item.parishKey)) {
                errors.push({
                    email: item.original.email || 'unknown',
                    error: `A Parish named '${item.rawParishName}' is already registered under Forane '${item.original.forane || ''}'`
                });
                continue;
            }
        }

        validUsers.push(item.original);
    }

    // 3. Invoke Cloud Function for valid entries
    let createdCount = 0;
    let failedCount = errors.length;

    // Auto-link schoolId and schoolName for parish users using the parishCode
    for (const u of validUsers) {
        if (u.role === 'parish') {
            u.phoneNumber = "";
            if (u.parishCode) {
                const schoolInfo = schoolIdByCode.get(u.parishCode.trim());
                if (schoolInfo) {
                    u.schoolId = schoolInfo.id;
                    u.schoolName = schoolInfo.name;
                    u.schoolname = schoolInfo.name;
                }
            }
        }
    }

    if (validUsers.length > 0) {
        const bulkCreateUsersFunction = httpsCallable<{ users: Partial<UserData>[] }, BulkCreateResponse>(
            functions,
            'bulkCreateUsers'
        );

        try {
            const result = await bulkCreateUsersFunction({ users: validUsers });
            const cfData = result.data;
            createdCount = cfData.created;
            failedCount += cfData.failed;
            if (cfData.errors) {
                errors.push(...cfData.errors);
            }
        } catch (error: any) {
            console.error('Error calling bulkCreateUsers function:', error);
            // Treat valid users as failed if function itself fails
            failedCount += validUsers.length;
            validUsers.forEach(u => {
                errors.push({
                    email: u.email || 'unknown',
                    error: error.message || 'Failed to communicate with creation service'
                });
            });
        }
    }

    return {
        success: failedCount === 0,
        created: createdCount,
        failed: failedCount,
        errors
    };
};

