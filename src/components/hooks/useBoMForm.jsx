import { useState, useCallback, useEffect } from 'react';
import { BillOfMaterial } from '../.@/api/entities/BillOfMaterial';
import { useToast } from '../ui/use-toast';
import { useTranslation } from '../utils/i18n';
import { messages } from '../utils/messages';

// Helper to safely get properties from initialDataProp
const getSafeProp = (data, key, defaultValue) => {
  if (data && typeof data === 'object' && data !== null && data[key] !== undefined) {
    return data[key];
  }
  return defaultValue;
};

const getInitialFormData = (initialDataProp) => {
  return {
    insurance_code_id: getSafeProp(initialDataProp, 'insurance_code_id', ''),
    material_id: getSafeProp(initialDataProp, 'material_id', ''),
    variant_id: getSafeProp(initialDataProp, 'variant_id', ''),
    variant_label: getSafeProp(initialDataProp, 'variant_label', ''),
    variant_code: getSafeProp(initialDataProp, 'variant_code', ''),
    quantity_type: getSafeProp(initialDataProp, 'quantity_type', 'fixed'),
    quantity_min: getSafeProp(initialDataProp, 'quantity_min', 0),
    quantity_max: getSafeProp(initialDataProp, 'quantity_max', 0),
    quantity_avg: getSafeProp(initialDataProp, 'quantity_avg', 0),
    quantity_fixed: getSafeProp(initialDataProp, 'quantity_fixed', 1), // Default to 1 if undefined
    quantity_unit: getSafeProp(initialDataProp, 'quantity_unit', 'item'),
    usage_type: getSafeProp(initialDataProp, 'usage_type', 'required'),
    usage_probability: getSafeProp(initialDataProp, 'usage_probability', 100), // Default to 100 if undefined
    reimbursable_flag: getSafeProp(initialDataProp, 'reimbursable_flag', true), // Default to true if undefined
    price_source_type: getSafeProp(initialDataProp, 'price_source_type', 'default'),
    price_manual: getSafeProp(initialDataProp, 'price_manual', null),
    price_min: getSafeProp(initialDataProp, 'price_min', null),
    price_max: getSafeProp(initialDataProp, 'price_max', null),
    default_supplier_id: getSafeProp(initialDataProp, 'default_supplier_id', ''),
    default_manufacturer_id: getSafeProp(initialDataProp, 'default_manufacturer_id', ''),
    max_covered_price: getSafeProp(initialDataProp, 'max_covered_price', null),
    currency: getSafeProp(initialDataProp, 'currency', 'ILS'),
    notes: getSafeProp(initialDataProp, 'notes', ''),
    id: getSafeProp(initialDataProp, 'id', null),
  };
};

export function useBoMForm(initialDataProp, onSaveSuccessCallback, availableInsuranceCodes = [], availableMaterials = []) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [formData, setFormData] = useState(() => getInitialFormData(initialDataProp));
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [field]: null }));
        }
    }, [formErrors]);

    const validateForm = useCallback(() => {
        const errors = {};
        if (!formData.insurance_code_id) errors.insurance_code_id = t('validation.required', { field: t('boms.insuranceCode') });
        if (!formData.material_id) errors.material_id = t('validation.required', { field: t('boms.material') });
        
        if (formData.quantity_type === 'range') {
            const qtyMin = parseFloat(formData.quantity_min);
            const qtyMax = parseFloat(formData.quantity_max);
            if (isNaN(qtyMin) || qtyMin < 0) {
                errors.quantity_min = t('validation.positiveNumber', { field: t('boms.quantityMin') });
            }
            if (isNaN(qtyMax) || qtyMax < 0) {
                errors.quantity_max = t('validation.positiveNumber', { field: t('boms.quantityMax') });
            }
            if (!isNaN(qtyMin) && !isNaN(qtyMax) && qtyMin > qtyMax) {
                errors.quantity_range = t('validation.minMaxOrder', { minField: t('boms.quantityMin'), maxField: t('boms.quantityMax') });
            }
        } else if (formData.quantity_type === 'fixed') {
            const qtyFixed = parseFloat(formData.quantity_fixed);
            if (isNaN(qtyFixed) || qtyFixed <= 0) {
                errors.quantity_fixed = t('validation.greaterThanZero', { field: t('boms.quantityFixed') });
            }
        } else if (formData.quantity_type === 'average') {
            const qtyAvg = parseFloat(formData.quantity_avg);
            if (isNaN(qtyAvg) || qtyAvg <= 0) {
                errors.quantity_avg = t('validation.greaterThanZero', { field: t('boms.quantityAvg') });
            }
        }

        const usageProb = parseFloat(formData.usage_probability);
        if (isNaN(usageProb) || usageProb < 0 || usageProb > 100) {
            errors.usage_probability = t('validation.range', { field: t('boms.usageProbability'), min: 0, max: 100 });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, t]);

    const handleSubmit = useCallback(async (event) => {
        if (event) event.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            let savedItem;
            // Prepare data for saving, removing null/undefined values for optional fields if backend expects them to be absent
            const dataToSave = Object.entries(formData).reduce((acc, [key, value]) => {
                if (key !== 'id' && value !== undefined) { // Keep nulls if they are meaningful, or filter them too: value !== null && value !== undefined
                    acc[key] = value;
                }
                return acc;
            }, {});


            if (formData.id) { // Editing existing item
                savedItem = await BillOfMaterial.update(formData.id, dataToSave);
                toast({ title: messages.success.update(t('boms.entityNameSingular')) });
            } else { // Creating new item
                savedItem = await BillOfMaterial.create(dataToSave);
                toast({ title: messages.success.create(t('boms.entityNameSingular')) });
            }
            
            if (onSaveSuccessCallback) {
                onSaveSuccessCallback(savedItem);
            }
        } catch (err) {
            console.error("Error saving BoM:", err);
            toast({ 
                title: messages.error.default(t('common.errorOccurred')),
                description: err.message || t('common.unknownError'), 
                variant: 'destructive' 
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, toast, t, onSaveSuccessCallback]);
    
    const resetForm = useCallback((newInitialData) => {
        setFormData(getInitialFormData(newInitialData));
        setFormErrors({});
    }, []);
    
    useEffect(() => {
        resetForm(initialDataProp);
    }, [initialDataProp, resetForm]); // resetForm is now stable due to useCallback

    return {
        formData,
        formErrors,
        isSubmitting,
        updateField,
        handleSubmit,
        resetForm,
        setFormData, // Keep if needed for direct manipulation
        availableInsuranceCodes,
        availableMaterials
    };
}