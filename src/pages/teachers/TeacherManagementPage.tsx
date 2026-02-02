import { useState } from "react";
import { Plus, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CreateTeacherForm } from "@/features/teachers/components/CreateTeacherForm";
import { TeacherAssignment } from "@/features/teachers/components/TeacherAssignment";
import { SeedService } from "@/features/teachers/services/seedService";
import { seedParishes } from "@/features/parishes/services/parishSeeder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TeacherManagementPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleTeacherAdded = () => {
    setRefreshKey((prev) => prev + 1);
    setIsDialogOpen(false);
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await SeedService.seedDemoData();
      toast.success(result.message);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to seed teacher data");
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedParishes = async () => {
    setSeeding(true);
    try {
      const result = await seedParishes();
      toast.success(
        `Parishes seeded: ${result.added} added, ${result.skipped} skipped`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to seed parishes");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Teacher Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage teachers and inspection assignments.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedData} disabled={seeding}>
            {seeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Demo Teachers
          </Button>

          <Button
            variant="outline"
            onClick={handleSeedParishes}
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Seed Parishes
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Fill in the details to register a new teacher.
                </DialogDescription>
              </DialogHeader>
              <CreateTeacherForm
                onTeacherAdded={handleTeacherAdded}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section>
        <TeacherAssignment refreshTrigger={refreshKey} />
      </section>
    </div>
  );
}
