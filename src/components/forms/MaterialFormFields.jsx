import React from 'react';
import { useTranslation } from '@/components/utils/i18n';
import FormField from '@/components/shared/FormField';
import SelectField from '@/components/common/SelectField';
import BilingualInput from '@/components/forms/BilingualInput';
import TagInput from '@/components/common/TagInput';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash } from 'lucide-react';

/**
 * Material form fields component
 * 
 * @param {Object} props Component props
 * @param {Object} props.formData Current form data
 * @param {Function} props.updateField Field update handler
 * @param {Object} props.formErrors Form validation errors
 * @param {boolean} props.isRTL Right-to-left direction flag
 * @param {Array} props.catalogOptions List of catalog path options
 */
export default function MaterialFormFields({
  formData = {},
  updateField,
  formErrors = {},
  isRTL = false,
  catalogOptions = []
}) {
  const { t } = useTranslation();

  // Add and remove manufacturer handlers
  const addManufacturer = () => {
    const updatedManufacturers = [...(formData.manufacturers || []), { name: '', country: '', manufacturer_code: '' }];
    updateField('manufacturers', updatedManufacturers);
  };

  const removeManufacturer = (index) => {
    const updatedManufacturers = [...(formData.manufacturers || [])];
    updatedManufacturers.splice(index, 1);
    updateField('manufacturers', updatedManufacturers);
  };

  const updateManufacturer = (index, field, value) => {
    const updatedManufacturers = [...(formData.manufacturers || [])];
    updatedManufacturers[index] = { ...updatedManufacturers[index], [field]: value };
    updateField('manufacturers', updatedManufacturers);
  };

  // Add and remove supplier handlers
  const addSupplier = () => {
    const updatedSuppliers = [...(formData.suppliers || []), { name: '', supplier_code: '', price_per_unit: 0, currency: 'ILS', notes: '' }];
    updateField('suppliers', updatedSuppliers);
  };

  const removeSupplier = (index) => {
    const updatedSuppliers = [...(formData.suppliers || [])];
    updatedSuppliers.splice(index, 1);
    updateField('suppliers', updatedSuppliers);
  };

  const updateSupplier = (index, field, value) => {
    const updatedSuppliers = [...(formData.suppliers || [])];
    updatedSuppliers[index] = { ...updatedSuppliers[index], [field]: value };
    updateField('suppliers', updatedSuppliers);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto p-1">
      <BilingualInput
        labelEn={t('materials.nameEn')}
        labelHe={t('materials.nameHe')}
        valueEn={formData.name_en || ''}
        valueHe={formData.name_he || ''}
        onChangeEn={(val) => updateField('name_en', val)}
        onChangeHe={(val) => updateField('name_he', val)}
        error={formErrors.name_en || formErrors.name_he}
        required
        isRTL={isRTL}
      />

      <BilingualInput
        labelEn={t('materials.descriptionEn')}
        labelHe={t('materials.descriptionHe')}
        valueEn={formData.description_en || ''}
        valueHe={formData.description_he || ''}
        onChangeEn={(val) => updateField('description_en', val)}
        onChangeHe={(val) => updateField('description_he', val)}
        error={formErrors.description_en || formErrors.description_he}
        isTextarea
        isRTL={isRTL}
        className="md:col-span-2"
      />

      <SelectField
        id="unit_of_measure"
        label={t('materials.unitOfMeasure')}
        value={formData.unit_of_measure || ''}
        onChange={(value) => updateField('unit_of_measure', value)}
        options={[
          { value: 'unit', label: t('units.item', 'Item') },
          { value: 'mg', label: t('units.mg', 'Milligram (mg)') },
          { value: 'ml', label: t('units.ml', 'Milliliter (ml)') },
          { value: 'g', label: t('units.g', 'Gram (g)') },
          { value: 'kg', label: t('units.kg', 'Kilogram (kg)') },
          { value: 'box', label: t('units.box', 'Box') },
          { value: 'pack', label: t('units.pack', 'Pack') }
        ]}
        error={formErrors.unit_of_measure}
        required
        isRTL={isRTL}
      />

      <FormField label={t('materials.basePrice')} error={formErrors.base_price}>
        <div className="flex">
          <Input
            id="base_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.base_price || 0}
            onChange={(e) => updateField('base_price', parseFloat(e.target.value))}
            className="flex-1"
          />
          <Input
            id="currency"
            value={formData.currency || 'ILS'}
            onChange={(e) => updateField('currency', e.target.value)}
            className="w-20 ml-2"
          />
        </div>
      </FormField>

      <FormField label={t('materials.catalogPath')} error={formErrors.catalog_path} className="md:col-span-2">
        <SelectField
          id="catalog_path"
          value={formData.catalog_path || ''}
          onChange={(value) => updateField('catalog_path', value)}
          options={catalogOptions}
          placeholder={t('materials.selectCatalogPath')}
          error={null} // Error already shown by parent FormField
          isRTL={isRTL}
        />
      </FormField>

      <div className="flex items-center space-x-3 space-y-0 md:col-span-2">
        <Switch
          id="has_variants"
          checked={formData.has_variants || false}
          onCheckedChange={(checked) => updateField('has_variants', checked)}
        />
        <Label htmlFor="has_variants">{t('materials.hasVariants', 'This material has multiple variants')}</Label>
      </div>

      <div className="flex items-center space-x-3 space-y-0 md:col-span-2">
        <Switch
          id="is_active"
          checked={formData.is_active !== false} // Default to true if undefined
          onCheckedChange={(checked) => updateField('is_active', checked)}
        />
        <Label htmlFor="is_active">{t('materials.isActive', 'Material is active')}</Label>
      </div>

      <FormField label={t('materials.tags')} error={formErrors.tags} className="md:col-span-2">
        <TagInput
          tags={formData.tags || []}
          onTagsChange={(newTags) => updateField('tags', newTags)}
          placeholder={t('materials.addTag')}
        />
      </FormField>

      {/* Manufacturers section */}
      <div className="md:col-span-2 border-t pt-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('materials.manufacturers', 'Manufacturers')}</h3>
          <Button type="button" variant="outline" size="sm" onClick={addManufacturer}>
            <Plus className="h-4 w-4 mr-1" />
            {t('common.add')}
          </Button>
        </div>

        {(formData.manufacturers || []).map((manufacturer, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 border p-3 rounded-md">
            <FormField label={t('materials.manufacturerName')}>
              <Input
                value={manufacturer.name || ''}
                onChange={(e) => updateManufacturer(index, 'name', e.target.value)}
              />
            </FormField>
            <FormField label={t('materials.manufacturerCountry')}>
              <Input
                value={manufacturer.country || ''}
                onChange={(e) => updateManufacturer(index, 'country', e.target.value)}
              />
            </FormField>
            <FormField label={t('materials.manufacturerCode')}>
              <div className="flex">
                <Input
                  value={manufacturer.manufacturer_code || ''}
                  onChange={(e) => updateManufacturer(index, 'manufacturer_code', e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeManufacturer(index)}
                  className="ml-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </FormField>
          </div>
        ))}
      </div>

      {/* Suppliers section */}
      <div className="md:col-span-2 border-t pt-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('materials.suppliers', 'Suppliers')}</h3>
          <Button type="button" variant="outline" size="sm" onClick={addSupplier}>
            <Plus className="h-4 w-4 mr-1" />
            {t('common.add')}
          </Button>
        </div>

        {(formData.suppliers || []).map((supplier, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 border p-3 rounded-md">
            <FormField label={t('materials.supplierName')}>
              <Input
                value={supplier.name || ''}
                onChange={(e) => updateSupplier(index, 'name', e.target.value)}
              />
            </FormField>
            <FormField label={t('materials.supplierCode')}>
              <Input
                value={supplier.supplier_code || ''}
                onChange={(e) => updateSupplier(index, 'supplier_code', e.target.value)}
              />
            </FormField>
            <FormField label={t('materials.pricePerUnit')}>
              <div className="flex">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={supplier.price_per_unit || 0}
                  onChange={(e) => updateSupplier(index, 'price_per_unit', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <Input
                  value={supplier.currency || 'ILS'}
                  onChange={(e) => updateSupplier(index, 'currency', e.target.value)}
                  className="w-20 ml-2"
                />
              </div>
            </FormField>
            <FormField label={t('materials.supplierNotes')}>
              <div className="flex">
                <Input
                  value={supplier.notes || ''}
                  onChange={(e) => updateSupplier(index, 'notes', e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeSupplier(index)}
                  className="ml-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </FormField>
          </div>
        ))}
      </div>
    </div>
  );
}