import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Ensure Badge component is correctly exported and imported
import { useLanguageHook } from '@/components/useLanguageHook';

export default function TagInput({ 
  tags = [], 
  setTags, 
  placeholder = "Add a tag...", 
  suggestions = [],
  disabled = false,
  className = ""
}) {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const { t } = useLanguageHook();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value && suggestions.length > 0) {
      setFilteredSuggestions(
        suggestions.filter(
          (suggestion) =>
            suggestion.toLowerCase().includes(value.toLowerCase()) &&
            !tags.includes(suggestion)
        )
      );
    } else {
      setFilteredSuggestions([]);
    }
  };

  const addTag = (tagToAdd) => {
    const newTag = tagToAdd.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInputValue('');
    setFilteredSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === ',' && inputValue) {
      e.preventDefault();
      addTag(inputValue.slice(0,-1)); // Add tag without the comma
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!disabled && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-grow"
          />
          <Button type="button" onClick={() => addTag(inputValue)} disabled={!inputValue.trim() || disabled} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      {filteredSuggestions.length > 0 && !disabled && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2 max-h-32 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              type="button"
              key={index}
              onClick={() => addTag(suggestion)}
              className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
            {tag}
            {!disabled && (
              <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
         {tags.length === 0 && disabled && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.notSet')}</p>
        )}
      </div>
    </div>
  );
}