import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Search } from "lucide-react";

export default function SmartSearch({
  onSearch,
  placeholder = "Search...",
  language = "en",
  suggestions = [],
  initialQuery = ""
}) {
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const isRTL = language === "he" || language === "ar";
  
  // Memoize filtered suggestions to prevent unnecessary calculations
  const filteredSuggestions = useMemo(() => {
    if (!query || !suggestions.length) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10); // Limit results for performance
  }, [query, suggestions]);

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers with useCallback to prevent unnecessary re-renders
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0 && suggestions.length > 0);
  }, [suggestions]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSearch(query);
    setShowSuggestions(false);
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onSearch]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  }, [onSearch]);

  const handleKeyDown = useCallback((e) => {
    // Handle keyboard navigation for accessibility
    if (!showSuggestions || !filteredSuggestions.length) return;
    
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, filteredSuggestions]);

  return (
    <div 
      ref={searchRef} 
      className="relative" 
      dir={isRTL ? "rtl" : "ltr"}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center">
          <div className={`absolute inset-y-0 ${isRTL ? 'right-0' : 'left-0'} flex items-center ${isRTL ? 'pr-3' : 'pl-3'}`}>
            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(query.length > 0 && suggestions.length > 0)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-controls={showSuggestions ? "search-suggestions" : undefined}
            aria-expanded={showSuggestions}
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={`absolute inset-y-0 ${isRTL ? 'left-0' : 'right-0'} flex items-center ${isRTL ? 'pl-3' : 'pr-3'}`}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </form>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          id="search-suggestions"
          className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
          role="listbox"
        >
          <ul className="py-1">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
                role="option"
                aria-selected={false}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}