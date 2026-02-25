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
    updateDoc,
    Timestamp,
    onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';

const BROADCASTS_COLLECTION = 'broadcasts';
const NOTIFICATIONS_COLLECTION = 'notifications';

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
    readBy?: string[];
}

export const uploadMessageImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `message-images/${fileName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

export const sendBroadcast = async (title: string, body: string, imageUrl?: string) => {
    return await addDoc(collection(db, BROADCASTS_COLLECTION), {
        title,
        body,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        recipientId: 'public',
        isBroadcast: true,
        isRead: false,
        audience: 'public',
        readBy: [],
    });
};

export const sendToAll = async (title: string, body: string, imageUrl?: string) => {
    return await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        title,
        body,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        recipientId: 'role_school',
        isBroadcast: true,
        isRead: false,
        audience: 'all',
        readBy: [],
    });
};

export const sendToSpecific = async (title: string, body: string, schoolIds: string[], schoolNames?: string[], imageUrl?: string) => {
    const batch = writeBatch(db);
    schoolIds.forEach((schoolId) => {
        const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
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
            readBy: [],
        });
    });
    await batch.commit();
};

/**
 * Fetches all messages from both `broadcasts` and `notifications` collections,
 * merges them, and sorts by timestamp descending.
 */
export const getNotifications = async (): Promise<NotificationData[]> => {
    const [broadcastSnap, notifSnap] = await Promise.all([
        getDocs(query(collection(db, BROADCASTS_COLLECTION), orderBy('timestamp', 'desc'))),
        getDocs(query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('timestamp', 'desc'))),
    ]);

    const broadcasts = broadcastSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        audience: 'public' as const,
    } as NotificationData));

    const notifications = notifSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
    } as NotificationData));

    const merged = [...broadcasts, ...notifications];

    merged.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime;
    });

    return merged;
};

/**
 * Fetches only public broadcasts from the `broadcasts` collection.
 */
export const getBroadcasts = async (): Promise<NotificationData[]> => {
    const q = query(collection(db, BROADCASTS_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        audience: 'public' as const,
    } as NotificationData));
};

/**
 * Fetches only user notifications (all-users + specific) from the `notifications` collection.
 */
export const getUserNotifications = async (): Promise<NotificationData[]> => {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NotificationData));
};

/**
 * Deletes a notification from the correct collection based on its audience type.
 */
export const deleteNotification = async (notificationId: string, audience?: string) => {
    const collectionName = audience === 'public' ? BROADCASTS_COLLECTION : NOTIFICATIONS_COLLECTION;
    await deleteDoc(doc(db, collectionName, notificationId));
};

/**
 * Updates a notification in the correct collection based on its audience type.
 */
export const updateNotification = async (
    notificationId: string,
    data: { title: string; body: string; imageUrl?: string | null },
    audience?: string
) => {
    const collectionName = audience === 'public' ? BROADCASTS_COLLECTION : NOTIFICATIONS_COLLECTION;
    const docRef = doc(db, collectionName, notificationId);
    await updateDoc(docRef, {
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl ?? null,
    });
};

/**
 * Real-time listener for all notifications (broadcasts + notifications).
 * Merges both collections and returns an unsubscribe function.
 */
export const subscribeToNotifications = (
    callback: (notifications: NotificationData[]) => void
) => {
    let broadcastsData: NotificationData[] = [];
    let notificationsData: NotificationData[] = [];

    const mergeAndCallback = () => {
        const merged = [...broadcastsData, ...notificationsData];
        merged.sort((a, b) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return bTime - aTime;
        });
        callback(merged);
    };

    const broadcastQ = query(collection(db, BROADCASTS_COLLECTION), orderBy('timestamp', 'desc'));
    const notifQ = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('timestamp', 'desc'));

    const unsubBroadcasts = onSnapshot(broadcastQ, (snapshot) => {
        broadcastsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            audience: 'public' as const,
        } as NotificationData));
        mergeAndCallback();
    }, (error) => {
        console.error('Error subscribing to broadcasts:', error);
    });

    const unsubNotifications = onSnapshot(notifQ, (snapshot) => {
        notificationsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
        } as NotificationData));
        mergeAndCallback();
    }, (error) => {
        console.error('Error subscribing to notifications:', error);
    });

    // Return a combined unsubscribe function
    return () => {
        unsubBroadcasts();
        unsubNotifications();
    };
};
