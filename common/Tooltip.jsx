import React, { useState } from 'react';

export default function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 300,
  maxWidth = '200px',
  className = '' 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  
  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };
  
  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };
  
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-2'
  };
  
  const arrows = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800'
  };
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 ${positions[position]}`}>
          <div className="relative">
            <div
              className="bg-gray-800 text-white text-sm rounded-md py-1 px-2"
              style={{ maxWidth }}
            >
              {content}
            </div>
            <div className={`absolute w-0 h-0 border-4 border-transparent ${arrows[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}