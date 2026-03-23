import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Edit2, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

const STATUS_COLORS: Record<string, string> = {
  "Approved": "bg-green-100 text-green-800",
  "Denied": "bg-red-100 text-red-800",
  "Conditionally Approved": "bg-yellow-100 text-yellow-800",
  "Pending": "bg-gray-100 text-gray-700",
};

const emptyApp = {
  callDate: "", round: "", product: "", type: "", rates: "",
  appliedLimit: "", status: "Pending",
};

export default function ClientDetailFunding({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data: apps, isLoading } = trpc.admin.getFundingApplications.useQuery({ clientId });
  const { data: clientData } = trpc.admin.getClient.useQuery({ id: clientId });
  const { data: underwriting } = trpc.admin.getUnderwriting.useQuery({ clientId });

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyApp);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const createMutation = trpc.admin.addFundingApplication.useMutation({
    onSuccess: () => { utils.admin.getFundingApplications.invalidate({ clientId }); setShowDialog(false); toast.success("Application added"); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateFundingApplication.useMutation({
    onSuccess: () => { utils.admin.getFundingApplications.invalidate({ clientId }); setShowDialog(false); toast.success("Application updated"); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteFundingApplication.useMutation({
    onSuccess: () => { utils.admin.getFundingApplications.invalidate({ clientId }); toast.success("Application deleted"); },
    onError: (err) => toast.error(err.message),
  });

  const confirmDelete = (id: number) => setConfirmDeleteId(id);
  const openNew = () => { setEditingId(null); setForm(emptyApp); setShowDialog(true); };
  const openEdit = (a: any) => {
    setEditingId(a.id);
    setForm({ callDate: a.callDate || "", round: a.round || "", product: a.product || "", type: a.type || "", rates: a.rates || "", appliedLimit: a.appliedLimit?.toString() || "", status: a.status || "Pending" });
    setShowDialog(true);
  };

  const save = () => {
    const payload = { clientProfileId: clientId, callDate: form.callDate || null, round: form.round || null, product: form.product || null, type: form.type || null, rates: form.rates || null, appliedLimit: form.appliedLimit || null, status: form.status };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate({ ...payload, clientProfileId: clientId });
  };

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // Computed summaries
  const statusGroups = ["Approved", "Conditionally Approved", "Pending", "Denied"] as const;
  const summary = statusGroups.map(s => {
    const group = apps?.filter(a => a.status === s) ?? [];
    const total = group.reduce((sum, a) => sum + parseFloat(a.appliedLimit || "0"), 0);
    return { status: s, count: group.length, total };
  });
  const totalFunded = (apps?.filter(a => a.status === "Approved").reduce((s, a) => s + parseFloat((a.appliedLimit as string) || "0"), 0) ?? 0);
  const totalGross = (apps?.reduce((s, a) => s + parseFloat(a.appliedLimit || "0"), 0) ?? 0);

  // Funding rounds info
  const rounds = Array.from(new Set((apps ?? []).map(a => a.round).filter((r): r is string => r !== null)));
  const firstRoundDate = apps?.filter(a => a.callDate).sort((a, b) => (a.callDate ?? "").localeCompare(b.callDate ?? ""))[0]?.callDate;
  const lastRoundDate = apps?.filter(a => a.callDate).sort((a, b) => (b.callDate ?? "").localeCompare(a.callDate ?? ""))[0]?.callDate;

  const daysBetween = (d1: string | null | undefined, d2: string | null | undefined) => {
    if (!d1 || !d2) return null;
    const t1 = new Date(d1).getTime(), t2 = new Date(d2).getTime();
    return Math.round(Math.abs(t2 - t1) / (1000 * 60 * 60 * 24));
  };

  const daysFirstToLast = daysBetween(firstRoundDate, lastRoundDate);
  const daysAcquiredToCurrent = clientData?.createdAt
    ? Math.round((Date.now() - new Date(clientData.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Funding Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this funding application. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId !== null) { deleteMutation.mutate({ id: confirmDeleteId }); setConfirmDeleteId(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Status Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Card Status Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Card Status</TableHead>
                  <TableHead className="text-xs text-right">Cards (Count)</TableHead>
                  <TableHead className="text-xs text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map(s => (
                  <TableRow key={s.status}>
                    <TableCell className="text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-700"}`}>
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

        {/* Rounds Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Funding Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ["Number of Funding Rounds", `${rounds.length} rounds`],
              ["First Funding Round Date", firstRoundDate || "—"],
              ["Last Funding Round Date", lastRoundDate || "—"],
              ["Days (1st Round to Last Round)", daysFirstToLast != null ? `${daysFirstToLast} days` : "—"],
              ["Date Contract Signed", underwriting?.dateContractSigned ? new Date(underwriting.dateContractSigned).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
              ["Days (Since Contract Signed)", underwriting?.dateContractSigned ? `${Math.round((Date.now() - new Date(underwriting.dateContractSigned).getTime()) / (1000 * 60 * 60 * 24))} days` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                <span className="text-muted-foreground italic">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Funding Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {apps?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No funding applications yet. Use the button below to add the first application.
            </div>
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
                    <TableHead className="text-xs w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps?.map((app) => (
                    <TableRow key={app.id} className={(app.status as string) === "Denied" ? "bg-red-50/50" : (app.status as string)?.startsWith("Approved") ? "bg-green-50/50" : (app.status as string) === "Conditionally Approved" ? "bg-yellow-50/50" : ""}>
                      <TableCell className="text-xs">{app.callDate || "—"}</TableCell>
                      <TableCell className="text-xs font-bold text-primary">{app.round || "—"}</TableCell>
                      <TableCell className="text-xs">{app.product || "—"}</TableCell>
                      <TableCell className="text-xs">{app.type || "—"}</TableCell>
                      <TableCell className="text-xs">{app.rates || "—"}</TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {app.appliedLimit ? `$${parseFloat(app.appliedLimit).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status || ""] || "bg-gray-100 text-gray-700"}`}>
                          {app.status || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(app)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => confirmDelete(app.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <div className="px-4 pb-4 pt-2">
          <Button onClick={openNew} variant="outline" className="w-full gap-2 border-dashed">
            <Plus className="w-4 h-4" /> Add Application
          </Button>
        </div>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Application" : "Add Funding Application"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {[["Call Date", "callDate", "01/30/2026"], ["Round", "round", "R1"], ["Product", "product", "SoFi Personal Loan"], ["Type", "type", "PLOAN"], ["Rates", "rates", "Low-Int"], ["Applied Limit", "appliedLimit", "15000"]].map(([label, field, ph]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={(form as any)[field]} onChange={set(field)} placeholder={ph} className="h-8 text-sm" />
              </div>
            ))}
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Approved", "Conditionally Approved", "Pending", "Denied"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
