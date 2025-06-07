import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function LanguageSwitcher() {
  const { language, setLanguage, t, isRTL } = useLanguageHook();

  const handleLanguageChange = (lang) => {
    if (typeof setLanguage === 'function') {
      setLanguage(lang);
    }
  };

  return (
    <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          title={t('languageSwitcher.changeLanguage', { defaultValue: 'Change language' })}
          aria-label={t('languageSwitcher.changeLanguage', { defaultValue: 'Change language' })}
        >
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('en')}
          disabled={language === 'en'}
          className={language === 'en' ? 'font-semibold bg-gray-100 dark:bg-gray-700' : ''}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('he')}
          disabled={language === 'he'}
          className={language === 'he' ? 'font-semibold bg-gray-100 dark:bg-gray-700' : ''}
        >
          עברית
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}