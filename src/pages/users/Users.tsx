import { useEffect, useState, useRef } from 'react';
import { Search, Filter, MoreVertical, Shield, School, Loader2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import { getUsers, UserData, bulkCreateUsers } from '../../features/users/services/userService';
import { Card, CardContent } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

export function Users() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [isUploading, setIsUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchUsers = async () => {
        try {
            const usersData = await getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.schoolname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = roleFilter === 'All' || user.role === roleFilter.toLowerCase();

        return matchesSearch && matchesRole;
    });

    const downloadTemplate = () => {
        const headers = ['email', 'fullName', 'role', 'schoolName', 'phoneNumber', 'password'];
        const sample = ['teacher@example.com,John Doe,school,St. Marys School,1234567890,ChangeMe123!'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n' + sample.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const rows = text.split('\n');
                const headers = rows[0].split(',').map(h => h.trim());

                const newUsers: Partial<UserData>[] = [];

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i].trim();
                    if (!row) continue;

                    const values = row.split(',').map(v => v.trim());
                    const user: any = {};

                    headers.forEach((header, index) => {
                        if (values[index]) {
                            user[header] = values[index];
                        }
                    });

                    if (user.email && user.role) {
                        // Basic validation
                        newUsers.push(user);
                    }
                }

                if (newUsers.length > 0) {
                    const result = await bulkCreateUsers(newUsers);
                    
                    if (result.success) {
                        toast.success(`Successfully created ${result.created} users`);
                    } else {
                        toast.warning(
                            `Created ${result.created} users, ${result.failed} failed. Check console for details.`
                        );
                        console.log('Failed users:', result.errors);
                    }
                    
                    setIsDialogOpen(false);
                    fetchUsers(); // Refresh list
                } else {
                    toast.warning("No valid users found in CSV");
                }

            } catch (error) {
                console.error("Error parsing CSV:", error);
                toast.error("Failed to process CSV file");
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsText(file);
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Total Users: <span className="font-medium text-gray-900">{users.length}</span>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Bulk Upload
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Bulk Upload Users</DialogTitle>
                                <DialogDescription>
                                    Upload a CSV file to add multiple users at once.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">CSV Template</p>
                                            <p className="text-xs text-gray-500">Download format guide</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={downloadTemplate}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>

                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                                            <p className="text-sm text-gray-600">Processing file...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm font-medium text-gray-900">Click to upload CSV</p>
                                            <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by email or school name..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <SelectValue placeholder="Role" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="school">School</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={user.profileImageUrl} alt={user.fullName || 'User'} loading="lazy" />
                                        <AvatarFallback>{(user.fullName || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {user.schoolname || user.schoolName || user.fullName || 'Unnamed User'}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate max-w-[150px]">{user.email}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link to={`/users/${user.id}`}>View Details</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge
                                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                                    className={`gap-1.5 ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                >
                                    {user.role === 'admin' ? (
                                        <Shield className="w-3 h-3" />
                                    ) : (
                                        <School className="w-3 h-3" />
                                    )}
                                    {user.role === 'admin' ? 'Administrator' : 'School Account'}
                                </Badge>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                                <span className="truncate max-w-[100px]">ID: {user.uid?.substring(0, 8)}...</span>
                                <Link
                                    to={`/users/${user.id}`}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View Profile
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredUsers.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                        No users found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
