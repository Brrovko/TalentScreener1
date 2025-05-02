import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImportExportButtonsProps {
  testId: number;
  onImportSuccess: () => void;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({ testId, onImportSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tests/${testId}/export-questions`);
      
      if (!response.ok) {
        throw new Error('Failed to export questions');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questions-test-${testId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast({
        title: "Export successful",
        description: "Questions exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/tests/${testId}/import-questions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import questions');
      }
      
      const result = await response.json();
      
      toast({
        title: "Import successful",
        description: `Imported ${result.importedCount} questions successfully`,
      });
      
      onImportSuccess();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Сбрасываем значение input, чтобы можно было загрузить тот же файл повторно
      event.target.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline"
        onClick={handleExport}
        disabled={loading}
      >
        <Download className="h-4 w-4 mr-2" />
        Export Questions
      </Button>
      
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => document.getElementById('import-file')?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Questions
      </Button>
      
      <input
        id="import-file"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImportExportButtons;
