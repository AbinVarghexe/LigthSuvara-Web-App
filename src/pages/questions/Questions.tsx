import { useState, useEffect } from 'react';
import { Plus, Loader2, GripVertical, Trash2, Edit, Save, X, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
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

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        
        const newQuestions = [...questions];
        [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
        
        try {
            await reorderQuestions(newQuestions);
            setQuestions(newQuestions);
            toast.success("Question order updated");
        } catch (error) {
            console.error("Error reordering questions:", error);
            toast.error("Failed to reorder questions");
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === questions.length - 1) return;
        
        const newQuestions = [...questions];
        [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
        
        try {
            await reorderQuestions(newQuestions);
            setQuestions(newQuestions);
            toast.success("Question order updated");
        } catch (error) {
            console.error("Error reordering questions:", error);
            toast.error("Failed to reorder questions");
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Question Bank</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Total Max Marks: <span className="font-semibold">{totalMaxMarks}</span>
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
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

            {/* Questions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Questions</CardTitle>
                    <CardDescription>
                        Drag to reorder questions. Click edit to modify question text or marks.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {questions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No questions found</p>
                            <p className="text-sm mt-2">Add your first question to get started</p>
                        </div>
                    ) : (
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
                                {questions.map((question, index) => (
                                    <TableRow key={question.id}>
                                        <TableCell className="font-medium">{question.order}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                >
                                                    <GripVertical className="h-4 w-4 rotate-90" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === questions.length - 1}
                                                >
                                                    <GripVertical className="h-4 w-4 -rotate-90" />
                                                </Button>
                                            </div>
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
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleSaveEdit(question.id!)}
                                                        >
                                                            <Save className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            <X className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleStartEdit(question)}
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
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
