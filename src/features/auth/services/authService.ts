import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

export const login = async (email: string, password: string) => {
    return await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
    return await signOut(auth);
};

export const resetPassword = async (email: string) => {
    return await sendPasswordResetEmail(auth, email);
};

export const isAdmin = async (user: User | null): Promise<boolean> => {
    if (!user) return false;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = userDoc.data()?.role;
        return userDoc.exists() && role === 'admin';
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
};

export const getUserRole = async (user: User | null): Promise<string | null> => {
    if (!user) return null;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        return userDoc.exists() ? userDoc.data()?.role : null;
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
};
