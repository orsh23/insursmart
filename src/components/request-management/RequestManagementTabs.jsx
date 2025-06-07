import React from 'react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import RFCTab from './RFCTab';
    import ClaimsTab from './ClaimsTab'; // Import the actual ClaimsTab
    import { useLanguageHook } from '@/components/useLanguageHook';
    import { FileText, Receipt } from 'lucide-react'; // Icons for tabs

    export default function RequestManagementTabs() {
      const { t } = useLanguageHook();

      return (
        <Tabs defaultValue="rfcs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:max-w-md mb-4">
            <TabsTrigger value="rfcs">
              <FileText className="h-4 w-4 mr-2" />
              {t('requestManagement.tabs.rfcs', {defaultValue: "RFCs"})}
            </TabsTrigger>
            <TabsTrigger value="claims"> {/* Claims tab enabled */}
              <Receipt className="h-4 w-4 mr-2" />
              {t('requestManagement.tabs.claims', {defaultValue: "Claims"})}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="rfcs">
            <RFCTab />
          </TabsContent>
          <TabsContent value="claims">
            <ClaimsTab /> {/* Use the actual ClaimsTab component */}
          </TabsContent>
        </Tabs>
      );
    }