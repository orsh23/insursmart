
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormField from "../forms/FormField";
import { format } from "date-fns";

export default function PricingRuleDialog({ 
  open, 
  onOpenChange, 
  profile, 
  providers = [], 
  onSubmit,
  language = "en" 
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    provider_id: "",
    is_global: false,
    includes_doctor_fee: true,
    includes_implantables: true,
    includes_drugs: true,
    includes_hospitalization: true,
    includes_consumables: true,
    includes_technology: true,
    includes_staff: true,
    doctor_fee_percentage: 100,
    implant_percentage: 100,
    drug_percentage: 100,
    hospitalization_percentage: 100,
    consumables_percentage: 100,
    technology_percentage: 100,
    staff_percentage: 100,
    discount_percentage: 0,
    is_active: true,
    valid_from: format(new Date(), "yyyy-MM-dd"),
    valid_to: ""
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const isRTL = language === "he";
  const isEdit = Boolean(profile);

  useEffect(() => {
    if (profile) {
      // Format dates if they exist
      const formattedProfile = { ...profile };
      if (formattedProfile.valid_from) {
        try {
          formattedProfile.valid_from = format(new Date(formattedProfile.valid_from), "yyyy-MM-dd");
        } catch (e) {
          console.error("Invalid date format for valid_from:", e);
        }
      }
      
      if (formattedProfile.valid_to) {
        try {
          formattedProfile.valid_to = format(new Date(formattedProfile.valid_to), "yyyy-MM-dd");
        } catch (e) {
          console.error("Invalid date format for valid_to:", e);
        }
      }
      
      setFormData(formattedProfile);
    } else {
      // Reset form for new profile
      setFormData({
        name: "",
        description: "",
        provider_id: "",
        is_global: false,
        includes_doctor_fee: true,
        includes_implantables: true,
        includes_drugs: true,
        includes_hospitalization: true,
        includes_consumables: true,
        includes_technology: true,
        includes_staff: true,
        doctor_fee_percentage: 100,
        implant_percentage: 100,
        drug_percentage: 100,
        hospitalization_percentage: 100,
        consumables_percentage: 100,
        technology_percentage: 100,
        staff_percentage: 100,
        discount_percentage: 0,
        is_active: true,
        valid_from: format(new Date(), "yyyy-MM-dd"),
        valid_to: ""
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = isRTL ? "נדרש למלא שם" : "Name is required";
    }
    
    if (!formData.is_global && !formData.provider_id) {
      newErrors.provider_id = isRTL ? "נדרש לבחור ספק" : "Provider is required";
    }
    
    // Validate percentage fields
    const percentageFields = [
      "doctor_fee_percentage", "implant_percentage", "drug_percentage",
      "hospitalization_percentage", "consumables_percentage", 
      "technology_percentage", "staff_percentage", "discount_percentage"
    ];
    
    percentageFields.forEach(field => {
      const value = parseFloat(formData[field]);
      if (!isNaN(value)) {
        if (value < 0 || value > 100) {
          newErrors[field] = isRTL ? "אחוז חייב להיות בין 0 ל-100" : "Percentage must be between 0 and 100";
        }
      } else if (formData[field] !== "") {
        newErrors[field] = isRTL ? "ערך לא תקין" : "Invalid value";
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Convert string percentage fields to numbers and ensure provider_id is null for global profiles
    const processedData = {
      ...formData,
      provider_id: formData.is_global ? null : formData.provider_id,
      doctor_fee_percentage: parseFloat(formData.doctor_fee_percentage),
      implant_percentage: parseFloat(formData.implant_percentage),
      drug_percentage: parseFloat(formData.drug_percentage),
      hospitalization_percentage: parseFloat(formData.hospitalization_percentage),
      consumables_percentage: parseFloat(formData.consumables_percentage),
      technology_percentage: parseFloat(formData.technology_percentage),
      staff_percentage: parseFloat(formData.staff_percentage),
      discount_percentage: parseFloat(formData.discount_percentage)
    };
    
    try {
      await onSubmit(processedData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting pricing rule:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit 
              ? (isRTL ? "עריכת כלל תמחור" : "Edit Pricing Rule") 
              : (isRTL ? "כלל תמחור חדש" : "New Pricing Rule")
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2">
            <FormField
              id="name"
              label="Profile Name"
              labelHe="שם פרופיל"
              type="text"
              value={formData.name}
              onChange={value => setFormData({...formData, name: value})}
              required
              language={language}
              error={errors.name}
            />
          </div>
          
          <div className="md:col-span-2">
            <FormField
              id="description"
              label="Description"
              labelHe="תיאור"
              type="textarea"
              value={formData.description}
              onChange={value => setFormData({...formData, description: value})}
              language={language}
            />
          </div>
          
          <FormField
            id="is_global"
            label="Global Profile"
            labelHe="פרופיל גלובלי"
            type="switch"
            value={formData.is_global}
            onChange={value => setFormData({...formData, is_global: value, provider_id: value ? "" : formData.provider_id})}
            language={language}
          />
          
          {!formData.is_global && (
            <FormField
              id="provider_id"
              label="Provider"
              labelHe="ספק"
              type="select"
              value={formData.provider_id}
              onChange={value => setFormData({...formData, provider_id: value})}
              options={providers.map(provider => ({
                value: provider.id,
                label: provider.provider_name_en,
                labelHe: provider.provider_name_he
              }))}
              placeholder={isRTL ? "בחר ספק" : "Select provider"}
              required
              language={language}
              error={errors.provider_id}
            />
          )}
          
          <FormField
            id="valid_from"
            label="Valid From"
            labelHe="בתוקף מתאריך"
            type="date"
            value={formData.valid_from}
            onChange={value => setFormData({...formData, valid_from: value})}
            required
            language={language}
            error={errors.valid_from}
          />
          
          <FormField
            id="valid_to"
            label="Valid To"
            labelHe="בתוקף עד תאריך"
            type="date"
            value={formData.valid_to}
            onChange={value => setFormData({...formData, valid_to: value})}
            language={language}
          />
          
          <FormField
            id="is_active"
            label="Active"
            labelHe="פעיל"
            type="switch"
            value={formData.is_active}
            onChange={value => setFormData({...formData, is_active: value})}
            language={language}
          />
          
          <div className="md:col-span-2">
            <FormField
              id="discount_percentage"
              label="Overall Discount Percentage"
              labelHe="אחוז הנחה כללי"
              type="number"
              value={formData.discount_percentage}
              onChange={value => setFormData({...formData, discount_percentage: value})}
              language={language}
              error={errors.discount_percentage}
            />
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-md font-medium mb-2 mt-2">
              {isRTL ? "כיסוי פריטים" : "Item Coverage"}
            </h3>
          </div>
          
          <FormField
            id="includes_doctor_fee"
            label="Include Doctor Fees"
            labelHe="כולל תשלום לרופא"
            type="switch"
            value={formData.includes_doctor_fee}
            onChange={value => setFormData({...formData, includes_doctor_fee: value})}
            language={language}
          />
          
          <FormField
            id="doctor_fee_percentage"
            label="Doctor Fee %"
            labelHe="אחוז תשלום לרופא"
            type="number"
            value={formData.doctor_fee_percentage}
            onChange={value => setFormData({...formData, doctor_fee_percentage: value})}
            disabled={!formData.includes_doctor_fee}
            language={language}
            error={errors.doctor_fee_percentage}
          />
          
          <FormField
            id="includes_implantables"
            label="Include Implants"
            labelHe="כולל שתלים"
            type="switch"
            value={formData.includes_implantables}
            onChange={value => setFormData({...formData, includes_implantables: value})}
            language={language}
          />
          
          <FormField
            id="implant_percentage"
            label="Implants %"
            labelHe="אחוז שתלים"
            type="number"
            value={formData.implant_percentage}
            onChange={value => setFormData({...formData, implant_percentage: value})}
            disabled={!formData.includes_implantables}
            language={language}
            error={errors.implant_percentage}
          />
          
          <FormField
            id="includes_drugs"
            label="Include Drugs"
            labelHe="כולל תרופות"
            type="switch"
            value={formData.includes_drugs}
            onChange={value => setFormData({...formData, includes_drugs: value})}
            language={language}
          />
          
          <FormField
            id="drug_percentage"
            label="Drugs %"
            labelHe="אחוז תרופות"
            type="number"
            value={formData.drug_percentage}
            onChange={value => setFormData({...formData, drug_percentage: value})}
            disabled={!formData.includes_drugs}
            language={language}
            error={errors.drug_percentage}
          />
          
          <FormField
            id="includes_hospitalization"
            label="Include Hospitalization"
            labelHe="כולל אשפוז"
            type="switch"
            value={formData.includes_hospitalization}
            onChange={value => setFormData({...formData, includes_hospitalization: value})}
            language={language}
          />
          
          <FormField
            id="hospitalization_percentage"
            label="Hospitalization %"
            labelHe="אחוז אשפוז"
            type="number"
            value={formData.hospitalization_percentage}
            onChange={value => setFormData({...formData, hospitalization_percentage: value})}
            disabled={!formData.includes_hospitalization}
            language={language}
            error={errors.hospitalization_percentage}
          />
          
          <FormField
            id="includes_consumables"
            label="Include Consumables"
            labelHe="כולל מתכלים"
            type="switch"
            value={formData.includes_consumables}
            onChange={value => setFormData({...formData, includes_consumables: value})}
            language={language}
          />
          
          <FormField
            id="consumables_percentage"
            label="Consumables %"
            labelHe="אחוז מתכלים"
            type="number"
            value={formData.consumables_percentage}
            onChange={value => setFormData({...formData, consumables_percentage: value})}
            disabled={!formData.includes_consumables}
            language={language}
            error={errors.consumables_percentage}
          />
          
          <FormField
            id="includes_technology"
            label="Include Technology"
            labelHe="כולל טכנולוגיה"
            type="switch"
            value={formData.includes_technology}
            onChange={value => setFormData({...formData, includes_technology: value})}
            language={language}
          />
          
          <FormField
            id="technology_percentage"
            label="Technology %"
            labelHe="אחוז טכנולוגיה"
            type="number"
            value={formData.technology_percentage}
            onChange={value => setFormData({...formData, technology_percentage: value})}
            disabled={!formData.includes_technology}
            language={language}
            error={errors.technology_percentage}
          />
          
          <FormField
            id="includes_staff"
            label="Include Staff"
            labelHe="כולל צוות"
            type="switch"
            value={formData.includes_staff}
            onChange={value => setFormData({...formData, includes_staff: value})}
            language={language}
          />
          
          <FormField
            id="staff_percentage"
            label="Staff %"
            labelHe="אחוז צוות"
            type="number"
            value={formData.staff_percentage}
            onChange={value => setFormData({...formData, staff_percentage: value})}
            disabled={!formData.includes_staff}
            language={language}
            error={errors.staff_percentage}
          />
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            {isRTL ? "ביטול" : "Cancel"}
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? (isRTL ? "שומר..." : "Saving...")
              : (isRTL ? "שמור" : "Save")
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
