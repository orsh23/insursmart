import React from 'react';

// Simplified task card with minimal functionality
export default function SimpleTaskCard({ task, onClick }) {
  if (!task) return null;

  return (
    <div 
      onClick={() => onClick && onClick(task)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="font-medium">{task.title}</h3>
      
      {task.description && (
        <p className="text-sm text-gray-600 mt-2">
          {task.description.length > 100 
            ? `${task.description.substring(0, 100)}...` 
            : task.description}
        </p>
      )}
    </div>
  );
}