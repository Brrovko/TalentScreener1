import { Dialog, DialogContent } from "@/components/ui/dialog";
import TestForm from "./TestForm";
import { Test } from "@shared/schema";

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (test: Test) => void;
}

const CreateTestModal = ({ isOpen, onClose, onCreated }: CreateTestModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full">
        <TestForm
          onComplete={(test) => {
            if (test && test.id) {
              onCreated(test);
            } else {
              onClose();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTestModal;
