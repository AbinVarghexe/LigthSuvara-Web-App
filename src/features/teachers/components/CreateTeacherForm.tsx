import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

import { createTeacherSchema, CreateTeacherInput, Parish } from "../types";
import { TeacherService } from "../services/teacherService";
import { ParishService } from "@/features/parishes/services/parishService";

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
}

export function CreateTeacherForm({
  onTeacherAdded,
  onCancel,
}: CreateTeacherFormProps) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParishes, setLoadingParishes] = useState(true);

  // Initialize form
  const form = useForm<CreateTeacherInput>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      parishId: "",
      classes: [],
      academicYear: "",
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

  const onSubmit = async (data: CreateTeacherInput) => {
    setLoading(true);
    try {
      const selectedParish = parishes.find((p) => p.id === data.parishId);
      if (!selectedParish) {
        toast.error("Invalid parish selected");
        return;
      }

      await TeacherService.addTeacher(
        data,
        selectedParish.location,
        selectedParish.name,
      );

      toast.success("Teacher added successfully");
      form.reset();
      onTeacherAdded();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to add teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            Save Teacher
          </Button>
        </div>
      </form>
    </Form>
  );
}
