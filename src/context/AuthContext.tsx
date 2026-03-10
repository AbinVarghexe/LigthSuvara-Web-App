import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { isAdmin } from '../features/auth/services/authService';
import { updateUserActivity } from '../features/users/services/userService';

interface AuthContextType {
    currentUser: User | null;
    userRole: 'admin' | 'school' | 'parish' | null;
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
    const [userRole, setUserRole] = useState<'admin' | 'school' | 'parish' | null>(null);
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

        // Activity Tracking Interval
        let activityInterval: NodeJS.Timeout;
        if (currentUser) {
            // Ping immediately on load context if logged in
            updateUserActivity(currentUser.uid);

            // Then schedule a ping every 5 minutes (300000ms)
            activityInterval = setInterval(() => {
                updateUserActivity(currentUser.uid);
            }, 5 * 60 * 1000);
        }

        return () => {
            unsubscribe();
            if (activityInterval) clearInterval(activityInterval);
        };
    }, [currentUser]);

    const value = {
        currentUser,
        userRole,
        loading,
        isAdminUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
