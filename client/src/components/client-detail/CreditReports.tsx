import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardPaste, Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
  clientId: number;
  clientBusinessId?: string | null;
}

type Bureau = "Experian" | "Transunion" | "Equifax";
const BUREAUS: Bureau[] = ["Experian", "Transunion", "Equifax"];
const EVALUATIONS = ["Poor", "Fair", "Good", "Very Good", "Exceptional"] as const;
type Evaluation = (typeof EVALUATIONS)[number];
const CATEGORIES = ["Cards", "Car", "House", "Secured Loan", "Unsecured Loan", "Others"] as const;
type Category = (typeof CATEGORIES)[number];

type SummaryImport = {
  reportDate?: string;
  ficoScore?: string;
  ficoScoreModel?: string;
  evaluation?: string;
  openAccounts?: string;
  selfReportedAccounts?: string;
  closedAccounts?: string;
  collectionsCount?: string;
  averageAccountAge?: string;
  oldestAccount?: string;
  creditUsagePercent?: string;
  creditUsed?: string;
  creditLimit?: string;
  creditCardDebt?: string;
  selfReportedBalance?: string;
  loanDebt?: string;
  collectionsDebt?: string;
  totalDebt?: string;
  reportPersonName?: string;
  reportAlsoKnownAs?: string;
  reportYearOfBirth?: string;
  reportAddresses?: string;
  reportEmployers?: string;
};

type ImportedAccount = {
  accountName: string;
  accountNumber?: string;
  originalCreditor?: string;
  companySold?: string;
  dateOpened?: string;
  openClosed?: string;
  statusUpdated?: string;
  accountType?: string;
  status?: string;
  balance?: string;
  creditLimit?: string;
  creditUsage?: string;
  balanceUpdated?: string;
  originalBalance?: string;
  paidOff?: string;
  monthlyPayment?: string;
  lastPaymentDate?: string;
  terms?: string;
  responsibility?: string;
  dispute?: string;
  creditAccountCategory?: Category;
};

type ImportedInquiry = {
  accountName: string;
  note?: string;
};

function parseNumberString(value?: string) {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.-]/g, "").trim();
  if (!cleaned) return null;
  const num = parseInt(cleaned, 10);
  return Number.isNaN(num) ? null : num;
}

function parseMoneyString(value?: string) {
  if (!value) return null;
  const cleaned = value.replace(/[$,]/g, "").trim();
  return cleaned || null;
}

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "number" ? value : Number(String(value).replace(/[$,]/g, ""));
  if (Number.isNaN(num)) return String(value);
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: string | null | undefined) {
  if (!value) return "—";
  return String(value).includes("%") ? String(value) : `${value}%`;
}

function normalizeLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function guessCategory(accountType?: string) {
  const value = (accountType || "").toLowerCase();
  if (!value) return "Others" as Category;
  if (/(credit card|charge card|revolving|line of credit|credit line)/.test(value)) return "Cards";
  if (/(auto|car|lease)/.test(value)) return "Car";
  if (/(mortgage|home|house|heloc)/.test(value)) return "House";
  if (/secured/.test(value)) return "Secured Loan";
  if (/(installment|loan|student|personal|unsecured)/.test(value)) return "Unsecured Loan";
  return "Others";
}

function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportReportContent(clientName: string, bureau: Bureau, report: any | null, accounts: any[], inquiries: any[]) {
  const lines: string[] = [];
  const pushPair = (label: string, value: string | number | null | undefined) => {
    lines.push(`${label},${JSON.stringify(value ?? "")}`);
  };

  pushPair("Client Name", clientName);
  pushPair("Credit Bureau", bureau);
  pushPair("FICO Score", report?.ficoScore ?? "");
  pushPair("Assessment", report?.evaluation ?? "");
  pushPair("Date Credit Report Generated", report?.reportDate ?? "");
  lines.push("Account summary,");
  pushPair("Open accounts", report?.openAccounts ?? "");
  pushPair("Self-reported accounts", report?.selfReportedAccounts ?? "");
  pushPair("Closed accounts", report?.closedAccounts ?? "");
  pushPair("Collections", report?.collectionsCount ?? "");
  pushPair("Credit used", report?.creditUsed ?? "");
  pushPair("Credit limit", report?.creditLimit ?? "");
  lines.push("Debt Summary,");
  pushPair("Credit card and credit line", report?.creditCardDebt ?? "");
  pushPair("Self-reported account balance", report?.selfReportedBalance ?? "");
  pushPair("Loan debt", report?.loanDebt ?? "");
  pushPair("Collections debt", report?.collectionsDebt ?? "");
  pushPair("Total debt", report?.totalDebt ?? "");
  pushPair("Average account age", report?.averageAccountAge ?? "");
  pushPair("Oldest account", report?.oldestAccount ?? "");
  lines.push("Personal Information,");
  pushPair("Name", report?.reportPersonName ?? "");
  pushPair("Also Known As", report?.reportAlsoKnownAs ?? "");
  pushPair("Year of Birth", report?.reportYearOfBirth ?? "");
  pushPair("Addresses", report?.reportAddresses ?? "");
  pushPair("Employers", report?.reportEmployers ?? "");
  if (inquiries.length) {
    lines.push("Inquiries,");
    inquiries.forEach((inq, idx) => pushPair(`Account ${idx + 1}`, inq.accountName || inq.note || ""));
  }
  lines.push("");
  lines.push([
    "Account name",
    "Account number",
    "Original creditor",
    "Company sold",
    "Date opened",
    "Open/closed",
    "Status updated",
    "Account type",
    "Status",
    "Balance",
    "Credit Limit",
    "Credit Usage",
    "Balance updated",
    "Original balance",
    "Paid off",
    "Monthly payment",
    "Last Payment Date",
    "Terms",
    "Responsibility",
    "Dispute",
  ].join(","));
  accounts.forEach((acc) => {
    lines.push([
      acc.accountName ?? "",
      acc.accountNumber ?? "",
      "",
      "",
      acc.dateOpened ?? "",
      acc.openClosed ?? "",
      acc.statusUpdated ?? "",
      acc.accountType ?? "",
      acc.status ?? "",
      acc.balance ?? "",
      acc.creditLimit ?? "",
      acc.creditUsage ?? "",
      acc.balanceUpdated ?? "",
      acc.originalBalance ?? "",
      acc.paidOff ?? "",
      acc.monthlyPayment ?? "",
      acc.lastPaymentDate ?? "",
      acc.terms ?? "",
      acc.responsibility ?? "",
      acc.dispute ?? "",
    ].map((v) => JSON.stringify(v ?? "")).join(","));
  });
  return lines.join("\n");
}

function templateContent(bureau: Bureau) {
  return exportReportContent("CLIENT NAME HERE", bureau, {
    reportDate: "2026-02-26",
    ficoScore: "806",
    evaluation: "Very Good",
    openAccounts: "14",
    selfReportedAccounts: "2",
    closedAccounts: "8",
    collectionsCount: "0",
    creditUsed: "12000",
    creditLimit: "50000",
    creditCardDebt: "8000",
    selfReportedBalance: "0",
    loanDebt: "5000",
    collectionsDebt: "0",
    totalDebt: "13000",
    averageAccountAge: "6 years",
    oldestAccount: "10 years",
    reportPersonName: "Client Name",
    reportAlsoKnownAs: "",
    reportYearOfBirth: "1989",
    reportAddresses: "123 Main St",
    reportEmployers: "Employer Name",
  }, [
    {
      accountName: "Bank of America",
      accountNumber: "1234XXXXXXXX",
      dateOpened: "2020-10-20",
      openClosed: "Open",
      statusUpdated: "2026-02-26",
      accountType: "Credit card",
      status: "Current",
      balance: "4019",
      creditLimit: "5200",
      creditUsage: "77%",
      balanceUpdated: "2026-02-26",
      originalBalance: "",
      paidOff: "",
      monthlyPayment: "95",
      lastPaymentDate: "",
      terms: "Revolving",
      responsibility: "Individual",
      dispute: "",
    },
  ], []);
}

function splitRow(line: string) {
  return line.includes("\t")
    ? line.split("\t").map((cell) => cell.trim())
    : line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

function parseImportedReport(raw: string) {
  const lines = raw.split(/\r?\n/).map((line) => line.trimEnd());
  const summary: SummaryImport = {};
  const inquiries: ImportedInquiry[] = [];
  const accounts: ImportedAccount[] = [];

  const summaryMap: Record<string, keyof SummaryImport> = {
    "date credit report generated": "reportDate",
    "fico score": "ficoScore",
    "fico score model": "ficoScoreModel",
    "assessment": "evaluation",
    "open accounts": "openAccounts",
    "self reported accounts": "selfReportedAccounts",
    "closed accounts": "closedAccounts",
    "collections": "collectionsCount",
    "collections count": "collectionsCount",
    "credit used": "creditUsed",
    "credit limit": "creditLimit",
    "credit usage percent": "creditUsagePercent",
    "credit usage": "creditUsagePercent",
    "credit card and credit line": "creditCardDebt",
    "self reported account balance": "selfReportedBalance",
    "loan debt": "loanDebt",
    "collections debt": "collectionsDebt",
    "total debt": "totalDebt",
    "average account age": "averageAccountAge",
    "oldest account": "oldestAccount",
    "name": "reportPersonName",
    "also known as": "reportAlsoKnownAs",
    "year of birth": "reportYearOfBirth",
    "addresses can add more": "reportAddresses",
    "addresses": "reportAddresses",
    "employers can add more": "reportEmployers",
    "employers": "reportEmployers",
  };

  let accountHeaderIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const row = splitRow(lines[i]);
    if (!row.some(Boolean)) continue;
    const first = normalizeLabel(row[0] || "");
    if (first === "account name") {
      accountHeaderIndex = i;
      break;
    }
    if (/^account\s+\d+$/.test(first) && (row[1] || "").trim()) {
      inquiries.push({ accountName: row[1].trim(), note: row[1].trim() });
      continue;
    }
    const field = summaryMap[first];
    if (field) summary[field] = (row[1] || "").trim();
  }

  if (accountHeaderIndex >= 0) {
    const header = splitRow(lines[accountHeaderIndex]).map((cell) => normalizeLabel(cell));
    const idx = (name: string) => header.findIndex((cell) => cell === name);
    const columns = {
      accountName: idx("account name"),
      accountNumber: idx("account number"),
      originalCreditor: idx("original creditor"),
      companySold: idx("company sold"),
      dateOpened: idx("date opened"),
      openClosed: idx("open closed"),
      statusUpdated: idx("status updated"),
      accountType: idx("account type"),
      status: idx("status"),
      balance: idx("balance"),
      creditLimit: idx("credit limit"),
      creditUsage: idx("credit usage"),
      balanceUpdated: idx("balance updated"),
      originalBalance: idx("original balance"),
      paidOff: idx("paid off"),
      monthlyPayment: idx("monthly payment"),
      lastPaymentDate: idx("last payment date"),
      terms: idx("terms"),
      responsibility: idx("responsibility"),
      dispute: idx("dispute"),
    };

    for (let i = accountHeaderIndex + 1; i < lines.length; i += 1) {
      const row = splitRow(lines[i]);
      if (!row.some(Boolean)) continue;
      const accountName = columns.accountName >= 0 ? (row[columns.accountName] || "").trim() : "";
      if (!accountName) continue;
      const account: ImportedAccount = {
        accountName,
        accountNumber: columns.accountNumber >= 0 ? row[columns.accountNumber] || "" : "",
        originalCreditor: columns.originalCreditor >= 0 ? row[columns.originalCreditor] || "" : "",
        companySold: columns.companySold >= 0 ? row[columns.companySold] || "" : "",
        dateOpened: columns.dateOpened >= 0 ? row[columns.dateOpened] || "" : "",
        openClosed: columns.openClosed >= 0 ? row[columns.openClosed] || "" : "",
        statusUpdated: columns.statusUpdated >= 0 ? row[columns.statusUpdated] || "" : "",
        accountType: columns.accountType >= 0 ? row[columns.accountType] || "" : "",
        status: columns.status >= 0 ? row[columns.status] || "" : "",
        balance: columns.balance >= 0 ? row[columns.balance] || "" : "",
        creditLimit: columns.creditLimit >= 0 ? row[columns.creditLimit] || "" : "",
        creditUsage: columns.creditUsage >= 0 ? row[columns.creditUsage] || "" : "",
        balanceUpdated: columns.balanceUpdated >= 0 ? row[columns.balanceUpdated] || "" : "",
        originalBalance: columns.originalBalance >= 0 ? row[columns.originalBalance] || "" : "",
        paidOff: columns.paidOff >= 0 ? row[columns.paidOff] || "" : "",
        monthlyPayment: columns.monthlyPayment >= 0 ? row[columns.monthlyPayment] || "" : "",
        lastPaymentDate: columns.lastPaymentDate >= 0 ? row[columns.lastPaymentDate] || "" : "",
        terms: columns.terms >= 0 ? row[columns.terms] || "" : "",
        responsibility: columns.responsibility >= 0 ? row[columns.responsibility] || "" : "",
        dispute: columns.dispute >= 0 ? row[columns.dispute] || "" : "",
      };
      account.creditAccountCategory = guessCategory(account.accountType);
      accounts.push(account);
    }
  }

  return { summary, inquiries, accounts };
}

function groupByCategory(accounts: any[]) {
  return {
    Cards: accounts.filter((a) => a.creditAccountCategory === "Cards"),
    Car: accounts.filter((a) => a.creditAccountCategory === "Car"),
    House: accounts.filter((a) => a.creditAccountCategory === "House"),
    "Secured Loan": accounts.filter((a) => a.creditAccountCategory === "Secured Loan"),
    "Unsecured Loan": accounts.filter((a) => a.creditAccountCategory === "Unsecured Loan"),
    Others: accounts.filter((a) => !a.creditAccountCategory || a.creditAccountCategory === "Others"),
  } as Record<Category, any[]>;
}

export default function ClientDetailCreditReports({ clientId }: Props) {
  const utils = trpc.useUtils();
  const [bureau, setBureau] = useState<Bureau>("Experian");
  const [accountView, setAccountView] = useState<"Open" | "Closed">("Open");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");

  const { data: reports, isLoading: reportsLoading } = trpc.admin.getCreditReports.useQuery({ clientId });
  const currentReport = useMemo(() => (reports || []).find((report: any) => (report.bureau || "") === bureau) ?? null, [reports, bureau]);
  const duplicateCount = useMemo(() => (reports || []).filter((report: any) => (report.bureau || "") === bureau).length, [reports, bureau]);

  const { data: allAccounts, isLoading: accountsLoading } = trpc.admin.getCreditAccounts.useQuery({ clientId, creditReportId: null });
  const currentAccounts = useMemo(() => {
    if (!currentReport || !allAccounts) return [];
    return allAccounts.filter((acc: any) => acc.creditReportId === currentReport.id);
  }, [allAccounts, currentReport]);

  const { data: inquiries = [] } = trpc.admin.getInquiries.useQuery(
    { creditReportId: currentReport?.id ?? 0 },
    { enabled: !!currentReport?.id },
  );

  const createReportMutation = trpc.admin.createCreditReport.useMutation();
  const updateReportMutation = trpc.admin.updateCreditReport.useMutation();
  const addCreditAccountMutation = trpc.admin.addCreditAccount.useMutation();
  const deleteCreditAccountMutation = trpc.admin.deleteCreditAccount.useMutation();
  const createInquiryMutation = trpc.admin.createInquiry.useMutation();
  const deleteInquiryMutation = trpc.admin.deleteInquiry.useMutation();

  const openAccounts = useMemo(() => currentAccounts.filter((acc: any) => (acc.openClosed || "").toLowerCase() !== "closed"), [currentAccounts]);
  const closedAccounts = useMemo(() => currentAccounts.filter((acc: any) => (acc.openClosed || "").toLowerCase() === "closed"), [currentAccounts]);
  const byCategory = useMemo(() => groupByCategory(accountView === "Open" ? openAccounts : closedAccounts), [accountView, openAccounts, closedAccounts]);

  const handleDownloadTemplate = () => {
    downloadText(`${bureau.toLowerCase()}-credit-report-template.csv`, templateContent(bureau));
  };

  const handleExport = () => {
    downloadText(`${bureau.toLowerCase()}-credit-report-export.csv`, exportReportContent("Current Client", bureau, currentReport, currentAccounts, inquiries));
  };

  const handleImport = async () => {
    try {
      if (!importText.trim()) {
        toast.error(`Paste the ${bureau} report data first.`);
        return;
      }
      const parsed = parseImportedReport(importText);
      if (!parsed.summary.reportDate && !parsed.accounts.length) {
        toast.error("Could not read the report. Use the template/export format.");
        return;
      }

      const reportPayload = {
        clientProfileId: clientId,
        bureau,
        reportDate: parsed.summary.reportDate || null,
        ficoScore: parseNumberString(parsed.summary.ficoScore),
        ficoScoreModel: parsed.summary.ficoScoreModel || null,
        evaluation: (EVALUATIONS.includes((parsed.summary.evaluation || "") as Evaluation) ? parsed.summary.evaluation : null) as Evaluation | null,
        openAccounts: parseNumberString(parsed.summary.openAccounts),
        selfReportedAccounts: parseNumberString(parsed.summary.selfReportedAccounts),
        closedAccounts: parseNumberString(parsed.summary.closedAccounts),
        collectionsCount: parseNumberString(parsed.summary.collectionsCount),
        averageAccountAge: parsed.summary.averageAccountAge || null,
        oldestAccount: parsed.summary.oldestAccount || null,
        creditUsagePercent: parsed.summary.creditUsagePercent || null,
        creditUsed: parseMoneyString(parsed.summary.creditUsed),
        creditLimit: parseMoneyString(parsed.summary.creditLimit),
        creditUsagePercentNoAU: null,
        creditUsedNoAU: null,
        creditLimitNoAU: null,
        creditCardDebt: parseMoneyString(parsed.summary.creditCardDebt),
        selfReportedBalance: parseMoneyString(parsed.summary.selfReportedBalance),
        loanDebt: parseMoneyString(parsed.summary.loanDebt),
        collectionsDebt: parseMoneyString(parsed.summary.collectionsDebt),
        totalDebt: parseMoneyString(parsed.summary.totalDebt),
        reportPersonName: parsed.summary.reportPersonName || null,
        reportAlsoKnownAs: parsed.summary.reportAlsoKnownAs || null,
        reportYearOfBirth: parsed.summary.reportYearOfBirth || null,
        reportAddresses: parsed.summary.reportAddresses || null,
        reportEmployers: parsed.summary.reportEmployers || null,
      };

      let reportId = currentReport?.id ?? null;
      if (reportId) {
        await updateReportMutation.mutateAsync({ id: reportId, ...reportPayload });
      } else {
        await createReportMutation.mutateAsync(reportPayload);
        const refreshed = await utils.admin.getCreditReports.fetch({ clientId });
        reportId = (refreshed || []).find((report: any) => (report.bureau || "") === bureau)?.id ?? null;
      }

      if (!reportId) throw new Error("Could not resolve the bureau report after import.");

      for (const account of currentAccounts) {
        await deleteCreditAccountMutation.mutateAsync({ id: account.id });
      }
      for (const inquiry of inquiries) {
        await deleteInquiryMutation.mutateAsync({ id: inquiry.id });
      }

      for (const account of parsed.accounts) {
        await addCreditAccountMutation.mutateAsync({
          clientProfileId: clientId,
          creditReportId: reportId,
          bureau,
          reportDate: reportPayload.reportDate,
          accountName: account.accountName || null,
          openClosed: account.openClosed || null,
          responsibility: account.responsibility || null,
          accountNumber: account.accountNumber || null,
          dateOpened: account.dateOpened || null,
          statusUpdated: account.statusUpdated || null,
          accountType: account.accountType || null,
          status: account.status || null,
          balance: parseMoneyString(account.balance),
          creditLimit: parseMoneyString(account.creditLimit),
          creditUsage: account.creditUsage || null,
          balanceUpdated: account.balanceUpdated || null,
          originalBalance: parseMoneyString(account.originalBalance),
          paidOff: account.paidOff || null,
          monthlyPayment: parseMoneyString(account.monthlyPayment),
          lastPaymentDate: account.lastPaymentDate || null,
          terms: account.terms || null,
          creditAccountCategory: account.creditAccountCategory || guessCategory(account.accountType),
          dispute: account.dispute || null,
        });
      }

      for (const inquiry of parsed.inquiries) {
        await createInquiryMutation.mutateAsync({
          creditReportId: reportId,
          clientProfileId: clientId,
          accountName: inquiry.accountName || null,
          inquiredOn: null,
          businessType: null,
          address: null,
          contactNumber: null,
          note: inquiry.note || null,
        });
      }

      await Promise.all([
        utils.admin.getCreditReports.invalidate({ clientId }),
        utils.admin.getCreditAccounts.invalidate({ clientId, creditReportId: null }),
        utils.admin.getInquiries.invalidate({ creditReportId: reportId }),
      ]);

      setShowImportDialog(false);
      setImportText("");
      toast.success(`${bureau} report replaced successfully.`);
    } catch (error: any) {
      toast.error(error?.message || `Failed to import ${bureau} report.`);
    }
  };

  if (reportsLoading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {BUREAUS.map((item) => (
                <Button key={item} size="sm" variant={bureau === item ? "default" : "outline"} onClick={() => setBureau(item)}>
                  {item}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="gap-1">
                <Download className="h-3.5 w-3.5" /> Template
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport} className="gap-1">
                <Download className="h-3.5 w-3.5" /> Export Data
              </Button>
              <Button size="sm" onClick={() => setShowImportDialog(true)} className="gap-1">
                <ClipboardPaste className="h-3.5 w-3.5" /> Import Bureau Report
              </Button>
            </div>
          </div>
          {duplicateCount > 1 && <p className="text-xs text-amber-600">Multiple {bureau} reports exist in the database. This page is using the newest one.</p>}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{bureau} Credit Report Summary</CardTitle>
            {currentReport ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">No report yet</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentReport ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No {bureau} report added yet. Use <span className="font-medium text-foreground">Import Bureau Report</span> to replace the current {bureau} summary and accounts in one step.</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-black p-4 text-white md:col-span-2">
                  <div className="text-2xl font-semibold">{bureau}</div>
                  <div className="mt-1 text-sm text-white/80">{currentReport.reportDate || "No Date"}</div>
                  <div className="mt-4 text-sm">FICO Score {currentReport.ficoScore || "—"}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Evaluation</div>
                  <div className="mt-2 text-lg font-semibold">{currentReport.evaluation || "Not Set"}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase text-muted-foreground">Credit Utilization</div>
                  <div className="mt-2 text-lg font-semibold">{formatPercent(currentReport.creditUsagePercent)}</div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Account Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Open Accounts</span><span>{currentReport.openAccounts ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Self-Reported Accounts</span><span>{currentReport.selfReportedAccounts ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Closed Accounts</span><span>{currentReport.closedAccounts ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Collections</span><span>{currentReport.collectionsCount ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Average Account Age</span><span>{currentReport.averageAccountAge || "—"}</span></div>
                    <div className="flex justify-between"><span>Oldest Account</span><span>{currentReport.oldestAccount || "—"}</span></div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Overall Credit Usage</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Credit Usage</span><span>{formatPercent(currentReport.creditUsagePercent)}</span></div>
                    <div className="flex justify-between"><span>Credit Used</span><span>{formatMoney(currentReport.creditUsed)}</span></div>
                    <div className="flex justify-between"><span>Credit Limit</span><span>{formatMoney(currentReport.creditLimit)}</span></div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Debt Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Credit Card & Credit Line Debt</span><span>{formatMoney(currentReport.creditCardDebt)}</span></div>
                    <div className="flex justify-between"><span>Self-Reported Account Balance</span><span>{formatMoney(currentReport.selfReportedBalance)}</span></div>
                    <div className="flex justify-between"><span>Loan Debt</span><span>{formatMoney(currentReport.loanDebt)}</span></div>
                    <div className="flex justify-between"><span>Collections Debt</span><span>{formatMoney(currentReport.collectionsDebt)}</span></div>
                    <div className="flex justify-between font-semibold"><span>Total Debt</span><span>{formatMoney(currentReport.totalDebt)}</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Credit Accounts</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={accountView === "Open" ? "default" : "outline"} onClick={() => setAccountView("Open")}>Open ({openAccounts.length})</Button>
              <Button size="sm" variant={accountView === "Closed" ? "default" : "outline"} onClick={() => setAccountView("Closed")}>Closed ({closedAccounts.length})</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : (
            CATEGORIES.map((category) => {
              const rows = byCategory[category];
              return (
                <div key={category} className="rounded-lg border">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2 text-sm font-medium">
                    <span>{category}</span>
                    <span className="text-xs text-muted-foreground">{rows.length} account{rows.length === 1 ? "" : "s"}</span>
                  </div>
                  {rows.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No {accountView.toLowerCase()} accounts in this category.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Account Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Credit Limit</TableHead>
                            <TableHead>Credit Usage</TableHead>
                            <TableHead>Date Opened</TableHead>
                            <TableHead>Monthly Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row: any) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.accountName || "—"}</TableCell>
                              <TableCell>{row.accountType || "—"}</TableCell>
                              <TableCell>{row.status || "—"}</TableCell>
                              <TableCell>{formatMoney(row.balance)}</TableCell>
                              <TableCell>{formatMoney(row.creditLimit)}</TableCell>
                              <TableCell>{row.creditUsage || "—"}</TableCell>
                              <TableCell>{row.dateOpened || "—"}</TableCell>
                              <TableCell>{formatMoney(row.monthlyPayment)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import {bureau} Report</DialogTitle>
            <DialogDescription>
              Paste the full {bureau} sheet here. Import will replace the current {bureau} summary, accounts, and inquiries for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              Use the exported file or template as your guide. This importer expects the summary section first and the account table below it.
            </div>
            <Textarea rows={18} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={templateContent(bureau)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={createReportMutation.isPending || updateReportMutation.isPending || addCreditAccountMutation.isPending}>
              Replace {bureau} Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
