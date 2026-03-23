import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Building2, DollarSign, KeyRound, Save, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

type LoginRow = {
  ownerName: string;
  platform: string;
  username: string;
  password: string;
  safetyPin: string;
  securityQuestion: string;
  securityAnswer: string;
  notes: string;
};

const emptyLoginRow = (): LoginRow => ({
  ownerName: "",
  platform: "",
  username: "",
  password: "",
  safetyPin: "",
  securityQuestion: "",
  securityAnswer: "",
  notes: "",
});

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const formatSSN = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
};

const formatLicense = (value: string) => value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 32);
const digitsOnly = (value: string, maxLength = 10) => value.replace(/\D/g, "").slice(0, maxLength);
const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(n)) return String(value);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const parseLoginRows = (raw: string | null | undefined): LoginRow[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({ ...emptyLoginRow(), ...(item || {}) }));
  } catch {
    return [];
  }
};

export default function ClientDetailPersonalInfo({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data: client, isLoading } = trpc.admin.getClient.useQuery({ id: clientId });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [creditLogins, setCreditLogins] = useState<LoginRow[]>([]);

  const updateMutation = trpc.admin.updateClient.useMutation({
    onSuccess: () => {
      utils.admin.getClient.invalidate({ id: clientId });
      setIsEditing(false);
      toast.success("Client information updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const startEdit = () => {
    if (!client) return;
    setForm({
      fullName: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
      email: client.email || "",
      email2: client.email2 || "",
      phone: client.phone || "",
      phone2: client.phone2 || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zipCode || "",
      birthDate: client.birthDate || "",
      ssn: client.ssn || "",
      driversLicenseNumber: client.driversLicenseNumber || "",
      driversLicenseExpirationDate: client.driversLicenseExpirationDate || "",
      driversLicenseIssuedState: client.driversLicenseIssuedState || "",
      hasSupportingDocuments: client.hasSupportingDocuments || "no",
      businessName: client.businessName || "",
      businessType: client.businessType || "",
      businessStartDate: client.businessStartDate || "",
      timeInBusiness: client.timeInBusiness || "",
      totalBusinessIncome: client.totalBusinessIncome?.toString() || "",
      personalIncome: client.personalIncome?.toString() || "",
      monthlyRevenue: client.monthlyRevenue?.toString() || "",
      existingDebt: client.existingDebt?.toString() || "",
      ficoScore: client.ficoScore?.toString() || "",
      fundingNeeded: client.fundingNeeded?.toString() || "",
      notes: client.notes || "",
      internalNotes: client.internalNotes || "",
    });
    setCreditLogins(parseLoginRows(client.creditProfileLogins));
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const save = () => {
    const nameParts = (form.fullName || "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || client?.firstName || "";
    const lastName = nameParts.length ? nameParts.join(" ") : client?.lastName || firstName;
    updateMutation.mutate({
      id: clientId,
      data: {
        firstName,
        lastName,
        email: form.email || null,
        email2: form.email2 || null,
        phone: form.phone || null,
        phone2: form.phone2 || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zipCode: form.zipCode || null,
        birthDate: form.birthDate || null,
        ssn: form.ssn || null,
        driversLicenseNumber: form.driversLicenseNumber || null,
        driversLicenseExpirationDate: form.driversLicenseExpirationDate || null,
        driversLicenseIssuedState: form.driversLicenseIssuedState || null,
        hasSupportingDocuments: (form.hasSupportingDocuments as "yes" | "no") || null,
        creditProfileLogins: JSON.stringify(creditLogins),
        businessName: form.businessName || null,
        businessType: form.businessType || null,
        businessStartDate: form.businessStartDate || null,
        timeInBusiness: form.timeInBusiness || null,
        totalBusinessIncome: form.totalBusinessIncome || null,
        personalIncome: form.personalIncome || null,
        monthlyRevenue: form.monthlyRevenue || null,
        existingDebt: form.existingDebt || null,
        ficoScore: form.ficoScore ? parseInt(form.ficoScore) : null,
        fundingNeeded: form.fundingNeeded || null,
        notes: form.notes || null,
        internalNotes: form.internalNotes || null,
      },
    });
  };

  const setField = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));
  const val = (field: string) => form[field] ?? "";
  const displayVal = (v: string | number | null | undefined) => (v ? `${v}` : "—");
  const displayRows = useMemo(() => parseLoginRows(client?.creditProfileLogins), [client?.creditProfileLogins]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Personal Information</h2>
        </div>
        {!isEditing ? (
          <Button onClick={startEdit} variant="outline">Edit Information</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEdit} className="gap-1">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button onClick={save} disabled={updateMutation.isPending} className="gap-1">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Full Name", `${client.firstName} ${client.lastName}`.trim()],
                ["Phone 1", client.phone],
                ["Phone 2", client.phone2],
                ["Email 1", client.email],
                ["Email 2", client.email2],
                ["Address", client.address],
                ["City", client.city],
                ["State", client.state],
                ["Zip Code", client.zipCode],
                ["Birth Date", client.birthDate],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 gap-4">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-right">{displayVal(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Full Name</Label>
                <Input value={val("fullName")} onChange={(e) => setField("fullName", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone 1</Label>
                <Input value={val("phone")} onChange={(e) => setField("phone", formatPhone(e.target.value))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone 2</Label>
                <Input value={val("phone2")} onChange={(e) => setField("phone2", formatPhone(e.target.value))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email 1</Label>
                <Input type="email" value={val("email")} onChange={(e) => setField("email", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email 2</Label>
                <Input type="email" value={val("email2")} onChange={(e) => setField("email2", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Address</Label>
                <Input value={val("address")} onChange={(e) => setField("address", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input value={val("city")} onChange={(e) => setField("city", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input value={val("state")} onChange={(e) => setField("state", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Zip Code</Label>
                <Input value={val("zipCode")} onChange={(e) => setField("zipCode", digitsOnly(e.target.value, 10))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Birth Date</Label>
                <Input type="date" value={val("birthDate")} onChange={(e) => setField("birthDate", e.target.value)} className="h-9" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Identifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["SSN", client.ssn],
                ["Driver's License #", client.driversLicenseNumber],
                ["Driver's License Expiration Date", client.driversLicenseExpirationDate],
                ["State Driv. License Issued", client.driversLicenseIssuedState],
                ["Supporting Documents", client.hasSupportingDocuments ? client.hasSupportingDocuments.toUpperCase() : null],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 gap-4">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-right">{displayVal(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">SSN</Label>
                <Input value={val("ssn")} onChange={(e) => setField("ssn", formatSSN(e.target.value))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Driver's License #</Label>
                <Input value={val("driversLicenseNumber")} onChange={(e) => setField("driversLicenseNumber", formatLicense(e.target.value))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Driver's License Expiration Date</Label>
                <Input type="date" value={val("driversLicenseExpirationDate")} onChange={(e) => setField("driversLicenseExpirationDate", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State Driv. License Issued</Label>
                <Input value={val("driversLicenseIssuedState")} onChange={(e) => setField("driversLicenseIssuedState", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Do you have supporting documents?</Label>
                <Select value={val("hasSupportingDocuments") || "no"} onValueChange={(v) => setField("hasSupportingDocuments", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" /> Credit Profile Log-ins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            displayRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No credit profile log-ins added yet.</div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Owner Name", "Platform", "Username", "Password", "Safety Pin", "Security Question", "Security Answer", "Notes"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{displayVal(row.ownerName)}</td>
                        <td className="px-3 py-2">{displayVal(row.platform)}</td>
                        <td className="px-3 py-2">{displayVal(row.username)}</td>
                        <td className="px-3 py-2">{displayVal(row.password)}</td>
                        <td className="px-3 py-2">{displayVal(row.safetyPin)}</td>
                        <td className="px-3 py-2">{displayVal(row.securityQuestion)}</td>
                        <td className="px-3 py-2">{displayVal(row.securityAnswer)}</td>
                        <td className="px-3 py-2">{displayVal(row.notes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Owner Name", "Platform", "Username", "Password", "Safety Pin", "Security Question", "Security Answer", "Notes", ""].map((h) => (
                        <th key={h || 'actions'} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {creditLogins.map((row, idx) => (
                      <tr key={idx} className="border-t align-top">
                        {([
                          "ownerName",
                          "platform",
                          "username",
                          "password",
                          "safetyPin",
                          "securityQuestion",
                          "securityAnswer",
                          "notes",
                        ] as const).map((field) => (
                          <td key={field} className="p-2">
                            <Input
                              value={row[field]}
                              onChange={(e) => setCreditLogins((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: e.target.value } : item))}
                              className="h-9 min-w-[140px]"
                            />
                          </td>
                        ))}
                        <td className="p-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setCreditLogins((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="outline" onClick={() => setCreditLogins((prev) => [...prev, emptyLoginRow()])}>Add Row</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Business Name", client.businessName],
                ["Business Type", client.businessType],
                ["Start Date", client.businessStartDate],
                ["Time in Business", client.timeInBusiness],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 gap-4">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-right">{displayVal(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["Business Name", "businessName"],
                ["Business Type", "businessType"],
                ["Start Date", "businessStartDate"],
                ["Time in Business", "timeInBusiness"],
              ].map(([label, field]) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input value={val(field)} onChange={(e) => setField(field, e.target.value)} className="h-9" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Total Business Income", formatCurrency(client.totalBusinessIncome)],
                ["Personal Income", formatCurrency(client.personalIncome)],
                ["Monthly Revenue", formatCurrency(client.monthlyRevenue)],
                ["Existing Debt", formatCurrency(client.existingDebt)],
                ["FICO Score", client.ficoScore],
                ["Funding Needed", formatCurrency(client.fundingNeeded)],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 gap-4">
                  <span className="text-sm text-muted-foreground">{label as string}</span>
                  <span className="text-sm font-medium text-right">{displayVal(value as string | number | null | undefined)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["Total Business Income ($)", "totalBusinessIncome"],
                ["Personal Income ($)", "personalIncome"],
                ["Monthly Revenue ($)", "monthlyRevenue"],
                ["Existing Debt ($)", "existingDebt"],
                ["FICO Score", "ficoScore"],
                ["Funding Needed ($)", "fundingNeeded"],
              ].map(([label, field]) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" value={val(field)} onChange={(e) => setField(field, e.target.value)} className="h-9" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client-Visible Notes</p>
                <p className="text-sm">{client.notes || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Internal Notes (Admin Only)</p>
                <p className="text-sm">{client.internalNotes || "—"}</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Client-Visible Notes</Label>
                <Textarea value={val("notes")} onChange={(e) => setField("notes", e.target.value)} rows={3} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Internal Notes (Admin Only)</Label>
                <Textarea value={val("internalNotes")} onChange={(e) => setField("internalNotes", e.target.value)} rows={3} className="text-sm" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
