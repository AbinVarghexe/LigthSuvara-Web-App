import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createTeacherSchema, CreateTeacherInput, Teacher } from "../types";
import { TeacherService } from "../services/teacherService";
import { getUsers, UserData } from "@/features/users/services/userService";
import { uploadFile } from "@/lib/upload";

const ACADEMIC_CLASSES = [
  "Class 1", "Class 2", "Class 3", "Class 4",
  "Class 5", "Class 6", "Class 7", "Class 8",
  "Class 9", "Class 10", "Class 11", "Class 12",
];
const ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

interface School {
  id: string;
  name: string;
  forane: string;
}

interface CreateTeacherFormProps {
  onTeacherAdded: () => void;
  onCancel?: () => void;
  initialData?: Teacher;
  isEditing?: boolean;
}

export function CreateTeacherForm({
  onTeacherAdded,
  onCancel,
  initialData,
  isEditing = false,
}: CreateTeacherFormProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.profilePicture || null,
  );

  // Helper to safely convert various date formats (ISO string, Date, or Firebase Timestamp) to ISO string
  const toIsoDate = (val: any) => {
    if (!val) return "";
    // Handle Firebase Timestamp
    if (val && typeof val === 'object' && 'seconds' in val) {
      return new Date(val.seconds * 1000).toISOString();
    }
    // Handle Date object
    if (val instanceof Date) {
      return val.toISOString();
    }
    // Assume string or try to parse
    try {
      const d = new Date(val);
      return !isNaN(d.getTime()) ? d.toISOString() : "";
    } catch {
      return "";
    }
  };

  // Initialize form — parishId field is reused as schoolId internally for schema compat
  const form = useForm<CreateTeacherInput>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      parishId: (initialData as any)?.schoolId || initialData?.parishId || "",
      classes: initialData?.classes
        ? Array.isArray(initialData.classes)
          ? initialData.classes.length ? [initialData.classes[0]] : []
          : [String(initialData.classes)]
        : [],
      academicYear: initialData?.academicYear || "",
      dob: toIsoDate(initialData?.dob),
      qualification: initialData?.qualification || "",
      profilePicture: initialData?.profilePicture || "",
    },
  });

  // Fetch schools from users collection
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const usersData = await getUsers();
        const allUsers = usersData as UserData[];
        const schoolsList = allUsers
          .filter((u) => u.role === "school")
          .map((u) => ({
            id: u.uid || u.id,
            name:
              (u as any).schoolname ||
              (u as any).name ||
              (u as any).displayName ||
              u.email,
            forane: (u as any).forane || "",
          }));
        setSchools(schoolsList);
      } catch (error) {
        console.error("Failed to fetch schools", error);
        toast.error("Failed to load school list");
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("profilePicture", "");
  };

  const onSubmit = async (data: CreateTeacherInput) => {
    setLoading(true);
    try {
      let imageUrl = data.profilePicture;

      if (imageFile) {
        const path = `teachers/${Date.now()}_${imageFile.name}`;
        imageUrl = await uploadFile(imageFile, path);
      }

      // Resolve school name from selected schoolId (stored in parishId field)
      const selectedSchool = schools.find((s) => s.id === data.parishId);
      const schoolId = data.parishId;
      const schoolName = selectedSchool?.name || "";

      const finalData = {
        ...data,
        profilePicture: imageUrl,
        schoolId,
        schoolName,
      };

      if (isEditing && initialData) {
        await TeacherService.updateTeacher(initialData.id, finalData);
        toast.success("Teacher updated successfully");
      } else {
        await TeacherService.addTeacher(finalData, schoolId, schoolName);
        toast.success("Teacher added successfully");
      }

      form.reset();
      onTeacherAdded();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex flex-col items-center justify-center space-y-4 p-4 border-2 border-dashed rounded-lg">
            {imagePreview ? (
              <div className="relative w-32 h-32">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-full border-2 border-primary"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Upload size={32} />
                </div>
                <p className="text-sm">Upload Profile Picture</p>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              className="max-w-[250px]"
              onChange={handleImageChange}
            />
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {(() => {
                          const date = field.value ? new Date(field.value) : null;
                          const isValidDate = date && !isNaN(date.getTime());
                          return isValidDate ? (
                            format(date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          );
                        })()}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parishId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sunday School *</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setSchoolSearch("");
                  }}
                  defaultValue={field.value}
                  disabled={loadingSchools}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingSchools ? "Loading schools..." : "Select Sunday School"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Search box inside dropdown */}
                    <div className="px-2 py-2 sticky top-0 bg-popover z-10 border-b">
                      <input
                        autoFocus
                        placeholder="Search school..."
                        value={schoolSearch}
                        onChange={(e) => setSchoolSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-full text-sm px-3 py-1.5 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    {schools
                      .filter((s) =>
                        s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                        s.forane.toLowerCase().includes(schoolSearch.toLowerCase())
                      )
                      .map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                          {school.forane ? (
                            <span className="text-muted-foreground ml-1 text-xs">
                              — {school.forane}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    {schools.filter((s) =>
                      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                      s.forane.toLowerCase().includes(schoolSearch.toLowerCase())
                    ).length === 0 && (
                        <div className="py-3 text-center text-sm text-muted-foreground italic">
                          No schools found
                        </div>
                      )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="9876543210" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="teacher@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="academicYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Academic Year *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qualification *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. B.Ed, MA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="classes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class *</FormLabel>
              <Select
                onValueChange={(val) => field.onChange([val])}
                defaultValue={field.value?.[0] || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACADEMIC_CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Teacher" : "Save Teacher"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
