import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguageHook } from '@/components/useLanguageHook';
import InsuredPersonsTab from './InsuredPersonsTab'; // Removed .jsx
import PoliciesTab from './PoliciesTab'; // Removed .jsx
import PolicyLinkageTab from './PolicyLinkageTab'; // Removed .jsx
import PolicyConfigTab from './PolicyConfigTab'; 
import ContractsTab from './ContractsTab'; 
import TariffsTab from './TariffsTab'; 
import InsuranceCodesTab from './InsuranceCodesTab'; 

export default function InsuranceManagementTabs() {
  const { t } = useLanguageHook();
  const [activeTab, setActiveTab] = useState('insured-persons');

  const tabs = [
    { id: 'insured-persons', labelKey: 'insurance.tabs.insuredPersons', defaultLabel: 'Insured Persons', component: InsuredPersonsTab },
    { id: 'policies', labelKey: 'insurance.tabs.policies', defaultLabel: 'Policies', component: PoliciesTab },
    { id: 'policy-linkage', labelKey: 'insurance.tabs.policyLinkage', defaultLabel: 'Policy Linkage', component: PolicyLinkageTab },
    { id: 'policy-config', labelKey: 'insurance.tabs.policyConfig', defaultLabel: 'Policy Configuration', component: PolicyConfigTab },
    { id: 'contracts', labelKey: 'insurance.tabs.contracts', defaultLabel: 'Insurance Contracts', component: ContractsTab },
    { id: 'tariffs', labelKey: 'insurance.tabs.tariffs', defaultLabel: 'Tariffs', component: TariffsTab },
    { id: 'codes', labelKey: 'insurance.tabs.codes', defaultLabel: 'Insurance Codes', component: InsuranceCodesTab }
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs px-1 sm:text-sm">
              {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => {
          const TabComponent = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <TabComponent />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}