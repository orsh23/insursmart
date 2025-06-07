import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/components/store/useAppStore';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useAppStore();
  const { t } = useLanguageHook();

  const toggleTheme = () => {
    if (typeof setTheme === 'function') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={t('themeSwitcher.toggleTheme', { defaultValue: 'Toggle theme' })}
      aria-label={t('themeSwitcher.toggleTheme', { defaultValue: 'Toggle theme' })}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 transition-all" />
      ) : (
        <Moon className="h-5 w-5 transition-all" />
      )}
    </Button>
  );
}