import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguageHook } from '@/components/useLanguageHook';
import { Package, ListChecks } from 'lucide-react';

// Import tab components - updated to use canonical locations
import MaterialsTab from './materials-tab'; 
import MaterialsBoMsTab from './boms-tab'; // This is the materials-management version

export default function MaterialsManagementTabs() {
  const { t } = useLanguageHook();

  const tabsConfig = [
    {
      value: 'materials',
      labelKey: 'materialsManagement.tabs.materials',
      defaultLabel: 'Materials',
      icon: Package,
      component: <MaterialsTab />,
    },
    {
      value: 'boms',
      labelKey: 'materialsManagement.tabs.boms',
      defaultLabel: 'Bills of Material',
      icon: ListChecks,
      component: <MaterialsBoMsTab />,
    },
  ];

  return (
    <Tabs defaultValue="materials" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:max-w-md mb-4">
        {tabsConfig.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
            <tab.icon className="h-4 w-4 mr-2" />
            {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabsConfig.map(tab => (
        <TabsContent key={tab.value} value={tab.value}>
          {!tab.disabled ? tab.component : <p className="p-4 text-center text-gray-500">{t('common.featureComingSoon', {defaultValue: `${t(tab.labelKey, {defaultValue: tab.defaultLabel})} management is coming soon!`})}</p>}
        </TabsContent>
      ))}
    </Tabs>
  );
}