import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import SearchInput from "@/components/ui/SearchInput";
import CandidatesTable from "@/components/candidates/CandidatesTable";
import { useTranslation } from "react-i18next";

const Candidates = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const candidateFormSchema = z.object({
    name: z.string().min(3, t("validation.name_min_length", "Name must be at least 3 characters")),
    email: z.string().email(t("validation.invalid_email", "Invalid email address")),
    position: z.string().optional(),
  });

  type CandidateFormValues = z.infer<typeof candidateFormSchema>;

  const form = useForm<CandidateFormValues>({
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
      toast({
        title: t("common.success"),
        description: t("candidates.candidate_added_successfully", "Candidate added successfully"),
      });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("candidates.failed_to_add", "Failed to add candidate") + `: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CandidateFormValues) => {
    createCandidateMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">{t("common.candidates")}</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-5 w-5 mr-2" />
          {t("candidates.add_candidate")}
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("candidates.search_placeholder", "Search candidates by name, email or position")}
          className="max-w-md"
        />
      </div>

      <CandidatesTable />

      {/* Add Candidate Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("candidates.add_candidate")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                  onClick={() => setIsModalOpen(false)}
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

export default Candidates;