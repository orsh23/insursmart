{/* Content from components/code-management/provider-codes-tab.js */}
        import React, { useState, useEffect, useCallback, useMemo } from 'react';
        import { useLanguageHook } from '@/components/useLanguageHook';
        import { ProviderInternalCode } from '@/api/entities';
        import { Provider } from '@/api/entities';
        import { Button } from '@/components/ui/button';
        import { Badge } from '@/components/ui/badge';
        import {
          Plus, SearchX, RefreshCw, AlertTriangle, Building, Tag,
          Edit, Trash2, UploadCloud, DownloadCloud
        } from 'lucide-react';
        import LoadingSpinner from '@/components/ui/loading-spinner';
        import EmptyState from '@/components/ui/empty-state';
        import ProviderCodeDialog from './provider-code-dialog'; // Assuming this will be updated or is correct
        import { useToast } from "@/components/ui/use-toast";
        import { loadFromStorage, saveToStorage } from '@/components/utils/storage';
        import { getLocalizedValue, formatSafeDateDistance } from '@/components/utils/i18n-utils';
        import { enUS, he } from 'date-fns/locale';

        import { useEntityModule } from '@/components/hooks/useEntityModule';
        import ProviderCodeCard from './ProviderCodeCard'; // Assuming this will be updated or is correct
        import ProviderCodeFilters from './ProviderCodeFilters'; // Assuming this will be updated or is correct
        import ErrorDisplay from '@/components/common/ErrorDisplay';
        import GlobalActionButton from '@/components/common/GlobalActionButton';
        import ViewSwitcher from '@/components/common/ViewSwitcher';
        import { DataTable } from '@/components/ui/data-table'; 
        import StatusBadge from '@/components/common/StatusBadge';

        import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
        import { Input } from '@/components/ui/input';
        import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
        import { Label } from '@/components/ui/label';

        const getLocaleObject = (languageCode) => (languageCode === 'he' ? he : enUS);

        const booleanFilterOptions = (t, fieldNameKey, trueLabelKey, falseLabelKey) => [
          { value: 'all', label: t(`filters.all${fieldNameKey.charAt(0).toUpperCase() + fieldNameKey.slice(1)}`, { defaultValue: `All (${t(fieldNameKey)})` }) },
          { value: 'true', label: t(trueLabelKey, { defaultValue: `${t(fieldNameKey)}: Yes` }) },
          { value: 'false', label: t(falseLabelKey, { defaultValue: `${t(fieldNameKey)}: No` }) },
        ];

        export default function ProviderCodesTab({ globalActionsConfig: externalActionsConfig, currentView: passedView }) {
          const { t, language, isRTL } = useLanguageHook();
          const { toast } = useToast();
          const currentLocale = useMemo(() => getLocaleObject(language), [language]);

          const [providers, setProviders] = useState([]);

          useEffect(() => {
            const fetchProviders = async () => {
              try {
                const providerData = await Provider.list();
                setProviders(Array.isArray(providerData) ? providerData : []);
              } catch (err) {
                console.error("Failed to fetch providers for Provider Codes tab:", err);
                toast({ title: t('errors.fetchFailed', { entity: t('providers.titleMultiple') }), description: err.message, variant: "destructive" });
              }
            };
            fetchProviders();
          }, [t, toast]);

          const providerOptions = useMemo(() => [
            { value: 'all', label: t('filters.allProviders', { defaultValue: 'All Providers' }) },
            ...providers.map(p => ({
              value: p.id,
              label: getLocalizedValue(p, 'name', language, 'en', p.id)
            }))
          ], [providers, language, t]);

          const entityConfig = useMemo(() => ({
            entitySDK: ProviderInternalCode,
            entityName: t('providerCodes.entityNameSingular', { defaultValue: 'Provider Code' }),
            entityNamePlural: t('providerCodes.titleMultiple', { defaultValue: 'Provider Codes' }),
            DialogComponent: ProviderCodeDialog,
            initialSort: [{ id: 'code_number', desc: false }],
            initialFilters: {
              searchTerm: '',
              providerId: 'all',
              status: 'all', 
              tagsQuery: '',
              categoryPathQuery: '',
            },
            searchFields: ['code_number', 'description_en', 'description_he', 'category_path', 'tags'],
            filterFunction: (item, filters) => {
              const term = filters.searchTerm?.toLowerCase();
              if (term) {
                const descEn = item.description_en?.toLowerCase() || '';
                const descHe = item.description_he?.toLowerCase() || '';
                const providerName = getLocalizedValue(providers.find(p => p.id === item.provider_id), 'name', language, 'en', item.provider_id)?.toLowerCase() || '';

                if (!(
                  item.code_number?.toLowerCase().includes(term) ||
                  descEn.includes(term) ||
                  descHe.includes(term) ||
                  providerName.includes(term) ||
                  (Array.isArray(item.tags) && item.tags.some(tag => tag?.toLowerCase().includes(term)))
                )) return false;
              }
              if (filters.providerId !== 'all' && item.provider_id !== filters.providerId) return false;
              if (filters.status !== 'all' && String(item.status) !== filters.status) return false;
              if (filters.tagsQuery) {
                const lowerTagsQuery = filters.tagsQuery.toLowerCase();
                if (!Array.isArray(item.tags) || !item.tags.some(tag => tag && String(tag).toLowerCase().includes(lowerTagsQuery))) return false;
              }
              if (filters.categoryPathQuery) {
                const lowerCategoryPathQuery = filters.categoryPathQuery.toLowerCase();
                if (!item.category_path?.toLowerCase().includes(lowerCategoryPathQuery)) return false;
              }
              return true;
            },
            storageKey: 'providerCodesView',
          }), [t, language, providers]);

          const {
            items: providerCodes,
            loading, error, filters,
            sortConfig, pagination,
            selectedItems, setSelectedItems,
            isDialogOpen, currentItem,
            handleRefresh: refreshProviderCodes,
            handleFilterChange, handleSortChange, handlePageChange, handlePageSizeChange,
            handleAddNew, handleEdit, handleBulkDelete,
            isSelectionModeActive, setIsSelectionModeActive,
            handleToggleSelection, handleSelectAll, handleSelfSubmittingDialogClose,
            filteredAndSortedItems,
          } = useEntityModule(entityConfig);

          const [currentView, setCurrentView] = useState(passedView || loadFromStorage(entityConfig.storageKey + '_viewPreference', 'card'));

          useEffect(() => {
            if (passedView && passedView !== currentView) {
              setCurrentView(passedView);
              saveToStorage(entityConfig.storageKey + '_viewPreference', passedView);
            }
          }, [passedView, currentView, entityConfig.storageKey]);

          const resetFiltersAndSort = useCallback(() => {
            handleFilterChange(null, entityConfig.initialFilters);
            handleSortChange(entityConfig.initialSort);
            setIsSelectionModeActive(false);
            setSelectedItems([]);
          }, [handleFilterChange, handleSortChange, entityConfig.initialFilters, entityConfig.initialSort, setIsSelectionModeActive, setSelectedItems]);

          const handleEditWithSelectionCheck = useCallback(() => {
            if (selectedItems.length === 1) {
              const itemToEdit = filteredAndSortedItems.find(item => item.id === selectedItems[0]) || providerCodes.find(item => item.id === selectedItems[0]);
              if (itemToEdit) handleEdit(itemToEdit);
              else toast({ title: t('errors.itemNotFoundTitle'), description: t('errors.itemNotFoundToEditDesc'), variant: "warning" });
            } else if (selectedItems.length === 0) {
              setIsSelectionModeActive(true);
              toast({ title: t('bulkActions.selectionModeActiveTitle', { mode: t('common.edit') }), description: t('bulkActions.selectItemsPromptShort', { mode: t('common.edit') }), variant: "info" });
            } else {
              toast({ title: t('bulkActions.selectOneToEditTitle'), description: t('bulkActions.selectOneToEditDesc', { entity: entityConfig.entityName }), variant: 'info' });
            }
          }, [selectedItems, handleEdit, setIsSelectionModeActive, t, toast, filteredAndSortedItems, providerCodes, entityConfig.entityName]);

          const handleDeleteWithSelectionCheck = useCallback(() => {
            if (selectedItems.length > 0) {
              if (window.confirm(t('common.confirmDeleteMultiple', { count: selectedItems.length, item: entityConfig.entityNamePlural }))) {
                handleBulkDelete(selectedItems);
              }
            } else {
              setIsSelectionModeActive(true);
              toast({ title: t('bulkActions.selectionModeActiveTitle', { mode: t('common.delete') }), description: t('bulkActions.selectItemsPromptShort', { mode: t('common.delete') }), variant: "info" });
            }
          }, [selectedItems, handleBulkDelete, setIsSelectionModeActive, t, toast, entityConfig.entityNamePlural]); // Corrected entityConfig.entityNamePlates to entityConfig.entityNamePlural

          const handleCancelSelectionMode = useCallback(() => {
            setIsSelectionModeActive(false);
            setSelectedItems([]);
          }, [setIsSelectionModeActive, setSelectedItems]);

          const memoizedGlobalActionsConfig = useMemo(() => [
            { labelKey: 'providerCodes.addNewCode', defaultLabel: 'Add Provider Code', icon: Plus, action: handleAddNew, type: 'add' },
            { labelKey: 'common.edit', defaultLabel: 'Edit', icon: Edit, action: handleEditWithSelectionCheck, type: 'edit', selectionSensitive: true, requiredSelectionCount: 1 },
            { labelKey: 'common.delete', defaultLabel: 'Delete', icon: Trash2, action: handleDeleteWithSelectionCheck, type: 'delete', selectionSensitive: true, requiredSelectionCount: 'multiple' },
            { isSeparator: true },
            { labelKey: 'buttons.import', defaultLabel: 'Import Codes', icon: UploadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.import') }) }), disabled: true, type: 'import' },
            { labelKey: 'buttons.export', defaultLabel: 'Export Codes', icon: DownloadCloud, action: () => toast({ title: t('common.featureComingSoonTitle'), description: t('common.featureComingSoonDesc', { featureName: t('buttons.export') }) }), disabled: true, type: 'export' },
            ...(externalActionsConfig || [])
          ], [handleAddNew, externalActionsConfig, t, toast, handleEditWithSelectionCheck, handleDeleteWithSelectionCheck]);

          const handleDialogCloseWrapper = useCallback((refreshNeeded, actionType = null, itemName = '') => {
            handleSelfSubmittingDialogClose(refreshNeeded, actionType, itemName);
          }, [handleSelfSubmittingDialogClose]);

          const providerCodeTableColumns = useMemo(() => [
            {
              accessorKey: 'provider_id',
              header: t('providerCodes.fields.provider'),
              enableSorting: true,
              cell: ({ row }) => {
                const provider = providers.find(p => p.id === row.original.provider_id);
                return provider ? getLocalizedValue(provider, 'name', language, 'en', row.original.provider_id) : row.original.provider_id || t('common.notSet');
              }
            },
            { accessorKey: 'code_number', header: t('providerCodes.fields.codeNumber'), enableSorting: true },
            {
              accessorKey: language === 'he' ? 'description_he' : 'description_en',
              header: t('providerCodes.fields.description'),
              enableSorting: true,
              cell: ({ row }) => getLocalizedValue(row.original, 'description', language, 'en', t('common.notSet'))
            },
            {
              accessorKey: 'category_path',
              header: t('providerCodes.fields.categoryPath'),
              enableSorting: true,
              cell: ({ row }) => row.original.category_path || t('common.notSet')
            },
            {
              accessorKey: 'status',
              header: t('providerCodes.fields.status'),
              cell: ({ row }) => <StatusBadge status={row.original.status ? 'active' : 'inactive'} t={t} />,
              enableSorting: true
            },
            {
              accessorKey: 'tags',
              header: t('providerCodes.fields.tags'),
              cell: ({ row }) => Array.isArray(row.original.tags) && row.original.tags.length > 0
                ? row.original.tags.map(tag => <Badge key={tag} variant="outline" className="mr-1 mb-1 text-xs">{tag}</Badge>)
                : t('common.notSet'),
              enableSorting: false
            },
            {
              accessorKey: 'updated_date',
              header: t('fields.lastUpdated'),
              cell: ({ row }) => formatSafeDateDistance(row.original.updated_date, language, t),
              enableSorting: true
            },
          ], [t, language, providers]);

          const sortOptions = useMemo(() => ([
            { value: '-updated_date', label: t('sortOptions.lastUpdated', { defaultValue: 'Last Updated' }) },
            { value: 'provider_id', label: t('sortOptions.provider', { defaultValue: 'Provider' }) },
            { value: 'code_number', label: t('sortOptions.codeNumber', { defaultValue: 'Code Number' }) },
            { value: language === 'he' ? 'description_he' : 'description_en', label: t('sortOptions.description', { defaultValue: 'Description' }) },
            { value: 'category_path', label: t('sortOptions.categoryPath', { defaultValue: 'Category Path' }) },
            { value: 'status', label: t('sortOptions.status', { defaultValue: 'Status' }) },
          ]), [t, language]);

          const currentSortOptionValue = useMemo(() => {
            if (!sortConfig || sortConfig.length === 0) return `-${entityConfig.initialSort[0].id}`;
            const currentSort = sortConfig[0];
            return currentSort.desc ? `-${currentSort.id}` : currentSort.id;
          }, [sortConfig, entityConfig.initialSort]);

          const handleSortFilterChange = useCallback((value) => {
            const isDesc = value.startsWith('-');
            const field = isDesc ? value.substring(1) : value;
            handleSortChange([{ id: field, desc: isDesc }]);
          }, [handleSortChange]);

          const renderContent = () => {
            if (loading && providerCodes.length === 0 && !error) {
              return <LoadingSpinner message={t('messages.loadingData', { item: entityConfig.entityNamePlural })} isFullScreen={false} />;
            }
            if (error && providerCodes.length === 0) {
              return <ErrorDisplay errorMessage={error.message || String(error)} onRetry={refreshProviderCodes} />;
            }

            const noItems = pagination.totalCount === 0;
            const noFiltersApplied = Object.values(filters || {}).every(val => !val || val === 'all' || (Array.isArray(val) && val.length === 0));

            if (currentView === 'card') {
              return (
                <>
                  {noItems && noFiltersApplied ? (
                    <EmptyState
                      icon={Building}
                      title={t('providerCodes.emptyState.noCodesTitle')}
                      description={t('providerCodes.emptyState.noCodesDesc')}
                      actionButton={<Button onClick={() => handleAddNew()} className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"><Plus className="mr-2 h-4 w-4" />{t('providerCodes.addNewCode')}</Button>}
                    />
                  ) : noItems && !noFiltersApplied ? (
                    <EmptyState
                      icon={SearchX}
                      title={t('providerCodes.emptyState.noCodesMatchTitle')}
                      description={t('providerCodes.emptyState.noCodesMatchDesc')}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {providerCodes.map(code => (
                        <ProviderCodeCard
                          key={code.id}
                          codeItem={code}
                          onEdit={() => handleEdit(code)}
                          language={language}
                          providerName={getLocalizedValue(providers.find(p => p.id === code.provider_id), 'name', language, 'en', code.provider_id)}
                          isSelectionModeActive={isSelectionModeActive}
                          isSelected={selectedItems.includes(code.id)}
                          onToggleSelection={() => handleToggleSelection(code.id)}
                        />
                      ))}
                    </div>
                  )}
                  {Math.ceil(pagination.totalCount / pagination.pageSize) > 1 && (
                    <div className="mt-6 flex justify-center items-center space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading}>
                        {t('buttons.previous')}
                      </Button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('dataTable.pageInfo', { page: pagination.currentPage, totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1 })}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= (Math.ceil(pagination.totalCount / pagination.pageSize) || 1) || loading}>
                        {t('buttons.next')}
                      </Button>
                    </div>
                  )}
                </>
              );
            }

            if (currentView === 'table') {
              return (
                <DataTable
                  columns={providerCodeTableColumns}
                  data={providerCodes}
                  loading={loading}
                  error={error}
                  onRetry={refreshProviderCodes}
                  entityName={entityConfig.entityNamePlural}
                  emptyMessage={noFiltersApplied ? t('providerCodes.emptyState.noCodesDesc') : t('providerCodes.emptyState.noCodesMatchDesc')}
                  onRowClick={(row) => handleEdit(row.original)}
                  isSelectionModeActive={isSelectionModeActive}
                  selectedRowIds={new Set(selectedItems)}
                  onRowSelectionChange={handleToggleSelection}
                  onSelectAllRows={() => handleSelectAll(providerCodes.map(c => c.id))}
                  currentSort={sortConfig}
                  onSortChange={handleSortChange}
                  pagination={{
                    currentPage: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    totalItems: pagination.totalCount,
                    totalPages: Math.ceil(pagination.totalCount / pagination.pageSize) || 1,
                  }}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  t={t}
                />
              );
            }
            return null;
          };

          return (
            <div className="space-y-4 p-1 md:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-[calc(var(--header-height,0px)+var(--subheader-height,0px))] bg-background dark:bg-gray-900 py-3 z-10 -mx-1 px-1 md:mx-0 md:px-0 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                  <Building className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-gray-600 dark:text-gray-400`} />
                  {t('providerCodes.listTitle', { defaultValue: "Provider Codes" })}{' '}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({loading ? t('common.loadingEllipsis') : pagination.totalCount || 0})
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <GlobalActionButton
                    actionsConfig={memoizedGlobalActionsConfig}
                    isSelectionModeActive={isSelectionModeActive}
                    onCancelSelectionMode={handleCancelSelectionMode}
                    selectedItemCount={selectedItems.length}
                    itemTypeForActions={entityConfig.entityName}
                    t={t} isRTL={isRTL}
                  />
                  <Button onClick={refreshProviderCodes} variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
                    {t('buttons.refresh', { defaultValue: "Refresh" })}
                  </Button>
                  <ViewSwitcher
                    currentView={currentView}
                    onViewChange={(view) => { setCurrentView(view); saveToStorage(entityConfig.storageKey + '_viewPreference', view); handleCancelSelectionMode(); }}
                    availableViews={['card', 'table']}
                    entityName={t('providerCodes.entityNamePlural')}
                    t={t} isRTL={isRTL}
                  />
                </div>
              </div>

              <ProviderCodeFilters
                filters={filters}
                onFiltersChange={handleFilterChange}
                onResetFilters={resetFiltersAndSort}
                sortOptionValue={currentSortOptionValue}
                onSortOptionChange={handleSortFilterChange}
                sortOptions={sortOptions}
                providerOptions={providerOptions}
                statusOptions={booleanFilterOptions(t, 'status', 'filters.statusActive', 'filters.statusInactive')}
                t={t} language={language} isRTL={isRTL}
                loading={loading}
              />

              {error && providerCodes.length > 0 && (
                <div className="p-3 my-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{t('errors.partialLoadWarning', { entity: entityConfig.entityNamePlural, message: String(error.message || error) })}</span>
                </div>
              )}

              {renderContent()}

              {isDialogOpen && (
                <ProviderCodeDialog
                  isOpen={isDialogOpen}
                  onClose={(refresh, actionType, itemName) => handleDialogCloseWrapper(refresh, actionType, itemName)}
                  codeItem={currentItem}
                  providers={providers}
                />
              )}
            </div>
          );
        }