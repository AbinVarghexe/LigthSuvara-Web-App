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
    writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export interface EventData {
    id?: string;
    title: string;
    description: string;
    place: string;
    date: Date;
    imageUrl?: string;
    category: 'cml' | 'suvara';
    isPublic: boolean;
    creatorId: string;
    creatorSchoolName: string;
    timestamp?: Timestamp;
}

export const getEvents = async () => {
    const q = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getEvent = async (eventId: string) => {
    const docRef = doc(db, 'events', eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such event!");
    }
};

export const createEvent = async (eventData: EventData) => {
    return await addDoc(collection(db, 'events'), {
        ...eventData,
        timestamp: serverTimestamp()
    });
};

export const updateEvent = async (eventId: string, eventData: Partial<EventData>) => {
    const docRef = doc(db, 'events', eventId);
    return await updateDoc(docRef, eventData);
};

export const deleteEvent = async (eventId: string) => {
    return await deleteDoc(doc(db, 'events', eventId));
};

export const publishEvent = async (eventId: string) => {
    return await updateEvent(eventId, { isPublic: true });
};

export const unpublishEvent = async (eventId: string) => {
    return await updateEvent(eventId, { isPublic: false });
};

export const deleteEventsByUserId = async (userId: string) => {
    const batch = writeBatch(db);
    const eventsQuery = query(
        collection(db, 'events'),
        where('creatorId', '==', userId)
    );
    const snapshot = await getDocs(eventsQuery);
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
};
