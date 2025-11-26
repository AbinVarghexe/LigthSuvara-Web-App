import {
    collection,
    addDoc,
    serverTimestamp,
    writeBatch,
    doc,
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from './firebase';

export const sendBroadcast = async (title: string, body: string) => {
    return await addDoc(collection(db, 'broadcasts'), {
        title,
        body,
        timestamp: serverTimestamp(),
    });
};

export const sendToAll = async (title: string, body: string) => {
    return await addDoc(collection(db, 'notifications'), {
        title,
        body,
        timestamp: serverTimestamp(),
        recipientId: 'all',
        isBroadcast: true,
        isRead: false,
    });
};

export const sendToSpecific = async (title: string, body: string, schoolIds: string[]) => {
    const batch = writeBatch(db);
    schoolIds.forEach((schoolId) => {
        const ref = doc(collection(db, 'notifications'));
        batch.set(ref, {
            title,
            body,
            timestamp: serverTimestamp(),
            recipientId: schoolId,
            isBroadcast: false,
            isRead: false,
        });
    });
    await batch.commit();
};

export const getNotifications = async () => {
    // This might need to be refined to fetch from both 'notifications' and 'broadcasts' 
    // or just one depending on what we want to show in history.
    // For now, let's fetch from 'notifications' collection.
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
