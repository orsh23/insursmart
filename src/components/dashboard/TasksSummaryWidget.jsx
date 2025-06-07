import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Task } from '@/api/entities';
import { ArrowRight, ArrowLeft, CheckCircle2, Circle, ArrowUpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '../common/LoadingSpinner';

export default function TasksSummaryWidget({ language = "en" }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRTL = language === "he";
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await Task.list("-created_date", 5);
        setTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);
  
  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <ArrowUpCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };
  
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">
          {isRTL ? "גבוהה" : "High"}
        </Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">
          {isRTL ? "בינונית" : "Medium"}
        </Badge>;
      case "low":
      default:
        return <Badge className="bg-blue-100 text-blue-800">
          {isRTL ? "נמוכה" : "Low"}
        </Badge>;
    }
  };
  
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-full">
        <h3 className="font-medium mb-4">
          {isRTL ? "משימות אחרונות" : "Recent Tasks"}
        </h3>
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4 h-full" dir={isRTL ? "rtl" : "ltr"}>
      <h3 className="font-medium mb-4">
        {isRTL ? "משימות אחרונות" : "Recent Tasks"}
      </h3>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {isRTL ? "אין משימות להצגה" : "No tasks to display"}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="border-b pb-3 last:border-0">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    {getPriorityBadge(task.priority)}
                    {task.category && (
                      <Badge variant="outline">
                        {task.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Link 
        to={createPageUrl("Tasks")}
        className="flex items-center justify-end mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <span>{isRTL ? "כל המשימות" : "All Tasks"}</span>
        <ArrowIcon className="h-4 w-4 ml-1" />
      </Link>
    </div>
  );
}