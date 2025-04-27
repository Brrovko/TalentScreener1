import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy } from "lucide-react";
import { Test, Candidate } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AssignTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const AssignTestModal = ({ isOpen, onClose, candidate }: AssignTestModalProps) => {
  const { toast } = useToast();
  const [testId, setTestId] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<string>("7"); // Default 7 days
  const [testLink, setTestLink] = useState<string>("");

  // Fetch available tests
  const { data: tests = [], isLoading: isLoadingTests } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
    enabled: isOpen,
  });

  // Filter only active tests
  const activeTests = tests.filter(test => test.isActive);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { testId: number; candidateId: number; expiresAt: Date }) => {
      console.log("Sending test session data:", data);
      const response = await apiRequest("POST", "/api/sessions", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create test session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/take-test/${data.token}`;
      console.log("Generated test link:", link, "Token:", data.token);
      setTestLink(link);
      
      toast({
        title: "Test assigned successfully",
        description: "You can now share the link with the candidate",
      });
      
      // Refetch sessions data
      queryClient.invalidateQueries({
        queryKey: ["/api/tests/sessions"],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign test to candidate",
        variant: "destructive",
      });
    },
  });

  const handleAssignTest = () => {
    if (!candidate || !testId) return;

    // Calculate expiration date
    const days = parseInt(expiresIn, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    createSessionMutation.mutate({
      testId: parseInt(testId, 10),
      candidateId: candidate.id,
      expiresAt,
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(testLink);
    toast({
      title: "Link copied",
      description: "Test link copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Test to {candidate?.name}</DialogTitle>
        </DialogHeader>

        {testLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Test Link (expires in {expiresIn} days)</Label>
              <div className="flex">
                <Input 
                  value={testLink} 
                  readOnly 
                  className="flex-1 pr-10" 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="-ml-10" 
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with the candidate to start the test
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test">Select Test</Label>
              <Select 
                value={testId} 
                onValueChange={setTestId}
                disabled={isLoadingTests}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a test" />
                </SelectTrigger>
                <SelectContent>
                  {activeTests.map((test) => (
                    <SelectItem key={test.id} value={test.id.toString()}>
                      {test.name} ({test.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiration">Link expires in (days)</Label>
              <Select 
                value={expiresIn} 
                onValueChange={setExpiresIn}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignTest}
                disabled={!testId || createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? "Assigning..." : "Assign Test"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignTestModal;