import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Question, Test } from "@shared/schema";

// Определим типы вопросов как константы
const QUESTION_TYPES = ["multiple_choice", "checkbox", "text", "code"] as const;
type QuestionType = typeof QUESTION_TYPES[number];

interface QuestionFormProps {
  test: Test;
  question: Question | null;
  onClose: () => void;
}

// Преобразуем readonly массив в обычный для использования с z.enum
const questionTypeValues = [...QUESTION_TYPES] as [string, ...string[]];

// Custom schema for the form
const questionFormSchema = z.object({
  testId: z.number(),
  content: z.string().min(5, "Question content must be at least 5 characters"),
  type: z.enum(questionTypeValues),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(1, "At least one option is required"),
  correctAnswer: z.union([
    z.number(), // For multiple choice
    z.array(z.number()), // For checkbox
    z.string(), // For text/code
  ]),
  points: z.number().min(1, "Points must be at least 1"),
  order: z.number().optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

const QuestionForm = ({ test, question, onClose }: QuestionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize default values based on question type
  const getDefaultCorrectAnswer = (type: QuestionType) => {
    if (type === "multiple_choice") return 0;
    if (type === "checkbox") return [] as number[];
    return "";
  };

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: question
      ? {
          testId: question.testId,
          content: question.content,
          type: question.type as QuestionType,
          options: (question.options as string[]) || [""],
          correctAnswer: question.correctAnswer,
          points: question.points,
          order: question.order,
        }
      : {
          testId: test.id,
          content: "",
          type: "multiple_choice",
          options: ["", ""],
          correctAnswer: 0, // Default to first option for multiple choice
          points: 1,
          order: test.questionCount + 1,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const currentType = form.watch("type");

  // Reset correct answer when type changes
  const handleTypeChange = (type: QuestionType) => {
    form.setValue("type", type);
    form.setValue("correctAnswer", getDefaultCorrectAnswer(type));
  };

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const response = await apiRequest("POST", "/api/questions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", test.id, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create question: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/questions/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", test.id, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: QuestionFormValues) => {
    setIsSubmitting(true);
    try {
      if (question?.id) {
        await updateQuestionMutation.mutateAsync({ ...data, id: question.id });
      } else {
        await createQuestionMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    append("");
  };

  const resetForm = () => {
    form.reset({
      testId: test.id,
      content: "",
      type: "multiple_choice",
      options: ["", ""],
      correctAnswer: 0,
      points: 1,
      order: test.questionCount + 1,
    });
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? "Edit Question" : "Add New Question"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the question text"
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select
                      onValueChange={(value) => handleTypeChange(value as QuestionType)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="checkbox">Checkbox (Multiple Answer)</SelectItem>
                        <SelectItem value="text">Text Answer</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Points for this question"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(currentType === "multiple_choice" || currentType === "checkbox") && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Options</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`options.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={`Option ${index + 1}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="mt-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}

                      {currentType === "multiple_choice" && (
                        <FormField
                          control={form.control}
                          name="correctAnswer"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0 mt-1">
                              <FormControl>
                                <input
                                  type="radio"
                                  checked={field.value === index}
                                  onChange={() => field.onChange(index)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}

                      {currentType === "checkbox" && (
                        <FormField
                          control={form.control}
                          name="correctAnswer"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0 mt-1">
                              <FormControl>
                                <Checkbox
                                  checked={(field.value as number[]).includes(index)}
                                  onCheckedChange={(checked) => {
                                    const currentAnswers = [...(field.value as number[])];
                                    if (checked) {
                                      field.onChange([...currentAnswers, index]);
                                    } else {
                                      field.onChange(
                                        currentAnswers.filter((value) => value !== index)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentType === "text" && (
              <FormField
                control={form.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the correct answer"
                        {...field}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentType === "code" && (
              <FormField
                control={form.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer (Code)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the correct code answer"
                        className="resize-none font-mono"
                        rows={5}
                        {...field}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {!question && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {question ? "Update" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionForm;