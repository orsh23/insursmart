
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Info,
  AlertTriangle, 
  CheckCircle, 
  XCircle 
} from "lucide-react";

export default function PolicyValidator({ 
  validation = {},
  language = "en"
}) {
  const isRTL = language === "he";

  const getValidationStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderValidationResult = (result) => {
    if (!result) return null;

    return (
      <Alert 
        className={`mb-4 ${getValidationStatusColor(result.status)}`}
      >
        <div className="flex items-start">
          {getStatusIcon(result.status)}
          <div className="ml-3">
            <AlertTitle className="mb-1 font-medium">
              {isRTL ? result.titleHe : result.title}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {isRTL ? result.messageHe : result.message}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  };

  return (
    <div className="space-y-4">
      {/* Coverage Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium">
            {isRTL ? "סטטוס כיסוי" : "Coverage Status"}
          </h3>
          <p className="text-sm text-gray-500">
            {isRTL ? "תוצאות בדיקת זכאות" : "Policy eligibility check results"}
          </p>
        </div>
        <Badge className={getValidationStatusColor(validation.overallStatus)}>
          {isRTL ? validation.statusTextHe : validation.statusText}
        </Badge>
      </div>

      {/* Validation Results */}
      <div className="space-y-2">
        {validation.results?.map((result, index) => (
          <div key={index}>
            {renderValidationResult(result)}
          </div>
        ))}
      </div>

      {/* Warnings and Notices */}
      {validation.warnings?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">
            {isRTL ? "אזהרות והתראות" : "Warnings & Notices"}
          </h4>
          <ul className="space-y-2">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2" />
                <span className="text-sm">
                  {isRTL ? warning.messageHe : warning.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
