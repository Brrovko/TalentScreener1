import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useQueries } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Mail, Briefcase, CalendarDays, FileSpreadsheet } from "lucide-react";
import { Candidate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AssignTestModal from "@/components/candidates/AssignTestModal";
import { useTranslation } from "react-i18next";

interface TestSession {
  id: number;
  status: string;
  testId: number;
  candidateId: number;
  token: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  percentScore?: number | null;
  passed?: boolean | null;
  expiresAt: string;
  test?: {
    name: string;
    category: string;
    passingScore?: number;
  };
}

const CandidateDetails = () => {
  const [, params] = useRoute<{ id: string }>("/dashboard/candidates/:id");
  const candidateId = parseInt(params?.id || "0");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const { t } = useTranslation();


  // Get candidate data
  const { data: candidate, isLoading: isLoadingCandidate } = useQuery<Candidate>({
    queryKey: ["/api/candidates", candidateId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/candidates/${candidateId}`);
      return await response.json();
    },
    enabled: !!candidateId,
  });

  // Get candidate's test sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery<TestSession[]>({
    queryKey: ["/api/candidates", candidateId, "sessions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/candidates/${candidateId}/sessions`);
      return await response.json();
    },
    enabled: !!candidateId,
  });

  // Get test details for each session
  const sessionsWithTests = useQueries({
    queries: sessions.map((session) => ({
      queryKey: [`/api/tests/${session.testId}`, session.id],
      queryFn: async () => {
        const testResponse = await apiRequest("GET", `/api/tests/${session.testId}`);
        return {
          ...session,
          test: await testResponse.json(),
        };
      },
      enabled: !!sessions.length,
    })),
  });

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };
  
  // Helper function to get result badge variant (Pass/Fail)
  const getResultBadgeVariant = (passed: boolean | null | undefined): "default" | "secondary" | "outline" | "destructive" | "success" => {
    if (passed === undefined || passed === null) return "outline";
    return passed ? "success" : "destructive";
  };

  // Получить массив сессий с тестами без фильтрации
  const sessionsWithTestsData = useMemo(() => {
    return sessionsWithTests
      .map((q) => q.data ?? null)
      .filter((session): session is NonNullable<typeof sessionsWithTests[number]["data"]> => session !== null);
  }, [sessionsWithTests]);

  // Handle manual refresh of sessions
  const handleRefreshSessions = () => {
    queryClient.invalidateQueries({
      queryKey: ["/api/candidates", candidateId, "sessions"],
    });
  };

  // Handle modal close with refresh
  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    // Force refetch the sessions data when modal is closed
    handleRefreshSessions();
  };

  // Handle copy link function
  const handleCopyTestLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/take-test/${token}`;
    navigator.clipboard.writeText(link);
    alert("Test link copied to clipboard");
  };

  if (isLoadingCandidate) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('candidates.not_found', 'Candidate Not Found')}</CardTitle>
            <CardDescription>
              {t('candidates.not_found_message', 'The candidate you\'re looking for doesn\'t exist or has been removed.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/dashboard/candidates">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('candidates.back_to_candidates', 'Back to Candidates')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link to="/dashboard/candidates">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('common.back', 'Back')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('candidates.profile_and_history', 'Candidate profile and test history')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('candidates.information', 'Candidate Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-muted-foreground">{t('candidates.email')}</span>
              </div>
              <p>{candidate.email}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Briefcase className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-muted-foreground">{t('candidates.position')}</span>
              </div>
              <p>{candidate.position || t('candidates.not_specified', 'Not specified')}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <CalendarDays className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-muted-foreground">{t('candidates.registered', 'Registered')}</span>
              </div>
              <p>{formatDistanceToNow(new Date(candidate.createdAt), { addSuffix: true })}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(candidate.createdAt), "PPP")}
              </p>
            </div>

            <Separator className="my-4" />
            
            <div className="pt-2">
              <Button 
                onClick={() => setIsAssignModalOpen(true)}
                className="w-full"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {t('candidates.assign_new_test', 'Assign New Test')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Sessions Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('candidates.test_history', 'Test History')}</CardTitle>
              <CardDescription>
                {t('candidates.view_all_tests', 'View all tests assigned to this candidate')}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshSessions}
            >
              {t('common.refresh', 'Refresh')}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingSessions ? (
              <div className="text-center py-8">{t('common.loading')}</div>
            ) : sessionsWithTestsData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('candidates.no_tests_assigned', 'No tests assigned to this candidate yet')}
              </div>
            ) : (
              sessionsWithTestsData.map(session => {
                if (!session) return null;
                return (
                  <div key={`session-${session.id}`} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        <Link to={`/dashboard/candidates/${candidateId}/session/${session.id}`} className="text-blue-600 hover:underline">
                          {session.test?.name || t('candidates.unnamed_test', 'Unnamed test')}
                        </Link>
                      </div>
                      <Badge variant={getStatusBadgeVariant(session.status)}>
                        {session.status === "completed"
                          ? t('candidates.completed')
                          : session.status === "in_progress"
                            ? t('candidates.in_progress')
                            : t('candidates.pending')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {session.test?.category || t('candidates.uncategorized', 'Uncategorized')}
                    </div>
                    {session.status === "completed" && (
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="text-lg font-bold">{session.score || 0} {t('candidates.points', 'pts')}</div>
                        {session.percentScore !== undefined && (
                          <div className="text-sm text-gray-500">
                            {session.percentScore}% {t('candidates.score')}
                            {session.test?.passingScore && ` (${t('candidates.passing', 'Passing')}: ${session.test.passingScore}%)`}
                          </div>
                        )}
                        {session.passed !== undefined && (
                          <Badge variant={getResultBadgeVariant(session.passed)}>
                            {session.passed ? t('candidates.pass') : t('candidates.fail')}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4 text-sm">
                      <div>
                        <div>{t('candidates.expires', 'Expires')}: {new Date(session.expiresAt).toLocaleDateString()}</div>
                        {session.completedAt && (
                          <div>{t('candidates.completed_at', 'Completed')}: {new Date(session.completedAt).toLocaleString()}</div>
                        )}
                        {session.startedAt && (
                          <div>{t('candidates.started', 'Started')}: {new Date(session.startedAt).toLocaleString()}</div>
                        )}
                      </div>
                      {session.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyTestLink(session.token)}
                        >
                          {t('candidates.copy_link', 'Copy Link')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign test modal */}
      <AssignTestModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        candidate={candidate}
      />
    </div>
  );
};

export default CandidateDetails;