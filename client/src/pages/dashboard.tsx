import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Users, CheckCircle, Clock } from "lucide-react";
import CreateTestModal from "@/components/tests/CreateTestModal";
import { useLocation } from "wouter";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useTranslation } from "react-i18next";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalTests: number;
  activeTests: number;
  totalCandidates: number;
  pendingSessions: number;
  completedSessions: number;
}

const Dashboard = () => {
  const [isCreateTestModalOpen, setIsCreateTestModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  // Candidate form logic
  const candidateFormSchema = z.object({
    name: z.string().min(3, t("validation.name_min_length", "Name must be at least 3 characters")),
    email: z.string().email(t("validation.invalid_email", "Invalid email address")),
    position: z.string().optional(),
  });

  type CandidateFormValues = z.infer<typeof candidateFormSchema>;

  const candidateForm = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: "",
      email: "",
      position: "",
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (data: CandidateFormValues) => {
      const response = await apiRequest("POST", "/api/candidates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t("common.success"),
        description: t("candidates.candidate_added_successfully", "Candidate added successfully"),
      });
      setIsAddCandidateModalOpen(false);
      candidateForm.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("candidates.failed_to_add", "Failed to add candidate") + `: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitCandidate = (data: CandidateFormValues) => {
    createCandidateMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">{t('common.dashboard')}</h1>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-neutral-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('dashboard.active_tests')}
            value={stats?.activeTests || 0}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatsCard
            title={t('common.candidates') /* Исправлено: используем перевод из common */}
            value={stats?.totalCandidates || 0}
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title={t('dashboard.pending_sessions')}
            value={stats?.pendingSessions || 0}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            title={t('dashboard.completed_sessions')}
            value={stats?.completedSessions || 0}
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-lg font-medium mb-4">{t('dashboard.quick_actions', 'Quick Actions')}</h3>
          <div className="space-y-3">
            <button
              onClick={() => setIsCreateTestModalOpen(true)}
              className="w-full flex items-center gap-2 p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
            >
              <ClipboardList className="h-6 w-6 text-neutral-600" />
              <div className="font-medium">{t('tests.create_test')}</div>
            </button>
            <button
              onClick={() => setIsAddCandidateModalOpen(true)}
              className="w-full flex items-center gap-2 p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
            >
              <Users className="h-6 w-6 text-neutral-600" />
              <div className="font-medium">{t('candidates.add_candidate')}</div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <RecentActivity />
      </div>



      {/* Create Test Modal */}
      <CreateTestModal
        isOpen={isCreateTestModalOpen}
        onClose={() => setIsCreateTestModalOpen(false)}
        onCreated={(test) => {
          setIsCreateTestModalOpen(false);
          if (test?.id) setLocation(`/dashboard/tests/${test.id}`);
        }}
      />

      {/* Add Candidate Modal */}
      <Dialog open={isAddCandidateModalOpen} onOpenChange={setIsAddCandidateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("candidates.add_candidate")}</DialogTitle>
          </DialogHeader>
          <Form {...candidateForm}>
            <form onSubmit={candidateForm.handleSubmit(onSubmitCandidate)} className="space-y-4">
              <FormField
                control={candidateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("candidates.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={candidateForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("candidates.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={candidateForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("candidates.position")} ({t("common.optional", "Optional")})</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Frontend Developer"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddCandidateModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createCandidateMutation.isPending}
                >
                  {createCandidateMutation.isPending
                    ? t("candidates.adding", "Adding...")
                    : t("candidates.add_candidate")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
