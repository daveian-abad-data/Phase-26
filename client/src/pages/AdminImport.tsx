import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const PROFILE_FIELDS = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zipCode", label: "Zip Code" },
  { value: "businessName", label: "Business Name" },
  { value: "businessType", label: "Business Type" },
  { value: "businessStartDate", label: "Business Start Date" },
  { value: "timeInBusiness", label: "Time in Business" },
  { value: "totalBusinessIncome", label: "Total Business Income" },
  { value: "personalIncome", label: "Personal Income" },
  { value: "fundingNeeded", label: "Funding Needed" },
  { value: "ficoScore", label: "FICO Score" },
  { value: "monthlyRevenue", label: "Monthly Revenue" },
  { value: "existingDebt", label: "Existing Debt" },
  { value: "fundingPurpose", label: "Funding Purpose" },
  { value: "fundingStatus", label: "Funding Status" },
  { value: "notes", label: "Notes" },
];

type Step = "input" | "preview" | "mapping" | "result";

export default function AdminImport() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("input");
  const [sheetId, setSheetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    preview: string[][];
    mapping: Record<string, string>;
  } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // All hooks MUST be declared before any conditional returns (Rules of Hooks)
  const isAdmin = !loading && isAuthenticated && user?.role === "admin";

  const previewMutation = trpc.admin.previewSheetImport.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setColumnMapping(data.mapping);
      setStep("preview");
    },
    onError: (err) => toast.error(err.message),
  });

  const importMutation = trpc.admin.importFromSheets.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setStep("result");
      if (data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} clients`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // Auth guard — must be in useEffect to avoid setState-in-render error
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      navigate("/");
    }
  }, [loading, isAuthenticated, user?.role]);

  // Conditional returns AFTER all hooks
  if (loading) return null;
  if (!isAuthenticated || user?.role !== "admin") return null;

  const extractSheetId = (input: string): string => {
    // Handle full URL like https://docs.google.com/spreadsheets/d/SHEET_ID/edit
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    return input.trim();
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSheetId(sheetId);
    if (!id) {
      toast.error("Please enter a valid Google Sheet URL or ID");
      return;
    }
    previewMutation.mutate({ sheetId: id, apiKey: apiKey || undefined, sheetName });
  };

  const handleImport = () => {
    const id = extractSheetId(sheetId);
    importMutation.mutate({
      sheetId: id,
      apiKey: apiKey || undefined,
      sheetName,
      columnMapping,
    });
  };

  const setMapping = (field: string, col: string) => {
    setColumnMapping((prev) => ({ ...prev, [field]: col }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Import from Google Sheets
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Sync client data from your existing Google Spreadsheet
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {(["input", "preview", "mapping", "result"] as Step[]).map((s, idx) => {
            const labels = ["Connect", "Preview", "Map Columns", "Done"];
            const current = ["input", "preview", "mapping", "result"].indexOf(step);
            const isActive = s === step;
            const isDone = idx < current;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3 h-3" /> : <span>{idx + 1}</span>}
                  {labels[idx]}
                </div>
                {idx < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Input */}
        {step === "input" && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">Connect Your Google Sheet</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreview} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="sheetId">Google Sheet URL or ID *</Label>
                  <Input
                    id="sheetId"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... or just the ID"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the full URL or just the spreadsheet ID from the URL.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sheetName">Sheet Name</Label>
                    <Input
                      id="sheetName"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="Sheet1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apiKey">Google API Key (optional)</Label>
                    <Input
                      id="apiKey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIza..."
                      type="password"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800 space-y-1">
                    <p className="font-medium">How to share your sheet:</p>
                    <p>
                      Without an API key, the sheet must be publicly accessible (File → Share →
                      "Anyone with the link can view"). With an API key, private sheets are
                      supported.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={previewMutation.isPending} className="gap-2">
                    {previewMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Preview Sheet
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && previewData && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  Sheet Preview ({previewData.headers.length} columns detected)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.map((h) => (
                        <TableHead key={h} className="whitespace-nowrap text-xs">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.preview.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {previewData.headers.map((_, j) => (
                          <TableCell key={j} className="text-xs whitespace-nowrap max-w-32 truncate">
                            {row[j] || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("input")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep("mapping")} className="gap-2">
                Configure Column Mapping
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Column Mapping */}
        {step === "mapping" && previewData && (
          <div className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Map Sheet Columns to Profile Fields</CardTitle>
                <p className="text-sm text-muted-foreground">
                  We've auto-detected the mapping below. Adjust as needed.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PROFILE_FIELDS.map((field) => (
                    <div key={field.value} className="space-y-1.5">
                      <Label className="text-xs font-medium">{field.label}</Label>
                      <Select
                        value={columnMapping[field.value] || "__none__"}
                        onValueChange={(val) =>
                          setMapping(field.value, val === "__none__" ? "" : val)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Not mapped" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Not mapped —</SelectItem>
                          {previewData.headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("preview")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="gap-2"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Import Clients
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && importResult && (
          <Card className="border-border shadow-sm">
            <CardContent className="p-8 text-center">
              {importResult.imported > 0 ? (
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              )}
              <h2
                className="text-xl font-bold text-foreground mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Import Complete
              </h2>
              <div className="flex justify-center gap-8 my-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{importResult.imported}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">{importResult.skipped}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="text-left p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-6">
                  <p className="text-sm font-medium text-destructive mb-2">
                    {importResult.errors.length} error(s):
                  </p>
                  <ul className="text-xs text-destructive space-y-1">
                    {importResult.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>...and {importResult.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setImportResult(null);
                    setPreviewData(null);
                    setSheetId("");
                  }}
                >
                  Import Another Sheet
                </Button>
                <Button onClick={() => navigate("/admin")}>View All Clients</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
