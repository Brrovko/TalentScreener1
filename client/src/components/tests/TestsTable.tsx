import {useMemo, useState} from "react";
import {FileSpreadsheet, Pencil} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Test} from "@shared/schema";
import {useToast} from "@/hooks/use-toast";
import {apiRequest} from "@/lib/queryClient";
import {useMutation, useQuery} from "@tanstack/react-query";
import {useIsMobile} from "@/hooks/use-mobile";
import {useTranslation} from "react-i18next";
import AssignTestToCandidateModal from "./AssignTestToCandidateModal";
import {useLocation} from "wouter";

const TestsTable = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const { data: tests = [], isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const {data: questionsCountMap = {}} = useQuery<Record<number, number>>({
    queryKey: ["/api/tests/questions-count"],
    queryFn: async () => {
      const countMap: Record<number, number> = {};

      for (const test of tests) {
        const response = await apiRequest("GET", `/api/tests/${test.id}/questions`);
        const questions = await response.json();
        countMap[test.id] = questions.length;
      }

      return countMap;
    },
    enabled: tests.length > 0,
  });
  useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/tests/${id}`, {
        isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('tests.status_updated', 'Test status updated successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('tests.failed_to_update_status', 'Failed to update test status') + `: ${error}`,
        variant: "destructive",
      });
    },
  });
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const filteredTests = useMemo(() => {
    return tests
      .filter((test) => {
        if (!filter) return true;
        return (
          test.name.toLowerCase().includes(filter.toLowerCase())
        );
      })
      .sort((a, b) => {
        if (a.isActive === b.isActive) {
          return a.name.localeCompare(b.name);
        }
        return a.isActive ? -1 : 1;
      });
  }, [tests, filter]);

  const TestCard = ({ test }: { test: Test }) => {
    const [, setLocation] = useLocation();
    return (
      <div className="p-4 border-b border-neutral-200 last:border-b-0">
        <div className="flex justify-between items-start mb-2">
          <div className="font-medium">{test.name}</div>
          <div
            className="p-4 border-b border-neutral-200 last:border-b-0 cursor-pointer hover:bg-neutral-50"
            onClick={() => setLocation(`/dashboard/tests/${test.id}`)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">{t('common.edit')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-neutral-500">{t('tests.questions')}:</span>{" "}
            <span className="text-neutral-700">{questionsCountMap[test.id] || 0}</span>
          </div>
        </div>
        
        <Badge
          variant={test.isActive ? "success" : "outline"}
        >
          {test.isActive ? t('tests.active') : t('tests.archived')}
        </Badge>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder={t('common.search')}
          className="w-full md:max-w-xs px-3 py-2 border border-neutral-200 rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      {/* Mobile view */}
      {isMobile ? (
        <div className="divide-y divide-neutral-200">
          {isLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-8">
              {filter
                ? t('common.no_filter_results')
                : t('common.no_data')}
            </div>
          ) : (
            filteredTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))
          )}
        </div>
      ) : (
        /* Desktop table view */
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead>{t('tests.test_name')}</TableHead>
              <TableHead>{t('tests.questions')}</TableHead>
              <TableHead>{t('tests.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : filteredTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {filter
                    ? t('common.no_filter_results')
                    : t('common.no_data')}
                </TableCell>
              </TableRow>
            ) : (
              filteredTests.map((test) => (
                <TableRow key={test.id} className="hover:bg-neutral-50">
                  <TableCell className="font-medium text-blue-700 hover:underline cursor-pointer" onClick={() => setLocation(`/dashboard/tests/${test.id}`)}>{test.name}</TableCell>
                  <TableCell>{questionsCountMap[test.id] || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant={test.isActive ? "success" : "outline"}
                    >
                      {test.isActive ? t('tests.active') : t('tests.archived')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button
                        variant="ghost"
                      size="sm"
                        className="h-8"
                      onClick={() => {
                        setSelectedTest(test);
                        setAssignModalOpen(true);
                      }}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1"/>
                      {t('candidates.assign_test', 'Назначить тест')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      <AssignTestToCandidateModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedTest(null);
        }}
        test={selectedTest}
      />
    </div>
  );
};

export default TestsTable;
