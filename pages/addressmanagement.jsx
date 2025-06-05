import React, { useState } from 'react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { MapPin } from 'lucide-react';
import AddressManagementTabs from '@/components/address-management/AddressManagementTabs';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function AddressManagementPage() {
  const { t } = useLanguageHook();

  return (
    <PageLayout>
      <PageHeader
        title={t('pageTitles.addressManagement', { defaultValue: 'Address Management' })}
        description={t('addressManagement.pageDescription', { defaultValue: 'Manage cities, streets, and addresses.'})}
        icon={MapPin}
      />
      <AddressManagementTabs />
    </PageLayout>
  );
}