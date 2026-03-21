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
    writeBatch,
    onSnapshot,
    deleteField
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
    lastEditedByName?: string;
    creatorForane?: string; // Forane of the event creator
    timestamp?: Timestamp;
    updatedAt?: Timestamp;
}

export const getEvents = async (status?: EventStatus, forane?: string) => {
    try {
        let q;
        if (status && forane) {
            q = query(
                collection(db, 'events'),
                where('status', '==', status),
                where('creatorForane', '==', forane),
                orderBy('timestamp', 'desc')
            );
        } else if (status) {
            q = query(
                collection(db, 'events'),
                where('status', '==', status),
                orderBy('timestamp', 'desc')
            );
        } else if (forane) {
            q = query(
                collection(db, 'events'),
                where('creatorForane', '==', forane),
                orderBy('timestamp', 'desc')
            );
        } else {
            q = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
        }
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
        // If the error is due to missing index, fetch without ordering
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.warn('Firestore index not found, fetching without ordering:', error);
            
            let q;
            if (status && forane) {
                q = query(
                    collection(db, 'events'),
                    where('status', '==', status),
                    where('creatorForane', '==', forane)
                );
            } else if (status) {
                q = query(
                    collection(db, 'events'),
                    where('status', '==', status)
                );
            } else if (forane) {
                q = query(
                    collection(db, 'events'),
                    where('creatorForane', '==', forane)
                );
            } else {
                // No filters, just get all events
                q = query(collection(db, 'events'));
            }
            
            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort in memory if we couldn't use orderBy
            return docs.sort((a: any, b: any) => {
                const aTime = a.timestamp?.seconds || 0;
                const bTime = b.timestamp?.seconds || 0;
                return bTime - aTime;
            });
        }
        
        throw error;
    }
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
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const updateEvent = async (eventId: string, eventData: Partial<EventData>) => {
    const docRef = doc(db, 'events', eventId);
    return await updateDoc(docRef, {
        ...eventData,
        updatedAt: serverTimestamp(),
        // Clean up legacy/unused fields
        creatorSchoolName: deleteField(),
        title_lowercase: deleteField()
    });
};

export const updateEventStatus = async (eventId: string, status: EventStatus) => {
    const updates: Partial<EventData> = { status };
    if (status === 'rejected') {
        updates.isPublic = false;
    } else if (status === 'approved') {
        updates.isPublic = true;
    }
    return await updateEvent(eventId, updates);
};

export const deleteEvent = async (eventId: string) => {
    return await deleteDoc(doc(db, 'events', eventId));
};

export const publishEvent = async (eventId: string) => {
    // Ensure status is approved when publishing
    return await updateEvent(eventId, { isPublic: true, status: 'approved' });
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

/** Real-time listener for events. Returns an unsubscribe function. */
export const subscribeToEvents = (
    callback: (events: EventData[]) => void,
    status?: EventStatus,
    forane?: string
) => {
    let q;
    if (status && forane) {
        q = query(
            collection(db, 'events'),
            where('status', '==', status),
            where('creatorForane', '==', forane),
            orderBy('timestamp', 'desc')
        );
    } else if (status) {
        q = query(
            collection(db, 'events'),
            where('status', '==', status),
            orderBy('timestamp', 'desc')
        );
    } else if (forane) {
        q = query(
            collection(db, 'events'),
            where('creatorForane', '==', forane),
            orderBy('timestamp', 'desc')
        );
    } else {
        q = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
        const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EventData));
        callback(events);
    }, (error: any) => {
        // Fallback: if index error, try without ordering
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.warn('Firestore index not found, subscribing without ordering:', error);
            let fallbackQ;
            if (status && forane) {
                fallbackQ = query(
                    collection(db, 'events'),
                    where('status', '==', status),
                    where('creatorForane', '==', forane)
                );
            } else if (status) {
                fallbackQ = query(
                    collection(db, 'events'),
                    where('status', '==', status)
                );
            } else if (forane) {
                fallbackQ = query(
                    collection(db, 'events'),
                    where('creatorForane', '==', forane)
                );
            } else {
                fallbackQ = query(collection(db, 'events'));
            }
            onSnapshot(fallbackQ, (snap) => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as EventData));
                docs.sort((a: any, b: any) => {
                    const aTime = a.timestamp?.seconds || 0;
                    const bTime = b.timestamp?.seconds || 0;
                    return bTime - aTime;
                });
                callback(docs);
            });
        } else {
            console.error('Error subscribing to events:', error);
        }
    });
};

