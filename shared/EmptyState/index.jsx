// Ensure this file exists if components/shared/EmptyState is used
import React from 'react';
import { Inbox } from 'lucide-react'; // Assuming lucide-react is stable

export default function EmptyState({
  title = "No Data",
  message = "There is nothing to show here.",
  icon: Icon = Inbox,
  actionButton = null
}) {
  return (
    <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', margin: '20px 0' }}>
      <Icon style={{ width: '48px', height: '48px', color: '#aaa', marginBottom: '15px' }} />
      <h3>{title}</h3>
      <p>{message}</p>
      {actionButton && <div style={{marginTop: '15px'}}>{actionButton}</div>}
    </div>
  );
}