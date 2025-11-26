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
import { db } from '../../../config/firebase';

export type EventStatus = 'pending' | 'approved' | 'rejected';

export interface EventData {
    id?: string;
    title: string;
    description: string;
    place: string;
    date: Date;
    imageUrl?: string;
    category: 'cml' | 'suvara';
    isPublic: boolean;
    status?: EventStatus; // New field
    creatorId: string;
    creatorSchoolName: string;
    timestamp?: Timestamp;
}

export const getEvents = async (status?: EventStatus) => {
    let q;
    if (status) {
        q = query(
            collection(db, 'events'),
            where('status', '==', status),
            orderBy('timestamp', 'desc')
        );
    } else {
        q = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getPublicEvents = async () => {
    // Only show approved events that are also marked as public by the creator
    const q = query(
        collection(db, 'events'),
        where('status', '==', 'approved'),
        where('isPublic', '==', true),
        orderBy('timestamp', 'desc')
    );
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
        status: eventData.status || 'pending', // Default to pending if not specified
        timestamp: serverTimestamp()
    });
};

export const updateEvent = async (eventId: string, eventData: Partial<EventData>) => {
    const docRef = doc(db, 'events', eventId);
    return await updateDoc(docRef, eventData);
};

export const updateEventStatus = async (eventId: string, status: EventStatus) => {
    return await updateEvent(eventId, { status });
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
