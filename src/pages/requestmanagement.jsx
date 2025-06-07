
import React from 'react';
    import { FileText } from 'lucide-react';
    import PageLayout from '@/components/common/PageLayout';
    import PageHeader from '@/components/common/PageHeader';
    import RequestManagementTabs from '@/components/request-management/RequestManagementTabs';
    import { useLanguageHook } from '@/components/useLanguageHook';

    export default function RequestManagementPage() {
      const { t } = useLanguageHook();
      return (
        <PageLayout>
          <PageHeader
            title={t('pageTitles.requestManagement', { defaultValue: 'Request Management' })}
            description={t('requestManagement.pageDescription', { defaultValue: 'Manage Requests for Commitment (RFCs) and Claims.'})}
            icon={FileText}
          />
          <RequestManagementTabs />
        </PageLayout>
      );
    }
