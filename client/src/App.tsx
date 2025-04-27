import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tests from "@/pages/tests";
import Candidates from "@/pages/candidates";
import Settings from "@/pages/settings";
import Sidebar from "@/components/layout/Sidebar";

// Динамический маршрут для компонента прохождения теста
const TakeTestPage = (props: any) => {
  const TakeTest = require("../src/pages/take-test").default;
  return <TakeTest {...props} />;
};

function Router() {
  const [location] = useLocation();
  const isTakeTestRoute = location.startsWith("/take-test");

  // Only show the sidebar for admin pages, not for test-taking pages
  if (isTakeTestRoute) {
    return (
      <main className="h-screen overflow-y-auto bg-white">
        <Switch>
          <Route path="/take-test/:token" component={TakeTestPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tests" component={Tests} />
          <Route path="/candidates" component={Candidates} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
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
