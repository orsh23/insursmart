
import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Using the simplified Select and SelectItem
import { Select, SelectItem } from "@/components/ui/select"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
// Switch is likely fine, but ensure it's a simple component if issues persist
// import { Switch } from '@/components/ui/switch'; 
import { Tariff } from '@/api/entities';
import { DollarSign, FileText, Settings, AlertTriangle, List, AlertCircle } from 'lucide-react';

export default function TariffDialog({ 
  isOpen, 
  onClose, 
  currentTariff, 
  onSave, 
  contracts = [], // Added default empty array
  insuranceCodes = [], // Added default empty array
  doctors = [], // Added default empty array
  dialogError 
}) {
  const { t, isRTL } = useLanguageHook();
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null); // Internal dialog error

  const defaultComposition = [
    {
      component_type: "Base",
      pricing_model: "Fixed",
      recipient_type: "Provider",
      amount: 0,
      copay_applies: true,
      finalized_at: "RFC"
    }
  ];

  const defaultData = {
    contract_id: "",
    insurance_code: "",
    doctor_id: "", // Ensure it's an empty string for controlled component if no selection
    base_price: 0,
    currency: "ILS",
    finalization_type: "RFC",
    composition: defaultComposition, // Store as object
    validation_rules: [] // Store as object
  };

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setError(null); // Clear internal dialog error
      
      if (currentTariff) {
        // When editing, properly format the data
        const formattedData = {
          contract_id: currentTariff.contract_id || "",
          insurance_code: currentTariff.insurance_code || "",
          doctor_id: currentTariff.doctor_id || "", // Default to empty string
          base_price: currentTariff.base_price || 0,
          currency: currentTariff.currency || "ILS",
          finalization_type: currentTariff.finalization_type || "RFC",
          // Store actual JSON objects for composition and validation_rules
          // The string versions are for the Textarea display only
          composition: currentTariff.composition || defaultComposition,
          validation_rules: currentTariff.validation_rules || [],
          // For Textarea display
          composition_string: JSON.stringify(currentTariff.composition || defaultComposition, null, 2),
          validation_rules_string: JSON.stringify(currentTariff.validation_rules || [], null, 2)
        };
        setFormData(formattedData);
      } else {
        // When creating new, use default data
        setFormData({
          ...defaultData,
          composition_string: JSON.stringify(defaultComposition, null, 2),
          validation_rules_string: "[]"
        });
      }
      setActiveTab("basic");
    }
  }, [isOpen, currentTariff]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value // Allow empty string for number input before parsing
    }));
  };

  // For simplified Select, event usually comes from e.target.value
  const handleSimpleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJsonTextareaChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [`${field}_string`]: value, // Update the string version for display
      [`${field}_error`]: null // Clear previous parse error on manual edit
    }));
    // Attempt to parse and update the object version, store error if parsing fails
    try {
      const parsed = JSON.parse(value);
      setFormData(prev => ({
        ...prev,
        [field]: parsed, 
      }));
    } catch (err) {
      setFormData(prev => ({
        ...prev,
        [`${field}_error`]: err.message 
      }));
    }
  };


  const validateForm = () => {
    if (!formData.contract_id) {
      setError(t('errors.contractRequired', {defaultValue: "Contract is required."}));
      setActiveTab("basic");
      return false;
    }
    if (!formData.insurance_code) {
      setError(t('errors.insuranceCodeRequired', {defaultValue: "Insurance Code is required."}));
      setActiveTab("basic");
      return false;
    }
    if (formData.base_price === '' || isNaN(parseFloat(formData.base_price))) {
       setError(t('errors.basePriceRequired', {defaultValue: "Base Price is required and must be a number."}));
       setActiveTab("basic");
       return false;
    }
    // Check for parse errors from JSON textareas
    if (formData.composition_error) {
      setError(t('errors.invalidComposition', {defaultValue: "Composition JSON is invalid."}) + ` ${formData.composition_error}`);
      setActiveTab("composition");
      return false;
    }
    if (formData.validation_rules_error) {
      setError(t('errors.invalidValidationRules', {defaultValue: "Validation Rules JSON is invalid."}) + ` ${formData.validation_rules_error}`);
      setActiveTab("validation");
      return false;
    }
    // Ensure JSON textareas can be parsed before submitting
    try {
        JSON.parse(formData.composition_string);
    } catch (e) {
        setError(t('errors.invalidComposition', {defaultValue: "Composition JSON is invalid."}) + ` Please correct the format.`);
        setActiveTab("composition");
        return false;
    }
    try {
        JSON.parse(formData.validation_rules_string);
    } catch (e) {
        setError(t('errors.invalidValidationRules', {defaultValue: "Validation Rules JSON is invalid."}) + ` Please correct the format.`);
        setActiveTab("validation");
        return false;
    }

    setError(null); // Clear any previous validation errors
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null); // Clear dialog-specific error

    try {
      const payload = {
        contract_id: formData.contract_id,
        insurance_code: formData.insurance_code,
        doctor_id: formData.doctor_id || null, // Send null if empty string
        base_price: parseFloat(formData.base_price), // Ensure it's a number
        currency: formData.currency,
        finalization_type: formData.finalization_type,
        composition: JSON.parse(formData.composition_string), // Parse from the textarea string
        validation_rules: JSON.parse(formData.validation_rules_string) // Parse from the textarea string
      };
      
      // onSave is passed from TariffsTab, it handles API call and setting its own error state
      await onSave(payload, currentTariff?.id); 
      onClose(); // Close the dialog on successful save
    } catch (err) {
      // This catch block is mostly for unexpected errors during payload prep or if onSave itself throws
      // Errors from API inside onSave should be handled by TariffsTab and passed via dialogError prop.
      console.error("Error preparing or submitting tariff data:", err);
      setError(err.message || t('errors.saveFailed', { item: t('tariffManagement.titleSingular', {defaultValue: "Tariff"}) }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabItems = [
    { id: "basic", label: t('tariffManagement.tabs.basic', {defaultValue: "Basic Info"}), icon: FileText },
    { id: "composition", label: t('tariffManagement.tabs.composition', {defaultValue: "Composition"}), icon: List },
    { id: "validation", label: t('tariffManagement.tabs.validation', {defaultValue: "Validation Rules"}), icon: Settings } // Changed icon
  ];
  
  // Display error from parent (TariffsTab) or internal dialog error
  const currentError = dialogError || error;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="pb-4 border-b">
          <DialogTitle>
            {currentTariff ? t('tariffs.editTariffTitle', { defaultValue: 'Edit Tariff' }) : t('tariffs.addTariffTitle', { defaultValue: 'Add New Tariff' })}
          </DialogTitle>
          <DialogDescription>
            {t('tariffs.dialogDescription', { defaultValue: 'Manage tariff details, composition, and validation rules.'})}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-2 shrink-0">
            <TabsTrigger value="basic">{t('tariffs.tabBasic', { defaultValue: 'Basic Info' })}</TabsTrigger>
            <TabsTrigger value="composition">{t('tariffs.tabComposition', { defaultValue: 'Composition' })}</TabsTrigger>
            <TabsTrigger value="validation">{t('tariffs.tabValidation', { defaultValue: 'Validation Rules' })}</TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto p-1 -m-1">
            <TabsContent value="basic" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_id">{t('tariffs.contract', { defaultValue: 'Contract' })} <span className="text-red-500">*</span></Label>
                  <Select
                    name="contract_id"
                    value={formData.contract_id || ""}
                    onChange={(e) => handleSimpleSelectChange('contract_id', e.target.value)}
                    id="contract_id"
                  >
                    <SelectItem value={null}>{t('tariffs.selectContract', { defaultValue: 'Select Contract' })}</SelectItem>
                    {contracts.map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>{contract.contract_number} - {contract.name_en}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="insurance_code">{t('tariffs.insuranceCode', { defaultValue: 'Insurance Code' })} <span className="text-red-500">*</span></Label>
                  <Select
                    name="insurance_code"
                    value={formData.insurance_code || ""}
                    onChange={(e) => handleSimpleSelectChange('insurance_code', e.target.value)}
                    id="insurance_code"
                  >
                    <SelectItem value={null}>{t('tariffs.selectInsuranceCode', { defaultValue: 'Select Insurance Code' })}</SelectItem>
                    {insuranceCodes.map(code => (
                      <SelectItem key={code.id} value={code.id}>{code.code} - {code.name_en}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctor_id">{t('tariffs.doctorOptional', { defaultValue: 'Doctor (Optional Override)' })}</Label>
                  <Select
                    name="doctor_id"
                    value={formData.doctor_id || ""}
                    onChange={(e) => handleSimpleSelectChange('doctor_id', e.target.value)}
                    id="doctor_id"
                  >
                    <SelectItem value={null}>{t('tariffs.selectDoctorOptional', { defaultValue: 'No Doctor Specific Override' })}</SelectItem>
                    {doctors.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.first_name_en} {doc.last_name_en} ({doc.license_number})</SelectItem>
                    ))}
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="base_price">{t('tariffs.basePrice', { defaultValue: 'Base Price' })} <span className="text-red-500">*</span></Label>
                  <Input 
                    id="base_price" 
                    name="base_price" 
                    type="number" 
                    value={formData.base_price || ""} 
                    onChange={handleInputChange} 
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">{t('tariffs.currency', { defaultValue: 'Currency' })}</Label>
                  <Select
                    name="currency"
                    value={formData.currency || "ILS"}
                    onChange={(e) => handleSimpleSelectChange('currency', e.target.value)}
                    id="currency"
                  >
                    <SelectItem value="ILS">ILS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="finalization_type">{t('tariffs.finalizationType', { defaultValue: 'Finalization Type' })}</Label>
                   <Select
                    name="finalization_type"
                    value={formData.finalization_type || "RFC"}
                    onChange={(e) => handleSimpleSelectChange('finalization_type', e.target.value)}
                    id="finalization_type"
                  >
                    <SelectItem value="RFC">RFC (Request for Commitment)</SelectItem>
                    <SelectItem value="Claim">Claim</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="composition" className="p-4 space-y-4">
              <div>
                <Label htmlFor="composition_string">{t('tariffs.compositionJson', { defaultValue: 'Composition (JSON Array)'})}</Label>
                <Textarea
                  id="composition_string"
                  name="composition_string"
                  value={formData.composition_string || "[]"}
                  onChange={(e) => handleJsonTextareaChange('composition', e.target.value)}
                  rows={10}
                  placeholder={t('tariffs.compositionPlaceholder', {defaultValue: '[{\n  "component_type": "Base",\n  "pricing_model": "Fixed",\n  "recipient_type": "Provider",\n  "amount": 100\n}]'})}
                />
                {formData.composition_error && <p className="text-sm text-red-500 mt-1">{formData.composition_error}</p>}
                 <p className="text-xs text-gray-500 mt-1">
                   {t('tariffs.compositionHelp', { defaultValue: 'Define how the price is built. Component types: Base, DoctorFee, Implantables, Hospitalization, Drugs, Other. Pricing models: Fixed, BoMActual, PerDay, Capped, PerUnit.'})}
                 </p>
              </div>
            </TabsContent>

            <TabsContent value="validation" className="p-4 space-y-4">
              <div>
                <Label htmlFor="validation_rules_string">{t('tariffs.validationRulesJson', { defaultValue: 'Validation Rules (JSON Array)'})}</Label>
                <Textarea
                  id="validation_rules_string"
                  name="validation_rules_string"
                  value={formData.validation_rules_string || "[]"}
                  onChange={(e) => handleJsonTextareaChange('validation_rules', e.target.value)}
                  rows={10}
                  placeholder={t('tariffs.validationPlaceholder', {defaultValue: '[{\n  "rule_type": "age_limit",\n  "rule_value": "18-65"\n}]'})}
                />
                {formData.validation_rules_error && <p className="text-sm text-red-500 mt-1">{formData.validation_rules_error}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {t('tariffs.validationHelp', { defaultValue: 'Define validation rules. Rule types: age_limit, gender_specific, requires_approval.'})}
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Error display */}
        {(error || dialogError) && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error || dialogError}
          </div>
        )}
        
        <DialogFooter className="pt-4 border-t mt-auto shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || formData.composition_error || formData.validation_rules_error}>
            {isSubmitting ? t('common.saving', { defaultValue: 'Saving...' }) : (currentTariff ? t('common.update', { defaultValue: 'Update' }) : t('common.save', { defaultValue: 'Save' }))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
