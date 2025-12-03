import { Link, useLocation } from 'react-router';
import { Shield, FileText, ArrowLeft, X } from 'lucide-react';
import logoDark from '../../assets/Logo-dark.png';
import logoWhite from '../../assets/Logo-white.png';
import { TocItem } from './LegalLayout';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { useTheme } from '../theme-provider';

interface LegalSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    tocItems?: TocItem[];
}

export function LegalSidebar({ isOpen, onClose, tocItems = [] }: LegalSidebarProps) {
    const location = useLocation();
    const [activeSection, setActiveSection] = useState<string>('');
    const { theme } = useTheme();

    // Determine which logo to use based on theme
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const logoSrc = isDark ? logoWhite : logoDark;

    const navigation = [
        { name: 'Privacy Policy', href: '/privacy-policy', icon: Shield },
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
            if (window.innerWidth < 1024) {
                onClose();
            }
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const sections = tocItems.map(item => document.getElementById(item.id));
            const scrollPosition = window.scrollY + 100; // Offset for header

            for (const section of sections) {
                if (section && section.offsetTop <= scrollPosition && (section.offsetTop + section.offsetHeight) > scrollPosition) {
                    setActiveSection(section.id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [tocItems]);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                w-64 bg-card border-r border-border h-screen flex flex-col 
                fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent lg:hidden"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="relative w-20 h-20">
                            <img
                                src={logoSrc}
                                alt="Light Suvara Logo"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Light Suvara</h2>
                            <p className="text-xs text-muted-foreground">Legal Center</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1 mb-6">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        onClick={() => onClose()}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {tocItems.length > 0 && (
                        <>
                            <div className="px-4 my-4">
                                <div className="border-t border-border" />
                            </div>
                            <div>
                                <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    On this page
                                </h3>
                                <ul className="space-y-1">
                                    {tocItems.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => scrollToSection(item.id)}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                                                    activeSection === item.id
                                                        ? "bg-accent text-accent-foreground font-medium border-l-2 border-primary"
                                                        : "text-muted-foreground"
                                                )}
                                            >
                                                {item.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </nav>

                {/* Back to App */}
                <div className="p-4 border-t border-border">
                    <a
                        href="https://play.google.com/store/apps/details?id=com.lightsuvara.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to App</span>
                    </a>
                </div>
            </div>
        </>
    );
}
