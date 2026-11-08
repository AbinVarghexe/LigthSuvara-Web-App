import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  FileText,
  Download,
  Eye,
  Lock,
  Unlock,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  GraduationCap,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Progress } from "../../components/ui/progress";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { toast } from "sonner";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { renderToString } from "react-dom/server";
import { MarksPdfTemplate } from "./MarksPdfTemplate";

import {
  getMarks,
  searchMarks,
  getMarksStats,
  getAvailableYears,
  getMarksWithDetails,
  toggleMarksLock,
  updateMarksRemark,
  updateQuestionRemark,
  updateQuestionMark,
  updateQuestionTextValue,
  getMarksByParish,
  MarksData,
  MarksWithDetails,
  AnimatorEvaluation,
} from "../../features/marks/services/marksService";
import { Timestamp } from "firebase/firestore";
import { formatAcademicYear } from "../../features/animators/services/animatorService";

export function Marks() {
  const [marks, setMarks] = useState<MarksData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedMarks, setSelectedMarks] = useState<MarksWithDetails | null>(
    null,
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [viewGrouping, setViewGrouping] = useState<"consolidated" | "individual">("consolidated");
  const [selectedEvaluationTab, setSelectedEvaluationTab] = useState<string>("consolidated");
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    lockedSubmissions: 0,
    unlockedSubmissions: 0,
    averageMarks: 0,
    averagePercentage: 0,
    maxPossibleMarks: 0,
  });
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [editRemarkText, setEditRemarkText] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [editingQuestionRemark, setEditingQuestionRemark] = useState("");
  const [savingQuestionRemark, setSavingQuestionRemark] = useState(false);
  // States for marks editing
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [editingMarkValue, setEditingMarkValue] = useState("");
  const [savingMark, setSavingMark] = useState(false);
  const [loadingMarksId, setLoadingMarksId] = useState<string | null>(null);

  // Comparison States
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<MarksData[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("cards");
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const yearFilter = selectedYear === "all" ? undefined : selectedYear;
      const isRaw = viewGrouping === "individual";
      const [marksData, years, statsData] = await Promise.all([
        searchTerm ? searchMarks(searchTerm, yearFilter) : getMarks(yearFilter, isRaw),
        getAvailableYears(),
        getMarksStats(yearFilter),
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
  }, [selectedYear, viewGrouping]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleViewDetails = async (marksId: string) => {
    try {
      setLoadingMarksId(marksId);
      const details = await getMarksWithDetails(marksId);
      if (details) {
        setSelectedMarks(details);
        setSelectedEvaluationTab("consolidated");
        setShowAllQuestions(false);
        setIsEditingRemark(false);
        setEditRemarkText(details.remarks || "");
        setEditingQuestionId(null);
        setEditingMarkId(null);
        setIsComparing(false);
        setComparisonData([]);
        setIsDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching marks details:", error);
      toast.error("Failed to load marks details");
    } finally {
      setLoadingMarksId(null);
    }
  };

  const handleCompareToggle = async () => {
    if (!selectedMarks) return;
    if (!isComparing) {
      try {
        setLoadingComparison(true);
        const parishMarks = await getMarksByParish(selectedMarks.parish);
        setComparisonData(parishMarks);
        setIsComparing(true);
      } catch (error) {
        console.error("Error loading comparison data:", error);
        toast.error("Failed to load comparison data");
      } finally {
        setLoadingComparison(false);
      }
    } else {
      setIsComparing(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!selectedMarks) return;
    try {
      setSavingRemark(true);
      await updateMarksRemark(selectedMarks.id!, editRemarkText);
      toast.success("Remark updated successfully");

      const updatedMarks = { ...selectedMarks, remarks: editRemarkText };
      setSelectedMarks(updatedMarks);
      setMarks(
        marks.map((m) =>
          m.id === selectedMarks.id ? { ...m, remarks: editRemarkText } : m,
        ),
      );

      setIsEditingRemark(false);
    } catch (error) {
      console.error("Error saving remark:", error);
      toast.error("Failed to save remark");
    } finally {
      setSavingRemark(false);
    }
  };

  const handleSaveQuestionRemark = async (questionId: string) => {
    if (!selectedMarks) return;
    try {
      setSavingQuestionRemark(true);

      const isSubField = questionId.includes("_sub_");

      if (isSubField) {
        await updateQuestionTextValue(selectedMarks.id!, questionId, editingQuestionRemark);
        toast.success("Sub-field detail updated");

        const updatedTextValues = {
          ...(selectedMarks.textValues || {}),
          [questionId]: editingQuestionRemark,
        };

        const updatedMarks = { ...selectedMarks, textValues: updatedTextValues };
        setSelectedMarks(updatedMarks);
        setMarks(marks.map(m => m.id === selectedMarks.id ? { ...m, textValues: updatedTextValues } : m));
      } else {
        await updateQuestionRemark(
          selectedMarks.id!,
          questionId,
          editingQuestionRemark,
        );
        toast.success("Question remark updated successfully");

        const currentQuestionRemarks = selectedMarks.questionRemarks || {};
        const updatedQuestionRemarks = {
          ...currentQuestionRemarks,
          [questionId]: editingQuestionRemark,
        };

        const updatedMarks = {
          ...selectedMarks,
          questionRemarks: updatedQuestionRemarks,
        };
        setSelectedMarks(updatedMarks);
        setMarks(
          marks.map((m) =>
            m.id === selectedMarks.id
              ? { ...m, questionRemarks: updatedQuestionRemarks }
              : m,
          ),
        );
      }

      setEditingQuestionId(null);
    } catch (error) {
      console.error("Error saving question remark/text:", error);
      toast.error("Failed to save changes");
    } finally {
      setSavingQuestionRemark(false);
    }
  };

  const handleSaveQuestionMark = async (
    questionId: string,
    maxMarks: number,
  ) => {
    if (!selectedMarks) return;

    const newMarkValue = parseInt(editingMarkValue);
    if (isNaN(newMarkValue) || newMarkValue < 0 || newMarkValue > maxMarks) {
      toast.error(`Mark must be between 0 and ${maxMarks}`);
      return;
    }

    try {
      setSavingMark(true);
      await updateQuestionMark(selectedMarks.id!, questionId, newMarkValue);

      // Update local state and totals
      const updatedMarksMap = {
        ...selectedMarks.marks,
        [questionId]: newMarkValue,
      };

      // Recalculate totals
      let newTotal = 0;
      selectedMarks.questions.forEach((q) => {
        if (q.id) {
          if (q.id === questionId) {
            newTotal += newMarkValue;
          } else if (updatedMarksMap[q.id] !== undefined) {
            newTotal += updatedMarksMap[q.id];
          }
        }
      });

      const newPercentage =
        selectedMarks.maxTotalMarks > 0
          ? (newTotal / selectedMarks.maxTotalMarks) * 100
          : 0;

      const updatedMarksData = {
        ...selectedMarks,
        marks: updatedMarksMap,
        totalMarks: newTotal,
        percentage: newPercentage,
      };

      setSelectedMarks(updatedMarksData);
      setMarks(
        marks.map((m) =>
          m.id === selectedMarks.id ? { ...m, ...updatedMarksData } : m,
        ),
      );

      setEditingMarkId(null);
      toast.success("Mark updated successfully");
    } catch (error) {
      console.error("Error saving mark:", error);
      toast.error("Failed to save mark");
    } finally {
      setSavingMark(false);
    }
  };

  const handleToggleLock = async (marksId: string, currentStatus: boolean) => {
    try {
      await toggleMarksLock(marksId, currentStatus, selectedMarks?.peerMarksIds);
      toast.success(
        `Marks ${!currentStatus ? "finalized" : "unfinalized"} successfully`,
      );

      // Refresh data
      fetchData();

      // Update local state if needed (for dialog)
      if (selectedMarks && (selectedMarks.id === marksId || selectedMarks.peerMarksIds?.includes(marksId))) {
        setSelectedMarks({
          ...selectedMarks,
          locked: !currentStatus,
          allLocked: !currentStatus,
          evaluations: selectedMarks.evaluations?.map(ev => ({ ...ev, locked: !currentStatus }))
        });
      }
    } catch (error) {
      console.error("Error toggling marks lock:", error);
      toast.error("Failed to update marks status");
    }
  };


  const generatePDF = async (marksData: MarksWithDetails, customFilename?: string) => {
    toast.loading("Preparing professional report...", { id: "pdf-gen" });
    try {
      // 1. Render React component to static HTML string
      const htmlString = renderToString(<MarksPdfTemplate marksData={marksData} />);

      // 2. Wrap in a full HTML document (with required styles/fonts)
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700&display=swap');
              body { margin: 0; padding: 0; }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            ${htmlString}
          </body>
        </html>
      `;

      // 3. Create a temporary container for html2pdf
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = fullHtml;

      const cleanParish = (marksData.parish || 'School').replace(/\s+/g, '_');
      const defaultFilename = marksData.isConsolidated && (marksData.submissionCount || 1) > 1
        ? `Marks_${cleanParish}_Consolidated_${marksData.year}.pdf`
        : `Marks_${cleanParish}_${(marksData.animatorName || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_')}_${marksData.year}.pdf`;

      // 4. Configure html2pdf options
      const opt = {
        margin: 0, // Margins are already in the template's padding
        filename: customFilename || defaultFilename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2.5, // High resolution for Malayalam text
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 800
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Professional page breaks
      };

      // 5. Generate and save PDF
      await html2pdf().from(tempDiv).set(opt).save();

      toast.success("Professional report generated", { id: "pdf-gen" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", { id: "pdf-gen" });
    }
  };

  const buildIndividualMarksDetails = (
    baseMarks: MarksWithDetails,
    evaluation: AnimatorEvaluation
  ): MarksWithDetails => {
    return {
      ...baseMarks,
      id: evaluation.marksId,
      animatorId: evaluation.animatorId,
      animatorName: evaluation.animatorName,
      animatorNames: [evaluation.animatorName],
      marks: evaluation.marks || {},
      remarks: evaluation.remarks || '',
      questionRemarks: evaluation.questionRemarks || {},
      textValues: evaluation.textValues || baseMarks.textValues || {},
      totalMarks: evaluation.totalMarks,
      percentage: evaluation.percentage,
      isConsolidated: false,
      submissionCount: 1,
      locked: evaluation.locked ?? false
    };
  };

  const downloadIndividualPDF = async (baseMarks: MarksWithDetails, evaluation: AnimatorEvaluation) => {
    const individualData = buildIndividualMarksDetails(baseMarks, evaluation);
    const cleanParish = (baseMarks.parish || 'School').replace(/\s+/g, '_');
    const cleanName = (evaluation.animatorName || 'Evaluator').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Marks_${cleanParish}_${cleanName}_${baseMarks.year}.pdf`;
    await generatePDF(individualData, filename);
  };

  const downloadAllPDFs = async (baseMarks: MarksWithDetails) => {
    if (!baseMarks.evaluations || baseMarks.evaluations.length <= 1) {
      await generatePDF(baseMarks);
      return;
    }
    const cleanParish = (baseMarks.parish || 'School').replace(/\s+/g, '_');
    const totalCount = baseMarks.evaluations.length + 1;
    toast.info(`Preparing ${totalCount} PDF reports for download...`, { id: "pdf-gen-all" });

    // 1. Download Consolidated PDF
    await generatePDF(
      baseMarks,
      `Marks_${cleanParish}_Consolidated_${baseMarks.year}.pdf`
    );

    // 2. Download each individual evaluator's PDF sequentially
    for (let i = 0; i < baseMarks.evaluations.length; i++) {
      await new Promise(res => setTimeout(res, 800));
      const ev = baseMarks.evaluations[i];
      await downloadIndividualPDF(baseMarks, ev);
    }

    toast.success(`All ${totalCount} reports downloaded successfully!`, { id: "pdf-gen-all" });
  };

  const formatDate = (date: Timestamp | undefined) => {
    if (!date) return "N/A";
    try {
      return date.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderAnimatorComparisonMatrix = () => {
    if (!selectedMarks || !selectedMarks.evaluations) return null;
    const evals = selectedMarks.evaluations;

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50">
            <TableHead className="w-12 font-semibold">
              #
            </TableHead>
            <TableHead className="font-semibold">
              Question
            </TableHead>
            <TableHead className="w-20 text-right font-semibold">
              Max
            </TableHead>
            {evals.map((ev, idx) => (
              <TableHead key={ev.marksId || idx} className="text-right font-semibold whitespace-nowrap min-w-[120px]">
                <div className="flex flex-col items-end">
                  <span className="text-xs truncate max-w-[140px] font-semibold text-slate-900 dark:text-slate-100">{ev.animatorName}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {ev.totalMarks}/{selectedMarks.maxTotalMarks} ({ev.percentage.toFixed(1)}%)
                  </span>
                </div>
              </TableHead>
            ))}
            <TableHead className="w-28 text-right font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30">
              Consolidated (Avg)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedMarks.questions
            .slice(0, showAllQuestions ? undefined : 6)
            .map((question, index) => {
              const subFields = question.subFields || [];
              const hasSubFields = subFields.length > 0;
              const questionMaxMark = hasSubFields
                ? subFields.reduce((sum, sf) => sum + (sf.maxMark || 0), 0)
                : (question.maxMark || 0);

              const avgMark = selectedMarks.marks[question.id!] !== undefined
                ? selectedMarks.marks[question.id!]
                : 0;

              return (
                <React.Fragment key={question.id}>
                  <TableRow className={hasSubFields ? "bg-slate-50/50" : ""}>
                    <TableCell className="font-medium text-muted-foreground align-top pt-4">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm py-3">
                      <div className={`max-w-[140px] md:max-w-none md:whitespace-normal ${hasSubFields ? "font-bold" : ""}`}>
                        {question.text}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground align-top pt-4 font-semibold">
                      {questionMaxMark > 0 ? questionMaxMark : "-"}
                    </TableCell>
                    {evals.map((ev, idx) => {
                      const evMark = ev.marks[question.id!] !== undefined ? ev.marks[question.id!] : "-";
                      return (
                        <TableCell key={ev.marksId || idx} className="text-right font-medium align-top pt-4">
                          {evMark}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-bold text-blue-700 dark:text-blue-400 align-top pt-4 bg-blue-50/30 dark:bg-blue-950/10">
                      {avgMark}
                    </TableCell>
                  </TableRow>

                  {hasSubFields && subFields.map((sf, sfIndex) => {
                    const subKey = `${question.id}_sub_${sfIndex}`;
                    const labelText = selectedMarks.labelsMap?.[subKey] || sf.text || `Sub ${sfIndex + 1}`;
                    const avgSubMark = selectedMarks.marks[subKey] !== undefined ? selectedMarks.marks[subKey] : "-";

                    return (
                      <TableRow key={subKey} className="bg-slate-50/30">
                        <TableCell />
                        <TableCell className="text-[12px] py-2 pl-8 border-l-2 border-blue-100">
                          <span className="text-slate-700 font-medium">{labelText}</span>
                        </TableCell>
                        <TableCell className="text-right text-[11px] text-muted-foreground">
                          {(sf.maxMark && sf.maxMark > 0) ? sf.maxMark : "-"}
                        </TableCell>
                        {evals.map((ev, idx) => {
                          const sfMark = ev.marks[subKey] !== undefined ? ev.marks[subKey] : "-";
                          return (
                            <TableCell key={ev.marksId || idx} className="text-right text-[12px] font-medium">
                              {sfMark}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right text-[12px] text-blue-700 font-bold bg-blue-50/30 dark:bg-blue-950/10">
                          {avgSubMark}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}

          <TableRow className="bg-slate-50 dark:bg-slate-900/50 font-semibold border-t-2 font-bold">
            <TableCell></TableCell>
            <TableCell>Total</TableCell>
            <TableCell className="text-right">{selectedMarks.maxTotalMarks}</TableCell>
            {evals.map((ev, idx) => (
              <TableCell key={ev.marksId || idx} className="text-right font-bold">
                {ev.totalMarks}
              </TableCell>
            ))}
            <TableCell className="text-right font-bold text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10">
              {selectedMarks.totalMarks}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  const renderQuestionsTable = () => {
    if (!selectedMarks) return null;

    if (selectedMarks.isConsolidated && (selectedMarks.evaluations?.length || 0) > 1 && selectedEvaluationTab === "comparison") {
      return renderAnimatorComparisonMatrix();
    }

    if (isComparing) {
      const compYears = Array.from(new Set(comparisonData.map(r => r.year))).sort((a, b) => b.localeCompare(a));
      const currentQuestionIds = new Set(selectedMarks.questions.map(q => q.id));
      const differentParentIdsSet = new Set<string>();
      
      comparisonData.forEach(rec => {
        Object.keys(rec.marks).forEach(key => {
          let parentId = key;
          if (key.includes("_sub_")) {
            parentId = key.split("_sub_")[0];
          }
          if (!currentQuestionIds.has(parentId)) {
            differentParentIdsSet.add(parentId);
          }
        });
      });
      const differentParentIds = Array.from(differentParentIdsSet);

      const getQuestionMarkForYear = (rec: MarksData | undefined, qId: string, subFieldCount: number) => {
        if (!rec) return "-";
        if (subFieldCount > 0) {
          const uniqueSubKeys = new Set(Object.keys(rec.marks).filter(k => k.startsWith(`${qId}_sub_`)));
          if (uniqueSubKeys.size > 0) {
            let sum = 0;
            uniqueSubKeys.forEach(k => {
              sum += rec.marks[k] || 0;
            });
            return sum;
          }
        }
        return rec.marks[qId] !== undefined ? rec.marks[qId] : "-";
      };

      const getSubFieldKeysForParent = (parentId: string, recs: MarksData[]) => {
        const subKeys = new Set<string>();
        recs.forEach(rec => {
          Object.keys(rec.marks).forEach(key => {
            if (key.startsWith(`${parentId}_sub_`)) {
              subKeys.add(key);
            }
          });
        });
        return Array.from(subKeys).sort();
      };

      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50">
              <TableHead className="w-12 font-semibold">
                #
              </TableHead>
              <TableHead className="font-semibold">
                Question
              </TableHead>
              <TableHead className="w-24 text-right font-semibold">
                Max Marks
              </TableHead>
              {compYears.map(year => (
                <TableHead key={year} className="w-28 text-right font-semibold whitespace-nowrap">
                  {year} {year === selectedMarks.year ? "(Current)" : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedMarks.questions.map((question, index) => {
              const subFields = question.subFields || [];
              const hasSubFields = subFields.length > 0;
              const questionMaxMark = hasSubFields
                ? subFields.reduce((sum, sf) => sum + (sf.maxMark || 0), 0)
                : (question.maxMark || 0);

              return (
                <React.Fragment key={question.id}>
                  <TableRow className={hasSubFields ? "bg-slate-50/50" : ""}>
                    <TableCell className="font-medium text-muted-foreground align-top pt-4">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm py-3">
                      <div className="flex flex-col gap-2">
                        <div className={`max-w-[140px] md:max-w-none md:whitespace-normal ${hasSubFields ? "font-bold" : ""}`}>
                          {question.text}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground align-top pt-4 font-semibold">
                      {questionMaxMark > 0 ? questionMaxMark : "-"}
                    </TableCell>
                    {compYears.map(year => {
                      const rec = comparisonData.find(r => r.year === year);
                      const mark = getQuestionMarkForYear(rec, question.id!, subFields.length);
                      return (
                        <TableCell key={year} className="text-right font-medium align-top pt-4">
                          {mark}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {hasSubFields && subFields.map((sf, sfIndex) => {
                    const subKey = `${question.id}_sub_${sfIndex}`;
                    const labelText = selectedMarks.labelsMap?.[subKey] || sf.text || `Sub ${sfIndex + 1}`;

                    return (
                      <TableRow key={subKey} className="bg-slate-50/30">
                        <TableCell />
                        <TableCell className="text-[12px] py-2 pl-8 border-l-2 border-blue-100">
                          <span className="text-slate-700 font-medium">{labelText}</span>
                        </TableCell>
                        <TableCell className="text-right text-[11px] text-muted-foreground">
                          {(sf.maxMark && sf.maxMark > 0) ? sf.maxMark : "-"}
                        </TableCell>
                        {compYears.map(year => {
                          const rec = comparisonData.find(r => r.year === year);
                          const mark = rec && rec.marks[subKey] !== undefined ? rec.marks[subKey] : "-";
                          return (
                            <TableCell key={year} className="text-right text-[12px] text-blue-700 font-medium">
                              {mark}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {differentParentIds.map((parentId, index) => {
              const subKeys = getSubFieldKeysForParent(parentId, comparisonData);
              const hasSubFields = subKeys.length > 0;

              return (
                <React.Fragment key={parentId}>
                  <TableRow className="bg-red-50/20 dark:bg-red-950/10">
                    <TableCell className="font-medium text-muted-foreground align-top pt-4">
                      {selectedMarks.questions.length + index + 1}
                    </TableCell>
                    <TableCell className="text-sm py-3">
                      <div className="flex flex-col gap-2">
                        <div className={`font-semibold text-red-800 dark:text-red-400 ${hasSubFields ? "font-bold" : ""}`}>
                          Different/Removed Question (ID: {parentId})
                        </div>
                        <div className="text-xs text-muted-foreground italic">
                          This question does not exist in the current year's assessment structure.
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground align-top pt-4 font-semibold">
                      -
                    </TableCell>
                    {compYears.map(year => {
                      const rec = comparisonData.find(r => r.year === year);
                      const mark = getQuestionMarkForYear(rec, parentId, subKeys.length);
                      return (
                        <TableCell key={year} className="text-right font-medium align-top pt-4">
                          {mark}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {hasSubFields && subKeys.map((subKey, sfIndex) => {
                    const labelText = `Sub-field ${sfIndex + 1} (${subKey.split('_sub_')[1]})`;
                    return (
                      <TableRow key={subKey} className="bg-red-50/10 dark:bg-red-950/5">
                        <TableCell />
                        <TableCell className="text-[12px] py-2 pl-8 border-l-2 border-red-200 text-red-700 dark:text-red-400">
                          <span className="font-medium">{labelText}</span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground align-top pt-2">
                          -
                        </TableCell>
                        {compYears.map(year => {
                          const rec = comparisonData.find(r => r.year === year);
                          const mark = rec && rec.marks[subKey] !== undefined ? rec.marks[subKey] : "-";
                          return (
                            <TableCell key={year} className="text-right text-[12px] text-red-700 dark:text-red-400 font-medium">
                              {mark}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      );
    }

    const activeEval = (selectedMarks.evaluations && selectedMarks.evaluations.length > 1 && selectedEvaluationTab !== "consolidated" && selectedEvaluationTab !== "comparison")
      ? selectedMarks.evaluations.find(e => e.marksId === selectedEvaluationTab)
      : null;

    const displayMarks = activeEval ? activeEval.marks : selectedMarks.marks;
    const displayTextValues = activeEval ? (activeEval.textValues || {}) : (selectedMarks.textValues || {});
    const displayQuestionRemarks = activeEval ? (activeEval.questionRemarks || {}) : (selectedMarks.questionRemarks || {});
    const isIndividualView = !!activeEval;

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50">
            <TableHead className="w-12 font-semibold">
              #
            </TableHead>
            <TableHead className="font-semibold">
              Question
            </TableHead>
            <TableHead className="w-24 text-right font-semibold">
              Marks
            </TableHead>
            <TableHead className="w-24 text-right font-semibold">
              Max
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedMarks.questions
            .slice(0, showAllQuestions ? undefined : 6)
            .map((question, index) => {
              const subFields = question.subFields || [];
              const answeredSubkeys = subFields.map((_, i) => `${question.id}_sub_${i}`).filter(subKey => {
                const mark = displayMarks[subKey];
                const text = displayTextValues[subKey]?.trim();
                return (mark !== undefined && mark > 0) || (text !== undefined && text !== '');
              });

              const hasSubFields = answeredSubkeys.length > 0;
              const questionMarks = hasSubFields
                ? answeredSubkeys.reduce((sum, key) => sum + (displayMarks[key] || 0), 0)
                : (displayMarks[question.id!] || 0);

              const questionMaxMark = hasSubFields
                ? subFields.reduce((sum, sf) => sum + (sf.maxMark || 0), 0)
                : (question.maxMark || 0);

              return (
                <React.Fragment key={question.id}>
                  <TableRow className={hasSubFields ? "bg-slate-50/50" : ""}>
                    <TableCell className="font-medium text-muted-foreground align-top pt-4">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm py-3">
                      <div className="flex flex-col gap-2">
                        <div className={`max-w-[140px] md:max-w-none md:whitespace-normal ${hasSubFields ? "font-bold" : ""}`}>
                          {question.text}
                        </div>

                        {!hasSubFields && (
                          <div className="mt-2 text-xs">
                            {editingQuestionId === question.id ? (
                              <div className="space-y-2 mt-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md border">
                                <Textarea
                                  value={editingQuestionRemark}
                                  onChange={(e) => setEditingQuestionRemark(e.target.value)}
                                  placeholder="Enter remark..."
                                  className="min-h-[60px] text-xs"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setEditingQuestionId(null)} disabled={savingQuestionRemark}>Cancel</Button>
                                  <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleSaveQuestionRemark(question.id!)} disabled={savingQuestionRemark}>
                                    {savingQuestionRemark && (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    )}
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2 group/remark">
                                {displayQuestionRemarks[question.id!] ? (
                                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-dashed text-muted-foreground italic break-words text-[10px]">
                                    <span className="font-semibold not-italic mr-1">Remark:</span>
                                    {displayQuestionRemarks[question.id!]}
                                  </div>
                                ) : (
                                  <div className="flex-1 text-muted-foreground/50 italic py-1 text-[10px]">No remark</div>
                                )}
                                {!selectedMarks.locked && !isIndividualView && !selectedMarks.isConsolidated && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/remark:opacity-100" onClick={() => {
                                    setEditingQuestionRemark(displayQuestionRemarks[question.id!] || "");
                                    setEditingQuestionId(question.id!);
                                  }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium align-top pt-4">
                      {hasSubFields ? (
                        <span className="font-bold">{questionMarks}</span>
                      ) : editingMarkId === question.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={question.maxMark ?? 0}
                            value={editingMarkValue}
                            onChange={(e) => setEditingMarkValue(e.target.value)}
                            className="h-7 w-16 text-right px-1 text-sm font-medium"
                            autoFocus
                            disabled={savingMark}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSaveQuestionMark(
                                  question.id!,
                                  question.maxMark ?? 0,
                                );
                              if (e.key === "Escape")
                                setEditingMarkId(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleSaveQuestionMark(question.id!, question.maxMark || 0)} disabled={savingMark}>
                            {savingMark ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setEditingMarkId(null)}
                            disabled={savingMark}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 group/mark">
                          <span>{questionMarks || "-"}</span>
                          {!selectedMarks.locked && !isIndividualView && !selectedMarks.isConsolidated && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/mark:opacity-100 transition-opacity" onClick={() => {
                              setEditingMarkId(question.id!);
                              setEditingMarkValue(questionMarks.toString());
                            }}>
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground align-top pt-4 font-semibold">
                      {questionMaxMark > 0 ? questionMaxMark : "-"}
                    </TableCell>
                  </TableRow>

                  {hasSubFields && answeredSubkeys.map((subKey, sfIndex) => {
                    const subIdx = parseInt(subKey.split('_sub_')[1]);
                    const sf = subFields[subIdx];
                    const sfMark = displayMarks[subKey] || 0;
                    const labelText = selectedMarks.labelsMap?.[subKey] || (sf?.text) || `Sub ${sfIndex + 1}`;

                    return (
                      <TableRow key={subKey} className="bg-slate-50/30">
                        <TableCell />
                        <TableCell className="text-[12px] py-2 pl-8 border-l-2 border-blue-100">
                          <div className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium">{labelText}</span>

                            <div className="text-xs">
                              {editingQuestionId === subKey ? (
                                <div className="space-y-2 mt-1 bg-white dark:bg-slate-800 p-2 rounded-md border shadow-sm">
                                  <Textarea
                                    value={editingQuestionRemark}
                                    onChange={(e) => setEditingQuestionRemark(e.target.value)}
                                    placeholder="Enter sub-field detail..."
                                    className="min-h-[50px] text-xs"
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditingQuestionId(null)} disabled={savingQuestionRemark}>Cancel</Button>
                                    <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleSaveQuestionRemark(subKey)} disabled={savingQuestionRemark}>
                                      {savingQuestionRemark && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 group/subremark">
                                  {displayTextValues[subKey] ? (
                                    <div className="flex-1 bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 italic text-[10px]">
                                      {displayTextValues[subKey]}
                                    </div>
                                  ) : (
                                    <div className="flex-1 text-muted-foreground/50 italic py-1 text-[10px]">No specific detail</div>
                                  )}
                                  {!selectedMarks.locked && !isIndividualView && !selectedMarks.isConsolidated && (
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/subremark:opacity-100" onClick={() => {
                                      setEditingQuestionRemark(displayTextValues[subKey] || "");
                                      setEditingQuestionId(subKey);
                                    }}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[12px] text-blue-700 font-medium">
                          {sfMark || "-"}
                        </TableCell>
                        <TableCell className="text-right text-[11px] text-muted-foreground">
                          {(sf.maxMark && sf.maxMark > 0) ? sf.maxMark : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}

          <TableRow className="bg-slate-50 dark:bg-slate-900/50 font-semibold border-t-2 font-bold">
            <TableCell></TableCell>
            <TableCell>Total</TableCell>
            <TableCell className="text-right">
              {activeEval ? activeEval.totalMarks : selectedMarks.totalMarks}
            </TableCell>
            <TableCell className="text-right">
              {selectedMarks.maxTotalMarks}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  const renderDialogContent = () => {
    if (!selectedMarks) return null;

    return (
      <>
        <DialogHeader className="pb-4 border-b mb-4 sm:mb-6 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Assessment Details
            </DialogTitle>
            <DialogDescription>
              Breakdown of assessment marks and student performance
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <Button
              variant={isComparing ? "default" : "outline"}
              size="sm"
              onClick={handleCompareToggle}
              disabled={loadingComparison}
              className="gap-2"
            >
              {loadingComparison ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {isComparing ? "Show Details" : "Compare"}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Multi-Animator Evaluation Selector */}
          {selectedMarks.isConsolidated && selectedMarks.evaluations && selectedMarks.evaluations.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 rounded-xl border">
              <Button
                type="button"
                variant={selectedEvaluationTab === "consolidated" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => setSelectedEvaluationTab("consolidated")}
              >
                <FileText className="h-3.5 w-3.5" />
                Consolidated (Avg of {selectedMarks.submissionCount})
              </Button>
              <Button
                type="button"
                variant={selectedEvaluationTab === "comparison" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => setSelectedEvaluationTab("comparison")}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Side-by-Side Comparison
              </Button>
              <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
              {selectedMarks.evaluations.map((ev, idx) => (
                <Button
                  key={ev.marksId || idx}
                  type="button"
                  variant={selectedEvaluationTab === ev.marksId ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs font-medium gap-1.5"
                  onClick={() => setSelectedEvaluationTab(ev.marksId)}
                >
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[9px]">
                      {getInitials(ev.animatorName)}
                    </AvatarFallback>
                  </Avatar>
                  {ev.animatorName}
                </Button>
              ))}
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parish
              </span>
              <p className="font-semibold text-sm">
                {selectedMarks.parish}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sunday School
              </span>
              <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                {selectedMarks.sundaySchool}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </span>
              <div className="pt-0.5">
                {selectedMarks.category ? (
                  <Badge variant="outline" className={`font-semibold ${
                    selectedMarks.category === 'A' ? 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                    selectedMarks.category === 'B' ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                    'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300'
                  }`}>
                    Cat {selectedMarks.category} (Max {selectedMarks.maxAnimators || (selectedMarks.category === 'A' ? 3 : selectedMarks.category === 'B' ? 2 : 1)})
                  </Badge>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {selectedMarks.isConsolidated && (selectedMarks.submissionCount || 1) > 1 ? "Animators" : "Animator"}
              </span>
              <div className="font-semibold text-sm">
                {selectedMarks.isConsolidated && selectedMarks.animatorNames && selectedMarks.animatorNames.length > 1 ? (
                  <div className="flex flex-col">
                    <span>{selectedMarks.animatorNames.join(", ")}</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      ({selectedMarks.submissionCount} submissions)
                    </span>
                  </div>
                ) : (
                  selectedMarks.animatorName
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Year
              </span>
              <p className="font-semibold text-sm">
                {selectedMarks.year}
              </p>
            </div>
          </div>

          {/* Score Card */}
          {(() => {
            const activeEval = (selectedMarks.evaluations && selectedMarks.evaluations.length > 1 && selectedEvaluationTab !== "consolidated" && selectedEvaluationTab !== "comparison")
              ? selectedMarks.evaluations.find(e => e.marksId === selectedEvaluationTab)
              : null;
            const currentTotal = activeEval ? activeEval.totalMarks : selectedMarks.totalMarks;
            const currentPercentage = activeEval ? activeEval.percentage : selectedMarks.percentage;
            const scoreLabel = activeEval
              ? `Total Score (${activeEval.animatorName})`
              : selectedMarks.isConsolidated && (selectedMarks.submissionCount || 1) > 1
              ? `Consolidated Average Score (${selectedMarks.submissionCount} Animators)`
              : "Total Score";

            return (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 sm:p-6 border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {scoreLabel}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-50">
                        {currentTotal}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {selectedMarks.maxTotalMarks}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[150px]">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        currentPercentage,
                      )}`}
                    >
                      {currentPercentage.toFixed(1)}%
                    </div>
                    <Progress
                      value={currentPercentage}
                      className="h-2 w-full"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Questions Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                Question Breakdown {selectedEvaluationTab === "comparison" ? "- Side-by-Side Comparison" : selectedEvaluationTab !== "consolidated" ? `- Evaluator: ${selectedMarks.evaluations?.find(e => e.marksId === selectedEvaluationTab)?.animatorName || ""}` : selectedMarks.isConsolidated && (selectedMarks.submissionCount || 1) > 1 ? "- Consolidated (Averaged)" : ""}
              </h4>
              {selectedMarks.isConsolidated && selectedEvaluationTab !== "consolidated" && selectedEvaluationTab !== "comparison" && (() => {
                const currentEval = selectedMarks.evaluations?.find(e => e.marksId === selectedEvaluationTab);
                if (!currentEval) return null;
                return (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 self-start sm:self-auto"
                    onClick={() => downloadIndividualPDF(selectedMarks, currentEval)}
                  >
                    <Download className="h-3 w-3" />
                    Download {currentEval.animatorName}'s PDF
                  </Button>
                );
              })()}
            </div>
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              {renderQuestionsTable()}
            </div>
            {!isComparing && selectedMarks.questions.length > 6 && (
              <div className="flex justify-center mt-2">
                <Button
                  size="sm"
                  onClick={() => setShowAllQuestions(!showAllQuestions)}
                >
                  {showAllQuestions ? (
                    <>
                      Show Less <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show {selectedMarks.questions.length - 6} More{" "}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Remarks
              </h4>
              {!isEditingRemark && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditRemarkText(selectedMarks.remarks || "");
                    setIsEditingRemark(true);
                  }}
                >
                  {selectedMarks.remarks ? "Edit Remark" : "Add Remark"}
                </Button>
              )}
            </div>

            {isEditingRemark ? (
              <div className="space-y-3">
                <Textarea
                  value={editRemarkText}
                  onChange={(e) => setEditRemarkText(e.target.value)}
                  placeholder="Enter your remarks here..."
                  className="min-h-[100px]"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingRemark(false)}
                    disabled={savingRemark}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveRemark}
                    disabled={savingRemark}
                  >
                    {savingRemark && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Remark
                  </Button>
                </div>
              </div>
            ) : selectedMarks.remarks ? (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                  "{selectedMarks.remarks}"
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                No remarks added yet. Click "Add Remark" to enter one.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant={selectedMarks.locked ? "outline" : "default"}
              onClick={() =>
                handleToggleLock(
                  selectedMarks.id!,
                  selectedMarks.locked,
                )
              }
              className={
                selectedMarks.locked
                  ? "border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            >
              {selectedMarks.locked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unfinalize
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Finalize
                </>
              )}
            </Button>
            {selectedMarks.isConsolidated && selectedMarks.evaluations && selectedMarks.evaluations.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Reports ({selectedMarks.evaluations.length + 1})
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
                    CONSOLIDATED REPORT
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => generatePDF(selectedMarks)}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Consolidated PDF</span>
                      <span className="text-[10px] text-muted-foreground">
                        Averaged marks of all {selectedMarks.submissionCount} animators
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
                    INDIVIDUAL EVALUATOR REPORTS
                  </DropdownMenuLabel>
                  {selectedMarks.evaluations.map((ev, idx) => (
                    <DropdownMenuItem
                      key={ev.marksId || idx}
                      onClick={() => downloadIndividualPDF(selectedMarks, ev)}
                      className="cursor-pointer gap-2 py-1.5"
                    >
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        <AvatarFallback className="text-[9px]">
                          {getInitials(ev.animatorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">{ev.animatorName}'s Report</span>
                        <span className="text-[10px] text-muted-foreground">
                          Score: {ev.totalMarks}/{selectedMarks.maxTotalMarks} ({ev.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => downloadAllPDFs(selectedMarks)}
                    className="cursor-pointer gap-2 font-semibold text-blue-600 hover:text-blue-700 py-2"
                  >
                    <Download className="h-4 w-4 flex-shrink-0" />
                    <span>Download All ({selectedMarks.evaluations.length + 1} PDFs)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => generatePDF(selectedMarks)}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 relative z-10" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading marks data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-4 md:px-0">
      {/* Simple Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Assessment Marks
          </h1>
          <p className="text-muted-foreground mt-1">
            View and analyze student assessment records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <Calendar className="h-3.5 w-3.5 mr-2 text-blue-600" />
            {selectedYear === "all" ? "All Years" : formatAcademicYear(selectedYear)}
          </Badge>
        </div>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Submissions
              </p>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold">
                {stats.totalSubmissions}
              </span>
              <p className="text-xs text-muted-foreground">
                Recorded assessments
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Finalized
              </p>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold">
                {stats.lockedSubmissions}
              </span>
              <Progress
                value={
                  stats.totalSubmissions > 0
                    ? (stats.lockedSubmissions / stats.totalSubmissions) * 100
                    : 0
                }
                className="h-1 mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                In Progress
              </p>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold">
                {stats.unlockedSubmissions}
              </span>
              <p className="text-xs text-muted-foreground">
                Pending finalization
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Average Score
              </p>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold">
                {stats.averagePercentage.toFixed(1)}%
              </span>
              <Progress value={stats.averagePercentage} className="h-1 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Controls */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by parish, school, or animator..."
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative min-w-[200px] w-full sm:w-auto">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-muted/50 border-0">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {formatAcademicYear(year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View grouping toggle: Consolidated vs All Submissions */}
              <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                <Button
                  type="button"
                  variant={viewGrouping === "consolidated" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs font-medium px-3"
                  onClick={() => setViewGrouping("consolidated")}
                >
                  Consolidated
                </Button>
                <Button
                  type="button"
                  variant={viewGrouping === "individual" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs font-medium px-3"
                  onClick={() => setViewGrouping("individual")}
                >
                  All Submissions
                </Button>
              </div>

              <Tabs
                value={viewMode}
                onValueChange={(v: string) =>
                  setViewMode(v as "table" | "cards")
                }
                className="hidden md:block"
              >
                <TabsList className="bg-muted/50">
                  <TabsTrigger
                    value="table"
                    className="data-[state=active]:bg-background"
                  >
                    <LayoutList className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="cards"
                    className="data-[state=active]:bg-background"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {marks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Records Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              No marks records match your search criteria. Try adjusting your
              filters.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* Table View */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Assessment Records</CardTitle>
                <CardDescription>
                  {marks.length} record{marks.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[80px] font-semibold text-center">
                      #
                    </TableHead>
                    <TableHead className="font-semibold">Parish</TableHead>
                    <TableHead className="font-semibold">
                      Sunday School
                    </TableHead>
                    <TableHead className="w-[90px] font-semibold text-center">
                      Category
                    </TableHead>
                    <TableHead className="font-semibold">Animator</TableHead>
                    <TableHead className="w-[100px] font-semibold">
                      Year
                    </TableHead>
                    <TableHead className="w-[140px] font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="w-[140px] font-semibold">
                      Submitted
                    </TableHead>
                    <TableHead className="w-[100px] text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marks.map((mark, index) => (
                    <TableRow
                      key={mark.id}
                      className="group cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewDetails(mark.id!)}
                    >
                      <TableCell className="text-center">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {mark.parish}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          {mark.sundaySchool}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {mark.category ? (
                          <Badge variant="outline" className={`font-mono text-xs font-semibold ${
                            mark.category === 'A' ? 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                            mark.category === 'B' ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                            'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300'
                          }`}>
                            Cat {mark.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mark.isConsolidated && (mark.submissionCount || 1) > 1 ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 font-semibold">
                                  {mark.submissionCount}A
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{mark.animatorName}</span>
                            </div>
                            <Badge variant="secondary" className="w-fit text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                              {mark.submissionCount} Animators Consolidated
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-muted">
                                {getInitials(mark.animatorName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{mark.animatorName}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {mark.year}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {mark.locked ? (
                          <Badge className="gap-1.5 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shadow-none border-green-200">
                            <Lock className="h-3 w-3" />
                            Finalized
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="gap-1.5 bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 shadow-none border-orange-200"
                          >
                            <Unlock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(mark.submittedAt)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TooltipProvider>
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${loadingMarksId === mark.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                                  onClick={() => handleViewDetails(mark.id!)}
                                  disabled={loadingMarksId === mark.id}
                                >
                                  {loadingMarksId === mark.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{loadingMarksId === mark.id ? "Loading..." : "View Details"}</TooltipContent>
                            </Tooltip>
                            {mark.pdfUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    asChild
                                  >
                                    <a
                                      href={mark.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download PDF</TooltipContent>
                              </Tooltip>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t py-3 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {marks.length} of {stats.totalSubmissions} total
              submissions
            </p>
          </CardFooter>
        </Card>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marks.map((mark) => (
            <Card
              key={mark.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => handleViewDetails(mark.id!)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{mark.parish}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 flex-wrap">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>{mark.sundaySchool}</span>
                      {mark.category && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${
                          mark.category === 'A' ? 'border-purple-300 bg-purple-50 text-purple-700' :
                          mark.category === 'B' ? 'border-blue-300 bg-blue-50 text-blue-700' :
                          'border-slate-300 bg-slate-50 text-slate-700'
                        }`}>
                          Cat {mark.category}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  {mark.locked ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Lock className="h-3 w-3 mr-1" />
                      Finalized
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {mark.isConsolidated && (mark.submissionCount || 1) > 1 ? `${mark.submissionCount}A` : getInitials(mark.animatorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mark.animatorName}</p>
                    {mark.isConsolidated && (mark.submissionCount || 1) > 1 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5 bg-blue-50 text-blue-700 border-blue-200">
                        {mark.submissionCount} Animators Consolidated
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(mark.submittedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3 flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  {mark.year}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-lg md:max-w-7xl max-h-[80vh] p-0 overflow-hidden rounded-lg">
          <ScrollArea className="max-h-[80vh]">
            <div className="p-3 sm:p-6 w-[85vw] md:w-auto mx-auto">
              {renderDialogContent()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
