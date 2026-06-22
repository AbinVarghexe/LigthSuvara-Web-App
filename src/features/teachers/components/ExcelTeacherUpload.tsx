import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Download } from "lucide-react";
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
import { TeacherService } from "../services/teacherService";
import { getUsers } from "@/features/users/services/userService";
import { getCurrentAcademicYear } from "@/lib/academic-years";

interface ExcelTeacherUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface ParsedTeacherRow {
  index: number;
  name: string;
  dob: string;
  phone: string;
  email: string;
  academicYear: string;
  qualification: string;
  classVal: string;
  schoolCode: string;
  schoolId?: string;
  schoolName?: string;
  errors: string[];
  isValid: boolean;
}

export function ExcelTeacherUpload({
  isOpen,
  onClose,
  onUploadComplete,
}: ExcelTeacherUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTeacherRow[]>([]);
  const [mandatoryFields, setMandatoryFields] = useState<Record<string, boolean>>({
    name: true,
    dob: true,
    parishId: true,
    phone: true,
    email: false,
    academicYear: true,
    qualification: true,
    classes: true,
  });

  // Load latest mandatory settings and schools list
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("teacher_mandatory_fields");
      if (saved) {
        setMandatoryFields(JSON.parse(saved));
      }
      
      const fetchSchools = async () => {
        try {
          const usersData = await getUsers();
          const schoolsList = usersData
            .filter((u) => u.role === "school")
            .map((u) => ({
              id: u.uid || u.id,
              name: (u as any).schoolname || (u as any).name || (u as any).displayName || u.email,
              code: String(u.code || u.parishCode || "").trim().toLowerCase(),
            }));
          setSchools(schoolsList);
        } catch (error) {
          console.error("Failed to fetch schools for import validation", error);
        }
      };
      fetchSchools();
    }
  }, [isOpen]);

  const normalizeClass = (val: any): string[] => {
    if (!val) return [];
    const cleanVal = String(val).trim();
    if (!cleanVal) return [];
    if (/^\d+$/.test(cleanVal)) {
      return [`Class ${cleanVal}`];
    }
    // E.g. "10" -> "Class 10"
    if (!cleanVal.toLowerCase().startsWith("class")) {
      return [`Class ${cleanVal}`];
    }
    // Capitalize C
    return [cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1)];
  };

  const cleanHeader = (h: string): string => {
    return String(h || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Name": "John Doe",
        "Date of Birth": "1990-05-15",
        "Phone": "9876543210",
        "Email": "john.doe@example.com",
        "Qualification": "B.Ed, MA",
        "Class": "Class 10",
        "Academic Year": getCurrentAcademicYear(),
        "Sunday School Code": "35",
        "Sunday School": "St Dominic Cathedral Kanjirapally",
        "Forane": "Kanjirapally"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto-fit column widths
    const cols = Object.keys(templateData[0]).map((key) => {
      const headerLen = key.length;
      const val = String(templateData[0][key as keyof typeof templateData[0]] || "");
      const valLen = val.length;
      return { wch: Math.max(headerLen, valLen) + 3 }; // add padding
    });
    worksheet["!cols"] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers Template");

    // Generate buffer and trigger download
    XLSX.writeFile(workbook, "teachers_import_template.xlsx");
    toast.success("Template downloaded successfully");
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

      // Identify column indices or names based on fuzzy matching
      const mappedRows: ParsedTeacherRow[] = rawRows.map((row, idx) => {
        let name = "";
        let dob = "";
        let phone = "";
        let email = "";
        let academicYear = "";
        let qualification = "";
        let classVal = "";
        let schoolCode = "";

        // Iterate over headers in the row to find match
        Object.keys(row).forEach((key) => {
          const val = String(row[key] || "").trim();
          const cleanKey = cleanHeader(key);

          if (cleanKey === "name" || cleanKey === "teachername" || cleanKey === "fullname") {
            name = val;
          } else if (cleanKey === "dob" || cleanKey === "dateofbirth" || cleanKey === "birthdate") {
            dob = val;
          } else if (cleanKey === "phone" || cleanKey === "phonenumber" || cleanKey === "mobile" || cleanKey === "contact") {
            phone = val;
          } else if (cleanKey === "email" || cleanKey === "emailaddress") {
            email = val;
          } else if (cleanKey === "academicyear" || cleanKey === "year") {
            academicYear = val;
          } else if (cleanKey === "qualification" || cleanKey === "qual") {
            qualification = val;
          } else if (cleanKey === "class" || cleanKey === "classes" || cleanKey === "standard" || cleanKey === "grade") {
            classVal = val;
          } else if (
            cleanKey === "schoolcode" ||
            cleanKey === "code" ||
            cleanKey === "parishcode" ||
            cleanKey === "sundayschoolcode"
          ) {
            schoolCode = val;
          }
        });

        // Set default academic year if missing
        if (!academicYear) {
          academicYear = getCurrentAcademicYear();
        }

        const errors: string[] = [];

        // Validate mandatory fields
        if (mandatoryFields.name && !name) {
          errors.push("Missing required field: Name");
        }
        if (mandatoryFields.dob && !dob) {
          errors.push("Missing required field: Date of Birth");
        }
        if (mandatoryFields.phone && !phone) {
          errors.push("Missing required field: Phone");
        }
        if (mandatoryFields.email && !email) {
          errors.push("Missing required field: Email");
        }
        if (mandatoryFields.academicYear && !academicYear) {
          errors.push("Missing required field: Academic Year");
        }
        if (mandatoryFields.qualification && !qualification) {
          errors.push("Missing required field: Qualification");
        }
        if (mandatoryFields.classes && !classVal) {
          errors.push("Missing required field: Class");
        }

        // Sunday School code lookup
        let schoolId = "";
        let schoolName = "";

        if (schoolCode) {
          const matchedSchool = schools.find(
            (s) => s.code === schoolCode.toLowerCase()
          );
          if (matchedSchool) {
            schoolId = matchedSchool.id;
            schoolName = matchedSchool.name;
          } else {
            errors.push(`Sunday School Code '${schoolCode}' not found`);
          }
        } else if (mandatoryFields.parishId) {
          errors.push("Missing required field: Sunday School Code");
        }

        return {
          index: idx + 2, // Excel rows start at 1, header is row 1
          name,
          dob,
          phone,
          email,
          academicYear,
          qualification,
          classVal,
          schoolCode,
          schoolId,
          schoolName,
          errors,
          isValid: errors.length === 0,
        };
      });

      setParsedData(mappedRows);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse file.");
    } finally {
      setParsing(false);
    }
  };

  const handleUploadSubmit = async () => {
    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid records to upload.");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of validRows) {
      try {
        // Date parsing helper
        let finalDob = row.dob;
        if (row.dob) {
          // Check if it's an Excel serial date number
          const numericDate = Number(row.dob);
          if (!isNaN(numericDate) && numericDate > 10000) {
            const dateObj = XLSX.SSF.parse_date_code(numericDate);
            finalDob = new Date(dateObj.y, dateObj.m - 1, dateObj.d).toISOString();
          } else {
            const parsedD = new Date(row.dob);
            if (!isNaN(parsedD.getTime())) {
              finalDob = parsedD.toISOString();
            }
          }
        }

        await TeacherService.addTeacher(
          {
            name: row.name,
            phone: row.phone,
            email: row.email,
            parishId: row.schoolId || "",
            classes: normalizeClass(row.classVal),
            academicYear: row.academicYear,
            dob: finalDob,
            qualification: row.qualification,
          },
          row.schoolId || "",
          row.schoolName || ""
        );
        successCount++;
      } catch (err: any) {
        console.error("Failed to add row ", row.index, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} teacher(s).`);
      onUploadComplete();
      onClose();
    }
    if (failCount > 0) {
      toast.error(`Failed to import ${failCount} teacher(s). See console logs.`);
    }
    setUploading(false);
  };

  const validCount = parsedData.filter((d) => d.isValid).length;
  const invalidCount = parsedData.filter((d) => !d.isValid).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Import Teachers from Excel/CSV</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet containing teacher records. The Sunday School is identified by its Code to automatically link them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          {/* File Picker */}
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
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing || uploading}
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
                onClick={downloadTemplate}
                disabled={parsing || uploading}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>

          {/* Validation Summary */}
          {parsedData.length > 0 && (
            <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Total Rows</span>
                <p className="text-xl font-bold">{parsedData.length}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Valid</span>
                <p className="text-xl font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> {validCount}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Errors</span>
                <p className="text-xl font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {invalidCount}
                </p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-sm border-collapse text-left">
                  <thead className="bg-muted text-muted-foreground uppercase font-semibold text-xs sticky top-0 border-b">
                    <tr>
                      <th className="px-4 py-2">Row</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">DOB</th>
                      <th className="px-4 py-2">Sunday School Code</th>
                      <th className="px-4 py-2">Classes</th>
                      <th className="px-4 py-2">Phone</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Qualification</th>
                      <th className="px-4 py-2">Academic Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.map((row) => (
                      <tr
                        key={row.index}
                        className={row.isValid ? "hover:bg-muted/10" : "bg-red-50/20 hover:bg-red-50/30"}
                      >
                        <td className="px-4 py-2 font-medium">{row.index}</td>
                        <td className="px-4 py-2">
                          {row.isValid ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-semibold">
                              Ready
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              {row.errors.map((err, i) => (
                                <Badge
                                  key={i}
                                  variant="destructive"
                                  className="text-[10px] py-0 px-1.5 font-medium whitespace-nowrap block w-max"
                                >
                                  {err}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 max-w-[150px] truncate">{row.name || "-"}</td>
                        <td className="px-4 py-2 truncate">{row.dob || "-"}</td>
                        <td className="px-4 py-2">
                          {row.schoolName ? (
                            <div>
                              <p className="font-semibold text-xs">{row.schoolName}</p>
                              <span className="text-[10px] text-muted-foreground font-mono">Code: {row.schoolCode}</span>
                            </div>
                          ) : (
                            <span className="text-red-500 font-medium">{row.schoolCode || "-"}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">{row.classVal || "-"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{row.phone || "-"}</td>
                        <td className="px-4 py-2 truncate max-w-[150px]">{row.email || "-"}</td>
                        <td className="px-4 py-2">{row.qualification || "-"}</td>
                        <td className="px-4 py-2 font-mono text-xs">{row.academicYear || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          {parsedData.length > 0 && (
            <Button
              onClick={handleUploadSubmit}
              disabled={validCount === 0 || uploading}
              className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${validCount} Valid Teacher(s)`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
