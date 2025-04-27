import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

// Interfaces
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

interface Answer {
  questionId: number;
  answer: string | string[] | number;
}

const TakeTestPage = () => {
  const [, params] = useRoute<{ token: string }>("/take-test/:token");
  const token = params?.token || "";
  
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [score, setScore] = useState<{
    score: number;
    totalPossibleScore: number;
    session: any;
  } | null>(null);
  
  // Fetch test details
  const { data: testDetails, isLoading, error } = useQuery<TestDetails>({
    queryKey: ['/api/sessions/token', token],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/token/${token}`);
      if (!response.ok) {
        throw new Error("Failed to fetch test details");
      }
      return response.json();
    },
    enabled: !!token,
    refetchOnWindowFocus: false,
  });
  
  // Start test session
  const startTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/sessions/${token}/start`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start test");
      }
      return response.json();
    },
    onSuccess: () => {
      setStarted(true);
      
      // Initialize answers array with empty values
      if (testDetails) {
        const initialAnswers = testDetails.questions.map(q => ({
          questionId: q.id,
          answer: q.type === "checkbox" ? [] : ""
        }));
        setAnswers(initialAnswers);
        
        // Set up timer if test has time limit
        if (testDetails.test.timeLimit) {
          setTimeLeft(testDetails.test.timeLimit * 60); // Convert minutes to seconds
        }
      }
    },
    onError: (error: Error) => {
      console.error("Failed to start test:", error);
    }
  });
  
  // Submit test answers
  const submitTestMutation = useMutation({
    mutationFn: async (answers: Answer[]) => {
      const response = await apiRequest("POST", `/api/sessions/${token}/submit`, { answers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit test");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCompleted(true);
      setScore(data);
    },
    onError: (error: Error) => {
      console.error("Failed to submit test:", error);
    }
  });
  
  // Timer effect
  useEffect(() => {
    if (!started || timeLeft === null) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime === null || prevTime <= 0) {
          clearInterval(interval);
          // Auto-submit when time runs out
          if (!completed) {
            submitTestMutation.mutate(answers);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [started, timeLeft, completed, submitTestMutation, answers]);
  
  // Handle answers change
  const handleAnswerChange = (questionId: number, value: string | string[] | number) => {
    setAnswers(prev => 
      prev.map(a => a.questionId === questionId ? { ...a, answer: value } : a)
    );
  };
  
  // Handle checkbox answers
  const handleCheckboxChange = (questionId: number, optionValue: string, checked: boolean) => {
    setAnswers(prev => {
      return prev.map(a => {
        if (a.questionId === questionId) {
          const currentAnswers = Array.isArray(a.answer) ? [...a.answer] : [];
          if (checked) {
            // Add option if checked
            return { ...a, answer: [...currentAnswers, optionValue] };
          } else {
            // Remove option if unchecked
            return { ...a, answer: currentAnswers.filter(val => val !== optionValue) };
          }
        }
        return a;
      });
    });
  };
  
  // Get current question
  const currentQuestion = testDetails?.questions[currentQuestionIndex];
  
  // Get current answer
  const getCurrentAnswer = (questionId: number) => {
    return answers.find(a => a.questionId === questionId)?.answer;
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get options from question
  const getOptionsFromQuestion = (question: TestQuestion) => {
    if (!question.options) return [];
    
    if (Array.isArray(question.options)) {
      if (typeof question.options[0] === 'string') {
        return question.options as string[];
      } else if (typeof question.options[0] === 'object' && 'id' in question.options[0]) {
        return question.options as { id: string; text: string }[];
      }
    }
    
    // Try to parse JSON if it's a string
    if (typeof question.options === 'string') {
      try {
        const parsed = JSON.parse(question.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to parse options:", e);
        return [];
      }
    }
    
    return [];
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold">Loading Test...</div>
          <Progress value={30} className="w-64" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !testDetails) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error 
              ? error.message 
              : "Test not found or has expired. Please contact the recruiter."}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Not Available</CardTitle>
            <CardDescription>
              The test you're trying to access is not available. This could be because:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>The test link has expired</li>
              <li>The test has already been completed</li>
              <li>The link is invalid</li>
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Please contact the recruiter who sent you this test for assistance.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Test completed state
  if (completed && score) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Test Completed</CardTitle>
            <CardDescription>
              Thank you for completing the test, {testDetails.candidate.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <span className="text-xl font-medium">
                Your responses have been recorded
              </span>
            </div>
            
            <div className="rounded-lg bg-slate-50 p-6">
              <h3 className="mb-4 text-lg font-medium">Test Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Test:</span>
                  <span className="font-medium">{testDetails.test.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span>{testDetails.test.category}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Questions Answered:</span>
                  <span>{testDetails.questions.length}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Your results have been submitted to the recruiter. They will contact you with next steps.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Test welcome screen
  if (!started) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{testDetails.test.name}</CardTitle>
            <CardDescription>
              Welcome, {testDetails.candidate.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium">Test Description:</h3>
              <p className="text-sm text-muted-foreground">{testDetails.test.description}</p>
            </div>
            
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="mb-2 font-medium">Test Details:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span>{testDetails.test.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Questions:</span>
                  <span>{testDetails.questions.length}</span>
                </div>
                {testDetails.test.timeLimit && (
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <span>{testDetails.test.timeLimit} minutes</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span>{new Date(testDetails.session.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Instructions</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Answer all questions to the best of your ability</li>
                  <li>You can navigate between questions using the previous and next buttons</li>
                  {testDetails.test.timeLimit && (
                    <li>The test has a time limit of {testDetails.test.timeLimit} minutes</li>
                  )}
                  <li>Once you submit the test, you cannot retake it</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Click 'Start Test' when you're ready to begin
            </p>
            <Button 
              onClick={() => startTestMutation.mutate()}
              disabled={startTestMutation.isPending}
            >
              {startTestMutation.isPending ? "Starting..." : "Start Test"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Render the actual test
  return (
    <div className="container mx-auto max-w-3xl py-8">
      {/* Test header with progress and timer */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow">
        <div>
          <h1 className="text-xl font-bold">{testDetails.test.name}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {testDetails.questions.length}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Progress 
            value={(currentQuestionIndex + 1) / testDetails.questions.length * 100}
            className="w-32"
          />
          
          {timeLeft !== null && (
            <div className="flex items-center space-x-1 text-sm">
              <Clock className="h-4 w-4" />
              <span 
                className={timeLeft < 60 ? "text-red-500 font-bold" : ""}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Current question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1}: {currentQuestion.content}
            </CardTitle>
            <CardDescription>
              {currentQuestion.type === "multiple_choice" ? "Select one option" :
               currentQuestion.type === "checkbox" ? "Select all that apply" :
               currentQuestion.type === "text" ? "Enter your answer" :
               "Write code"} • {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {currentQuestion.type === "multiple_choice" && (
              <RadioGroup
                value={getCurrentAnswer(currentQuestion.id) as string}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {getOptionsFromQuestion(currentQuestion).map((option, index) => {
                  const value = typeof option === 'string' ? option : option.id;
                  const label = typeof option === 'string' ? option : option.text;
                  
                  return (
                    <div className="flex items-center space-x-2" key={index}>
                      <RadioGroupItem value={value} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{label}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}
            
            {currentQuestion.type === "checkbox" && (
              <div className="space-y-3">
                {getOptionsFromQuestion(currentQuestion).map((option, index) => {
                  const value = typeof option === 'string' ? option : option.id;
                  const label = typeof option === 'string' ? option : option.text;
                  const currentAnswers = getCurrentAnswer(currentQuestion.id) as string[];
                  
                  return (
                    <div className="flex items-center space-x-2" key={index}>
                      <Checkbox
                        id={`option-${index}`}
                        checked={Array.isArray(currentAnswers) && currentAnswers.includes(value)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange(currentQuestion.id, value, checked === true)
                        }
                      />
                      <Label htmlFor={`option-${index}`}>{label}</Label>
                    </div>
                  );
                })}
              </div>
            )}
            
            {(currentQuestion.type === "text" || currentQuestion.type === "code") && (
              <Textarea
                value={getCurrentAnswer(currentQuestion.id) as string}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.type === "code" ? "Write your code here..." : "Enter your answer..."}
                className={currentQuestion.type === "code" ? "font-mono" : ""}
                rows={6}
              />
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              Previous
            </Button>
            
            {currentQuestionIndex < testDetails.questions.length - 1 ? (
              <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={() => submitTestMutation.mutate(answers)}
                disabled={submitTestMutation.isPending}
              >
                {submitTestMutation.isPending ? "Submitting..." : "Submit Test"}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default TakeTestPage;