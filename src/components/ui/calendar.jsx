import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";
import { buttonVariants } from "@/components/ui/button";

// Simplified Calendar implementation - you may need to expand this
export function Calendar({ className, mode = "single", selected, onSelect, ...props }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get days in the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Generate days grid
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);  // Empty slots before the first day
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth, i));
  }
  
  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Go to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  // Go to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  // Check if a date is selected
  const isSelected = (date) => {
    if (!date || !selected) return false;
    if (Array.isArray(selected)) {
      return selected.some(selectedDate => 
        selectedDate && date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    }
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };
  
  // Check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex justify-between items-center mb-2">
        <button onClick={prevMonth} className="p-1">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </button>
        <div className="font-medium">{monthNames[currentMonth]} {currentYear}</div>
        <button onClick={nextMonth} className="p-1">
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day, i) => (
          <div key={i} className="text-xs text-center font-medium py-1">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className="text-center p-0">
            {day ? (
              <button
                onClick={() => onSelect(day)}
                className={cn(
                  buttonVariants({variant: "ghost"}),
                  "h-8 w-8 p-0 font-normal",
                  isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isToday(day) && "border border-primary",
                  "rounded-full"
                )}
              >
                {day.getDate()}
              </button>
            ) : <div className="h-8 w-8" />}
          </div>
        ))}
      </div>
    </div>
  );
}