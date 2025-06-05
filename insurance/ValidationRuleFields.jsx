import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ValidationRuleFields({
  rule,
  index,
  onChange,
  onRemove,
  language = "en"
}) {
  const isRTL = language === "he";

  return (
    <div className="border p-4 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{isRTL ? "סוג חוק" : "Rule Type"}</Label>
          <Select
            value={rule.rule_type}
            onValueChange={(value) => onChange(index, "rule_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="age_limit">
                {isRTL ? "מגבלת גיל" : "Age Limit"}
              </SelectItem>
              <SelectItem value="gender_specific">
                {isRTL ? "מגדר ספציפי" : "Gender Specific"}
              </SelectItem>
              <SelectItem value="requires_approval">
                {isRTL ? "דורש אישור" : "Requires Approval"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{isRTL ? "ערך" : "Value"}</Label>
          {rule.rule_type === "age_limit" ? (
            <Input
              type="number"
              value={rule.rule_value}
              onChange={(e) => onChange(index, "rule_value", e.target.value)}
              placeholder={isRTL ? "הכנס גיל" : "Enter age"}
            />
          ) : rule.rule_type === "gender_specific" ? (
            <Select
              value={rule.rule_value}
              onValueChange={(value) => onChange(index, "rule_value", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{isRTL ? "זכר" : "Male"}</SelectItem>
                <SelectItem value="female">{isRTL ? "נקבה" : "Female"}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={rule.rule_value}
              onChange={(e) => onChange(index, "rule_value", e.target.value)}
              placeholder={isRTL ? "הכנס ערך" : "Enter value"}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="destructive"
          onClick={() => onRemove(index)}
        >
          {isRTL ? "הסר" : "Remove"}
        </Button>
      </div>
    </div>
  );
}