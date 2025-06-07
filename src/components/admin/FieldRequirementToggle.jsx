import React from "react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function FieldRequirementToggle({ 
  value = false, 
  onChange, 
  label, 
  disabled = false,
  language = "he" 
}) {
  const handleChange = (checked) => {
    if (onChange) {
      onChange(checked);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center space-x-2">
          <Switch
            checked={value}
            onCheckedChange={handleChange}
            disabled={disabled}
            className={disabled ? "cursor-not-allowed opacity-50" : ""}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {disabled 
          ? (language === "he" 
              ? "יש להפעיל את השדה תחילה" 
              : "Enable field visibility first")
          : (value 
              ? (language === "he" ? "לחץ לביטול" : "Click to disable")
              : (language === "he" ? "לחץ להפעלה" : "Click to enable")
            )
        }
      </TooltipContent>
    </Tooltip>
  );
}