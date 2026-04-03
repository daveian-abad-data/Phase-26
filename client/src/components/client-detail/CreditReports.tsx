import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  clientId: number;
  clientBusinessId?: string | null;
}

type Bureau = "Experian" | "TransUnion" | "Equifax";
const BUREAUS: Bureau[] = ["Experian", "TransUnion", "Equifax"];

type Evaluation = "Poor" | "Fair" | "Good" | "Very Good" | "Exceptional";

const emptyReportForm = {
  bureau: "Experian" as Bureau,
  reportDate: "",
  ficoScore: "",
  ficoScoreModel: "",
  evaluation: "" as Evaluation | "",
};

function normalizeBureau(value?: string | null): Bureau | "" {
  if (!value) return "";
  const cleaned = value.toLowerCase().replace(/\s+/g, "");
  if (cleaned === "transunion") return "TransUnion";
  if (cleaned === "experian") return "Experian";
  if (cleaned === "equifax") return "Equifax";
  return "";
}

function cleanMoney(value?: string | null) {
  if (!value) return null;
  const cleaned = value.toString().replace(/[$,%\s,]/g, "").trim();
  return cleaned || null;
}

function formatMoney(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "number" ? value : Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(num) ? `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(value);
}

function formatText(value?: string | null) {
  return value && String(value).trim() ? value : "—";
}

function splitMultiValue(value?: string | null) {
  if (!value) return [];
  return value
    .split(/\n|\|\||\||;;/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseTSV(raw: string) {
  return raw
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split("\t").map((cell) => cell.trim()));
}

function headerIndex(headers: string[]) {
  const map = new Map<string, number>();
  headers.forEach((header, index) => map.set(header.toLowerCase().replace(/[^a-z0-9]+/g, ""), index));
  return map;
}

function cell(row: string[], idx: Map<string, number>, ...keys: string[]) {
  for (const key of keys) {
    const found = idx.get(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
    if (found !== undefined) return row[found] ?? "";
  }
  return "";
}

function inferAccountCategory(classification: string, accountType: string): string {
  const text = `${classification} ${accountType}`.toLowerCase();
  if (text.includes("card")) return "Cards";
  if (text.includes("auto") || text.includes("car")) return "Car";
  if (text.includes("mortgage") || text.includes("house") || text.includes("home")) return "House";
  if (text.includes("secured")) return "Secured Loan";
  if (text.includes("loan")) return "Unsecured Loan";
  return "Others";
}

function parseAccountsImport(raw: string, report: any) {
  const rows = parseTSV(raw);
  if (rows.length < 2) throw new Error("Paste the header row and at least one account row.");
  const headers = rows[0];
  const idx = headerIndex(headers);
  const required = ["accountname", "openclosed", "accounttype"];
  for (const key of required) {
    if (!idx.has(key)) throw new Error("Accounts import format is missing one or more required columns.");
  }
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => {
    const classification = cell(row, idx, "Empower Classification");
    const accountType = cell(row, idx, "Account type");
    return {
      bureau: report.bureau,
      reportDate: report.reportDate || null,
      accountName: cell(row, idx, "Account name") || null,
      openClosed: cell(row, idx, "Open/closed") || null,
      responsibility: cell(row, idx, "Responsibility") || null,
      accountNumber: cell(row, idx, "Account number") || null,
      dateOpened: cell(row, idx, "Date opened") || null,
      statusUpdated: cell(row, idx, "Status updated") || null,
      accountType: accountType || null,
      status: cell(row, idx, "Status") || null,
      balance: cleanMoney(cell(row, idx, "Balance")),
      creditLimit: cleanMoney(cell(row, idx, "Credit Limit")),
      creditUsage: cell(row, idx, "Credit Usage") || null,
      balanceUpdated: cell(row, idx, "Balance updated") || null,
      originalBalance: cleanMoney(cell(row, idx, "Original balance")),
      paidOff: cell(row, idx, "Paid off") || null,
      monthlyPayment: cleanMoney(cell(row, idx, "Monthly payment")),
      lastPaymentDate: cell(row, idx, "Last Payment Date") || null,
      terms: cell(row, idx, "Terms") || null,
      creditAccountCategory: inferAccountCategory(classification, accountType) as any,
      dispute: cell(row, idx, "Dispute") || null,
    };
  }).filter((row) => row.accountName);
}

function parseSummaryImport(raw: string, reportId: number, bureau: Bureau) {
  const rows = parseTSV(raw);
  if (rows.length < 2) throw new Error("Paste the summary header row and one summary data row.");
  const idx = headerIndex(rows[0]);
  const row = rows[1];
  const intOrNull = (value: string) => {
    const n = parseInt(value.replace(/[^0-9-]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };
  return {
    reportId,
    bureau,
    reportDate: cell(row, idx, "Date Credit Report Generated") || cell(row, idx, "Date File Downloaded") || null,
    ficoScore: intOrNull(cell(row, idx, "FICO Score")),
    ficoScoreModel: cell(row, idx, "Credit Union") || null,
    evaluation: (cell(row, idx, "Assessment") as Evaluation) || null,
    openAccounts: intOrNull(cell(row, idx, "Open accounts")),
    selfReportedAccounts: intOrNull(cell(row, idx, "Self-reported accounts")),
    accountsEverLate: intOrNull(cell(row, idx, "Accounts ever late")),
    closedAccounts: intOrNull(cell(row, idx, "Closed accounts")),
    collectionsCount: intOrNull(cell(row, idx, "Collections")),
    creditUsagePercent: cell(row, idx, "Credit used") || null,
    creditUsed: cleanMoney(cell(row, idx, "Credit used")),
    creditLimit: cleanMoney(cell(row, idx, "Credit limit")),
    creditCardDebt: cleanMoney(cell(row, idx, "Credit card and credit line")),
    selfReportedBalance: cleanMoney(cell(row, idx, "Self-reported account balance")),
    loanDebt: cleanMoney(cell(row, idx, "Loan debt")),
    collectionsDebt: cleanMoney(cell(row, idx, "Collections debt")),
    totalDebt: cleanMoney(cell(row, idx, "Total debt")),
    averageAccountAge: cell(row, idx, "Average account age") || null,
    oldestAccount: cell(row, idx, "Oldest account") || null,
    reportPersonName: cell(row, idx, "Name", "Client Name") || null,
    reportAlsoKnownAs: cell(row, idx, "Also Known As") || null,
    reportYearOfBirth: cell(row, idx, "Year of Birth") || null,
    reportAddresses: cell(row, idx, "Addresses", "Addresses (can add more)") || null,
    reportEmployers: cell(row, idx, "Employers", "Employers (can add more)") || null,
  };
}

function parseInquiriesImport(raw: string) {
  const rows = parseTSV(raw);
  if (rows.length < 2) throw new Error("Paste the header row and at least one inquiry row.");
  const idx = headerIndex(rows[0]);
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    accountName: cell(row, idx, "Creditor / Inquiry Name") || null,
    inquiredOn: cell(row, idx, "Inquiry Date") || null,
    businessType: cell(row, idx, "Business Type") || null,
    address: cell(row, idx, "Address") || null,
    cityStateZip: cell(row, idx, "City / State / ZIP") || null,
    contactNumber: cell(row, idx, "Contact") || null,
    scheduledToRemainUntil: cell(row, idx, "Scheduled to Remain Until") || null,
    note: null,
  })).filter((row) => row.accountName);
}

export default function ClientDetailCreditReports({ clientId }: Props) {
  const utils = trpc.useUtils();
  const [selectedBureau, setSelectedBureau] = useState<Bureau>("Experian");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportForm, setReportForm] = useState(emptyReportForm);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [inquiriesOpen, setInquiriesOpen] = useState(false);
  const [summaryPaste, setSummaryPaste] = useState("");
  const [accountsPaste, setAccountsPaste] = useState("");
  const [inquiriesPaste, setInquiriesPaste] = useState("");
  const [accountView, setAccountView] = useState<"Open" | "Closed">("Open");

  const { data: reports, isLoading } = trpc.admin.getCreditReports.useQuery({ clientId });
  const normalizedReports = useMemo(() => (reports ?? []).map((report: any) => ({ ...report, normalizedBureau: normalizeBureau(report.bureau) })), [reports]);
  const selectedReport = useMemo(
    () => normalizedReports.find((report: any) => report.normalizedBureau === selectedBureau) ?? null,
    [normalizedReports, selectedBureau],
  );

  useEffect(() => {
    if (!normalizedReports.length) return;
    if (selectedReport) return;
    const first = normalizedReports.find((report: any) => report.normalizedBureau) ?? normalizedReports[0];
    const normalized = normalizeBureau(first?.bureau);
    if (normalized) setSelectedBureau(normalized);
  }, [normalizedReports, selectedReport]);

  const reportId = selectedReport?.id ?? null;
  const { data: accounts, isLoading: accountsLoading } = trpc.admin.getCreditAccounts.useQuery(
    { clientId, creditReportId: reportId },
    { enabled: !!reportId },
  );
  const { data: inquiries, isLoading: inquiriesLoading } = trpc.admin.getInquiries.useQuery(
    { creditReportId: reportId ?? 0 },
    { enabled: !!reportId },
  );

  const createReport = trpc.admin.createCreditReport.useMutation({
    onSuccess: async () => {
      await utils.admin.getCreditReports.invalidate({ clientId });
      toast.success("Credit report saved");
      setShowReportDialog(false);
    },
    onError: (error) => toast.error(error.message),
  });
  const updateReport = trpc.admin.updateCreditReport.useMutation({
    onSuccess: async () => {
      await utils.admin.getCreditReports.invalidate({ clientId });
      toast.success("Credit report updated");
      setShowReportDialog(false);
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteReport = trpc.admin.deleteCreditReport.useMutation({
    onSuccess: async () => {
      await utils.admin.getCreditReports.invalidate({ clientId });
      toast.success("Credit report deleted");
    },
    onError: (error) => toast.error(error.message),
  });
  const importSummary = trpc.admin.importCreditSummary.useMutation({
    onSuccess: async () => {
      await utils.admin.getCreditReports.invalidate({ clientId });
      toast.success("Summary imported");
      setSummaryOpen(false);
      setSummaryPaste("");
    },
    onError: (error) => toast.error(error.message),
  });
  const importAccounts = trpc.admin.importCreditAccounts.useMutation({
    onSuccess: async () => {
      if (reportId) await utils.admin.getCreditAccounts.invalidate({ clientId, creditReportId: reportId });
      toast.success("Accounts imported");
      setAccountsOpen(false);
      setAccountsPaste("");
    },
    onError: (error) => toast.error(error.message),
  });
  const importInquiries = trpc.admin.importInquiries.useMutation({
    onSuccess: async () => {
      if (reportId) await utils.admin.getInquiries.invalidate({ creditReportId: reportId });
      toast.success("Inquiries imported");
      setInquiriesOpen(false);
      setInquiriesPaste("");
    },
    onError: (error) => toast.error(error.message),
  });

  const openAccountsData = useMemo(() => ((accounts ?? []) as any[]).filter((row) => (row.openClosed || "").toLowerCase() === "open"), [accounts]);
  const closedAccountsData = useMemo(() => ((accounts ?? []) as any[]).filter((row) => (row.openClosed || "").toLowerCase() === "closed"), [accounts]);
  const visibleAccounts = accountView === "Open" ? openAccountsData : closedAccountsData;

  const summaryItems = [
    ["FICO Score", selectedReport?.ficoScore],
    ["Assessment", selectedReport?.evaluation],
    ["Date Report Generated", selectedReport?.reportDate],
    ["Open accounts", selectedReport?.openAccounts],
    ["Self-reported accounts", selectedReport?.selfReportedAccounts],
    ["Closed accounts", selectedReport?.closedAccounts],
    ["Collections", selectedReport?.collectionsCount],
    ["Credit used", formatMoney(selectedReport?.creditUsed)],
    ["Credit limit", formatMoney(selectedReport?.creditLimit)],
    ["Credit card and credit line", formatMoney(selectedReport?.creditCardDebt)],
    ["Self-reported account balance", formatMoney(selectedReport?.selfReportedBalance)],
    ["Loan debt", formatMoney(selectedReport?.loanDebt)],
    ["Collections debt", formatMoney(selectedReport?.collectionsDebt)],
    ["Total debt", formatMoney(selectedReport?.totalDebt)],
    ["Average account age", selectedReport?.averageAccountAge],
    ["Oldest account", selectedReport?.oldestAccount],
  ];

  if (isLoading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const saveReport = () => {
    const payload = {
      clientProfileId: clientId,
      bureau: selectedBureau,
      reportDate: reportForm.reportDate || null,
      ficoScore: reportForm.ficoScore ? parseInt(reportForm.ficoScore, 10) : null,
      ficoScoreModel: reportForm.ficoScoreModel || null,
      evaluation: (reportForm.evaluation as Evaluation) || null,
    };
    if (selectedReport) updateReport.mutate({ id: selectedReport.id, ...payload });
    else createReport.mutate(payload);
  };

  const startEditReport = () => {
    setReportForm({
      bureau: selectedBureau,
      reportDate: selectedReport?.reportDate || "",
      ficoScore: selectedReport?.ficoScore?.toString() || "",
      ficoScoreModel: selectedReport?.ficoScoreModel || "",
      evaluation: selectedReport?.evaluation || "",
    });
    setShowReportDialog(true);
  };

  const requireReport = () => {
    if (!selectedReport) {
      toast.error(`Create the ${selectedBureau} report first.`);
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {BUREAUS.map((bureau) => (
                <Button
                  key={bureau}
                  variant={selectedBureau === bureau ? "default" : "outline"}
                  onClick={() => setSelectedBureau(bureau)}
                  className="min-w-32"
                >
                  {bureau}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={startEditReport}>
                {selectedReport ? <><Pencil className="mr-2 h-4 w-4" />Edit Report</> : <><Plus className="mr-2 h-4 w-4" />Create Report</>}
              </Button>
              {selectedReport && (
                <Button variant="outline" className="text-destructive" onClick={() => deleteReport.mutate({ id: selectedReport.id })}>
                  <Trash2 className="mr-2 h-4 w-4" />Delete Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{selectedBureau} Credit Summary</CardTitle>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{selectedReport?.reportDate || "No report date"}</Badge>
                <Badge variant="outline">{selectedReport ? "Report ready" : "No report yet"}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={() => requireReport() && setSummaryOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />Import Summary
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedReport ? (
            <p className="text-sm text-muted-foreground">No {selectedBureau} report exists yet. Create it first, then import the summary, accounts, and inquiries for that bureau.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryItems.map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold">{formatText(value as any)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Personal Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedReport ? (
            <p className="text-sm text-muted-foreground">No personal information available yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-3"><p className="text-xs uppercase text-muted-foreground">Name</p><p className="mt-1 text-sm font-medium">{formatText(selectedReport.reportPersonName)}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs uppercase text-muted-foreground">Also Known As</p><p className="mt-1 text-sm font-medium">{formatText(selectedReport.reportAlsoKnownAs)}</p></div>
                <div className="rounded-lg border p-3"><p className="text-xs uppercase text-muted-foreground">Year of Birth</p><p className="mt-1 text-sm font-medium">{formatText(selectedReport.reportYearOfBirth)}</p></div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Addresses</p>
                  <div className="mt-2 space-y-2">
                    {splitMultiValue(selectedReport.reportAddresses).length ? splitMultiValue(selectedReport.reportAddresses).map((item, index) => (
                      <div key={index} className="rounded-md bg-muted/30 p-2 text-sm">{item}</div>
                    )) : <p className="text-sm text-muted-foreground">—</p>}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Employers</p>
                  <div className="mt-2 space-y-2">
                    {splitMultiValue(selectedReport.reportEmployers).length ? splitMultiValue(selectedReport.reportEmployers).map((item, index) => (
                      <div key={index} className="rounded-md bg-muted/30 p-2 text-sm">{item}</div>
                    )) : <p className="text-sm text-muted-foreground">—</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Inquiries</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Separate table below personal information for the selected bureau.</p>
            </div>
            <Button variant="outline" onClick={() => requireReport() && setInquiriesOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />Import Inquiries
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inquiriesLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : !selectedReport ? (
            <p className="text-sm text-muted-foreground">Create the report first.</p>
          ) : !(inquiries as any[])?.length ? (
            <p className="text-sm text-muted-foreground">No inquiries imported for this bureau.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creditor / Inquiry Name</TableHead>
                    <TableHead>Inquiry Date</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City / State / ZIP</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Scheduled to Remain Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inquiries as any[]).map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>{formatText(inquiry.accountName)}</TableCell>
                      <TableCell>{formatText(inquiry.inquiredOn)}</TableCell>
                      <TableCell>{formatText(inquiry.businessType)}</TableCell>
                      <TableCell className="min-w-56 whitespace-normal">{formatText(inquiry.address)}</TableCell>
                      <TableCell>{formatText(inquiry.cityStateZip)}</TableCell>
                      <TableCell>{formatText(inquiry.contactNumber)}</TableCell>
                      <TableCell>{formatText(inquiry.scheduledToRemainUntil)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Accounts</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">One table for the selected bureau. Import replaces existing accounts for that bureau only.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-md border overflow-hidden">
                <Button variant={accountView === "Open" ? "default" : "ghost"} onClick={() => setAccountView("Open")} className="rounded-none">Open ({openAccountsData.length})</Button>
                <Button variant={accountView === "Closed" ? "default" : "ghost"} onClick={() => setAccountView("Closed")} className="rounded-none">Closed ({closedAccountsData.length})</Button>
              </div>
              <Button variant="outline" onClick={() => requireReport() && setAccountsOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />Import Accounts
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {accountsLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : !selectedReport ? (
            <p className="text-sm text-muted-foreground">Create the report first.</p>
          ) : !visibleAccounts.length ? (
            <p className="text-sm text-muted-foreground">No {accountView.toLowerCase()} accounts imported for this bureau.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empower Type</TableHead>
                    <TableHead>Account name</TableHead>
                    <TableHead>Account number</TableHead>
                    <TableHead>Date opened</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Credit Usage</TableHead>
                    <TableHead>Monthly payment</TableHead>
                    <TableHead>Responsibility</TableHead>
                    <TableHead>Dispute</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAccounts.map((account: any) => (
                    <TableRow key={account.id}>
                      <TableCell>{formatText(account.creditAccountCategory)}</TableCell>
                      <TableCell>{formatText(account.accountName)}</TableCell>
                      <TableCell>{formatText(account.accountNumber)}</TableCell>
                      <TableCell>{formatText(account.dateOpened)}</TableCell>
                      <TableCell>{formatText(account.status)}</TableCell>
                      <TableCell>{formatMoney(account.balance)}</TableCell>
                      <TableCell>{formatMoney(account.creditLimit)}</TableCell>
                      <TableCell>{formatText(account.creditUsage)}</TableCell>
                      <TableCell>{formatMoney(account.monthlyPayment)}</TableCell>
                      <TableCell>{formatText(account.responsibility)}</TableCell>
                      <TableCell className="min-w-40 whitespace-normal">{formatText(account.dispute)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedReport ? `Edit ${selectedBureau} report` : `Create ${selectedBureau} report`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1"><Label>Bureau</Label><Input value={selectedBureau} disabled /></div>
            <div className="space-y-1"><Label>Report Date</Label><Input value={reportForm.reportDate} onChange={(e) => setReportForm((prev) => ({ ...prev, reportDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>FICO Score</Label><Input value={reportForm.ficoScore} onChange={(e) => setReportForm((prev) => ({ ...prev, ficoScore: e.target.value }))} /></div>
            <div className="space-y-1"><Label>FICO Model / Credit Union</Label><Input value={reportForm.ficoScoreModel} onChange={(e) => setReportForm((prev) => ({ ...prev, ficoScoreModel: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Assessment</Label><Input value={reportForm.evaluation} onChange={(e) => setReportForm((prev) => ({ ...prev, evaluation: e.target.value as Evaluation | "" }))} placeholder="Poor / Fair / Good / Very Good / Exceptional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button onClick={saveReport} disabled={createReport.isPending || updateReport.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import {selectedBureau} Summary</DialogTitle>
            <DialogDescription>Paste one header row and one data row from Excel or Google Sheets. This replaces the summary data for {selectedBureau} only.</DialogDescription>
          </DialogHeader>
          <Textarea rows={12} value={summaryPaste} onChange={(e) => setSummaryPaste(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSummaryOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!selectedReport) return;
              try {
                importSummary.mutate(parseSummaryImport(summaryPaste, selectedReport.id, selectedBureau));
              } catch (error: any) {
                toast.error(error.message);
              }
            }} disabled={importSummary.isPending}>Import Summary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={accountsOpen} onOpenChange={setAccountsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Import {selectedBureau} Accounts</DialogTitle>
            <DialogDescription>Paste the full accounts table including the header row. Existing accounts for {selectedBureau} will be replaced.</DialogDescription>
          </DialogHeader>
          <Textarea rows={14} value={accountsPaste} onChange={(e) => setAccountsPaste(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountsOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!selectedReport) return;
              try {
                importAccounts.mutate({ reportId: selectedReport.id, clientProfileId: clientId, rows: parseAccountsImport(accountsPaste, selectedReport) });
              } catch (error: any) {
                toast.error(error.message);
              }
            }} disabled={importAccounts.isPending}>Import Accounts</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inquiriesOpen} onOpenChange={setInquiriesOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Import {selectedBureau} Inquiries</DialogTitle>
            <DialogDescription>Paste the inquiries table including the header row. Existing inquiries for {selectedBureau} will be replaced.</DialogDescription>
          </DialogHeader>
          <Textarea rows={14} value={inquiriesPaste} onChange={(e) => setInquiriesPaste(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInquiriesOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!selectedReport) return;
              try {
                importInquiries.mutate({ reportId: selectedReport.id, clientProfileId: clientId, rows: parseInquiriesImport(inquiriesPaste) });
              } catch (error: any) {
                toast.error(error.message);
              }
            }} disabled={importInquiries.isPending}>Import Inquiries</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
