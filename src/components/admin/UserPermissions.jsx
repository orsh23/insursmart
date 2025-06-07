import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { Switch } from "@/components/ui/switch";
import { Loader2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function UserPermissions({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  
  const handleGrant = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update the current user's role to admin
      await User.updateMyUserData({ user_role: "admin" });
      
      setCompleted(true);
      toast({
        title: "הרשאות הוענקו בהצלחה",
        description: "כעת יש לך גישה מלאה למערכת",
      });
      
      // Notify parent component
      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
    } catch (error) {
      console.error("Error granting permissions:", error);
      setError(error.message || "Failed to grant permissions");
      toast({
        title: "שגיאה",
        description: "לא ניתן להעניק הרשאות כרגע, נסה שנית מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-medium">הרשאות מנהל</p>
          <p className="text-sm text-gray-500">הענק הרשאות מנהל למשתמש זה</p>
        </div>
        <Switch 
          checked={completed}
          disabled={loading || completed}
        />
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleGrant}
          disabled={loading || complete}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              מעניק הרשאות...
            </>
          ) : completed ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              הרשאות הוענקו
            </>
          ) : (
            "אשר הרשאות מנהל"
          )}
        </Button>
      </div>
    </div>
  );
}