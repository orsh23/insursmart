import { useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '@/components/ui/button';
import { ListFilter, LayoutKanban, Calendar } from 'lucide-react';

export function useTaskViews(language = "en") {
  const isRTL = language === "he";
  const { taskView, setTaskView } = useAppStore();
  
  // Switch to a specific view
  const switchToView = useCallback((view) => {
    setTaskView(view);
  }, [setTaskView]);
  
  // View toggle controls
  const viewControls = (
    <div className="flex space-x-2">
      <Button
        variant={taskView === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchToView('list')}
        className={isRTL ? 'mr-0 ml-2' : 'ml-0 mr-2'}
      >
        <ListFilter className="h-4 w-4 mr-1" />
        {isRTL ? 'רשימה' : 'List'}
      </Button>
      
      <Button
        variant={taskView === 'kanban' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchToView('kanban')}
        className={isRTL ? 'mr-0 ml-2' : 'ml-0 mr-2'}
      >
        <LayoutKanban className="h-4 w-4 mr-1" />
        {isRTL ? 'קאנבן' : 'Kanban'}
      </Button>
      
      <Button
        variant={taskView === 'calendar' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchToView('calendar')}
      >
        <Calendar className="h-4 w-4 mr-1" />
        {isRTL ? 'יומן' : 'Calendar'}
      </Button>
    </div>
  );
  
  return {
    currentView: taskView,
    switchToView,
    viewControls
  };
}