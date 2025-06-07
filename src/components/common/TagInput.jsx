import React, { useState, useCallback } from 'react';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Badge } from '@/components/ui/badge';
    import { X as XIcon, Tag } from 'lucide-react'; // Corrected import for X
    import { useLanguageHook } from '@/components/useLanguageHook';

    export default function TagInput({
      tags = [], // Default to empty array if undefined
      onTagsChange,
      placeholder = "Add a tag...",
      className = "",
      maxTags,
      disabled = false,
    }) {
      const { t } = useLanguageHook();
      const [inputValue, setInputValue] = useState('');

      const effectivePlaceholder = placeholder === "Add a tag..." 
        ? t('tagInput.addTagPlaceholder', { defaultValue: 'Add a tag...' }) 
        : placeholder;

      const handleInputChange = (e) => {
        setInputValue(e.target.value);
      };

      const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addTag();
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
          removeTag(tags.length - 1);
        }
      };

      const addTag = useCallback(() => {
        const newTag = inputValue.trim();
        if (newTag && (!tags.includes(newTag) || tags === undefined)) { // Check if tags is undefined
          if (maxTags && tags.length >= maxTags) {
            // Optionally, show a message or toast that max tags reached
            console.warn(`Max tags (${maxTags}) reached.`);
            return;
          }
          onTagsChange([...(tags || []), newTag]); // Ensure tags is an array
        }
        setInputValue('');
      }, [inputValue, tags, onTagsChange, maxTags]);

      const removeTag = (indexToRemove) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
      };

      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center gap-2 p-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
            <Tag className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="flex flex-wrap gap-1 flex-grow">
              {Array.isArray(tags) && tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
                  {tag}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      aria-label={t('tagInput.removeTagAria', { defaultValue: `Remove ${tag}`})}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={tags.length === 0 ? effectivePlaceholder : ''}
                className="flex-grow h-full p-0 border-none shadow-none focus:ring-0 focus:outline-none min-w-[100px]"
                disabled={disabled || (maxTags && tags.length >= maxTags)}
              />
            </div>
            {!disabled && inputValue && (
              <Button type="button" size="sm" onClick={addTag} variant="ghost" className="flex-shrink-0">
                {t('tagInput.addButton', { defaultValue: 'Add' })}
              </Button>
            )}
          </div>
          {maxTags && (
             <p className="text-xs text-muted-foreground">
                {t('tagInput.tagLimit', { defaultValue: `You can add up to ${maxTags} tags. (${tags.length}/${maxTags})` })}
             </p>
          )}
        </div>
      );
    }