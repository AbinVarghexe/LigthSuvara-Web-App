import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { isAdmin } from '../features/auth/services/authService';

interface AuthContextType {
    currentUser: User | null;
    userRole: 'admin' | 'school' | null;
    loading: boolean;
    isAdminUser: boolean;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    userRole: null,
    loading: true,
    isAdminUser: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'school' | null>(null);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const adminStatus = await isAdmin(user);
                setIsAdminUser(adminStatus);
                // We could also fetch the user role here if needed for non-admins
                // For now, isAdmin check is sufficient for the admin panel
            } else {
                setIsAdminUser(false);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        loading,
        isAdminUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
