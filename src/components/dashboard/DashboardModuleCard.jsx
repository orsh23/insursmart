import React from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../utils/cn'; // Fixed import path

export default function DashboardModuleCard({
  title,
  description,
  icon: Icon,
  metrics = [],
  onClick,
  variant = 'default',
}) {
  const { isRTL } = useLanguage();
  
  const backgrounds = {
    default: 'bg-white hover:bg-slate-50',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    muted: 'bg-muted hover:bg-muted/80',
  };

  // Ensure metrics is always an array
  const safeMetrics = Array.isArray(metrics) ? metrics : [];
  
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all hover:shadow-md",
        backgrounds[variant]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-full bg-blue-100">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <h3 className="font-medium">{title}</h3>
        </div>
        
        {description && <p className="text-muted-foreground text-sm mt-2">{description}</p>}
        
        {safeMetrics.length > 0 && (
          <div className="flex gap-4 mt-3">
            {safeMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <p className="text-xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className={cn(
        "p-2 px-4 bg-muted/50 flex justify-end items-center border-t text-sm font-medium",
        isRTL ? "flex-row-reverse" : ""
      )}>
        <span>{isRTL ? 'פתח' : 'Open'}</span>
        <ArrowRight className={cn("h-4 w-4 ml-1", isRTL && "rotate-180 mr-1 ml-0")} />
      </CardFooter>
    </Card>
  );
}