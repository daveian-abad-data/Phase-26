import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Key, User } from "lucide-react";

interface CredentialFormProps {
  client: { id: number; firstName: string; lastName: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export function CredentialForm({ client, onSuccess, onCancel }: CredentialFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const existingQuery = trpc.admin.getClientCredential.useQuery(
    { clientProfileId: client.id },
    { refetchOnWindowFocus: false }
  );

  const setCredMutation = trpc.admin.setClientCredentials.useMutation({ onSuccess });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCredMutation.mutate({
      clientProfileId: client.id,
      username: username.trim(),
      password,
    });
  };

  const existing = existingQuery.data;

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-muted/40 border border-border">
        <p className="text-sm font-medium text-foreground mb-1">
          {client.firstName} {client.lastName}
        </p>
        {existingQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading existing credentials...</p>
        ) : existing ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Current username:{" "}
              <span className="font-mono font-semibold text-foreground">{existing.username}</span>
            </p>
            {existing.lastLogin && (
              <p className="text-xs text-muted-foreground">
                Last login:{" "}
                {new Date(existing.lastLogin).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-600">No login credentials set yet</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cred-username" className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {existing ? "New Username" : "Username"}
          </Label>
          <Input
            id="cred-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={existing ? existing.username : "Enter username"}
            required
            minLength={3}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cred-password" className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            {existing ? "New Password" : "Password"}
          </Label>
          <div className="relative">
            <Input
              id="cred-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="pr-11"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share these credentials with the client so they can log in to their portal.
          </p>
        </div>

        {setCredMutation.error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {setCredMutation.error.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={setCredMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={setCredMutation.isPending}>
            {setCredMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : existing ? (
              "Update Credentials"
            ) : (
              "Set Credentials"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
