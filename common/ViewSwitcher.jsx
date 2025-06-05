import React, { useEffect } from "react";
import { ChevronDown, Grid3X3, Table, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useLanguageHook } from "@/components/useLanguageHook";

/**
 * View switcher dropdown for toggling between table, card, kanban views
 */
function ViewSwitcherDropdown({ 
  view, 
  onChange, 
  entityName = "tasks", 
  availableViews = ["table", "card", "kanban"],
  t: externalT,
  isRTL = false
}) {
  const { t: internalT } = useLanguageHook();
  const t = externalT || internalT;

  const viewIcons = {
    table: Table,
    card: Grid3X3,
    kanban: Kanban
  };

  const allViews = [
    { id: "table", label: t("viewSwitcher.tableView", { defaultValue: "Table View" }), icon: Table },
    { id: "card", label: t("viewSwitcher.cardView", { defaultValue: "Card View" }), icon: Grid3X3 },
    { id: "kanban", label: t("viewSwitcher.kanbanView", { defaultValue: "Kanban View" }), icon: Kanban }
  ];

  const views = allViews.filter(v => availableViews.includes(v.id));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${entityName}_view_preference`);
      if (saved && views.some(v => v.id === saved) && saved !== view && onChange) {
        onChange(saved);
      }
    }
  }, [entityName, view, onChange, views]);

  const handleChange = (newView) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${entityName}_view_preference`, newView);
      } catch (e) {
        console.warn("Could not save view preference to localStorage", e);
      }
    }
    if (onChange && typeof onChange === 'function') {
      onChange(newView);
    }
  };

  const currentView = views.find(v => v.id === view);
  const CurrentIcon = currentView?.icon || Grid3X3;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`flex items-center gap-2 ${isRTL ? 'ml-2' : 'mr-2'}`}>
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentView?.label || t("viewSwitcher.view", { defaultValue: "View" })}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        {views.map((v) => {
          const IconComponent = v.icon;
          return (
            <DropdownMenuItem
              key={v.id}
              onClick={() => handleChange(v.id)}
              className={view === v.id ? "font-medium bg-muted" : ""}
            >
              <IconComponent className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {v.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Also export it as ViewSwitcher for backward compatibility
export { ViewSwitcherDropdown as ViewSwitcher };
export default ViewSwitcherDropdown;