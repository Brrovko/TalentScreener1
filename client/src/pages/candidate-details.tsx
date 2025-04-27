import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Mail, Briefcase, CalendarDays, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AssignTestModal from "@/components/candidates/AssignTestModal";

interface TestSession {
  id: number;
  status: string;
  testId: number;
  candidateId: number;
  token: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  expiresAt: string;
  test?: {
    name: string;
    category: string;
  };
}

const CandidateDetails = () => {
  const [, params] = useRoute<{ id: string }>("/candidates/:id");
  const candidateId = parseInt(params?.id || "0");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Fetch candidate details
  const { data: candidate, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ["/api/candidates", candidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch candidate details");
      }
      return response.json();
    },
    enabled: !!candidateId,
  });

  // Fetch candidate test sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery<TestSession[]>({
    queryKey: ["/api/candidates", candidateId, "sessions"],
    queryFn: async () => {
      const response = await fetch(`/api/candidates/${candidateId}/sessions`);
      if (!response.ok) {
        throw new Error("Failed to fetch candidate test sessions");
      }
      
      // Get sessions
      const sessions = await response.json();
      
      // Get test details for each session
      const sessionsWithTestDetails = await Promise.all(
        sessions.map(async (session: TestSession) => {
          try {
            const testResponse = await fetch(`/api/tests/${session.testId}`);
            if (testResponse.ok) {
              const test = await testResponse.json();
              return { ...session, test };
            }
            return session;
          } catch (error) {
            return session;
          }
        })
      );
      
      return sessionsWithTestDetails;
    },
    enabled: !!candidateId,
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
            <CardTitle className="text-2xl">Candidate Not Found</CardTitle>
            <CardDescription>
              The candidate you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/candidates">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Candidates
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
          <Link to="/candidates">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
        </div>
        <p className="text-muted-foreground">
          Candidate profile and test history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Candidate Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-muted-foreground">Email</span>
              </div>
              <p>{candidate.email}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Briefcase className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-muted-foreground">Position</span>
              </div>
              <p>{candidate.position || "Not specified"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <CalendarDays className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-muted-foreground">Registered</span>
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
                Assign New Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Sessions Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test History</CardTitle>
              <CardDescription>
                View all tests assigned to this candidate
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshSessions}
            >
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="active">Active Tests</TabsTrigger>
                <TabsTrigger value="completed">Completed Tests</TabsTrigger>
                <TabsTrigger value="all">All Tests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-4">
                {isLoadingSessions ? (
                  <div className="text-center py-8">Loading test sessions...</div>
                ) : sessions.filter(s => s.status !== "completed").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active tests found for this candidate
                  </div>
                ) : (
                  sessions
                    .filter(session => session.status !== "completed")
                    .map(session => (
                      <div key={session.id} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {session.test?.name || `Test #${session.testId}`}
                          </div>
                          <Badge variant={getStatusBadgeVariant(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {session.test?.category || "Uncategorized"}
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 text-sm">
                          <div>
                            <div>Expires: {new Date(session.expiresAt).toLocaleDateString()}</div>
                            {session.startedAt && (
                              <div>Started: {new Date(session.startedAt).toLocaleString()}</div>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyTestLink(session.token)}
                          >
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-4">
                {isLoadingSessions ? (
                  <div className="text-center py-8">Loading test sessions...</div>
                ) : sessions.filter(s => s.status === "completed").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No completed tests found for this candidate
                  </div>
                ) : (
                  sessions
                    .filter(session => session.status === "completed")
                    .map(session => (
                      <div key={session.id} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {session.test?.name || `Test #${session.testId}`}
                          </div>
                          <Badge variant={getStatusBadgeVariant(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {session.test?.category || "Uncategorized"}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="text-lg font-bold">{session.score || 0} pts</div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 text-sm">
                          <div>
                            {session.completedAt && (
                              <div>Completed: {new Date(session.completedAt).toLocaleString()}</div>
                            )}
                            {session.startedAt && (
                              <div>Started: {new Date(session.startedAt).toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4">
                {isLoadingSessions ? (
                  <div className="text-center py-8">Loading test sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tests assigned to this candidate yet
                  </div>
                ) : (
                  sessions.map(session => (
                    <div key={session.id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {session.test?.name || `Test #${session.testId}`}
                        </div>
                        <Badge variant={getStatusBadgeVariant(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        {session.test?.category || "Uncategorized"}
                      </div>
                      
                      {session.status === "completed" && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="text-lg font-bold">{session.score || 0} pts</div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4 text-sm">
                        <div>
                          <div>Expires: {new Date(session.expiresAt).toLocaleDateString()}</div>
                          {session.completedAt && (
                            <div>Completed: {new Date(session.completedAt).toLocaleString()}</div>
                          )}
                          {session.startedAt && (
                            <div>Started: {new Date(session.startedAt).toLocaleString()}</div>
                          )}
                        </div>
                        
                        {session.status !== "completed" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyTestLink(session.token)}
                          >
                            Copy Link
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
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