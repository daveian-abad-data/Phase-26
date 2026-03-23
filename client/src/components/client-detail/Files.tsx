import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Upload, Trash2, ExternalLink, FileText, Image, File } from "lucide-react";
import { toast } from "sonner";

interface Props { clientId: number; }

const CATEGORIES = ["Onboarding Docs", "Credit Report", "Bank Statement", "Tax Return", "ID Document", "Contract", "Other"];

const FileIcon = ({ name }: { name: string }) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return <Image className="w-4 h-4 text-blue-500" />;
  if (["pdf"].includes(ext || "")) return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-gray-500" />;
};

export default function ClientDetailFiles({ clientId }: Props) {
  const utils = trpc.useUtils();
  const { data: files, isLoading } = trpc.admin.getUploadedFiles.useQuery({ clientId });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [category, setCategory] = useState("Other");
  const [customName, setCustomName] = useState("");
  const [uploaderName, setUploaderName] = useState("Admin");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const uploadMutation = trpc.admin.uploadFile.useMutation({
    onSuccess: () => {
      utils.admin.getUploadedFiles.invalidate({ clientId });
      setShowDialog(false);
      setUploadedFile(null);
      setCustomName("");
      toast.success("File uploaded successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteFile.useMutation({
    onSuccess: () => { utils.admin.getUploadedFiles.invalidate({ clientId }); toast.success("File deleted"); },
    onError: (err) => toast.error(err.message),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setUploadedFile({ name: file.name, base64, mimeType: file.type });
      setCustomName(file.name);
      setShowDialog(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUpload = () => {
    if (!uploadedFile) return;
    uploadMutation.mutate({
      clientProfileId: clientId,
      originalName: customName || uploadedFile.name,
      base64: uploadedFile.base64,
      mimeType: uploadedFile.mimeType,
      category,
      uploadedBy: uploaderName,
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this file. This action cannot be undone.
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
          <Upload className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Uploaded Files</h2>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="w-4 h-4" /> Upload File
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
      </div>

      <Card>
        <CardContent className="p-0">
          {files?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No files uploaded yet.</p>
              <p className="text-xs mt-1">Click "Upload File" to add documents, images, or reports.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">File</TableHead>
                    <TableHead className="text-xs">File Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Date Uploaded</TableHead>
                    <TableHead className="text-xs">Uploaded By</TableHead>
                    <TableHead className="text-xs w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files?.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <FileIcon name={file.originalName || file.fileName || ""} />
                          <span className="text-muted-foreground">{file.originalName || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{file.fileName || "—"}</TableCell>
                      <TableCell className="text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {file.category || "Other"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-xs">{file.uploadedBy || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setConfirmDeleteId(file.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Upload Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Original File</Label>
              <p className="text-sm font-medium text-muted-foreground">{uploadedFile?.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Display Name</Label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="SSN – Client Name" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Uploaded By</Label>
              <Input value={uploaderName} onChange={(e) => setUploaderName(e.target.value)} placeholder="Admin" className="h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
