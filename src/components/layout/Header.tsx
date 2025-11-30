import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Menu } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';

interface HeaderProps {
    title: string;
    onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
    return (
        <div className="bg-background border-b border-border px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-accent lg:hidden"
                    >
                        <Menu className="w-6 h-6 text-foreground" />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <ModeToggle />

                    <div className="text-right hidden sm:block">
                        <p className="font-medium text-foreground">Admin User</p>
                        <p className="text-sm text-muted-foreground">admin@lightsuvara.com</p>
                    </div>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" alt="Admin" loading="lazy" />
                        <AvatarFallback>AU</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    );
}
