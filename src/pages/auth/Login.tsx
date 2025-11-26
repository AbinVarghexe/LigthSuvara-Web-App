import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Loader2, GalleryVerticalEnd } from 'lucide-react';
import { toast } from 'sonner';
import { login, isAdmin } from '../../features/auth/services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';

export function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Login component mounted");
    }, []);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const userCredential = await login(data.email, data.password);
            const adminStatus = await isAdmin(userCredential.user);

            if (adminStatus) {
                toast.success('Welcome back!');
                navigate('/');
            } else {
                toast.error('Access denied. Admin privileges required.');
            }
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/invalid-credential') {
                toast.error('Invalid email or password');
            } else {
                toast.error('Failed to login. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-gray-900">
            <div className="flex items-center gap-2 mb-8 font-medium text-gray-900">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
                    <GalleryVerticalEnd className="size-4" />
                </div>
                Acme Inc.
            </div>

            <Card className="w-full max-w-[400px] bg-white border-gray-200 shadow-xl">
                <CardHeader className="text-center space-y-2 pb-6">
                    <CardTitle className="text-xl font-semibold text-gray-900">Welcome back</CardTitle>
                    <CardDescription className="text-gray-500">
                        Login with your Google account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Button variant="outline" className="w-full bg-white border-gray-200 hover:bg-gray-50 text-gray-700 h-10">
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Login with Google
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full bg-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input
                                id="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                                type="email"
                                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-600"
                                placeholder="m@example.com"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message as string}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-gray-700">Password</Label>
                                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                    Forgot your password?
                                </a>
                            </div>
                            <Input
                                id="password"
                                {...register('password', { required: 'Password is required' })}
                                type="password"
                                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-600"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message as string}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white hover:bg-blue-700 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-gray-500">
                        Don't have an account?{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                            Sign up
                        </a>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 text-center text-xs text-gray-500 max-w-[300px]">
                By clicking continue, you agree to our{" "}
                <a href="#" className="hover:text-gray-700 underline underline-offset-4">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="hover:text-gray-700 underline underline-offset-4">Privacy Policy</a>.
            </div>
        </div>
    );
}
