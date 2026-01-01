import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, Facebook, Chrome } from 'lucide-react'; // Chrome as Google placeholder
import { toast } from 'sonner';
import { login, isAdmin } from '../../features/auth/services/authService';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

import logoDark from '../../assets/Logo-dark.png';
import logoWhite from '../../assets/Logo-white.png';
import { useTheme } from '../../components/theme-provider';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

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
        <div className="min-h-screen flex items-center justify-center p-6 md:p-10 bg-muted/40">
            <div className="w-full h-[80vh] max-w-7xl grid lg:grid-cols-2 rounded-xl overflow-hidden shadow-2xl bg-background border border-border/50">
            
            {/* Left Side - Gradient & Branding */}
            <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-zinc-900" />
                <img 
                    src="https://i.pinimg.com/originals/ee/47/3e/ee473e4277a2272c3e07962b2163454d.gif" 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                
                {/* Decorative gradients for text legibility */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/30" />
                <div className="absolute inset-0 bg-black/20" />
                
                <div className="relative z-10">
                    <div className="relative w-20 h-20 xl:w-30 xl:h-20">
                        <ImageWithFallback
                            src={logoWhite} // Always white on dark background (left panel)
                            alt="Light Suvara Logo"
                            className="absolute inset-0 w-full h-full object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-6 lg:p-8 bg-background">
                <div className="mx-auto w-full max-w-[400px] space-y-8">
                    
                    <div className="space-y-2 text-center lg:text-left">
                         {/* Mobile Logo for context */}
                         <div className="lg:hidden flex justify-center mb-4 text-primary relative w-16 h-16 mx-auto">
                            <ImageWithFallback
                                src={logoSrc}
                                alt="Light Suvara Logo"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                         </div>

                        <h2 className="text-3xl font-bold tracking-tight">Login to Light Suvara</h2>
                        <p className="text-muted-foreground text-base">
                            Access the Light Suvara administration system to manage programs, evaluations, and parish operations securely.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Your email</Label>
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
                                    placeholder="name@example.com"
                                    className="h-11"
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message as string}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        {...register('password', { required: 'Password is required' })}
                                        type={showPassword ? "text" : "password"}
                                        className="h-11 pr-10"
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
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Please wait...
                                    </>
                                ) : (
                                    'Get Started'
                                )}
                            </Button>
                        </form>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">Don't have an account? </span>
                            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                                Contact Administrator
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
    );
}
