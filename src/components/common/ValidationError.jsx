import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

export default function ValidationError({ 
  title, 
  titleHe,
  errors = [], 
  language = "en" 
}) {
  const isRTL = language === "he";
  
  if (!errors || errors.length === 0) return null;

  return (
    <Alert variant="destructive" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-start gap-2">
        <XCircle className="h-5 w-5" />
        <div>
          <AlertTitle>
            {isRTL ? titleHe : title}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {isRTL ? error.messageHe : error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}