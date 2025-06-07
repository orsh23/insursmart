// components/tasks/TaskStatusBadge.jsx
import React from 'react';
import { Badge } from "@/components/ui/badge";

export default function TaskStatusBadge({ status, language = "en" }) {
  const isRTL = language === "he";

  const getStatusInfo = () => {
    switch (status) {
      case 'todo':
        return {
          label: isRTL ? "לטיפול" : "To Do",
          variant: "outline"
        };
      case 'in_progress':
        return {
          label: isRTL ? "בתהליך" : "In Progress",
          variant: "secondary"
        };
      case 'review':
        return {
          label: isRTL ? "בסקירה" : "In Review",
          variant: "warning"
        };
      case 'done':
        return {
          label: isRTL ? "בוצע" : "Done",
          variant: "success"
        };
      default:
        return {
          label: isRTL ? "לטיפול" : "To Do",
          variant: "outline"
        };
    }
  };

  const { label, variant } = getStatusInfo();

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}
