import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CLIENT_SESSION_KEY = "ft_client_session";

export function getClientSession(): { token: string; profileId: number } | null {
  try {
    const raw = localStorage.getItem(CLIENT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setClientSession(token: string, profileId: number) {
  localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify({ token, profileId }));
}

export function clearClientSession() {
  localStorage.removeItem(CLIENT_SESSION_KEY);
}

export default function ClientLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.clientAuth.login.useMutation({
    onSuccess: (data) => {
      setClientSession(data.token, data.clientProfileId);
      toast.success("Welcome back!");
      navigate("/portal");
    },
    onError: (err) => {
      setError(err.message || "Invalid username or password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.97 0.005 240)" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
          <div className="flex items-center gap-3 mx-auto">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663397240618/oDZY4ar9m3XQtQ6MXywepz/empower-logo_1a7a46aa.png" alt="Empower" className="h-7 w-7 object-contain" />
            <span
              className="font-black text-foreground uppercase tracking-widest"
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.15em' }}
            >
              EMPOWER
            </span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Decorative top bar */}
          <div
            className="h-1 rounded-t-lg mb-0"
            style={{
              background: "linear-gradient(90deg, oklch(0.28 0.07 245), oklch(0.78 0.12 75))",
            }}
          />

          <Card className="rounded-t-none shadow-xl border-border">
            <CardHeader className="pb-4 pt-8 px-8">
              <div className="text-center">
                <h1
                  className="text-2xl font-bold text-foreground mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Client Portal
                </h1>
                <p className="text-muted-foreground text-sm">
                  Sign in to view your funding profile and application status
                </p>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 border-input focus:ring-2 focus:ring-primary/20"
                    autoComplete="username"
                    disabled={loginMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-11 border-input focus:ring-2 focus:ring-primary/20"
                      autoComplete="current-password"
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={loginMutation.isPending}
                  style={{
                    background: loginMutation.isPending
                      ? undefined
                      : "linear-gradient(135deg, oklch(0.28 0.07 245), oklch(0.32 0.08 245))",
                  }}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Your credentials are provided by your funding advisor.
                  <br />
                  Contact your advisor if you need access.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
