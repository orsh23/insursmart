import React from 'react';
import SimpleTaskCard from './SimpleTaskCard';

export default function TaskKanbanView({ tasks = [], onStatusChange, onTaskClick }) {
  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done')
  };

  const columnTitles = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Object.keys(columns).map(column => (
        <div 
          key={column}
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            minHeight: '50vh'
          }}
        >
          <h3 
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{columnTitles[column]}</span>
            <span style={{
              backgroundColor: '#e5e7eb', 
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '14px'
            }}>
              {columns[column].length}
            </span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {columns[column].length === 0 ? (
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px dashed #d1d5db',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px'
              }}>
                No tasks
              </div>
            ) : (
              columns[column].map(task => (
                <SimpleTaskCard
                  key={task.id}
                  task={task}
                  onClick={onTaskClick}
                  onStatusChange={onStatusChange}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}