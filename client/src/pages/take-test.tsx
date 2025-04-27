import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TestQuestion {
  id: number;
  content: string;
  type: string;
  options: string[] | { id: string; text: string }[];
  points: number;
  order: number;
}

interface TestDetails {
  session: {
    id: number;
    status: string;
    token: string;
    expiresAt: string;
  };
  test: {
    id: number;
    name: string;
    description: string;
    category: string;
    timeLimit: number | null;
  };
  candidate: {
    id: number;
    name: string;
  };
  questions: TestQuestion[];
}

const TakeTest = () => {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResult, setTestResult] = useState<{
    score: number;
    totalPossibleScore: number;
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);

  // Fetch test session data
  const {
    data: testData,
    isLoading,
    isError,
    error,
  } = useQuery<TestDetails>({
    queryKey: ["/api/sessions/token", token],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/sessions/token/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load test");
      }
      return response.json();
    },
    retry: false,
  });

  // Start test mutation
  const startTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/sessions/${token}/start`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start test");
      }
      return response.json();
    },
    onSuccess: () => {
      setTestStarted(true);
      
      // Start timer if test has time limit
      if (testData?.test.timeLimit) {
        const timeLimit = testData.test.timeLimit * 60; // convert to seconds
        setTimeRemaining(timeLimit);
        
        const interval = window.setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              // Auto-submit when time is up
              if (!testSubmitted) {
                submitTestMutation.mutate(Object.entries(answers).map(([questionId, answer]) => ({
                  questionId: parseInt(questionId),
                  answer,
                })));
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setTimerInterval(interval);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to start test: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit test mutation
  const submitTestMutation = useMutation({
    mutationFn: async (answersList: { questionId: number; answer: any }[]) => {
      const response = await apiRequest(
        "POST",
        `/api/sessions/${token}/submit`,
        { answers: answersList }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit test");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      setTestSubmitted(true);
      setTestResult({
        score: data.score,
        totalPossibleScore: data.totalPossibleScore,
      });
      toast({
        title: "Test Submitted",
        description: "Your test has been submitted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit test: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Cleanup timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const questions = useMemo(() => testData?.questions || [], [testData]);
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const formatTimeRemaining = () => {
    if (timeRemaining === null) return "";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleStartTest = () => {
    startTestMutation.mutate();
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleAnswerChange = (answer: any) => {
    if (!currentQuestion) return;
    
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer,
    });
  };

  const getOptionsFromQuestion = (question: TestQuestion) => {
    if (!question.options) return [];
    
    if (typeof question.options[0] === "string") {
      return question.options as string[];
    }
    
    return (question.options as { id: string; text: string }[]).map(
      (option) => option.text
    );
  };

  const handleSubmitTest = () => {
    const answersList = Object.entries(answers).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      answer,
    }));
    
    // Ensure all questions are answered
    if (answersList.length < questions.length) {
      const unansweredCount = questions.length - answersList.length;
      toast({
        title: "Warning",
        description: `You have ${unansweredCount} unanswered question${
          unansweredCount > 1 ? "s" : ""
        }. Are you sure you want to submit?`,
        variant: "destructive",
      });
      return;
    }
    
    submitTestMutation.mutate(answersList);
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    const options = getOptionsFromQuestion(currentQuestion);
    const selectedAnswer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case "multiple_choice":
        return (
          <RadioGroup
            value={selectedAnswer?.toString() ?? ""}
            onValueChange={(value) => handleAnswerChange(value)}
          >
            <div className="space-y-3">
              {options.map((option, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 border p-3 rounded-md hover:bg-neutral-50"
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-2 border p-3 rounded-md hover:bg-neutral-50"
              >
                <Checkbox
                  id={`option-${index}`}
                  checked={
                    Array.isArray(selectedAnswer) &&
                    selectedAnswer.includes(index.toString())
                  }
                  onCheckedChange={(checked) => {
                    const currentValue = Array.isArray(selectedAnswer)
                      ? [...selectedAnswer]
                      : [];
                    
                    if (checked) {
                      handleAnswerChange([...currentValue, index.toString()]);
                    } else {
                      handleAnswerChange(
                        currentValue.filter((item) => item !== index.toString())
                      );
                    }
                  }}
                />
                <Label 
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case "text":
      case "code":
        return (
          <Textarea
            placeholder={`Enter your ${
              currentQuestion.type === "code" ? "code" : "answer"
            } here`}
            className={currentQuestion.type === "code" ? "font-mono" : ""}
            rows={6}
            value={selectedAnswer || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
          />
        );

      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unsupported question type: {currentQuestion.type}
            </AlertDescription>
          </Alert>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 border-4 border-t-blue-600 border-b-blue-600 border-l-blue-100 border-r-blue-100 rounded-full animate-spin"></div>
              <p className="text-xl font-medium">Loading test...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold text-red-500">Error</h2>
              <p className="text-center text-neutral-600">
                {(error as Error)?.message || "Failed to load test. The link may be expired or invalid."}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold text-red-500">Error</h2>
              <p>Test not found or link expired.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test completed view
  if (testSubmitted && testResult) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-2xl">
              Test Completed
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Thank you for taking the test!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
              <h2 className="text-2xl font-bold">Your Results</h2>
              <div className="text-5xl font-bold">
                {testResult.score} / {testResult.totalPossibleScore}
              </div>
              <p className="text-center text-lg text-neutral-600">
                Your responses have been recorded. The recruiter will review your results.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => window.close()}>
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Start test view
  if (!testStarted) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {testData.test.name}
            </CardTitle>
            <CardDescription className="text-center text-lg">
              {testData.test.category}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium text-lg mb-2">Welcome, {testData.candidate.name}</h3>
              <p className="text-neutral-600">
                {testData.test.description || "You are about to start a test. Please read the instructions below."}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Test Information</h3>
              <ul className="list-disc pl-5 text-neutral-600 space-y-1">
                <li>Number of questions: {testData.questions.length}</li>
                {testData.test.timeLimit && (
                  <li>Time limit: {testData.test.timeLimit} minute{testData.test.timeLimit !== 1 ? "s" : ""}</li>
                )}
                <li>You can navigate between questions using the buttons provided</li>
                <li>Your answers are saved as you navigate between questions</li>
                <li>You must answer all questions before submitting</li>
              </ul>
            </div>
            
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                {testData.test.timeLimit 
                  ? `This test has a time limit of ${testData.test.timeLimit} minute${testData.test.timeLimit !== 1 ? "s" : ""}. The timer will start once you begin.`
                  : "Take your time to answer the questions correctly. There is no time limit for this test."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleStartTest} 
              className="w-full" 
              disabled={startTestMutation.isPending}
            >
              {startTestMutation.isPending ? "Starting..." : "Start Test"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Taking test view
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card className="w-full">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{testData.test.name}</CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardDescription>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-500" />
                <span className="font-medium">
                  {formatTimeRemaining()}
                </span>
              </div>
            )}
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        
        <CardContent className="pt-6 pb-8">
          {currentQuestion && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  {currentQuestion.content}
                </h3>
                <p className="text-sm text-neutral-500">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? "s" : ""} •{" "}
                  {currentQuestion.type === "multiple_choice"
                    ? "Select one option"
                    : currentQuestion.type === "checkbox"
                    ? "Select all that apply"
                    : currentQuestion.type === "code"
                    ? "Write your code"
                    : "Write your answer"}
                </p>
              </div>
              
              <div className="min-h-[200px]">
                {renderQuestionContent()}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-3">
            {currentQuestionIndex < questions.length - 1 ? (
              <Button onClick={handleNextQuestion}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitTest}
                disabled={submitTestMutation.isPending}
              >
                {submitTestMutation.isPending ? "Submitting..." : "Submit Test"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TakeTest;