import { useState } from 'react';
import { Outlet } from 'react-router';
import { LegalSidebar } from './LegalSidebar';
import { ModeToggle } from '../mode-toggle';
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';

export type TocItem = {
    id: string;
    title: string;
};

export type LegalLayoutContextType = {
    setTocItems: (items: TocItem[]) => void;
};

export function LegalLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [tocItems, setTocItems] = useState<TocItem[]>([]);

    return (
        <div className="flex min-h-screen bg-background">
            <LegalSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                tocItems={tocItems}
            />

            <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>

                    <div className="flex-1" />

                    <ModeToggle />
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet context={{ setTocItems } satisfies LegalLayoutContextType} />
                </main>
            </div>
        </div>
    );
}
