import React, { useState } from 'react';
    import { FileCode2 as CodeManagementIcon } from 'lucide-react';
    import { useLanguageHook } from '@/components/useLanguageHook'; // Corrected import to useLanguageHook
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

    import MedicalCodesTab from '@/components/code-management/medical-codes-tab';
    import InternalCodesTab from '@/components/code-management/internal-codes-tab';
    import ProviderCodesTab from '@/components/code-management/provider-codes-tab';
    import InsuranceCodesTab from '@/components/code-management/insurance-codes-tab';
    import CrosswalksTab from '@/components/code-management/crosswalks-tab';
    import BoMsTab from '@/components/code-management/boms-tab';
    import DiagnosisProcedureMappingTab from '@/components/code-management/DiagnosisProcedureMappingTab'; // Added import


    export default function CodeManagementPageContent() { 
      const { t, isRTL, language } = useLanguageHook(); // Used useLanguageHook
      const [activeTab, setActiveTab] = useState("medical-codes"); 

      const TABS_CONFIG = React.useMemo(() => [ // Wrapped in useMemo and added language dependency
        { value: "medical-codes", labelKey: "codeManagement.tabs.medicalCodes", defaultLabel: "Medical Codes", component: <MedicalCodesTab /> },
        { value: "internal-codes", labelKey: "codeManagement.tabs.internalCodes", defaultLabel: "Internal Codes", component: <InternalCodesTab /> },
        { value: "provider-codes", labelKey: "codeManagement.tabs.providerCodes", defaultLabel: "Provider Codes", component: <ProviderCodesTab /> },
        { value: "insurance-codes", labelKey: "codeManagement.tabs.insuranceCodes", defaultLabel: "Insurance Codes", component: <InsuranceCodesTab /> },
        { value: "diagnosis-procedure-mapping", labelKey: "codeManagement.tabs.dxPxMapping", defaultLabel: "Dx <> Px Mapping", component: <DiagnosisProcedureMappingTab /> }, // Added new tab
        { value: "boms", labelKey: "codeManagement.tabs.boms", defaultLabel: "Bills of Material", component: <BoMsTab /> }, // This is BillOfMaterial entity
        { value: "crosswalks", labelKey: "codeManagement.tabs.crosswalks", defaultLabel: "Crosswalks", component: <CrosswalksTab /> },
      ], [language]); // Added language as dependency for t to update labels

      // Removed languageLoading check as useLanguageHook doesn't typically provide it.
      // Loading states should be handled within individual tabs if needed.

      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"} className="mt-6">
          <TabsList className="mb-4 overflow-x-auto pb-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7"> {/* Adjusted grid for more tabs */}
            {TABS_CONFIG.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="whitespace-nowrap text-xs sm:text-sm">
                {t(tab.labelKey, {defaultValue: tab.defaultLabel})}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS_CONFIG.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              {/* Render component only if it's the active tab to avoid unnecessary mounts/fetches */}
              {activeTab === tab.value && tab.component}
            </TabsContent>
          ))}
        </Tabs>
      );
    }