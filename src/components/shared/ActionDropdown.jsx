import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  UploadCloud,
  DownloadCloud,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { useLanguageHook } from "@/components/useLanguageHook";

/**
 * ActionDropdown - Global task toolbar actions (Add, Import, Export, Delete)
 */
export default function ActionDropdown({
  onAdd,
  onImport,
  onExport,
  onBulkDelete,
  language = "en",
  hasSelection = false
}) {
  const { t } = useLanguageHook();
  const isRTL = language === "he";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-2">
          {t("actions.actions", { defaultValue: "Actions" })}
          <MoreHorizontal className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        <DropdownMenuItem onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("actions.addTask", { defaultValue: "Add Task" })}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onImport}>
          <UploadCloud className="mr-2 h-4 w-4" />
          {t("actions.import", { defaultValue: "Import CSV" })}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onExport}>
          <DownloadCloud className="mr-2 h-4 w-4" />
          {t("actions.export", { defaultValue: "Export CSV" })}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onBulkDelete}
          disabled={!hasSelection}
          className="text-red-600 dark:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("actions.bulkDelete", { defaultValue: "Delete Selected" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}