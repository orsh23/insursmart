import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CitiesTab from './CitiesTab';
import StreetsTab from './StreetsTab';
import AddressesTab from './AddressesTab';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function AddressManagementTabs() {
  const { t, isRTL } = useLanguageHook();
  const [activeTab, setActiveTab] = useState("cities");

  const TABS_CONFIG = React.useMemo(() => [
    { value: "cities", labelKey: "addressManagement.tabs.cities", defaultLabel: "Cities", component: <CitiesTab /> },
    { value: "streets", labelKey: "addressManagement.tabs.streets", defaultLabel: "Streets", component: <StreetsTab /> },
    { value: "addresses", labelKey: "addressManagement.tabs.addresses", defaultLabel: "Addresses", component: <AddressesTab /> },
  ], []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"} className="mt-6">
      <TabsList className="mb-4 grid w-full grid-cols-1 sm:grid-cols-3">
        {TABS_CONFIG.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {t(tab.labelKey, {defaultValue: tab.defaultLabel})}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS_CONFIG.map(tab => (
        <TabsContent key={tab.value} value={tab.value}>
          {activeTab === tab.value && tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}