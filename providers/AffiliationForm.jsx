import React from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";

export default function AffiliationForm({
  formData,
  onChange,
  onSubmit,
  loading = false,
  language = "en"
}) {
  const isRTL = language === "he";

  const handleDateSelect = (field, date) => {
    onChange({ ...formData, [field]: date });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }} className="space-y-4">
      <div>
        <Label>
          {isRTL ? "סוג שיוך" : "Affiliation Type"}
        </Label>
        <Select
          value={formData.affiliation_type}
          onValueChange={(value) => onChange({ ...formData, affiliation_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employed">
              {isRTL ? "מועסק" : "Employed"}
            </SelectItem>
            <SelectItem value="visiting">
              {isRTL ? "מבקר" : "Visiting"}
            </SelectItem>
            <SelectItem value="consultant">
              {isRTL ? "יועץ" : "Consultant"}
            </SelectItem>
            <SelectItem value="resident">
              {isRTL ? "מתמחה" : "Resident"}
            </SelectItem>
            <SelectItem value="independent">
              {isRTL ? "עצמאי" : "Independent"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label>
            {isRTL ? "תאריך התחלה" : "Start Date"}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !formData.start_date && "text-muted-foreground"
                }`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.start_date ? (
                  format(formData.start_date, "PPP")
                ) : (
                  <span>{isRTL ? "בחר תאריך" : "Pick a date"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => handleDateSelect("start_date", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1">
          <Label>
            {isRTL ? "תאריך סיום" : "End Date"}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !formData.end_date && "text-muted-foreground"
                }`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.end_date ? (
                  format(formData.end_date, "PPP")
                ) : (
                  <span>{isRTL ? "בחר תאריך" : "Pick a date"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.end_date}
                onSelect={(date) => handleDateSelect("end_date", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.is_active}
          onCheckedChange={(checked) => 
            onChange({ ...formData, is_active: checked })
          }
        />
        <Label htmlFor="active">
          {isRTL ? "פעיל" : "Active"}
        </Label>
      </div>

      <div>
        <Label>
          {isRTL ? "הערות" : "Notes"}
        </Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              {isRTL ? "שומר..." : "Saving..."}
            </span>
          ) : (
            isRTL ? "שמור" : "Save"
          )}
        </Button>
      </div>
    </form>
  );
}