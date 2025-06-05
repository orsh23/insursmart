import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguageHook } from "@/components/useLanguageHook";

export default function TaskForm({ task, users, onSubmit, onCancel }) {
    const { t } = useLanguageHook();
    const [currentTask, setCurrentTask] = React.useState(task || {
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        category: "personal",
        due_date: "",
        assigned_to: "",
        tags: []
    });

    const [tagInput, setTagInput] = React.useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const taskToSave = {
            ...currentTask,
            tags: Array.isArray(currentTask.tags) ? currentTask.tags : []
        };
        onSubmit(taskToSave);
    };

    const addTag = () => {
        if (tagInput.trim() && !currentTask.tags.includes(tagInput.trim())) {
            setCurrentTask({
                ...currentTask, 
                tags: [...(currentTask.tags || []), tagInput.trim()]
            });
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove) => {
        setCurrentTask({
            ...currentTask,
            tags: (currentTask.tags || []).filter(tag => tag !== tagToRemove)
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    placeholder={t('tasks.titlePlaceholder', { defaultValue: 'What needs to be done?' })}
                    value={currentTask.title}
                    onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                    className="text-lg"
                    required
                />
                
                <Textarea
                    placeholder={t('tasks.descriptionPlaceholder', { defaultValue: 'Add details...' })}
                    value={currentTask.description}
                    onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                    className="h-24"
                />
                
                <div className="flex gap-4 flex-wrap">
                    <Select
                        value={currentTask.priority}
                        onValueChange={(value) => setCurrentTask({...currentTask, priority: value})}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder={t('tasks.priorityPlaceholder', { defaultValue: 'Priority' })} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">{t('priority.low', { defaultValue: 'Low' })}</SelectItem>
                            <SelectItem value="medium">{t('priority.medium', { defaultValue: 'Medium' })}</SelectItem>
                            <SelectItem value="high">{t('priority.high', { defaultValue: 'High' })}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={currentTask.category}
                        onValueChange={(value) => setCurrentTask({...currentTask, category: value})}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder={t('tasks.categoryPlaceholder', { defaultValue: 'Category' })} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="work">{t('category.work', { defaultValue: 'Work' })}</SelectItem>
                            <SelectItem value="personal">{t('category.personal', { defaultValue: 'Personal' })}</SelectItem>
                            <SelectItem value="shopping">{t('category.shopping', { defaultValue: 'Shopping' })}</SelectItem>
                            <SelectItem value="health">{t('category.health', { defaultValue: 'Health' })}</SelectItem>
                            <SelectItem value="learning">{t('category.learning', { defaultValue: 'Learning' })}</SelectItem>
                        </SelectContent>
                    </Select>

                    {users && users.length > 0 && (
                        <Select
                            value={currentTask.assigned_to || ""}
                            onValueChange={(value) => setCurrentTask({...currentTask, assigned_to: value})}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder={t('tasks.assignToPlaceholder', { defaultValue: 'Assign to' })} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>{t('tasks.unassigned', { defaultValue: 'Unassigned' })}</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.full_name || user.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentTask.due_date ? format(new Date(currentTask.due_date), 'PPP') : t('tasks.setDueDate', { defaultValue: 'Set due date' })}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={currentTask.due_date ? new Date(currentTask.due_date) : undefined}
                                onSelect={(date) => setCurrentTask({...currentTask, due_date: date})}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Tags input */}
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder={t('tasks.addTagPlaceholder', { defaultValue: 'Add a tag' })}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                            {t('tasks.addTag', { defaultValue: 'Add' })}
                        </Button>
                    </div>
                    {currentTask.tags && currentTask.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {currentTask.tags.map(tag => (
                                <span 
                                    key={tag} 
                                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded cursor-pointer hover:bg-gray-200"
                                    onClick={() => removeTag(tag)}
                                >
                                    {tag} ×
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t('buttons.cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                        {task ? t('tasks.updateTask', { defaultValue: 'Update Task' }) : t('tasks.createTask', { defaultValue: 'Create Task' })}
                    </Button>
                </div>
            </form>
        </motion.div>
    );
}