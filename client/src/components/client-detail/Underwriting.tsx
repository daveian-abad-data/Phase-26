import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

export default function ClientDetailUnderwriting({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getUnderwriting.useQuery({ clientId });

  const [form, setForm] = useState({
    underwriterPersonnel: "",
    underwritingCallDate: "",
    sourceType: "",
    contractType: "",
    dateContractSent: "",
    dateContractSigned: "",
    fundingAmountNeededMin: "",
    fundingAmountNeededMax: "",
    fundingProjectionMin: "",
    fundingProjectionMax: "",
    urgency: "",
    expectedTimeFrame: "",
    annualBusinessIncome: "",
    annualPersonalIncome: "",
    grossMonthlyIncome: "",
    totalMonthlyDebt: "",
    cashOnHand: "",
    initialTierType: "",
    initialFicoScore: "",
    initialCreditUtilization: "",
    totalCreditLimit: "",
    creditDebt: "",
    totalOpenAccounts: "",
    totalInquiries: "",
    averageAccountAge: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        underwriterPersonnel: data.underwriterPersonnel || "",
        underwritingCallDate: data.underwritingCallDate || "",
        sourceType: data.sourceType || "",
        contractType: data.contractType || "",
        dateContractSent: data.dateContractSent || "",
        dateContractSigned: data.dateContractSigned || "",
        fundingAmountNeededMin: data.fundingAmountNeededMin?.toString() || "",
        fundingAmountNeededMax: data.fundingAmountNeededMax?.toString() || "",
        fundingProjectionMin: data.fundingProjectionMin?.toString() || "",
        fundingProjectionMax: data.fundingProjectionMax?.toString() || "",
        urgency: data.urgency || "",
        expectedTimeFrame: data.expectedTimeFrame || "",
        annualBusinessIncome: data.annualBusinessIncome?.toString() || "",
        annualPersonalIncome: data.annualPersonalIncome?.toString() || "",
        grossMonthlyIncome: data.grossMonthlyIncome?.toString() || "",
        totalMonthlyDebt: data.totalMonthlyDebt?.toString() || "",
        cashOnHand: data.cashOnHand?.toString() || "",
        initialTierType: data.initialTierType || "",
        initialFicoScore: data.initialFicoScore?.toString() || "",
        initialCreditUtilization: data.initialCreditUtilization || "",
        totalCreditLimit: data.totalCreditLimit?.toString() || "",
        creditDebt: data.creditDebt?.toString() || "",
        totalOpenAccounts: data.totalOpenAccounts?.toString() || "",
        totalInquiries: data.totalInquiries?.toString() || "",
        averageAccountAge: data.averageAccountAge || "",
      });
    }
  }, [data]);

  const saveMutation = trpc.admin.saveUnderwriting.useMutation({
    onSuccess: () => {
      toast.success("Underwriting data saved");
      utils.admin.getUnderwriting.invalidate({ clientId });
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    saveMutation.mutate({
      clientId,
      underwriterPersonnel: form.underwriterPersonnel || null,
      underwritingCallDate: form.underwritingCallDate || null,
      sourceType: form.sourceType || null,
      contractType: form.contractType || null,
      dateContractSent: form.dateContractSent || null,
      dateContractSigned: form.dateContractSigned || null,
      fundingAmountNeededMin: form.fundingAmountNeededMin || null,
      fundingAmountNeededMax: form.fundingAmountNeededMax || null,
      fundingProjectionMin: form.fundingProjectionMin || null,
      fundingProjectionMax: form.fundingProjectionMax || null,
      urgency: form.urgency || null,
      expectedTimeFrame: form.expectedTimeFrame || null,
      annualBusinessIncome: form.annualBusinessIncome || null,
      annualPersonalIncome: form.annualPersonalIncome || null,
      grossMonthlyIncome: form.grossMonthlyIncome || null,
      totalMonthlyDebt: form.totalMonthlyDebt || null,
      cashOnHand: form.cashOnHand || null,
      initialTierType: form.initialTierType || null,
      initialFicoScore: form.initialFicoScore ? parseInt(form.initialFicoScore) : null,
      initialCreditUtilization: form.initialCreditUtilization || null,
      totalCreditLimit: form.totalCreditLimit || null,
      creditDebt: form.creditDebt || null,
      totalOpenAccounts: form.totalOpenAccounts ? parseInt(form.totalOpenAccounts) : null,
      totalInquiries: form.totalInquiries ? parseInt(form.totalInquiries) : null,
      averageAccountAge: form.averageAccountAge || null,
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  const Field = ({ label, field, placeholder }: { label: string; field: string; placeholder?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Input
        value={(form as any)[field]}
        onChange={set(field)}
        placeholder={placeholder || ""}
        className="h-9"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Underwriting</h2>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Personnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personnel & Call Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Underwriter Personnel" field="underwriterPersonnel" placeholder="John Employee" />
          <Field label="Underwriting Call Date" field="underwritingCallDate" placeholder="1/25/2026" />
          <Field label="Source Type" field="sourceType" placeholder="Referral" />
        </CardContent>
      </Card>

      {/* Contract */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contract Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Contract Type" field="contractType" placeholder="10% Agreement" />
          <Field label="Date Contract Sent" field="dateContractSent" placeholder="1/26/2026" />
          <Field label="Date Contract Signed" field="dateContractSigned" placeholder="2/1/2026" />
        </CardContent>
      </Card>

      {/* Funding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Funding Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Funding Amount Needed (Min)" field="fundingAmountNeededMin" placeholder="350000" />
              <Field label="Funding Amount Needed (Max)" field="fundingAmountNeededMax" placeholder="400000" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Funding Projection (Min)" field="fundingProjectionMin" placeholder="500000" />
              <Field label="Funding Projection (Max)" field="fundingProjectionMax" placeholder="600000" />
            </div>
            <Field label="Urgency" field="urgency" placeholder="3 months" />
            <Field label="Expected Time Frame" field="expectedTimeFrame" placeholder="5 months" />
          </div>
          <div className="space-y-4">
            <Field label="Annual Business Income" field="annualBusinessIncome" placeholder="480000" />
            <Field label="Annual Personal Income" field="annualPersonalIncome" placeholder="120000" />
            <Field label="Gross Monthly Income" field="grossMonthlyIncome" placeholder="10000" />
            <Field label="Total Monthly Debt" field="totalMonthlyDebt" placeholder="2500" />
            <Field label="Cash on Hand" field="cashOnHand" placeholder="85000" />
          </div>
        </CardContent>
      </Card>

      {/* Credit Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Initial Credit Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Initial Tier Type" field="initialTierType" placeholder="Tier 2" />
          <Field label="Initial FICO Score" field="initialFicoScore" placeholder="802" />
          <Field label="Initial Credit Utilization" field="initialCreditUtilization" placeholder="8%" />
          <Field label="Total Credit Limit" field="totalCreditLimit" placeholder="42000" />
          <Field label="Credit Debt" field="creditDebt" placeholder="0" />
          <Field label="Total Open Accounts" field="totalOpenAccounts" placeholder="8" />
          <Field label="Total Inquiries" field="totalInquiries" placeholder="2" />
          <Field label="Average Account Age" field="averageAccountAge" placeholder="7 yrs 3 mos" />
        </CardContent>
      </Card>
    </div>
  );
}
