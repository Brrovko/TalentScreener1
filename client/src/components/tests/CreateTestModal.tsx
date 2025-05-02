import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestForm from "./TestForm";
import QuestionsManager from "./QuestionsManager";
import { Test } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTest: Test | null;
}

const CreateTestModal = ({ isOpen, onClose, editingTest }: CreateTestModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const title = editingTest ? t('tests.edit_test') : t('tests.create_test');
  const [createdTest, setCreatedTest] = useState<Test | null>(null);
  const [activeTab, setActiveTab] = useState<string>("details");

  // Сбрасываем состояние при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setCreatedTest(null);
      setActiveTab("details");
    }
  }, [isOpen]);

  const handleTestCreated = (test: Test) => {
    setCreatedTest(test);
    setActiveTab("questions");
    // Обновляем список тестов
    queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
    toast({
      title: t('common.success'),
      description: t('tests.test_created_successfully', 'Test created successfully'),
    });
  };

  const handleComplete = () => {
    onClose();
  };

  // Определяем, какой тест использовать (созданный новый или редактируемый)
  const testToUse = editingTest || createdTest;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="mt-1">
            {t('tests.edit_description', 'Edit test details and manage questions')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">{t('tests.test_details', 'Test Details')}</TabsTrigger>
            <TabsTrigger 
              value="questions" 
              disabled={!testToUse}
            >
              {t('tests.questions')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            {!createdTest ? (
              <TestForm 
                test={editingTest} 
                onComplete={editingTest ? handleComplete : (test?: Test) => test && handleTestCreated(test)}
              />
            ) : (
              <TestForm 
                test={createdTest} 
                onComplete={handleComplete}
              />
            )}
          </TabsContent>
          <TabsContent value="questions">
            {testToUse && <QuestionsManager test={testToUse} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTestModal;
