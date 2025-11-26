import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';

export function NotAuthorized() {
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
                <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors w-full"
                >
                    Return to Login
                </Link>
            </div>
        </div>
    );
}
