import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, FilterX, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguageHook } from "@/components/useLanguageHook";

export default function TaskFilters({ filters, onFilterChange, users, onRefresh, isLoading }) {
    const { t } = useLanguageHook();

    const handleFilterChange = (type, value) => {
        onFilterChange({ ...filters, [type]: value });
    };

    const resetFilters = () => {
        onFilterChange({ 
            status: "all", 
            priority: "all", 
            category: "all",
            assignedTo: "all",
            searchTerm: ""
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t('filters.filterTasks', { defaultValue: 'Filter Tasks' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                    <Input
                        placeholder={t('search.placeholderTasks', { defaultValue: 'Search tasks...' })}
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="w-full"
                    />
                    
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('filters.selectStatus', {defaultValue: "Select Status"})} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filters.allStatuses', { defaultValue: 'All Statuses' })}</SelectItem>
                            <SelectItem value="todo">{t('status.todo', { defaultValue: 'Todo' })}</SelectItem>
                            <SelectItem value="in_progress">{t('status.inProgress', { defaultValue: 'In Progress' })}</SelectItem>
                            <SelectItem value="done">{t('status.done', { defaultValue: 'Done' })}</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('filters.selectPriority', {defaultValue: "Select Priority"})} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filters.allPriorities', { defaultValue: 'All Priorities' })}</SelectItem>
                            <SelectItem value="low">{t('priority.low', { defaultValue: 'Low' })}</SelectItem>
                            <SelectItem value="medium">{t('priority.medium', { defaultValue: 'Medium' })}</SelectItem>
                            <SelectItem value="high">{t('priority.high', { defaultValue: 'High' })}</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('filters.selectCategory', {defaultValue: "Select Category"})} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filters.allCategories', { defaultValue: 'All Categories' })}</SelectItem>
                            <SelectItem value="work">{t('category.work', { defaultValue: 'Work' })}</SelectItem>
                            <SelectItem value="personal">{t('category.personal', { defaultValue: 'Personal' })}</SelectItem>
                            <SelectItem value="shopping">{t('category.shopping', { defaultValue: 'Shopping' })}</SelectItem>
                            <SelectItem value="health">{t('category.health', { defaultValue: 'Health' })}</SelectItem>
                            <SelectItem value="learning">{t('category.learning', { defaultValue: 'Learning' })}</SelectItem>
                        </SelectContent>
                    </Select>

                    {users && users.length > 0 && (
                        <Select value={filters.assignedTo} onValueChange={(value) => handleFilterChange('assignedTo', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('filters.selectAssignee', {defaultValue: "Select Assignee"})} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filters.allAssignees', { defaultValue: 'All Assignees' })}</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.full_name || user.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetFilters} className="text-sm">
                        <FilterX className="h-4 w-4 mr-2" />
                        {t('buttons.resetFilters', {defaultValue: "Reset Filters"})}
                    </Button>
                    <Button onClick={onRefresh} variant="outline" className="text-sm" disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {t('buttons.refresh', {defaultValue: "Refresh"})}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}