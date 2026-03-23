import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Edit2, Trash2, Users, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

const URGENCY_CONFIG = {
  High: { color: "#DC2626", bg: "#FEE2E2" },
  Fair: { color: "#CA8A04", bg: "#FEF9C3" },
  Low:  { color: "#16A34A", bg: "#DCFCE7" },
};
const STATUS_CONFIG = {
  Ongoing:  { color: "#2563EB", bg: "#DBEAFE" },
  Complete: { color: "#16A34A", bg: "#DCFCE7" },
  Failed:   { color: "#DC2626", bg: "#FEE2E2" },
};
const COMPLETION_RATES = ["0%","10%","20%","30%","40%","50%","60%","70%","80%","90%","100%"];

const emptyForm = {
  taskTitle: "",
  taskDetails: "",
  urgency: "Fair" as "High" | "Fair" | "Low",
  assignedBy: "",
  assignedTo: "",
  dateAssigned: "",
  dueDate: "",
  status: "Ongoing" as "Ongoing" | "Complete" | "Failed",
  resultNotes: "",
  completionRate: "0%",
};

export default function TeamTasks({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.admin.getTeamTasks.useQuery({ clientProfileId: clientId });

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const invalidate = () => utils.admin.getTeamTasks.invalidate({ clientProfileId: clientId });

  const createMutation = trpc.admin.createTeamTask.useMutation({
    onSuccess: () => { toast.success("Team task added"); invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.updateTeamTask.useMutation({
    onSuccess: () => { toast.success("Team task updated"); invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.deleteTeamTask.useMutation({
    onSuccess: () => { toast.success("Team task deleted"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openNew = () => { setEditingId(null); setForm({ ...emptyForm }); setShowDialog(true); };
  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      taskTitle: t.taskTitle || "",
      taskDetails: t.taskDetails || "",
      urgency: t.urgency || "Fair",
      assignedBy: t.assignedBy || "",
      assignedTo: t.assignedTo || "",
      dateAssigned: t.dateAssigned || "",
      dueDate: t.dueDate || "",
      status: t.status || "Ongoing",
      resultNotes: t.resultNotes || "",
      completionRate: t.completionRate || "0%",
    });
    setShowDialog(true);
  };
  const save = () => {
    if (!form.taskTitle.trim()) { toast.error("Task title is required"); return; }
    const payload = { clientProfileId: clientId, ...form };
    if (editingId) updateMutation.mutate({ id: editingId, ...form });
    else createMutation.mutate(payload);
  };
  const setField = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // Metrics
  const total = tasks?.length ?? 0;
  const ongoing = tasks?.filter(t => t.status === "Ongoing").length ?? 0;
  const complete = tasks?.filter(t => t.status === "Complete").length ?? 0;
  const failed = tasks?.filter(t => t.status === "Failed").length ?? 0;
  const highUrgency = tasks?.filter(t => t.urgency === "High").length ?? 0;
  const fairUrgency = tasks?.filter(t => t.urgency === "Fair").length ?? 0;
  const lowUrgency = tasks?.filter(t => t.urgency === "Low").length ?? 0;
  const ongoingRate = total > 0 ? Math.round((ongoing / total) * 100) : 0;
  const failedRate = total > 0 ? Math.round((failed / total) * 100) : 0;
  const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Delete Confirmation */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Task?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this task. This action cannot be undone.</AlertDialogDescription>
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

      {/* Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total Tasks", value: String(total), color: "text-slate-700", bg: "bg-slate-50", icon: Users },
          { label: "Ongoing Rate", value: `${ongoingRate}%`, color: "text-blue-600", bg: "bg-blue-50", icon: Clock },
          { label: "Completion Rate", value: `${completionRate}%`, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
          { label: "Failed Rate", value: `${failedRate}%`, color: "text-red-600", bg: "bg-red-50", icon: XCircle },
          { label: "High Urgency", value: String(highUrgency), color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
          { label: "Fair Urgency", value: String(fairUrgency), color: "text-yellow-600", bg: "bg-yellow-50", icon: AlertTriangle },
          { label: "Low Urgency", value: String(lowUrgency), color: "text-green-600", bg: "bg-green-50", icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
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

      {/* Tasks Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Team Tasks</CardTitle>
            <Button onClick={openNew} size="sm" className="gap-1 h-8">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!tasks || tasks.length === 0) ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No team tasks yet. Click "Add Task" to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Task Title</TableHead>
                    <TableHead className="text-xs">Urgency</TableHead>
                    <TableHead className="text-xs">Assigned By</TableHead>
                    <TableHead className="text-xs">Assigned To</TableHead>
                    <TableHead className="text-xs">Date Assigned</TableHead>
                    <TableHead className="text-xs">Due Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Completion</TableHead>
                    <TableHead className="text-xs">Result Notes</TableHead>
                    <TableHead className="text-xs w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => {
                    const urgCfg = URGENCY_CONFIG[t.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.Fair;
                    const stsCfg = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.Ongoing;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-medium max-w-[140px]">
                          <div className="truncate" title={t.taskTitle}>{t.taskTitle}</div>
                          {t.taskDetails && <div className="text-muted-foreground truncate text-[10px] mt-0.5" title={t.taskDetails}>{t.taskDetails}</div>}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: urgCfg.bg, color: urgCfg.color }}>
                            {t.urgency}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{t.assignedBy || "—"}</TableCell>
                        <TableCell className="text-xs font-medium">{t.assignedTo || "—"}</TableCell>
                        <TableCell className="text-xs">{t.dateAssigned || "—"}</TableCell>
                        <TableCell className="text-xs">{t.dueDate || "—"}</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: stsCfg.bg, color: stsCfg.color }}>
                            {t.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{t.completionRate || "0%"}</TableCell>
                        <TableCell className="text-xs max-w-[100px] truncate">{t.resultNotes || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(t)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(t.id)}>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Team Task" : "Add Team Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Task Title <span className="text-destructive">*</span></Label>
              <Input value={form.taskTitle} onChange={setField("taskTitle")} placeholder="e.g. Review client credit report" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Urgency</Label>
                <Select value={form.urgency} onValueChange={v => setForm(p => ({ ...p, urgency: v as any }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["High", "Fair", "Low"] as const).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Ongoing", "Complete", "Failed"] as const).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Assigned By</Label>
                <Input value={form.assignedBy} onChange={setField("assignedBy")} placeholder="e.g. John Smith" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Assigned To</Label>
                <Input value={form.assignedTo} onChange={setField("assignedTo")} placeholder="e.g. Jane Doe" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date Assigned</Label>
                <Input value={form.dateAssigned} onChange={setField("dateAssigned")} placeholder="03/07/2026" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Due Date</Label>
                <Input value={form.dueDate} onChange={setField("dueDate")} placeholder="03/14/2026" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Completion Rate</Label>
                <Select value={form.completionRate} onValueChange={v => setForm(p => ({ ...p, completionRate: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPLETION_RATES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Task Details</Label>
              <Textarea value={form.taskDetails} onChange={setField("taskDetails")} placeholder="Describe the task in detail..." className="text-sm min-h-[70px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Result Notes</Label>
              <Textarea value={form.resultNotes} onChange={setField("resultNotes")} placeholder="Notes on the outcome..." className="text-sm min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
