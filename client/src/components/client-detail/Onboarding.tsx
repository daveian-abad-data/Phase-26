import { useEffect, useMemo, useState, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Trash2, CheckSquare, FileText, Building2, SearchCheck, Wrench } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

const BANK_STATUSES = ["Pending", "Done", "Failed"] as const;
const FILE_REVIEW_STATUSES = ["Pending", "Failed", "Done"] as const;
const OVERALL_ONBOARDING_STATUSES = ["Pending", "Ready", "Ceased"] as const;
const FILE_REVIEW_OVERALL = ["Pending", "Done", "Ceased"] as const;
const CREDIT_REPAIR_STATUSES = ["Pending", "Completed", "Failed"] as const;

type OnboardingCategory = "document" | "bank_relationship" | "file_review";

type NewRow = {
  label: string;
  itemType: string;
  status: string;
  dateUploaded: string;
  dateCompleted: string;
  fileUrl: string;
  bureauName: string;
  accountName: string;
  dateOpened: string;
  dateUpdated: string;
  notes: string;
};

const emptyRow: NewRow = {
  label: "",
  itemType: "",
  status: "",
  dateUploaded: "",
  dateCompleted: "",
  fileUrl: "",
  bureauName: "",
  accountName: "",
  dateOpened: "",
  dateUpdated: "",
  notes: "",
};

export default function ClientDetailOnboarding({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.admin.getOnboarding.useQuery({ clientId });
  const { data: client } = trpc.admin.getClient.useQuery({ id: clientId });

  const [newDoc, setNewDoc] = useState<NewRow>({ ...emptyRow, status: "Pending" });
  const [newBank, setNewBank] = useState<NewRow>({ ...emptyRow, status: "Pending" });
  const [newReview, setNewReview] = useState<NewRow>({ ...emptyRow, status: "Pending" });
  const [creditRepair, setCreditRepair] = useState({
    status: client?.creditRepairStatus || "Pending",
    notes: client?.creditRepairNotes || "",
    dateUpdated: client?.creditRepairDateUpdated || "",
    updatedBy: client?.creditRepairUpdatedBy || "",
  });

  useEffect(() => {
    if (!client) return;
    setCreditRepair({
      status: client.creditRepairStatus || "Pending",
      notes: client.creditRepairNotes || "",
      dateUpdated: client.creditRepairDateUpdated || "",
      updatedBy: client.creditRepairUpdatedBy || "",
    });
  }, [client]);

  const invalidateAll = async () => {
    await Promise.all([
      utils.admin.getOnboarding.invalidate({ clientId }),
      utils.admin.getClient.invalidate({ id: clientId }),
    ]);
  };

  const addMutation = trpc.admin.addOnboardingItem.useMutation({
    onSuccess: async () => { await invalidateAll(); toast.success("Item added"); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateOnboardingItem.useMutation({
    onSuccess: async () => { await invalidateAll(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteOnboardingItem.useMutation({
    onSuccess: async () => { await invalidateAll(); toast.success("Item removed"); },
    onError: (err) => toast.error(err.message),
  });

  const updateClientMutation = trpc.admin.updateClient.useMutation({
    onSuccess: async () => { await invalidateAll(); toast.success("Onboarding settings updated"); },
    onError: (err) => toast.error(err.message),
  });

  const documents = useMemo(() => (items ?? []).filter((i) => i.category === "document"), [items]);
  const banks = useMemo(() => (items ?? []).filter((i) => i.category === "bank_relationship"), [items]);
  const fileReviews = useMemo(() => (items ?? []).filter((i) => i.category === "file_review"), [items]);

  const docsCompleted = documents.filter((i) => i.isCompleted).length;
  const bankCompleted = banks.filter((i) => i.status === "Done").length;
  const reviewDone = fileReviews.filter((i) => i.status === "Done").length;

  const addItem = (category: OnboardingCategory, row: NewRow, reset: (v: NewRow) => void, currentCount: number) => {
    if (!row.label.trim()) {
      toast.error("Please fill the main name field first");
      return;
    }
    addMutation.mutate({
      clientProfileId: clientId,
      category,
      label: row.label.trim(),
      sortOrder: currentCount,
      itemType: row.itemType || null,
      status: row.status || null,
      dateUploaded: row.dateUploaded || null,
      dateCompleted: row.dateCompleted || null,
      fileUrl: row.fileUrl || null,
      bureauName: row.bureauName || null,
      accountName: row.accountName || null,
      dateOpened: row.dateOpened || null,
      dateUpdated: row.dateUpdated || null,
      notes: row.notes || null,
    });
    reset({ ...emptyRow, status: "Pending" });
  };

  if (isLoading || !client) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Onboarding and Preparations</h2>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Overall Status</Label>
          <Select value={client.onboardingPreparationStatus || "Pending"} onValueChange={(value: "Pending" | "Ready" | "Ceased") => updateClientMutation.mutate({ id: clientId, data: { onboardingPreparationStatus: value } })}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{OVERALL_ONBOARDING_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Documents Needed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Metric label="Completed" value={`${docsCompleted}/${documents.length || 0}`} />
            <Metric label="Completion" value={`${documents.length ? Math.round((docsCompleted / documents.length) * 100) : 0}%`} />
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Progress</p><Progress value={documents.length ? (docsCompleted / documents.length) * 100 : 0} className="mt-3" /></div>
          </div>
          <TableShell headers={["Document Name", "Document Type", "Uploaded", "Date Uploaded", "File Link", ""]}>
            {documents.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2"><Input value={item.label} onChange={(e) => updateMutation.mutate({ id: item.id, label: e.target.value })} /></td>
                <td className="p-2"><Input value={item.itemType || ""} onChange={(e) => updateMutation.mutate({ id: item.id, itemType: e.target.value })} /></td>
                <td className="p-2"><div className="flex items-center justify-center"><Checkbox checked={item.isCompleted} onCheckedChange={(checked) => updateMutation.mutate({ id: item.id, isCompleted: !!checked })} /></div></td>
                <td className="p-2"><Input type="date" value={item.dateUploaded || ""} onChange={(e) => updateMutation.mutate({ id: item.id, dateUploaded: e.target.value })} /></td>
                <td className="p-2"><Input value={item.fileUrl || ""} onChange={(e) => updateMutation.mutate({ id: item.id, fileUrl: e.target.value })} placeholder="URL from Uploaded Files" /></td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: item.id })}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>
            ))}
            <tr className="border-t bg-muted/20">
              <td className="p-2"><Input value={newDoc.label} onChange={(e) => setNewDoc((p) => ({ ...p, label: e.target.value }))} placeholder="Document Name" /></td>
              <td className="p-2"><Input value={newDoc.itemType} onChange={(e) => setNewDoc((p) => ({ ...p, itemType: e.target.value }))} placeholder="Type" /></td>
              <td className="p-2"><div className="flex items-center justify-center"><Checkbox checked={false} disabled /></div></td>
              <td className="p-2"><Input type="date" value={newDoc.dateUploaded} onChange={(e) => setNewDoc((p) => ({ ...p, dateUploaded: e.target.value }))} /></td>
              <td className="p-2"><Input value={newDoc.fileUrl} onChange={(e) => setNewDoc((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="File link" /></td>
              <td className="p-2"><Button size="sm" onClick={() => addItem("document", newDoc, setNewDoc, documents.length)}><Plus className="w-4 h-4" /></Button></td>
            </tr>
          </TableShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Bank Relationships</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Metric label="Done" value={`${bankCompleted}/${banks.length || 0}`} />
            <Metric label="Rate" value={`${banks.length ? Math.round((bankCompleted / banks.length) * 100) : 0}%`} />
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Progress</p><Progress value={banks.length ? (bankCompleted / banks.length) * 100 : 0} className="mt-3" /></div>
          </div>
          <TableShell headers={["Bank Name", "Status", "Date Completed", ""]}>
            {banks.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2"><Input value={item.label} onChange={(e) => updateMutation.mutate({ id: item.id, label: e.target.value })} /></td>
                <td className="p-2"><Select value={item.status || "Pending"} onValueChange={(value) => updateMutation.mutate({ id: item.id, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BANK_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></td>
                <td className="p-2"><Input type="date" value={item.dateCompleted || ""} onChange={(e) => updateMutation.mutate({ id: item.id, dateCompleted: e.target.value })} /></td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: item.id })}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>
            ))}
            <tr className="border-t bg-muted/20">
              <td className="p-2"><Input value={newBank.label} onChange={(e) => setNewBank((p) => ({ ...p, label: e.target.value }))} placeholder="Bank Name" /></td>
              <td className="p-2"><Select value={newBank.status} onValueChange={(value) => setNewBank((p) => ({ ...p, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BANK_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></td>
              <td className="p-2"><Input type="date" value={newBank.dateCompleted} onChange={(e) => setNewBank((p) => ({ ...p, dateCompleted: e.target.value }))} /></td>
              <td className="p-2"><Button size="sm" onClick={() => addItem("bank_relationship", newBank, setNewBank, banks.length)}><Plus className="w-4 h-4" /></Button></td>
            </tr>
          </TableShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2"><SearchCheck className="w-4 h-4 text-primary" /> File Review</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Overall Status</Label>
            <Select value={client.fileReviewOverallStatus || "Pending"} onValueChange={(value: "Pending" | "Done" | "Ceased") => updateClientMutation.mutate({ id: clientId, data: { fileReviewOverallStatus: value } })}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{FILE_REVIEW_OVERALL.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Metric label="Pending" value={`${fileReviews.filter((i) => (i.status || "Pending") === "Pending").length}`} />
            <Metric label="Done" value={`${reviewDone}`} />
            <Metric label="Failed" value={`${fileReviews.filter((i) => i.status === "Failed").length}`} />
            <Metric label="Total" value={`${fileReviews.length}`} />
          </div>
          <TableShell headers={["Review Type", "Bureau Name", "Account Name", "Date Open", "Status", "Date Updated", "Notes", ""]}>
            {fileReviews.map((item) => (
              <tr key={item.id} className="border-t align-top">
                <td className="p-2"><Input value={item.label} onChange={(e) => updateMutation.mutate({ id: item.id, label: e.target.value })} /></td>
                <td className="p-2"><Input value={item.bureauName || ""} onChange={(e) => updateMutation.mutate({ id: item.id, bureauName: e.target.value })} /></td>
                <td className="p-2"><Input value={item.accountName || ""} onChange={(e) => updateMutation.mutate({ id: item.id, accountName: e.target.value })} /></td>
                <td className="p-2"><Input type="date" value={item.dateOpened || ""} onChange={(e) => updateMutation.mutate({ id: item.id, dateOpened: e.target.value })} /></td>
                <td className="p-2"><Select value={item.status || "Pending"} onValueChange={(value) => updateMutation.mutate({ id: item.id, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FILE_REVIEW_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></td>
                <td className="p-2"><Input type="date" value={item.dateUpdated || ""} onChange={(e) => updateMutation.mutate({ id: item.id, dateUpdated: e.target.value })} /></td>
                <td className="p-2"><Textarea value={item.notes || ""} onChange={(e) => updateMutation.mutate({ id: item.id, notes: e.target.value })} rows={2} className="min-w-[200px]" /></td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: item.id })}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>
            ))}
            <tr className="border-t bg-muted/20 align-top">
              <td className="p-2"><Input value={newReview.label} onChange={(e) => setNewReview((p) => ({ ...p, label: e.target.value }))} placeholder="Review Type" /></td>
              <td className="p-2"><Input value={newReview.bureauName} onChange={(e) => setNewReview((p) => ({ ...p, bureauName: e.target.value }))} placeholder="Bureau" /></td>
              <td className="p-2"><Input value={newReview.accountName} onChange={(e) => setNewReview((p) => ({ ...p, accountName: e.target.value }))} placeholder="Account Name" /></td>
              <td className="p-2"><Input type="date" value={newReview.dateOpened} onChange={(e) => setNewReview((p) => ({ ...p, dateOpened: e.target.value }))} /></td>
              <td className="p-2"><Select value={newReview.status} onValueChange={(value) => setNewReview((p) => ({ ...p, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FILE_REVIEW_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></td>
              <td className="p-2"><Input type="date" value={newReview.dateUpdated} onChange={(e) => setNewReview((p) => ({ ...p, dateUpdated: e.target.value }))} /></td>
              <td className="p-2"><Textarea value={newReview.notes} onChange={(e) => setNewReview((p) => ({ ...p, notes: e.target.value }))} rows={2} className="min-w-[200px]" /></td>
              <td className="p-2"><Button size="sm" onClick={() => addItem("file_review", newReview, setNewReview, fileReviews.length)}><Plus className="w-4 h-4" /></Button></td>
            </tr>
          </TableShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Credit Repair</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={creditRepair.status} onValueChange={(value) => setCreditRepair((p) => ({ ...p, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CREDIT_REPAIR_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date Updated</Label>
            <Input type="date" value={creditRepair.dateUpdated} onChange={(e) => setCreditRepair((p) => ({ ...p, dateUpdated: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Updated By</Label>
            <Input value={creditRepair.updatedBy} onChange={(e) => setCreditRepair((p) => ({ ...p, updatedBy: e.target.value }))} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={creditRepair.notes} onChange={(e) => setCreditRepair((p) => ({ ...p, notes: e.target.value }))} rows={4} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => updateClientMutation.mutate({ id: clientId, data: { creditRepairStatus: creditRepair.status as any, creditRepairDateUpdated: creditRepair.dateUpdated || null, creditRepairUpdatedBy: creditRepair.updatedBy || null, creditRepairNotes: creditRepair.notes || null } })}>Save Credit Repair</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}

function TableShell({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted/40">
          <tr>{headers.map((h, idx) => <th key={`${h}-${idx}`} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
