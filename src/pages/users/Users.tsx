import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  MoreVertical,
  Shield,
  School,
  Loader2,
  Upload,
  Download,
  FileSpreadsheet,
  Sparkles,
  UserPlus,
  Trash2,
  Church,
  Plus,
  Users as UsersIcon,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  getUsers,
  UserData,
  bulkCreateUsers,
  deleteUser,
} from "../../features/users/services/userService";
import { Card, CardContent } from "../../components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ParishService } from "../../features/parishes/services/parishService";
import * as XLSX from "xlsx";

interface NewUser extends Partial<UserData> {
  password?: string;
  parishCode?: string;
}

interface ForaneParish {
  id: string;
  name: string;
  saint?: string;
  place?: string;
  code?: string;
}

interface ForaneData {
  id: string;
  name: string;
  parishes: ForaneParish[];
}

export function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam === "parish" ? "parish" : "school";
  const [activeTab, setActiveTab] = useState<"school" | "parish">(initialTab);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdminDeleting, setIsAdminDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedForaneFilter, setSelectedForaneFilter] = useState<string>("all");
  const [selectedParishFilter, setSelectedParishFilter] = useState<string>("all");
  const [newUsers, setNewUsers] = useState<NewUser[]>([{
    email: "",
    fullName: "",
    name: "",
    role: "school",
    schoolname: "",
    schoolName: "",
    phoneNumber: "",
    password: "",
    forane: "",
    parish: "",
    address: "",
    parishId: "",
    parishName: "",
    schoolId: "",
  }]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAllUsersMode, setShowAllUsersMode] = useState(false);
  const [allUsersRoleFilter, setAllUsersRoleFilter] = useState<string>("all");

  // Foranes + Parishes from Firestore
  const [foranesData, setForanesData] = useState<ForaneData[]>([]);
  const [parishesPerForane, setParishesPerForane] = useState<Record<string, ForaneParish[]>>({});

  const normalizeSaintName = (saint: string): string => {
    let s = (saint || "").trim();
    if (/^christ(u)?\s*raj$/i.test(s) || /^christ\s*raj$/i.test(s)) {
      return "Christu Raj";
    }
    return toTitleCase(s);
  };

  const getParishDetails = (docData: any) => {
    let saintName = "";
    let parishPlace = "";

    if (docData.place) {
      saintName = docData.name || "";
      parishPlace = docData.place || "";
    } else if (docData.saint) {
      saintName = docData.saint || "";
      parishPlace = docData.name || "";
    } else {
      saintName = docData.name || "";
      parishPlace = "";
    }

    return { saintName, parishPlace };
  };

  const formatSchoolName = (churchName: string, placeName: string): string => {
    const normalizedChurch = normalizeSaintName(churchName);
    const cleanChurch = normalizedChurch
      .replace(/\./g, "")
      .replace(/'s/gi, "")
      .trim();
    const cleanPlace = (placeName || "").trim().replace(/\s+/g, " ");
    return `${cleanChurch} ${cleanPlace}`.trim();
  };

  const handleCodeChange = async (val: string, index: number) => {
    const updated = [...newUsers];
    updated[index] = { ...updated[index], parishCode: val };
    setNewUsers(updated);

    if (val.trim().length >= 2) {
      try {
        const foundParish = await ParishService.getParishByCode(val.trim());
        if (foundParish && foundParish.foraneId) {
          const foraneDoc = foranesData.find(f => f.id === foundParish.foraneId);
          if (foraneDoc) {
            // Fetch parishes list for this forane to populate the dropdown
            await fetchParishesForForane(foraneDoc.id);

            const { saintName, parishPlace } = getParishDetails(foundParish);

            const schoolNameCombined = formatSchoolName(saintName, parishPlace);
            const updatedWithAutofill = [...newUsers];

            const finalParishName = getFormattedParishUserName(saintName, parishPlace);

            updatedWithAutofill[index] = {
              ...updatedWithAutofill[index],
              forane: foraneDoc.name,
              parish: parishPlace || saintName,
              parishCode: val.trim(),
              schoolname: schoolNameCombined,
              schoolName: schoolNameCombined,
              ...(updatedWithAutofill[index].role === "parish" ? {
                name: finalParishName,
                fullName: finalParishName,
              } : {}),
            };
            setNewUsers(updatedWithAutofill);
            toast.success(`Autofilled: ${foundParish.name} (${foraneDoc.name})`);
          }
        }
      } catch (e) {
        console.error("Lookup failed:", e);
      }
    }
  };
  const [loadingParishes, setLoadingParishes] = useState<Record<string, boolean>>({});

  const fetchForanes = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'foranes'), orderBy('name')));
      const foranes: ForaneData[] = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name as string,
        parishes: [],
      }));
      setForanesData(foranes);
    } catch (e) {
      console.error('Failed to load foranes', e);
    }
  }, []);

  const fetchParishesForForane = useCallback(async (foraneId: string) => {
    if (parishesPerForane[foraneId] || loadingParishes[foraneId]) return;
    setLoadingParishes(prev => ({ ...prev, [foraneId]: true }));
    try {
      const snap = await getDocs(
        query(collection(db, 'foranes', foraneId, 'parishes'), orderBy('name'))
      );
      const parishes: ForaneParish[] = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name as string,
        saint: d.data().saint as string | undefined,
        place: d.data().place as string | undefined,
        code: d.data().code as string | undefined,
      }));
      setParishesPerForane(prev => ({ ...prev, [foraneId]: parishes }));
    } catch (e) {
      console.error('Failed to load parishes for forane', foraneId, e);
    } finally {
      setLoadingParishes(prev => ({ ...prev, [foraneId]: false }));
    }
  }, [parishesPerForane, loadingParishes]);

  // Standardize names: convert ALL-CAPS to Title Case (e.g. "ST.GEORGE CHURCH" → "St.George Church")
  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
      .toLowerCase()
      .replace(/(^|[\s.])([a-z])/g, (_, sep, char) => sep + char.toUpperCase());
  };

  const getAutofilledName = (saintOrSchoolName: string, parishName: string): string => {
    let baseName = saintOrSchoolName || "";
    const parish = parishName || "";

    const suffixesToStrip = ["cathedral", "church", "school"];
    let words = baseName.trim().split(/\s+/);
    if (words.length > 1) {
      const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
      if (suffixesToStrip.includes(lastWord)) {
        words.pop();
        baseName = words.join(" ");
      }
    }
    baseName = baseName.trim();

    if (baseName && parish) {
      const formattedBase = toTitleCase(baseName);
      const formattedParish = toTitleCase(parish);

      const cleanBase = formattedBase.toLowerCase();
      const cleanParish = formattedParish.toLowerCase();

      if (cleanBase === cleanParish) {
        return `${formattedBase} Church`;
      } else if (cleanBase.endsWith(cleanParish)) {
        // e.g. "St Joseph Koovapally" -> "St Joseph Church Koovapally"
        const prefix = formattedBase.slice(0, cleanBase.length - cleanParish.length).trim();
        return `${prefix} Church ${formattedParish}`;
      } else {
        return `${formattedBase} Church ${formattedParish}`;
      }
    } else if (baseName) {
      return `${toTitleCase(baseName)} Church`;
    } else if (parish) {
      return `${toTitleCase(parish)} Church`;
    }
    return "";
  };

  const getFormattedParishUserName = (saintName: string, placeName: string, foraneName?: string): string => {
    let saint = (saintName || "").trim();
    let place = (placeName || "").trim();
    const forane = (foraneName || "").trim();

    saint = saint.replace(/\./g, " ").replace(/\s+/g, " ").trim();

    const isForane = 
      /forane/i.test(saint) || 
      /forane/i.test(place) || 
      (forane && (
        place.toLowerCase() === forane.toLowerCase() || 
        saint.toLowerCase().includes(forane.toLowerCase())
      ));

    let cleanSaint = toTitleCase(saint)
      .replace(/forane\s+church/gi, "")
      .replace(/forane/gi, "")
      .replace(/church/gi, "")
      .replace(/cathedral/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const formattedPlace = toTitleCase(place);
    const suffix = isForane ? "Forane Church" : "Church";

    if (cleanSaint && formattedPlace) {
      if (cleanSaint.toLowerCase() === formattedPlace.toLowerCase()) {
        return `${cleanSaint} ${suffix}`;
      }
      return `${cleanSaint} ${suffix} ${formattedPlace}`;
    } else if (cleanSaint) {
      return `${cleanSaint} ${suffix}`;
    } else if (formattedPlace) {
      return `${formattedPlace} ${suffix}`;
    }
    return "";
  };

  const handleCreateUser = async () => {
    const invalidUsers = newUsers.filter(u => !u.email || !u.role || !u.password);
    if (invalidUsers.length > 0) {
      toast.error("Email, role, and password are required for all users");
      return;
    }
    setIsCreating(true);
    try {
      const result = await bulkCreateUsers(newUsers);
      if (result.success && result.created > 0) {
        toast.success(`Successfully created ${result.created} user(s)`);
        setIsCreateDialogOpen(false);
        setNewUsers([{
          email: "",
          fullName: "",
          name: "",
          role: "school",
          schoolname: "",
          phoneNumber: "",
          password: "",
          forane: "",
          parish: "",
          address: "",
          parishId: "",
          parishName: "",
          schoolId: "",
        }]);
        await resolveUnlinkedParishes();
        fetchUsers();
      } else {
        const errMsg = result.errors?.[0]?.error || "Failed to create users";
        toast.error(errMsg);
      }
    } catch (error: any) {
      console.error("Error creating users:", error);
      toast.error(error.message || "Failed to create users");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsAdminDeleting(true);
    try {
      const result = await deleteUser(userToDelete.id || userToDelete.uid);
      if (result.success) {
        toast.success("User deleted successfully");
        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error("Failed to delete user account");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsAdminDeleting(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Deleting ${selectedUserIds.length} user accounts...`);

    for (const userId of selectedUserIds) {
      try {
        const result = await deleteUser(userId);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Failed to delete user ${userId}:`, err);
        failCount++;
      }
    }

    toast.dismiss(toastId);
    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} user(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} user(s)`);
    }

    setIsBulkDeleteConfirmOpen(false);
    setIsSelectMode(false);
    setSelectedUserIds([]);
    fetchUsers();
    setIsBulkDeleting(false);
  };

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
      setSelectedUserIds([]);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchForanes();
  }, []);

  useEffect(() => {
    if (selectedForaneFilter && selectedForaneFilter !== "all") {
      const foraneDoc = foranesData.find(
        f => f.name.toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim()
      );
      if (foraneDoc && !parishesPerForane[foraneDoc.id]) {
        fetchParishesForForane(foraneDoc.id);
      }
    }
  }, [selectedForaneFilter, foranesData, parishesPerForane, fetchParishesForForane]);

  const getAvailableParishes = (): string[] => {
    if (selectedForaneFilter !== "all") {
      const foraneDoc = foranesData.find(
        f => f.name.toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim()
      );
      if (foraneDoc && parishesPerForane[foraneDoc.id]) {
        return parishesPerForane[foraneDoc.id]
          .map(p => p.place || p.saint || p.name)
          .filter((p): p is string => !!p);
      }
      const filtered = users.filter(u => (u.forane || "").toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim());
      return Array.from(new Set(filtered.map(u => u.parish)))
        .filter((p): p is string => !!p)
        .sort();
    } else {
      return Array.from(new Set(users.map(u => u.parish)))
        .filter((p): p is string => !!p)
        .sort();
    }
  };

  const normalizeName = (name: string): string => {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/pp/g, 'p')
      .replace(/tt/g, 't')
      .replace(/th/g, 't')
      .replace(/nn/g, 'n')
      .replace(/mm/g, 'm')
      .replace(/ll/g, 'l')
      .replace(/y$/g, 'i')
      .replace(/y/g, 'i')
      .replace(/u$/g, '')
      .replace(/o$/g, 'a')
      .replace(/om$/g, 'am')
      .replace(/c/g, 'k')
      .replace(/church/gi, '')
      .replace(/cathedral/gi, '')
      .replace(/school/gi, '')
      .replace(/st/gi, '')
      .replace(/saint/gi, '')
      .trim();
  };

  const isDuplicateParishName = (name1: string, name2: string): boolean => {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    if (!n1 || !n2) return false;
    return n1.includes(n2) || n2.includes(n1);
  };

  const filteredUsers = users
    .filter((user) => {
      if (user.role !== activeTab) return false;
      
      // Forane filter check
      if (selectedForaneFilter !== "all") {
        const uForane = (user.forane || "").toLowerCase().trim();
        const fFilter = selectedForaneFilter.toLowerCase().trim();
        if (uForane !== fFilter) {
          return false;
        }
      }
      
      // Parish filter check
      if (selectedParishFilter !== "all") {
        let isMatch = false;
        
        // 1. Try matching by code
        const foraneDoc = foranesData.find(
          f => f.name.toLowerCase().trim() === selectedForaneFilter.toLowerCase().trim()
        );
        if (foraneDoc && parishesPerForane[foraneDoc.id]) {
          const selectedParishDoc = parishesPerForane[foraneDoc.id].find(
            p => p.name === selectedParishFilter || p.place === selectedParishFilter || p.saint === selectedParishFilter
          );
          if (selectedParishDoc && selectedParishDoc.code) {
            const uCode = String(user.parishCode || user.code || "").trim();
            const sCode = String(selectedParishDoc.code).trim();
            if (uCode && uCode === sCode) {
              isMatch = true;
            }
          }
        }
        
        // 2. Fallback to name similarity match
        if (!isMatch) {
          const uParish = user.parish || user.parishName || user.name || "";
          isMatch = isDuplicateParishName(uParish, selectedParishFilter);
        }
        
        if (!isMatch) {
          return false;
        }
      }

      const name = user.schoolName || user.schoolname || user.fullName || user.name || "";
      return (
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const nameA = (a.schoolName || a.schoolname || a.fullName || a.name || "").toLowerCase();
      const nameB = (b.schoolName || b.schoolname || b.fullName || b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const schoolCount = users.filter((u) => u.role === "school").length;
  const parishCount = users.filter((u) => u.role === "parish").length;

  const allUsersFilteredList = users
    .filter((user) => {
      if (allUsersRoleFilter !== "all" && user.role !== allUsersRoleFilter) return false;
      const name = user.schoolName || user.schoolname || user.fullName || user.name || "";
      return (
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const nameA = (a.schoolName || a.schoolname || a.fullName || a.name || "").toLowerCase();
      const nameB = (b.schoolName || b.schoolname || b.fullName || b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const downloadTemplate = () => {
    const headers = [
      "email",
      "techsupporter",
      "role",
      "name",
      "phoneNumber",
      "password",
      "forane",
      "parish",
      "parishCode",
    ];
    const sample = [
      ["stdominicsschool@test.com", "Joseph Jose", "school", "St Dominics Kanjirapally", "1111111111", "Password123", "Kanjirapally", "Kanjirapally", "35"],
    ];
    const sheetData = [headers, ...sample];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Autofit columns by finding max length of contents
    const colWidths = headers.map((_, colIndex) => {
      let maxLen = 10; // minimum width
      sheetData.forEach(row => {
        const cellValue = row[colIndex];
        if (cellValue !== null && cellValue !== undefined) {
          const len = String(cellValue).length;
          if (len > maxLen) {
            maxLen = len;
          }
        }
      });
      return { wch: maxLen + 3 };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "school_user_upload_template.xlsx");
  };

  const downloadPrefilledTemplate = async () => {
    const toastId = toast.loading("Fetching database records to generate template...");
    try {
      const headers = [
        "email",
        "techsupporter",
        "role",
        "name",
        "phoneNumber",
        "password",
        "forane",
        "parish",
        "parishCode",
      ];
      
      const sheetData: any[][] = [headers];

      for (const forane of foranesData) {
        const parishesRef = collection(db, "foranes", forane.id, "parishes");
        const snap = await getDocs(parishesRef);
        
        for (const d of snap.docs) {
          const parishData = d.data();
          const code = parishData.code || "";
          if (!code) continue;

          const { saintName, parishPlace } = getParishDetails({ id: d.id, ...parishData });
          const schoolNameCombined = formatSchoolName(saintName, parishPlace);

          // 1. School Row
          sheetData.push([
            "", // email
            "", // techsupporter
            "school",
            schoolNameCombined,
            "", // phoneNumber
            "", // password
            forane.name,
            parishPlace || saintName,
            code
          ]);

          // 2. Parish Row
          sheetData.push([
            "", // email
            "DO NOT FILL", // techsupporter
            "parish",
            "DO NOT FILL", // name
            "DO NOT FILL", // phoneNumber
            "", // password
            forane.name,
            parishPlace || saintName,
            code
          ]);
        }
      }

      if (sheetData.length <= 1) {
        toast.dismiss(toastId);
        toast.warning("No parishes found in database to prefill");
        return;
      }

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Autofit columns by finding max length of contents
      const colWidths = headers.map((_, colIndex) => {
        let maxLen = 10; // minimum width
        sheetData.forEach(row => {
          const cellValue = row[colIndex];
          if (cellValue !== null && cellValue !== undefined) {
            const len = String(cellValue).length;
            if (len > maxLen) {
              maxLen = len;
            }
          }
        });
        return { wch: maxLen + 3 };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, "prefilled_school_parish_users.xlsx");

      toast.dismiss(toastId);
      toast.success(`Generated prefilled template containing ${sheetData.length - 1} rows`);
    } catch (e) {
      console.error("Failed to generate prefilled template:", e);
      toast.dismiss(toastId);
      toast.error("Failed to generate prefilled template");
    }
  };

  const executeBulkCreation = async (newUsersList: Partial<UserData>[]) => {
    const chunkSize = 50;
    let totalCreated = 0;
    let totalFailed = 0;
    const allErrors: any[] = [];
    
    const toastId = toast.loading(`Starting bulk user creation...`);
    
    for (let i = 0; i < newUsersList.length; i += chunkSize) {
      const chunk = newUsersList.slice(i, i + chunkSize);
      toast.loading(`Creating users: ${i + 1} to ${Math.min(i + chunkSize, newUsersList.length)} of ${newUsersList.length}...`, { id: toastId });
      
      try {
        const result = await bulkCreateUsers(chunk);
        totalCreated += result.created;
        totalFailed += result.failed;
        if (result.errors) {
          allErrors.push(...result.errors);
        }
      } catch (err: any) {
        console.error(`Batch starting at ${i} failed:`, err);
        totalFailed += chunk.length;
        chunk.forEach(u => {
          allErrors.push({
            email: u.email || 'unknown',
            error: err.message || 'Batch request failed/timed out'
          });
        });
      }
    }

    toast.dismiss(toastId);
    
    if (totalFailed === 0) {
      toast.success(`Successfully created all ${totalCreated} users!`);
    } else if (totalCreated > 0) {
      toast.warning(`Created ${totalCreated} users, ${totalFailed} failed. See console for details.`);
      console.log("Bulk creation errors:", allErrors);
    } else {
      toast.error(`Failed to create users. All ${totalFailed} attempts failed.`);
      console.log("Bulk creation errors:", allErrors);
    }

    // Post-sync user codes client-side to guarantee they are written in Firestore (bypassing old Cloud Function caches)
    try {
      const usersData = await getUsers();
      const updatePromises = newUsersList.map(async (u) => {
        if (!u.email) return;
        const createdUser = usersData.find(ud => ud.email?.toLowerCase().trim() === u.email?.toLowerCase().trim());
        if (createdUser && createdUser.id) {
          const userDocRef = doc(db, "users", createdUser.id);
          const updates: any = {};
          const targetCode = u.parishCode || u.code || "";
          if (targetCode) {
            if (createdUser.parishCode !== targetCode) updates.parishCode = targetCode;
            if (createdUser.code !== targetCode) updates.code = targetCode;
          }
          if (Object.keys(updates).length > 0) {
            await updateDoc(userDocRef, updates);
          }
        }
      });
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Failed to post-sync user codes:", err);
    }

    // Auto-link any newly created parishes that were created in the same batch as their schools
    await resolveUnlinkedParishes();

    setIsDialogOpen(false);
    fetchUsers();
  };

  const resolveUnlinkedParishes = async () => {
    try {
      const usersData = await getUsers();
      const schools = usersData.filter(u => u.role === "school");
      const unlinkedParishes = usersData.filter(u => u.role === "parish" && !u.schoolId);
      
      if (unlinkedParishes.length === 0) return;
      
      console.log(`Found ${unlinkedParishes.length} unlinked parish users. Resolving links...`);
      
      const updatePromises = unlinkedParishes.map(async (parish) => {
        // 1. Try matching by code
        let matchingSchool = null;
        const parishCode = parish.parishCode || (parish as any).code;
        if (parishCode) {
          const code = String(parishCode).trim();
          matchingSchool = schools.find(s => {
            const sCode = s.parishCode || (s as any).code;
            return sCode && String(sCode).trim() === code;
          });
        }
        
        // 2. Fallback to matching by clean schoolName and forane
        if (!matchingSchool) {
          const cleanString = (val: string) => (val || "").toLowerCase().replace(/[^a-z0-9]/gi, "").trim();
          const pSchoolName = cleanString(parish.schoolName || parish.schoolname || "");
          const pForane = cleanString(parish.forane || "");
          
          matchingSchool = schools.find(s => {
            const sSchoolName = cleanString(s.schoolName || s.schoolname || "");
            const sForane = cleanString(s.forane || "");
            return pSchoolName === sSchoolName && pForane === sForane;
          });
        }
        
        if (matchingSchool) {
          const parishDocRef = doc(db, "users", parish.id || parish.uid);
          await updateDoc(parishDocRef, {
            schoolId: matchingSchool.uid || matchingSchool.id,
            schoolName: matchingSchool.schoolName || matchingSchool.schoolname || "",
            schoolname: matchingSchool.schoolName || matchingSchool.schoolname || ""
          });
          console.log(`Auto-linked parish ${parish.email} to school ${matchingSchool.email}`);
        }
      });
      
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Failed to resolve unlinked parishes:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Pre-cache all parishes across all foranes to avoid repeated queries inside loops
    const parishCacheMap = new Map<string, any>();
    try {
      const foranesSnap = await getDocs(collection(db, "foranes"));
      const fetchAllParishesPromises = foranesSnap.docs.map(async (foraneDoc) => {
        const parishesRef = collection(db, "foranes", foraneDoc.id, "parishes");
        const snap = await getDocs(parishesRef);
        snap.docs.forEach((d) => {
          const data = d.data();
          const code = (data.code || "").trim();
          if (code) {
            parishCacheMap.set(code, {
              id: d.id,
              ...data,
              foraneId: foraneDoc.id
            });
          }
        });
      });
      await Promise.all(fetchAllParishesPromises);
    } catch (err) {
      console.error("Failed to pre-fetch parish cache:", err);
      toast.error("Failed to connect to database. Please check your network.");
      setIsUploading(false);
      return;
    }

    const reader = new FileReader();

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      reader.readAsArrayBuffer(file);
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length < 2) {
            toast.warning("Excel file is empty or only contains headers");
            setIsUploading(false);
            return;
          }

          const headers = jsonData[0].map(h => String(h || "").trim());
          const newUsers: Partial<UserData>[] = [];

          for (let i = 1; i < jsonData.length; i++) {
            const values = jsonData[i];
            if (!values || values.length === 0) continue;
            
            const user: any = {};
            headers.forEach((header, index) => {
              let val = String(values[index] ?? "").trim();
              if (val) {
                const hLower = header.toLowerCase();
                if (hLower === 'email') {
                  user.email = val;
                } else if (hLower === 'password') {
                  user.password = val;
                } else if (hLower === 'phonenumber') {
                  user.phoneNumber = val;
                } else if (hLower === 'role') {
                  user.role = val;
                } else if (hLower === 'parishcode' || hLower === 'code') {
                  user.parishCode = val;
                  user.code = val;
                } else if (hLower === 'techsupporter') {
                  user.fullName = val;
                }
              }
            });

            if (user.email) {
              if (!user.role) user.role = "school";

              if (user.role === "parish") {
                user.phoneNumber = "";
              }

              if (!user.password) {
                console.warn(`Skipping user ${user.email}: Missing password`);
                continue;
              }

              if (user.password.length < 6) {
                console.warn(`Skipping user ${user.email}: Password too short`);
                continue;
              }

              const rawCode = user.parishCode || user.code;
              if (!rawCode) {
                console.warn(`Skipping user ${user.email}: Missing parishCode (school code is required to retrieve details from database)`);
                continue;
              }

              try {
                const parishDoc = parishCacheMap.get(String(rawCode).trim());
                if (!parishDoc) {
                  console.warn(`Skipping user ${user.email}: Parish/school code ${rawCode} not found in database`);
                  continue;
                }

                const foraneDoc = foranesData.find(f => f.id === parishDoc.foraneId);
                if (foraneDoc) {
                  user.forane = foraneDoc.name;
                }

                const { saintName, parishPlace } = getParishDetails(parishDoc);
                const normalizedSaint = normalizeSaintName(saintName);

                user.parish = parishPlace || normalizedSaint;

                const combinedSchoolName = formatSchoolName(normalizedSaint, parishPlace);
                user.schoolname = combinedSchoolName;
                user.schoolName = combinedSchoolName;

                if (user.role === "parish") {
                  const finalParishName = getFormattedParishUserName(saintName, parishPlace);
                  user.name = finalParishName;
                  user.fullName = finalParishName;
                } else if (user.role === "school") {
                  if (!user.fullName) {
                    user.fullName = "";
                  }
                }

                newUsers.push(user);
              } catch (e) {
                console.error(`Failed to resolve parishCode ${user.parishCode} for ${user.email}:`, e);
              }
            }
          }

          if (newUsers.length > 0) {
            await executeBulkCreation(newUsers);
          } else {
            toast.warning("No valid users (email and role required) found in Excel");
          }
        } catch (error) {
          console.error("Error parsing Excel:", error);
          toast.error("Failed to process Excel file. Ensure it's in the correct format.");
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
    } else {
      reader.readAsText(file);
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const rows = text.split("\n").filter(row => row.trim());
          if (rows.length < 2) {
            toast.warning("CSV file is empty or only contains headers");
            setIsUploading(false);
            return;
          }

          const headers = rows[0].split(",").map((h) => h.trim());
          const newUsers: Partial<UserData>[] = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue;

            const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim());
            const user: any = {};

            headers.forEach((header, index) => {
              let val = values[index]?.replace(/^"|"$/g, '').trim();
              if (val) {
                const hLower = header.toLowerCase();
                if (hLower === 'email') {
                  user.email = val;
                } else if (hLower === 'password') {
                  user.password = val;
                } else if (hLower === 'phonenumber') {
                  user.phoneNumber = val;
                } else if (hLower === 'role') {
                  user.role = val;
                } else if (hLower === 'parishcode' || hLower === 'code') {
                  user.parishCode = val;
                  user.code = val;
                } else if (hLower === 'techsupporter') {
                  user.fullName = val;
                }
              }
            });

            if (user.email) {
              if (!user.role) user.role = "school";

              if (user.role === "parish") {
                user.phoneNumber = "";
              }

              if (!user.password) {
                console.warn(`Skipping user ${user.email}: Missing password`);
                continue;
              }

              if (user.password.length < 6) {
                console.warn(`Skipping user ${user.email}: Password too short`);
                continue;
              }

              if (!user.parishCode) {
                console.warn(`Skipping user ${user.email}: Missing parishCode (school code is required to retrieve details from database)`);
                continue;
              }

              try {
                const parishDoc = parishCacheMap.get(user.parishCode.trim());
                if (!parishDoc) {
                  console.warn(`Skipping user ${user.email}: Parish/school code ${user.parishCode} not found in database`);
                  continue;
                }

                const foraneDoc = foranesData.find(f => f.id === parishDoc.foraneId);
                if (foraneDoc) {
                  user.forane = foraneDoc.name;
                }

                const { saintName, parishPlace } = getParishDetails(parishDoc);
                const normalizedSaint = normalizeSaintName(saintName);

                user.parish = parishPlace || normalizedSaint;

                const combinedSchoolName = formatSchoolName(normalizedSaint, parishPlace);
                user.schoolname = combinedSchoolName;
                user.schoolName = combinedSchoolName;

                if (user.role === "parish") {
                  const cleanSaint = normalizedSaint.replace(/\./g, "").trim();
                  const formattedParishName = parishPlace
                    ? `${cleanSaint} Church ${toTitleCase(parishPlace)}`
                    : `${cleanSaint} Church`;
                  const finalParishName = formattedParishName.replace(/\s+/g, ' ').trim();
                  user.name = finalParishName;
                  user.fullName = finalParishName;
                } else if (user.role === "school") {
                  if (!user.fullName) {
                    user.fullName = "";
                  }
                }

                newUsers.push(user);
              } catch (e) {
                console.error(`Failed to resolve parishCode ${user.parishCode} for ${user.email}:`, e);
              }
            }
          }

          if (newUsers.length > 0) {
            await executeBulkCreation(newUsers);
          } else {
            toast.warning("No valid users (email and role required) found in CSV");
          }
        } catch (error) {
          console.error("Error parsing CSV:", error);
          toast.error("Failed to process CSV file. Ensure it's in the correct format.");
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showAllUsersMode) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchTerm("");
                setShowAllUsersMode(false);
              }}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">All Registered Users</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-border hover:bg-muted text-foreground"
              onClick={fetchUsers}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
              Total Database Users:{" "}
              <span className="font-semibold text-foreground">{users.length}</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email or name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-64">
              <Select
                value={allUsersRoleFilter}
                onValueChange={(val) => setAllUsersRoleFilter(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="school">Sunday School</SelectItem>
                  <SelectItem value="parish">Parish</SelectItem>
                  <SelectItem value="animator">Animator</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Count display */}
        <div className="flex items-center gap-2 px-1 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-muted-foreground">Filtered Users:</span>
          <span className="text-foreground font-semibold">
            {allUsersFilteredList.length}
          </span>
        </div>

        {/* Users List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allUsersFilteredList.map((user) => {
            const lastActiveDate = user.lastActiveAt?.seconds ? new Date(user.lastActiveAt.seconds * 1000) : null;
            const isOnline = lastActiveDate && (new Date().getTime() - lastActiveDate.getTime()) < 300000;

            return (
              <Card key={user.id} className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={user.profileImageUrl}
                            alt={user.fullName || "User"}
                            loading="lazy"
                          />
                          <AvatarFallback>
                            {(user.fullName || user.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full shadow-sm"></span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {user.role === "parish"
                            ? (user.name || user.fullName || user.schoolname || user.schoolName || "Unnamed User")
                            : user.role === "animator"
                              ? (user.name || user.fullName || "Unnamed User")
                              : (user.schoolname || user.schoolName || user.fullName || "Unnamed User")}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {user.email}
                        </p>
                        {(user.parishCode || user.code) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Code: {user.parishCode || user.code}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/users/${user.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                          onSelect={() => {
                            setUserToDelete(user);
                            setIsDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={`gap-1.5 ${user.role === "admin"
                        ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400"
                        : user.role === "animator"
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
                          : user.role === "parish"
                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                    >
                      {user.role === "admin" ? (
                        <Shield className="w-3 h-3" />
                      ) : user.role === "animator" ? (
                        <Sparkles className="w-3 h-3" />
                      ) : user.role === "parish" ? (
                        <Church className="w-3 h-3" />
                      ) : (
                        <School className="w-3 h-3" />
                      )}
                      {user.role === "admin"
                        ? "Administrator"
                        : user.role === "animator"
                          ? "Animator"
                          : user.role === "parish"
                            ? "Parish"
                            : "Sunday School"}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-end text-sm text-muted-foreground">
                    <Link
                      to={`/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {allUsersFilteredList.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
              No users found matching the filter or search criteria.
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete the account for{" "}
                <span className="font-semibold text-foreground">
                  {userToDelete?.schoolname || userToDelete?.schoolName || userToDelete?.fullName || userToDelete?.email}
                </span>
                ?
                <br />
                <br />
                <span className="text-red-500 font-medium italic text-xs">
                  This will permanently delete the account from Firebase Authentication and all profile data from Firestore. This action cannot be undone.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isAdminDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isAdminDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isAdminDeleting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                ) : (
                  "Delete Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Sunday School / Parish Management</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-muted-foreground mr-1">
            Total Users:{" "}
            <span className="font-medium text-foreground">{users.length}</span>
          </div>

          <Button
            variant="outline"
            className="border-border hover:bg-muted text-foreground"
            onClick={() => {
              setSearchTerm("");
              setShowAllUsersMode(true);
            }}
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            All Users
          </Button>

          <Button
            variant="outline"
            className="border-border hover:bg-muted text-foreground"
            onClick={fetchUsers}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          {/* Create Individual User */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Create New Users</DialogTitle>
                <DialogDescription>
                  Add one or more Sunday school or parish user accounts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {newUsers.map((user, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg relative bg-muted/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">User {index + 1}</span>
                      {newUsers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const updated = [...newUsers];
                            updated.splice(index, 1);
                            setNewUsers(updated);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`email-${index}`}>Email *</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          placeholder="user@example.com"
                          value={user.email}
                          onChange={(e) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, email: e.target.value };
                            setNewUsers(updated);
                          }}
                        />
                      </div>

                      {user.role === "animator" ? (
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Full Name *</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Enter Full Name"
                            value={user.name || ""}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, name: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                      ) : user.role === "school" ? (
                        <div className="space-y-2">
                          <Label htmlFor={`fullName-${index}`}>Full Name</Label>
                          <Input
                            id={`fullName-${index}`}
                            placeholder="John Doe"
                            value={user.fullName || ""}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, fullName: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`role-${index}`}>Role *</Label>
                        <Select
                          onValueChange={(val) => {
                            const updated = [...newUsers];
                            updated[index] = {
                              ...user,
                              role: val as any,
                              forane: "",
                              parish: "",
                              schoolname: "",
                              schoolName: "",
                              schoolId: "",
                              name: "",
                              phoneNumber: val === "parish" ? "" : (user.phoneNumber || ""),
                            };
                            setNewUsers(updated);
                          }}
                        >
                          <SelectTrigger id={`role-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="animator">Animator</SelectItem>
                            <SelectItem value="parish">Parish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Forane only shown for school and animator roles; parish uses it inside Link to School group */}
                      {user.role !== "parish" && (
                        <div className="space-y-2">
                          <Label htmlFor={`forane-${index}`}>Forane *</Label>
                          <Select
                            value={user.forane || ""}
                            onValueChange={(val) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, forane: val, parish: "", schoolname: "", schoolName: "" };
                              setNewUsers(updated);
                              const foraneDoc = foranesData.find(f => f.name === val);
                              if (foraneDoc) fetchParishesForForane(foraneDoc.id);
                            }}
                          >
                            <SelectTrigger id={`forane-${index}`}>
                              <SelectValue placeholder="Select forane" />
                            </SelectTrigger>
                            <SelectContent>
                              {foranesData.map((f) => (
                                <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {user.role === "school" && (
                      (() => {
                        const foraneDoc = foranesData.find(f => f.name === user.forane);
                        const foraneId = foraneDoc?.id ?? "";
                        const availableParishes = foraneId ? (parishesPerForane[foraneId] ?? []) : [];

                        const isParishAlreadyRegistered = (p: ForaneParish) => {
                          const computedSchoolName = formatSchoolName(p.name, p.place || "").trim().toLowerCase().replace(/\s+/g, ' ');
                          const pNameLower = p.name.trim().toLowerCase();
                          const pPlaceLower = (p.place || "").trim().toLowerCase();

                          return users.some(u => {
                            if (u.role !== "school") return false;

                            const uSchoolName = (u.schoolName || u.schoolname || "").trim().toLowerCase().replace(/\s+/g, ' ');
                            if (uSchoolName === computedSchoolName) return true;

                            const uParish = (u.parish || "").trim().toLowerCase();
                            if (uParish === pPlaceLower || uParish === pNameLower) return true;

                            return false;
                          });
                        };

                        const isLoadingP = loadingParishes[foraneId] ?? false;
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`parish-code-${index}`}>Parish Code (Quick Lookup)</Label>
                              <Input
                                id={`parish-code-${index}`}
                                type="text"
                                placeholder="e.g. 131"
                                value={user.parishCode || ""}
                                onChange={(e) => handleCodeChange(e.target.value, index)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`parish-select-${index}`}>Parish *</Label>
                              <Select
                                value={availableParishes.find(p => p.name === user.parish || p.place === user.parish)?.name || ""}
                                disabled={!user.forane}
                                onValueChange={(val) => {
                                  const selectedParish = availableParishes.find(p => p.name === val);
                                  const code = selectedParish?.code || "";
                                  const saintName = selectedParish?.saint || selectedParish?.name || "";
                                  const parishPlace = selectedParish?.saint ? (selectedParish.name || "") : (selectedParish?.place || "");
                                  const schoolNameCombined = selectedParish ? formatSchoolName(saintName, parishPlace) : "";
                                  const updated = [...newUsers];
                                  updated[index] = {
                                    ...user,
                                    parish: parishPlace || saintName,
                                    parishCode: code,
                                    schoolname: schoolNameCombined,
                                    schoolName: schoolNameCombined,
                                  };
                                  setNewUsers(updated);
                                }}
                              >
                                <SelectTrigger id={`parish-select-${index}`}>
                                  {isLoadingP
                                    ? <span className="text-muted-foreground text-sm flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
                                    : <SelectValue placeholder={user.forane ? "Select parish" : "Select a forane first"} />}
                                </SelectTrigger>
                                <SelectContent>
                                  {availableParishes.length === 0 && !isLoadingP && (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                      {user.forane ? "No parishes found" : "Select a forane first"}
                                    </div>
                                  )}
                                  {availableParishes.map((p) => {
                                    const alreadyUsed = isParishAlreadyRegistered(p);
                                    return (
                                      <SelectItem key={p.id} value={p.name} disabled={alreadyUsed}>
                                        <span className={alreadyUsed ? "text-muted-foreground line-through" : ""}>
                                          {toTitleCase(p.name)}{p.place ? ` — ${toTitleCase(p.place)}` : ""}
                                        </span>
                                        {alreadyUsed && <span className="ml-2 text-xs text-muted-foreground">(already registered)</span>}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {user.role === "school" && (
                      <div className="space-y-2">
                        <Label htmlFor={`schoolname-${index}`}>School Name</Label>
                        <Input
                          id={`schoolname-${index}`}
                          placeholder={user.forane ? "Select a parish above to auto-fill" : "St. Mary's School"}
                          value={user.schoolname || ""}
                          onChange={(e) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, schoolname: e.target.value };
                            setNewUsers(updated);
                          }}
                        />
                        {user.schoolname && (
                          <p className="text-xs text-muted-foreground">Auto-filled from parish — edit if needed</p>
                        )}
                      </div>
                    )}

                    {user.role === "animator" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`address-${index}`}>Address</Label>
                          <Input
                            id={`address-${index}`}
                            placeholder="Enter Address"
                            value={user.address}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, address: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`parishDropdown-${index}`}>Parish *</Label>
                          <Select
                            value={user.parishId}
                            onValueChange={(val) => {
                              const selectedParish = users.find(u => u.id === val || u.uid === val);
                              const updated = [...newUsers];
                              updated[index] = {
                                ...user,
                                parishId: val,
                                parishName: selectedParish?.schoolname || selectedParish?.schoolName || selectedParish?.fullName || ""
                              };
                              setNewUsers(updated);
                            }}
                          >
                            <SelectTrigger id={`parishDropdown-${index}`}>
                              <SelectValue placeholder="Select Parish" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(
                                users
                                  .filter(u => (u.role === "parish" || u.role === "school") && (!user.forane || u.forane === user.forane))
                                  .reduce((acc, current) => {
                                    const name = current.schoolname || current.schoolName || current.fullName || current.email;
                                    if (!acc.has(name)) {
                                      acc.set(name, current);
                                    }
                                    return acc;
                                  }, new Map<string, typeof users[0]>())
                                  .values()
                              ).map((p) => (
                                <SelectItem key={p.id} value={p.id || ""}>
                                  {p.schoolname || p.schoolName || p.fullName || p.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {user.role === "parish" && (
                      <div className="space-y-4">
                        <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link to School</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`parish-forane-${index}`}>Forane</Label>
                              <Select
                                value={user.forane || ""}
                                onValueChange={(val) => {
                                  const updated = [...newUsers];
                                  updated[index] = { ...user, forane: val, schoolId: "", schoolName: "", parish: "", name: "" };
                                  setNewUsers(updated);
                                }}
                              >
                                <SelectTrigger id={`parish-forane-${index}`}>
                                  <SelectValue placeholder="Filter by forane" />
                                </SelectTrigger>
                                <SelectContent>
                                  {foranesData.map((f) => (
                                    <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`schoolSelect-${index}`}>School *</Label>
                              <Select
                                value={user.schoolId || ""}
                                onValueChange={async (val) => {
                                  const selectedSchool = users.find(u => u.id === val || u.uid === val);
                                  const schoolName = selectedSchool?.schoolname || selectedSchool?.schoolName || "";
                                  const schoolForane = selectedSchool?.forane || user.forane || "";

                                  let parishCode = selectedSchool?.parishCode || selectedSchool?.code || "";
                                  let saintName = "";
                                  let parishPlace = "";

                                  // Fetch parish details by code first to prevent typos/old incorrect records
                                  if (parishCode) {
                                    try {
                                      const foundParish = await ParishService.getParishByCode(parishCode.trim());
                                      if (foundParish) {
                                        const details = getParishDetails(foundParish);
                                        saintName = details.saintName;
                                        parishPlace = details.parishPlace;
                                      }
                                    } catch (e) {
                                      console.error("Failed to query parish by code:", e);
                                    }
                                  }

                                  // Fallback to name search if code failed/missing
                                  if (!parishPlace) {
                                    const foraneDoc = foranesData.find(f => f.name === schoolForane);
                                    if (foraneDoc) {
                                      const parishesRef = collection(db, 'foranes', foraneDoc.id, 'parishes');
                                      const snap = await getDocs(parishesRef);
                                      const matchedParish = snap.docs.find(d =>
                                        (d.data().place || "").toLowerCase().trim() === (selectedSchool?.parish || "").toLowerCase().trim() ||
                                        (d.data().name || "").toLowerCase().trim() === (selectedSchool?.parish || "").toLowerCase().trim()
                                      );
                                      if (matchedParish) {
                                        parishCode = matchedParish.data().code || parishCode;
                                        const details = getParishDetails(matchedParish.data());
                                        saintName = details.saintName;
                                        parishPlace = details.parishPlace;
                                      }
                                    }
                                  }

                                  // Fallback to extracting from name words
                                  if (!parishPlace && schoolName) {
                                    const words = schoolName.trim().split(/\s+/);
                                    const lastWord = words.length > 0 ? words[words.length - 1] : "";
                                    const lowerWord = lastWord.toLowerCase();
                                    if (lowerWord !== "school" && lowerWord !== "church" && !lowerWord.startsWith("st") && lowerWord !== "joseph" && lowerWord !== "dominic" && lowerWord !== "christ") {
                                      parishPlace = lastWord;
                                    }
                                  }

                                  let formattedParishName = "";
                                  if (saintName || parishPlace) {
                                    formattedParishName = getFormattedParishUserName(saintName, parishPlace);
                                  } else {
                                    formattedParishName = getAutofilledName(schoolName, parishPlace || selectedSchool?.parish || "");
                                  }

                                  const updated = [...newUsers];
                                  updated[index] = {
                                    ...user,
                                    schoolId: val,
                                    schoolName: schoolName,
                                    forane: schoolForane,
                                    parish: parishPlace || selectedSchool?.parish || "",
                                    parishCode: parishCode,
                                    code: parishCode,
                                    name: formattedParishName,
                                  };
                                  setNewUsers(updated);
                                }}
                              >
                                <SelectTrigger id={`schoolSelect-${index}`}>
                                  <SelectValue placeholder="Select school" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const cleanName = (name: string): string => {
                                      return (name || "")
                                        .toLowerCase()
                                        .replace(/\./g, "")
                                        .replace(/'s/gi, "")
                                        .replace(/[^a-z0-9]/gi, "")
                                        .trim();
                                    };
                                    const assignedSchoolIds = new Set(
                                      users.filter(u => u.role === "parish" && u.schoolId).map(u => u.schoolId)
                                    );
                                    const assignedParishCodes = new Set(
                                      users.filter(u => u.role === "parish" && u.parishCode).map(u => u.parishCode)
                                    );
                                    const assignedSchoolNames = new Set(
                                      users
                                        .filter(u => u.role === "parish")
                                        .map(u => cleanName(u.schoolName || u.schoolname || u.name || ""))
                                        .filter(Boolean)
                                    );
                                    return users
                                      .filter(u => {
                                        if (u.role !== "school") return false;
                                        if (user.forane && u.forane !== user.forane) return false;

                                        const schoolId = u.id || u.uid;
                                        if (assignedSchoolIds.has(schoolId)) return false;

                                        const schoolCode = u.parishCode || "";
                                        if (schoolCode && assignedParishCodes.has(schoolCode)) return false;

                                        const sNameCleaned = cleanName(u.schoolname || u.schoolName || "");
                                        if (sNameCleaned && assignedSchoolNames.has(sNameCleaned)) return false;

                                        return true;
                                      })
                                      .map(s => (
                                        <SelectItem key={s.id} value={s.id || ""}>
                                          {s.schoolname || s.schoolName || s.email}
                                        </SelectItem>
                                      ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor={`parish-code-display-${index}`}>Parish Code</Label>
                              <Input
                                id={`parish-code-display-${index}`}
                                type="text"
                                placeholder="Autofetched"
                                value={user.parishCode || ""}
                                readOnly
                                disabled
                                className="bg-muted text-muted-foreground border-border cursor-not-allowed"
                              />
                            </div>
                            {user.parish && (
                              <div className="flex items-end pb-0.5">
                                <div className="flex items-center gap-2 px-2 py-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 w-full h-[40px]">
                                  <Church className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                                  <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                                    Parish: <strong>{toTitleCase(user.parish)}</strong>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Parish Name *</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Enter Parish Name"
                            value={user.name || ""}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, name: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                      </div>
                    )}



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.role !== "parish" && (
                        <div className="space-y-2">
                          <Label htmlFor={`phone-${index}`}>Phone Number</Label>
                          <Input
                            id={`phone-${index}`}
                            placeholder="Phone Number"
                            value={user.phoneNumber}
                            onChange={(e) => {
                              const updated = [...newUsers];
                              updated[index] = { ...user, phoneNumber: e.target.value };
                              setNewUsers(updated);
                            }}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor={`password-${index}`}>Password *</Label>
                        <Input
                          id={`password-${index}`}
                          type="password"
                          placeholder="Min 6 characters"
                          value={user.password}
                          onChange={(e) => {
                            const updated = [...newUsers];
                            updated[index] = { ...user, password: e.target.value };
                            setNewUsers(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    const lastUser = newUsers[newUsers.length - 1];
                    setNewUsers([...newUsers, {
                      email: "",
                      fullName: "",
                      name: "",
                      role: lastUser?.role || "school",
                      forane: lastUser?.forane || "",
                      parish: lastUser?.parish || "",
                      parishId: lastUser?.parishId || "",
                      parishName: lastUser?.parishName || "",
                      schoolId: lastUser?.schoolId || "",
                      schoolName: lastUser?.schoolName || "",
                      password: "",
                      address: "",
                    }]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another User
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    `Create ${newUsers.length} User(s)`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                  Upload an Excel or CSV file to add multiple users at once.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Excel Template
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Download format guide
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        Prefilled Excel Template
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Includes all database schools & parishes
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPrefilledTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                      <p className="text-sm text-gray-600">
                        Processing file...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload Excel or CSV
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max file size: 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs
        value={activeTab}
        className="w-full"
        onValueChange={(val) => {
          const nextTab = val as "school" | "parish";
          setActiveTab(nextTab);
          setSearchParams({ tab: nextTab });
          setSelectedUserIds([]);
          setIsSelectMode(false);
          setSelectedForaneFilter("all");
          setSelectedParishFilter("all");
        }}
      >
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="school">Sunday Schools</TabsTrigger>
          <TabsTrigger value="parish">Parishes</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email or school name..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-[220px]">
            <Select
              value={selectedForaneFilter}
              onValueChange={(val) => {
                setSelectedForaneFilter(val);
                setSelectedParishFilter("all");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Foranes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Foranes</SelectItem>
                {foranesData.map((f) => (
                  <SelectItem key={f.id} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-[220px]">
            <Select
              value={selectedParishFilter}
              onValueChange={(val) => {
                setSelectedParishFilter(val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Parishes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parishes</SelectItem>
                {getAvailableParishes().map((pName) => (
                  <SelectItem key={pName} value={pName}>
                    {toTitleCase(pName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-muted-foreground">
            Total {activeTab === "school" ? "Sunday Schools" : "Parishes"}:
          </span>
          <span className="text-foreground font-semibold">
            {activeTab === "school" ? schoolCount : parishCount}
          </span>
          {searchTerm && (
            <span className="text-xs text-muted-foreground ml-2">
              ({filteredUsers.length} matching search)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allIds = filteredUsers.map(u => u.id || u.uid).filter(Boolean);
                  if (selectedUserIds.length === allIds.length) {
                    setSelectedUserIds([]);
                  } else {
                    setSelectedUserIds(allIds);
                  }
                }}
              >
                {selectedUserIds.length === filteredUsers.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                disabled={selectedUserIds.length === 0}
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedUserIds.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedUserIds([]);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectMode(true)}
              disabled={filteredUsers.length === 0}
            >
              Select Users
            </Button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          // Check if user was active in the last 5 mins (300000 ms)
          const lastActiveDate = user.lastActiveAt?.seconds ? new Date(user.lastActiveAt.seconds * 1000) : null;
          const isOnline = lastActiveDate && (new Date().getTime() - lastActiveDate.getTime()) < 300000;
          const userId = user.id || user.uid;
          const isSelected = selectedUserIds.includes(userId);

          return (
            <Card
              key={user.id}
              className={`hover:shadow-md transition-all relative ${
                isSelectMode
                  ? "cursor-pointer border-2 " + (isSelected ? "border-blue-500 bg-blue-50/10 dark:bg-blue-900/5 ring-1 ring-blue-500" : "border-border hover:border-gray-400")
                  : "transition-shadow"
              }`}
              onClick={() => {
                if (isSelectMode) {
                  if (isSelected) {
                    setSelectedUserIds(prev => prev.filter(id => id !== userId));
                  } else {
                    setSelectedUserIds(prev => [...prev, userId]);
                  }
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {isSelectMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // parent onClick handles toggle
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.profileImageUrl}
                          alt={user.fullName || "User"}
                          loading="lazy"
                        />
                        <AvatarFallback>
                          {(user.fullName || user.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full shadow-sm"></span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                        <span>
                          {user.role === "parish"
                            ? (user.name || user.fullName || getFormattedParishUserName(user.parish || "", user.parish || "", user.forane))
                            : user.role === "animator"
                              ? (user.name || user.fullName || "Unnamed User")
                              : (user.schoolname || user.schoolName || user.fullName || "Unnamed User")}
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {user.email}
                      </p>
                      {(user.parishCode || user.code) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Code: {user.parishCode || user.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/users/${user.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onSelect={() => {
                          setUserToDelete(user);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className={`gap-1.5 ${user.role === "admin"
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400"
                      : user.role === "animator"
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
                        : user.role === "parish"
                          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                  >
                    {user.role === "admin" ? (
                      <Shield className="w-3 h-3" />
                    ) : user.role === "animator" ? (
                      <Sparkles className="w-3 h-3" />
                    ) : user.role === "parish" ? (
                      <Church className="w-3 h-3" />
                    ) : (
                      <School className="w-3 h-3" />
                    )}
                    {user.role === "admin"
                      ? "Administrator"
                      : user.role === "animator"
                        ? "Animator"
                        : user.role === "parish"
                          ? "Parish"
                          : "Sunday School"}
                  </Badge>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-end text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Profile
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the account for{" "}
              <span className="font-semibold text-foreground">
                {userToDelete?.schoolname || userToDelete?.schoolName || userToDelete?.fullName || userToDelete?.email}
              </span>
              ?
              <br />
              <br />
              <span className="text-red-500 font-medium italic text-xs">
                This will permanently delete the account from Firebase Authentication and all profile data from Firestore. This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isAdminDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isAdminDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isAdminDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Bulk Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the accounts of{" "}
              <span className="font-semibold text-foreground">
                {selectedUserIds.length} selected user(s)
              </span>
              ?
              <br />
              <br />
              <span className="text-red-500 font-medium italic text-xs">
                This will permanently delete these accounts from Firebase Authentication and all profile data from Firestore. This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteConfirmOpen(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteUsers}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                "Delete Selected Accounts"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
