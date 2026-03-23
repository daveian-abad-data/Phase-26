import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface ClientFormProps {
  initialData?: any;
  clientId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const FUNDING_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "funded", label: "Funded" },
  { value: "declined", label: "Declined" },
  { value: "on_hold", label: "On Hold" },
];

export function ClientForm({ initialData, clientId, onSuccess, onCancel }: ClientFormProps) {
  const isEdit = !!clientId;

  const [form, setForm] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zipCode: initialData?.zipCode || "",
    businessName: initialData?.businessName || "",
    businessType: initialData?.businessType || "",
    businessStartDate: initialData?.businessStartDate || "",
    timeInBusiness: initialData?.timeInBusiness || "",
    totalBusinessIncome: initialData?.totalBusinessIncome?.toString() || "",
    personalIncome: initialData?.personalIncome?.toString() || "",
    fundingNeeded: initialData?.fundingNeeded?.toString() || "",
    ficoScore: initialData?.ficoScore?.toString() || "",
    monthlyRevenue: initialData?.monthlyRevenue?.toString() || "",
    existingDebt: initialData?.existingDebt?.toString() || "",
    fundingPurpose: initialData?.fundingPurpose || "",
    fundingStatus: initialData?.fundingStatus || "pending",
    fundingAmount: initialData?.fundingAmount?.toString() || "",
    notes: initialData?.notes || "",
    internalNotes: initialData?.internalNotes || "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const createMutation = trpc.admin.createClient.useMutation({ onSuccess });
  const updateMutation = trpc.admin.updateClient.useMutation({ onSuccess });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zipCode: form.zipCode || null,
      businessName: form.businessName || null,
      businessType: form.businessType || null,
      businessStartDate: form.businessStartDate || null,
      timeInBusiness: form.timeInBusiness || null,
      totalBusinessIncome: form.totalBusinessIncome || null,
      personalIncome: form.personalIncome || null,
      fundingNeeded: form.fundingNeeded || null,
      ficoScore: form.ficoScore ? parseInt(form.ficoScore) : null,
      monthlyRevenue: form.monthlyRevenue || null,
      existingDebt: form.existingDebt || null,
      fundingPurpose: form.fundingPurpose || null,
      fundingStatus: form.fundingStatus as any,
      fundingAmount: form.fundingAmount || null,
      notes: form.notes || null,
      internalNotes: form.internalNotes || null,
    };

    if (isEdit && clientId) {
      updateMutation.mutate({ id: clientId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zipCode">Zip</Label>
              <Input
                id="zipCode"
                value={form.zipCode}
                onChange={(e) => set("zipCode", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Business Information */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Business Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessType">Business Type</Label>
            <Input
              id="businessType"
              value={form.businessType}
              onChange={(e) => set("businessType", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessStartDate">Start Date</Label>
            <Input
              id="businessStartDate"
              value={form.businessStartDate}
              onChange={(e) => set("businessStartDate", e.target.value)}
              placeholder="e.g. 2020-01"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timeInBusiness">Time in Business</Label>
            <Input
              id="timeInBusiness"
              value={form.timeInBusiness}
              onChange={(e) => set("timeInBusiness", e.target.value)}
              placeholder="e.g. 3 years"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Financial Information */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Financial Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="totalBusinessIncome">Total Business Income ($)</Label>
            <Input
              id="totalBusinessIncome"
              type="number"
              value={form.totalBusinessIncome}
              onChange={(e) => set("totalBusinessIncome", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personalIncome">Personal Income ($)</Label>
            <Input
              id="personalIncome"
              type="number"
              value={form.personalIncome}
              onChange={(e) => set("personalIncome", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monthlyRevenue">Monthly Revenue ($)</Label>
            <Input
              id="monthlyRevenue"
              type="number"
              value={form.monthlyRevenue}
              onChange={(e) => set("monthlyRevenue", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="existingDebt">Existing Debt ($)</Label>
            <Input
              id="existingDebt"
              type="number"
              value={form.existingDebt}
              onChange={(e) => set("existingDebt", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ficoScore">FICO Score</Label>
            <Input
              id="ficoScore"
              type="number"
              min={300}
              max={850}
              value={form.ficoScore}
              onChange={(e) => set("ficoScore", e.target.value)}
              placeholder="300–850"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fundingNeeded">Funding Needed ($)</Label>
            <Input
              id="fundingNeeded"
              type="number"
              value={form.fundingNeeded}
              onChange={(e) => set("fundingNeeded", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Funding Details */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Funding Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fundingStatus">Status</Label>
            <Select
              value={form.fundingStatus}
              onValueChange={(val) => set("fundingStatus", val)}
            >
              <SelectTrigger id="fundingStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUNDING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fundingAmount">Approved Amount ($)</Label>
            <Input
              id="fundingAmount"
              type="number"
              value={form.fundingAmount}
              onChange={(e) => set("fundingAmount", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="fundingPurpose">Purpose of Funding</Label>
            <Textarea
              id="fundingPurpose"
              value={form.fundingPurpose}
              onChange={(e) => set("fundingPurpose", e.target.value)}
              rows={2}
              placeholder="Describe how the client plans to use the funding..."
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Notes
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notes">Client-Visible Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Notes visible to the client in their portal..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="internalNotes">Internal Notes (Admin Only)</Label>
            <Textarea
              id="internalNotes"
              value={form.internalNotes}
              onChange={(e) => set("internalNotes", e.target.value)}
              rows={3}
              placeholder="Internal notes not visible to the client..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error.message}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEdit ? "Saving..." : "Adding..."}
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Add Client"
          )}
        </Button>
      </div>
    </form>
  );
}
