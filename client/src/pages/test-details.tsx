import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import QuestionsManager from "@/components/tests/QuestionsManager";
import TestForm from "@/components/tests/TestForm";
import { Test } from "@shared/schema";

const TestDetails = () => {
  const [, params] = useRoute<{ id: string }>("/dashboard/tests/:id");
  const testId = parseInt(params?.id || "0");
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);

  // Получаем данные теста
  const { data: test, isLoading } = useQuery<Test>({
    queryKey: ["/api/tests", testId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tests/${testId}`);
      return await response.json();
    },
    enabled: !!testId,
  });

  // Обновление после сохранения
  const handleSave = () => {
    setEditMode(false);
    queryClient.invalidateQueries({ queryKey: ["/api/tests", testId] });
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!test) {
    return <div className="p-8 text-center text-red-500">Test not found</div>;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-neutral-50">
      <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-20 md:pb-4">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center mb-4">
            <Link to="/dashboard/tests">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold mr-4">{test.name}</h1>
            <Badge variant={test.isActive ? "success" : "outline"} className="ml-2">
              {test.isActive ? t('tests.active') : t('tests.archived')}
            </Badge>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setEditMode(!editMode)}>
              <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
            </Button>
          </div>

          {/* Информация о тесте или форма редактирования */}
          <Card className="mb-8">
            <CardHeader />
            <CardContent>
              {editMode ? (
                <TestForm test={test} onComplete={handleSave} />
              ) : (
                <div className="space-y-2">
                  <div><span className="text-neutral-500">{t('tests.test_name')}:</span> <span className="font-medium">{test.name}</span></div>
                  {test.description && <div><span className="text-neutral-500">{t('tests.description')}:</span> <span>{test.description}</span></div>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Вопросы */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tests.questions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionsManager test={test} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TestDetails;
