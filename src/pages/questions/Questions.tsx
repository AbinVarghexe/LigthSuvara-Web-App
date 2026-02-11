import { useState, useEffect } from 'react';
import { Plus, Loader2, GripVertical, Trash2, Edit, Save, X, HelpCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { createMalayalamPDF } from '../../lib/pdfFonts';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    getQuestions, 
    createQuestion, 
    updateQuestion, 
    deleteQuestion,
    getNextQuestionOrder,
    reorderQuestions,
    getTotalMaxMarks,
    QuestionData 
} from '../../features/questions/services/questionService';

interface SortableRowProps {
    question: QuestionData;
    editingId: string | null;
    inlineEditData: { text: string; maxMarks: number };
    setInlineEditData: (data: { text: string; maxMarks: number }) => void;
    handleStartEdit: (question: QuestionData) => void;
    handleSaveEdit: (id: string) => void;
    handleCancelEdit: () => void;
    handleDeleteQuestion: (id: string) => void;
}

const SortableRow = ({
    question,
    editingId,
    inlineEditData,
    setInlineEditData,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteQuestion
}: SortableRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        position: isDragging ? 'relative' : undefined,
    };

    return (
        <TableRow 
            ref={setNodeRef} 
            style={style as React.CSSProperties} 
            {...attributes} 
            className={isDragging ? "bg-muted/80 shadow-lg relative z-50" : "bg-card relative"}
        >
            <TableCell className="font-medium">{question.order}</TableCell>
            <TableCell>
                <Button variant="ghost" size="icon" className="cursor-grab active:cursor-grabbing touch-none" {...listeners}>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </TableCell>
            <TableCell>
                {editingId === question.id ? (
                    <Textarea
                        value={inlineEditData.text}
                        onChange={(e) => setInlineEditData({ ...inlineEditData, text: e.target.value })}
                        rows={2}
                        className="min-w-[300px]"
                    />
                ) : (
                    <span className="line-clamp-2">{question.text}</span>
                )}
            </TableCell>
            <TableCell>
                {editingId === question.id ? (
                    <Input
                        type="number"
                        min={1}
                        max={100}
                        value={inlineEditData.maxMarks}
                        onChange={(e) => setInlineEditData({ ...inlineEditData, maxMarks: parseInt(e.target.value) || 10 })}
                        className="w-20"
                    />
                ) : (
                    <span className="font-semibold">{question.maxMarks}</span>
                )}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    {editingId === question.id ? (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(question.id!)}>
                                <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 text-gray-500" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => handleStartEdit(question)}>
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
                                        <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this question? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteQuestion(question.id!)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
};

// Mobile Card Component
interface QuestionCardProps extends Omit<SortableRowProps, 'handleDeleteQuestion'> {
    handleDeleteQuestion: (id: string) => void;
}

const QuestionCard = ({
    question,
    editingId,
    inlineEditData,
    setInlineEditData,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteQuestion
}: QuestionCardProps) => {
    return (
        <Card className="mb-4">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-500">#{question.order}</span>
                        <div className="text-sm font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {editingId === question.id ? (
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={inlineEditData.maxMarks}
                                    onChange={(e) => setInlineEditData({ ...inlineEditData, maxMarks: parseInt(e.target.value) || 10 })}
                                    className="w-16 h-7 text-xs"
                                />
                            ) : (
                                <span>{question.maxMarks} Marks</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {editingId === question.id ? (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleSaveEdit(question.id!)}>
                                    <Save className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(question)}>
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
                                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this question?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteQuestion(question.id!)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                </div>
                
                {editingId === question.id ? (
                    <Textarea
                        value={inlineEditData.text}
                        onChange={(e) => setInlineEditData({ ...inlineEditData, text: e.target.value })}
                        rows={3}
                        className="w-full"
                    />
                ) : (
                    <p className="text-gray-900 dark:text-gray-100">{question.text}</p>
                )}
            </CardContent>
        </Card>
    );
};

export function Questions() {
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [totalMaxMarks, setTotalMaxMarks] = useState(0);
    
    // Form state
    const [formData, setFormData] = useState({
        text: '',
        maxMarks: 10
    });

    // Inline edit state
    const [inlineEditData, setInlineEditData] = useState<{
        text: string;
        maxMarks: number;
    }>({ text: '', maxMarks: 10 });

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const questionsData = await getQuestions();
            setQuestions(questionsData);
            const total = await getTotalMaxMarks();
            setTotalMaxMarks(total);
        } catch (error) {
            console.error("Error fetching questions:", error);
            toast.error("Failed to load questions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleCreateQuestion = async () => {
        if (!formData.text.trim()) {
            toast.error("Please enter question text");
            return;
        }

        try {
            const nextOrder = await getNextQuestionOrder();
            await createQuestion({
                text: formData.text,
                maxMarks: formData.maxMarks,
                order: nextOrder
            });
            toast.success("Question created successfully");
            setIsCreateDialogOpen(false);
            setFormData({ text: '', maxMarks: 10 });
            fetchQuestions();
        } catch (error) {
            console.error("Error creating question:", error);
            toast.error("Failed to create question");
        }
    };

    const handleStartEdit = (question: QuestionData) => {
        setEditingId(question.id!);
        setInlineEditData({
            text: question.text,
            maxMarks: question.maxMarks
        });
    };

    const handleSaveEdit = async (questionId: string) => {
        if (!inlineEditData.text.trim()) {
            toast.error("Question text cannot be empty");
            return;
        }

        try {
            await updateQuestion(questionId, {
                text: inlineEditData.text,
                maxMarks: inlineEditData.maxMarks
            });
            toast.success("Question updated successfully");
            setEditingId(null);
            fetchQuestions();
        } catch (error) {
            console.error("Error updating question:", error);
            toast.error("Failed to update question");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setInlineEditData({ text: '', maxMarks: 10 });
    };

    const handleDeleteQuestion = async (questionId: string) => {
        try {
            await deleteQuestion(questionId);
            toast.success("Question deleted successfully");
            fetchQuestions();
        } catch (error) {
            console.error("Error deleting question:", error);
            toast.error("Failed to delete question");
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                
                // Update the order property for all items to match their new index
                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    order: index + 1
                }));

                // Save to backend asynchronously
                reorderQuestions(updatedItems).catch(error => {
                    console.error("Error reordering questions:", error);
                    toast.error("Failed to save new order");
                });

                return updatedItems;
            });
        }
    };

    const generateQuestionPaper = async () => {
        if (questions.length === 0) {
            toast.error("No questions to export");
            return;
        }

        const doc = await createMalayalamPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = 20;

        // --- Header Section ---
        // School/Org Name
        doc.setFontSize(16);
        doc.setFont('NotoSansMalayalam', 'bold');
        doc.text('FAITH FORMATION PROGRAM', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Exam Title
        doc.setFontSize(14);
        doc.setFont('NotoSansMalayalam', 'bold');
        doc.text('ANNUAL ASSESSMENT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        // Meta Info (Date, Time, Marks)
        doc.setFontSize(11);
        doc.setFont('NotoSansMalayalam', 'normal');
        
        // Left side meta
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
        
        // Right side meta
        const totalMarksText = `Max. Marks: ${totalMaxMarks}`;
        doc.text(totalMarksText, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        
        doc.text('Time: 1 Hour', margin, yPos); // Placeholder time
        yPos += 10;

        // Horizontal Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        // --- Instructions ---
        doc.setFontSize(11);
        doc.setFont('NotoSansMalayalam', 'bold');
        doc.text('General Instructions:', margin, yPos);
        yPos += 6;
        
        doc.setFont('NotoSansMalayalam', 'normal');
        doc.setFontSize(10);
        const instructions = [
            '1. All questions are compulsory.',
            '2. The marks for each question are indicated against it.',
            '3. Write your answers clearly and legibly.',
            '4. Read each question carefully before answering.'
        ];
        
        instructions.forEach(inst => {
            doc.text(inst, margin + 5, yPos);
            yPos += 5;
        });
        
        yPos += 5;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;

        // --- Questions Section ---
        doc.setFontSize(12);
        doc.setFont('NotoSansMalayalam', 'bold');
        doc.text('Section A: Questions', margin, yPos);
        yPos += 10;

        questions.forEach((question, index) => {
            const questionText = `${index + 1}. ${question.text}`;
            const marksText = `[${question.maxMarks}]`;
            
            // Calculate height needed for question text
            // Indent text slightly if it wraps? standard split
            const availableWidth = pageWidth - (margin * 2) - 15; // Reserve space for marks
            
            doc.setFont('NotoSansMalayalam', 'normal');
            doc.setFontSize(11);
            
            const splitText = doc.splitTextToSize(questionText, availableWidth);
            const lines = splitText.length;
            const textHeight = lines * 6; // ~6 units per line
            const spaceNeeded = textHeight + 25; // text + answer space + padding

            // Page Break Check
            if (yPos + spaceNeeded > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }

            // Print Question Text
            doc.text(splitText, margin, yPos);
            
            // Print Marks aligned to right
            doc.setFont('NotoSansMalayalam', 'bold');
            doc.text(marksText, pageWidth - margin, yPos, { align: 'right' });
            
            // Answer SpaceLines
            yPos += textHeight + 2; // move past text
            
            // Draw dotted lines for answer space (optional, but looks "proper")
            const linesToDraw = Math.max(2, Math.ceil(question.maxMarks * 0.5)); // rough estimate: 0.5 lines per mark
            
            doc.setDrawColor(200);
            doc.setLineWidth(0.1);
            
            for(let i=0; i<linesToDraw; i++) {
                 // Check page break during lines
                if (yPos > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                
                doc.line(margin, yPos, pageWidth - margin, yPos); // solid line for writing
                yPos += 8; // spacing between lines
            }
            
            yPos += 5; // Extra spacing before next question
        });

        // --- Footer with Page Numbers ---
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setFont('NotoSansMalayalam', 'normal');
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        doc.save(`Question_Paper_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Question paper downloaded successfully");
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Question Bank</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Total Max Marks: <span className="font-semibold">{totalMaxMarks}</span>
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={generateQuestionPaper} disabled={questions.length === 0} className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Question
                            </Button>
                        </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Question</DialogTitle>
                            <DialogDescription>
                                Create a new assessment question for the Faith Formation program.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="text">Question Text</Label>
                                <Textarea
                                    id="text"
                                    value={formData.text}
                                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                    placeholder="Enter the question text..."
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxMarks">Maximum Marks</Label>
                                <Input
                                    id="maxMarks"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={formData.maxMarks}
                                    onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 10 })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateQuestion}>Add Question</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {questions.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No questions found</p>
                            <p className="text-sm mt-2">Add your first question to get started</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <Card className="hidden md:block">
                            <CardHeader>
                                <CardTitle>All Questions</CardTitle>
                                <CardDescription>
                                    Drag using the handle icon to reorder questions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DndContext 
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>Question Text</TableHead>
                                                <TableHead className="w-[120px]">Max Marks</TableHead>
                                                <TableHead className="w-[150px] text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <SortableContext 
                                                items={questions.map(q => q.id!)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {questions.map((question) => (
                                                    <SortableRow
                                                        key={question.id}
                                                        question={question}
                                                        editingId={editingId}
                                                        inlineEditData={inlineEditData}
                                                        setInlineEditData={setInlineEditData}
                                                        handleStartEdit={handleStartEdit}
                                                        handleSaveEdit={handleSaveEdit}
                                                        handleCancelEdit={handleCancelEdit}
                                                        handleDeleteQuestion={handleDeleteQuestion}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </DndContext>
                            </CardContent>
                        </Card>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {questions.map((question) => (
                                <QuestionCard
                                    key={question.id}
                                    question={question}
                                    editingId={editingId}
                                    inlineEditData={inlineEditData}
                                    setInlineEditData={setInlineEditData}
                                    handleStartEdit={handleStartEdit}
                                    handleSaveEdit={handleSaveEdit}
                                    handleCancelEdit={handleCancelEdit}
                                    handleDeleteQuestion={handleDeleteQuestion}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
