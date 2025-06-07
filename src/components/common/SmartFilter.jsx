import React from 'react';

export default function SmartFilter({
  label,
  labelHe,
  options,
  value,
  onChange,
  language = "en",
  className = ""
}) {
  const isRTL = language === "he";
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {isRTL ? labelHe || label : label}
      </label>
      
      <select
        value={value || "all"}
        onChange={handleChange}
        className="w-full border rounded-md p-2 bg-white"
      >
        <option value="all">
          {isRTL ? `כל ה${labelHe || label}` : `All ${label}`}
        </option>
        
        {Array.isArray(options) && options.map((option, index) => (
          <option key={index} value={option.value}>
            {isRTL ? option.labelHe || option.label : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}