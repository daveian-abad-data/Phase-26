import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  FileText,
  CheckSquare,
  CreditCard,
  DollarSign,
  Upload,
  Calendar,
  MessageSquare,
  Camera,
  Loader2,
  TrendingUp,
  Building2,
  Clock,
  Receipt,
  ListChecks,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import ClientDetailPersonalInfo from "@/components/client-detail/PersonalInfo";
import ClientDetailUnderwriting from "@/components/client-detail/Underwriting";
import ClientDetailOnboarding from "@/components/client-detail/Onboarding";
import ClientDetailCreditReports from "@/components/client-detail/CreditReports";
import ClientDetailFunding from "@/components/client-detail/Funding";
import ClientDetailFiles from "@/components/client-detail/Files";
import ClientDetailCalendar from "@/components/client-detail/CalendarTab";
import Billing from "@/components/client-detail/Billing";
import ClientTasks from "@/components/client-detail/ClientTasks";
import TeamTasks from "@/components/client-detail/TeamTasks";

type Tab = "home" | "personal" | "underwriting" | "onboarding" | "credit" | "funding" | "files" | "calendar" | "billing" | "clienttasks" | "teamtasks";

const PROFILE_STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Archive: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0", 10);
  const { user, isAuthenticated, loading: oauthLoading } = useAuth();
  const teamMeQuery = trpc.teamAuth.me.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authLoading = oauthLoading || teamMeQuery.isLoading;
  const isOAuthAdmin = !oauthLoading && isAuthenticated && user?.role === "admin";
  const isTeamMember = !!teamMeQuery.data;
  const isAuthorized = isOAuthAdmin || isTeamMember;

  // All hooks must be at top level
  const { data: client, isLoading, refetch } = trpc.admin.getClient.useQuery(
    { id: clientId },
    { enabled: isAuthorized && !!clientId }
  );
  const { data: underwriting } = trpc.admin.getUnderwriting.useQuery(
    { clientId },
    { enabled: isAuthorized && !!clientId }
  );
  const { data: onboardingItems } = trpc.admin.getOnboarding.useQuery(
    { clientId },
    { enabled: isAuthorized && !!clientId }
  );
  const { data: fundingApps } = trpc.admin.getFundingApplications.useQuery(
    { clientId },
    { enabled: isAuthorized && !!clientId }
  );
  const { data: uploadedFiles } = trpc.admin.getUploadedFiles.useQuery(
    { clientId },
    { enabled: isAuthorized && !!clientId }
  );
  const { data: callLogs } = trpc.admin.getCallLogs.useQuery(
    { clientId },
    { enabled: isAuthorized && !!clientId }
  );
  const { data: creditReports } = trpc.admin.getCreditReports.useQuery(
    { clientId },
    { enabled: isAuthorized && !!clientId }
  );

  const updateClientMutation = trpc.admin.updateClient.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(err.message),
  });

  const uploadPhotoMutation = trpc.admin.uploadClientPhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo updated successfully");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      navigate("/");
    }
  }, [authLoading, isAuthorized, navigate]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized || !client) return null;

  const fullName = `${client.firstName} ${client.lastName}`;
  const profileStatus = client.isActive ? "Active" : "Archive";

  // Quick status summaries
  const docsCompleted = onboardingItems?.filter(i => i.category === "document" && i.isCompleted).length ?? 0;
  const docsTotal = onboardingItems?.filter(i => i.category === "document").length ?? 0;
  const banksCompleted = onboardingItems?.filter(i => i.category === "bank_relationship" && i.isCompleted).length ?? 0;
  const banksTotal = onboardingItems?.filter(i => i.category === "bank_relationship").length ?? 0;

  const onboardingStatus = docsTotal === 0 && banksTotal === 0
    ? "Not Started"
    : docsCompleted === docsTotal && banksCompleted === banksTotal
    ? "Complete"
    : "Pending Documents";

  const creditStatus = creditReports && creditReports.length > 0
    ? `${creditReports.length} Report${creditReports.length > 1 ? "s" : ""} on File`
    : "No Reports";

  const fundingRounds = Array.from(new Set((fundingApps ?? []).map(a => a.round).filter((r): r is string => r !== null))).length;
  const fundingStatus = fundingApps && fundingApps.length > 0
    ? `${fundingRounds} Round${fundingRounds !== 1 ? "s" : ""} Active`
    : "No Applications";

  const filesCount = uploadedFiles?.length ?? 0;
  const filesStatus = filesCount > 0 ? `${filesCount} File${filesCount !== 1 ? "s" : ""}` : "No Files";

  const nextCall = callLogs?.find(c => c.status === "scheduled");
  const calendarStatus = nextCall ? "Call Scheduled" : callLogs && callLogs.length > 0 ? `${callLogs.length} Log${callLogs.length !== 1 ? "s" : ""}` : "No Calls";

  const underwritingStatus = underwriting ? "Complete" : "Not Started";

  const totalFunded = fundingApps
    ?.filter(a => a.status === "approved")
    .reduce((sum, a) => sum + parseFloat(a.appliedLimit || "0"), 0) ?? 0;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadPhotoMutation.mutate({ clientId, base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const menuItems: { id: Tab; label: string; icon: React.ReactNode; status: string; statusColor: string }[] = [
    {
      id: "personal",
      label: "Personal Info",
      icon: <User className="w-4 h-4" />,
      status: `ID #${client.id}`,
      statusColor: "text-primary",
    },
    {
      id: "underwriting",
      label: "Underwriting",
      icon: <FileText className="w-4 h-4" />,
      status: underwritingStatus,
      statusColor: underwriting ? "text-emerald-600" : "text-amber-500",
    },
    {
      id: "onboarding",
      label: "Onboarding and Preparations",
      icon: <CheckSquare className="w-4 h-4" />,
      status: onboardingStatus,
      statusColor: onboardingStatus === "Complete" ? "text-emerald-600" : "text-amber-500",
    },
    {
      id: "credit",
      label: "Credit Reports",
      icon: <CreditCard className="w-4 h-4" />,
      status: creditStatus,
      statusColor: creditReports && creditReports.length > 0 ? "text-emerald-600" : "text-gray-400",
    },
    {
      id: "funding",
      label: "Funding",
      icon: <DollarSign className="w-4 h-4" />,
      status: fundingStatus,
      statusColor: fundingApps && fundingApps.length > 0 ? "text-blue-600" : "text-gray-400",
    },
    {
      id: "files",
      label: "Uploaded Files",
      icon: <Upload className="w-4 h-4" />,
      status: filesStatus,
      statusColor: filesCount > 0 ? "text-blue-600" : "text-gray-400",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <Calendar className="w-4 h-4" />,
      status: calendarStatus,
      statusColor: nextCall ? "text-blue-600" : "text-gray-400",
    },
    {
      id: "billing",
      label: "Billing",
      icon: <Receipt className="w-4 h-4" />,
      status: "Invoices",
      statusColor: "text-blue-600",
    },
    {
      id: "clienttasks",
      label: "Client Task",
      icon: <ListChecks className="w-4 h-4" />,
      status: "Tasks",
      statusColor: "text-amber-500",
    },
    {
      id: "teamtasks",
      label: "Team Task",
      icon: <Users className="w-4 h-4" />,
      status: "Internal",
      statusColor: "text-purple-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Manage Clients
            </Button>
          </div>
          <div className="flex items-center gap-3 self-start rounded-lg border bg-card px-4 py-3 shadow-sm">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Status</p>
              <p className="text-lg font-semibold">{profileStatus}</p>
            </div>
            <Select
              value={profileStatus}
              onValueChange={(value) => updateClientMutation.mutate({ id: clientId, data: { isActive: value === "Active" } })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Archive">Archive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="-mx-4 px-4 border-b border-border overflow-x-auto" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-1" style={{ width: 'max-content', minWidth: '100%' }}>
          <button
            onClick={() => setActiveTab("home")}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "home"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        </div>

        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Menu with Quick Status */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Management Menu
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {/* Header row */}
                    <div className="grid grid-cols-2 px-6 py-2 bg-muted/40">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Section</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Status</span>
                    </div>
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="w-full grid grid-cols-2 px-6 py-4 hover:bg-muted/30 transition-colors text-left group"
                      >
                        <span className="flex items-center gap-2 font-medium text-sm group-hover:text-primary transition-colors">
                          {item.icon}
                          {item.label}
                        </span>
                        <span className={`text-sm font-medium ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Invoice Amount Issued</p>
                    <p className="text-2xl font-bold text-foreground">
                      {client.invoiceAmountIssued
                        ? `$${parseFloat(client.invoiceAmountIssued).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Invoice Amount Paid</p>
                    <p className="text-2xl font-bold text-foreground">
                      {client.invoiceAmountPaid
                        ? `$${parseFloat(client.invoiceAmountPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Mockup */}
              <Card className="border-dashed border-2 border-muted">
                <CardContent className="pt-6 pb-6 flex items-center justify-center gap-3 text-muted-foreground">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-medium">Chat with Client — Coming Soon</span>
                </CardContent>
              </Card>
            </div>

            {/* Right: Client Profile Card */}
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                  {/* Profile Photo */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                      {client.photoUrl ? (
                        <img src={client.photoUrl} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 text-muted-foreground/40" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPhotoMutation.isPending}
                      className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-colors"
                    >
                      {uploadPhotoMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3" />
                      )}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
                    {client.businessName && (
                      <p className="text-sm text-muted-foreground">{client.businessName}</p>
                    )}

                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Overall Status</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PROFILE_STATUS_COLORS[profileStatus]}`}>
                        {profileStatus}
                      </span>
                    </div>
                    {underwriting?.dateContractSigned && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Contract Signed</span>
                        <span className="text-xs font-medium">{underwriting.dateContractSigned}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="w-full space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Tier Type</span>
                      <span className="text-xs font-semibold">{client.tierType || underwriting?.initialTierType || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Total Funded</span>
                      <span className="text-xs font-semibold text-emerald-600">
                        {totalFunded > 0 ? `$${totalFunded.toLocaleString()}` : "—"}
                      </span>
                    </div>
                    {client.ficoScore && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">FICO Score</span>
                        <span className="text-xs font-semibold">{client.ficoScore}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Email</span>
                        <span className="text-xs font-medium truncate max-w-[140px]">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Phone</span>
                        <span className="text-xs font-medium">{client.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Funding Needed</span>
                    <span className="font-medium">
                      {client.fundingNeeded ? `$${parseFloat(client.fundingNeeded).toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Business Income</span>
                    <span className="font-medium">
                      {client.totalBusinessIncome ? `$${parseFloat(client.totalBusinessIncome).toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Personal Income</span>
                    <span className="font-medium">
                      {client.personalIncome ? `$${parseFloat(client.personalIncome).toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Funding Rounds</span>
                    <span className="font-medium">{fundingRounds || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium">{docsTotal > 0 ? `${docsCompleted}/${docsTotal}` : "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client Since</span>
                    <span className="font-medium">
                      {new Date(client.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SECTION TABS */}
        {activeTab !== "home" && (
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
              {client.businessName && (
                <p className="text-sm text-muted-foreground">{client.businessName}</p>
              )}

            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${PROFILE_STATUS_COLORS[profileStatus]}`}>
              {profileStatus}
            </span>
          </div>
        )}
        {activeTab === "personal" && <ClientDetailPersonalInfo clientId={clientId} />}
        {activeTab === "underwriting" && <ClientDetailUnderwriting clientId={clientId} />}
        {activeTab === "onboarding" && <ClientDetailOnboarding clientId={clientId} />}
        {activeTab === "credit" && <ClientDetailCreditReports clientId={clientId} />}
        {activeTab === "funding" && <ClientDetailFunding clientId={clientId} />}
        {activeTab === "files" && <ClientDetailFiles clientId={clientId} />}
        {activeTab === "calendar" && <ClientDetailCalendar clientId={clientId} />}
        {activeTab === "billing" && <Billing clientId={clientId} />}
        {activeTab === "clienttasks" && <ClientTasks clientId={clientId} />}
        {activeTab === "teamtasks" && <TeamTasks clientId={clientId} />}
      </div>
    </DashboardLayout>
  );
}
