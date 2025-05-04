import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

interface Answer {
  sessionId: number;
  questionId: number;
  answer: string;
  isCorrect: boolean;
  points: number;
  question: {
    id: number;
    testId: number;
    content?: string;
    text?: string;
    options?: string[];
    correctAnswer?: string;
    points?: number;
    order?: number;
  };
}

interface TestSession {
  id: number;
  testId: number;
  candidateId: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  percentScore?: number | null;
  passed?: boolean | null;
  expiresAt: string;
  test?: {
    name: string;
    category: string;
    passingScore?: number;
  };
}

const CandidateSessionDetails = () => {
  const [, params] = useRoute<{ candidateId: string; sessionId: string }>(
    "/dashboard/candidates/:candidateId/session/:sessionId"
  );
  const { t } = useTranslation();
  const sessionId = params?.sessionId;
  const candidateId = params?.candidateId;

  // Fetch session details for test name
  const { data: session } = useQuery<TestSession | undefined>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/sessions/${sessionId}`);
      if (!response.ok) return undefined;
      return await response.json();
    },
    enabled: !!sessionId,
  });

  const { data: answers = [], isLoading } = useQuery<Answer[]>({
    queryKey: ["/api/sessions", sessionId, "answers"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/sessions/${sessionId}/answers`);
      return await response.json();
    },
    enabled: !!sessionId,
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link to={`/dashboard/candidates/${candidateId}`}> 
          <Button variant="ghost" size="sm" className="mr-2">
            {t('common.back', 'Back')}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold inline-block" data-component-name="CandidateSessionDetails">
          {session?.test?.name || t('candidates.session_details', 'Session Details')}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t('candidates.answers', 'Answers')}
            {session?.test?.name ? `: ${session.test.name}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>{t('common.loading', 'Loading...')}</div>
          ) : answers.length === 0 ? (
            <div>{t('candidates.no_answers', 'No answers found for this session.')}</div>
          ) : (
            <div className="space-y-4">
              {answers.map((ans, idx) => (
                <div key={idx} className="border rounded p-4">
                  <div className="font-medium mb-2">{ans.question?.content || ans.question?.text}</div>
                  <div className="mb-2">
                    <span className="font-semibold">{t('candidates.answer', 'Answer')}: </span>
                    {typeof ans.answer === 'number' && Array.isArray(ans.question?.options)
                      ? ans.question.options[ans.answer] ?? ans.answer
                      : ans.answer}
                  </div>
                  {ans.isCorrect !== undefined && (
                    <Badge variant={ans.isCorrect ? "success" : "destructive"}>
                      {ans.isCorrect ? t('candidates.correct', 'Correct') : t('candidates.incorrect', 'Incorrect')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateSessionDetails;
