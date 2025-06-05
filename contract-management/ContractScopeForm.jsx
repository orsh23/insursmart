import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CatalogTreeSelector from "../code-management/CatalogTreeSelector";

export default function ContractScopeForm({
  scopeRules = [],
  onUpdate,
  tariffProfiles = [],
  language = "en"
}) {
  const [showCatalogSelector, setShowCatalogSelector] = useState(false);
  const [currentScopeIndex, setCurrentScopeIndex] = useState(null);
  const [errors, setErrors] = useState({});

  const isRTL = language === "he";

  const handleAddScope = () => {
    const newScope = {
      scope_type: "all",
      code_type: "internal",
      code: "",
      catalog_path: "",
      includes_doctor_fee: true,
      includes_implantables: true,
      includes_consumables: true,
      includes_facility_fee: true,
      doctor_selection_type: "both"
    };

    onUpdate([...scopeRules, newScope]);
  };

  const handleUpdateScope = (index, field, value) => {
    const updatedRules = [...scopeRules];
    updatedRules[index] = {
      ...updatedRules[index],
      [field]: value
    };

    // Reset any errors for this field
    if (errors[`${index}-${field}`]) {
      const newErrors = {...errors};
      delete newErrors[`${index}-${field}`];
      setErrors(newErrors);
    }

    onUpdate(updatedRules);
  };

  const handleRemoveScope = (index) => {
    const updatedRules = [...scopeRules];
    updatedRules.splice(index, 1);
    onUpdate(updatedRules);
  };

  const handleSelectCatalogPath = (path) => {
    if (currentScopeIndex !== null) {
      handleUpdateScope(currentScopeIndex, "catalog_path", path);
    }
    setShowCatalogSelector(false);
  };

  const validateScopeRules = () => {
    const newErrors = {};

    scopeRules.forEach((rule, index) => {
      if (rule.scope_type === "code" && !rule.code) {
        newErrors[`${index}-code`] = isRTL
          ? "יש להזין קוד"
          : "Code is required";
      }

      if (rule.scope_type === "catalog_category" && !rule.catalog_path) {
        newErrors[`${index}-catalog_path`] = isRTL
          ? "יש לבחור קטגוריה מהקטלוג"
          : "Catalog category is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderScopeCard = (scope, index) => {
    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {isRTL ? "כלל תחולה" : "Scope Rule"} #{index + 1}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveScope(index)}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scope Type */}
          <div>
            <Label>
              {isRTL ? "סוג תחולה" : "Scope Type"}
            </Label>
            <Select
              value={scope.scope_type}
              onValueChange={(value) => handleUpdateScope(index, "scope_type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isRTL ? "הכל" : "All Codes"}
                </SelectItem>
                <SelectItem value="code">
                  {isRTL ? "קוד ספציפי" : "Specific Code"}
                </SelectItem>
                <SelectItem value="catalog_category">
                  {isRTL ? "קטגוריה בקטלוג" : "Catalog Category"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Code selection - only show when scope_type is 'code' */}
          {scope.scope_type === "code" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  {isRTL ? "סוג קוד" : "Code Type"}
                </Label>
                <Select
                  value={scope.code_type}
                  onValueChange={(value) => handleUpdateScope(index, "code_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">
                      {isRTL ? "קוד פנימי" : "Internal Code"}
                    </SelectItem>
                    <SelectItem value="cpt">
                      CPT
                    </SelectItem>
                    <SelectItem value="icd9">
                      ICD-9
                    </SelectItem>
                    <SelectItem value="icd10">
                      ICD-10
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {isRTL ? "קוד" : "Code"}
                </Label>
                <Input
                  value={scope.code}
                  onChange={(e) => handleUpdateScope(index, "code", e.target.value)}
                  placeholder={isRTL ? "הזן קוד..." : "Enter code..."}
                />
                {errors[`${index}-code`] && (
                  <div className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors[`${index}-code`]}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Catalog Category - only show when scope_type is 'catalog_category' */}
          {scope.scope_type === "catalog_category" && (
            <div>
              <Label>
                {isRTL ? "קטגוריה בקטלוג" : "Catalog Category"}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={scope.catalog_path}
                  onChange={(e) => handleUpdateScope(index, "catalog_path", e.target.value)}
                  placeholder={isRTL ? "נתיב קטגוריה..." : "Category path..."}
                  className="flex-grow"
                  readOnly
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentScopeIndex(index);
                    setShowCatalogSelector(true);
                  }}
                >
                  {isRTL ? "בחר" : "Browse"}
                </Button>
              </div>
              {errors[`${index}-catalog_path`] && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors[`${index}-catalog_path`]}
                </div>
              )}
            </div>
          )}

          {/* Inclusion Configuration */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              {isRTL ? "הגדרות הכללה" : "Inclusion Settings"}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id={`doctor-fee-${index}`}
                  checked={scope.includes_doctor_fee}
                  onCheckedChange={(checked) => 
                    handleUpdateScope(index, "includes_doctor_fee", checked)
                  }
                />
                <Label htmlFor={`doctor-fee-${index}`}>
                  {isRTL ? "כולל שכר רופא" : "Includes Doctor Fee"}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id={`implantables-${index}`}
                  checked={scope.includes_implantables}
                  onCheckedChange={(checked) => 
                    handleUpdateScope(index, "includes_implantables", checked)
                  }
                />
                <Label htmlFor={`implantables-${index}`}>
                  {isRTL ? "כולל שתלים" : "Includes Implantables"}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id={`consumables-${index}`}
                  checked={scope.includes_consumables}
                  onCheckedChange={(checked) => 
                    handleUpdateScope(index, "includes_consumables", checked)
                  }
                />
                <Label htmlFor={`consumables-${index}`}>
                  {isRTL ? "כולל מתכלים" : "Includes Consumables"}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  id={`facility-fee-${index}`}
                  checked={scope.includes_facility_fee}
                  onCheckedChange={(checked) => 
                    handleUpdateScope(index, "includes_facility_fee", checked)
                  }
                />
                <Label htmlFor={`facility-fee-${index}`}>
                  {isRTL ? "כולל עלות מתקן" : "Includes Facility Fee"}
                </Label>
              </div>
            </div>
          </div>

          {/* Doctor Selection Type */}
          <div>
            <Label>
              {isRTL ? "סוג בחירת רופא" : "Doctor Selection Type"}
            </Label>
            <Select
              value={scope.doctor_selection_type}
              onValueChange={(value) => 
                handleUpdateScope(index, "doctor_selection_type", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="provider_only">
                  {isRTL ? "רק רופאי ספק" : "Provider Doctors Only"}
                </SelectItem>
                <SelectItem value="independent_only">
                  {isRTL ? "רק רופאים עצמאיים" : "Independent Doctors Only"}
                </SelectItem>
                <SelectItem value="both">
                  {isRTL ? "שניהם" : "Both"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {scopeRules.map((scope, index) => renderScopeCard(scope, index))}
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleAddScope}
      >
        <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
        {isRTL ? "הוסף כלל תחולה" : "Add Scope Rule"}
      </Button>
      
      {showCatalogSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-3/4 max-w-xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">
              {isRTL ? "בחר קטגוריה" : "Select Category"}
            </h3>
            <CatalogTreeSelector
              onSelect={handleSelectCatalogPath}
              language={language}
            />
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCatalogSelector(false)}
              >
                {isRTL ? "ביטול" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}