import React from "react";
import { 
  Filter, 
  CalendarRange, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowDownAZ
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import SmartFilter from "../common/SmartFilter";

export default function RegulationFilter({
  filters,
  onFilterChange,
  language = "en"
}) {
  const isRTL = language === "he";

  const typeOptions = [
    { value: "all", label: "All Types", labelHe: "כל הסוגים" },
    { value: "Insurance", label: "Insurance", labelHe: "ביטוח" },
    { value: "Healthcare", label: "Healthcare", labelHe: "בריאות" },
    { value: "Internal", label: "Internal", labelHe: "פנימי" },
    { value: "Legal", label: "Legal", labelHe: "משפטי" },
    { value: "Other", label: "Other", labelHe: "אחר" }
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses", labelHe: "כל הסטטוסים" },
    { value: "active", label: "Active", labelHe: "פעיל" },
    { value: "inactive", label: "Inactive", labelHe: "לא פעיל" }
  ];

  const dateRangeOptions = [
    { value: "all", label: "All Dates", labelHe: "כל התאריכים" },
    { value: "current", label: "Currently Active", labelHe: "פעיל כעת" },
    { value: "upcoming", label: "Upcoming", labelHe: "עתידי" },
    { value: "expired", label: "Expired", labelHe: "פג תוקף" }
  ];

  const sortOptions = [
    { 
      value: "effective_date", 
      label: "Effective Date", 
      labelHe: "תאריך תחילת תוקף" 
    },
    { 
      value: "title", 
      label: "Title", 
      labelHe: "כותרת" 
    },
    { 
      value: "regulation_type", 
      label: "Regulation Type", 
      labelHe: "סוג תקנה" 
    }
  ];

  const handleChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <Filter className="mr-2 h-4 w-4 text-gray-500" />
          <span className="font-medium">
            {isRTL ? "סנן תקנות" : "Filter Regulations"}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SmartFilter
            label="Regulation Type"
            labelHe="סוג תקנה"
            options={typeOptions}
            value={filters.type}
            onChange={(value) => handleChange("type", value)}
            language={language}
          />
          
          <SmartFilter
            label="Status"
            labelHe="סטטוס"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => handleChange("status", value)}
            language={language}
          />
          
          <SmartFilter
            label="Date Range"
            labelHe="טווח תאריכים"
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={(value) => handleChange("dateRange", value)}
            language={language}
          />
          
          <SmartFilter
            label="Sort By"
            labelHe="מיון לפי"
            options={sortOptions}
            value={filters.sort}
            onChange={(value) => handleChange("sort", value)}
            language={language}
          />
        </div>
      </CardContent>
    </Card>
  );
}