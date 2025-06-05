import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useTranslation } from '@/utils/i18n';

export default function FilterToggle({
  isOpen,
  onToggle,
  hasFilters = false,
  onReset
}) {
  const { t } = useTranslation();
  
  return (
    <div className="flex gap-2">
      <Button
        variant={isOpen ? "default" : "outline"}
        onClick={onToggle}
        size="sm"
      >
        <Filter className="h-4 w-4 mr-2" />
        {t('common.filter')}
      </Button>
      
      {hasFilters && (
        <Button
          variant="ghost"
          onClick={onReset}
          size="sm"
        >
          <X className="h-4 w-4 mr-2" />
          {t('common.reset')}
        </Button>
      )}
    </div>
  );
}