import React, { useState } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export default function ContractScopeRules({ rules = [], onChange }) {
  const { t } = useLanguageHook();
  
  const handleAddRule = () => {
    onChange([...rules, {
      scope_type: "all_codes",
      category_path: "",
      codes: []
    }]);
  };

  const handleRemoveRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    onChange(newRules);
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...rules];
    newRules[index] = {
      ...newRules[index],
      [field]: value
    };
    onChange(newRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('contractManagement.scopeRules')}</h3>
        <Button type="button" onClick={handleAddRule} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('contractManagement.addScopeRule')}
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('contractManagement.noScopeRules')}</p>
          <Button type="button" onClick={handleAddRule} variant="outline" className="mt-2">
            {t('contractManagement.addFirstRule')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-4">
                  <div>
                    <Label>{t('contractManagement.scopeType')}</Label>
                    <Select
                      value={rule.scope_type}
                      onValueChange={(value) => handleRuleChange(index, 'scope_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('contractManagement.selectScopeType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_codes">{t('contractManagement.scopeTypes.allCodes')}</SelectItem>
                        <SelectItem value="category">{t('contractManagement.scopeTypes.category')}</SelectItem>
                        <SelectItem value="specific_codes">{t('contractManagement.scopeTypes.specificCodes')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {rule.scope_type === 'category' && (
                    <div>
                      <Label>{t('contractManagement.categoryPath')}</Label>
                      <Input
                        value={rule.category_path}
                        onChange={(e) => handleRuleChange(index, 'category_path', e.target.value)}
                        placeholder={t('contractManagement.categoryPathPlaceholder')}
                      />
                    </div>
                  )}

                  {rule.scope_type === 'specific_codes' && (
                    <div>
                      <Label>{t('contractManagement.codes')}</Label>
                      <Input
                        value={rule.codes.join(', ')}
                        onChange={(e) => handleRuleChange(index, 'codes', e.target.value.split(',').map(code => code.trim()))}
                        placeholder={t('contractManagement.codesPlaceholder')}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {t('contractManagement.codesHelp')}
                      </p>
                    </div>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRule(index)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}