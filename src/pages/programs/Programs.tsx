import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Calendar, Users, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
    getPrograms,
    createProgram, 
    updateProgram, 
    deleteProgram, 
    getRegistrationStats,
    ProgramData 
} from '../../features/programs/services/programService';
import { Timestamp } from 'firebase/firestore';

// Mobile Card Component
interface ProgramCardProps {
    program: ProgramData;
    status: { label: string; variant: "secondary" | "outline" | "destructive" | "default" };
    registrationCount: number;
    formatDate: (date: Date | Timestamp | undefined) => string;
    openEditDialog: (program: ProgramData) => void;
    handleDeleteProgram: (id: string) => void;
}

const ProgramCard = ({
    program,
    status,
    registrationCount,
    formatDate,
    openEditDialog,
    handleDeleteProgram
}: ProgramCardProps) => {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {registrationCount}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(program)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Program</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete "{program.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDeleteProgram(program.id!)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(program.startDate)} - {formatDate(program.endDate)}</span>
                </div>
            </CardContent>
        </Card>
    );
};

export function Programs() {
    const [programs, setPrograms] = useState<ProgramData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<ProgramData | null>(null);
    const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isActive: true
    });

    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const programsData = await getPrograms();
            setPrograms(programsData);
            setLoading(false); // meaningful content loaded

            // Fetch registration counts independently
            try {
                const counts: Record<string, number> = {};
                for (const program of programsData) {
                    if (program.id) {
                        const stats = await getRegistrationStats(program.id);
                        counts[program.id] = stats.total;
                    }
                }
                setRegistrationCounts(counts);
            } catch (statsError) {
                console.error("Error fetching registration stats:", statsError);
                // Don't show toast for stats failure to avoid annoying user, just log it.
                // Or show a warning toast.
            }
        } catch (error) {
            console.error("Error fetching programs:", error);
            toast.error("Failed to load programs");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleCreateProgram = async () => {
        if (!formData.name || !formData.startDate || !formData.endDate) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            await createProgram({
                name: formData.name,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                isActive: formData.isActive
            });
            toast.success("Program created successfully");
            setIsCreateDialogOpen(false);
            resetForm();
            fetchPrograms();
        } catch (error) {
            console.error("Error creating program:", error);
            toast.error("Failed to create program");
        }
    };

    const handleUpdateProgram = async () => {
        if (!editingProgram?.id || !formData.name || !formData.startDate || !formData.endDate) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            await updateProgram(editingProgram.id, {
                name: formData.name,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                isActive: formData.isActive
            });
            toast.success("Program updated successfully");
            setIsEditDialogOpen(false);
            setEditingProgram(null);
            resetForm();
            fetchPrograms();
        } catch (error) {
            console.error("Error updating program:", error);
            toast.error("Failed to update program");
        }
    };

    const handleDeleteProgram = async (programId: string) => {
        try {
            await deleteProgram(programId);
            toast.success("Program deleted successfully");
            fetchPrograms();
        } catch (error) {
            console.error("Error deleting program:", error);
            toast.error("Failed to delete program");
        }
    };

    const openEditDialog = (program: ProgramData) => {
        setEditingProgram(program);
        const startDate = program.startDate instanceof Timestamp 
            ? program.startDate.toDate() 
            : new Date(program.startDate);
        const endDate = program.endDate instanceof Timestamp 
            ? program.endDate.toDate() 
            : new Date(program.endDate);
        
        setFormData({
            name: program.name,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            isActive: program.isActive
        });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            startDate: '',
            endDate: '',
            isActive: true
        });
    };

    const formatDate = (date: Date | Timestamp | undefined) => {
        if (!date) return 'N/A';
        try {
            if (date instanceof Timestamp) {
                return date.toDate().toLocaleDateString();
            }
            return new Date(date).toLocaleDateString();
        } catch {
            return 'Invalid Date';
        }
    };

    const getProgramStatus = (program: ProgramData) => {
        const now = new Date();
        const startDate = program.startDate instanceof Timestamp 
            ? program.startDate.toDate() 
            : new Date(program.startDate);
        const endDate = program.endDate instanceof Timestamp 
            ? program.endDate.toDate() 
            : new Date(program.endDate);
        
        if (!program.isActive) {
            return { label: 'Inactive', variant: 'secondary' as const };
        }
        if (now < startDate) {
            return { label: 'Upcoming', variant: 'outline' as const };
        }
        if (now > endDate) {
            return { label: 'Closed', variant: 'destructive' as const };
        }
        return { label: 'Active', variant: 'default' as const };
    };

    const filteredPrograms = programs.filter(program =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Programs</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Program
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Program</DialogTitle>
                            <DialogDescription>
                                Add a new educational program for student registration.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Program Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter program name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateProgram}>Create Program</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search programs..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Programs List */}
            <div className="space-y-4">
                {filteredPrograms.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No programs found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <Card className="hidden md:block">
                            <CardHeader>
                                <CardTitle>All Programs</CardTitle>
                                <CardDescription>Manage educational programs and view registrations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Program Name</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>End Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Registrations</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPrograms.map((program) => {
                                            const status = getProgramStatus(program);
                                            return (
                                                <TableRow key={program.id}>
                                                    <TableCell className="font-medium">{program.name}</TableCell>
                                                    <TableCell>{formatDate(program.startDate)}</TableCell>
                                                    <TableCell>{formatDate(program.endDate)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={status.variant}>{status.label}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4 text-gray-400" />
                                                            {registrationCounts[program.id!] || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditDialog(program)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Program</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete "{program.name}"? This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteProgram(program.id!)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {filteredPrograms.map((program) => {
                                const status = getProgramStatus(program);
                                return (
                                    <ProgramCard
                                        key={program.id}
                                        program={program}
                                        status={status}
                                        registrationCount={registrationCounts[program.id!] || 0}
                                        formatDate={formatDate}
                                        openEditDialog={openEditDialog}
                                        handleDeleteProgram={handleDeleteProgram}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Program</DialogTitle>
                        <DialogDescription>
                            Update program details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Program Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter program name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-startDate">Start Date</Label>
                                <Input
                                    id="edit-startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-endDate">End Date</Label>
                                <Input
                                    id="edit-endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="edit-isActive">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateProgram}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
