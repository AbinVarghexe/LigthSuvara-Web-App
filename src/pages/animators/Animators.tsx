import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, User, School, Trash2, UserPlus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';
import { 
    getAnimators, 
    createAnimator,
    addAssignment,
    removeAssignment,
    getUnassignedSchools,
    deleteAnimator,
    getAnimatorStats,
    AnimatorWithUser,
    AnimatorAssignment
} from '../../features/animators/services/animatorService';

interface SchoolData {
    id: string;
    schoolname?: string;
    schoolName?: string;
    parish?: string;
    forane?: string;
}

export function Animators() {
    const [animators, setAnimators] = useState<AnimatorWithUser[]>([]);
    const [unassignedSchools, setUnassignedSchools] = useState<SchoolData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedAnimator, setSelectedAnimator] = useState<AnimatorWithUser | null>(null);
    const [stats, setStats] = useState({ total: 0, assigned: 0, unassigned: 0, fullyAssigned: 0 });
    
    // Form state for creating animator
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: ''
    });

    // Assignment form state
    const [selectedSchoolId, setSelectedSchoolId] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [animatorsData, schoolsData, statsData] = await Promise.all([
                getAnimators(),
                getUnassignedSchools(),
                getAnimatorStats()
            ]);
            setAnimators(animatorsData);
            setUnassignedSchools(schoolsData as SchoolData[]);
            setStats(statsData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load animators");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateAnimator = async () => {
        if (!formData.email || !formData.password || !formData.fullName) {
            toast.error("Please fill all required fields");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            await createAnimator(
                formData.email,
                formData.password,
                formData.fullName,
                formData.phoneNumber
            );
            toast.success("Animator created successfully");
            setIsCreateDialogOpen(false);
            setFormData({ email: '', password: '', fullName: '', phoneNumber: '' });
            fetchData();
        } catch (error: any) {
            console.error("Error creating animator:", error);
            toast.error(error.message || "Failed to create animator");
        }
    };

    const handleAddAssignment = async () => {
        if (!selectedAnimator || !selectedSchoolId) {
            toast.error("Please select a school");
            return;
        }

        const school = unassignedSchools.find(s => s.id === selectedSchoolId);
        if (!school) {
            toast.error("School not found");
            return;
        }

        const assignment: AnimatorAssignment = {
            unitId: `${selectedAnimator.id}_${school.id}_${new Date().getFullYear()}`,
            schoolUserId: school.id,
            schoolname: school.schoolname || school.schoolName || '',
            parish: school.parish || '',
            forane: school.forane || '',
            year: new Date().getFullYear().toString()
        };

        try {
            await addAssignment(selectedAnimator.id, assignment);
            toast.success("School assigned successfully");
            setIsAssignDialogOpen(false);
            setSelectedSchoolId('');
            setSelectedAnimator(null);
            fetchData();
        } catch (error: any) {
            console.error("Error assigning school:", error);
            toast.error(error.message || "Failed to assign school");
        }
    };

    const handleRemoveAssignment = async (animatorId: string, assignment: AnimatorAssignment) => {
        try {
            await removeAssignment(animatorId, assignment);
            toast.success("Assignment removed successfully");
            fetchData();
        } catch (error) {
            console.error("Error removing assignment:", error);
            toast.error("Failed to remove assignment");
        }
    };

    const handleDeleteAnimator = async (animatorId: string) => {
        try {
            await deleteAnimator(animatorId);
            toast.success("Animator deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting animator:", error);
            toast.error("Failed to delete animator");
        }
    };

    const openAssignDialog = (animator: AnimatorWithUser) => {
        setSelectedAnimator(animator);
        setIsAssignDialogOpen(true);
    };

    const filteredAnimators = animators.filter(animator =>
        animator.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animator.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Animator Management</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Animator
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Animator</DialogTitle>
                            <DialogDescription>
                                Add a new animator account to the system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter password (min 6 characters)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="Enter phone number (optional)"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateAnimator}>Create Animator</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-sm text-gray-500">Total Animators</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
                        <p className="text-sm text-gray-500">With Assignments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
                        <p className="text-sm text-gray-500">No Assignments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.fullyAssigned}</div>
                        <p className="text-sm text-gray-500">Fully Assigned (2/2)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search animators by name or email..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Animators Grid */}
            {filteredAnimators.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No animators found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAnimators.map((animator) => (
                        <Card key={animator.id} className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={animator.profileImageUrl} />
                                            <AvatarFallback>
                                                {animator.fullName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{animator.fullName}</CardTitle>
                                            <p className="text-sm text-gray-500">{animator.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={animator.assignments.length === 2 ? "default" : animator.assignments.length === 0 ? "secondary" : "outline"}>
                                        {animator.assignments.length}/2
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Assignments:</p>
                                    {animator.assignments.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No schools assigned</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {animator.assignments.map((assignment, index) => (
                                                <div 
                                                    key={index} 
                                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <School className="h-4 w-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-sm font-medium">{assignment.schoolname}</p>
                                                            <p className="text-xs text-gray-500">{assignment.parish}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleRemoveAssignment(animator.id, assignment)}
                                                    >
                                                        <X className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {animator.assignments.length < 2 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => openAssignDialog(animator)}
                                        >
                                            <UserPlus className="h-4 w-4 mr-1" />
                                            Assign School
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Animator</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete {animator.fullName}? This will also remove all their assignments.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteAnimator(animator.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assignment Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign School to {selectedAnimator?.fullName}</DialogTitle>
                        <DialogDescription>
                            Select a school to assign to this animator. Maximum 2 schools per animator.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select School</Label>
                            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a school..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {unassignedSchools.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No unassigned schools available
                                        </SelectItem>
                                    ) : (
                                        unassignedSchools.map((school) => (
                                            <SelectItem key={school.id} value={school.id}>
                                                {school.schoolname || school.schoolName} - {school.parish}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddAssignment} disabled={!selectedSchoolId || unassignedSchools.length === 0}>
                            Assign School
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
