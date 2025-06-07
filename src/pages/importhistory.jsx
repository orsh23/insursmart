
import React from 'react';
import { ListOrdered } from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import ImportHistoryTab from '@/components/import-history/ImportHistoryTab';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function ImportHistoryPage() {
  const { t } = useLanguageHook();
  return (
    <PageLayout>
      <PageHeader
        title={t('pageTitles.importHistory', { defaultValue: 'Import History' })}
        description={t('importHistory.pageDescription', { defaultValue: 'Review history and status of data imports.'})}
        icon={ListOrdered}
      />
      <ImportHistoryTab />
    </PageLayout>
  );
}
