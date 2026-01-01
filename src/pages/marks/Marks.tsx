import { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Download, Eye, Lock, Unlock, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { 
    getMarks, 
    getMarksWithDetails,
    getAvailableYears,
    searchMarks,
    getMarksStats,
    MarksData,
    MarksWithDetails
} from '../../features/marks/services/marksService';
import { Timestamp } from 'firebase/firestore';

export function Marks() {
    const [marks, setMarks] = useState<MarksData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [selectedMarks, setSelectedMarks] = useState<MarksWithDetails | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [stats, setStats] = useState({
        totalSubmissions: 0,
        lockedSubmissions: 0,
        unlockedSubmissions: 0,
        averageMarks: 0,
        averagePercentage: 0,
        maxPossibleMarks: 0
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const yearFilter = selectedYear === 'all' ? undefined : selectedYear;
            const [marksData, years, statsData] = await Promise.all([
                searchTerm ? searchMarks(searchTerm, yearFilter) : getMarks(yearFilter),
                getAvailableYears(),
                getMarksStats(yearFilter)
            ]);
            setMarks(marksData);
            setAvailableYears(years);
            setStats(statsData);
        } catch (error) {
            console.error("Error fetching marks:", error);
            toast.error("Failed to load marks data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleViewDetails = async (marksId: string) => {
        try {
            const details = await getMarksWithDetails(marksId);
            if (details) {
                setSelectedMarks(details);
                setIsDetailDialogOpen(true);
            }
        } catch (error) {
            console.error("Error fetching marks details:", error);
            toast.error("Failed to load marks details");
        }
    };

    const generatePDF = (marksData: MarksWithDetails) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Faith Formation Assessment Report', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Parish Level Evaluation - ${marksData.year}`, 105, 30, { align: 'center' });
        
        // Details
        doc.setFontSize(11);
        let yPos = 50;
        
        doc.text(`Parish: ${marksData.parish}`, 20, yPos);
        yPos += 8;
        doc.text(`Sunday School: ${marksData.sundaySchool}`, 20, yPos);
        yPos += 8;
        doc.text(`Animator: ${marksData.animatorName}`, 20, yPos);
        yPos += 8;
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
        yPos += 15;
        
        // Table Header
        doc.setFont('helvetica', 'bold');
        doc.text('#', 20, yPos);
        doc.text('Question', 35, yPos);
        doc.text('Marks', 160, yPos);
        doc.text('Max', 180, yPos);
        yPos += 5;
        doc.line(20, yPos, 190, yPos);
        yPos += 8;
        
        // Table Body
        doc.setFont('helvetica', 'normal');
        marksData.questions.forEach((question, index) => {
            const marks = question.id ? marksData.marks[question.id] : 0;
            const questionText = question.text.length > 60 
                ? question.text.substring(0, 60) + '...' 
                : question.text;
            
            doc.text(`${index + 1}`, 20, yPos);
            doc.text(questionText, 35, yPos);
            doc.text(`${marks || 0}`, 160, yPos);
            doc.text(`${question.maxMarks}`, 180, yPos);
            yPos += 8;
            
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
        });
        
        // Total
        yPos += 5;
        doc.line(20, yPos, 190, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Total', 35, yPos);
        doc.text(`${marksData.totalMarks}`, 160, yPos);
        doc.text(`${marksData.maxTotalMarks}`, 180, yPos);
        yPos += 8;
        doc.text(`Percentage: ${marksData.percentage.toFixed(1)}%`, 35, yPos);
        
        // Remarks
        if (marksData.remarks) {
            yPos += 15;
            doc.setFont('helvetica', 'bold');
            doc.text('Remarks:', 20, yPos);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(marksData.remarks, 20, yPos, { maxWidth: 170 });
        }
        
        // Save
        doc.save(`marks_${marksData.sundaySchool}_${marksData.year}.pdf`);
        toast.success("PDF downloaded successfully");
    };

    const formatDate = (date: Timestamp | undefined) => {
        if (!date) return 'N/A';
        try {
            return date.toDate().toLocaleDateString();
        } catch {
            return 'Invalid Date';
        }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Marks Viewer</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                        <p className="text-sm text-gray-500">Total Submissions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.lockedSubmissions}</div>
                        <p className="text-sm text-gray-500">Finalized</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{stats.unlockedSubmissions}</div>
                        <p className="text-sm text-gray-500">In Progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.averagePercentage.toFixed(1)}%</div>
                        <p className="text-sm text-gray-500">Average Score</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by parish, school, or animator..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative min-w-[140px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="pl-9">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Marks Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Assessment Records</CardTitle>
                    <CardDescription>View and download assessment marks submitted by animators</CardDescription>
                </CardHeader>
                <CardContent>
                    {marks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No marks records found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Parish</TableHead>
                                    <TableHead>Sunday School</TableHead>
                                    <TableHead>Animator</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {marks.map((mark) => (
                                    <TableRow key={mark.id}>
                                        <TableCell className="font-medium">{mark.parish}</TableCell>
                                        <TableCell>{mark.sundaySchool}</TableCell>
                                        <TableCell>{mark.animatorName}</TableCell>
                                        <TableCell>{mark.year}</TableCell>
                                        <TableCell>
                                            {mark.locked ? (
                                                <Badge variant="default" className="gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    Finalized
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Unlock className="h-3 w-3" />
                                                    In Progress
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDate(mark.submittedAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewDetails(mark.id!)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {mark.pdfUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                    >
                                                        <a href={mark.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Marks Details</DialogTitle>
                    </DialogHeader>
                    {selectedMarks && (
                        <div className="space-y-6">
                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Parish</p>
                                    <p className="font-medium">{selectedMarks.parish}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Sunday School</p>
                                    <p className="font-medium">{selectedMarks.sundaySchool}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Animator</p>
                                    <p className="font-medium">{selectedMarks.animatorName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Year</p>
                                    <p className="font-medium">{selectedMarks.year}</p>
                                </div>
                            </div>

                            {/* Score Summary */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Total Score</span>
                                        <span className="text-lg font-bold">
                                            {selectedMarks.totalMarks} / {selectedMarks.maxTotalMarks}
                                        </span>
                                    </div>
                                    <Progress value={selectedMarks.percentage} className="h-3" />
                                    <p className="text-sm text-gray-500 mt-2 text-right">
                                        {selectedMarks.percentage.toFixed(1)}%
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Marks Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Question</TableHead>
                                        <TableHead className="w-[80px] text-right">Marks</TableHead>
                                        <TableHead className="w-[80px] text-right">Max</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedMarks.questions.map((question, index) => {
                                        const marks = question.id ? selectedMarks.marks[question.id] : 0;
                                        return (
                                            <TableRow key={question.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="text-sm">{question.text}</TableCell>
                                                <TableCell className="text-right font-medium">{marks || 0}</TableCell>
                                                <TableCell className="text-right text-gray-500">{question.maxMarks}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                                        <TableCell></TableCell>
                                        <TableCell className="font-bold">Total</TableCell>
                                        <TableCell className="text-right font-bold">{selectedMarks.totalMarks}</TableCell>
                                        <TableCell className="text-right font-bold">{selectedMarks.maxTotalMarks}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            {/* Remarks */}
                            {selectedMarks.remarks && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Remarks</p>
                                    <p className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                        {selectedMarks.remarks}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => generatePDF(selectedMarks)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
