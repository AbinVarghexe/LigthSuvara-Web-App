import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, User } from 'firebase/auth';
import { db, storage, auth } from '../../../config/firebase';

export interface UserData {
    id: string;
    uid: string;
    email: string;
    role: 'admin' | 'school';
    schoolname?: string;
    schoolName?: string;
    fullName?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
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

export const updateUserRole = async (userId: string, newRole: 'admin' | 'school') => {
    return await updateDoc(doc(db, 'users', userId), { role: newRole });
};

export const deleteUser = async (userId: string) => {
    return await deleteDoc(doc(db, 'users', userId));
};

export const getEventsByUser = async (userId: string) => {
    const q = query(
        collection(db, 'events'),
        where('creatorId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    const storageRef = ref(storage, `profile-images/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
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

export const bulkCreateUsers = async (users: Partial<UserData>[]) => {
    const batch = writeBatch(db);

    users.forEach((user) => {
        // Create a new document reference with an auto-generated ID
        const newUserRef = doc(collection(db, 'users'));
        batch.set(newUserRef, {
            ...user,
            uid: newUserRef.id, // Use doc ID as UID for now since we can't create Auth users in bulk client-side easily
            createdAt: new Date().toISOString()
        });
    });

    await batch.commit();
};
