import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { FileSpreadsheet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AssignTestModal from "./AssignTestModal";

const CandidatesTable = () => {
  const [filter, setFilter] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  // Get test sessions to display status
  const { data: allTestSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/tests/sessions"],
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

  // Function to get candidate status based on test sessions
  const getCandidateStatus = (candidateId: number) => {
    const sessions = allTestSessions.filter(
      (session) => session.candidateId === candidateId
    );
    
    if (sessions.length === 0) return "No tests";
    
    if (sessions.some((session) => session.status === "completed")) {
      return "Completed";
    }
    
    if (sessions.some((session) => session.status === "in_progress")) {
      return "In progress";
    }
    
    return "Pending";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In progress":
        return "secondary";
      case "Pending":
        return "secondary";
      default:
        return "outline";
    }
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
        <div className="px-4 py-3">
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
                const status = getCandidateStatus(candidate.id);
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
                      <Badge variant={getStatusBadgeVariant(status)}>
                        {status}
                      </Badge>
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
