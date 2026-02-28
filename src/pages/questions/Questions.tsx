import React, { useState, useEffect } from "react";
import {
  Plus,
  Loader2,
  GripVertical,
  Trash2,
  Edit,
  X,
  HelpCircle,
  Download,
  Settings,
  PlusCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

import { createMalayalamPDF } from "../../lib/pdfFonts";

import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getNextQuestionOrder,
  reorderQuestions,
  toggleMandatory,
  QuestionData,
  SubField
} from "../../features/questions/services/questionService";

const intToRoman = (num: number): string => {
  const romanMap: Record<number, string> = {
    1000: 'M', 900: 'CM', 500: 'D', 400: 'CD', 100: 'C', 90: 'XC', 50: 'L', 40: 'XL', 10: 'X', 9: 'IX', 5: 'V', 4: 'IV', 1: 'I'
  };
  let result = '';
  // Sort descending
  const keys = Object.keys(romanMap).map(Number).sort((a, b) => b - a);
  for (const key of keys) {
    while (num >= key) {
      result += romanMap[key];
      num -= key;
    }
  }
  return result;
};

interface QuestionRowProps {
  question: QuestionData;
  globalIndex: number;
  handleStartEdit: (question: QuestionData) => void;
  handleDeleteQuestion: (id: string) => void;
  handleToggleMandatory: (question: QuestionData) => void;
  handleLongPress: (question: QuestionData) => void;
}

const QuestionRow = ({
  question,
  globalIndex,
  handleStartEdit,
  handleDeleteQuestion,
  handleToggleMandatory,
  handleLongPress,
}: QuestionRowProps) => {

  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const startPress = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left click / tap
    pressTimer.current = setTimeout(() => {
      handleLongPress(question);
    }, 600); // 600ms long press
  };

  const endPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <TableRow
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      className="bg-card cursor-default"
    >
      <TableCell className="font-medium">{globalIndex}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer touch-none text-blue-500 hover:bg-blue-50 hover:text-blue-700"
          title="Long press to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
      <TableCell>
        <div className="flex flex-col space-y-1">
          {question.part && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm w-fit">
              Part {question.part}{question.partTitle ? `: ${question.partTitle}` : ''}
            </span>
          )}
          <span className="line-clamp-2">{question.text}</span>
          {question.subFields && question.subFields.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {question.subFields.length} sub-fields
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="font-semibold">{(question.maxMark ?? 0) > 0 ? question.maxMark : ''}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={question.isMandatory !== false}
              onCheckedChange={() => handleToggleMandatory(question)}
            />
            <span className="text-xs text-muted-foreground">{question.isMandatory !== false ? 'Yes' : 'No'}</span>
          </div>
          {question.isReadOnly && (
            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded uppercase">Admin Set</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
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
                  Are you sure you want to delete this question? This action
                  cannot be undone.
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
        </div>
      </TableCell>
    </TableRow>
  );
};




const DEFAULT_PARTS = ['I'];

export function Questions() {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Manual Reorder Dialog States
  const [reorderQuestion, setReorderQuestion] = useState<QuestionData | null>(null);
  const [newOrderPos, setNewOrderPos] = useState<number | ''>('');

  // global parts state
  const [parts, setParts] = useState<string[]>(DEFAULT_PARTS);
  const [partTitles, setPartTitles] = useState<Record<string, string>>({});
  const [showPartConfig, setShowPartConfig] = useState(false);

  const [totalMaxMarks, setTotalMaxMarks] = useState(0);

  // Form state
  const [formData, setFormData] = useState<{
    text: string;
    maxMark: number | '';
    isMandatory: boolean;
    isReadOnly: boolean;
    part: string;
    partTitle: string;
    subFields: (Omit<SubField, 'maxMark'> & { maxMark: number | '' })[];
  }>({
    text: "",
    maxMark: 10,
    isMandatory: true,
    isReadOnly: false,
    part: "I",
    partTitle: "",
    subFields: []
  });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await getQuestions();
      setQuestions(questionsData);

      const sumMarks = Object.values(questionsData).reduce((sum, current) => {
        let currTotal = current.maxMark ?? 0;
        if (current.subFields && current.subFields.length > 0) {
          currTotal = current.subFields.reduce((acc, sf) => acc + (sf.maxMark ?? 0), 0);
        }
        return sum + currTotal;
      }, 0);
      setTotalMaxMarks(sumMarks);

      // Extract existing parts & titles
      let changed = false;
      const newParts = [...parts];
      const newPartTitles = { ...partTitles };

      questionsData.forEach(q => {
        const isUUID = q.part && q.part.length > 5; // e.g., POKKJqGRc3WXJbep5TF3
        const validPart = isUUID ? 'I' : q.part;

        if (isUUID) {
          q.part = 'I'; // sanitize the local render reference
        }

        if (validPart && !newParts.includes(validPart)) {
          newParts.push(validPart);
          changed = true;
        }
        if (validPart && q.partTitle && !newPartTitles[validPart]) {
          newPartTitles[validPart] = q.partTitle;
          changed = true;
        }
      });

      if (changed) {
        setParts(newParts);
        setPartTitles(newPartTitles);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPart = () => {
    let nextNum = parts.length + 1;
    let nextPart = intToRoman(nextNum);
    while (parts.includes(nextPart)) {
      nextNum++;
      nextPart = intToRoman(nextNum);
    }
    setParts([...parts, nextPart]);
  };

  const handleRemovePart = async (partToRemove: string) => {
    if (partToRemove === 'I') {
      toast.error("Cannot delete the default Part I");
      return;
    }

    const questionsInPart = questions.filter(q => (q.part || 'I') === partToRemove);
    if (questionsInPart.length > 0) {
      if (!window.confirm(`There are ${questionsInPart.length} questions in Part ${partToRemove}. Deleting this part will move them to Part I. Continue?`)) {
        return;
      }
      setLoading(true);
      try {
        const batchUpdates = questionsInPart.map(q => updateQuestion(q.id!, { part: 'I' }));
        await Promise.all(batchUpdates);
        toast.success(`Moved ${questionsInPart.length} questions to Part I`);
      } catch (error) {
        console.error("Error moving questions:", error);
        toast.error("Failed to move questions to Part I");
        setLoading(false);
        return;
      }
    }

    const newParts = parts.filter(p => p !== partToRemove);
    setParts(newParts);
    const newPartTitles = { ...partTitles };
    delete newPartTitles[partToRemove];
    setPartTitles(newPartTitles);

    fetchQuestions();
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({
      text: "",
      maxMark: "",
      isMandatory: true,
      isReadOnly: false,
      part: "I",
      partTitle: partTitles["I"] || "",
      subFields: []
    });
    setIsDialogOpen(true);
  };

  const handleStartEdit = (question: QuestionData) => {
    setEditingId(question.id!);
    setFormData({
      text: question.text,
      maxMark: question.maxMark || '',
      isMandatory: question.isMandatory ?? true,
      isReadOnly: question.isReadOnly ?? false,
      part: question.part ?? "I",
      partTitle: question.partTitle ?? "",
      subFields: (question.subFields || []).map(sf => ({ ...sf, maxMark: sf.maxMark || '' }))
    });
    setIsDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!formData.text.trim()) {
      toast.error("Please enter question text");
      return;
    }

    const payload = {
      ...formData,
      maxMark: formData.maxMark === '' ? null : formData.maxMark,
      subFields: formData.subFields.map(sf => ({
        ...sf,
        maxMark: sf.maxMark === '' ? null : sf.maxMark
      }))
    } as unknown as QuestionData;

    try {
      if (editingId) {
        const originalQuestion = questions.find(q => q.id === editingId);
        const partChanged = originalQuestion && (originalQuestion.part || 'I') !== payload.part;

        let updatePayload: Partial<QuestionData> = { ...payload };

        if (partChanged) {
          updatePayload.order = await getNextQuestionOrder();
        }

        await updateQuestion(editingId, updatePayload);
        toast.success("Question updated successfully");
      } else {
        const nextOrder = await getNextQuestionOrder();
        await createQuestion({ ...payload, order: nextOrder });
        toast.success("Question created successfully");
      }

      // Update our local part title cache if it changed
      if (formData.part && formData.partTitle && partTitles[formData.part] !== formData.partTitle) {
        setPartTitles(prev => ({ ...prev, [formData.part]: formData.partTitle }));
      }

      setIsDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    }
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

  const handleToggleMandatory = async (question: QuestionData) => {
    try {
      await toggleMandatory(question.id!, question.isMandatory !== false);
      toast.success("Question status updated");
      fetchQuestions();
    } catch (error) {
      console.error("Error toggling mandatory status:", error);
      toast.error("Failed to update question status");
    }
  };

  // Reordering array utility since arrayMove was stripped out with dndkit
  const moveArrayItem = (arr: any[], fromIndex: number, toIndex: number) => {
    const newArr = [...arr];
    const element = newArr.splice(fromIndex, 1)[0];
    newArr.splice(toIndex, 0, element);
    return newArr;
  };

  const handleManualOrderSave = async () => {
    if (!reorderQuestion || newOrderPos === '' || newOrderPos < 1) return;

    const currentGlobalItems = [...questions];
    const currentIndex = currentGlobalItems.findIndex(q => q.id === reorderQuestion.id);
    if (currentIndex === -1) return;

    // We want to insert it at the specific target GLOBAL position.
    // However, if the user picks #1 and the question currently has Part III,
    // visually the list groups by part. Global #1 belongs to Part I.
    // So the safest manual order behavior is modifying local part order?
    // Actually, if we just arrayMove them across all global items and reconstruct!
    // If they want it to be question #N globally, let's inject it into global items exactly there, mapping to the new part it lands on?
    // No, better just change its part if needed, or just insert it exactly at that global index without checking parts and let parts sort themselves?
    // If we let parts sort themselves, its global number will change again based on its Part. 
    // To literally become Question N: it MUST take on the Part of the question currently at N.

    // Instead of forcing part changes, changing visual position inside its CURRENT part is more intuitive.
    // "Order inside Part {part}":
    const partItems = currentGlobalItems.filter(q => (q.part || 'I') === (reorderQuestion.part || 'I'));
    const oldPartIndex = partItems.findIndex(q => q.id === reorderQuestion.id);
    const targetPartIndex = Math.min(Math.max(1, newOrderPos), partItems.length) - 1;

    let newPartItems = moveArrayItem(partItems, oldPartIndex, targetPartIndex);

    // Stitch it back
    const orderedQuestions: QuestionData[] = [];
    parts.forEach(p => {
      if (p === (reorderQuestion.part || 'I')) {
        orderedQuestions.push(...newPartItems);
      } else {
        orderedQuestions.push(...currentGlobalItems.filter(q => (q.part || 'I') === p));
      }
    });

    const updatedItems = orderedQuestions.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setQuestions(updatedItems);
    setReorderQuestion(null);

    try {
      await reorderQuestions(updatedItems);
      toast.success("Question order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  const addSubField = () => {
    setFormData({
      ...formData,
      subFields: [
        ...formData.subFields,
        { text: "", maxMark: 5, isReadOnly: false, adminText: "" }
      ]
    });
  };

  const updateSubField = (index: number, field: Partial<Omit<SubField, 'maxMark'> & { maxMark: number | '' }>) => {
    const newFields = [...formData.subFields];
    newFields[index] = { ...newFields[index], ...field };
    setFormData({ ...formData, subFields: newFields });
  };

  const removeSubField = (index: number) => {
    const newFields = [...formData.subFields];
    newFields.splice(index, 1);
    setFormData({ ...formData, subFields: newFields });
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

    doc.setFontSize(16);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("FAITH FORMATION PROGRAM", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    doc.setFontSize(14);
    doc.text("ANNUAL ASSESSMENT", pageWidth / 2, yPos, { align: "center" });
    yPos += 12;

    doc.setFontSize(11);
    doc.setFont("NotoSansMalayalam", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
    doc.text(`Max. Marks: ${totalMaxMarks}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    doc.text("Time: 1 Hour", margin, yPos);
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont("NotoSansMalayalam", "bold");
    doc.text("General Instructions:", margin, yPos);
    yPos += 6;

    doc.setFont("NotoSansMalayalam", "normal");
    doc.setFontSize(10);
    const instructions = [
      "1. All questions are compulsory unless marked optional.",
      "2. The marks for each question are indicated against it.",
    ];

    instructions.forEach((inst) => {
      doc.text(inst, margin + 5, yPos);
      yPos += 5;
    });

    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Group by Part
    const partsGrouped = questions.reduce((acc, q) => {
      const p = q.part || "Uncategorized";
      if (!acc[p]) acc[p] = [];
      acc[p].push(q);
      return acc;
    }, {} as Record<string, QuestionData[]>);

    let globalIndex = 1;

    for (const p of parts) {
      if (!partsGrouped[p]) continue;

      const pTitle = partTitles[p] ? `: ${partTitles[p]}` : '';
      doc.setFontSize(12);
      doc.setFont("NotoSansMalayalam", "bold");
      doc.text(`Part ${p}${pTitle}`, margin, yPos);
      yPos += 10;

      partsGrouped[p].forEach((question) => {
        const questionText = `${globalIndex++}. ${question.text}`;
        const marksText = (question.maxMark ?? 0) > 0 ? `[${question.maxMark}]` : ``;
        const availableWidth = pageWidth - margin * 2 - 15;

        doc.setFont("NotoSansMalayalam", "normal");
        doc.setFontSize(11);

        const splitText = doc.splitTextToSize(questionText, availableWidth);
        const lines = splitText.length;
        const textHeight = lines * 6;

        // estimate space
        let subFieldSpace = (question.subFields?.length || 0) * 8;
        let spaceNeeded = textHeight + subFieldSpace + 15;

        if (yPos + spaceNeeded > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }

        doc.text(splitText, margin, yPos);
        doc.setFont("NotoSansMalayalam", "bold");
        doc.text(marksText, pageWidth - margin, yPos, { align: "right" });

        yPos += textHeight + 2;

        if (question.subFields && question.subFields.length > 0) {
          doc.setFont("NotoSansMalayalam", "normal");
          doc.setFontSize(10);
          question.subFields.forEach(sf => {
            const sfMarks = (sf.maxMark ?? 0) > 0 ? ` [${sf.maxMark}]` : '';
            doc.text(`- ${sf.text}${sfMarks}`, margin + 10, yPos);
            yPos += 6;
          });
          yPos += 2;
        }

        doc.setDrawColor(200);
        doc.setLineWidth(0.1);
        const linesToDraw = Math.max(1, Math.ceil((question.maxMark ?? 0) * 0.5));

        for (let i = 0; i < linesToDraw; i++) {
          if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 8;
        }
        yPos += 5;
      });
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont("NotoSansMalayalam", "normal");
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    }

    doc.save(`Question_Paper_${new Date().toISOString().split("T")[0]}.pdf`);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Question Bank
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Total Max Marks:{" "}
            <span className="font-semibold">{totalMaxMarks}</span>
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={generateQuestionPaper}
            disabled={questions.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div >
      </div >

      {/* Parts Configuration */}
      < Card >
        <div
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setShowPartConfig(!showPartConfig)}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-400">Configure Part Titles</h3>
          </div>
          {showPartConfig ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </div>
        {
          showPartConfig && (
            <CardContent className="pt-0 pb-4 border-t mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {parts.map(part => (
                  <div key={part} className="flex items-center gap-2">
                    <Label className="w-16 whitespace-nowrap">Part {part}:</Label>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        placeholder="Enter part title..."
                        value={partTitles[part] || ""}
                        onChange={e => setPartTitles({ ...partTitles, [part]: e.target.value })}
                      />
                      {part !== 'I' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePart(part)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete Part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4" onClick={handleAddPart}>
                <Plus className="w-4 h-4 mr-2" />
                Add More Parts
              </Button>
            </CardContent>
          )
        }
      </Card >

      {/* Questions List */}
      < div className="space-y-4" >
        {
          questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {parts.map(part => {
                const partQuestions = questions.filter(q => (q.part || 'I') === part);

                return (
                  <Card key={`part-${part}`} className="mb-6">
                    <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Part {part}{partTitles[part] ? `: ${partTitles[part]}` : ''}</CardTitle>
                        <span className="text-sm text-gray-500">{partQuestions.length} Questions</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                              <TableHead>Question Details</TableHead>
                              <TableHead className="w-[100px]">Marks</TableHead>
                              <TableHead className="w-[120px]">Mandatory</TableHead>
                              <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partQuestions.length > 0 ? (
                              partQuestions.map((question) => (
                                <QuestionRow
                                  key={question.id}
                                  question={question}
                                  globalIndex={questions.findIndex(q => q.id === question.id) + 1}
                                  handleStartEdit={handleStartEdit}
                                  handleDeleteQuestion={handleDeleteQuestion}
                                  handleToggleMandatory={handleToggleMandatory}
                                  handleLongPress={setReorderQuestion}
                                />
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500 bg-gray-50/50">
                                  No questions in this part
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="md:hidden p-4 space-y-4 min-h-[50px]">
                        {partQuestions.length > 0 ? (
                          partQuestions.map((question) => (
                            <div key={question.id}>
                              <QuestionRow
                                key={question.id}
                                question={question}
                                globalIndex={questions.findIndex(q => q.id === question.id) + 1}
                                handleStartEdit={handleStartEdit}
                                handleDeleteQuestion={handleDeleteQuestion}
                                handleToggleMandatory={handleToggleMandatory}
                                handleLongPress={setReorderQuestion}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="h-24 flex items-center justify-center text-center text-gray-500 bg-gray-50/50 rounded border border-dashed">
                            No questions in this part
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        }
      </div >

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Question" : "Add New Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">

            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter the question text..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maximum Marks</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.maxMark}
                  onChange={(e) => setFormData({ ...formData, maxMark: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Part</Label>
                <Select
                  value={formData.part}
                  onValueChange={(val) => setFormData({ ...formData, part: val, partTitle: partTitles[val] || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Part" />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map(p => (
                      <SelectItem key={p} value={p}>Part {p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Part Title</Label>
                <Input
                  value={formData.partTitle}
                  onChange={(e) => {
                    setFormData({ ...formData, partTitle: e.target.value });
                    setPartTitles(prev => ({ ...prev, [formData.part]: e.target.value }));
                  }}
                  placeholder="Optional title"
                />
              </div>
            </div>

            <div className="flex gap-8">
              <div className="flex items-center space-x-2">
                <Switch
                  id="mandatory"
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMandatory: checked })}
                />
                <Label htmlFor="mandatory">Mandatory</Label>
              </div>
            </div>

            {formData.subFields.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold mb-2 block">Filled By</Label>
                <div className="flex bg-muted p-1 rounded-md w-fit">
                  <Button
                    variant={!formData.isReadOnly ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setFormData({ ...formData, isReadOnly: false })}
                  >Animator</Button>
                  <Button
                    variant={formData.isReadOnly ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setFormData({ ...formData, isReadOnly: true })}
                  >Admin</Button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base">Sub-fields (Optional)</Label>
                <Button variant="ghost" size="sm" onClick={addSubField} className="text-blue-600">
                  <PlusCircle className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-4">
                {formData.subFields.map((sf, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900 border p-3 rounded-lg relative space-y-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6 text-red-500 hover:bg-red-50"
                      onClick={() => removeSubField(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-4 gap-3 pr-8">
                      <div className="col-span-3">
                        <Label className="text-xs mb-1 block">Title</Label>
                        <Input value={sf.text} onChange={e => updateSubField(idx, { text: e.target.value })} className="h-8" />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs mb-1 block">Marks</Label>
                        <Input type="number" min={0} value={sf.maxMark} onChange={e => updateSubField(idx, { maxMark: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })} className="h-8" />
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-semibold">FILLED BY</Label>
                        <div className="flex bg-muted p-0.5 rounded-md w-fit">
                          <Button
                            variant={!sf.isReadOnly ? "secondary" : "ghost"}
                            size="sm"
                            className="h-6 text-[10px] px-2 py-0"
                            onClick={() => updateSubField(idx, { isReadOnly: false })}
                          >Animator</Button>
                          <Button
                            variant={sf.isReadOnly ? "secondary" : "ghost"}
                            size="sm"
                            className="h-6 text-[10px] px-2 py-0"
                            onClick={() => updateSubField(idx, { isReadOnly: true })}
                          >Admin</Button>
                        </div>
                      </div>

                      {sf.isReadOnly && (
                        <div className="flex-1">
                          <Label className="text-xs mb-1 block text-green-700">Prefilled Admin Text / Marks</Label>
                          <Input
                            value={sf.adminText || sf.adminMark || ''}
                            onChange={e => updateSubField(idx, { adminText: e.target.value })}
                            className="h-8 border-green-200 focus-visible:ring-green-500"
                            placeholder="Data preset by admin"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reorderQuestion} onOpenChange={(open) => !open && setReorderQuestion(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manual Reorder</DialogTitle>
            <DialogDescription>
              Assign a strict position for this question within Part {(reorderQuestion?.part || 'I')}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm text-foreground/80 line-clamp-2">
              {reorderQuestion?.text}
            </div>
            <div className="space-y-2">
              <Label>Position inside Part</Label>
              <Input
                type="number"
                min={1}
                max={questions.filter(q => (q.part || 'I') === (reorderQuestion?.part || 'I')).length}
                value={newOrderPos}
                onChange={e => setNewOrderPos(parseInt(e.target.value) || '')}
                placeholder="e.g. 1"
              />
              <p className="text-xs text-muted-foreground">
                Total questions in this part: {questions.filter(q => (q.part || 'I') === (reorderQuestion?.part || 'I')).length}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReorderQuestion(null)}>Cancel</Button>
            <Button onClick={handleManualOrderSave} className="bg-blue-600 hover:bg-blue-700">Update Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
