
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Settings, AlertTriangle, ShieldAlert } from 'lucide-react';
import FieldRequirementToggle from './FieldRequirementToggle';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useFieldConfig } from './FieldConfigProvider';

// Import entity modules dynamically to get their schemas
const ENTITY_MODULES = {
  Provider: () => import('@/api/entities'),
  Doctor: () => import('@/api/entities'),
  MedicalCode: () => import('@/api/entities'),
  InternalCode: () => import('@/api/entities'),
  Material: () => import('@/api/entities'),
  Contract: () => import('@/api/entities'),
  Task: () => import('@/api/entities'),
  Regulation: () => import('@/api/entities'),
  RequestForCommitment: () => import('@/api/entities'),
  Claim: () => import('@/api/entities'),
  InsuredPerson: () => import('@/api/entities'),
  InsurancePolicy: () => import('@/api/entities'),
};

// Fallback field definitions in case schema loading fails
const FALLBACK_FIELDS = {
  Provider: [
    { field: 'name.en', label: 'Provider Name (English)', section: 'Basic Information' },
    { field: 'name.he', label: 'Provider Name (Hebrew)', section: 'Basic Information' },
    { field: 'provider_type', label: 'Provider Type', section: 'Basic Information' },
    { field: 'legal.type', label: 'Legal Entity Type', section: 'Legal Information' },
    { field: 'legal.identifier', label: 'Legal Identifier', section: 'Legal Information' },
    { field: 'contact.contact_person_name', label: 'Contact Person', section: 'Contact Information' },
    { field: 'contact.phone', label: 'Phone Number', section: 'Contact Information' },
    { field: 'contact.email', label: 'Email Address', section: 'Contact Information' },
    { field: 'contact.city', label: 'City', section: 'Contact Information' },
  ],
  Doctor: [
    { field: 'first_name_en', label: 'First Name (English)', section: 'Basic Information' },
    { field: 'last_name_en', label: 'Last Name (English)', section: 'Basic Information' },
    { field: 'first_name_he', label: 'First Name (Hebrew)', section: 'Basic Information' },
    { field: 'last_name_he', label: 'Last Name (Hebrew)', section: 'Basic Information' },
    { field: 'license_number', label: 'Medical License Number', section: 'Professional Information' },
    { field: 'specialties', label: 'Medical Specialties', section: 'Professional Information' },
    { field: 'phone', label: 'Contact Phone', section: 'Contact Information' },
    { field: 'email', label: 'Email Address', section: 'Contact Information' },
    { field: 'city', label: 'City of Practice', section: 'Contact Information' },
  ],
  Task: [
    { field: 'title', label: 'Task Title', section: 'Basic Information' },
    { field: 'description', label: 'Description', section: 'Basic Information' },
    { field: 'priority', label: 'Priority Level', section: 'Task Details' },
    { field: 'category', label: 'Task Category', section: 'Task Details' },
    { field: 'due_date', label: 'Due Date', section: 'Task Details' },
    { field: 'assigned_to', label: 'Assigned To', section: 'Assignment' },
    { field: 'estimated_hours', label: 'Estimated Hours', section: 'Time Tracking' },
  ],
};


export default function FieldRequirementsTab() {
  const { t } = useLanguageHook();
  const { 
    fieldConfigs, 
    loading: contextLoading, 
    error: contextError, 
    isAdmin, 
    updateFieldConfig,
  } = useFieldConfig();

  const [loadingSchema, setLoadingSchema] = useState(true);
  const [schemaError, setSchemaError] = useState(null);
  const [entityFields, setEntityFields] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const loadSchemas = async () => {
      setLoadingSchema(true);
      setSchemaError(null);
      try {
        const allEntityFields = {};
        for (const [entityName, moduleLoader] of Object.entries(ENTITY_MODULES)) {
          try {
            const entityModule = await moduleLoader();
            const EntityClass = entityModule[entityName];
            if (EntityClass && typeof EntityClass.schema === 'function') {
              const schema = EntityClass.schema();
              allEntityFields[entityName] = extractFieldsFromSchema(schema, entityName);
            } else {
              allEntityFields[entityName] = FALLBACK_FIELDS[entityName] || [];
            }
          } catch (err) {
            console.warn(`Failed to load schema for ${entityName}:`, err);
            allEntityFields[entityName] = FALLBACK_FIELDS[entityName] || [];
          }
        }
        setEntityFields(allEntityFields);
        
        const firstEntity = Object.keys(allEntityFields)[0];
        if (firstEntity) {
          setExpandedSections({ [firstEntity]: true });
        }
      } catch (err) {
        console.error('Error loading entity schemas:', err);
        setSchemaError(t('admin.fieldConfig.schemaLoadError', { 
          defaultValue: 'Failed to load entity field structures.' 
        }));
      } finally {
        setLoadingSchema(false);
      }
    };
    loadSchemas();
  }, [t]);

  // Extract fields from JSON schema
  const extractFieldsFromSchema = (schema, entityName) => {
    const fields = [];
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
        // Determine section based on field name patterns
        let section = 'General';
        if (fieldName.includes('contact') || fieldName.includes('phone') || fieldName.includes('email')) {
          section = 'Contact Information';
        } else if (fieldName.includes('address') || fieldName.includes('city') || fieldName.includes('postal')) {
          section = 'Address Information';
        } else if (fieldName.includes('legal') || fieldName.includes('license') || fieldName.includes('identifier')) {
          section = 'Legal/Professional Information';
        } else if (fieldName.includes('name') || fieldName.includes('title')) {
          section = 'Basic Information';
        }

        // Handle nested objects
        if (fieldSchema.type === 'object' && fieldSchema.properties) {
          Object.keys(fieldSchema.properties).forEach(nestedField => {
            fields.push({
              field: `${fieldName}.${nestedField}`,
              label: formatFieldLabel(fieldName, nestedField, fieldSchema.properties[nestedField]),
              section: section,
              description: fieldSchema.properties[nestedField].description,
            });
          });
        } else {
          fields.push({
            field: fieldName,
            label: formatFieldLabel(fieldName, null, fieldSchema),
            section: section,
            description: fieldSchema.description,
          });
        }
      });
    }
    return fields;
  };

  // Format field labels for display
  const formatFieldLabel = (fieldName, nestedField, fieldSchema) => {
    const fullFieldName = nestedField ? `${fieldName}.${nestedField}` : fieldName;
    // Use description if available
    if (fieldSchema?.description) return fieldSchema.description;
    // Convert snake_case to Title Case
    return fullFieldName.split(/[._]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Toggle field requirement
  const handleFieldToggle = async (entityName, fieldName, isRequired) => {
    try {
      await updateFieldConfig(entityName, fieldName, isRequired, true); // isVisible defaults to true
    } catch (err) {
      // Error is handled and displayed by contextError state in the parent FieldConfigProvider.
      // We can log it here for debugging purposes.
      console.error('Failed to update field configuration:', err);
    }
  };

  // Toggle section expansion
  const toggleSection = (entityName) => {
    setExpandedSections(prev => ({ ...prev, [entityName]: !prev[entityName] }));
  };

  // Group fields by section
  const groupFieldsBySection = (fields) => {
    const grouped = {};
    (fields || []).forEach(field => { // Ensure fields is not null/undefined
      const section = field.section || 'General';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(field);
    });
    return grouped;
  };

  const isLoading = contextLoading || loadingSchema;

  if (isLoading) {
    return <LoadingSpinner text={t('admin.fieldConfig.loading', { defaultValue: 'Loading field configurations...' })} />;
  }
  
  if (!isAdmin && !contextLoading) { // Check isAdmin after loading, but only if not still loading
    return (
      <Alert variant="destructive" className="mt-4">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle>{t('common.accessDenied', { defaultValue: 'Access Denied' })}</AlertTitle>
        <AlertDescription>
          {t('admin.fieldConfig.adminOnly', { defaultValue: 'You do not have permission to configure field requirements. Please contact an administrator.' })}
        </AlertDescription>
      </Alert>
    );
  }

  if (schemaError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{schemaError}</AlertDescription>
      </Alert>
    );
  }
  
  // Display context error if it happened during config load and we have no configs, but schemas might be fine
  if (contextError && !Object.keys(fieldConfigs).length && Object.keys(entityFields).length > 0) { 
     return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{contextError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">
          {t('admin.fieldConfig.title', { defaultValue: 'Field Requirements Configuration' })}
        </h3>
      </div>
      
      <p className="text-muted-foreground">
        {t('admin.fieldConfig.description', { 
          defaultValue: 'Configure which fields are required for each entity. Required fields will be validated during form submission.' 
        })}
      </p>

      {/* Display a general context error if it exists, regardless of other states */}
      {contextError && (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertDescription>{contextError}</AlertDescription>
           </Alert>
      )}

      {Object.keys(entityFields).length === 0 && !loadingSchema ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('admin.fieldConfig.noEntities', { defaultValue: 'No entities found to configure or schemas failed to load.' })}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {Object.entries(entityFields).map(([entityName, fields]) => {
            // Skip rendering if no fields are found for this entity
            if (!fields || fields.length === 0) return null; 
            
            const groupedFields = groupFieldsBySection(fields);
            const isExpanded = expandedSections[entityName];
            const requiredCount = (fields || []).filter(field => 
              fieldConfigs[entityName]?.[field.field]?.is_mandatory
            ).length;

            return (
              <Card key={entityName}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleSection(entityName)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                          <CardTitle className="text-lg">{entityName}</CardTitle>
                          <Badge variant="secondary">
                            {requiredCount} {t('admin.fieldConfig.required', { defaultValue: 'required' })}
                          </Badge>
                        </div>
                        <Badge variant="outline">
                          {fields.length} {t('admin.fieldConfig.fields', { defaultValue: 'fields' })}
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {Object.entries(groupedFields).map(([sectionName, sectionFields]) => (
                        <div key={sectionName} className="mb-6 last:mb-0">
                          <h4 className="font-medium text-sm text-muted-foreground mb-3 border-b pb-1">
                            {sectionName}
                          </h4>
                          <div className="space-y-3">
                            {sectionFields.map(field => {
                              const isRequired = fieldConfigs[entityName]?.[field.field]?.is_mandatory || false;
                              
                              return (
                                <div key={field.field} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{field.label}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <code className="bg-muted px-1 py-0.5 rounded text-xs">{field.field}</code>
                                      {field.description && (
                                        <span className="ml-2">{field.description}</span>
                                      )}
                                    </div>
                                  </div>
                                  <FieldRequirementToggle
                                    isRequired={isRequired}
                                    onToggle={(required) => handleFieldToggle(entityName, field.field, required)}
                                    fieldName={field.label}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
