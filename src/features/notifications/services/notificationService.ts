import {
    collection,
    addDoc,
    serverTimestamp,
    writeBatch,
    doc,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';

export interface NotificationData {
    id: string;
    title: string;
    body: string;
    imageUrl?: string;
    timestamp: Timestamp;
    recipientId: string;
    recipientNames?: string[];
    isBroadcast: boolean;
    isRead: boolean;
    audience: 'public' | 'all' | 'specific';
}

export const uploadMessageImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `message-images/${fileName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

export const sendBroadcast = async (title: string, body: string, imageUrl?: string) => {
    return await addDoc(collection(db, 'notifications'), {
        title,
        body,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        recipientId: 'public',
        isBroadcast: true,
        isRead: false,
        audience: 'public',
    });
};

export const sendToAll = async (title: string, body: string, imageUrl?: string) => {
    return await addDoc(collection(db, 'notifications'), {
        title,
        body,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        recipientId: 'all',
        isBroadcast: true,
        isRead: false,
        audience: 'all',
    });
};

export const sendToSpecific = async (title: string, body: string, schoolIds: string[], schoolNames?: string[], imageUrl?: string) => {
    const batch = writeBatch(db);
    schoolIds.forEach((schoolId) => {
        const docRef = doc(collection(db, 'notifications'));
        batch.set(docRef, {
            title,
            body,
            imageUrl: imageUrl || null,
            timestamp: serverTimestamp(),
            recipientId: schoolId,
            recipientNames: schoolNames || [],
            isBroadcast: false,
            isRead: false,
            audience: 'specific',
        });
    });
    await batch.commit();
};

export const getNotifications = async (): Promise<NotificationData[]> => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NotificationData));
};

export const deleteNotification = async (notificationId: string) => {
    await deleteDoc(doc(db, 'notifications', notificationId));
};
