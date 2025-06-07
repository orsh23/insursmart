import React, { useState, useEffect } from 'react';
import { validatePolicyCoverage } from './PolicyValidationService';
import PolicyValidator from './PolicyValidator';
import { Button } from "@/components/ui/button";
import { RotateCw, CheckCircle } from "lucide-react"; // Replace Refresh with RotateCw
import { Skeleton } from "@/components/ui/skeleton";

export default function PolicyValidation({
  policy,
  procedureCodes = [],
  diagnosisCodes = [],
  requestDetails = {},
  language = "en",
  onValidationComplete = () => {},
  showRefreshButton = true
}) {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const isRTL = language === "he";

  // Perform validation when inputs change
  useEffect(() => {
    validatePolicy();
  }, [policy, procedureCodes.join(','), diagnosisCodes.join(',')]);

  const validatePolicy = () => {
    setIsValidating(true);
    
    // Simulate API delay for real-world scenario
    setTimeout(() => {
      const result = validatePolicyCoverage(
        policy,
        procedureCodes,
        diagnosisCodes,
        requestDetails,
        language
      );
      
      setValidationResult(result);
      setIsValidating(false);
      onValidationComplete(result);
    }, 800);
  };

  if (isValidating) {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!validationResult) {
    return (
      <div className="p-4 border rounded-lg text-center">
        <Button onClick={validatePolicy} variant="outline">
          {isRTL ? "בדוק כיסוי פוליסה" : "Check Policy Coverage"}
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">
          {isRTL ? "בדיקת כיסוי פוליסה" : "Policy Coverage Check"}
        </h3>
        {showRefreshButton && (
          <Button onClick={validatePolicy} variant="outline" size="sm">
            <RotateCw className="h-4 w-4 mr-2" /> {/* Changed from Refresh to RotateCw */}
            {isRTL ? "רענן" : "Refresh"}
          </Button>
        )}
      </div>

      <PolicyValidator validation={validationResult} language={language} />
      
      <div className="mt-4 text-sm text-gray-500">
        {isRTL 
          ? "בדיקת כיסוי אוטומטית בהתבסס על תנאי הפוליסה"
          : "Automatic coverage check based on policy terms"
        }
      </div>
    </div>
  );
}