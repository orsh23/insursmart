import React from 'react';
import { Coins } from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TariffsTab from '@/components/tariff-management/tariffs-tab'; // Updated import path
import { useLanguageHook } from '@/components/useLanguageHook';

export default function TariffManagementPage() {
  const { t } = useLanguageHook();
  return (
    <PageLayout>
      <PageHeader
        title={t('pageTitles.tariffManagement', { defaultValue: 'Tariff Management' })}
        description={t('tariffManagement.pageDescription', { defaultValue: 'Manage tariffs, pricing rules, and financial agreements.'})}
        icon={Coins}
      />
      <TariffsTab />
    </PageLayout>
  );
}