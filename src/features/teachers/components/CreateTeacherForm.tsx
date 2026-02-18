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
import { Checkbox } from "@/components/ui/checkbox";

import {
  createTeacherSchema,
  CreateTeacherInput,
  Parish,
  Teacher,
} from "../types";
import { TeacherService } from "../services/teacherService";
import { ParishService } from "@/features/parishes/services/parishService";
import { uploadFile } from "@/lib/upload";

const ACADEMIC_CLASSES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];
const ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

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
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParishes, setLoadingParishes] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.profilePicture || null,
  );

  // Initialize form
  const form = useForm<CreateTeacherInput>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      parishId: initialData?.parishId || "",
      classes: initialData?.classes || [],
      academicYear: initialData?.academicYear || "",
      dob: initialData?.dob || "",
      qualification: initialData?.qualification || "",
      profilePicture: initialData?.profilePicture || "",
    },
  });

  // Fetch parishes on mount
  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const data = await ParishService.getAllParishes();
        setParishes(data);
      } catch (error) {
        console.error("Failed to fetch parishes", error);
        toast.error("Failed to load parishes");
      } finally {
        setLoadingParishes(false);
      }
    };
    fetchParishes();
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

      const finalData = { ...data, profilePicture: imageUrl };

      if (isEditing && initialData) {
        await TeacherService.updateTeacher(initialData.id, finalData);
        toast.success("Teacher updated successfully");
      } else {
        const selectedParish = parishes.find((p) => p.id === data.parishId);
        if (!selectedParish) {
          toast.error("Invalid parish selected");
          return;
        }
        await TeacherService.addTeacher(
          finalData,
          selectedParish.location,
          selectedParish.name,
        );
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
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
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
                <FormLabel>Parish *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loadingParishes}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Parish" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parishes.map((parish) => (
                      <SelectItem key={parish.id} value={parish.id}>
                        {parish.name}
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
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-base">Classes *</FormLabel>
              </div>
              <div className="grid grid-cols-3 gap-2 border p-2 rounded-md h-32 overflow-y-auto">
                {ACADEMIC_CLASSES.map((cls) => (
                  <FormField
                    key={cls}
                    control={form.control}
                    name="classes"
                    render={({ field }) => (
                      <FormItem
                        key={cls}
                        className="flex flex-row items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(cls)}
                            onCheckedChange={(checked) =>
                              checked
                                ? field.onChange([...field.value, cls])
                                : field.onChange(
                                    field.value?.filter((v) => v !== cls),
                                  )
                            }
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {cls}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
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
