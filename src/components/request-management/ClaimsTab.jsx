import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function ClaimsTab() {
  const { t } = useLanguageHook();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('requestManagement.tabs.claims', { defaultValue: "Claims" })}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{t('common.featureComingSoonMessage', { defaultValue: "This feature is under construction. Please check back later." })}</p>
      </CardContent>
    </Card>
  );
}