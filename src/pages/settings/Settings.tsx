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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { RecaptchaVerifier, updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

export function Settings() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // SMS verification states
    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [smsLoading, setSmsLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

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
                            setPhoneNumber(userData.phoneNumber);
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

    const handleSendSmsOtp = async () => {
        if (!phoneNumber) {
            toast.error("Please provide a phone number in your profile and save it first.");
            return;
        }

        if (!phoneNumber.startsWith('+')) {
            toast.error("Phone number must include country code starting with '+' (e.g. +919876543210)");
            return;
        }

        setSmsLoading(true);
        try {
            // Clean up old verifier if it exists
            if (recaptchaVerifier) {
                try {
                    recaptchaVerifier.clear();
                } catch (clearErr) {
                    console.error("Error clearing old verifier:", clearErr);
                }
            }

            // Completely recreate the recaptcha-container element to prevent "already rendered" issues
            let container = document.getElementById('recaptcha-container');
            if (container) {
                container.remove();
            }
            container = document.createElement('div');
            container.id = 'recaptcha-container';
            document.body.appendChild(container);

            // Disable app verification for testing in development environments (helps bypass recaptcha on localhost)
            // Note: In development mode, only fictional test phone numbers (set up in Firebase console) will work.
            if (import.meta.env.DEV) {
                auth.settings.appVerificationDisabledForTesting = true;
            } else {
                auth.settings.appVerificationDisabledForTesting = false;
            }

            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible'
            });
            setRecaptchaVerifier(verifier);

            const { linkWithPhoneNumber } = await import('firebase/auth');
            
            if (!auth.currentUser) {
                throw new Error("No active user session found");
            }

            const result = await linkWithPhoneNumber(auth.currentUser, phoneNumber, verifier);
            setConfirmationResult(result);
            setOtpSent(true);
            toast.success("OTP verification code sent to your phone number!");
        } catch (error: any) {
            console.error("Error sending SMS OTP:", error);
            toast.error(error?.message || "Failed to send SMS OTP code");
        } finally {
            setSmsLoading(false);
        }
    };

    const handleVerifyOtpAndChangePassword = async () => {
        if (!otpCode || otpCode.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP code");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setVerifying(true);
        try {
            await confirmationResult.confirm(otpCode);

            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
                
                try {
                    const { unlink } = await import('firebase/auth');
                    await unlink(auth.currentUser, 'phone');
                } catch (unlinkErr) {
                    console.error("Optional phone unlink failed:", unlinkErr);
                }

                toast.success("Password updated successfully!");
                setIsSmsModalOpen(false);
                setOtpSent(false);
                setOtpCode('');
                setNewPassword('');
                setConfirmPassword('');
                setConfirmationResult(null);
                if (recaptchaVerifier) {
                    recaptchaVerifier.clear();
                    setRecaptchaVerifier(null);
                }
            } else {
                throw new Error("No active user session found");
            }
        } catch (error: any) {
            console.error("Error changing password:", error);
            toast.error(error?.message || "Failed to verify OTP or update password");
        } finally {
            setVerifying(false);
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
                            <div className="space-y-6">
                                <div className="space-y-2 border-b border-border pb-4">
                                    <h4 className="font-medium text-sm text-foreground">Option 1: Verify via Email</h4>
                                    <p className="text-xs text-muted-foreground">
                                        We will send a password reset link to your email address. Follow the instructions in the email to complete the reset.
                                    </p>
                                    <Button
                                        onClick={handlePasswordReset}
                                        variant="outline"
                                        disabled={isLoading}
                                        className="mt-2"
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

                                <div className="space-y-2 pt-2">
                                    <h4 className="font-medium text-sm text-foreground">Option 2: Verify via SMS OTP</h4>
                                    <p className="text-xs text-muted-foreground">
                                        We will send a verification code to your phone number ({phoneNumber || 'No phone number set'}). Enter the code and set your new password directly.
                                    </p>
                                    <Button
                                        onClick={() => setIsSmsModalOpen(true)}
                                        variant="outline"
                                        disabled={!phoneNumber}
                                        className="mt-2"
                                    >
                                        Verify & Reset via SMS
                                    </Button>
                                    {!phoneNumber && (
                                        <p className="text-[11px] text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20 mt-2">
                                            Please set and save your Phone Number (starting with country code, e.g. +91...) in the profile section first.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SMS OTP verification dialog */}
                    <Dialog open={isSmsModalOpen} onOpenChange={(open) => !verifying && !smsLoading && setIsSmsModalOpen(open)}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Verify via SMS OTP</DialogTitle>
                                <DialogDescription>
                                    Reset your password by verifying ownership of the registered phone number.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {!otpSent ? (
                                    <div className="space-y-3 text-center py-2">
                                        <p className="text-sm">
                                            We will send a 6-digit code to <strong>{phoneNumber}</strong>.
                                        </p>
                                        <Button onClick={handleSendSmsOtp} disabled={smsLoading} className="w-full">
                                            {smsLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                'Send Verification Code'
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="otpCode">Verification Code</Label>
                                            <Input
                                                id="otpCode"
                                                type="text"
                                                maxLength={6}
                                                placeholder="Enter 6-digit code"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                disabled={verifying}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={verifying}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={verifying}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsSmsModalOpen(false);
                                        setOtpSent(false);
                                        setOtpCode('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setConfirmationResult(null);
                                    }}
                                    disabled={verifying || smsLoading}
                                >
                                    Cancel
                                </Button>
                                {otpSent && (
                                    <Button onClick={handleVerifyOtpAndChangePassword} disabled={verifying}>
                                        {verifying ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify & Update'
                                        )}
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

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
