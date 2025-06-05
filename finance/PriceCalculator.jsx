import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calculator, Coins } from "lucide-react";
import { Tariff } from "@/api/entities";
import { Contract } from "@/api/entities";
import { DoctorContract } from "@/api/entities";
import LoadingSpinner from "../common/LoadingSpinner";

export default function PriceCalculator({
  providerId,
  doctorId,
  internalCode,
  quantity = 1,
  implantableRequired = false,
  language = "en",
  onCalculated
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [breakdownVisible, setBreakdownVisible] = useState(false);
  
  const isRTL = language === "he";

  useEffect(() => {
    if (providerId && internalCode) {
      calculatePrice();
    }
  }, [providerId, doctorId, internalCode, quantity, implantableRequired]);

  const calculatePrice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get provider contract and tariff
      const [providerContract] = await Contract.filter({ provider_id: providerId });
      const [tariff] = await Tariff.filter({ 
        provider_id: providerId,
        internal_code: internalCode
      });

      if (!tariff) {
        throw new Error(isRTL 
          ? "לא נמצא תעריף עבור קוד זה" 
          : "No tariff found for this code"
        );
      }

      // Get doctor contract if applicable
      let doctorContract = null;
      if (doctorId) {
        [doctorContract] = await DoctorContract.filter({ doctor_id: doctorId });
      }

      // Find applicable contract scope rule
      const scopeRule = providerContract.scope_rules.find(rule => 
        (rule.scope_type === "code" && rule.code === internalCode) ||
        (rule.scope_type === "catalog_category" && internalCode.startsWith(rule.catalog_path)) ||
        rule.scope_type === "all"
      );

      if (!scopeRule) {
        throw new Error(isRTL 
          ? "לא נמצא כלל חוזה מתאים" 
          : "No matching contract rule found"
        );
      }

      // Base calculation
      const basePrice = tariff.base_price * quantity;
      
      // Component breakdown
      const components = {
        facility_fee: tariff.price_components?.facility_fee || 0,
        doctor_fee: tariff.price_components?.doctor_fee || 0,
        implant_fee: tariff.price_components?.implant_fee || 0,
        consumables_fee: tariff.price_components?.consumables_fee || 0
      };

      // Adjust based on contract scope
      let finalPrice = basePrice;
      let doctorFee = 0;
      let implantFee = 0;
      let consumablesFee = 0;
      let facilityFee = components.facility_fee;

      // Handle doctor fee
      if (doctorId && !scopeRule.includes_doctor_fee) {
        if (doctorContract) {
          if (doctorContract.fee_structure === "fixed") {
            doctorFee = doctorContract.fee_value;
          } else { // percentage
            doctorFee = basePrice * (doctorContract.fee_value / 100);
          }
          finalPrice += doctorFee;
        }
      }

      // Handle implantables
      if (implantableRequired && !scopeRule.includes_implantables) {
        implantFee = components.implant_fee;
        finalPrice += implantFee;
      }

      // Handle consumables
      if (!scopeRule.includes_consumables) {
        consumablesFee = components.consumables_fee;
        finalPrice += consumablesFee;
      }

      const result = {
        base_price: basePrice,
        doctor_fee: doctorFee,
        implant_fee: implantFee,
        consumables_fee: consumablesFee,
        facility_fee: facilityFee,
        final_price: finalPrice,
        currency: tariff.currency || "ILS",
        breakdown: {
          includes_doctor_fee: scopeRule.includes_doctor_fee,
          includes_implantables: scopeRule.includes_implantables,
          includes_consumables: scopeRule.includes_consumables,
          includes_facility_fee: scopeRule.includes_facility_fee
        }
      };

      setCalculation(result);
      if (onCalculated) {
        onCalculated(result);
      }
    } catch (error) {
      console.error("Error calculating price:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount, currency = "ILS") => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calculation) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>
            {isRTL ? "חישוב מחיר" : "Price Calculation"}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBreakdownVisible(!breakdownVisible)}
          >
            <Calculator className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isRTL ? "פירוט" : "Breakdown"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Final Price */}
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-lg font-medium">
              {isRTL ? "מחיר סופי" : "Final Price"}
            </span>
            <span className="text-xl font-bold text-blue-600">
              {formatPrice(calculation.final_price, calculation.currency)}
            </span>
          </div>

          {/* Price Breakdown */}
          {breakdownVisible && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {isRTL ? "מחיר בסיס" : "Base Price"}
                </span>
                <span>{formatPrice(calculation.base_price, calculation.currency)}</span>
              </div>

              {calculation.doctor_fee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {isRTL ? "שכר רופא" : "Doctor Fee"}
                  </span>
                  <span>{formatPrice(calculation.doctor_fee, calculation.currency)}</span>
                </div>
              )}

              {calculation.implant_fee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {isRTL ? "עלות שתלים" : "Implant Fee"}
                  </span>
                  <span>{formatPrice(calculation.implant_fee, calculation.currency)}</span>
                </div>
              )}

              {calculation.consumables_fee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {isRTL ? "עלות מתכלים" : "Consumables Fee"}
                  </span>
                  <span>{formatPrice(calculation.consumables_fee, calculation.currency)}</span>
                </div>
              )}

              {calculation.facility_fee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {isRTL ? "עלות מתקן" : "Facility Fee"}
                  </span>
                  <span>{formatPrice(calculation.facility_fee, calculation.currency)}</span>
                </div>
              )}

              {/* Inclusion Status */}
              <div className="pt-3 border-t mt-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={calculation.breakdown.includes_doctor_fee ? "success" : "secondary"}>
                    {isRTL ? "שכר רופא" : "Doctor Fee"}: 
                    {calculation.breakdown.includes_doctor_fee 
                      ? (isRTL ? " כלול" : " Included")
                      : (isRTL ? " נפרד" : " Separate")
                    }
                  </Badge>
                  
                  <Badge variant={calculation.breakdown.includes_implantables ? "success" : "secondary"}>
                    {isRTL ? "שתלים" : "Implantables"}: 
                    {calculation.breakdown.includes_implantables
                      ? (isRTL ? " כלול" : " Included")
                      : (isRTL ? " נפרד" : " Separate")
                    }
                  </Badge>
                  
                  <Badge variant={calculation.breakdown.includes_consumables ? "success" : "secondary"}>
                    {isRTL ? "מתכלים" : "Consumables"}: 
                    {calculation.breakdown.includes_consumables
                      ? (isRTL ? " כלול" : " Included")
                      : (isRTL ? " נפרד" : " Separate")
                    }
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}