import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { AdminSetting } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner'; // Corrected path
import { useToast } from '@/components/ui/use-toast';

const settingCategories = [
  {
    id: 'system',
    titleKey: 'adminSettings.categories.system',
    defaultTitle: 'System Settings',
    descriptionKey: 'adminSettings.categories.systemDesc',
    defaultDescription: 'Core system configuration options'
  },
  {
    id: 'user',
    titleKey: 'adminSettings.categories.user',
    defaultTitle: 'User Settings',
    descriptionKey: 'adminSettings.categories.userDesc',
    defaultDescription: 'Default user preferences and permissions'
  },
  {
    id: 'feature',
    titleKey: 'adminSettings.categories.feature',
    defaultTitle: 'Feature Settings',
    descriptionKey: 'adminSettings.categories.featureDesc',
    defaultDescription: 'Enable or disable application features'
  },
  {
    id: 'integration',
    titleKey: 'adminSettings.categories.integration',
    defaultTitle: 'Integration Settings',
    descriptionKey: 'adminSettings.categories.integrationDesc',
    defaultDescription: 'External service and API configurations'
  }
];

export default function GeneralSettingsTab() {
  const { t, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [changedSettings, setChangedSettings] = useState(new Set());

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSettings = await AdminSetting.list();
      setSettings(Array.isArray(fetchedSettings) ? fetchedSettings : []);
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      setError(t('adminSettings.errors.loadFailed', { 
        defaultValue: 'Failed to load admin settings. Please try again.' 
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingId, newValue) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, setting_value: newValue }
        : setting
    ));
    setChangedSettings(prev => new Set([...prev, settingId]));
  };

  const handleSaveChanges = async () => {
    if (changedSettings.size === 0) {
      toast({
        title: t('common.noChanges', { defaultValue: 'No Changes' }),
        description: t('adminSettings.noChangesToSave', { 
          defaultValue: 'No settings have been modified.' 
        })
      });
      return;
    }

    try {
      setSaving(true);
      
      // Save only changed settings
      const settingsToSave = settings.filter(setting => changedSettings.has(setting.id));
      
      for (const setting of settingsToSave) {
        await AdminSetting.update(setting.id, {
          setting_value: setting.setting_value
        });
      }

      setChangedSettings(new Set());
      
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('adminSettings.saveSuccess', { 
          count: settingsToSave.length,
          defaultValue: `${settingsToSave.length} setting(s) saved successfully.` 
        })
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('adminSettings.saveError', { 
          defaultValue: 'Failed to save settings. Please try again.' 
        }),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingControl = (setting) => {
    const hasOptions = setting.value_options && setting.value_options.length > 0;
    
    if (hasOptions) {
      return (
        <Select 
          value={setting.setting_value} 
          onValueChange={(value) => handleSettingChange(setting.id, value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {setting.value_options.map(option => (
              <SelectItem key={option} value={option}>
                {t(`adminSettings.options.${option}`, { defaultValue: option })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Boolean settings (assuming true/false string values)
    if (setting.setting_value === 'true' || setting.setting_value === 'false') {
      return (
        <Switch
          checked={setting.setting_value === 'true'}
          onCheckedChange={(checked) => handleSettingChange(setting.id, checked.toString())}
        />
      );
    }

    // Default to text input
    return (
      <Input
        value={setting.setting_value}
        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
        placeholder={t('adminSettings.enterValue', { defaultValue: 'Enter value...' })}
      />
    );
  };

  const groupedSettings = settingCategories.map(category => ({
    ...category,
    settings: settings.filter(setting => setting.setting_type === category.id)
  }));

  if (loading) {
    return (
      <LoadingSpinner 
        message={t('adminSettings.loadingSettings', { defaultValue: 'Loading admin settings...' })} 
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          {t('adminSettings.errors.loadErrorTitle', { defaultValue: 'Settings Load Error' })}
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchSettings} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('buttons.retry', { defaultValue: 'Retry' })}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {t('adminSettings.generalTitle', { defaultValue: 'General Settings' })}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('adminSettings.generalDescription', { 
              defaultValue: 'Configure application-wide settings and preferences.' 
            })}
          </p>
        </div>
        
        {changedSettings.size > 0 && (
          <Button onClick={handleSaveChanges} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {saving 
              ? t('common.saving', { defaultValue: 'Saving...' })
              : t('buttons.saveChanges', { 
                  count: changedSettings.size,
                  defaultValue: `Save Changes (${changedSettings.size})` 
                })
            }
          </Button>
        )}
      </div>

      {groupedSettings.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t(category.titleKey, { defaultValue: category.defaultTitle })}
            </CardTitle>
            <CardDescription>
              {t(category.descriptionKey, { defaultValue: category.defaultDescription })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.settings.length === 0 ? (
              <p className="text-gray-500 italic">
                {t('adminSettings.noSettingsInCategory', { 
                  defaultValue: 'No settings available in this category.' 
                })}
              </p>
            ) : (
              category.settings.map((setting, index) => (
                <div key={setting.id}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center py-3">
                    <div>
                      <Label className="font-medium">
                        {t(`adminSettings.labels.${setting.setting_key}`, { 
                          defaultValue: setting.display_name_en || setting.setting_key 
                        })}
                      </Label>
                      {setting.description_en && (
                        <p className="text-sm text-gray-500 mt-1">
                          {t(`adminSettings.descriptions.${setting.setting_key}`, { 
                            defaultValue: setting.description_en 
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderSettingControl(setting)}
                      {changedSettings.has(setting.id) && (
                        <span className="text-xs text-blue-600 font-medium">
                          {t('common.modified', { defaultValue: 'Modified' })}
                        </span>
                      )}
                    </div>
                  </div>
                  {index < category.settings.length - 1 && <Separator />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}

      {settings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t('adminSettings.noSettingsTitle', { defaultValue: 'No Settings Available' })}
            </h3>
            <p className="text-gray-500">
              {t('adminSettings.noSettingsDescription', { 
                defaultValue: 'No admin settings have been configured yet.' 
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}