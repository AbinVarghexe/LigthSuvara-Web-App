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
        await updateProfile(auth.currentUser, {
            photoURL: data.profileImageUrl,
            displayName: data.fullName
        });
    }
};

export interface BulkCreateResponse {
    success: boolean;
    created: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
}

export const bulkCreateUsers = async (users: Partial<UserData>[]): Promise<BulkCreateResponse> => {
    // Call the Cloud Function to securely create users with Firebase Auth
    const bulkCreateUsersFunction = httpsCallable<{ users: Partial<UserData>[] }, BulkCreateResponse>(
        functions,
        'bulkCreateUsers'
    );

    try {
        const result = await bulkCreateUsersFunction({ users });
        return result.data;
    } catch (error: any) {
        console.error('Error calling bulkCreateUsers function:', error);
        throw new Error(error.message || 'Failed to create users');
    }
};
