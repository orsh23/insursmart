import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // For multiline
import { Label } from '@/components/ui/label';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function BilingualInput({
  id,
  valueEn,
  valueHe,
  onChange, // (baseId, lang, value) => void
  labelEn,
  labelHe,
  placeholderEn,
  placeholderHe,
  errorEn,
  errorHe,
  required = false,
  multiline = false,
  className = "",
  inputClassName = "",
  disabled = false
}) {
  const { t, isRTL } = useLanguageHook();
  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Label htmlFor={`${id}-en`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {labelEn || t('bilingual.labelEn', { defaultValue: 'English' })} {required && <span className="text-red-500">*</span>}
        </Label>
        <InputComponent
          id={`${id}-en`}
          dir="ltr"
          value={valueEn || ""}
          onChange={(e) => onChange(id, 'en', e.target.value)}
          placeholder={placeholderEn || t('bilingual.placeholderEn', { defaultValue: 'Enter text in English' })}
          className={`mt-1 ${inputClassName} ${errorEn ? 'border-red-500 dark:border-red-500' : ''}`}
          disabled={disabled}
          rows={multiline ? 3 : undefined}
        />
        {errorEn && <p className="mt-1 text-xs text-red-500">{errorEn}</p>}
      </div>
      <div>
        <Label htmlFor={`${id}-he`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {labelHe || t('bilingual.labelHe', { defaultValue: 'עברית (Hebrew)' })} {required && <span className="text-red-500">*</span>}
        </Label>
        <InputComponent
          id={`${id}-he`}
          dir="rtl"
          value={valueHe || ""}
          onChange={(e) => onChange(id, 'he', e.target.value)}
          placeholder={placeholderHe || t('bilingual.placeholderHe', { defaultValue: 'הזן טקסט בעברית' })}
          className={`mt-1 ${inputClassName} ${errorHe ? 'border-red-500 dark:border-red-500' : ''}`}
          disabled={disabled}
          rows={multiline ? 3 : undefined}
        />
        {errorHe && <p className="mt-1 text-xs text-red-500">{errorHe}</p>}
      </div>
    </div>
  );
}