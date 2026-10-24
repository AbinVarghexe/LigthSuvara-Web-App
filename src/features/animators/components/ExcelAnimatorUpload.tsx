import { useState, useRef, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Filter,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getUsers, UserData } from "@/features/users/services/userService";
import { bulkCreateAnimators, BulkAnimatorRow, updateAnimator, AnimatorWithUser } from "../services/animatorService";
import { downloadSchoolCodesPdf } from "../services/schoolCodesPdfService";

interface ExcelAnimatorUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  existingAnimators?: AnimatorWithUser[];
}

interface ParsedAnimatorRow {
  index: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  schoolCode: string;
  schoolNameInput: string;
  matchedSchoolId?: string;
  matchedSchoolName?: string;
  action: "create" | "update";
  existingId?: string;
  errors: string[];
  isValid: boolean;
}

export function ExcelAnimatorUpload({
  isOpen,
  onClose,
  onUploadComplete,
  existingAnimators = [],
}: ExcelAnimatorUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schools, setSchools] = useState<{ id: string; name: string; code: string; forane?: string }[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedAnimatorRow[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "new" | "update" | "errors">("all");

  // Load schools list on open
  useEffect(() => {
    if (isOpen) {
      setParsedData([]);
      setFilterMode("all");
      const fetchSchools = async () => {
        try {
          const usersData: UserData[] = await getUsers();
          const schoolsList = usersData
            .filter((u) => u.role === "school")
            .map((u) => ({
              id: u.uid || u.id,
              name: (u as any).schoolname || (u as any).schoolName || (u as any).name || (u as any).displayName || u.email,
              code: String(u.code || u.parishCode || "").trim().toLowerCase(),
              forane: (u as any).forane || "",
            }));
          setSchools(schoolsList);
        } catch (error) {
          console.error("Failed to fetch schools for animator import validation", error);
        }
      };
      fetchSchools();
    }
  }, [isOpen]);

  const cleanHeader = (h: string): string => {
    return String(h || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const normalizeString = (str: string): string => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  };

  const downloadStandardTemplate = () => {
    const templateData = [
      {
        "Name": "Thomas Joseph",
        "Email": "thomas.joseph@example.com",
        "Password": "Suvara@123",
        "Sunday School Code": "35",
        "Sunday School Name": "St Dominic Cathedral",
        "Phone": "9876543210",
        "Address": "Kanjirapally",
      },
      {
        "Name": "Mary Mathew",
        "Email": "mary.mathew@example.com",
        "Password": "Suvara@123",
        "Sunday School Code": "42",
        "Sunday School Name": "St Mary Church",
        "Phone": "9876543211",
        "Address": "Pala",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto-fit column widths
    const cols = Object.keys(templateData[0]).map((key) => {
      const headerLen = key.length;
      const val = String(templateData[0][key as keyof typeof templateData[0]] || "");
      const valLen = val.length;
      return { wch: Math.max(headerLen, valLen) + 4 };
    });
    worksheet["!cols"] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Animators Template");
    XLSX.writeFile(workbook, "animators_bulk_upload_template.xlsx");
    toast.success("Standard template downloaded successfully");
  };

  const handleDownloadSchoolCodesPdf = async () => {
    if (schools.length === 0) {
      toast.error("No Sunday schools loaded to generate directory");
      return;
    }
    setGeneratingPdf(true);
    try {
      toast.info("Generating Sunday School Codes PDF...");
      await downloadSchoolCodesPdf(schools);
      toast.success("School codes PDF downloaded successfully");
    } catch (e) {
      console.error("Failed to generate school codes PDF:", e);
      toast.error("Failed to generate school codes PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadPrefilledTemplate = () => {
    const templateData = [
      {
        "Name": "Sample Animator Name",
        "Email": "animator@example.com",
        "Password": "Suvara@123",
        "Sunday School Code": schools.length > 0 ? (schools[0].code || "1") : "35",
        "Sunday School Name": schools.length > 0 ? schools[0].name : "St Dominic Cathedral",
        "Phone": "9876543210",
        "Address": "Kerala",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const cols = Object.keys(templateData[0]).map((key) => {
      const headerLen = key.length;
      const val = String(templateData[0][key as keyof typeof templateData[0]] || "");
      return { wch: Math.max(headerLen, val.length) + 4 };
    });
    worksheet["!cols"] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Animators Upload");

    // Add schools directory reference sheet
    if (schools.length > 0) {
      const schoolRefData = schools.map((s) => ({
        "Sunday School Code": s.code || "-",
        "Sunday School Name": s.name,
        "Forane": s.forane || "-",
      }));
      const refWorksheet = XLSX.utils.json_to_sheet(schoolRefData);
      refWorksheet["!cols"] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(workbook, refWorksheet, "Sunday Schools Reference");
    }

    XLSX.writeFile(workbook, "animators_prefilled_template.xlsx");
    toast.success("Prefilled template with Sunday Schools downloaded successfully");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParsedData([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rawRows.length === 0) {
        toast.error("The selected file contains no data rows.");
        setParsing(false);
        return;
      }

      const existingEmailsMap = new Map<string, AnimatorWithUser>();
      existingAnimators.forEach((a) => {
        if (a.email) {
          existingEmailsMap.set(a.email.toLowerCase().trim(), a);
        }
      });
      const seenEmailsInFile = new Set<string>();

      const mappedRows: ParsedAnimatorRow[] = rawRows.map((row, idx) => {
        let name = "";
        let email = "";
        let password = "";
        let phone = "";
        let address = "";
        let schoolCode = "";
        let schoolNameInput = "";

        Object.keys(row).forEach((key) => {
          const val = String(row[key] || "").trim();
          const cleanKey = cleanHeader(key);

          if (
            cleanKey === "name" ||
            cleanKey === "animatorname" ||
            cleanKey === "fullname" ||
            cleanKey === "animator"
          ) {
            name = val;
          } else if (cleanKey === "email" || cleanKey === "emailaddress") {
            email = val.toLowerCase();
          } else if (cleanKey === "password" || cleanKey === "pwd") {
            password = val;
          } else if (
            cleanKey === "phone" ||
            cleanKey === "phonenumber" ||
            cleanKey === "mobile" ||
            cleanKey === "contact"
          ) {
            phone = val;
          } else if (cleanKey === "address" || cleanKey === "place" || cleanKey === "location") {
            address = val;
          } else if (
            cleanKey === "schoolcode" ||
            cleanKey === "sundayschoolcode" ||
            cleanKey === "parishcode" ||
            cleanKey === "code"
          ) {
            schoolCode = val;
          } else if (
            cleanKey === "schoolname" ||
            cleanKey === "sundayschoolname" ||
            cleanKey === "school" ||
            cleanKey === "sundayschool" ||
            cleanKey === "parish" ||
            cleanKey === "parishname"
          ) {
            schoolNameInput = val;
          }
        });

        const errors: string[] = [];

        // 1. Name validation
        if (!name) {
          errors.push("Missing required field: Name");
        }

        // 2. Email validation
        if (!email) {
          errors.push("Missing required field: Email");
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errors.push("Invalid email format");
          } else if (seenEmailsInFile.has(email)) {
            errors.push("Duplicate email in this file");
          }
          seenEmailsInFile.add(email);
        }

        // 3. Password validation
        if (password && password.length < 6) {
          errors.push("Password must be at least 6 characters");
        }

        // 4. Sunday School / Parish matching
        let matchedSchoolId = "";
        let matchedSchoolName = "";

        if (schoolCode) {
          const cleanCode = schoolCode.toLowerCase();
          const match = schools.find((s) => s.code === cleanCode);
          if (match) {
            matchedSchoolId = match.id;
            matchedSchoolName = match.name;
          }
        }

        // If not matched by code, attempt matching by school name
        if (!matchedSchoolId && schoolNameInput) {
          const cleanInput = normalizeString(schoolNameInput);
          const match = schools.find((s) => {
            const cleanSName = normalizeString(s.name);
            return cleanSName === cleanInput || cleanSName.includes(cleanInput) || cleanInput.includes(cleanSName);
          });
          if (match) {
            matchedSchoolId = match.id;
            matchedSchoolName = match.name;
          }
        }

        if (!matchedSchoolId) {
          if (!schoolCode && !schoolNameInput) {
            errors.push("Missing Sunday School Code or Name");
          } else {
            errors.push(`Sunday School '${schoolCode || schoolNameInput}' not found`);
          }
        }

        // 5. Existing Animator & Duplicate Person Detection
        let action: "create" | "update" = "create";
        let existingId: string | undefined = undefined;

        const existingByEmail = email ? existingEmailsMap.get(email) : undefined;
        if (existingByEmail) {
          // Existing animator matched by email -> will update instead of creating duplicate
          action = "update";
          existingId = existingByEmail.id;
        } else if (name && matchedSchoolId) {
          // Check if an animator with the same name already exists in the same Sunday School under a different email
          const cleanName = normalizeString(name);
          const duplicatePerson = existingAnimators.find((a) => {
            if (!a.email) return false;
            if (a.email.toLowerCase().trim() === email) return false;
            const sameName = normalizeString(a.name) === cleanName;
            const sameSchool =
              (a.parishId && a.parishId === matchedSchoolId) ||
              (a.parishName && matchedSchoolName && normalizeString(a.parishName) === normalizeString(matchedSchoolName));
            return sameName && sameSchool;
          });

          if (duplicatePerson) {
            errors.push(
              `Duplicate person: An animator named '${name}' already exists at this Sunday School with email '${duplicatePerson.email}'. Please use their existing email to update them.`
            );
          }
        }

        return {
          index: idx + 2,
          name,
          email,
          password: password || "Suvara@123",
          phone,
          address,
          schoolCode,
          schoolNameInput,
          matchedSchoolId,
          matchedSchoolName,
          action,
          existingId,
          errors,
          isValid: errors.length === 0,
        };
      });

      setParsedData(mappedRows);
    } catch (err: any) {
      console.error("Error reading file:", err);
      toast.error(err.message || "Failed to parse the file.");
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const validRows = useMemo(() => parsedData.filter((r) => r.isValid), [parsedData]);
  const invalidRows = useMemo(() => parsedData.filter((r) => !r.isValid), [parsedData]);
  const rowsToCreate = useMemo(() => validRows.filter((r) => r.action === "create"), [validRows]);
  const rowsToUpdate = useMemo(() => validRows.filter((r) => r.action === "update"), [validRows]);

  const displayedRows = useMemo(() => {
    if (filterMode === "new") return rowsToCreate;
    if (filterMode === "update") return rowsToUpdate;
    if (filterMode === "errors") return invalidRows;
    return parsedData;
  }, [filterMode, parsedData, rowsToCreate, rowsToUpdate, invalidRows]);

  const handleUploadSubmit = async () => {
    if (validRows.length === 0) {
      toast.error("No valid animator records to import.");
      return;
    }

    setUploading(true);

    try {
      let createdCount = 0;
      let updatedCount = 0;

      // 1. Process updates for existing animators
      if (rowsToUpdate.length > 0) {
        for (const r of rowsToUpdate) {
          if (r.existingId) {
            const updates: any = {};
            if (r.name) updates.name = r.name;
            if (r.phone) updates.phoneNumber = r.phone;
            if (r.address) updates.address = r.address;
            if (r.matchedSchoolId) updates.parishId = r.matchedSchoolId;
            if (r.matchedSchoolName) updates.parishName = r.matchedSchoolName;
            await updateAnimator(r.existingId, updates);
            updatedCount++;
          }
        }
      }

      // 2. Process creation for new animators
      if (rowsToCreate.length > 0) {
        const animatorsPayload: BulkAnimatorRow[] = rowsToCreate.map((r) => ({
          name: r.name,
          email: r.email,
          password: r.password || "Suvara@123",
          phoneNumber: r.phone,
          address: r.address,
          parishId: r.matchedSchoolId!,
          parishName: r.matchedSchoolName!,
        }));

        const result = await bulkCreateAnimators(animatorsPayload);
        createdCount = result.created;

        if (result.failed > 0) {
          const errorDetails = result.errors.map((e) => `${e.email}: ${e.error}`).join("\n");
          toast.error(`Failed to create ${result.failed} animator(s):\n${errorDetails}`);
        }
      }

      const summaryMsg: string[] = [];
      if (createdCount > 0) summaryMsg.push(`${createdCount} new animator(s) created`);
      if (updatedCount > 0) summaryMsg.push(`${updatedCount} existing animator(s) updated`);

      if (summaryMsg.length > 0) {
        toast.success(summaryMsg.join(", ") + "!");
        onUploadComplete();
        onClose();
      } else if (rowsToCreate.length > 0 && createdCount === 0) {
        // Handled by failure toast
      } else {
        onUploadComplete();
        onClose();
      }
    } catch (error: any) {
      console.error("Bulk animator processing error:", error);
      toast.error(error.message || "Failed to bulk process animators");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !uploading && !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            Bulk Upload Animators
          </DialogTitle>
          <DialogDescription>
            Import multiple animator accounts from an Excel or CSV file. Existing Sunday schools will be automatically linked.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto my-3 space-y-4 pr-1">
          {/* File Picker & Template Downloads */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-semibold mb-1">Choose an Excel or CSV file</p>
            <p className="text-xs text-muted-foreground mb-4">Supported formats: .xlsx, .xls, .csv</p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing || uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {parsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing file...
                  </>
                ) : (
                  "Select File"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={downloadStandardTemplate}
                disabled={parsing || uploading}
              >
                <Download className="mr-2 h-4 w-4" />
                Standard Template
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadSchoolCodesPdf}
                disabled={parsing || uploading || generatingPdf}
                className="text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-950/40"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Download School Codes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Validation Summary & Filter Controls */}
          {parsedData.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg border">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase">Total Rows</span>
                  <p className="text-lg font-bold">{parsedData.length}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase">New to Create</span>
                  <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {rowsToCreate.length}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase">To Update</span>
                  <p className="text-lg font-bold text-blue-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {rowsToUpdate.length}
                  </p>
                </div>
                {invalidRows.length > 0 && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase">Errors / Duplicates</span>
                    <p className="text-lg font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> {invalidRows.length}
                    </p>
                  </div>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs">
                <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-0.5" />
                <Button
                  variant={filterMode === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setFilterMode("all")}
                >
                  All ({parsedData.length})
                </Button>
                {rowsToCreate.length > 0 && (
                  <Button
                    variant={filterMode === "new" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs px-2.5 text-green-700 dark:text-green-400"
                    onClick={() => setFilterMode("new")}
                  >
                    New ({rowsToCreate.length})
                  </Button>
                )}
                {rowsToUpdate.length > 0 && (
                  <Button
                    variant={filterMode === "update" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs px-2.5 text-blue-700 dark:text-blue-400"
                    onClick={() => setFilterMode("update")}
                  >
                    Updates ({rowsToUpdate.length})
                  </Button>
                )}
                {invalidRows.length > 0 && (
                  <Button
                    variant={filterMode === "errors" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs px-2.5 text-red-700 dark:text-red-400"
                    onClick={() => setFilterMode("errors")}
                  >
                    Errors ({invalidRows.length})
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[320px]">
                <table className="w-full text-sm border-collapse text-left">
                  <thead className="bg-muted text-muted-foreground uppercase font-semibold text-[11px] sticky top-0 border-b z-10">
                    <tr>
                      <th className="px-3 py-2 w-12">#</th>
                      <th className="px-3 py-2 w-36">Status</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Default Password</th>
                      <th className="px-3 py-2">Sunday School</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          No rows match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr
                          key={row.index}
                          className={
                            row.isValid
                              ? row.action === "update"
                                ? "bg-blue-50/15 hover:bg-blue-50/25"
                                : "hover:bg-muted/10"
                              : "bg-red-50/20 hover:bg-red-50/30"
                          }
                        >
                          <td className="px-3 py-2 font-medium">{row.index}</td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              row.action === "update" ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-semibold text-[10px] py-0.5 whitespace-nowrap">
                                  Update Existing
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-semibold text-[10px] py-0.5 whitespace-nowrap">
                                  New Animator
                                </Badge>
                              )
                            ) : (
                              <div className="space-y-1">
                                {row.errors.map((err, i) => (
                                  <Badge
                                    key={i}
                                    variant="destructive"
                                    className="text-[10px] py-0.5 px-1.5 font-medium whitespace-normal text-left max-w-xs block"
                                  >
                                    {err}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium max-w-[140px] truncate">{row.name || "-"}</td>
                          <td className="px-3 py-2 font-mono text-[11px] max-w-[160px] truncate">{row.email || "-"}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                            {row.action === "update" ? (
                              <span className="italic text-muted-foreground">Unchanged</span>
                            ) : (
                              row.password ? "••••••" : "Suvara@123"
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {row.matchedSchoolName ? (
                              <div>
                                <p className="font-semibold text-xs text-foreground">{row.matchedSchoolName}</p>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Code: {row.schoolCode || "matched by name"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-red-500 font-medium">
                                {row.schoolCode || row.schoolNameInput || "-"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono">{row.phone || "-"}</td>
                          <td className="px-3 py-2 max-w-[120px] truncate">{row.address || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          {parsedData.length > 0 && (
            <Button
              onClick={handleUploadSubmit}
              disabled={validRows.length === 0 || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold ml-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Animators...
                </>
              ) : (
                `Process ${validRows.length} Animator(s)${
                  rowsToUpdate.length > 0 ? ` (${rowsToCreate.length} new, ${rowsToUpdate.length} updates)` : ""
                }`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
