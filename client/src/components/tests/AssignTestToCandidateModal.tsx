// For what: Assigns a selected test to a candidate, selects the expiration period, and generates a link for taking the test. Used in TestsTable.

import { useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";

interface AssignTestToCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test | null;
}

const AssignTestToCandidateModal = ({ isOpen, onClose, test }: AssignTestToCandidateModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [candidateId, setCandidateId] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<string>("7"); // Default 7 days
  const [testLink, setTestLink] = useState<string>("");

  // Fetch candidates
  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    enabled: isOpen,
  });

  // Фильтрация по isActive убрана, так как у типа Candidate нет такого поля
  const activeCandidates = candidates;

  // Reset link when modal opens
  useEffect(() => {
    if (isOpen) {
      setTestLink("");
      setCandidateId("");
      setExpiresIn("7");
    }
  }, [isOpen]);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { testId: number; candidateId: number; expiresAt: Date }) => {
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
      setTestLink(link);
      toast({
        title: t("tests.test_assigned_successfully", "Test assigned successfully"),
        description: t("tests.share_link_with_candidate", "You can now share the link with the candidate"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!test || !candidateId) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    createSessionMutation.mutate({
      testId: test.id,
      candidateId: parseInt(candidateId),
      expiresAt,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{t("tests.assign_test", "Assign Test")}</DialogTitle>
        </DialogHeader>
        {test && (
          <div className="mb-4">
            <Label>{t("tests.test_name", "Test Name")}</Label>
            <div className="font-medium">{test.name}</div>
          </div>
        )}
        <div className="mb-4">
          <Label htmlFor="candidate-select">{t("candidates.name", "Candidate")}</Label>
          <Select value={candidateId} onValueChange={setCandidateId} disabled={isLoadingCandidates}>
            <SelectTrigger id="candidate-select">
              <SelectValue placeholder={t("candidates.select_candidate", "Select candidate")}/>
            </SelectTrigger>
            <SelectContent>
              {activeCandidates.map(candidate => (
                <SelectItem key={candidate.id} value={candidate.id.toString()}>
                  {candidate.name} ({candidate.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4">
          <Label htmlFor="expires-in">{t("tests.expiration_days", "Expiration (days)")}</Label>
          <Input
            id="expires-in"
            type="number"
            min={1}
            max={30}
            value={expiresIn}
            onChange={e => setExpiresIn(e.target.value)}
          />
        </div>
        <Button onClick={handleAssign} disabled={!candidateId || createSessionMutation.isPending || !!testLink} className="w-full">
          {createSessionMutation.isPending ? t("common.loading", "Loading...") : t("tests.assign_test", "Assign Test")}
        </Button>
        {testLink && (
          <div className="mt-4 p-3 bg-neutral-100 rounded">
            <Label>{t("tests.test_link", "Test Link")}</Label>
            <div className="flex items-center gap-2">
              <Input value={testLink} readOnly className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(testLink);
                  toast({ title: t("common.success"), description: t("tests.link_copied", "Link copied") });
                }}
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignTestToCandidateModal;
