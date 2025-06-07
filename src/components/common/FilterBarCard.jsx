import React from 'react';

const FilterBarCard = ({ children, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 ${className}`}>
      {children}
    </div>
  );
};

export default FilterBarCard;