import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export default function PolicyCoverageDetails({ coverage, language = "en" }) {
  const isRTL = language === "he";

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? "he-IL" : "en-US", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const CoverageItem = ({ label, value, type = "boolean" }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-600">{label}</span>
      {type === "boolean" ? (
        value ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-300" />
        )
      ) : type === "currency" ? (
        <span className="font-medium">{formatCurrency(value)}</span>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );

  if (!coverage) return null;

  return (
    <div className="space-y-6">
      {/* Coverage Types */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">
          {isRTL ? "סוגי כיסוי" : "Coverage Types"}
        </h3>
        <div className="space-y-2">
          <CoverageItem 
            label={isRTL ? "תשלום לרופא" : "Doctor Fee"}
            value={coverage.allows_doctor_fee}
          />
          <CoverageItem 
            label={isRTL ? "שתלים" : "Implantables"}
            value={coverage.allows_implantables}
          />
          <CoverageItem 
            label={isRTL ? "רופא פרטי" : "Private Doctor"}
            value={coverage.allows_private_doctor}
          />
        </div>
      </Card>

      {/* Additional Coverage */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">
          {isRTL ? "כיסויים נוספים" : "Additional Coverage"}
        </h3>
        <div className="space-y-2">
          <CoverageItem 
            label={isRTL ? "שיניים" : "Dental"}
            value={coverage.has_dental}
          />
          <CoverageItem 
            label={isRTL ? "ראייה" : "Vision"}
            value={coverage.has_vision}
          />
          <CoverageItem 
            label={isRTL ? "הריון ולידה" : "Maternity"}
            value={coverage.has_maternity}
          />
          <CoverageItem 
            label={isRTL ? "מחלות כרוניות" : "Chronic Conditions"}
            value={coverage.has_chronic}
          />
          <CoverageItem 
            label={isRTL ? "מצב קיים" : "Pre-existing Conditions"}
            value={coverage.has_preexisting}
          />
        </div>
      </Card>

      {/* Limits and Amounts */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">
          {isRTL ? "מגבלות וסכומים" : "Limits and Amounts"}
        </h3>
        <div className="space-y-2">
          <CoverageItem 
            label={isRTL ? "מקסימום ימי אשפוז" : "Hospital Days Limit"}
            value={coverage.hospital_days_limit}
            type="number"
          />
          <CoverageItem 
            label={isRTL ? "מקסימום בדיקות" : "Diagnostic Tests Limit"}
            value={coverage.diagnostic_tests_limit}
            type="number"
          />
          <CoverageItem 
            label={isRTL ? "סכום כיסוי אשפוז" : "Hospital Coverage"}
            value={coverage.hospital_coverage_amount}
            type="currency"
          />
          <CoverageItem 
            label={isRTL ? "סכום כיסוי ניתוח" : "Surgery Coverage"}
            value={coverage.surgery_coverage_amount}
            type="currency"
          />
          <CoverageItem 
            label={isRTL ? "סכום כיסוי אמבולטורי" : "Outpatient Coverage"}
            value={coverage.outpatient_coverage_amount}
            type="currency"
          />
        </div>
      </Card>

      {/* Financial Terms */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">
          {isRTL ? "תנאים כספיים" : "Financial Terms"}
        </h3>
        <div className="space-y-2">
          <CoverageItem 
            label={isRTL ? "השתתפות עצמית שנתית" : "Annual Deductible"}
            value={coverage.annual_deductible}
            type="currency"
          />
          <CoverageItem 
            label={isRTL ? "אחוז השתתפות" : "Copay Percentage"}
            value={`${coverage.copay_percentage}%`}
            type="text"
          />
          <CoverageItem 
            label={isRTL ? "מקסימום הוצאה" : "Out of Pocket Maximum"}
            value={coverage.out_of_pocket_max}
            type="currency"
          />
        </div>
      </Card>
    </div>
  );
}