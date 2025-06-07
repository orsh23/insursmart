// Export all UI components for easy importing
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Progress } from "./progress";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./select";
import { Switch } from "./switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Textarea } from "./textarea";
import { Toast } from "./toast";
import { Toaster } from "./toaster";
import { useToast } from "./use-toast";

// Utility function for className merging
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const ui = {
  Alert, AlertTitle, AlertDescription,
  Badge,
  Button,
  Calendar,
  Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Input,
  Label,
  Popover, PopoverTrigger, PopoverContent,
  Progress,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Switch,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Textarea,
  Toast, Toaster,
  useToast,
  cn
};

export {
  Alert, AlertTitle, AlertDescription,
  Badge,
  Button,
  Calendar,
  Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Input,
  Label,
  Popover, PopoverTrigger, PopoverContent,
  Progress,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Switch,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Textarea,
  Toast, Toaster,
  useToast,
  cn
};

export default ui;