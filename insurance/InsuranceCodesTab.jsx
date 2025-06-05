import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function InsuranceCodesTab() {
  const { t } = useLanguageHook();
  return <ComingSoonCard title={t('insurance.tabs.codes', {defaultValue: "Insurance Codes"})} />;
}