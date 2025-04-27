import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Candidate } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AssignTestModal from "./AssignTestModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CandidatesTable = () => {
  const [filter, setFilter] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Получаем данные о кандидатах
  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  // Получаем данные о сессиях для каждого кандидата
  const { data: allCandidatesSessions = {} } = useQuery<Record<number, any[]>>({
    queryKey: ["/api/candidates/sessions"],
    queryFn: async () => {
      const sessionsData: Record<number, any[]> = {};
      
      await Promise.all(
        candidates.map(async (candidate) => {
          try {
            const response = await fetch(`/api/candidates/${candidate.id}/sessions`);
            if (response.ok) {
              const sessions = await response.json();
              sessionsData[candidate.id] = sessions;
            }
          } catch (error) {
            console.error(`Failed to fetch sessions for candidate ${candidate.id}:`, error);
            sessionsData[candidate.id] = [];
          }
        })
      );
      
      return sessionsData;
    },
    enabled: candidates.length > 0,
  });
  
  // Получаем данные о тестах для их имен
  const { data: tests = [] } = useQuery<any[]>({
    queryKey: ["/api/tests"],
  });

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (!filter) return true;
      return (
        candidate.name.toLowerCase().includes(filter.toLowerCase()) ||
        candidate.email.toLowerCase().includes(filter.toLowerCase()) ||
        candidate.position?.toLowerCase().includes(filter.toLowerCase())
      );
    });
  }, [candidates, filter]);

  // Функция для получения информации о тестах кандидата
  const getCandidateTestInfo = (candidateId: number) => {
    const sessions = allCandidatesSessions[candidateId] || [];
    
    if (sessions.length === 0) {
      return {
        hasTests: false,
        status: "No tests",
        sessions: [],
        hasFailed: false,
        hasPassed: false
      };
    }
    
    const hasCompletedTests = sessions.some((session: any) => session.status === "completed");
    const hasInProgressTests = sessions.some((session: any) => session.status === "in_progress");
    
    // Добавляем информацию о тесте к каждой сессии
    const sessionsWithTestInfo = sessions.map((session: any) => {
      const test = tests.find((t: any) => t.id === session.testId);
      return {
        ...session,
        testName: test?.name || "Unknown Test",
        testPassingScore: test?.passingScore || 70,
      };
    });
    
    // Проверяем, есть ли непройденные или пройденные тесты
    const hasFailed = sessionsWithTestInfo.some((session: any) => 
      session.status === "completed" && session.passed === false
    );
    
    const hasPassed = sessionsWithTestInfo.some((session: any) => 
      session.status === "completed" && session.passed === true
    );
    
    // Определяем общий статус
    let status = "Pending";
    if (hasInProgressTests) status = "In progress";
    if (hasCompletedTests) {
      if (hasFailed && hasPassed) {
        status = "Mixed results";
      } else if (hasFailed) {
        status = "Failed";
      } else if (hasPassed) {
        status = "Passed";
      } else {
        status = "Completed";
      }
    }
    
    return {
      hasTests: true,
      status,
      sessions: sessionsWithTestInfo,
      hasFailed,
      hasPassed
    };
  };

  // Получает вариант стиля для статуса
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | "success" => {
    switch (status) {
      case "Completed":
        return "default";
      case "Passed":
        return "success";
      case "Failed":
        return "destructive";
      case "Mixed results":
        return "default";
      case "In progress":
        return "secondary";
      case "Pending":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  // Получает вариант стиля для результата теста (Pass/Fail)
  const getResultBadgeVariant = (passed: boolean | undefined): "default" | "secondary" | "outline" | "destructive" | "success" => {
    if (passed === undefined) return "outline";
    return passed ? "success" : "destructive";
  };

  const handleAssignTest = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedCandidate(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Filter candidates..."
            className="w-full md:max-w-xs px-3 py-2 border border-neutral-200 rounded-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          
          
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading candidates...
                </TableCell>
              </TableRow>
            ) : filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {filter
                    ? "No candidates match your filter criteria"
                    : "No candidates available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate) => {
                const testInfo = getCandidateTestInfo(candidate.id);
                return (
                  <TableRow key={candidate.id} className="hover:bg-neutral-50">
                    <TableCell className="font-medium">
                      <Link to={`/candidates/${candidate.id}`} className="text-blue-600 hover:underline">
                        {candidate.name}
                      </Link>
                    </TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>{candidate.position || "—"}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(candidate.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {!testInfo.hasTests ? (
                        <Badge variant="outline">No tests</Badge>
                      ) : (
                        <div className="flex flex-col space-y-1 min-w-[220px]">
                          
                          
                          <div className="flex flex-col space-y-1 bg-gray-50 p-2 rounded-md text-sm">
                            {testInfo.sessions.map((session: any) => (
                              <div key={session.id} className="flex items-center justify-between">
                                <div className="truncate max-w-[120px]">{session.testName}</div>
                                <div className="flex items-center">
                                  <Badge variant={session.status === "completed" 
                                    ? (session.passed ? "success" : "destructive") 
                                    : getStatusBadgeVariant(session.status)}
                                    className="text-xs px-1.5 py-0"
                                  >
                                    {session.status === "completed" 
                                      ? (session.passed ? "Pass" : "Fail") 
                                      : session.status}
                                  </Badge>
                                  {session.status === "completed" && (
                                    <span className="ml-1">
                                      {session.passed ? (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssignTest(candidate)}
                        className="h-8"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Assign Test
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Test Modal */}
      <AssignTestModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        candidate={selectedCandidate}
      />
    </>
  );
};

export default CandidatesTable;
