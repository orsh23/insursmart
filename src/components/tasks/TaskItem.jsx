import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    Circle,
    ArrowUpCircle,
    Pencil,
    Trash2,
    User
} from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguageHook } from "@/components/useLanguageHook";

export default function TaskItem({ task, onStatusChange, onEdit, onDelete, assigneeName }) {
    const { t, language } = useLanguageHook();

    const priorityColors = {
        low: "bg-blue-100 text-blue-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-red-100 text-red-800"
    };

    const categoryColors = {
        work: "bg-indigo-100 text-indigo-800",
        personal: "bg-purple-100 text-purple-800",
        shopping: "bg-pink-100 text-pink-800",
        health: "bg-green-100 text-green-800",
        learning: "bg-amber-100 text-amber-800"
    };

    const statusIcons = {
        todo: <Circle className="w-5 h-5 text-gray-400" />,
        in_progress: <ArrowUpCircle className="w-5 h-5 text-blue-500" />,
        done: <CheckCircle2 className="w-5 h-5 text-green-500" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="mt-1 hover:opacity-70 transition-opacity">
                                    {statusIcons[task.status]}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onStatusChange(task, "todo")}>
                                    <Circle className="w-4 h-4 mr-2 text-gray-400" />
                                    {t('status.todo', { defaultValue: 'Mark as Todo' })}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(task, "in_progress")}>
                                    <ArrowUpCircle className="w-4 h-4 mr-2 text-blue-500" />
                                    {t('status.inProgress', { defaultValue: 'Mark as In Progress' })}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(task, "done")}>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                    {t('status.done', { defaultValue: 'Mark as Done' })}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex-1">
                            <CardTitle className={task.status === 'done' ? 'line-through text-gray-500' : ''}>
                                {task.title}
                            </CardTitle>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge className={priorityColors[task.priority]}>
                                    {t(`priority.${task.priority}`, { defaultValue: task.priority })} priority
                                </Badge>
                                {task.status === 'in_progress' && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                        {t('status.inProgress', { defaultValue: 'In Progress' })}
                                    </Badge>
                                )}
                                {task.category && (
                                    <Badge className={categoryColors[task.category] || "bg-gray-100 text-gray-800"}>
                                        {t(`category.${task.category}`, { defaultValue: task.category })}
                                    </Badge>
                                )}
                                {task.due_date && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3" />
                                        {format(new Date(task.due_date), 'MMM d')}
                                    </Badge>
                                )}
                                {assigneeName && assigneeName !== 'Unassigned' && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {assigneeName}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(task)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(task)}
                            className="text-gray-400 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                {task.description && (
                    <CardContent>
                        <p className="text-gray-600">{task.description}</p>
                        {Array.isArray(task.tags) && task.tags.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs font-medium mb-1">{t('common.tags', {defaultValue: "Tags"})}:</p>
                                <div className="flex flex-wrap gap-1">
                                    {task.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </motion.div>
    );
}