import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, GripVertical, Edit, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Question, Test, QUESTION_TYPES } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import QuestionForm from "./QuestionForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuestionsManagerProps {
  test: Test;
}

type QuestionTypeMapping = {
  [key in typeof QUESTION_TYPES[number]]: string;
};

const questionTypeLabels: QuestionTypeMapping = {
  multiple_choice: "Multiple Choice",
  checkbox: "Checkbox",
  text: "Text",
  code: "Code",
};

const QuestionsManager = ({ test }: QuestionsManagerProps) => {
  const { toast } = useToast();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [reordering, setReordering] = useState(false);
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/tests", test.id, "questions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tests/${test.id}/questions`);
      return response.json();
    },
  });

  useEffect(() => {
    // Sort questions by order when they change
    if (questions.length > 0) {
      setOrderedQuestions([...questions].sort((a, b) => a.order - b.order));
    }
  }, [questions]);

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await apiRequest("DELETE", `/api/questions/${questionId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", test.id, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Question deleted",
        description: "The question has been deleted successfully",
      });
      setDeletingQuestion(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete question: ${error}`,
        variant: "destructive",
      });
    },
  });

  const reorderQuestionsMutation = useMutation({
    mutationFn: async (questionIds: number[]) => {
      const response = await apiRequest("POST", `/api/tests/${test.id}/reorder-questions`, {
        questionIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", test.id, "questions"] });
      toast({
        title: "Order updated",
        description: "Question order has been updated successfully",
      });
      setReordering(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update question order: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setIsAddingQuestion(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsAddingQuestion(true);
  };

  const handleCloseQuestionForm = () => {
    setIsAddingQuestion(false);
    setEditingQuestion(null);
  };

  const confirmDeleteQuestion = (question: Question) => {
    setDeletingQuestion(question);
  };

  const handleDeleteQuestion = () => {
    if (deletingQuestion) {
      deleteQuestionMutation.mutate(deletingQuestion.id);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === orderedQuestions.length - 1)) {
      return;
    }

    const newQuestions = [...orderedQuestions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[newIndex];
    newQuestions[newIndex] = temp;

    setOrderedQuestions(newQuestions);
  };

  const saveOrder = () => {
    const questionIds = orderedQuestions.map((q) => q.id);
    reorderQuestionsMutation.mutate(questionIds);
  };

  const cancelReordering = () => {
    // Reset to original order
    setOrderedQuestions([...questions].sort((a, b) => a.order - b.order));
    setReordering(false);
  };

  const toggleReordering = () => {
    if (reordering) {
      cancelReordering();
    } else {
      setReordering(true);
    }
  };

  const renderOptions = (question: Question) => {
    const options = question.options as string[];
    if (!options || options.length === 0) return "No options";

    return options.slice(0, 2).join(", ") + (options.length > 2 ? "..." : "");
  };

  const renderCorrectAnswer = (question: Question) => {
    if (question.type === "multiple_choice") {
      const correctAnswer = question.correctAnswer as number;
      const options = question.options as string[];
      return options[correctAnswer] || "N/A";
    } else if (question.type === "checkbox") {
      const correctAnswers = question.correctAnswer as number[];
      const options = question.options as string[];
      if (correctAnswers.length === 0) return "None";
      if (correctAnswers.length === 1) return options[correctAnswers[0]] || "N/A";
      return `${correctAnswers.length} options selected`;
    } else {
      return question.correctAnswer ? String(question.correctAnswer).substring(0, 20) + "..." : "N/A";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          Questions ({questions.length})
        </h3>
        <div className="flex gap-2">
          {questions.length > 1 && (
            <Button
              variant={reordering ? "destructive" : "outline"}
              size="sm"
              onClick={toggleReordering}
            >
              {reordering ? "Cancel" : "Reorder"}
            </Button>
          )}
          <Button onClick={handleAddQuestion} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 bg-neutral-50 border rounded-md">
          <p className="text-neutral-500">
            No questions in this test yet.
          </p>
          <Button onClick={handleAddQuestion} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add First Question
          </Button>
        </div>
      ) : (
        <>
          {reordering && (
            <div className="bg-amber-50 p-3 rounded-md mb-4 flex justify-between items-center">
              <p className="text-amber-800 text-sm">
                Drag questions to reorder them or use the up/down buttons.
              </p>
              <Button onClick={saveOrder} size="sm">
                Save Order
              </Button>
            </div>
          )}

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  {reordering && <TableHead className="w-10"></TableHead>}
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedQuestions.map((question, index) => (
                  <TableRow key={question.id} className="hover:bg-neutral-50">
                    {reordering && (
                      <TableCell className="w-10">
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveQuestion(index, "up")}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveQuestion(index, "down")}
                            disabled={index === orderedQuestions.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {question.content.length > 50
                        ? `${question.content.substring(0, 50)}...`
                        : question.content}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {questionTypeLabels[question.type as keyof typeof questionTypeLabels] || question.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderOptions(question)}</TableCell>
                    <TableCell>{renderCorrectAnswer(question)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDeleteQuestion(question)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {isAddingQuestion && (
        <QuestionForm
          test={test}
          question={editingQuestion}
          onClose={handleCloseQuestionForm}
        />
      )}

      <AlertDialog open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuestion}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuestionsManager;