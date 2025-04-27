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
import { CATEGORIES, Test } from "@shared/schema";

interface TestFormProps {
  test?: Test | null;
  onComplete: () => void;
}

const testFormSchema = z.object({
  name: z.string().min(3, "Test name must be at least 3 characters"),
  description: z.string().optional(),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  timeLimit: z.number().min(0).optional(),
  passingScore: z.number().min(0).max(100).default(70),
  isActive: z.boolean().default(true),
});

type TestFormValues = z.infer<typeof testFormSchema>;

const TestForm = ({ test, onComplete }: TestFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: test?.name || "",
      description: test?.description || "",
      category: (test?.category as any) || "Frontend",
      timeLimit: test?.timeLimit || 0,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Success",
        description: "Test created successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create test: ${error}`,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Success",
        description: "Test updated successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update test: ${error}`,
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
              <FormLabel>Test Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter test name" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter test description"
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Limit (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Leave empty for no limit"
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
                <FormLabel>Passing Score (%)</FormLabel>
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
                <FormLabel className="text-base">Active Status</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Make this test available for candidates
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

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : test
              ? "Update Test"
              : "Create Test"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TestForm;
