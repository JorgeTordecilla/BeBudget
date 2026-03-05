import type { Account, AccountType, Category, CategoryType } from "@/api/types";
import EntityCreationPanel, { type EditableEntity } from "@/components/transactions/EntityCreationPanel";
import ImportPreviewTable from "@/components/transactions/ImportPreviewTable";
import type { ParsedImportResult } from "@/lib/templateCsvParser";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

type ImportPreviewStepProps = {
  parsed: ParsedImportResult;
  accountsToCreate: EditableEntity[];
  categoriesToCreate: EditableEntity[];
  existingAccounts: Account[];
  existingCategories: Category[];
  onEditAccount: (sourceKey: string, patch: Partial<EditableEntity>) => void;
  onEditCategory: (sourceKey: string, patch: Partial<EditableEntity>) => void;
  onUploadDifferent: () => void;
  onConfirm: () => void;
  isConfirmDisabled: boolean;
};

export default function ImportPreviewStep({
  parsed,
  accountsToCreate,
  categoriesToCreate,
  existingAccounts,
  existingCategories,
  onEditAccount,
  onEditCategory,
  onUploadDifferent,
  onConfirm,
  isConfirmDisabled
}: ImportPreviewStepProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Step 2 - Preview and resolve entities</h2>
          <p className="text-sm text-muted-foreground">
            {parsed.validCount} ready to import / {parsed.errorCount} with errors / {parsed.warningCount} warnings
          </p>
        </div>

        <EntityCreationPanel
          title="Accounts to create"
          entities={accountsToCreate}
          existingOptions={existingAccounts}
          allowedTypes={["bank", "cash", "credit", "debit"] as AccountType[]}
          onChange={onEditAccount}
        />

        <EntityCreationPanel
          title="Categories to create"
          entities={categoriesToCreate}
          existingOptions={existingCategories}
          allowedTypes={["expense", "income"] as CategoryType[]}
          onChange={onEditCategory}
        />

        <ImportPreviewTable rows={parsed.allRows} />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onUploadDifferent}>
            Upload different file
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isConfirmDisabled}>
            Continue to execute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
