import React from 'react';

// Simplified CalendarView
export default function TaskCalendarView({
  tasks = [],
  onTaskClick
}) {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  if (!Array.isArray(tasks)) {
    return <p>Error: Tasks data not an array for Calendar.</p>
  }

  const tasksForDate = tasks.filter(task => task && task.due_date === selectedDate);

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px' }}>
      <h3>Calendar View (Simplified)</h3>
      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      <h4>Tasks for {selectedDate}:</h4>
      {tasksForDate.length > 0 ? (
        <ul>
          {tasksForDate.map(task => (
            <li key={task.id} onClick={() => typeof onTaskClick === 'function' ? onTaskClick(task) : null} style={{cursor: 'pointer'}}>
              {task.title}
            </li>
          ))}
        </ul>
      ) : (
        <p>No tasks for this date.</p>
      )}
    </div>
  );
}