import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../../../config/firebase';

export interface UserLog {
    id: string;
    userId: string;
    userEmail: string | null;
    role?: string;
    action: 'LOGIN';
    timestamp: any; // Using any for Timestamp as the exact type from firestore depends on usage, typically we map to Date in the UI
}

export const logUserAccess = async (user: User, role?: string) => {
    try {
        const logsRef = collection(db, 'logs');
        await addDoc(logsRef, {
            userId: user.uid,
            userEmail: user.email,
            role: role || 'user',
            action: 'LOGIN',
            timestamp: serverTimestamp()
        });
        console.log("User login logged successfully.");
    } catch (error) {
        console.error("Error logging user access:", error);
    }
};

export const getUserLogs = async (): Promise<UserLog[]> => {
    try {
        const logsRef = collection(db, 'logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);

        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as UserLog[];
    } catch (error) {
        console.error("Error fetching user logs:", error);
        throw error;
    }
};
