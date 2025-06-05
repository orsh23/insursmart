import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import ComingSoonCard from '@/components/common/ComingSoonCard';
import { FolderTree } from 'lucide-react';

export default function MaterialCategoriesTab() {
  const { t } = useLanguageHook();
  return (
    <ComingSoonCard 
      icon={FolderTree}
      title={t('materials.categoriesTabTitle', {defaultValue: "Material Categories"})}
      message={t('materials.categoriesTabMessage', {defaultValue: "Organize materials into a hierarchical catalog for better management and filtering. This section is under development."})}
    />
  );
}