import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-medium text-gray-900">Admin User</p>
            <p className="text-sm text-gray-500">admin@lightsuvara.com</p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" alt="Admin" />
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
