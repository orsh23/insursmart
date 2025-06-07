
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguageHook } from '@/components/useLanguageHook';
import MedicalCodesTab from './MedicalCodesTab';
import InternalCodesTab from './InternalCodesTab';
import ProviderCodesTab from './ProviderCodesTab';
import CrosswalksTab from './CrosswalksTab'; // Import the new CrosswalksTab
// Placeholders for other tabs
// import InsuranceCodesTab from './InsuranceCodesTab';
// import DiagnosisProcedureRelationTab from './DiagnosisProcedureRelationTab';
// import CodeCategoriesTab from './CodeCategoriesTab';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function CodeManagementTabs() {
  const { t } = useLanguageHook();

  const codeTabs = [
    {
      value: 'medical-codes',
      labelKey: 'codeManagement.tabs.medicalCodes',
      labelDefault: 'Medical Codes',
      component: <MedicalCodesTab />,
    },
    {
      value: 'internal-codes',
      labelKey: 'codeManagement.tabs.internalCodes',
      labelDefault: 'Internal Codes',
      component: <InternalCodesTab />,
    },
    {
      value: 'provider-codes',
      labelKey: 'codeManagement.tabs.providerCodes',
      labelDefault: 'Provider Codes',
      component: <ProviderCodesTab />,
    },
    {
      value: 'crosswalks',
      labelKey: 'codeManagement.tabs.crosswalks',
      labelDefault: 'Crosswalks',
      component: <CrosswalksTab />, // Use the actual CrosswalksTab component
    },
    {
      value: 'insurance-codes',
      labelKey: 'codeManagement.tabs.insuranceCodes',
      labelDefault: 'Insurance Codes',
      component: <ComingSoonCard title={t('codeManagement.insuranceCodes.title', {defaultValue: "Insurance Code Management"})} message={t('codeManagement.insuranceCodes.message', {defaultValue: "Manage specific insurance codes and their properties. This section is under development."})} />,
    },
    {
      value: 'diagnosis-procedure-relations',
      labelKey: 'codeManagement.tabs.diagProcRelations',
      labelDefault: 'Diag-Proc Relations',
      component: <ComingSoonCard title={t('codeManagement.diagProcRelations.title', {defaultValue: "Diagnosis-Procedure Relations"})} message={t('codeManagement.diagProcRelations.message', {defaultValue: "Define and manage relationships between diagnosis and procedure codes. This section is under development."})} />,
    },
    // {
    //   value: 'categories',
    //   labelKey: 'codeManagement.tabs.categories',
    //   labelDefault: 'Categories',
    //   component: <ComingSoonCard title={t('codeManagement.categories.title', {defaultValue: "Code Categories Management"})} message={t('codeManagement.categories.message', {defaultValue: "Manage the hierarchical catalog for all code types. This section is under development."})} />,
    // },
  ];

  return (
    <Tabs defaultValue="medical-codes" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"> {/* Adjusted grid for more tabs */}
        {codeTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {t(tab.labelKey, { defaultValue: tab.labelDefault })}
          </TabsTrigger>
        ))}
      </TabsList>
      {codeTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4 p-0 md:p-0"> {/* Removed padding from TabsContent as individual tabs handle it */}
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
