import React, { useState, useEffect } from 'react';
    import { DiagnosisProcedureMapping } from '@/api/entities';
    import { MedicalCode } from '@/api/entities';
    import { useLanguageHook } from '@/components/useLanguageHook';
    import { useToast } from '@/components/ui/use-toast';
    import useCrudPage from '@/components/hooks/useCrudPage';
    import DataTable from '@/components/shared/DataTable';
    import DiagnosisProcedureMappingDialog from './DiagnosisProcedureMappingDialog';
    import SearchFilterBar from '@/components/shared/SearchFilterBar';
    import { Button } from '@/components/ui/button';

    const DiagnosisProcedureMappingTab = () => {
      const { t } = useLanguageHook();
      const { toast } = useToast();
      const [medicalCodesMap, setMedicalCodesMap] = useState({});

      useEffect(() => {
        const fetchMedicalCodes = async () => {
          try {
            const codes = await MedicalCode.list();
            const map = {};
            (Array.isArray(codes) ? codes : []).forEach(code => {
              map[code.code] = `${code.code} (${code.description_en?.substring(0,30) || 'N/A'}...)`;
            });
            setMedicalCodesMap(map);
          } catch (err) {
            console.error("Failed to fetch medical codes for DxPx mapping tab", err);
          }
        };
        fetchMedicalCodes();
      }, []);
      
      const getCodeDisplay = (code) => medicalCodesMap[code] || code;

      const {
        allItems: mappings, // Changed from items
        loading, // Changed from isLoading
        error,
        // pagination, // These are now typically returned by useCrudPage
        filters,    // and passed to DataTable if needed
        isDialogOpen, // Changed from dialogState.isOpen
        currentEntity, // Changed from dialogState.data
        openCreateDialog, // Changed from handleCreate
        openEditDialog, // Changed from handleEdit
        handleDelete,
        handleFormSubmit, // Changed from handleSubmit
        closeDialog, // Changed from handleCloseDialog
        fetchItems, // Changed from handleRetry
        searchQuery,      // For SearchFilterBar
        setSearchQuery,   // For SearchFilterBar
        handleSingleFilterChange, // For SearchFilterBar custom filters
        // handleSortChange, // These are now typically returned by useCrudPage
        // handlePageChange, // and passed to DataTable if needed
      } = useCrudPage({
        entitySDK: DiagnosisProcedureMapping,
        // entityName: 'DiagnosisProcedureMapping', // Not needed if singular/plural provided
        entityNameSingular: t('dxPxMapping.entityNameSingular', {defaultValue: 'Dx/Px Mapping'}),
        entityNamePlural: t('dxPxMapping.titlePlural', {defaultValue: 'Diagnosis to Procedure Mappings'}),
        // schema: DiagnosisProcedureMapping.schema(), // Not used if formHook not provided
        defaultSort: '-created_date',
        // sortOptions: [{ value: '-created_date', label: 'Newest' }, { value: 'diagnosis_code', label: 'Diagnosis Code' }], // Not used directly
        // toast, // useCrudPage has its own
        // t, // useCrudPage does not need t
        // entityDisplayName: t('dxPxMapping.titlePlural', {defaultValue: 'Diagnosis to Procedure Mappings'}), // Not a prop of useCrudPage
      });

      const columns = React.useMemo(() => [
        { accessorKey: 'diagnosis_code', header: t('fields.diagnosisCode', {defaultValue: 'Diagnosis Code'}), cell: ({row}) => getCodeDisplay(row.original.diagnosis_code), sortable: true },
        { accessorKey: 'procedure_code', header: t('fields.procedureCode', {defaultValue: 'Procedure Code'}), cell: ({row}) => getCodeDisplay(row.original.procedure_code), sortable: true },
        { accessorKey: 'mapping_type', header: t('fields.mappingType', {defaultValue: 'Mapping Type'}), cell: ({row}) => t(`mappingTypes.${row.original.mapping_type}`, {defaultValue: row.original.mapping_type}) },
        { accessorKey: 'notes', header: t('fields.notes', {defaultValue: 'Notes'}) },
        { 
          accessorKey: 'is_active', 
          header: t('fields.status', {defaultValue: 'Status'}),
          cell: ({ row }) => row.original.is_active ? t('status.active', {defaultValue: 'Active'}) : t('status.inactive', {defaultValue: 'Inactive'})
        },
        {
          id: 'actions',
          header: t('common.actions', {defaultValue: 'Actions'}),
          cell: ({ row }) => (
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(row.original)}>{t('buttons.edit', {defaultValue: 'Edit'})}</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>{t('buttons.delete', {defaultValue: 'Delete'})}</Button>
            </div>
          ),
        },
      ], [t, openEditDialog, handleDelete, medicalCodesMap, getCodeDisplay]);

      const filterFields = [
        { name: 'mapping_type_filter', label: t('fields.mappingType', {defaultValue: 'Mapping Type'}), type: 'select', options: [ // Renamed
            { value: '', label: t('filters.allTypes', {defaultValue: 'All Types'}) },
            { value: 'primary', label: t('mappingTypes.primary', {defaultValue: 'Primary'}) },
            { value: 'secondary', label: t('mappingTypes.secondary', {defaultValue: 'Secondary'}) },
            { value: 'conditional', label: t('mappingTypes.conditional', {defaultValue: 'Conditional'}) },
        ]},
      ];
      
      const onActualFilterChange = (name, value) => {
        handleSingleFilterChange(name, value);
      };

      const displayedFilters = {
        mapping_type_filter: filters.mapping_type_filter || '',
      };
      
      // Client-side filter logic
      const customFilterLogic = (item, currentFilters) => {
        if (currentFilters.mapping_type_filter && item.mapping_type !== currentFilters.mapping_type_filter) return false;
        // Add more specific filtering for diagnosis_code or procedure_code if needed,
        // though general search should cover some of it.
        return true;
      };


      return (
        <div className="space-y-4">
          <SearchFilterBar
            filterFields={filterFields}
            currentFilters={displayedFilters}
            onFilterChange={onActualFilterChange}
            onSearch={setSearchQuery}
            searchTerm={searchQuery}
            onAddNew={openCreateDialog}
            addNewLabel={t('dxPxMapping.addNew', {defaultValue: 'Add Dx/Px Mapping'})}
            isLoading={loading}
          />
          <DataTable
            columns={columns}
            data={mappings}
            isLoading={loading}
            error={error}
            onRetry={fetchItems}
            // pagination={pagination} // Pass if provided by useCrudPage and needed by DataTable
            // onPageChange={handlePageChange} // Pass if provided
            // onSortChange={handleSortChange} // Pass if provided
            // currentSort={filters.sort} // Pass if provided
            entityName={t('dxPxMapping.titlePlural', {defaultValue: 'Diagnosis to Procedure Mappings'})}
            customFilterLogic={customFilterLogic}
            currentFilters={filters}
          />
          {isDialogOpen && (
            <DiagnosisProcedureMappingDialog
              open={isDialogOpen}
              onOpenChange={closeDialog}
              mappingData={currentEntity}
              onSubmit={handleFormSubmit}
              isLoading={loading} // Pass loading state
            />
          )}
        </div>
      );
    };
    export default DiagnosisProcedureMappingTab;