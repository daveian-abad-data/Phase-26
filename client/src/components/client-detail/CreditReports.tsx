import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Edit2, CreditCard, ChevronDown, ChevronUp, Filter, Plus, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; clientBusinessId?: string | null; }

const CATEGORIES = ["Cards", "Car", "House", "Secured Loan", "Unsecured Loan", "Others"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<Category, { header: string; row: string }> = {
  "Cards":          { header: "bg-[#6B8DD6] text-white",   row: "bg-[#EEF2FB]" },
  "Car":            { header: "bg-[#D4A84B] text-white",   row: "bg-[#FDF6E3]" },
  "House":          { header: "bg-[#5BA08A] text-white",   row: "bg-[#EDF7F4]" },
  "Secured Loan":   { header: "bg-[#9B6BB5] text-white",   row: "bg-[#F5EEF9]" },
  "Unsecured Loan": { header: "bg-[#C0634D] text-white",   row: "bg-[#FBF0EE]" },
  "Others":         { header: "bg-[#7A8C99] text-white",   row: "bg-[#F0F3F5]" },
};

const OPEN_COLS: Record<Category, { label: string; key: string }[]> = {
  "Cards": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Credit Limit", key: "creditLimit" }, { label: "Balance", key: "balance" },
    { label: "Credit Usage", key: "creditUsage" }, { label: "Balance Updated", key: "balanceUpdated" },
    { label: "Monthly Payment", key: "monthlyPayment" }, { label: "Status", key: "status" },
  ],
  "Car": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Paid Off", key: "paidOff" }, { label: "Balance Updated", key: "balanceUpdated" },
    { label: "Monthly Payment", key: "monthlyPayment" }, { label: "Status", key: "status" },
  ],
  "House": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Paid Off", key: "paidOff" }, { label: "Balance Updated", key: "balanceUpdated" },
    { label: "Monthly Payment", key: "monthlyPayment" }, { label: "Status", key: "status" },
  ],
  "Secured Loan": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Paid Off", key: "paidOff" }, { label: "Balance Updated", key: "balanceUpdated" },
    { label: "Monthly Payment", key: "monthlyPayment" }, { label: "Status", key: "status" },
  ],
  "Unsecured Loan": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Paid Off", key: "paidOff" }, { label: "Balance Updated", key: "balanceUpdated" },
    { label: "Monthly Payment", key: "monthlyPayment" }, { label: "Status", key: "status" },
  ],
  "Others": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Paid Off", key: "paidOff" }, { label: "Balance Updated", key: "balanceUpdated" },
    { label: "Monthly Payment", key: "monthlyPayment" }, { label: "Status", key: "status" },
  ],
};

const CLOSED_COLS: Record<Category, { label: string; key: string }[]> = {
  "Cards": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Credit Limit", key: "creditLimit" }, { label: "Last Payment Date", key: "lastPaymentDate" },
  ],
  "Car": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Last Payment Date", key: "lastPaymentDate" },
  ],
  "House": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Last Payment Date", key: "lastPaymentDate" },
  ],
  "Secured Loan": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Last Payment Date", key: "lastPaymentDate" },
  ],
  "Unsecured Loan": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Last Payment Date", key: "lastPaymentDate" },
  ],
  "Others": [
    { label: "Date Opened", key: "dateOpened" }, { label: "Account Name", key: "accountName" },
    { label: "Account Type", key: "accountType" }, { label: "Responsibility", key: "responsibility" },
    { label: "Original Balance", key: "originalBalance" }, { label: "Balance", key: "balance" },
    { label: "Last Payment Date", key: "lastPaymentDate" },
  ],
};

const EVALUATION_CONFIG = {
  "Poor":       { color: "#DC2626", bg: "#FEE2E2", label: "Poor" },
  "Fair":       { color: "#EA580C", bg: "#FFEDD5", label: "Fair" },
  "Good":       { color: "#CA8A04", bg: "#FEF9C3", label: "Good" },
  "Very Good":  { color: "#16A34A", bg: "#DCFCE7", label: "Very Good" },
  "Exceptional":{ color: "#15803D", bg: "#BBF7D0", label: "Exceptional" },
} as const;
type Evaluation = keyof typeof EVALUATION_CONFIG;

// Pie chart SVG for credit utilization
function PieChart({ percent, color = "#6B8DD6", size = 80, textColor = "#000000" }: { percent: number; color?: string; size?: number; textColor?: string }) {
  const r = 30;
  const cx = 40;
  const cy = 40;
  const circumference = 2 * Math.PI * r;
  const p = Math.min(Math.max(percent, 0), 100);
  const dash = (p / 100) * circumference;
  const gap = circumference - dash;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill={textColor}>
        {p}%
      </text>
    </svg>
  );
}

const emptyReport = {
  bureau: "", reportDate: "", ficoScore: "", ficoScoreModel: "",
  evaluation: "" as Evaluation | "",
  openAccounts: "", selfReportedAccounts: "", closedAccounts: "", collectionsCount: "",
  averageAccountAge: "", oldestAccount: "",
  creditUsagePercent: "", creditUsed: "", creditLimit: "",
  creditUsagePercentNoAU: "", creditUsedNoAU: "", creditLimitNoAU: "",
  creditCardDebt: "", selfReportedBalance: "", loanDebt: "", collectionsDebt: "", totalDebt: "",
  reportPersonName: "", reportAlsoKnownAs: "", reportYearOfBirth: "", reportAddresses: "", reportEmployers: "",
};

const emptyAccount = {
  creditReportId: null as number | null,
  clientId: "", bureau: "", reportDate: "",
  accountName: "", openClosed: "Open", responsibility: "Individual", accountNumber: "",
  dateOpened: "", statusUpdated: "", accountType: "", status: "",
  balance: "", creditLimit: "", creditUsage: "", balanceUpdated: "",
  originalBalance: "", paidOff: "", monthlyPayment: "", lastPaymentDate: "",
  terms: "", creditAccountCategory: "" as Category | "", dispute: "",
};

const emptyInquiry = {
  accountName: "", inquiredOn: "", businessType: "", address: "", contactNumber: "", note: "",
};

export default function ClientDetailCreditReports({ clientId, clientBusinessId }: Props) {
  const utils = trpc.useUtils();
  const { data: reports, isLoading: reportsLoading } = trpc.admin.getCreditReports.useQuery({ clientId });

  const [filterBureau, setFilterBureau] = useState<string>("all");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [accountView, setAccountView] = useState<"Open" | "Closed">("Open");

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter(r => filterBureau === "all" || r.bureau === filterBureau);
  }, [reports, filterBureau]);

  const bureauOptions = useMemo(() => {
    if (!reports) return [];
    return Array.from(new Set(reports.map(r => r.bureau).filter(Boolean))) as string[];
  }, [reports]);
  
const openAccounts = filteredReports.filter((r) => r.openClosed === "Open");
const closedAccounts = filteredReports.filter((r) => r.openClosed === "Closed");

  const openByCategory = useMemo(() => groupByCategory(openAccounts), [openAccounts]);
  const closedByCategory = useMemo(() => groupByCategory(closedAccounts), [closedAccounts]);

  // Mutations
  const createReportMutation = trpc.admin.createCreditReport.useMutation({
    onSuccess: () => { utils.admin.getCreditReports.invalidate({ clientId }); setShowReportDialog(false); toast.success("Credit report added"); },
    onError: (err) => toast.error(err.message),
  });
  const updateReportMutation = trpc.admin.updateCreditReport.useMutation({
    onSuccess: () => { utils.admin.getCreditReports.invalidate({ clientId }); setShowReportDialog(false); toast.success("Report updated"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteReportMutation = trpc.admin.deleteCreditReport.useMutation({
    onSuccess: () => { utils.admin.getCreditReports.invalidate({ clientId }); toast.success("Report deleted"); },
    onError: (err) => toast.error(err.message),
  });
  const addAccountMutation = trpc.admin.addCreditAccount.useMutation({
    onSuccess: () => { utils.admin.getCreditAccounts.invalidate({ clientId }); setShowAccountDialog(false); toast.success("Account added"); },
    onError: (err) => toast.error(err.message),
  });
  const updateAccountMutation = trpc.admin.updateCreditAccount.useMutation({
    onSuccess: () => { utils.admin.getCreditAccounts.invalidate({ clientId }); setShowAccountDialog(false); toast.success("Account updated"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteAccountMutation = trpc.admin.deleteCreditAccount.useMutation({
    onSuccess: () => { utils.admin.getCreditAccounts.invalidate({ clientId }); toast.success("Account deleted"); },
    onError: (err) => toast.error(err.message),
  });
  const createInquiryMutation = trpc.admin.createInquiry.useMutation({
    onSuccess: () => { if (selectedReportId) utils.admin.getInquiries.invalidate({ creditReportId: selectedReportId }); setShowInquiryDialog(false); toast.success("Inquiry added"); },
    onError: (err) => toast.error(err.message),
  });
  const updateInquiryMutation = trpc.admin.updateInquiry.useMutation({
    onSuccess: () => { if (selectedReportId) utils.admin.getInquiries.invalidate({ creditReportId: selectedReportId }); setShowInquiryDialog(false); toast.success("Inquiry updated"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteInquiryMutation = trpc.admin.deleteInquiry.useMutation({
    onSuccess: () => { if (selectedReportId) utils.admin.getInquiries.invalidate({ creditReportId: selectedReportId }); toast.success("Inquiry deleted"); },
    onError: (err) => toast.error(err.message),
  });


  const parseBulkRows = (raw: string) => {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    const rows = lines.map((line) => line.split(/\t|,/).map((v) => v.trim()));
    const firstRow = rows[0].map((v) => v.toLowerCase());
    const hasHeader = firstRow.some((v) => ["account", "status", "balance", "limit", "bureau"].some((k) => v.includes(k)));
    const dataRows = hasHeader ? rows.slice(1) : rows;
    return dataRows.map((cols) => ({
      accountName: cols[0] || "",
      openClosed: cols[1] || "Open",
      accountType: cols[2] || "",
      status: cols[3] || "",
      balance: cols[4] || "",
      creditLimit: cols[5] || "",
      creditUsage: cols[6] || "",
      dateOpened: cols[7] || "",
      monthlyPayment: cols[8] || "",
      terms: cols[9] || "",
    })).filter((row) => row.accountName);
  };

  const handleBulkPasteImport = async () => {
    if (!selectedReportId) {
      toast.error("Select a bureau report first before importing rows.");
      return;
    }
    const rows = parseBulkRows(bulkPasteText);
    if (rows.length === 0) {
      toast.error("Paste at least one data row.");
      return;
    }
    const selectedReport = reports?.find((r) => r.id === selectedReportId);
    for (const row of rows) {
      await addAccountMutation.mutateAsync({
        clientProfileId: clientId,
        creditReportId: selectedReportId,
        bureau: selectedReport?.bureau || filterBureau,
        reportDate: selectedReport?.reportDate || null,
        accountName: row.accountName,
        openClosed: row.openClosed,
        accountType: row.accountType,
        status: row.status,
        balance: row.balance || null,
        creditLimit: row.creditLimit || null,
        creditUsage: row.creditUsage || null,
        dateOpened: row.dateOpened || null,
        monthlyPayment: row.monthlyPayment || null,
        terms: row.terms || null,
        creditAccountCategory: "Others",
      });
    }
    setBulkPasteText("");
    setShowBulkPasteDialog(false);
    toast.success(`Imported ${rows.length} account row${rows.length > 1 ? "s" : ""}`);
  };

  const openEditReport = (r: any) => {
    setEditingReportId(r.id);
    setReportForm({
      bureau: r.bureau || "", reportDate: r.reportDate || "",
      ficoScore: r.ficoScore?.toString() || "", ficoScoreModel: r.ficoScoreModel || "",
      evaluation: r.evaluation || "",
      openAccounts: r.openAccounts?.toString() || "",
      selfReportedAccounts: r.selfReportedAccounts?.toString() || "",
      closedAccounts: r.closedAccounts?.toString() || "",
      collectionsCount: r.collectionsCount?.toString() || "",
      averageAccountAge: r.averageAccountAge || "", oldestAccount: r.oldestAccount || "",
      creditUsagePercent: r.creditUsagePercent || "", creditUsed: r.creditUsed || "", creditLimit: r.creditLimit || "",
      creditUsagePercentNoAU: r.creditUsagePercentNoAU || "", creditUsedNoAU: r.creditUsedNoAU || "", creditLimitNoAU: r.creditLimitNoAU || "",
      creditCardDebt: r.creditCardDebt || "", selfReportedBalance: r.selfReportedBalance || "",
      loanDebt: r.loanDebt || "", collectionsDebt: r.collectionsDebt || "", totalDebt: r.totalDebt || "",
      reportPersonName: r.reportPersonName || "", reportAlsoKnownAs: r.reportAlsoKnownAs || "",
      reportYearOfBirth: r.reportYearOfBirth || "", reportAddresses: r.reportAddresses || "",
      reportEmployers: r.reportEmployers || "",
    });
    setShowReportDialog(true);
  };

  const openNewAccount = () => {
    setEditingAccountId(null);
    setAccountForm({ ...emptyAccount, clientId: clientBusinessId || "", creditReportId: selectedReportId, openClosed: accountView });
    setShowAccountDialog(true);
  };
  const openEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setAccountForm({
      creditReportId: acc.creditReportId ?? null,
      clientId: acc.clientId || clientBusinessId || "",
      bureau: acc.bureau || "", reportDate: acc.reportDate || "",
      accountName: acc.accountName || "", openClosed: acc.openClosed || "Open",
      responsibility: acc.responsibility || "Individual", accountNumber: acc.accountNumber || "",
      dateOpened: acc.dateOpened || "", statusUpdated: acc.statusUpdated || "",
      accountType: acc.accountType || "", status: acc.status || "",
      balance: acc.balance || "", creditLimit: acc.creditLimit || "",
      creditUsage: acc.creditUsage || "", balanceUpdated: acc.balanceUpdated || "",
      originalBalance: acc.originalBalance || "", paidOff: acc.paidOff || "",
      monthlyPayment: acc.monthlyPayment || "", lastPaymentDate: acc.lastPaymentDate || "",
      terms: acc.terms || "", creditAccountCategory: acc.creditAccountCategory || "",
      dispute: acc.dispute || "",
    });
    setShowAccountDialog(true);
  };

  const openNewInquiry = () => {
    setEditingInquiryId(null);
    setInquiryForm(emptyInquiry);
    setShowInquiryDialog(true);
  };
  const openEditInquiry = (inq: any) => {
    setEditingInquiryId(inq.id);
    setInquiryForm({
      accountName: inq.accountName || "", inquiredOn: inq.inquiredOn || "",
      businessType: inq.businessType || "", address: inq.address || "",
      contactNumber: inq.contactNumber || "", note: inq.note || "",
    });
    setShowInquiryDialog(true);
  };

  const saveReport = () => {
    const payload = {
      clientProfileId: clientId,
      bureau: reportForm.bureau || null, reportDate: reportForm.reportDate || null,
      ficoScore: reportForm.ficoScore ? parseInt(reportForm.ficoScore) : null,
      ficoScoreModel: reportForm.ficoScoreModel || null,
      evaluation: (reportForm.evaluation as Evaluation) || null,
      openAccounts: reportForm.openAccounts ? parseInt(reportForm.openAccounts) : null,
      selfReportedAccounts: reportForm.selfReportedAccounts ? parseInt(reportForm.selfReportedAccounts) : null,
      closedAccounts: reportForm.closedAccounts ? parseInt(reportForm.closedAccounts) : null,
      collectionsCount: reportForm.collectionsCount ? parseInt(reportForm.collectionsCount) : null,
      averageAccountAge: reportForm.averageAccountAge || null, oldestAccount: reportForm.oldestAccount || null,
      creditUsagePercent: reportForm.creditUsagePercent || null, creditUsed: reportForm.creditUsed || null,
      creditLimit: reportForm.creditLimit || null,
      creditUsagePercentNoAU: reportForm.creditUsagePercentNoAU || null,
      creditUsedNoAU: reportForm.creditUsedNoAU || null,
      creditLimitNoAU: reportForm.creditLimitNoAU || null,
      creditCardDebt: reportForm.creditCardDebt || null,
      selfReportedBalance: reportForm.selfReportedBalance || null,
      loanDebt: reportForm.loanDebt || null, collectionsDebt: reportForm.collectionsDebt || null,
      totalDebt: reportForm.totalDebt || null,
      reportPersonName: reportForm.reportPersonName || null,
      reportAlsoKnownAs: reportForm.reportAlsoKnownAs || null,
      reportYearOfBirth: reportForm.reportYearOfBirth || null,
      reportAddresses: reportForm.reportAddresses || null,
      reportEmployers: reportForm.reportEmployers || null,
    };
    if (editingReportId) updateReportMutation.mutate({ id: editingReportId, ...payload });
    else createReportMutation.mutate(payload);
  };

  const saveAccount = () => {
    const payload = {
      clientProfileId: clientId,
      creditReportId: accountForm.creditReportId,
      clientId: accountForm.clientId || null, bureau: accountForm.bureau || null,
      reportDate: accountForm.reportDate || null, accountName: accountForm.accountName || null,
      openClosed: accountForm.openClosed || null, responsibility: accountForm.responsibility || null,
      accountNumber: accountForm.accountNumber || null, dateOpened: accountForm.dateOpened || null,
      statusUpdated: accountForm.statusUpdated || null, accountType: accountForm.accountType || null,
      status: accountForm.status || null, balance: accountForm.balance || null,
      creditLimit: accountForm.creditLimit || null, creditUsage: accountForm.creditUsage || null,
      balanceUpdated: accountForm.balanceUpdated || null, originalBalance: accountForm.originalBalance || null,
      paidOff: accountForm.paidOff || null, monthlyPayment: accountForm.monthlyPayment || null,
      lastPaymentDate: accountForm.lastPaymentDate || null, terms: accountForm.terms || null,
      creditAccountCategory: (accountForm.creditAccountCategory as Category) || null,
      dispute: accountForm.dispute || null,
    };
    if (editingAccountId) updateAccountMutation.mutate({ id: editingAccountId, ...payload });
    else addAccountMutation.mutate(payload);
  };

  const saveInquiry = () => {
    if (!selectedReportId) return;
    const payload = {
      creditReportId: selectedReportId,
      clientProfileId: clientId,
      accountName: inquiryForm.accountName || null,
      inquiredOn: inquiryForm.inquiredOn || null,
      businessType: inquiryForm.businessType || null,
      address: inquiryForm.address || null,
      contactNumber: inquiryForm.contactNumber || null,
      note: inquiryForm.note || null,
    };
    if (editingInquiryId) updateInquiryMutation.mutate({ id: editingInquiryId, ...payload });
    else createInquiryMutation.mutate(payload);
  };

  const setR = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReportForm(p => ({ ...p, [f]: e.target.value }));
  const setA = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAccountForm(p => ({ ...p, [f]: e.target.value }));
  const setI = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInquiryForm(p => ({ ...p, [f]: e.target.value }));

  const fmtMoney = (v: string | null | undefined) => v ? `$${parseFloat(v).toLocaleString()}` : "—";
  const fmt = (v: string | null | undefined) => v || "—";
  const parsePct = (v: string | null | undefined): number => {
    if (!v) return 0;
    return parseFloat(v.replace("%", "")) || 0;
  };

  if (reportsLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const CategoryTable = ({ cat, cols, accs }: { cat: Category; cols: { label: string; key: string }[]; accs: any[] }) => {
    const colors = CATEGORY_COLORS[cat];
    return (
      <div className="rounded-lg overflow-hidden border">
        <div className={`px-4 py-2 flex items-center justify-between ${colors.header}`}>
          <span className="text-sm font-semibold tracking-wide">{cat}</span>
          <span className="text-xs opacity-80">{accs.length} account{accs.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {cols.map(c => <TableHead key={c.key} className="text-xs whitespace-nowrap py-2">{c.label}</TableHead>)}
                <TableHead className="text-xs w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={cols.length + 1} className={`text-center text-xs text-muted-foreground italic py-3 ${colors.row}`}>
                    No accounts in this category
                  </TableCell>
                </TableRow>
              ) : accs.map((acc, idx) => (
                <TableRow key={acc.id} className={idx % 2 === 0 ? colors.row : "bg-white"}>
                  {cols.map(c => (
                    <TableCell key={c.key} className="text-xs whitespace-nowrap py-2">
                      {c.key === "balance" || c.key === "creditLimit" || c.key === "originalBalance" || c.key === "monthlyPayment"
                        ? fmtMoney((acc as any)[c.key])
                        : fmt((acc as any)[c.key])}
                    </TableCell>
                  ))}
                  <TableCell className="py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditAccount(acc)}><Edit2 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setConfirmDeleteAccountId(acc.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const isOpen = accountView === "Open";
  const viewBg = isOpen ? "bg-[#D6EED7]" : "bg-[#F5D9D9]";
  const byCategory = isOpen ? openByCategory : closedByCategory;
  const cols = isOpen ? OPEN_COLS : CLOSED_COLS;
  const viewCount = isOpen ? openAccounts.length : closedAccounts.length;

  return (
    <div className="space-y-6">
      {/* Delete Confirmations */}
      <AlertDialog open={confirmDeleteReportId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteReportId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Report?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this credit report. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteReportId !== null) { deleteReportMutation.mutate({ id: confirmDeleteReportId }); setConfirmDeleteReportId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteAccountId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteAccountId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Account?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this credit account. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteAccountId !== null) { deleteAccountMutation.mutate({ id: confirmDeleteAccountId }); setConfirmDeleteAccountId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteInquiryId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteInquiryId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this inquiry record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteInquiryId !== null) { deleteInquiryMutation.mutate({ id: confirmDeleteInquiryId }); setConfirmDeleteInquiryId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Bureaus</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filterBureau === "all" ? "default" : "outline"} onClick={() => { setFilterBureau("all"); setSelectedReportId(null); }}>All</Button>
            {["Experian", "Transunion", "Equifax"].map((bureau) => (
              <Button key={bureau} size="sm" variant={filterBureau === bureau ? "default" : "outline"} onClick={() => { setFilterBureau(bureau); setSelectedReportId(null); }}>{bureau}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Credit Report Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-left" onClick={() => setExpandedSummary(v => !v)}>
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Credit Report Summary</CardTitle>
              {expandedSummary ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </CardHeader>
        {expandedSummary && (
          <CardContent className="space-y-6">
            {filteredReports.length === 0 && (
              reports && reports.length > 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No reports match the selected bureau.</p>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl overflow-hidden opacity-60">
                  {/* Empty Block 1 */}
                  <div className="relative" style={{ backgroundColor: "#000" }}>
                    <div className="flex items-center justify-between px-5 pt-4 pb-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-500 text-xl font-bold tracking-wide">Credit Bureau</span>
                        <span className="text-slate-600 text-xs">No Date</span>
                      </div>
                      <span className="text-slate-600 text-xs italic">No report added yet</span>
                    </div>
                    <div className="flex items-center justify-center gap-10 px-5 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-500 text-xs uppercase tracking-widest">FICO Score</span>
                        <span className="text-slate-600 font-extrabold" style={{ fontSize: "3.5rem", lineHeight: 1 }}>—</span>
                      </div>
                      <div className="w-px h-20 bg-white/10" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-500 text-xs uppercase tracking-widest">Credit Utilization</span>
                        <PieChart percent={0} color="#6B8DD6" size={90} textColor="#ffffff" />
                      </div>
                      <div className="w-px h-20 bg-white/10" />
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-slate-500 text-xs uppercase tracking-widest">Evaluation</span>
                        <div className="rounded-lg px-5 py-2 text-center text-xs text-slate-500 border border-slate-700">Not Set</div>
                      </div>
                    </div>
                  </div>
                  {/* Empty Block 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t">
                    {["Account Summary", "Overall Credit Usage", "Debt Summary"].map(section => (
                      <div key={section} className="p-4 space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section}</h4>
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex justify-between items-center text-sm py-0.5 border-b border-muted/30 last:border-0">
                            <span className="text-muted-foreground/50 text-xs">—</span>
                            <span className="font-semibold text-xs text-muted-foreground/50">—</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
            {filteredReports.map((report) => {
              const evalCfg = report.evaluation ? EVALUATION_CONFIG[report.evaluation as Evaluation] : null;
              const pctOrig = parsePct(report.creditUsagePercent);
              const pctNoAU = parsePct(report.creditUsagePercentNoAU);
              const isSelected = selectedReportId === report.id;

              return (
                <div key={report.id} className={`border-2 rounded-xl overflow-hidden transition-colors ${isSelected ? "border-primary" : "border-border"}`}>

                  {/* ── BLOCK 1: Header ── */}
              <div
                    className="relative cursor-pointer"
                    style={{ backgroundColor: "#000" }}
                    onClick={() => setSelectedReportId(isSelected ? null : report.id)}
                  >
                    {/* Top bar: bureau left, edit button right */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white text-xl font-bold tracking-wide">{report.bureau || "Credit Bureau"}</span>
                        <span className="text-slate-400 text-xs">{report.reportDate || "No Date"}</span>
                        {report.ficoScoreModel && <span className="text-slate-500 text-xs">{report.ficoScoreModel}</span>}
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {isSelected && <Badge variant="default" className="text-xs bg-primary">Viewing accounts</Badge>}
                        <Button variant="outline" size="sm" onClick={() => openEditReport(report)} className="h-6 gap-1 text-[11px] px-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Edit2 className="w-2.5 h-2.5" /> Edit
                        </Button>
                      </div>
                    </div>
                    {/* Center: FICO Score + Credit Utilization */}
                    <div className="flex items-center justify-center gap-10 px-5 py-5">
                      {/* FICO Score */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-400 text-xs uppercase tracking-widest">FICO Score</span>
                        <span className="text-white font-extrabold" style={{ fontSize: "3.5rem", lineHeight: 1 }}>{report.ficoScore ?? "—"}</span>
                      </div>
                      {/* Divider */}
                      <div className="w-px h-20 bg-white/20" />
                      {/* Credit Utilization */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-400 text-xs uppercase tracking-widest">Credit Utilization</span>
                        <PieChart percent={pctOrig} color={evalCfg ? evalCfg.color : "#6B8DD6"} size={90} textColor="#ffffff" />
                      </div>
                      {/* Divider */}
                      <div className="w-px h-20 bg-white/20" />
                      {/* Evaluation */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-slate-400 text-xs uppercase tracking-widest">Evaluation</span>
                        {evalCfg ? (
                          <div className="rounded-lg px-5 py-2 text-center font-bold text-base" style={{ backgroundColor: evalCfg.bg, color: evalCfg.color, border: `2px solid ${evalCfg.color}` }}>
                            {evalCfg.label}
                          </div>
                        ) : (
                          <div className="rounded-lg px-5 py-2 text-center text-xs text-slate-400 border border-slate-600">Not Set</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── BLOCK 2: Account Summary + Credit Usage + Debt Summary ── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t">

                    {/* Block 2.1: Account Summary */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account Summary</h4>
                      {[
                        ["Open Accounts", report.openAccounts],
                        ["Self-Reported Accounts", report.selfReportedAccounts],
                        ["Closed Accounts", report.closedAccounts],
                        ["Collections", report.collectionsCount],
                        ["Average Account Age", report.averageAccountAge],
                        ["Oldest Account Age", report.oldestAccount],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between items-center text-sm py-0.5 border-b border-muted/30 last:border-0">
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className="font-semibold text-xs">{value ?? "—"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Block 2.2: Overall Credit Usage */}
                    <div className="p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overall Credit Usage</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {/* 2.2.1 Original Report */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-center text-muted-foreground">Original Report</p>
                          <div className="flex justify-center">
                            <PieChart percent={pctOrig} color="#6B8DD6" size={70} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Credit Usage</span>
                              <span className="font-semibold">{report.creditUsagePercent || "—"}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Credit Used</span>
                              <span className="font-semibold">{fmtMoney(report.creditUsed)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Credit Limit</span>
                              <span className="font-semibold">{fmtMoney(report.creditLimit)}</span>
                            </div>
                          </div>
                        </div>
                        {/* 2.2.2 Without Authorized User */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-center text-muted-foreground">Without Auth. User</p>
                          <div className="flex justify-center">
                            <PieChart percent={pctNoAU} color="#C0634D" size={70} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Credit Usage</span>
                              <span className="font-semibold">{report.creditUsagePercentNoAU || "—"}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Credit Used</span>
                              <span className="font-semibold">{fmtMoney(report.creditUsedNoAU)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Credit Limit</span>
                              <span className="font-semibold">{fmtMoney(report.creditLimitNoAU)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Block 2.3: Debt Summary */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Debt Summary</h4>
                      {[
                        ["Credit Card & Credit Line Debt", fmtMoney(report.creditCardDebt)],
                        ["Self-Reported Account Balance", fmtMoney(report.selfReportedBalance)],
                        ["Loan Debt", fmtMoney(report.loanDebt)],
                        ["Collections Debt", fmtMoney(report.collectionsDebt)],
                        ["Total Debt", fmtMoney(report.totalDebt)],
                      ].map(([label, value]) => (
                        <div key={String(label)} className={`flex justify-between items-center text-sm py-0.5 border-b border-muted/30 last:border-0 ${label === "Total Debt" ? "font-bold" : ""}`}>
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className={`text-xs ${label === "Total Debt" ? "text-primary font-bold" : "font-semibold"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── BLOCK 3 + 4: Personal Info + Inquiries ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-t">

                    {/* Block 3: Personal Information */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal Information</h4>
                      {[
                        ["Name", report.reportPersonName],
                        ["Also Known As", report.reportAlsoKnownAs],
                        ["Year of Birth", report.reportYearOfBirth],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between items-start text-xs py-0.5 border-b border-muted/30 last:border-0">
                          <span className="text-muted-foreground shrink-0 mr-2">{label}</span>
                          <span className="font-medium text-right">{value || "—"}</span>
                        </div>
                      ))}
                      <div className="pt-1">
                        <p className="text-muted-foreground text-xs mb-1">Addresses</p>
                        <p className="text-xs font-medium whitespace-pre-wrap">{report.reportAddresses || "—"}</p>
                      </div>
                      <div className="pt-1">
                        <p className="text-muted-foreground text-xs mb-1">Employers</p>
                        <p className="text-xs font-medium whitespace-pre-wrap">{report.reportEmployers || "—"}</p>
                      </div>
                    </div>

                    {/* Block 4: Inquiries */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inquiries</h4>
                        {isSelected && (
                          <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={openNewInquiry}>
                            <Plus className="w-3 h-3" /> Add
                          </Button>
                        )}
                      </div>
                      {!isSelected ? (
                        <p className="text-xs text-muted-foreground italic">Select this report to view and manage inquiries.</p>
                      ) : !inquiries || inquiries.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No inquiries recorded for this report.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {inquiries.map(inq => (
                            <div key={inq.id} className="border rounded-lg p-2 text-xs space-y-0.5 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{inq.accountName || "Unknown"}</span>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditInquiry(inq)}><Edit2 className="w-2.5 h-2.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => setConfirmDeleteInquiryId(inq.id)}><Trash2 className="w-2.5 h-2.5" /></Button>
                                </div>
                              </div>
                              {inq.inquiredOn && <p className="text-muted-foreground">Inquired: {inq.inquiredOn}</p>}
                              {inq.businessType && <p className="text-muted-foreground">Type: {inq.businessType}</p>}
                              {inq.address && <p className="text-muted-foreground">{inq.address}</p>}
                              {inq.contactNumber && <p className="text-muted-foreground">{inq.contactNumber}</p>}
                              {inq.note && <p className="text-muted-foreground italic">{inq.note}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>

      {/* ── Credit Accounts ── */}
      <Card style={{ backgroundColor: accountView === "Open" ? "#8EBF90" : "#D48F8F", transition: "background-color 0.3s ease" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button className="flex items-center gap-2 text-left" onClick={() => setExpandedAccounts(v => !v)}>
              <CardTitle className="text-base">Credit Accounts</CardTitle>
              {accounts && <Badge variant="secondary" className="text-xs">{accounts.length} total</Badge>}
              {selectedReportId && <Badge variant="outline" className="text-xs text-primary border-primary">Filtered by report</Badge>}
              {expandedAccounts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg overflow-hidden border text-xs font-medium">
                <button
                  className={`px-4 py-1.5 transition-colors ${accountView === "Open" ? "bg-[#D6EED7] text-black font-bold" : "bg-white text-muted-foreground hover:bg-muted/40"}`}
                  onClick={() => setAccountView("Open")}
                >
                  Open ({openAccounts.length})
                </button>
                <button
                  className={`px-4 py-1.5 transition-colors ${accountView === "Closed" ? "bg-[#F5D9D9] text-black font-bold" : "bg-white text-muted-foreground hover:bg-muted/40"}`}
                  onClick={() => setAccountView("Closed")}
                >
                  Closed ({closedAccounts.length})
                </button>
              </div>
              <Button onClick={() => setShowBulkPasteDialog(true)} size="sm" variant="outline" className="gap-1 h-8">
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste Rows
              </Button>
              <Button onClick={openNewAccount} size="sm" className="gap-1 h-8">
                <Plus className="w-3.5 h-3.5" /> Add Account
              </Button>
            </div>
          </div>
          {!selectedReportId && (
            <p className="text-xs text-muted-foreground mt-1">Click a report above to filter accounts by that report, or view all accounts below.</p>
          )}
        </CardHeader>
        {expandedAccounts && (
          <CardContent className="space-y-4">
            <div className={`rounded-lg px-4 py-2 flex items-center justify-between ${viewBg}`}>
              <span className="text-black font-bold text-sm">{accountView} Accounts</span>
              <span className="text-black text-xs opacity-70">{viewCount} account{viewCount !== 1 ? "s" : ""}</span>
            </div>
            {accountsLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
            {!accountsLoading && (
              <div className="space-y-4">
                {CATEGORIES.map(cat => (
                  <CategoryTable key={cat} cat={cat} cols={cols[cat]} accs={byCategory[cat]} />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={showBulkPasteDialog} onOpenChange={setShowBulkPasteDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Paste Credit Account Rows</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Select a bureau report first, then paste rows from Excel or CSV. Expected column order: Account Name, Open/Closed, Account Type, Status, Balance, Credit Limit, Credit Usage, Date Opened, Monthly Payment, Terms.</p>
            <Textarea
  rows={12}
  value={bulkPasteText}
  onChange={(e) => setBulkPasteText(e.target.value)}
  placeholder={`Account Name	Open/Closed	Account Type	Status	Balance	Credit Limit	Credit Usage	Date Opened
Bank of America	Open	Credit Card	Current	4019	5200	77%	2020-10-20`}
/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkPasteDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkPasteImport} disabled={addAccountMutation.isPending}>Import Rows</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReportId ? "Edit Credit Report" : "Add Credit Report"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Basic Info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Basic Info</p>
              <div className="grid grid-cols-2 gap-3">
                {([ ["Bureau", "bureau", "Experian"], ["Report Date", "reportDate", "2/26/2026"], ["FICO Score", "ficoScore", "806"], ["FICO Model", "ficoScoreModel", "FICO Score 8"] ] as [string,string,string][]).map(([label, field, ph]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input value={(reportForm as any)[field]} onChange={setR(field)} placeholder={ph} className="h-8 text-sm" />
                  </div>
                ))}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Evaluation</Label>
                  <Select value={reportForm.evaluation || "none"} onValueChange={(v) => setReportForm(p => ({ ...p, evaluation: v === "none" ? "" : v as Evaluation }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select evaluation" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {(Object.keys(EVALUATION_CONFIG) as Evaluation[]).map(e => (
                        <SelectItem key={e} value={e}>
                          <span style={{ color: EVALUATION_CONFIG[e].color, fontWeight: 600 }}>{e}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Account Summary */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account Summary</p>
              <div className="grid grid-cols-2 gap-3">
                {([ ["Open Accounts", "openAccounts", "8"], ["Self-Reported Accounts", "selfReportedAccounts", "0"], ["Closed Accounts", "closedAccounts", "5"], ["Collections", "collectionsCount", "0"], ["Avg Account Age", "averageAccountAge", "7 yrs 3 mos"], ["Oldest Account", "oldestAccount", "19 yrs 3 mos"] ] as [string,string,string][]).map(([label, field, ph]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input value={(reportForm as any)[field]} onChange={setR(field)} placeholder={ph} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>
            {/* Credit Usage - Original */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Credit Usage — Original Report</p>
              <div className="grid grid-cols-3 gap-3">
                {([ ["Credit Usage %", "creditUsagePercent", "26%"], ["Credit Used ($)", "creditUsed", "21931"], ["Credit Limit ($)", "creditLimit", "85000"] ] as [string,string,string][]).map(([label, field, ph]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input value={(reportForm as any)[field]} onChange={setR(field)} placeholder={ph} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>
            {/* Credit Usage - Without Authorized User */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Credit Usage — Without Authorized User</p>
              <div className="grid grid-cols-3 gap-3">
                {([ ["Credit Usage %", "creditUsagePercentNoAU", "30%"], ["Credit Used ($)", "creditUsedNoAU", "18000"], ["Credit Limit ($)", "creditLimitNoAU", "60000"] ] as [string,string,string][]).map(([label, field, ph]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input value={(reportForm as any)[field]} onChange={setR(field)} placeholder={ph} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>
            {/* Debt Summary */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Debt Summary</p>
              <div className="grid grid-cols-2 gap-3">
                {([ ["Credit Card & Line Debt ($)", "creditCardDebt", "21931"], ["Self-Reported Balance ($)", "selfReportedBalance", "0"], ["Loan Debt ($)", "loanDebt", "431638"], ["Collections Debt ($)", "collectionsDebt", "0"], ["Total Debt ($)", "totalDebt", "453569"] ] as [string,string,string][]).map(([label, field, ph]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input value={(reportForm as any)[field]} onChange={setR(field)} placeholder={ph} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>
            {/* Personal Information */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Information</p>
              <div className="grid grid-cols-2 gap-3">
                {([ ["Name", "reportPersonName", "Margaret N. Tomdio"], ["Also Known As", "reportAlsoKnownAs", ""], ["Year of Birth", "reportYearOfBirth", "1980"] ] as [string,string,string][]).map(([label, field, ph]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input value={(reportForm as any)[field]} onChange={setR(field)} placeholder={ph} className="h-8 text-sm" />
                  </div>
                ))}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Addresses (comma-separated)</Label>
                  <Textarea value={reportForm.reportAddresses} onChange={setR("reportAddresses")} placeholder="28718 Pearl Bridge Ln Katy TX, 21611 Nella Cir Humble TX" className="text-sm min-h-[60px] resize-none" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Employers (comma-separated)</Label>
                  <Textarea value={reportForm.reportEmployers} onChange={setR("reportEmployers")} placeholder="Maxim Home Health, Pages Home Health" className="text-sm min-h-[60px] resize-none" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button onClick={saveReport} disabled={createReportMutation.isPending || updateReportMutation.isPending}>
              {(createReportMutation.isPending || updateReportMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccountId ? "Edit Credit Account" : "Add Credit Account"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Link to Credit Report</Label>
              <Select
                value={accountForm.creditReportId?.toString() ?? "none"}
                onValueChange={(v) => setAccountForm(p => ({ ...p, creditReportId: v === "none" ? null : parseInt(v) }))}
              >
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select report (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No report linked</SelectItem>
                  {reports?.map(r => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.bureau || "Report"} — {r.reportDate || "No Date"} {r.ficoScore ? `(FICO ${r.ficoScore})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {([ ["Bureau", "bureau", "Experian"], ["Report Date", "reportDate", "2/26/2026"], ["Account Name", "accountName", "Bank of America"], ["Account Number", "accountNumber", "XXXX1234"], ["Date Opened", "dateOpened", "Oct 20, 2020"], ["Status Updated", "statusUpdated", "February 2026"], ["Account Type", "accountType", "Credit Card"], ["Status", "status", "Open/Never late"], ["Balance", "balance", "4019"], ["Credit Limit", "creditLimit", "5200"], ["Credit Usage", "creditUsage", "77%"], ["Balance Updated", "balanceUpdated", "Feb 2026"], ["Original Balance", "originalBalance", "5000"], ["Paid Off", "paidOff", "25%"], ["Monthly Payment", "monthlyPayment", "40"], ["Last Payment Date", "lastPaymentDate", "1/22/2026"], ["Terms", "terms", "Revolving"] ] as [string, string, string][]).map(([label, field, ph]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={(accountForm as any)[field]} onChange={setA(field)} placeholder={ph} className="h-8 text-sm" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Open / Closed</Label>
              <Select value={accountForm.openClosed} onValueChange={(v) => setAccountForm(p => ({ ...p, openClosed: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Responsibility</Label>
              <Select value={accountForm.responsibility} onValueChange={(v) => setAccountForm(p => ({ ...p, responsibility: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Joint">Joint</SelectItem>
                  <SelectItem value="Authorized User">Authorized User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={accountForm.creditAccountCategory || "none"}
                onValueChange={(v) => setAccountForm(p => ({ ...p, creditAccountCategory: v === "none" ? "" : v as Category }))}
              >
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Dispute</Label>
              <Textarea value={accountForm.dispute} onChange={setA("dispute")} placeholder="Enter dispute statement or notes..." className="text-sm min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountDialog(false)}>Cancel</Button>
            <Button onClick={saveAccount} disabled={addAccountMutation.isPending || updateAccountMutation.isPending}>
              {(addAccountMutation.isPending || updateAccountMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inquiry Dialog */}
      <Dialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInquiryId ? "Edit Inquiry" : "Add Inquiry"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {([ ["Account Name", "accountName", "SOFI BANK NA"], ["Inquired On", "inquiredOn", "Dec 12, 2025"], ["Business Type", "businessType", "All Banks - non specific"], ["Contact Number", "contactNumber", "(855) 456-7634"] ] as [string,string,string][]).map(([label, field, ph]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={(inquiryForm as any)[field]} onChange={setI(field)} placeholder={ph} className="h-8 text-sm" />
              </div>
            ))}
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Address</Label>
              <Input value={inquiryForm.address} onChange={setI("address")} placeholder="2750 E Cottonwood Pkwy S, El Paso TX 84121" className="h-8 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Note</Label>
              <Textarea value={inquiryForm.note} onChange={setI("note")} placeholder="This inquiry is scheduled to continue on record until Jan 2028" className="text-sm min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInquiryDialog(false)}>Cancel</Button>
            <Button onClick={saveInquiry} disabled={createInquiryMutation.isPending || updateInquiryMutation.isPending}>
              {(createInquiryMutation.isPending || updateInquiryMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
