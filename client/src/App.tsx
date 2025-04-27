import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tests from "@/pages/tests";
import Candidates from "@/pages/candidates";
import CandidateDetails from "@/pages/candidate-details";
import Settings from "@/pages/settings";
import Sidebar from "@/components/layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

// Importing test-taking component
import TakeTestPage from "./pages/take-test";

function Router() {
  const [location] = useLocation();
  const isTakeTestRoute = location.startsWith("/take-test");
  const isMobile = useIsMobile();

  // Only show the sidebar for admin pages, not for test-taking pages
  if (isTakeTestRoute) {
    return (
      <main className="min-h-screen overflow-y-auto bg-white">
        <Switch>
          <Route path="/take-test/:token" component={TakeTestPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar will handle its own visibility on mobile/desktop */}
      <Sidebar />
      
      {/* Main content area, full width on mobile, partial width on desktop */}
      <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-20 md:pb-4">
        <div className={`container mx-auto px-4 ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/tests" component={Tests} />
            <Route path="/candidates" component={Candidates} />
            <Route path="/candidates/:id" component={CandidateDetails} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
