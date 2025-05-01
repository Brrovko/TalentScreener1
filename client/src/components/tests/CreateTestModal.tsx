import { X } from "lucide-react";
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

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTest: Test | null;
}

const CreateTestModal = ({ isOpen, onClose, editingTest }: CreateTestModalProps) => {
  const { t } = useTranslation();
  const title = editingTest ? t('tests.edit_test') : t('tests.create_test');
  const isEditing = Boolean(editingTest);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          {isEditing && (
            <DialogDescription className="mt-1">
              {t('tests.edit_description', 'Edit test details and manage questions')}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isEditing ? (
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">{t('tests.test_details', 'Test Details')}</TabsTrigger>
              <TabsTrigger value="questions">{t('tests.questions')}</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <TestForm test={editingTest} onComplete={onClose} />
            </TabsContent>
            <TabsContent value="questions">
              {editingTest && <QuestionsManager test={editingTest} />}
            </TabsContent>
          </Tabs>
        ) : (
          <TestForm onComplete={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTestModal;
