import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FieldConfig } from '@/api/entities';
import { User } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';

const FieldConfigContext = createContext();

export const useFieldConfig = () => useContext(FieldConfigContext);

export const FieldConfigProvider = ({ children }) => {
  const { t } = useLanguageHook();
  const [fieldConfigs, setFieldConfigs] = useState({}); // { [entityName]: { [fieldName]: config } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configsData, currentUser] = await Promise.all([
        FieldConfig.list(),
        User.me().catch(() => null) 
      ]);

      if (currentUser) {
        setIsAdmin(currentUser.role === 'admin');
      } else {
        setIsAdmin(false); 
      }
      
      const groupedConfigs = {};
      if (Array.isArray(configsData)) {
        configsData.forEach(config => {
          if (!groupedConfigs[config.entity_name]) {
            groupedConfigs[config.entity_name] = {};
          }
          groupedConfigs[config.entity_name][config.field_name] = config;
        });
      }
      setFieldConfigs(groupedConfigs);
    } catch (err) {
      console.error("Failed to load field configurations or user data:", err);
      setError(t('admin.fieldConfig.loadErrorContext', { defaultValue: "Failed to load field configurations. Please try again later." }));
      setIsAdmin(false); 
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const updateFieldConfig = useCallback(async (entityName, fieldName, isMandatory, isVisible = true) => {
    setError(null); 
    try {
      let updatedConfig;
      const existingConfigFromState = fieldConfigs[entityName]?.[fieldName];

      if (existingConfigFromState) {
        updatedConfig = await FieldConfig.update(existingConfigFromState.id, { is_mandatory: isMandatory, is_visible: isVisible });
      } else {
        // Double check if a record exists in DB before creating, in case local state is stale
        const potentialExistingFromDB = await FieldConfig.filter({ entity_name: entityName, field_name: fieldName });
        if (potentialExistingFromDB && potentialExistingFromDB.length > 0) {
            updatedConfig = await FieldConfig.update(potentialExistingFromDB[0].id, { is_mandatory: isMandatory, is_visible: isVisible });
        } else {
            updatedConfig = await FieldConfig.create({
                entity_name: entityName,
                field_name: fieldName,
                is_mandatory: isMandatory,
                is_visible: isVisible,
            });
        }
      }
      
      setFieldConfigs(prev => {
        const newEntityConfigs = { ...(prev[entityName] || {}), [fieldName]: updatedConfig };
        return { ...prev, [entityName]: newEntityConfigs };
      });
      return updatedConfig;

    } catch (err) {
      console.error(`Failed to update field config for ${entityName}.${fieldName}:`, err);
      setError(t('admin.fieldConfig.updateErrorContext', { defaultValue: "Failed to update configuration. Check connection and try again." }));
      throw err; 
    }
  }, [fieldConfigs, t]);

  const contextValue = {
    fieldConfigs,
    loading,
    error,
    isAdmin,
    updateFieldConfig,
    refreshConfigs: loadConfigs,
  };

  return (
    <FieldConfigContext.Provider value={contextValue}>
      {children}
    </FieldConfigContext.Provider>
  );
};