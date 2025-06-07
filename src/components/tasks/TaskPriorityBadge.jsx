// components/tasks/TaskPriorityBadge.jsx
import React from 'react';
import { Badge } from "@/components/ui/badge";

export default function TaskPriorityBadge({ priority, language = "en" }) {
  const isRTL = language === "he";

  const getPriorityInfo = () => {
    switch (priority) {
      case 'low':
        return {
          label: isRTL ? "נמוכה" : "Low",
          variant: "outline"
        };
      case 'medium':
        return {
          label: isRTL ? "בינונית" : "Medium",
          variant: "secondary"
        };
      case 'high':
        return {
          label: isRTL ? "גבוהה" : "High",
          variant: "warning"
        };
      case 'urgent':
        return {
          label: isRTL ? "דחופה" : "Urgent",
          variant: "destructive"
        };
      default:
        return {
          label: isRTL ? "בינונית" : "Medium",
          variant: "secondary"
        };
    }
  };

  const { label, variant } = getPriorityInfo();

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}
