import { ChangeEvent } from "react";

import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

type ImportUploadStepProps = {
  fileName: string | null;
  formatError: string | null;
  parseWarning: string | null;
  onFileSelect: (file: File | null) => void;
};

export default function ImportUploadStep({ fileName, formatError, parseWarning, onFileSelect }: ImportUploadStepProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Step 1 - Upload CSV</h2>
          <p className="text-sm text-muted-foreground">
            Upload your budget template CSV. Required columns: date, type, account, category, amount.
          </p>
        </div>

        <label
          htmlFor="template-csv-file"
          className="flex min-h-32 cursor-pointer items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm"
        >
          <span>{fileName ? `Selected file: ${fileName}` : "Drag and drop or click to select a .csv file"}</span>
        </label>
        <input id="template-csv-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFileChange} />

        {formatError ? <p className="text-sm text-destructive">{formatError}</p> : null}
        {parseWarning ? <p className="text-sm text-amber-700">{parseWarning}</p> : null}

        <div className="flex justify-end">
          <Button type="button" asChild variant="outline">
            <label htmlFor="template-csv-file">Choose CSV file</label>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
