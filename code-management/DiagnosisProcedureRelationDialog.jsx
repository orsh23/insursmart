import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const RELATION_TYPES = ["direct", "catalog", "tag", "exclusion"];
const RULE_TYPES = ["include", "exclude"];

export default function DiagnosisProcedureRelationDialog({ isOpen, onClose, onSave, relation }) {
  const [formData, setFormData] = useState({
    diagnosis_code_id: '', procedure_code_id: '', 
    relation_type: RELATION_TYPES[0], rule_type: RULE_TYPES[0],
    catalog_id: '', tag: '', notes: '', is_active: true
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (relation) {
      setFormData({
        diagnosis_code_id: relation.diagnosis_code_id || '',
        procedure_code_id: relation.procedure_code_id || '',
        relation_type: relation.relation_type || RELATION_TYPES[0],
        rule_type: relation.rule_type || RULE_TYPES[0],
        catalog_id: relation.catalog_id || '',
        tag: relation.tag || '',
        notes: relation.notes || '',
        is_active: typeof relation.is_active === 'boolean' ? relation.is_active : true,
      });
    } else {
      setFormData({ // Default for new
        diagnosis_code_id: '', procedure_code_id: '', 
        relation_type: RELATION_TYPES[0], rule_type: RULE_TYPES[0],
        catalog_id: '', tag: '', notes: '', is_active: true
      });
    }
    setFormError(null);
  }, [relation, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.diagnosis_code_id || !formData.procedure_code_id) {
      setFormError("Diagnosis Code ID and Procedure Code ID are required.");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{relation ? 'Edit Relation' : 'Add New Relation'}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
            {formError && <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded">{formError}</div>}
            
            <div className="space-y-4">
                <div>
                    <Label htmlFor="diag_code_id">Diagnosis Code ID</Label>
                    <Input id="diag_code_id" value={formData.diagnosis_code_id} onChange={(e) => setFormData(prev => ({ ...prev, diagnosis_code_id: e.target.value }))} placeholder="e.g., MedicalCode ID or InternalCode ID" />
                </div>
                <div>
                    <Label htmlFor="proc_code_id">Procedure Code ID</Label>
                    <Input id="proc_code_id" value={formData.procedure_code_id} onChange={(e) => setFormData(prev => ({ ...prev, procedure_code_id: e.target.value }))} placeholder="e.g., MedicalCode ID or InternalCode ID" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="relation_type">Relation Type</Label>
                        <Select id="relation_type" value={formData.relation_type} onValueChange={(v) => setFormData(prev => ({ ...prev, relation_type: v }))}>
                            {RELATION_TYPES.map(rt => <SelectItem key={`rel-type-sel-${rt}`} value={rt}>{rt}</SelectItem>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="rule_type">Rule Type</Label>
                        <Select id="rule_type" value={formData.rule_type} onValueChange={(v) => setFormData(prev => ({ ...prev, rule_type: v }))}>
                            {RULE_TYPES.map(rt => <SelectItem key={`rule-type-sel-${rt}`} value={rt}>{rt}</SelectItem>)}
                        </Select>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="catalog_id">Catalog ID (if relation_type is 'catalog')</Label>
                    <Input id="catalog_id" value={formData.catalog_id} onChange={(e) => setFormData(prev => ({ ...prev, catalog_id: e.target.value }))} />
                </div>
                <div>
                    <Label htmlFor="tag_val">Tag (if relation_type is 'tag')</Label>
                    <Input id="tag_val" value={formData.tag} onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))} />
                </div>
                <div>
                    <Label htmlFor="rel_notes">Notes</Label>
                    <Textarea id="rel_notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="rel_is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
                    <Label htmlFor="rel_is_active">Is Active</Label>
                </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-lg mt-auto">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{relation ? 'Update Relation' : 'Create Relation'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}