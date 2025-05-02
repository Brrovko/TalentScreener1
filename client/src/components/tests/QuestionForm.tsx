import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Question, Test } from "@shared/schema";

// Определим типы вопросов как константы
const QUESTION_TYPES = ["multiple_choice", "checkbox", "text", "code"] as const;
type QuestionType = typeof QUESTION_TYPES[number];

interface QuestionFormProps {
  test: Test;
  question: Question | null;
  onClose: () => void;
}

interface FormData {
  testId: number;
  content: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string | number | number[];
  points: number;
  order: number;
}

const QuestionForm = ({ test, question, onClose }: QuestionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    testId: test.id,
    content: "",
    type: "multiple_choice",
    options: ["", ""],
    correctAnswer: 0,
    points: 1,
    order: 1, // Будет обновлено после загрузки вопросов
  });
  
  // Initialize form data from question if editing
  useEffect(() => {
    if (question) {
      setFormData({
        testId: question.testId,
        content: question.content,
        type: question.type as QuestionType,
        options: Array.isArray(question.options) ? question.options : [],
        correctAnswer: question.correctAnswer as string | number | number[],
        points: question.points,
        order: question.order,
      });
    }
  }, [question]);
  
  // Загружаем существующие вопросы для определения порядка нового вопроса
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/tests", test.id, "questions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tests/${test.id}/questions`);
      return response.json();
    },
  });
  
  // Устанавливаем порядок нового вопроса после загрузки вопросов
  useEffect(() => {
    if (!question && questions.length > 0) {
      setFormData(prev => ({
        ...prev,
        order: questions.length + 1
      }));
    }
  }, [questions, question]);
  
  // Mutations
  const createQuestionMutation = useMutation({
    mutationFn: async (data: FormData) => {
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
    mutationFn: async (data: FormData & { id: number }) => {
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
  
  // Form handlers
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleTypeChange = (type: QuestionType) => {
    const correctAnswer = 
      type === "multiple_choice" ? 0 :
      type === "checkbox" ? [] as number[] : "";
      
    setFormData((prev) => ({ 
      ...prev, 
      type, 
      correctAnswer,
      // Reset options if switching to/from text or code
      options: (type === "multiple_choice" || type === "checkbox") 
        ? (prev.options.length ? prev.options : ["", ""]) 
        : []
    }));
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };
  
  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] });
  };
  
  const removeOption = (index: number) => {
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    
    // Also remove from correctAnswer if it's an array (checkbox)
    let correctAnswer = formData.correctAnswer;
    if (Array.isArray(correctAnswer)) {
      correctAnswer = correctAnswer
        .map(val => val > index ? val - 1 : val)
        .filter(val => val !== index);
    } else if (typeof correctAnswer === 'number' && correctAnswer === index) {
      correctAnswer = 0;
    } else if (typeof correctAnswer === 'number' && correctAnswer > index) {
      correctAnswer = correctAnswer - 1;
    }
    
    setFormData({ ...formData, options: newOptions, correctAnswer });
  };
  
  const handleRadioChange = (index: number) => {
    setFormData({ ...formData, correctAnswer: index });
  };
  
  const handleCheckboxChange = (index: number, checked: boolean) => {
    const currentAnswers = Array.isArray(formData.correctAnswer) 
      ? [...formData.correctAnswer] 
      : [];
      
    if (checked) {
      setFormData({ ...formData, correctAnswer: [...currentAnswers, index] });
    } else {
      setFormData({ 
        ...formData, 
        correctAnswer: currentAnswers.filter(value => value !== index) 
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      testId: test.id,
      content: "",
      type: "multiple_choice",
      options: ["", ""],
      correctAnswer: 0,
      points: 1,
      order: questions.length + 1,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.content.length < 5) {
      toast({
        title: "Validation Error",
        description: "Question content must be at least 5 characters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate options for multiple choice and checkbox
    if ((formData.type === "multiple_choice" || formData.type === "checkbox") && 
        (!formData.options.length || formData.options.some(opt => !opt.trim()))) {
      toast({
        title: "Validation Error",
        description: "All options must be filled",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (question?.id) {
        await updateQuestionMutation.mutateAsync({ ...formData, id: question.id });
      } else {
        await createQuestionMutation.mutateAsync(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? "Edit Question" : "Add New Question"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="content">Question Text</Label>
            <Textarea
              id="content"
              placeholder="Enter the question text"
              className="resize-none"
              rows={3}
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              required
              minLength={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Question Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleTypeChange(value as QuestionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="checkbox">Checkbox (Multiple Answer)</SelectItem>
                  <SelectItem value="text">Text Answer</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                placeholder="Points for this question"
                min={1}
                value={formData.points}
                onChange={(e) => handleInputChange("points", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {(formData.type === "multiple_choice" || formData.type === "checkbox") && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Options</Label>
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
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        required
                      />
                    </div>

                    {formData.options.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="mt-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {formData.type === "multiple_choice" && (
                      <div className="flex items-center mt-3">
                        <input
                          type="radio"
                          checked={formData.correctAnswer === index}
                          onChange={() => handleRadioChange(index)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                    )}

                    {formData.type === "checkbox" && (
                      <div className="flex items-center mt-3">
                        <Checkbox
                          checked={Array.isArray(formData.correctAnswer) && 
                            formData.correctAnswer.includes(index)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(index, checked === true)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.type === "text" && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswer">Correct Answer</Label>
              <Input
                id="correctAnswer"
                placeholder="Enter the correct answer"
                value={formData.correctAnswer as string}
                onChange={(e) => handleInputChange("correctAnswer", e.target.value)}
              />
            </div>
          )}

          {formData.type === "code" && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswerCode">Correct Answer (Code)</Label>
              <Textarea
                id="correctAnswerCode"
                placeholder="Enter the correct code answer"
                className="resize-none font-mono"
                rows={5}
                value={formData.correctAnswer as string}
                onChange={(e) => handleInputChange("correctAnswer", e.target.value)}
              />
            </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default QuestionForm;