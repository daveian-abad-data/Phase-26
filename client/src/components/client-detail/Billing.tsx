import { useState } from "react";
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
import { Loader2, Plus, Edit2, Trash2, DollarSign, TrendingUp, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#CA8A04", bg: "#FEF9C3" },
  partial:   { label: "Partial",   color: "#2563EB", bg: "#DBEAFE" },
  paid:      { label: "Paid",      color: "#16A34A", bg: "#DCFCE7" },
  overdue:   { label: "Overdue",   color: "#DC2626", bg: "#FEE2E2" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" },
};

const emptyForm = {
  billingStatus: "pending",
  dateIssued: "",
  amountIssued: "",
  amountPaid: "",
  datePaid: "",
  billingLink: "",
  notes: "",
};

function fmtMoney(val: string | number | null | undefined) {
  if (!val) return "—";
  const n = parseFloat(String(val));
  if (isNaN(n)) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Billing({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data: records, isLoading } = trpc.admin.getBillingRecords.useQuery({ clientProfileId: clientId });

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const invalidate = () => utils.admin.getBillingRecords.invalidate({ clientProfileId: clientId });

  const createMutation = trpc.admin.createBillingRecord.useMutation({
    onSuccess: () => { toast.success("Billing record added"); invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.updateBillingRecord.useMutation({
    onSuccess: () => { toast.success("Billing record updated"); invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.deleteBillingRecord.useMutation({
    onSuccess: () => { toast.success("Billing record deleted"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openNew = () => { setEditingId(null); setForm({ ...emptyForm }); setShowDialog(true); };
  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      billingStatus: r.billingStatus || "pending",
      dateIssued: r.dateIssued || "",
      amountIssued: r.amountIssued?.toString() || "",
      amountPaid: r.amountPaid?.toString() || "",
      datePaid: r.datePaid || "",
      billingLink: r.billingLink || "",
      notes: r.notes || "",
    });
    setShowDialog(true);
  };
  const save = () => {
    const payload = {
      clientProfileId: clientId,
      billingStatus: form.billingStatus,
      dateIssued: form.dateIssued || null,
      amountIssued: form.amountIssued || null,
      amountPaid: form.amountPaid || null,
      datePaid: form.datePaid || null,
      billingLink: form.billingLink || null,
      notes: form.notes || null,
    };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };
  const setField = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // Computed metrics
  const totalIssued = (records ?? []).reduce((s, r) => s + parseFloat((r.amountIssued as string) || "0"), 0);
  const totalPaid = (records ?? []).reduce((s, r) => s + parseFloat((r.amountPaid as string) || "0"), 0);
  const totalOutstanding = totalIssued - totalPaid;
  const paidCount = (records ?? []).filter(r => r.billingStatus === "paid").length;
  const overdueCount = (records ?? []).filter(r => r.billingStatus === "overdue").length;
  const pendingCount = (records ?? []).filter(r => r.billingStatus === "pending" || r.billingStatus === "partial").length;

  return (
    <div className="space-y-6">
      {/* Delete Confirmation */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Billing Record?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this billing record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId !== null) { deleteMutation.mutate({ id: confirmDeleteId }); setConfirmDeleteId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Issued", value: fmtMoney(totalIssued), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Paid", value: fmtMoney(totalPaid), icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Outstanding", value: fmtMoney(totalOutstanding), icon: TrendingUp, color: totalOutstanding > 0 ? "text-red-600" : "text-green-600", bg: totalOutstanding > 0 ? "bg-red-50" : "bg-green-50" },
          { label: "Paid Records", value: String(paidCount), icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending/Partial", value: String(pendingCount), icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Overdue", value: String(overdueCount), icon: Clock, color: "text-red-600", bg: "bg-red-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg ${bg}`}><Icon className={`w-3.5 h-3.5 ${color}`} /></div>
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-base font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Billing Records</CardTitle>
            <Button onClick={openNew} size="sm" className="gap-1 h-8">
              <Plus className="w-3.5 h-3.5" /> Add Billing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!records || records.length === 0) ? (
            <div className="text-center py-10 text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No billing records yet. Click "Add Billing" to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date Issued</TableHead>
                    <TableHead className="text-xs text-right">Amount Issued</TableHead>
                    <TableHead className="text-xs text-right">Amount Paid</TableHead>
                    <TableHead className="text-xs">Date Paid</TableHead>
                    <TableHead className="text-xs">Link</TableHead>
                    <TableHead className="text-xs">Notes</TableHead>
                    <TableHead className="text-xs w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => {
                    const cfg = STATUS_CONFIG[r.billingStatus] || STATUS_CONFIG.pending;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{r.dateIssued || "—"}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-blue-700">{fmtMoney(r.amountIssued)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-green-700">{fmtMoney(r.amountPaid)}</TableCell>
                        <TableCell className="text-xs">{r.datePaid || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {r.billingLink ? (
                            <a href={r.billingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs">
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{r.notes || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(r)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(r.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Billing Record" : "Add Billing Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Billing Status</Label>
              <Select value={form.billingStatus} onValueChange={v => setForm(p => ({ ...p, billingStatus: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["Date Issued", "dateIssued", "03/07/2026"],
                ["Amount Issued", "amountIssued", "1500.00"],
                ["Amount Paid", "amountPaid", "1500.00"],
                ["Date Paid", "datePaid", "03/15/2026"],
              ] as [string, string, string][]).map(([label, field, ph]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input value={(form as any)[field]} onChange={setField(field)} placeholder={ph} className="h-8 text-sm" />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Billing Link</Label>
              <Input value={form.billingLink} onChange={setField("billingLink")} placeholder="https://..." className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={setField("notes")} placeholder="Optional notes..." className="text-sm min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
