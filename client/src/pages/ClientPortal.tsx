import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  User, Building2, DollarSign, CreditCard, FileText, LogOut, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, PauseCircle, ThumbsUp, ChevronDown, ChevronUp, Filter,
} from "lucide-react";
import { getClientSession, clearClientSession } from "./ClientLogin";
import { toast } from "sonner";

type PortalTab = "personal" | "credit" | "funding";

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
  "Poor":        { color: "#DC2626", bg: "#FEE2E2", label: "Poor" },
  "Fair":        { color: "#EA580C", bg: "#FFEDD5", label: "Fair" },
  "Good":        { color: "#CA8A04", bg: "#FEF9C3", label: "Good" },
  "Very Good":   { color: "#16A34A", bg: "#DCFCE7", label: "Very Good" },
  "Exceptional": { color: "#15803D", bg: "#BBF7D0", label: "Exceptional" },
} as const;
type Evaluation = keyof typeof EVALUATION_CONFIG;

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending:      { label: "Pending",      icon: Clock,        className: "bg-amber-100 text-amber-800 border-amber-200" },
  under_review: { label: "Under Review", icon: FileText,     className: "bg-blue-100 text-blue-800 border-blue-200" },
  approved:     { label: "Approved",     icon: ThumbsUp,     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  funded:       { label: "Funded",       icon: CheckCircle2, className: "bg-green-100 text-green-800 border-green-200" },
  declined:     { label: "Declined",     icon: XCircle,      className: "bg-red-100 text-red-800 border-red-200" },
  on_hold:      { label: "On Hold",      icon: PauseCircle,  className: "bg-gray-100 text-gray-700 border-gray-200" },
};

const APP_STATUS_COLORS: Record<string, string> = {
  "Approved":               "bg-green-100 text-green-800",
  "Denied":                 "bg-red-100 text-red-800",
  "Conditionally Approved": "bg-yellow-100 text-yellow-800",
  "Pending":                "bg-gray-100 text-gray-700",
};

function formatCurrency(val: string | null | undefined): string {
  if (!val) return "—";
  const num = parseFloat(val);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

function parsePct(s: string | null | undefined): number {
  if (!s) return 0;
  return parseFloat(s.replace("%", "")) || 0;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function fmtMoney(v: unknown): string {
  if (!v) return "—";
  const n = parseFloat(String(v));
  if (isNaN(n)) return "—";
  return `$${n.toLocaleString()}`;
}

function PieChart({ percent, color = "#6B8DD6", size = 80 }: { percent: number; color?: string; size?: number }) {
  const r = 30, cx = 40, cy = 40;
  const circumference = 2 * Math.PI * r;
  const p = Math.min(Math.max(percent, 0), 100);
  const dash = (p / 100) * circumference;
  const gap = circumference - dash;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill="#000000">
        {p}%
      </text>
    </svg>
  );
}

function DataField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value ?? "—"}</span>
    </div>
  );
}

// ─── Personal Info Tab ────────────────────────────────────────────────────────
function PersonalInfoTab({ profile }: { profile: any }) {
  const statusCfg = STATUS_CONFIG[profile.fundingStatus] ?? STATUS_CONFIG["pending"];
  const StatusIcon = statusCfg.icon;
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Application Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${statusCfg.className}`}>
                <StatusIcon className="w-4 h-4" />
                {statusCfg.label}
              </span>
            </div>
            {profile.fundingAmount && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Approved Amount</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(profile.fundingAmount)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DataField label="First Name" value={profile.firstName} />
            <DataField label="Last Name" value={profile.lastName} />
            <DataField label="Email" value={profile.email} />
            <DataField label="Phone" value={profile.phone} />
            <DataField label="Address" value={profile.address} />
            <DataField label="City" value={profile.city} />
            <DataField label="State" value={profile.state} />
            <DataField label="Zip Code" value={profile.zipCode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DataField label="Business Name" value={profile.businessName} />
            <DataField label="Business Type" value={profile.businessType} />
            <DataField label="Start Date" value={profile.businessStartDate} />
            <DataField label="Time in Business" value={profile.timeInBusiness} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DataField label="Total Business Income" value={profile.totalBusinessIncome ? formatCurrency(profile.totalBusinessIncome) : null} />
            <DataField label="Personal Income" value={profile.personalIncome ? formatCurrency(profile.personalIncome) : null} />
            <DataField label="Monthly Revenue" value={profile.monthlyRevenue ? formatCurrency(profile.monthlyRevenue) : null} />
            <DataField label="Existing Debt" value={profile.existingDebt ? formatCurrency(profile.existingDebt) : null} />
            <DataField label="FICO Score" value={profile.ficoScore} />
            <DataField label="Funding Needed" value={profile.fundingNeeded ? formatCurrency(profile.fundingNeeded) : null} />
          </div>
        </CardContent>
      </Card>

      {profile.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Notes from Your Advisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{profile.notes}</p>
          </CardContent>
        </Card>
      )}

      {profile.fundingPurpose && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Purpose of Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">{profile.fundingPurpose}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Credit Reports Tab ───────────────────────────────────────────────────────
function CreditReportsTab({ token }: { token: string }) {
  const [filterBureau, setFilterBureau] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [accountView, setAccountView] = useState<"Open" | "Closed">("Open");
  const [expandedSummary, setExpandedSummary] = useState(true);
  const [expandedAccounts, setExpandedAccounts] = useState(true);

  const { data: reports, isLoading: reportsLoading } = trpc.clientAuth.getCreditReports.useQuery(
    { token }, { enabled: !!token, retry: false }
  );
  const { data: accounts, isLoading: accountsLoading } = trpc.clientAuth.getCreditAccounts.useQuery(
    { token, creditReportId: selectedReportId },
    { enabled: !!token, retry: false }
  );
  const { data: inquiries } = trpc.clientAuth.getInquiries.useQuery(
    { token, creditReportId: selectedReportId! },
    { enabled: !!token && selectedReportId !== null, retry: false }
  );

  const bureauOptions = useMemo(() => {
    if (!reports) return [];
    return Array.from(new Set((reports as any[]).map((r) => r.bureau).filter(Boolean))) as string[];
  }, [reports]);

  const dateOptions = useMemo(() => {
    if (!reports) return [];
    return Array.from(new Set((reports as any[]).map((r) => r.reportDate).filter(Boolean))) as string[];
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return (reports as any[]).filter((r) => {
      const bureauMatch = filterBureau === "all" || r.bureau === filterBureau;
      const dateMatch = filterDate === "all" || r.reportDate === filterDate;
      return bureauMatch && dateMatch;
    });
  }, [reports, filterBureau, filterDate]);

  const openAccounts = useMemo(() => ((accounts ?? []) as any[]).filter((a) => a.openClosed === "Open"), [accounts]);
  const closedAccounts = useMemo(() => ((accounts ?? []) as any[]).filter((a) => a.openClosed === "Closed"), [accounts]);

  const openByCategory = useMemo(() => {
    const map: Record<Category, any[]> = { "Cards": [], "Car": [], "House": [], "Secured Loan": [], "Unsecured Loan": [], "Others": [] };
    openAccounts.forEach((a) => { const cat = (a.creditAccountCategory as Category) || "Others"; if (map[cat]) map[cat].push(a); else map["Others"].push(a); });
    return map;
  }, [openAccounts]);

  const closedByCategory = useMemo(() => {
    const map: Record<Category, any[]> = { "Cards": [], "Car": [], "House": [], "Secured Loan": [], "Unsecured Loan": [], "Others": [] };
    closedAccounts.forEach((a) => { const cat = (a.creditAccountCategory as Category) || "Others"; if (map[cat]) map[cat].push(a); else map["Others"].push(a); });
    return map;
  }, [closedAccounts]);

  const isOpen = accountView === "Open";
  const viewBg = isOpen ? "bg-[#8EBF90]" : "bg-[#D48F8F]";
  const byCategory = isOpen ? openByCategory : closedByCategory;
  const cols = isOpen ? OPEN_COLS : CLOSED_COLS;
  const viewCount = isOpen ? openAccounts.length : closedAccounts.length;

  if (reportsLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Bureau</Label>
              <Select value={filterBureau} onValueChange={setFilterBureau}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All Bureaus" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bureaus</SelectItem>
                  {bureauOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Report Date</Label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All Dates" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {dateOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(filterBureau !== "all" || filterDate !== "all") && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
                onClick={() => { setFilterBureau("all"); setFilterDate("all"); setSelectedReportId(null); }}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <button className="flex items-center gap-2 text-left" onClick={() => setExpandedSummary(v => !v)}>
            <CreditCard className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Credit Report Summary</CardTitle>
            {expandedSummary ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {expandedSummary && (
          <CardContent className="space-y-6">
            {filteredReports.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                {reports && (reports as any[]).length > 0 ? "No reports match the current filters." : "No credit reports available yet."}
              </p>
            )}
            {filteredReports.map((report: any) => {
              const evalCfg = report.evaluation ? EVALUATION_CONFIG[report.evaluation as Evaluation] : null;
              const pctOrig = parsePct(report.creditUsagePercent);
              const pctNoAU = parsePct(report.creditUsagePercentNoAU);
              const isSelected = selectedReportId === report.id;
              return (
                <div key={report.id} className={`border-2 rounded-xl overflow-hidden transition-colors ${isSelected ? "border-primary" : "border-border"}`}>
                  <div className="relative cursor-pointer" style={{ backgroundColor: "#000" }}
                    onClick={() => setSelectedReportId(isSelected ? null : report.id)}>
                    <div className="flex items-center justify-between px-5 pt-4 pb-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white text-xl font-bold tracking-wide">{report.bureau || "Credit Bureau"}</span>
                        <span className="text-slate-400 text-xs">{report.reportDate || "No Date"}</span>
                        {report.ficoScoreModel && <span className="text-slate-500 text-xs">{report.ficoScoreModel}</span>}
                      </div>
                      {isSelected && <Badge variant="default" className="text-xs bg-primary">Viewing accounts</Badge>}
                    </div>
                    <div className="flex items-center justify-center gap-10 px-5 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-400 text-xs uppercase tracking-widest">FICO Score</span>
                        <span className="text-white font-extrabold" style={{ fontSize: "3.5rem", lineHeight: 1 }}>{report.ficoScore ?? "—"}</span>
                      </div>
                      <div className="w-px h-20 bg-white/20" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-400 text-xs uppercase tracking-widest">Credit Utilization</span>
                        <PieChart percent={pctOrig} color={evalCfg ? evalCfg.color : "#6B8DD6"} size={90} />
                      </div>
                      <div className="w-px h-20 bg-white/20" />
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
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t">
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
                    <div className="p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overall Credit Usage</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-center text-muted-foreground">Original Report</p>
                          <div className="flex justify-center"><PieChart percent={pctOrig} color="#6B8DD6" size={70} /></div>
                          <div className="space-y-1">
                            {[["Credit Usage", report.creditUsagePercent], ["Credit Used", fmtMoney(report.creditUsed)], ["Credit Limit", fmtMoney(report.creditLimit)]].map(([l, v]) => (
                              <div key={String(l)} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{l}</span>
                                <span className="font-semibold">{v || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-center text-muted-foreground">Without Auth. User</p>
                          <div className="flex justify-center"><PieChart percent={pctNoAU} color="#C0634D" size={70} /></div>
                          <div className="space-y-1">
                            {[["Credit Usage", report.creditUsagePercentNoAU], ["Credit Used", fmtMoney(report.creditUsedNoAU)], ["Credit Limit", fmtMoney(report.creditLimitNoAU)]].map(([l, v]) => (
                              <div key={String(l)} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{l}</span>
                                <span className="font-semibold">{v || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Debt Summary</h4>
                      {[
                        ["Credit Card Debt", fmtMoney(report.creditCardDebt)],
                        ["Self-Reported Balance", fmtMoney(report.selfReportedBalance)],
                        ["Loan Debt", fmtMoney(report.loanDebt)],
                        ["Collections Debt", fmtMoney(report.collectionsDebt)],
                        ["Total Debt", fmtMoney(report.totalDebt)],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between items-center text-sm py-0.5 border-b border-muted/30 last:border-0">
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className={`text-xs ${label === "Total Debt" ? "text-primary font-bold" : "font-semibold"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-t">
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
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Inquiries</h4>
                      {!isSelected ? (
                        <p className="text-xs text-muted-foreground italic">Click the report header above to view inquiries for this report.</p>
                      ) : !inquiries || (inquiries as any[]).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No inquiries recorded for this report.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {(inquiries as any[]).map((inq) => (
                            <div key={inq.id} className="border rounded-lg p-2 text-xs space-y-0.5 bg-muted/20">
                              <span className="font-semibold">{inq.accountName || "Unknown"}</span>
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

      <Card style={{ backgroundColor: accountView === "Open" ? "#8EBF90" : "#D48F8F", transition: "background-color 0.3s ease" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button className="flex items-center gap-2 text-left" onClick={() => setExpandedAccounts(v => !v)}>
              <CardTitle className="text-base">Credit Accounts</CardTitle>
              {accounts && <Badge variant="secondary" className="text-xs">{(accounts as any[]).length} total</Badge>}
              {selectedReportId && <Badge variant="outline" className="text-xs text-primary border-primary">Filtered by report</Badge>}
              {expandedAccounts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <div className="flex rounded-lg overflow-hidden border text-xs font-medium">
              <button
                className={`px-4 py-1.5 transition-colors ${accountView === "Open" ? "bg-[#8EBF90] text-white" : "bg-white text-muted-foreground hover:bg-muted/40"}`}
                onClick={() => setAccountView("Open")}
              >
                Open ({openAccounts.length})
              </button>
              <button
                className={`px-4 py-1.5 transition-colors ${accountView === "Closed" ? "bg-[#D48F8F] text-white" : "bg-white text-muted-foreground hover:bg-muted/40"}`}
                onClick={() => setAccountView("Closed")}
              >
                Closed ({closedAccounts.length})
              </button>
            </div>
          </div>
          {!selectedReportId && (
            <p className="text-xs text-muted-foreground mt-1">Click a report above to filter accounts by that report, or view all accounts below.</p>
          )}
        </CardHeader>
        {expandedAccounts && (
          <CardContent className="space-y-4">
            <div className={`rounded-lg px-4 py-2 flex items-center justify-between ${viewBg}`}>
              <span className="text-white font-semibold text-sm">{accountView} Accounts</span>
              <span className="text-white text-xs opacity-90">{viewCount} account{viewCount !== 1 ? "s" : ""}</span>
            </div>
            {accountsLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
            {!accountsLoading && (
              <div className="space-y-4">
                {CATEGORIES.map(cat => {
                  const accs = byCategory[cat];
                  const colors = CATEGORY_COLORS[cat];
                  const catCols = cols[cat];
                  return (
                    <div key={cat} className="rounded-lg overflow-hidden border">
                      <div className={`px-4 py-2 flex items-center justify-between ${colors.header}`}>
                        <span className="text-sm font-semibold tracking-wide">{cat}</span>
                        <span className="text-xs opacity-80">{accs.length} account{accs.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              {catCols.map(c => <TableHead key={c.key} className="text-xs whitespace-nowrap py-2">{c.label}</TableHead>)}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={catCols.length} className={`text-center text-xs text-muted-foreground italic py-3 ${colors.row}`}>
                                  No accounts in this category
                                </TableCell>
                              </TableRow>
                            ) : accs.map((acc: any, idx: number) => (
                              <TableRow key={acc.id} className={idx % 2 === 0 ? colors.row : "bg-white"}>
                                {catCols.map(c => (
                                  <TableCell key={c.key} className="text-xs whitespace-nowrap py-2">
                                    {c.key === "balance" || c.key === "creditLimit" || c.key === "originalBalance" || c.key === "monthlyPayment"
                                      ? fmtMoney(acc[c.key])
                                      : fmt(acc[c.key])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ─── Funding Tab ──────────────────────────────────────────────────────────────
function FundingTab({ token, profile }: { token: string; profile: any }) {
  const { data: apps, isLoading } = trpc.clientAuth.getFundingApplications.useQuery(
    { token }, { enabled: !!token, retry: false }
  );
  const { data: underwriting } = trpc.clientAuth.getUnderwriting.useQuery(
    { token }, { enabled: !!token, retry: false }
  );

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const statusGroups = ["Approved", "Conditionally Approved", "Pending", "Denied"] as const;
  const summary = statusGroups.map(s => {
    const group = ((apps ?? []) as any[]).filter((a) => a.status === s);
    const total = group.reduce((sum: number, a: any) => sum + parseFloat(a.appliedLimit || "0"), 0);
    return { status: s, count: group.length, total };
  });
  const totalFunded = ((apps ?? []) as any[]).filter((a) => a.status === "Approved").reduce((s: number, a: any) => s + parseFloat(a.appliedLimit || "0"), 0);
  const totalGross = ((apps ?? []) as any[]).reduce((s: number, a: any) => s + parseFloat(a.appliedLimit || "0"), 0);
  const rounds = Array.from(new Set(((apps ?? []) as any[]).map((a) => a.round).filter(Boolean)));
  const sortedDates = ((apps ?? []) as any[]).map((a) => a.callDate).filter(Boolean).sort();
  const firstRoundDate = sortedDates[0] ?? null;
  const lastRoundDate = sortedDates[sortedDates.length - 1] ?? null;

  const statusCfg = STATUS_CONFIG[profile.fundingStatus] ?? STATUS_CONFIG["pending"];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Application Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${statusCfg.className}`}>
                <StatusIcon className="w-4 h-4" />
                {statusCfg.label}
              </span>
            </div>
            {profile.fundingAmount && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Approved Amount</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(profile.fundingAmount)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Card Status Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Card Status</TableHead>
                  <TableHead className="text-xs text-right">Count</TableHead>
                  <TableHead className="text-xs text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map(s => (
                  <TableRow key={s.status}>
                    <TableCell className="text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_COLORS[s.status] || "bg-gray-100 text-gray-700"}`}>
                        {s.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right">{s.count} cards</TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      {s.total > 0 ? `$${s.total.toLocaleString()}` : "$0"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell className="text-xs font-bold" colSpan={2}>TOTAL FUNDED AMOUNT</TableCell>
                  <TableCell className="text-xs text-right font-bold text-emerald-700">${totalFunded.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/20">
                  <TableCell className="text-xs font-bold" colSpan={2}>TOTAL GROSS AMOUNT</TableCell>
                  <TableCell className="text-xs text-right font-bold">${totalGross.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Funding Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ["Number of Funding Rounds", `${rounds.length} rounds`],
              ["First Funding Round Date", firstRoundDate || "—"],
              ["Last Funding Round Date", lastRoundDate || "—"],
              ["Date Contract Signed", (underwriting as any)?.dateContractSigned || "—"],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                <span className="text-muted-foreground italic text-xs">{label}</span>
                <span className="font-semibold text-xs">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Funding Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!apps || (apps as any[]).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No funding applications yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Call Date</TableHead>
                    <TableHead className="text-xs">Round</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Rates</TableHead>
                    <TableHead className="text-xs text-right">Applied Limit</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(apps as any[]).map((app) => (
                    <TableRow key={app.id}
                      className={app.status === "Denied" ? "bg-red-50/50" : app.status?.startsWith("Approved") ? "bg-green-50/50" : app.status === "Conditionally Approved" ? "bg-yellow-50/50" : ""}>
                      <TableCell className="text-xs">{app.callDate || "—"}</TableCell>
                      <TableCell className="text-xs font-bold text-primary">{app.round || "—"}</TableCell>
                      <TableCell className="text-xs">{app.product || "—"}</TableCell>
                      <TableCell className="text-xs">{app.type || "—"}</TableCell>
                      <TableCell className="text-xs">{app.rates || "—"}</TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {app.appliedLimit ? `$${parseFloat(app.appliedLimit).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_COLORS[app.status || ""] || "bg-gray-100 text-gray-700"}`}>
                          {app.status || "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main ClientPortal ────────────────────────────────────────────────────────
export default function ClientPortal() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<PortalTab>("personal");
  const session = getClientSession();

  useEffect(() => {
    if (!session) navigate("/client-login");
  }, []);

  const profileQuery = trpc.clientAuth.getProfile.useQuery(
    { token: session?.token ?? "" },
    { enabled: !!session?.token, retry: false, refetchOnWindowFocus: false }
  );

  const logoutMutation = trpc.clientAuth.logout.useMutation({
    onSuccess: () => {
      clearClientSession();
      toast.success("Signed out successfully");
      navigate("/client-login");
    },
  });

  const handleLogout = () => {
    if (session?.token) logoutMutation.mutate({ token: session.token });
    else { clearClientSession(); navigate("/client-login"); }
  };

  if (!session) return null;

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-foreground font-medium">Session expired or profile not found.</p>
          <Button onClick={() => { clearClientSession(); navigate("/client-login"); }}>Sign In Again</Button>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data as any;

  const tabs: { id: PortalTab; label: string; icon: React.ElementType }[] = [
    { id: "personal", label: "Personal Info",  icon: User },
    { id: "credit",   label: "Credit Reports", icon: CreditCard },
    { id: "funding",  label: "Funding",        icon: DollarSign },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663397240618/oDZY4ar9m3XQtQ6MXywepz/empower-logo_1a7a46aa.png"
              alt="Empower" className="h-7 w-7 object-contain"
            />
            <span className="font-black text-foreground uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em" }}>
              EMPOWER
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-foreground">{profile.firstName} {profile.lastName}</p>
              <p className="text-xs text-muted-foreground">{profile.email || "Client Portal"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending} className="gap-2">
              {logoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-card/50">
        <div className="container">
          <nav className="flex gap-1 py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1 container py-6">
        {activeTab === "personal" && <PersonalInfoTab profile={profile} />}
        {activeTab === "credit" && <CreditReportsTab token={session.token} />}
        {activeTab === "funding" && <FundingTab token={session.token} profile={profile} />}
      </main>

      <footer className="border-t border-border bg-card/50 py-4">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            Profile last updated:{" "}
            {profile.updatedAt
              ? new Date(profile.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : "—"}
          </p>
        </div>
      </footer>
    </div>
  );
}
