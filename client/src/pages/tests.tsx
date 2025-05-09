import { useState } from "react";
import { Plus } from "lucide-react";
import CreateTestModal from "@/components/tests/CreateTestModal";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import TestsTable from "@/components/tests/TestsTable";

import { Test } from "@shared/schema";
import { useTranslation } from "react-i18next";

const Tests = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  





  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">{t('common.tests')}</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          {t('tests.create_test')}
        </Button>
      </div>

      <TestsTable />

<CreateTestModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onCreated={(test) => {
    setIsCreateModalOpen(false);
    if (test?.id) setLocation(`/dashboard/tests/${test.id}`);
  }}
/>

    </div>
  );
};

export default Tests;
