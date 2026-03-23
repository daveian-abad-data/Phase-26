import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  Eye,
  Loader2,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { ClientForm } from "@/components/ClientForm";
import { CredentialForm } from "@/components/CredentialForm";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  funded: "Funded",
  declined: "Declined",
  on_hold: "On Hold",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  funded: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  on_hold: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatCurrency(val: string | null | undefined): string {
  if (!val) return "—";
  const num = parseFloat(val);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: oauthLoading } = useAuth();
  const teamMeQuery = trpc.teamAuth.me.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [credClient, setCredClient] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewClient, setViewClient] = useState<any>(null);

  // All hooks MUST be declared before any conditional returns (Rules of Hooks)
  const loading = oauthLoading || teamMeQuery.isLoading;
  const isOAuthAdmin = !oauthLoading && isAuthenticated && user?.role === "admin";
  const isTeamMember = !!teamMeQuery.data;
  const isAuthorized = isOAuthAdmin || isTeamMember;

  const statsQuery = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthorized });
  const clientsQuery = trpc.admin.listClients.useQuery(
    { search: debouncedSearch || undefined },
    { enabled: isAuthorized }
  );

  const utils = trpc.useUtils();

  const deleteMutation = trpc.admin.deleteClient.useMutation({
    onSuccess: () => {
      toast.success("Client deleted successfully");
      utils.admin.listClients.invalidate();
      utils.admin.getStats.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Auth guard — must be in useEffect to avoid setState-in-render error
  useEffect(() => {
    if (!loading && !isAuthorized) {
      navigate("/");
    }
  }, [loading, isAuthorized]);

  // Conditional returns AFTER all hooks
  if (loading) return null;
  if (!isAuthorized) return null;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const stats = statsQuery.data;
  const clients = clientsQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Client Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage all client profiles and funding applications
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            {
              icon: Users,
              label: "Total Clients",
              value: stats?.total ?? "—",
              sub: `${stats?.pending ?? 0} pending`,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: TrendingUp,
              label: "Total Funded Clients",
              value: stats?.totalFundedClients ?? "—",
              sub: "with funding approved",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              icon: DollarSign,
              label: "Total Funded Amount",
              value: formatCurrency(stats?.totalFundedAmount?.toString()),
              sub: "sum of approved amounts",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: Receipt,
              label: "Billing Issued",
              value: formatCurrency(stats?.totalBillingIssued?.toString()),
              sub: "total invoices issued",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              icon: CheckCircle2,
              label: "Billing Collected",
              value: formatCurrency(stats?.totalBillingCollected?.toString()),
              sub: "total invoices paid",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((s) => (
            <Card key={s.label} className="border-border shadow-sm">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Summary */}
        {stats && (
          <div className="flex flex-wrap gap-2">
            {Object.entries({
              pending: stats.pending,
              under_review: stats.underReview,
              approved: stats.approved,
              funded: stats.funded,
              on_hold: stats.onHold,
              declined: stats.declined,
            }).map(([status, count]) => (
              <div
                key={status}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${STATUS_CLASSES[status]}`}
              >
                <span>{STATUS_LABELS[status]}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Client Table */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">All Clients</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, business..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clientsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">
                  {search ? "No clients match your search" : "No clients yet"}
                </p>
                {!search && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setAddOpen(true)}
                  >
                    Add your first client
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                        Business
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                        Funding Needed
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                        FICO
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-border/50 hover:bg-primary/5 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/admin/client/${client.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {client.firstName} {client.lastName}
                            </p>
                            {client.email && (
                              <p className="text-xs text-muted-foreground">{client.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                          {client.businessName || "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell font-medium text-foreground">
                          {formatCurrency(client.fundingNeeded as string)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-foreground">
                          {client.ficoScore ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              STATUS_CLASSES[client.fundingStatus] || ""
                            }`}
                          >
                            {STATUS_LABELS[client.fundingStatus] || client.fundingStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/client/${client.id}`); }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Open
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => navigate(`/admin/client/${client.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Open Full Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditClient(client)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Quick Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCredClient(client)}>
                                  <Key className="w-4 h-4 mr-2" />
                                  Set Login Credentials
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(client.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Client
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              Add New Client
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={() => {
              setAddOpen(false);
              utils.admin.listClients.invalidate();
              utils.admin.getStats.invalidate();
              toast.success("Client added successfully");
            }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editClient} onOpenChange={(o) => !o && setEditClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              Edit Client
            </DialogTitle>
          </DialogHeader>
          {editClient && (
            <ClientForm
              initialData={editClient}
              clientId={editClient.id}
              onSuccess={() => {
                setEditClient(null);
                utils.admin.listClients.invalidate();
                utils.admin.getStats.invalidate();
                toast.success("Client updated successfully");
              }}
              onCancel={() => setEditClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Credential Dialog */}
      <Dialog open={!!credClient} onOpenChange={(o) => !o && setCredClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              Set Login Credentials
            </DialogTitle>
          </DialogHeader>
          {credClient && (
            <CredentialForm
              client={credClient}
              onSuccess={() => {
                setCredClient(null);
                toast.success("Credentials updated successfully");
              }}
              onCancel={() => setCredClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={!!viewClient} onOpenChange={(o) => !o && setViewClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              Client Details
            </DialogTitle>
          </DialogHeader>
          {viewClient && <ClientDetailView client={viewClient} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewClient(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setEditClient(viewClient);
                setViewClient(null);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client profile and all associated login credentials.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function ClientDetailView({ client }: { client: any }) {
  function fmt(val: any) {
    if (!val) return "—";
    const num = parseFloat(val);
    if (!isNaN(num) && val.toString().includes(".")) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
    }
    return val;
  }

  const sections = [
    {
      title: "Personal",
      fields: [
        ["First Name", client.firstName],
        ["Last Name", client.lastName],
        ["Email", client.email],
        ["Phone", client.phone],
        ["Address", client.address],
        ["City", client.city],
        ["State", client.state],
        ["Zip Code", client.zipCode],
      ],
    },
    {
      title: "Business",
      fields: [
        ["Business Name", client.businessName],
        ["Business Type", client.businessType],
        ["Start Date", client.businessStartDate],
        ["Time in Business", client.timeInBusiness],
        ["Monthly Revenue", fmt(client.monthlyRevenue)],
      ],
    },
    {
      title: "Financials",
      fields: [
        ["Total Business Income", fmt(client.totalBusinessIncome)],
        ["Personal Income", fmt(client.personalIncome)],
        ["Funding Needed", fmt(client.fundingNeeded)],
        ["Approved Amount", fmt(client.fundingAmount)],
        ["Existing Debt", fmt(client.existingDebt)],
        ["FICO Score", client.ficoScore],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="font-semibold text-foreground">
            {client.firstName} {client.lastName}
          </h3>
          {client.businessName && (
            <p className="text-sm text-muted-foreground">{client.businessName}</p>
          )}
        </div>
        <span
          className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            STATUS_CLASSES[client.fundingStatus] || ""
          }`}
        >
          {STATUS_LABELS[client.fundingStatus] || client.fundingStatus}
        </span>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {section.title}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {section.fields.map(([label, value]) => (
              <div key={label} className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {client.fundingPurpose && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Funding Purpose
          </h4>
          <p className="text-sm text-foreground">{client.fundingPurpose}</p>
        </div>
      )}

      {client.notes && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Notes
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {client.internalNotes && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Internal Notes
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">{client.internalNotes}</p>
        </div>
      )}
    </div>
  );
}
