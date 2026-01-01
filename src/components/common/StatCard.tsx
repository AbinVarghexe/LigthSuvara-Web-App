import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
}

export function StatCard({ title, value, icon: Icon, iconColor, iconBg }: StatCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-xs sm:text-sm font-medium">{title}</p>
                        <h3 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold">{value}</h3>
                    </div>
                    <div className={`${iconBg} ${iconColor} p-2 sm:p-3 rounded-lg`}>
                        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
