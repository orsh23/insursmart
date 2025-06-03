import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguageHook } from '@/components/useLanguageHook';
import GeneralSettingsTab from './GeneralSettingsTab';
import UserManagementTab from './UserManagementTab';
import FieldConfigTab from './FieldConfigTab';
import SystemHealthTab from './SystemHealthTab'; // Import the new SystemHealthTab
import IntegrationsTab from './IntegrationsTab'; // Import the new IntegrationsTab

export default function AdminSettingsTabs() {
  const { t } = useLanguageHook();

  // Define tabs for the admin settings page
  const adminTabs = [
    {
      value: 'general',
      labelKey: 'adminSettings.tabs.general',
      labelDefault: 'General',
      component: <GeneralSettingsTab />,
    },
    {
      value: 'users',
      labelKey: 'adminSettings.tabs.userManagement',
      labelDefault: 'User Management',
      component: <UserManagementTab />,
    },
    {
      value: 'field-config',
      labelKey: 'adminSettings.tabs.fieldConfig',
      labelDefault: 'Field Configuration',
      component: <FieldConfigTab />,
    },
    {
      value: 'system-health',
      labelKey: 'adminSettings.tabs.systemHealth',
      labelDefault: 'System Health',
      component: <SystemHealthTab />, // Use the actual SystemHealthTab component
    },
     {
      value: 'integrations',
      labelKey: 'adminSettings.tabs.integrations',
      labelDefault: 'Integrations',
      component: <IntegrationsTab />, // Use the actual IntegrationsTab component
    },
  ];

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        {adminTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {t(tab.labelKey, { defaultValue: tab.labelDefault })}
          </TabsTrigger>
        ))}
      </TabsList>
      {adminTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4 p-4 md:p-6 bg-white dark:bg-gray-800 rounded-b-lg shadow">
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}