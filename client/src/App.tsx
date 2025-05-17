import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import RegisterPage from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Tests from "@/pages/tests";
import TestDetails from "@/pages/test-details";
import Candidates from "@/pages/candidates";
import CandidateDetails from "@/pages/candidate-details";
import Settings from "@/pages/settings";
import Sidebar from "@/components/layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/main-page";

// Importing test-taking component
import TakeTestPage from "./pages/take-test";
import CandidateSessionDetails from "@/pages/candidate-session-details";

function Router() {
  const [location] = useLocation();
  const isTakeTestRoute = location.startsWith("/take-test");
  const isMobile = useIsMobile();

  // Отображение страницы прохождения теста без сайдбара (для кандидатов)
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

  // Проверяем, находимся ли мы на странице дашборда
  const isDashboardRoute = location.startsWith('/dashboard');

  // Если мы находимся на корневом маршруте (/) или не на маршруте дашборда
  if (location === '/' || !isDashboardRoute) {
    return (
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/take-test/:token" component={TakeTestPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Если мы на маршруте дашборда, показываем боковую панель и соответствующий контент
  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar will handle its own visibility on mobile/desktop */}
      <Sidebar />
      
      {/* Main content area, full width on mobile, partial width on desktop */}
      <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-20 md:pb-4">
        <div className={`container mx-auto px-4 ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
          <Switch>
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute 
              path="/dashboard/tests" 
              component={Tests} 
              requiredRoles={["admin", "recruiter", "interviewer"]} 
            />
            <ProtectedRoute 
              path="/dashboard/tests/:id" 
              component={TestDetails} 
              requiredRoles={["admin", "recruiter", "interviewer"]} 
            />
            <ProtectedRoute 
              path="/dashboard/candidates" 
              component={Candidates} 
              requiredRoles={["admin", "recruiter"]} 
            />
            <ProtectedRoute 
              path="/dashboard/candidates/:id" 
              component={CandidateDetails}
              requiredRoles={["admin", "recruiter", "interviewer"]} 
            />
            <ProtectedRoute 
              path="/dashboard/candidates/:candidateId/session/:sessionId" 
              component={CandidateSessionDetails}
              requiredRoles={["admin", "recruiter", "interviewer"]} 
            />
            <ProtectedRoute 
              path="/dashboard/settings" 
              component={Settings} 
              requiredRoles={["admin"]} 
            />
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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
