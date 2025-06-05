import React from 'react';
    import { FileCode2 } from 'lucide-react';
    import PageLayout from '@/components/common/PageLayout';
    import PageHeader from '@/components/common/PageHeader';
    import CodeManagementPageContent from '@/components/code-management/code-management-page'; // Updated import path
    import { useLanguageHook } from '@/components/useLanguageHook';

    export default function CodeManagementPage() {
      const { t } = useLanguageHook();
      return (
        <PageLayout>
          <PageHeader
            title={t('pageTitles.codeManagement', { defaultValue: 'Code Management' })}
            description={t('codeManagement.pageDescription', { defaultValue: 'Manage medical, internal, provider codes, and their mappings.'})}
            icon={FileCode2}
          />
          <CodeManagementPageContent />
        </PageLayout>
      );
    }