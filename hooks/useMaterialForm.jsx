import { useState, useEffect, useCallback } from 'react';
import { Material } from '@/api/entities';
import { Manufacturer } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook'; // Corrected import

export function useMaterialForm({ initialData, onSubmit, onCloseDialog }) {
  const { t } = useLanguageHook(); // Using the project's standard language hook

  const defaultFormData = {
    name_en: '',
    name_he: '',
    description_en: '',
    description_he: '',
    has_variants: false,
    unit_of_measure: 'unit',
    tags: [], // Stored as array
    catalog_path: '',
    base_price: '', // Keep as string for input, convert on submit
    currency: 'ILS',
    manufacturers: [], // [{ name: '', country: '', manufacturer_code: '' }]
    suppliers: [], // [{ name: '', supplier_code: '', price_per_unit: '', currency: 'ILS', notes: '' }]
    is_active: true,
  };

  const [formData, setFormData] = useState(initialData ? 
    {
      ...defaultFormData,
      ...initialData,
      base_price: initialData.base_price !== undefined && initialData.base_price !== null ? String(initialData.base_price) : '',
      tags: Array.isArray(initialData.tags) ? initialData.tags : [],
      manufacturers: Array.isArray(initialData.manufacturers) ? initialData.manufacturers.map(m => ({ ...m })) : [],
      suppliers: Array.isArray(initialData.suppliers) ? initialData.suppliers.map(s => ({ ...s, price_per_unit: s.price_per_unit !== undefined && s.price_per_unit !== null ? String(s.price_per_unit) : '' })) : [],
    } 
    : defaultFormData
  );
  const [allManufacturers, setAllManufacturers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [manufs, supps] = await Promise.all([
          Manufacturer.list(),
          Supplier.list(),
        ]);
        setAllManufacturers(manufs || []);
        setAllSuppliers(supps || []);
      } catch (error) {
        console.error("Error fetching manufacturers/suppliers for form:", error);
        // Handle error, e.g., set an error state for the form
      }
    };
    fetchRelatedData();
  }, []);


  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        base_price: initialData.base_price !== undefined && initialData.base_price !== null ? String(initialData.base_price) : '',
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        manufacturers: Array.isArray(initialData.manufacturers) ? initialData.manufacturers.map(m => ({ ...m })) : [],
        suppliers: Array.isArray(initialData.suppliers) ? initialData.suppliers.map(s => ({ ...s, price_per_unit: s.price_per_unit !== undefined && s.price_per_unit !== null ? String(s.price_per_unit) : ''})) : [],
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.name_en.trim()) newErrors.name_en = t('validation.required', { field: t('materials.nameEn') });
    if (!formData.name_he.trim()) newErrors.name_he = t('validation.required', { field: t('materials.nameHe') });
    if (!formData.unit_of_measure) newErrors.unit_of_measure = t('validation.required', { field: t('materials.unit') });
    
    if (formData.base_price && isNaN(parseFloat(formData.base_price))) {
      newErrors.base_price = t('validation.number', { field: t('materials.basePrice') });
    } else if (formData.base_price && parseFloat(formData.base_price) < 0) {
      newErrors.base_price = t('validation.positiveNumber', { field: t('materials.basePrice') });
    }

    formData.suppliers.forEach((supplier, index) => {
      if (supplier.price_per_unit && isNaN(parseFloat(supplier.price_per_unit))) {
        if (!newErrors.suppliers) newErrors.suppliers = [];
        newErrors.suppliers[index] = { ...(newErrors.suppliers[index] || {}), price_per_unit: t('validation.number', { field: t('materials.pricePerUnit') }) };
      } else if (supplier.price_per_unit && parseFloat(supplier.price_per_unit) < 0) {
        if (!newErrors.suppliers) newErrors.suppliers = [];
        newErrors.suppliers[index] = { ...(newErrors.suppliers[index] || {}), price_per_unit: t('validation.positiveNumber', { field: t('materials.pricePerUnit') }) };
      }
      if (!supplier.name) { // Assuming name is a required field for a supplier entry
         if (!newErrors.suppliers) newErrors.suppliers = [];
        newErrors.suppliers[index] = { ...(newErrors.suppliers[index] || {}), name: t('validation.required', { field: t('materials.supplierName') }) };
      }
    });
     formData.manufacturers.forEach((manufacturer, index) => {
      if (!manufacturer.name) { // Assuming name is a required field for a manufacturer entry
        if (!newErrors.manufacturers) newErrors.manufacturers = [];
        newErrors.manufacturers[index] = { ...(newErrors.manufacturers[index] || {}), name: t('validation.required', { field: t('materials.manufacturerName') }) };
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    if (!validate()) {
      console.log("Validation failed", errors);
      return;
    }

    setIsSubmitting(true);
    const dataToSubmit = {
      ...formData,
      base_price: formData.base_price ? parseFloat(formData.base_price) : null,
      manufacturers: formData.manufacturers.filter(m => m.name), // Only submit manufacturers with names
      suppliers: formData.suppliers.filter(s => s.name).map(s => ({
        ...s,
        price_per_unit: s.price_per_unit ? parseFloat(s.price_per_unit) : null,
      })),
    };

    try {
      if (initialData?.id) {
        await Material.update(initialData.id, dataToSubmit);
      } else {
        await Material.create(dataToSubmit);
      }
      if (onSubmit) {
        await onSubmit(dataToSubmit); // Notify parent about successful submission
      }
      if (onCloseDialog) onCloseDialog(); // Close dialog after successful submission
    } catch (error) {
      console.error('Error saving material:', error);
      const errorMessage = error.message || t('errors.saveFailed', { item: t('materials.titleSingle') });
      setErrors({ form: errorMessage });
      // Do not close dialog on error, let user see the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      let current = { ...prev };
      let obj = current;
  
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextKeyIsArray = /\[\d+\]/.test(keys[i+1]);
        const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
  
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const index = parseInt(arrayMatch[2]);
          if (!obj[arrayName] || !Array.isArray(obj[arrayName])) {
            obj[arrayName] = []; // Initialize if not an array
          }
          // Ensure the array is long enough
          while (obj[arrayName].length <= index) {
            obj[arrayName].push(nextKeyIsArray ? [] : {}); 
          }
          obj[arrayName][index] = obj[arrayName][index] ? { ...obj[arrayName][index] } : (nextKeyIsArray ? [] : {});
          obj = obj[arrayName][index];
        } else {
          obj[key] = obj[key] ? { ...obj[key] } : (nextKeyIsArray ? [] : {});
          obj = obj[key];
        }
      }
      
      const finalKey = keys[keys.length - 1];
      const finalKeyArrayMatch = finalKey.match(/(\w+)\[(\d+)\]/);
      if (finalKeyArrayMatch) {
          const arrayName = finalKeyArrayMatch[1];
          const index = parseInt(finalKeyArrayMatch[2]);
           if (!obj[arrayName] || !Array.isArray(obj[arrayName])) {
            obj[arrayName] = [];
          }
          obj[arrayName][index] = value;
      } else {
        obj[finalKey] = value;
      }
      return current;
    });
    // Clear specific error when field is updated
    setErrors(prevErrors => {
        const newErrors = {...prevErrors};
        delete newErrors[path]; // Simple path delete
        // For nested paths, you might need more complex logic if errors are stored nested
        if (path.includes('.')) {
            const keys = path.split('.');
            let errorObj = newErrors;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!errorObj[keys[i]]) break;
                errorObj = errorObj[keys[i]];
            }
            if (errorObj && errorObj[keys[keys.length -1]]) {
                delete errorObj[keys[keys.length-1]];
            }
        }
        delete newErrors.form; // Clear form-wide error on any field change
        return newErrors;
    });
  };

  const addManufacturer = () => {
    updateField('manufacturers', [...formData.manufacturers, { name: '', country: '', manufacturer_code: '' }]);
  };

  const removeManufacturer = (index) => {
    updateField('manufacturers', formData.manufacturers.filter((_, i) => i !== index));
  };

  const addSupplier = () => {
    updateField('suppliers', [...formData.suppliers, { name: '', supplier_code: '', price_per_unit: '', currency: 'ILS', notes: '' }]);
  };

  const removeSupplier = (index) => {
    updateField('suppliers', formData.suppliers.filter((_, i) => i !== index));
  };
  
  const handleTagChange = (newTags) => {
    updateField('tags', newTags);
  };


  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    handleTagChange,
    addManufacturer,
    removeManufacturer,
    addSupplier,
    removeSupplier,
    allManufacturers,
    allSuppliers
  };
}