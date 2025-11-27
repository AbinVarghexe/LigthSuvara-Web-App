import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { login, isAdmin } from '../../features/auth/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import logoDark from '../../assets/Logo-dark.png';
import logoWhite from '../../assets/Logo-white.png';
import { useTheme } from '../../components/theme-provider';

export function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Determine which logo to use based on theme
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const logoSrc = isDark ? logoWhite : logoDark;

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">

            <Card className="w-full max-w-[400px] shadow-xl">
                <CardHeader className="text-center space-y-2 flex flex-col items-center">
                    <div className="relative w-16 h-16 mb-2">
                        <img
                            src={logoSrc}
                            alt="Light Suvara Logo"
                            className="absolute inset-0 w-full h-full object-contain"
                        />
                    </div>
                    <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
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
                                placeholder="m@example.com"
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message as string}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-sm text-primary hover:underline">
                                    Forgot your password?
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    {...register('password', { required: 'Password is required' })}
                                    type={showPassword ? "text" : "password"}
                                    className="pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message as string}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2"
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

                </CardContent>
            </Card>

        </div>
    );
}
