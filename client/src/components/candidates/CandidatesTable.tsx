import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { formatDistanceToNow } from "date-fns";

const CandidatesTable = () => {
  const [filter, setFilter] = useState("");

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
        return "success";
      case "In progress":
        return "warning";
      case "Pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Loading candidates...
              </TableCell>
            </TableRow>
          ) : filteredCandidates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
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
                  <TableCell className="font-medium">{candidate.name}</TableCell>
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
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CandidatesTable;
