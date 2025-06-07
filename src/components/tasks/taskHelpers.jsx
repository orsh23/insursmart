import React from 'react';
import { Circle, ArrowUpCircle, CheckCircle2, Clock, AlertTriangle, Zap } from 'lucide-react'; // Added more icons

export const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border border-red-200 dark:border-red-600/50';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-600/50';
    case 'low':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border border-blue-200 dark:border-blue-600/50';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'todo':
      return Circle;
    case 'in_progress':
      return ArrowUpCircle; // Could also be Clock for "pending" or "in progress"
    case 'done':
      return CheckCircle2;
    default:
      return Circle;
  }
};

export const getCategoryStyles = (category) => {
  switch (category) {
    case 'work':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-600/50';
    case 'personal':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300 border border-purple-200 dark:border-purple-600/50';
    case 'shopping':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-300 border border-pink-200 dark:border-pink-600/50';
    case 'health':
      return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border border-green-200 dark:border-green-600/50';
    case 'learning':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300 border border-sky-200 dark:border-sky-600/50';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50';
  }
};