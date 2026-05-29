import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Save, Loader2, LogOut, Camera } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { resetPassword, logout, getUserRole } from '../../features/auth/services/authService';
import { logUserAccess } from '../../features/logs/services/logService';
import { updateUserProfile, uploadProfileImage } from '../../features/users/services/userService';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

export function Settings() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { register, handleSubmit, setValue } = useForm({
        defaultValues: {
            email: currentUser?.email || '',
            fullName: currentUser?.displayName || '',
            phoneNumber: '', // Will be populated by useEffect if available in Firestore
        }
    });

    useEffect(() => {
        if (currentUser?.photoURL) {
            setImagePreview(currentUser.photoURL);
        }
        if (currentUser?.displayName) {
            setValue('fullName', currentUser.displayName);
        }
    }, [currentUser, setValue]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser?.uid) {
                try {
                    // Import getUser dynamically or assume it's available. 
                    // Better to import it at the top.
                    // For now, let's assume we need to add the import.
                    const { getUser } = await import('../../features/users/services/userService');
                    const userData = await getUser(currentUser.uid);
                    if (userData) {
                        if (userData.phoneNumber) {
                            setValue('phoneNumber', userData.phoneNumber);
                        }
                        if (userData.fullName) {
                            setValue('fullName', userData.fullName);
                        }
                        if (userData.profileImageUrl && !imagePreview) {
                            setImagePreview(userData.profileImageUrl);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user details:", error);
                }
            }
        };
        fetchUserData();
    }, [currentUser, setValue, imagePreview]);

    const handlePasswordReset = async () => {
        if (!currentUser?.email) return;
        setIsLoading(true);
        try {
            await resetPassword(currentUser.email);
            toast.success('Password reset email sent to your email address');
        } catch (error) {
            console.error("Error sending reset email:", error);
            toast.error("Failed to send password reset email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            if (currentUser) {
                const role = await getUserRole(currentUser);
                await logUserAccess(
                    { uid: currentUser.uid, email: currentUser.email },
                    role || 'user',
                    'LOGOUT'
                );
            }
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Error logging out:", error);
            toast.error("Failed to logout");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmitProfile = async (data: any) => {
        if (!currentUser) return;
        setIsSavingProfile(true);
        try {
            let imageUrl = currentUser.photoURL;

            if (selectedFile) {
                imageUrl = await uploadProfileImage(currentUser.uid, selectedFile);
            }

            await updateUserProfile(currentUser.uid, {
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                profileImageUrl: imageUrl || undefined
            });

            toast.success("Profile updated successfully");
            // Force reload to see changes
            window.location.reload();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account and application preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Navigation (if needed in future) */}
                <div className="md:col-span-1 space-y-2">
                    <Button variant="secondary" className="w-full justify-start text-primary font-medium">
                        General
                    </Button>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Profile Information</CardTitle>
                                    <CardDescription>Update your account details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                                {/* Profile Image Upload */}
                                <div className="flex flex-col items-center sm:flex-row gap-6">
                                    <div className="relative group">
                                        <Avatar className="w-24 h-24 border-2 border-gray-100">
                                            <AvatarImage src={imagePreview || ''} alt="Profile" loading="lazy" />
                                            <AvatarFallback className="text-2xl bg-gray-100 text-gray-400">
                                                {currentUser?.email?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label
                                            htmlFor="profile-upload"
                                            className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            <Camera className="w-4 h-4" />
                                            <input
                                                id="profile-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="font-medium text-foreground">Profile Picture</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Upload a new profile picture. Recommended size: 400x400px.
                                            <br />
                                            Max file size: 5MB.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            {...register('fullName')}
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            {...register('email')}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input
                                            id="phoneNumber"
                                            {...register('phoneNumber')}
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={isSavingProfile}
                                    >
                                        {isSavingProfile ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Lock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Security</CardTitle>
                                    <CardDescription>Manage your password and access</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    To change your password, we will send a password reset link to your email address.
                                </p>
                                <Button
                                    onClick={handlePasswordReset}
                                    variant="outline"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Password Reset Email'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logout Section */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Sign Out</h2>
                                    <p className="text-sm text-muted-foreground">Sign out of your admin account</p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
