import { ShieldAlert, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';

export function NotAuthorized() {
    const { currentUser } = useAuth();
    const [isFixing, setIsFixing] = useState(false);

    const handleFixPermissions = async () => {
        if (!currentUser) {
            toast.error("No user logged in");
            return;
        }

        setIsFixing(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                role: 'admin'
            });
            toast.success("Permissions updated! Reloading...");
            // Force reload to re-fetch admin status
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            console.error("Error updating permissions:", error);
            toast.error("Failed to update permissions. Check console.");
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-8">
                    You do not have permission to access the admin panel. Please contact the administrator if you believe this is a mistake.
                </p>
                <div className="space-y-3">
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors w-full"
                    >
                        Return to Login
                    </Link>

                    {import.meta.env.DEV && (
                        <button
                            onClick={handleFixPermissions}
                            disabled={isFixing}
                            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors w-full"
                        >
                            <Wrench className="w-4 h-4 mr-2" />
                            {isFixing ? 'Fixing Permissions...' : 'Fix Permissions (Dev Only)'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
