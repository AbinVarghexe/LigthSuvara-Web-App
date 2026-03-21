import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface UserLog {
    id: string;
    userId: string;
    userEmail: string | null;
    role?: string;
    action: 'LOGIN' | 'LOGOUT';
    device?: string;
    timestamp: any;
}

export const logUserAccess = async (
    user: { uid: string, email: string | null }, 
    role: string = 'user', 
    action: 'LOGIN' | 'LOGOUT' = 'LOGIN',
    device: string = 'web'
) => {
    try {
        const logsRef = collection(db, 'logs');
        await addDoc(logsRef, {
            userId: user.uid,
            userEmail: user.email,
            role: role,
            action: action,
            device,
            timestamp: serverTimestamp()
        });
        console.log(`User ${action.toLowerCase()} logged successfully.`);
    } catch (error) {
        console.error(`Error logging user ${action.toLowerCase()}:`, error);
    }
};

export const getUserLogs = async (): Promise<UserLog[]> => {
    try {
        const logsRef = collection(db, 'logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId || data.uid || '',
                userEmail: data.userEmail || data.user || 'Unknown',
                role: data.role || 'user',
                action: (data.action || 'LOGIN').toUpperCase(),
                device: data.device || (data.details?.toLowerCase().includes('mobile') ? 'mobile' : 'web'),
                timestamp: data.timestamp
            } as UserLog;
        });

        // Cache to avoid redundant user lookups
        const userCache = new Map<string, any>();

        // Enrich logs that have missing data
        const enrichedLogs = await Promise.all(logs.map(async (log: UserLog) => {
            const needsEmail = !log.userEmail || log.userEmail === 'Unknown';
            const needsRole = !log.role || log.role === 'user';

            if ((needsEmail || needsRole) && log.userId) {
                try {
                    // Check cache first
                    let userData = userCache.get(log.userId);
                    
                    if (!userData) {
                        const userDoc = await getDoc(doc(db, 'users', log.userId));
                        if (userDoc.exists()) {
                            userData = userDoc.data();
                            userCache.set(log.userId, userData);
                        } else {
                            // Mark as not found to avoid repeated failed lookups
                            userCache.set(log.userId, { notFound: true });
                        }
                    }

                    if (userData && !userData.notFound) {
                        return {
                            ...log,
                            userEmail: needsEmail ? (userData.email || log.userEmail) : log.userEmail,
                            role: needsRole ? (userData.role || log.role) : log.role,
                        };
                    }
                } catch (err) {
                    console.error(`Error enriching log ${log.id} for user ${log.userId}:`, err);
                }
            }
            return log;
        }));

        return enrichedLogs;
    } catch (error) {
        console.error("Error fetching user logs:", error);
        return [];
    }
};
