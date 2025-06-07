import React from 'react';
import { Card } from '../ui/card';
import { cn } from '../utils/cn'; // Fixed import path

export default function DashboardMetricsCard({ 
  title, 
  value, 
  icon: Icon, 
  onClick, 
  highlight = false,
  trend,
  trendValue,
}) {
  return (
    <Card 
      className={cn(
        "p-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-all",
        highlight ? "border-amber-300 bg-amber-50" : ""
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          
          {trend && (
            <div className={cn(
              "flex items-center text-xs mt-2",
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {/* Add trend icon here if desired */}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            "p-2 rounded-full",
            highlight ? "bg-amber-100" : "bg-blue-100"
          )}>
            <Icon className={cn(
              "h-5 w-5", 
              highlight ? "text-amber-600" : "text-blue-600"
            )} />
          </div>
        )}
      </div>
      
      {/* Optional background decoration */}
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
        {Icon && <Icon className="h-16 w-16 -mr-2 -mb-2" />}
      </div>
    </Card>
  );
}