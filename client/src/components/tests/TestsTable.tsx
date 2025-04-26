import { useMemo, useState } from "react";
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Test } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

interface TestsTableProps {
  onEdit: (test: Test) => void;
}

const TestsTable = ({ onEdit }: TestsTableProps) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");

  const { data: tests = [], isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const updateTestMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/tests/${id}`, {
        isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update test: ${error}`,
        variant: "destructive",
      });
    },
  });

  const toggleTestStatus = (test: Test) => {
    updateTestMutation.mutate({
      id: test.id,
      isActive: !test.isActive,
    });
  };

  const filteredTests = useMemo(() => {
    return tests
      .filter((test) => {
        if (!filter) return true;
        return (
          test.name.toLowerCase().includes(filter.toLowerCase()) ||
          test.category.toLowerCase().includes(filter.toLowerCase())
        );
      })
      .sort((a, b) => {
        // Sort by active status first, then by name
        if (a.isActive === b.isActive) {
          return a.name.localeCompare(b.name);
        }
        return a.isActive ? -1 : 1;
      });
  }, [tests, filter]);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="Filter tests..."
          className="w-full md:max-w-xs px-3 py-2 border border-neutral-200 rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50 hover:bg-neutral-50">
            <TableHead>Test Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Questions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Loading tests...
              </TableCell>
            </TableRow>
          ) : filteredTests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                {filter
                  ? "No tests match your filter criteria"
                  : "No tests available"}
              </TableCell>
            </TableRow>
          ) : (
            filteredTests.map((test) => (
              <TableRow key={test.id} className="hover:bg-neutral-50">
                <TableCell className="font-medium">{test.name}</TableCell>
                <TableCell>{test.category}</TableCell>
                <TableCell>{test.questionCount}</TableCell>
                <TableCell>
                  <Badge
                    className="cursor-pointer"
                    variant={test.isActive ? "success" : "outline"}
                    onClick={() => toggleTestStatus(test)}
                  >
                    {test.isActive ? "Active" : "Archived"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(test)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TestsTable;
