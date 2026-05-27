import { useState, useEffect } from "react";
import {
  Loader2,
  Save,
  FileText,
  Upload,
  RefreshCw,
  Eye,
  Type,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import {
  getCalendarConfig,
  saveCalendarConfig,
  CalendarConfig,
} from "../../features/calendar/services/calendarService";
import { uploadFile } from "../../lib/upload";

export function Calendar() {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getCalendarConfig();
        setConfig(data);
      } catch (error) {
        console.error("Error fetching calendar configuration:", error);
        toast.error("Failed to load calendar configuration");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file only");
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    try {
      const url = await uploadFile(file, `calendar/${Date.now()}_${file.name}`);
      setConfig((prev) => (prev ? { ...prev, pdfUrl: url } : null));
      toast.success("Calendar PDF uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload calendar PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    if (!config.pdfUrl) {
      toast.error("Calendar PDF URL or upload is required");
      return;
    }
    if (!config.buttonTitle.trim()) {
      toast.error("Button title is required");
      return;
    }

    setSaving(true);
    try {
      await saveCalendarConfig(config);
      toast.success("Calendar configuration saved successfully!");
    } catch (error) {
      console.error("Error saving calendar configuration:", error);
      toast.error("Failed to save calendar configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            pdfUrl: "/Suvara Calender.pdf",
            buttonTitle: "View Calendar",
          }
        : null
    );
    setSelectedFile(null);
    toast.info("Reset to default calendar file");
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            App Calendar Resource Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure the PDF calendar resource and manage the mobile app button settings.
          </p>
        </div>
        <Button onClick={handleSaveConfig} disabled={saving} className="shadow-md hover:scale-105 transition-transform">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Type className="w-5 h-5 text-primary" />
                Button Title
              </CardTitle>
              <CardDescription>
                Customize the label of the calendar button inside the mobile app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="button-title">Mobile App Button Label</Label>
                <Input
                  id="button-title"
                  value={config?.buttonTitle}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev ? { ...prev, buttonTitle: e.target.value } : null
                    )
                  }
                  placeholder="e.g., View Calendar, Suvara Calendar"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <FileText className="w-5 h-5 text-primary" />
                Calendar File
              </CardTitle>
              <CardDescription>
                Upload a new calendar PDF or point to a custom URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Calendar PDF File</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    id="calendar-pdf-upload"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("calendar-pdf-upload")?.click()
                    }
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {selectedFile ? "Replace PDF File" : "Upload PDF File"}
                  </Button>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground text-center">
                      Selected: {selectedFile.name} (
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>

              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">
                  or
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-url">PDF Resource URL</Label>
                <Input
                  id="pdf-url"
                  value={config?.pdfUrl}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev ? { ...prev, pdfUrl: e.target.value } : null
                    )
                  }
                  placeholder="URL starting with http:// or https://"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="ghost"
                  onClick={handleResetToDefault}
                  className="w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to Default Calendar File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview / PDF view */}
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[500px] flex flex-col shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Eye className="w-5 h-5 text-primary" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  Preview of the currently configured calendar PDF file
                </CardDescription>
              </div>
              {config?.pdfUrl && (
                <a
                  href={config.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Open in New Tab <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 border-t border-border bg-accent/5">
              {config?.pdfUrl ? (
                <div className="flex-1 min-h-[450px] relative">
                  <iframe
                    src={config.pdfUrl}
                    className="absolute inset-0 w-full h-full border-none rounded-b-xl"
                    title="Calendar PDF Preview"
                  ></iframe>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                  <FileText className="w-16 h-16 mb-4 opacity-30" />
                  <p>No calendar PDF file configured or uploaded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
