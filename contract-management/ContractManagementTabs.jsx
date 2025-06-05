import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguageHook } from '@/components/useLanguageHook';
import ContractsTab from './contracts-tab'; // Updated import path

export default function ContractManagementTabs() {
  const { t } = useLanguageHook();
  const [activeTab, setActiveTab] = useState('contracts');

  // Define your tabs here
  const tabs = [
    {
      id: 'contracts',
      label: t('contracts.tabs.contracts', { defaultValue: 'Contracts' }),
      component: ContractsTab
    },
    // {
    //   id: 'templates',
    //   label: t('contracts.tabs.templates', { defaultValue: 'Templates' }),
    //   component: TemplatesTab // Create this component when ready
    // },
    // {
    //   id: 'history',
    //   label: t('contracts.tabs.history', { defaultValue: 'History' }),
    //   component: ContractHistoryTab // Create this component when ready
    // }
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => {
          const TabComponent = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              { TabComponent ? <TabComponent /> : <p>{t('common.tabContentComingSoon', {defaultValue: 'Content for this tab is coming soon.'})}</p>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}