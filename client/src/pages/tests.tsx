import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TestsTable from "@/components/tests/TestsTable";
import CreateTestModal from "@/components/tests/CreateTestModal";
import { Test } from "@shared/schema";

const Tests = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingTest(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">Tests</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Create Test
        </Button>
      </div>

      <TestsTable onEdit={handleEditTest} />

      <CreateTestModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        editingTest={editingTest}
      />
    </div>
  );
};

export default Tests;