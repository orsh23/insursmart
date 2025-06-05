
import React from 'react';
import { Package } from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import MaterialsManagementTabs from '@/components/materials-management/materials-management-tabs'; // Renamed import
import { useLanguageHook } from '@/components/useLanguageHook';

export default function MaterialsManagementPage() {
  const { t } = useLanguageHook();
  return (
    <PageLayout>
      <PageHeader
        title={t('pageTitles.materialsManagement', { defaultValue: 'Materials Management' })}
        description={t('materialsManagement.pageDescription', { defaultValue: 'Manage materials, categories, and Bill of Materials (BoMs).'})}
        icon={Package}
      />
      <MaterialsManagementTabs />
    </PageLayout>
  );
}
