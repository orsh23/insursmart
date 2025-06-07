import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, Circle, ArrowUpCircle, Search } from "lucide-react";

export default function TaskStatusDropdown({
  status,
  onChange,
  language = "en"
}) {
  const isRTL = language === "he";

  const statusConfig = {
    to_do: {
      label: isRTL ? "לביצוע" : "To Do",
      icon: Circle,
      className: "text-gray-500"
    },
    in_progress: {
      label: isRTL ? "בתהליך" : "In Progress",
      icon: ArrowUpCircle,
      className: "text-blue-500"
    },
    review: {
      label: isRTL ? "לבדיקה" : "In Review",
      icon: Search,
      className: "text-purple-500"
    },
    done: {
      label: isRTL ? "הושלם" : "Done",
      icon: CheckCircle2,
      className: "text-green-500"
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.to_do;
  const StatusIcon = currentStatus.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`w-full justify-start ${currentStatus.className}`}
        >
          <StatusIcon className="h-4 w-4 mr-2" />
          {currentStatus.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "end" : "start"}>
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onChange(key)}
              className={status === key ? "bg-gray-100" : ""}
            >
              <Icon className={`h-4 w-4 mr-2 ${config.className}`} />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}