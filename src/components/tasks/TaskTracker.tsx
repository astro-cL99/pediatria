import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, Clock, Plus, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isToday, isTomorrow, isPast, addDays, isWithinInterval, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '@/contexts/NotificationContext';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
export type TaskCategory = 'medication' | 'procedure' | 'follow-up' | 'test' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  patientId?: string;
  patientName?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  dateRange?: 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'overdue' | 'all';
  search?: string;
}

const priorityOptions = [
  { value: 'low', label: 'Baja', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Media', color: 'bg-green-100 text-green-800' },
  { value: 'high', label: 'Alta', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-800' },
];

const statusOptions = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-800' },
  { value: 'in-progress', label: 'En progreso', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Vencida', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-300 text-gray-800' },
];

const categoryOptions = [
  { value: 'medication', label: 'Medicación', icon: '💊' },
  { value: 'procedure', label: 'Procedimiento', icon: '🏥' },
  { value: 'follow-up', label: 'Seguimiento', icon: '📅' },
  { value: 'test', label: 'Examen', icon: '🔬' },
  { value: 'other', label: 'Otro', icon: '📝' },
];

const dateRangeOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
  { value: 'this-week', label: 'Esta semana' },
  { value: 'next-week', label: 'Próxima semana' },
  { value: 'overdue', label: 'Vencidas' },
  { value: 'all', label: 'Todas' },
];

interface TaskTrackerProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTaskDelete: (taskId: string) => void;
  className?: string;
  showPatientInfo?: boolean;
  defaultView?: 'list' | 'calendar';
}

const TaskTracker: React.FC<TaskTrackerProps> = ({
  tasks = [],
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  className = '',
  showPatientInfo = true,
  defaultView = 'list',
}) => {
  const { addNotification } = useNotifications();
  const [filters, setFilters] = useState<TaskFilters>({ 
    status: ['pending', 'in-progress', 'overdue'],
    dateRange: 'today',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    dueDate: new Date(),
    priority: 'medium',
    status: 'pending',
    category: 'other',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }
    
    // Category filter
    if (filters.category && filters.category.length > 0 && !filters.category.includes(task.category)) {
      return false;
    }
    
    // Date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = addDays(today, 1);
    const endOfWeek = addDays(today, 7 - today.getDay());
    const startOfNextWeek = addDays(today, 7 - today.getDay() + 1);
    const endOfNextWeek = addDays(today, 14 - today.getDay());
    
    if (filters.dateRange === 'today' && !isToday(new Date(task.dueDate))) {
      return false;
    }
    
    if (filters.dateRange === 'tomorrow' && !isTomorrow(new Date(task.dueDate))) {
      return false;
    }
    
    if (filters.dateRange === 'this-week') {
      const taskDate = new Date(task.dueDate);
      if (!isWithinInterval(taskDate, { start: today, end: endOfWeek })) {
        return false;
      }
    }
    
    if (filters.dateRange === 'next-week') {
      const taskDate = new Date(task.dueDate);
      if (!isWithinInterval(taskDate, { start: startOfNextWeek, end: endOfNextWeek })) {
        return false;
      }
    }
    
    if (filters.dateRange === 'overdue' && !(isPast(new Date(task.dueDate)) && task.status !== 'completed')) {
      return false;
    }
    
    // Search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description?.toLowerCase().includes(searchLower) || false;
      const matchesPatient = task.patientName?.toLowerCase().includes(searchLower) || false;
      
      if (!matchesTitle && !matchesDescription && !matchesPatient) {
        return false;
      }
    }
    
    return true;
  });

  // Sort tasks by due date and priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Overdue tasks first
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    
    // Then by due date
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    
    if (dateA !== dateB) return dateA - dateB;
    
    // Then by priority (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {};
  
  sortedTasks.forEach(task => {
    const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push(task);
  });

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updates: Partial<Task> = { 
      status: newStatus,
      updatedAt: new Date(),
    };
    
    if (newStatus === 'completed') {
      updates.completedAt = new Date();
      
      // Show notification for completed task
      addNotification({
        type: 'success',
        title: 'Tarea completada',
        message: `Se ha marcado como completada: ${task.title}`,
        autoDismiss: true,
        dismissAfter: 5000,
      });
      
      // If it's a recurring task, create the next occurrence
      if (task.recurring) {
        const nextDueDate = addDays(new Date(task.dueDate), 
          task.recurring.frequency === 'daily' ? 1 : 
          task.recurring.frequency === 'weekly' ? 7 : 30
        );
        
        // Only create next occurrence if it's before the end date (if specified)
        if (!task.recurring.endDate || nextDueDate <= new Date(task.recurring.endDate)) {
          const nextTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
            ...task,
            dueDate: nextDueDate,
            status: 'pending',
            completedAt: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          onTaskCreate(nextTask);
          
          addNotification({
            type: 'info',
            title: 'Próxima tarea programada',
            message: `Se ha creado la próxima ocurrencia de: ${task.title}`,
            autoDismiss: true,
            dismissAfter: 5000,
          });
        }
      }
    }
    
    onTaskUpdate(taskId, updates);
  };

  const handleCreateTask = () => {
    if (!newTask.title) return;
    
    onTaskCreate({
      ...newTask,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Reset form
    setNewTask({
      title: '',
      description: '',
      dueDate: new Date(),
      priority: 'medium',
      status: 'pending',
      category: 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    setIsCreateDialogOpen(false);
    
    addNotification({
      type: 'success',
      title: 'Tarea creada',
      message: 'La tarea se ha creado correctamente',
      autoDismiss: true,
    });
  };

  // Check for due tasks and show notifications
  useEffect(() => {
    const now = new Date();
    const oneHourFromNow = addDays(now, 1);
    
    tasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      const timeUntilDue = dueDate.getTime() - now.getTime();
      
      // Notify for tasks due in the next hour that haven't been notified yet
      if (
        task.status === 'pending' && 
        timeUntilDue > 0 && 
        timeUntilDue <= 3600000 && // 1 hour in milliseconds
        !task.notes?.includes('notified')
      ) {
        addNotification({
          type: 'reminder',
          title: 'Tarea próxima a vencer',
          message: `La tarea "${task.title}" vence pronto (${format(dueDate, 'HH:mm')})`,
          action: task.patientId ? {
            label: 'Ver paciente',
            onClick: () => {
              // Navigate to patient or open patient details
              console.log(`Navigating to patient ${task.patientId}`);
            },
          } : undefined,
          autoDismiss: false,
        });
        
        // Mark as notified to avoid duplicate notifications
        onTaskUpdate(task.id, {
          notes: `${task.notes || ''}\nNotified at ${new Date().toISOString()}`,
        });
      }
      
      // Mark overdue tasks
      if (task.status === 'pending' && isPast(dueDate) && task.status !== 'overdue') {
        onTaskUpdate(task.id, { status: 'overdue' });
        
        addNotification({
          type: 'warning',
          title: 'Tarea vencida',
          message: `La tarea "${task.title}" está vencida`,
          autoDismiss: false,
        });
      }
    });
  }, [tasks, addNotification, onTaskUpdate]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar tareas..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select
            value={filters.dateRange || 'all'}
            onValueChange={(value) => setFilters({ ...filters, dateRange: value as any })}
          >
            <SelectTrigger className="w-[180px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva tarea
          </Button>
        </div>
      </div>
      
      {/* Task list */}
      {Object.entries(tasksByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(tasksByDate).map(([date, dateTasks]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-lg font-medium">
                {isToday(new Date(date)) ? 'Hoy' : 
                 isTomorrow(new Date(date)) ? 'Mañana' : 
                 format(new Date(date), 'EEEE d MMMM', { locale: es })}
                <span className="text-sm text-muted-foreground ml-2">
                  {format(new Date(date), 'd MMM yyyy', { locale: es })}
                </span>
              </h3>
              
              <div className="space-y-2">
                {dateTasks.map((task) => {
                  const priority = priorityOptions.find(p => p.value === task.priority);
                  const status = statusOptions.find(s => s.value === task.status);
                  const category = categoryOptions.find(c => c.value === task.category);
                  
                  return (
                    <Card key={task.id} className="overflow-hidden">
                      <div className="flex items-start p-4">
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                            handleStatusChange(task.id, newStatus);
                          }}
                          className="mt-0.5 mr-3"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {priority && (
                                <Badge variant="outline" className={priority.color}>
                                  {priority.label}
                                </Badge>
                              )}
                              {status && (
                                <Badge variant="outline" className={status.color}>
                                  {status.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(task.dueDate), 'HH:mm')}
                            </div>
                            
                            {category && (
                              <div className="flex items-center">
                                <span className="mr-1">{category.icon}</span>
                                {category.label}
                              </div>
                            )}
                            
                            {showPatientInfo && task.patientName && (
                              <div className="flex items-center">
                                <span className="mr-1">👤</span>
                                {task.patientName}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setNewTask({
                                ...task,
                                dueDate: new Date(task.dueDate),
                              });
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onTaskDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No hay tareas</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm || filters.status?.length !== statusOptions.length 
              ? 'No se encontraron tareas que coincidan con los filtros actuales.'
              : 'Comienza creando una nueva tarea.'}
          </p>
          <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear tarea
          </Button>
        </div>
      )}
      
      {/* Create/Edit Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {newTask.id ? 'Editar tarea' : 'Nueva tarea'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título *
              </Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="col-span-3"
                placeholder="Ej: Administrar medicación"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={newTask.description || ''}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="col-span-3"
                rows={3}
                placeholder="Detalles adicionales de la tarea..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Fecha y hora
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={format(new Date(newTask.dueDate), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : new Date();
                  setNewTask({ ...newTask, dueDate: date });
                }}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Prioridad
              </Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({ ...newTask, priority: value as TaskPriority })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Select
                value={newTask.category}
                onValueChange={(value) => setNewTask({ ...newTask, category: value as TaskCategory })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <Select
                value={newTask.status}
                onValueChange={(value) => setNewTask({ ...newTask, status: value as TaskStatus })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right mt-2">
                Notas
              </Label>
              <Textarea
                id="notes"
                value={newTask.notes || ''}
                onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                className="col-span-3"
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask}>
              {newTask.id ? 'Actualizar' : 'Crear'} tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskTracker;
