import { useToast } from "@/components/ui/use-toast";

export default function useToastManager() {
  const { toast } = useToast();
  
  const showSuccess = (title, options = {}) => {
    toast({
      title,
      description: options.message,
      variant: "default",
      duration: 3000,
      ...options
    });
  };
  
  const showError = (title, options = {}) => {
    toast({
      title,
      description: options.message,
      variant: "destructive",
      duration: 5000,
      ...options
    });
  };
  
  const showWarning = (title, options = {}) => {
    toast({
      title,
      description: options.message,
      variant: "warning",
      duration: 4000,
      ...options
    });
  };
  
  const showInfo = (title, options = {}) => {
    toast({
      title,
      description: options.message,
      duration: 3000,
      ...options
    });
  };
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}