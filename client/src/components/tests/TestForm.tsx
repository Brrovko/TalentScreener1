import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Test } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface TestFormProps {
  test?: Test | null;
  onComplete: (test?: Test) => void;
}

const testFormSchema = z.object({
  name: z.string().min(3, "Test name must be at least 3 characters"),
  description: z.string().optional(),

  timeLimit: z.number().min(0).optional(),
  passingScore: z.number().min(0).max(100).default(70),
  isActive: z.boolean().default(true),
});

type TestFormValues = z.infer<typeof testFormSchema>;

const TestForm = ({ test, onComplete }: TestFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: test?.name || "",
      description: test?.description || "",

      timeLimit: test?.timeLimit != null ? test.timeLimit : 30,
      passingScore: test?.passingScore || 70,
      isActive: test?.isActive !== undefined ? test.isActive : true,
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      const response = await apiRequest("POST", "/api/tests", {
        ...data,
        createdBy: 1, // Hardcoded for demo
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: t('common.success'),
        description: t('tests.test_created_successfully', 'Test created successfully'),
      });
      onComplete(data);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('tests.failed_to_create', 'Failed to create test') + `: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateTestMutation = useMutation({
    mutationFn: async (data: TestFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/tests/${id}`, updateData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: t('common.success'),
        description: t('tests.test_updated_successfully', 'Test updated successfully'),
      });
      onComplete(data);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('tests.failed_to_update', 'Failed to update test') + `: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TestFormValues) => {
    setIsSubmitting(true);
    try {
      if (test?.id) {
        await updateTestMutation.mutateAsync({ ...data, id: test.id });
      } else {
        await createTestMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tests.test_name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('tests.enter_test_name', 'Enter test name')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tests.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('tests.enter_test_description', 'Enter test description')}
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="timeLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tests.time_limit')} ({t('tests.minutes')})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t('tests.leave_empty_for_no_limit', 'Leave empty for no limit')}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="passingScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tests.passing_score')} (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('tests.active_status')}</FormLabel>
                <p className="text-sm text-muted-foreground">
                  {t('tests.make_available')}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onComplete()}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t('common.submitting', 'Submitting...')
              : test
                ? t('common.save')
                : t('tests.create_test')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TestForm;
