import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ClientLogin from "./pages/ClientLogin";
import ClientPortal from "./pages/ClientPortal";
import AdminDashboard from "./pages/AdminDashboard";
import ClientDetail from "./pages/ClientDetail";
import TeamMembers from "./pages/TeamMembers";
import TeamLogin from "./pages/TeamLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/client-login" component={ClientLogin} />
      <Route path="/portal" component={ClientPortal} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/client/:id" component={ClientDetail} />
      <Route path="/admin/team" component={TeamMembers} />
      <Route path="/team-login" component={TeamLogin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
