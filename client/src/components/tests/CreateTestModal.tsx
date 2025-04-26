import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestForm from "./TestForm";
import { Test } from "@shared/schema";

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTest: Test | null;
}

const CreateTestModal = ({ isOpen, onClose, editingTest }: CreateTestModalProps) => {
  const title = editingTest ? "Edit Test" : "Create New Test";
  const isEditing = Boolean(editingTest);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <button 
            onClick={onClose} 
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        
        {isEditing ? (
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Test Details</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <TestForm test={editingTest} onComplete={onClose} />
            </TabsContent>
            <TabsContent value="questions">
              {/* Question management would go here */}
              <div className="p-4 border rounded-md">
                <p className="text-gray-500 text-center py-6">
                  Question management interface would be implemented here.
                  <br />
                  It would include adding/editing questions, options, and correct answers.
                </p>
              </div>
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
