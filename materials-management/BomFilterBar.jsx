import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FilterX, Package, FileCode2, Layers, Check, DollarSign } from 'lucide-react';
import FilterBarCard from '@/components/common/FilterBarCard';
import FilterSelect from '@/components/common/FilterSelect';
import FilterTitle from '@/components/common/FilterTitle';

export default function BomFilterBar({
  filters,
  onFilterChange,
  onReset,
  insuranceCodeOptions = [],
  materialOptions = [],
  supplierOptions = [],
  manufacturerOptions = []
}) {
  const { t, isRTL } = useLanguageHook();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const reimbursableOptions = [
    { value: "all", label: t('common.all', { defaultValue: "All" }) },
    { value: "true", label: t('materialsManagement.reimbursable', { defaultValue: "Reimbursable" }) },
    { value: "false", label: t('materialsManagement.nonReimbursable', { defaultValue: "Non-Reimbursable" }) }
  ];

  const quantityTypeOptions = [
    { value: "all", label: t('common.all', { defaultValue: "All" }) },
    { value: "fixed", label: t('materialsManagement.quantityTypes.fixed', { defaultValue: "Fixed" }) },
    { value: "range", label: t('materialsManagement.quantityTypes.range', { defaultValue: "Range" }) },
    { value: "average", label: t('materialsManagement.quantityTypes.average', { defaultValue: "Average" }) }
  ];

  return (
    <FilterBarCard>
      <FilterTitle>{t('materialsManagement.bom.filtersTitle', { defaultValue: 'Bill of Materials Filters' })}</FilterTitle>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder={t('materialsManagement.bom.searchPlaceholder', { defaultValue: "Search BOM..." })}
            className={`${isRTL ? 'pr-10' : 'pl-10'} w-full`}
          />
        </div>
        <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
          <FilterX className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('common.resetFilters', { defaultValue: 'Reset Filters' })}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <FilterSelect
          id="insurance-code-filter"
          name="insurance_code_id"
          labelKey="materialsManagement.insuranceCodeLabel"
          label="Insurance Code"
          defaultValueLabel={t('materialsManagement.allInsuranceCodes', { defaultValue: 'All Insurance Codes' })}
          value={filters.insurance_code_id}
          onChange={handleInputChange}
          options={insuranceCodeOptions}
          icon={FileCode2}
        />
        
        <FilterSelect
          id="material-filter"
          name="material_id"
          labelKey="materialsManagement.materialLabel"
          label="Material"
          defaultValueLabel={t('materialsManagement.allMaterials', { defaultValue: 'All Materials' })}
          value={filters.material_id}
          onChange={handleInputChange}
          options={materialOptions}
          icon={Package}
        />
        
        <FilterSelect
          id="quantity-type-filter"
          name="quantity_type"
          labelKey="materialsManagement.quantityTypeLabel"
          label="Quantity Type"
          defaultValueLabel={t('materialsManagement.allQuantityTypes', { defaultValue: 'All Quantity Types' })}
          value={filters.quantity_type}
          onChange={handleInputChange}
          options={quantityTypeOptions}
          icon={Layers}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <FilterSelect
          id="reimbursable-filter"
          name="reimbursable_flag"
          labelKey="materialsManagement.reimbursableLabel"
          label="Reimbursable"
          defaultValueLabel={null}
          value={filters.reimbursable_flag}
          onChange={handleInputChange}
          options={reimbursableOptions}
          icon={Check}
        />
        
        <FilterSelect
          id="supplier-filter"
          name="default_supplier_id"
          labelKey="materialsManagement.defaultSupplierLabel"
          label="Default Supplier"
          defaultValueLabel={t('materialsManagement.allSuppliers', { defaultValue: 'All Suppliers' })}
          value={filters.default_supplier_id}
          onChange={handleInputChange}
          options={supplierOptions}
          icon={Package}
        />
        
        <FilterSelect
          id="manufacturer-filter" 
          name="default_manufacturer_id"
          labelKey="materialsManagement.defaultManufacturerLabel"
          label="Default Manufacturer"
          defaultValueLabel={t('materialsManagement.allManufacturers', { defaultValue: 'All Manufacturers' })}
          value={filters.default_manufacturer_id}
          onChange={handleInputChange}
          options={manufacturerOptions}
          icon={Package}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium flex items-center mb-1">
            <DollarSign className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('materialsManagement.maxCoveredPriceRange', { defaultValue: 'Max Covered Price Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              name="minCoveredPrice"
              value={filters.minCoveredPrice || ''}
              onChange={handleInputChange}
              placeholder={t('common.min', { defaultValue: 'Min' })}
              className="w-full"
            />
            <Input
              type="number"
              name="maxCoveredPrice"
              value={filters.maxCoveredPrice || ''}
              onChange={handleInputChange}
              placeholder={t('common.max', { defaultValue: 'Max' })}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-medium flex items-center mb-1">
            <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            {t('materialsManagement.quantityRange', { defaultValue: 'Quantity Range' })}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              name="minQuantity"
              value={filters.minQuantity || ''}
              onChange={handleInputChange}
              placeholder={t('common.min', { defaultValue: 'Min' })}
              className="w-full"
            />
            <Input
              type="number"
              name="maxQuantity"
              value={filters.maxQuantity || ''}
              onChange={handleInputChange}
              placeholder={t('common.max', { defaultValue: 'Max' })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </FilterBarCard>
  );
}