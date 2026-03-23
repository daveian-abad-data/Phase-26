import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Edit2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyLog = { callTitle: "", callDate: "", callTime: "", host: "", status: "scheduled", recordingLink: "", notes: "" };

export default function ClientDetailCalendar({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data: logs, isLoading } = trpc.admin.getCallLogs.useQuery({ clientId });

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyLog);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const createMutation = trpc.admin.addCallLog.useMutation({
    onSuccess: () => { utils.admin.getCallLogs.invalidate({ clientId }); setShowDialog(false); toast.success("Call log added"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateCallLog.useMutation({
    onSuccess: () => { utils.admin.getCallLogs.invalidate({ clientId }); setShowDialog(false); toast.success("Call log updated"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteCallLog.useMutation({
    onSuccess: () => { utils.admin.getCallLogs.invalidate({ clientId }); toast.success("Call log deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const openNew = () => { setEditingId(null); setForm(emptyLog); setShowDialog(true); };
  const openEdit = (l: any) => {
    setEditingId(l.id);
    setForm({ callTitle: l.callTitle || "", callDate: l.callDate || "", callTime: l.callTime || "", host: l.host || "", status: l.status || "scheduled", recordingLink: l.recordingLink || "", notes: l.notes || "" });
    setShowDialog(true);
  };

  const save = () => {
    const payload = { clientProfileId: clientId, callTitle: form.callTitle || "Untitled Call", callDate: form.callDate || null, callTime: form.callTime || null, host: form.host || null, status: form.status as "scheduled" | "completed" | "cancelled" | "no_show", recordingLink: form.recordingLink || null, notes: form.notes || null };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  // Calendar grid
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // Get dates that have call logs
  const logDates = new Set(
    logs?.map(l => l.callDate).filter(Boolean) ?? []
  );

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-700",
  };

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this call log entry. This action cannot be undone.
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Calendar</h2>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Add Call Log
        </Button>
      </div>

      {/* Simple Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Book a Call</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[140px] text-center">{MONTHS[calMonth]} {calYear}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${(calMonth + 1).toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${calYear}`;
              const hasLog = logDates.has(dateStr);
              const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative cursor-default
                    ${isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted/50"}
                    ${hasLog && !isToday ? "bg-blue-50 border border-blue-200" : ""}
                  `}
                >
                  {day}
                  {hasLog && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">Blue dots indicate days with scheduled calls</p>
        </CardContent>
      </Card>

      {/* Call Logs Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Call Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No call logs yet. Click "Add Call Log" to record a call.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Call Title</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Host</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Recording</TableHead>
                    <TableHead className="text-xs">Notes</TableHead>
                    <TableHead className="text-xs w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-medium">{log.callTitle || "—"}</TableCell>
                      <TableCell className="text-xs">{log.callDate || "—"}</TableCell>
                      <TableCell className="text-xs">{log.callTime || "—"}</TableCell>
                      <TableCell className="text-xs">{log.host || "—"}</TableCell>
                      <TableCell className="text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[log.status || "scheduled"] || "bg-gray-100 text-gray-700"}`}>
                          {log.status?.replace("_", " ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.recordingLink ? (
                          <a href={log.recordingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                            View
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{log.notes || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(log)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setConfirmDeleteId(log.id)}>
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
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Call Log" : "Add Call Log"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[["Call Title", "callTitle", "Underwriting Call"], ["Date", "callDate", "01/25/2026"], ["Time", "callTime", "2:00 PM"], ["Host", "host", "John Employee"], ["Recording Link", "recordingLink", "https://..."]].map(([label, field, ph]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={(form as any)[field]} onChange={set(field)} placeholder={ph} className="h-8 text-sm" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["scheduled", "Scheduled"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["no_show", "No Show"]].map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={set("notes")} placeholder="Call notes..." className="text-sm min-h-[80px]" />
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
