import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { FieldConfig } from '@/api/entities';
// Import entity schemas
import { Provider } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { MedicalCode } from '@/api/entities';
import { InternalCode } from '@/api/entities';
import { Material } from '@/api/entities';
import { Contract } from '@/api/entities';
import { InsuredPerson } from '@/api/entities';
import { InsurancePolicy } from '@/api/entities';
import { Claim } from '@/api/entities';
import { RequestForCommitment } from '@/api/entities';


import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner'; // Corrected path
import { Settings, ListChecks, Eye, AlertCircle, AlertTriangle, RefreshCw, Save, CheckSquare, Square, ChevronDown, FileJson } from 'lucide-react';
import { retryWithBackoff, handleApiError, safeEntityCall } from '@/components/utils/api-utils';


const allEntitySchemas = {
  Provider: Provider.schema,
  Doctor: Doctor.schema,
  MedicalCode: MedicalCode.schema,
  InternalCode: InternalCode.schema,
  Material: Material.schema,
  Contract: Contract.schema,
  InsuredPerson: InsuredPerson.schema,
  InsurancePolicy: InsurancePolicy.schema,
  Claim: Claim.schema,
  RequestForCommitment: RequestForCommitment.schema
};

const getDisplayFieldName = (fieldName, t) => {
    // Simple conversion from camelCase or snake_case to Title Case
    let result = fieldName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    result = result.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    return t(`fields.${fieldName}`, { defaultValue: result });
};


export default function FieldConfigTab() {
  const { t } = useLanguageHook();
  const { toast } = useToast();

  const [selectedEntity, setSelectedEntity] = useState(Object.keys(allEntitySchemas)[0] || '');
  // Stores current UI state of configurations, including unsaved changes
  const [fieldConfigs, setFieldConfigs] = useState({}); 
  // Stores configurations fetched from DB, used to compare for "Save" button enablement
  const [dbFieldConfigsMap, setDbFieldConfigsMap] = useState({}); 
  
  const [loading, setLoading] = useState(true);
  const [savingEntity, setSavingEntity] = useState(null); // Tracks which entity is currently being saved
  const [apiError, setApiError] = useState(null);

  const entityOptions = useMemo(() => 
    Object.keys(allEntitySchemas).map(entityName => ({
      value: entityName,
      label: t(`entities.${entityName.toLowerCase()}`, { defaultValue: entityName.replace(/([A-Z])/g, ' $1').trim() }),
    })).sort((a, b) => a.label.localeCompare(b.label)),
  [t]);

  // Fetch ALL field configs on mount or when explicitly refreshed
  const fetchAllFieldConfigs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setApiError(null);
    try {
      const configs = await retryWithBackoff(
        () => safeEntityCall(FieldConfig, 'list'),
        'FieldConfigTab-FetchAll'
      );
      
      const configsMap = {};
      (configs || []).forEach(config => {
        if (!configsMap[config.entity_name]) {
          configsMap[config.entity_name] = {};
        }
        configsMap[config.entity_name][config.field_name] = {
          is_mandatory: config.is_mandatory,
          is_visible: config.is_visible,
          id: config.id, // Store ID for updates
        };
      });
      setDbFieldConfigsMap(configsMap); // Store DB state
      
      // Initialize UI state (fieldConfigs) based on schema and DB configs
      const initialUiConfigs = {};
      Object.keys(allEntitySchemas).forEach(entityName => {
        initialUiConfigs[entityName] = {};
        const schema = allEntitySchemas[entityName](); // Call schema function
        if (schema && schema.properties) {
          Object.keys(schema.properties).forEach(fieldName => {
            const dbConfig = configsMap[entityName]?.[fieldName];
            initialUiConfigs[entityName][fieldName] = {
              is_mandatory: dbConfig?.is_mandatory ?? false,
              is_visible: dbConfig?.is_visible ?? true, // Default to visible if not in DB
              id: dbConfig?.id, // For updates
            };
          });
        }
      });
      setFieldConfigs(initialUiConfigs); // This is the UI state

    } catch (error) {
      handleApiError(error, t, toast, 'FieldConfigTab-FetchAll');
      setApiError(t('errors.fetchFieldConfigsFailed', { defaultValue: 'Failed to load field configurations.' }));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [t, toast]); // toast & t are stable

  useEffect(() => {
    fetchAllFieldConfigs();
  }, [fetchAllFieldConfigs]);

  const handleToggle = (entityName, fieldName, type) => {
    setFieldConfigs(prev => ({
      ...prev,
      [entityName]: {
        ...prev[entityName],
        [fieldName]: {
          ...prev[entityName]?.[fieldName],
          [type]: !prev[entityName]?.[fieldName]?.[type],
        },
      },
    }));
  };

  const handleSave = async (entityNameToSave) => {
    setSavingEntity(entityNameToSave);
    setApiError(null);
    const currentEntityConfigs = fieldConfigs[entityNameToSave];
    const dbEntityConfigs = dbFieldConfigsMap[entityNameToSave] || {};

    try {
      const operations = [];
      for (const fieldName in currentEntityConfigs) {
        const uiConfig = currentEntityConfigs[fieldName];
        const dbConfig = dbEntityConfigs[fieldName];

        if (dbConfig) { // Existing config, check for update
          if (uiConfig.is_mandatory !== dbConfig.is_mandatory || uiConfig.is_visible !== dbConfig.is_visible) {
            operations.push(
              retryWithBackoff(
                () => safeEntityCall(FieldConfig, 'update', dbConfig.id, { 
                  is_mandatory: uiConfig.is_mandatory, 
                  is_visible: uiConfig.is_visible 
                }),
                `FieldConfigTab-Update-${entityNameToSave}-${fieldName}`
              )
            );
          }
        } else { // New config, create
          // Only create if not default (false for mandatory, true for visible)
          if (uiConfig.is_mandatory !== false || uiConfig.is_visible !== true) {
             operations.push(
              retryWithBackoff(
                () => safeEntityCall(FieldConfig, 'create', {
                  entity_name: entityNameToSave,
                  field_name: fieldName,
                  is_mandatory: uiConfig.is_mandatory,
                  is_visible: uiConfig.is_visible,
                }),
                `FieldConfigTab-Create-${entityNameToSave}-${fieldName}`
              )
            );
          }
        }
      }

      if (operations.length > 0) {
        await Promise.all(operations);
        toast({
          title: t('common.success', { defaultValue: 'Success' }),
          description: t('fieldConfig.saveSuccess', { defaultValue: `${entityNameToSave} configurations saved.` }),
        });
        await fetchAllFieldConfigs(false); // Refresh DB state without full loading spinner
      } else {
         toast({
          title: t('common.info', { defaultValue: 'Info' }),
          description: t('fieldConfig.noChanges', { defaultValue: `No changes to save for ${entityNameToSave}.` }),
        });
      }
    } catch (error) {
      handleApiError(error, t, toast, `FieldConfigTab-Save-${entityNameToSave}`);
      setApiError(t('errors.saveFieldConfigsFailed', { defaultValue: `Failed to save ${entityNameToSave} configurations.` }));
    } finally {
      setSavingEntity(null);
    }
  };
  
  const isEntityConfigChanged = (entityName) => {
    const currentEntityUiConfigs = fieldConfigs[entityName];
    const currentEntityDbConfigs = dbFieldConfigsMap[entityName] || {};
    if (!currentEntityUiConfigs) return false;

    for (const fieldName in currentEntityUiConfigs) {
        const uiConfig = currentEntityUiConfigs[fieldName];
        const dbConfig = currentEntityDbConfigs[fieldName];

        const dbMandatory = dbConfig?.is_mandatory ?? false;
        const dbVisible = dbConfig?.is_visible ?? true;
        
        if (uiConfig.is_mandatory !== dbMandatory || uiConfig.is_visible !== dbVisible) {
            return true; // Found a change
        }
    }
    return false; // No changes
  };


  const currentEntitySchema = selectedEntity ? allEntitySchemas[selectedEntity]() : null;
  const currentEntityFields = currentEntitySchema?.properties 
    ? Object.keys(currentEntitySchema.properties)
        .map(fieldName => ({
            name: fieldName,
            display: getDisplayFieldName(fieldName, t),
            // Add description if available in schema
            description: currentEntitySchema.properties[fieldName]?.description 
                ? t(`fieldDescriptions.${selectedEntity.toLowerCase()}.${fieldName}`, { defaultValue: currentEntitySchema.properties[fieldName].description })
                : ''
        }))
        .sort((a,b) => a.display.localeCompare(b.display))
    : [];


  if (loading && Object.keys(fieldConfigs).length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="text-2xl flex items-center">
                    <ListChecks className="mr-2 h-6 w-6 text-blue-600" />
                    {t('fieldConfig.title', { defaultValue: 'Field Configuration' })}
                </CardTitle>
                <CardDescription>
                    {t('fieldConfig.description', { defaultValue: 'Manage mandatory and visible fields for different entities.' })}
                </CardDescription>
            </div>
             <Button variant="outline" onClick={() => fetchAllFieldConfigs()} className="w-full mt-2 sm:w-auto sm:mt-0">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refreshAll', {defaultValue: 'Refresh All Configs'})}
            </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-md bg-muted/50 dark:bg-muted/20">
            <div className="flex-grow w-full sm:w-auto">
                <Label htmlFor="entity-select" className="text-sm font-medium">
                    {t('fieldConfig.selectEntity', { defaultValue: 'Select Entity to Configure' })}
                </Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                    <SelectTrigger id="entity-select" className="w-full mt-1">
                        <FileJson className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={t('fieldConfig.selectEntityPlaceholder', { defaultValue: 'Choose an entity...' })} />
                    </SelectTrigger>
                    <SelectContent>
                        {entityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button 
                onClick={() => handleSave(selectedEntity)} 
                disabled={!selectedEntity || savingEntity === selectedEntity || !isEntityConfigChanged(selectedEntity)}
                className="w-full sm:w-auto"
            >
                <Save className={`mr-2 h-4 w-4 ${savingEntity === selectedEntity ? 'animate-spin' : ''}`} />
                {savingEntity === selectedEntity 
                    ? t('common.saving', { defaultValue: 'Saving...' }) 
                    : `${t('common.save', { defaultValue: 'Save' })} ${selectedEntity ? entityOptions.find(e=>e.value===selectedEntity)?.label || selectedEntity : ''} ${t('fieldConfig.configsSuffix', {defaultValue: 'Configs'})}`
                }
            </Button>
        </div>

        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p>{apiError}</p>
          </div>
        )}

        {selectedEntity && !apiError ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">{t('fieldConfig.table.fieldName', { defaultValue: 'Field Name' })}</TableHead>
                  <TableHead className="w-[30%] text-center">{t('fieldConfig.table.isMandatory', { defaultValue: 'Mandatory' })}</TableHead>
                  <TableHead className="w-[30%] text-center">{t('fieldConfig.table.isVisible', { defaultValue: 'Visible' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && fieldConfigs[selectedEntity] === undefined && (
                    <TableRow><TableCell colSpan={3} className="text-center"><LoadingSpinner/></TableCell></TableRow>
                )}
                {currentEntityFields.map((field) => {
                  const config = fieldConfigs[selectedEntity]?.[field.name] || { is_mandatory: false, is_visible: true };
                  return (
                    <TableRow key={field.name}>
                      <TableCell>
                        <div className="font-medium">{field.display}</div>
                        {field.description && <div className="text-xs text-muted-foreground">{field.description}</div>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={config.is_mandatory}
                          onCheckedChange={() => handleToggle(selectedEntity, field.name, 'is_mandatory')}
                          aria-label={`Toggle ${field.display} mandatory`}
                          id={`mandatory-${selectedEntity}-${field.name}`}
                        />
                         <Label htmlFor={`mandatory-${selectedEntity}-${field.name}`} className="sr-only">
                            {t('fieldConfig.toggleMandatory', { fieldName: field.display, defaultValue: `Toggle ${field.display} mandatory`})}
                        </Label>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={config.is_visible}
                          onCheckedChange={() => handleToggle(selectedEntity, field.name, 'is_visible')}
                          aria-label={`Toggle ${field.display} visible`}
                          id={`visible-${selectedEntity}-${field.name}`}
                        />
                        <Label htmlFor={`visible-${selectedEntity}-${field.name}`} className="sr-only">
                            {t('fieldConfig.toggleVisible', { fieldName: field.display, defaultValue: `Toggle ${field.display} visible`})}
                        </Label>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : !apiError && (
          <div className="text-center py-10 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
            {t('fieldConfig.pleaseSelectEntity', {defaultValue: 'Please select an entity to configure its fields.'})}
          </div>
        )}
      </CardContent>
    </Card>
  );
}