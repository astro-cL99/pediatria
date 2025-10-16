import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import TaskTracker from '@/components/tasks/TaskTracker';
import { 
  fetchTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  subscribeToTasks 
} from '@/services/taskService';
import { Task, TaskStatus } from '@/components/tasks/TaskTracker';

const TasksPage: React.FC = () => {
  const { patientId } = useParams<{ patientId?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: {
        status?: TaskStatus[];
        patientId?: string;
        dateRange?: 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'overdue' | 'all';
      } = {};

      // Aplicar filtros según la pestaña activa
      if (activeTab === 'today') {
        filters.dateRange = 'today';
      } else if (activeTab === 'upcoming') {
        filters.dateRange = 'this-week';
      } else if (activeTab === 'overdue') {
        filters.status = ['overdue'];
      } else if (activeTab === 'completed') {
        filters.status = ['completed'];
      } else {
        // 'all' tab - no filters
      }

      // Si hay un patientId, filtrar por paciente
      if (patientId) {
        filters.patientId = patientId;
      }

      const data = await fetchTasks(filters);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tareas. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, patientId, toast]);

  // Cargar tareas al montar el componente y cuando cambien los filtros
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToTasks((payload) => {
      // Actualizar la lista de tareas cuando haya cambios
      loadTasks();
    }, { patientId });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [patientId, loadTasks]);

  const handleTaskCreate = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createTask({
        ...task,
        patientId: patientId || undefined,
        patientName: task.patientName || (patientId ? 'Paciente actual' : undefined),
      });
      
      toast({
        title: 'Tarea creada',
        description: 'La tarea se ha creado correctamente.',
      });
      
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
      
      toast({
        title: 'Tarea actualizada',
        description: 'La tarea se ha actualizado correctamente.',
      });
      
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      
      toast({
        title: 'Tarea eliminada',
        description: 'La tarea se ha eliminado correctamente.',
      });
      
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tarea. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {patientId ? 'Tareas del Paciente' : 'Gestión de Tareas'}
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate(patientId ? `/patients/${patientId}/tasks/new` : '/tasks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="today">Hoy</TabsTrigger>
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              <TabsTrigger value="overdue">Vencidas</TabsTrigger>
              <TabsTrigger value="completed">Completadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TaskTracker
            tasks={tasks}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            showPatientInfo={!patientId}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksPage;
