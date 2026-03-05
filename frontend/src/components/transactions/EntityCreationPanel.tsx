import type { Account, AccountType, Category, CategoryType } from "@/api/types";
import type { EntityToCreate } from "@/lib/templateCsvParser";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

export type EditableEntity = EntityToCreate;

type EntityCreationPanelProps = {
  title: string;
  entities: EditableEntity[];
  existingOptions: Array<Account | Category>;
  allowedTypes: Array<AccountType | CategoryType>;
  onChange: (sourceKey: string, patch: Partial<EditableEntity>) => void;
};

export default function EntityCreationPanel({
  title,
  entities,
  existingOptions,
  allowedTypes,
  onChange
}: EntityCreationPanelProps) {
  if (entities.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">No new entities to create.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {entities.map((entity) => (
          <div key={entity.sourceKey} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
            <Input
              aria-label={`${title} name ${entity.sourceKey}`}
              value={entity.draftName}
              onChange={(event) => onChange(entity.sourceKey, { draftName: event.target.value })}
            />
            <Select
              value={entity.draftType}
              onValueChange={(value) => onChange(entity.sourceKey, { draftType: value as AccountType | CategoryType })}
            >
              <SelectTrigger aria-label={`${title} type ${entity.sourceKey}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={entity.mappedExistingId ?? "__new__"}
              onValueChange={(value) => {
                onChange(entity.sourceKey, { mappedExistingId: value === "__new__" ? undefined : value });
              }}
            >
              <SelectTrigger aria-label={`${title} map ${entity.sourceKey}`}>
                <SelectValue placeholder="Map to existing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__">Create new</SelectItem>
                {existingOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </section>
  );
}
