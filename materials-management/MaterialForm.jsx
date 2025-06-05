import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import BaseFormDialog from '@/components/shared/forms/BaseFormDialog';
import FormField from '@/components/shared/forms/FormField';
import { validateEntityData, getEntitySchema } from '@/components/utils/sdk';
import { Material } from '@/api/entities';
import { UNIT_OF_MEASURE_OPTIONS, createOptions } from '@/components/utils/formOptions';

export default function MaterialForm({ isOpen, onClose, material = null, onSuccess }) {
  const { t, language } = useLanguageHook();
  const [formData, setFormData] = useState({
    name_en: '',
    name_he: '',
    description_en: '',
    description_he: '',
    has_variants: false,
    unit_of_measure: 'unit',
    tags: [],
    catalog_path: '',
    base_price: '',
    currency: 'ILS',
    manufacturers: [],
    suppliers: [],
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    const loadSchema = async () => {
      const entitySchema = await getEntitySchema(Material);
      setSchema(entitySchema);
    };
    loadSchema();
  }, []);

  useEffect(() => {
    if (material) {
      setFormData({
        name_en: material.name_en || '',
        name_he: material.name_he || '',
        description_en: material.description_en || '',
        description_he: material.description_he || '',
        has_variants: material.has_variants || false,
        unit_of_measure: material.unit_of_measure || 'unit',
        tags: material.tags || [],
        catalog_path: material.catalog_path || '',
        base_price: material.base_price || '',
        currency: material.currency || 'ILS',
        manufacturers: material.manufacturers || [],
        suppliers: material.suppliers || [],
        is_active: material.is_active !== undefined ? material.is_active : true
      });
    } else {
      setFormData({
        name_en: '',
        name_he: '',
        description_en: '',
        description_he: '',
        has_variants: false,
        unit_of_measure: 'unit',
        tags: [],
        catalog_path: '',
        base_price: '',
        currency: 'ILS',
        manufacturers: [],
        suppliers: [],
        is_active: true
      });
    }
    setErrors({});
  }, [material, isOpen]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!schema) {
      console.error('Schema not loaded');
      return;
    }

    const validation = validateEntityData(schema, formData);
    if (!validation.isValid) {
      const newErrors = {};
      validation.errors.forEach(error => {
        const field = error.split(' ')[0];
        newErrors[field] = error;
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...formData };
      
      // Convert base_price to number if provided
      if (dataToSubmit.base_price) {
        dataToSubmit.base_price = parseFloat(dataToSubmit.base_price);
      }

      if (material) {
        await Material.update(material.id, dataToSubmit);
      } else {
        await Material.create(dataToSubmit);
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving material:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const unitOptions = createOptions(UNIT_OF_MEASURE_OPTIONS, t);

  return (
    <BaseFormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={material 
        ? t('materials.editMaterial', { defaultValue: 'Edit Material' })
        : t('materials.addMaterial', { defaultValue: 'Add Material' })
      }
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={t('materials.fields.nameEn', { defaultValue: 'Name (English)' })}
          name="name_en"
          value={formData.name_en}
          onChange={(value) => handleFieldChange('name_en', value)}
          error={errors.name_en}
          required
        />
        
        <FormField
          label={t('materials.fields.nameHe', { defaultValue: 'Name (Hebrew)' })}
          name="name_he"
          value={formData.name_he}
          onChange={(value) => handleFieldChange('name_he', value)}
          error={errors.name_he}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          type="textarea"
          label={t('materials.fields.descriptionEn', { defaultValue: 'Description (English)' })}
          name="description_en"
          value={formData.description_en}
          onChange={(value) => handleFieldChange('description_en', value)}
          error={errors.description_en}
          rows={3}
        />
        
        <FormField
          type="textarea"
          label={t('materials.fields.descriptionHe', { defaultValue: 'Description (Hebrew)' })}
          name="description_he"
          value={formData.description_he}
          onChange={(value) => handleFieldChange('description_he', value)}
          error={errors.description_he}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          type="select"
          label={t('materials.fields.unitOfMeasure', { defaultValue: 'Unit of Measure' })}
          name="unit_of_measure"
          value={formData.unit_of_measure}
          onChange={(value) => handleFieldChange('unit_of_measure', value)}
          options={unitOptions}
          error={errors.unit_of_measure}
          required
        />
        
        <FormField
          type="number"
          label={t('materials.fields.basePrice', { defaultValue: 'Base Price' })}
          name="base_price"
          value={formData.base_price}
          onChange={(value) => handleFieldChange('base_price', value)}
          error={errors.base_price}
          placeholder="0.00"
          step="0.01"
        />
        
        <FormField
          label={t('materials.fields.currency', { defaultValue: 'Currency' })}
          name="currency"
          value={formData.currency}
          onChange={(value) => handleFieldChange('currency', value)}
          error={errors.currency}
          placeholder="ILS"
        />
      </div>

      <FormField
        label={t('materials.fields.catalogPath', { defaultValue: 'Catalog Path' })}
        name="catalog_path"
        value={formData.catalog_path}
        onChange={(value) => handleFieldChange('catalog_path', value)}
        error={errors.catalog_path}
        placeholder="e.g., Implants/Orthopedic/Screws"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          type="switch"
          label={t('materials.fields.hasVariants', { defaultValue: 'Has Variants' })}
          name="has_variants"
          value={formData.has_variants}
          onChange={(value) => handleFieldChange('has_variants', value)}
          error={errors.has_variants}
        />
        
        <FormField
          type="switch"
          label={t('materials.fields.isActive', { defaultValue: 'Active' })}
          name="is_active"
          value={formData.is_active}
          onChange={(value) => handleFieldChange('is_active', value)}
          error={errors.is_active}
        />
      </div>

      {errors.submit && (
        <div className="text-red-600 text-sm mt-2">
          {errors.submit}
        </div>
      )}
    </BaseFormDialog>
  );
}