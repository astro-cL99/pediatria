import { supabase } from '@/lib/supabase';
import { Task, TaskPriority, TaskStatus, TaskCategory } from '@/components/tasks/TaskTracker';

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('medical_tasks')
    .insert([
      {
        ...task,
        due_date: task.dueDate,
        patient_id: task.patientId,
        patient_name: task.patientName,
        assigned_to: task.assignedTo,
        completed_at: task.completedAt,
        recurring: task.recurring ? JSON.stringify(task.recurring) : null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    dueDate: data.due_date,
    patientId: data.patient_id,
    patientName: data.patient_name,
    assignedTo: data.assigned_to,
    completedAt: data.completed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    recurring: data.recurring ? JSON.parse(data.recurring) : undefined,
  } as Task;
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const updateData: any = { ...updates };
  
  // Mapear los nombres de los campos a los de la base de datos
  if (updates.dueDate) updateData.due_date = updates.dueDate;
  if (updates.patientId) updateData.patient_id = updates.patientId;
  if (updates.patientName) updateData.patient_name = updates.patientName;
  if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
  if (updates.completedAt) updateData.completed_at = updates.completedAt;
  if (updates.recurring) updateData.recurring = JSON.stringify(updates.recurring);
  
  const { data, error } = await supabase
    .from('medical_tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    dueDate: data.due_date,
    patientId: data.patient_id,
    patientName: data.patient_name,
    assignedTo: data.assigned_to,
    completedAt: data.completed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    recurring: data.recurring ? JSON.parse(data.recurring) : undefined,
  } as Task;
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('medical_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
  return true;
};

export const fetchTasks = async (filters: {
  status?: string[];
  patientId?: string;
  dateRange?: 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'overdue' | 'all';
  search?: string;
}) => {
  let query = supabase
    .from('medical_tasks')
    .select('*')
    .order('due_date', { ascending: true });

  // Aplicar filtros
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  // Filtrar por rango de fechas
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (filters.dateRange === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    query = query
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString());
  } 
  else if (filters.dateRange === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    query = query
      .gte('due_date', tomorrow.toISOString())
      .lt('due_date', dayAfter.toISOString());
  }
  else if (filters.dateRange === 'this-week') {
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    query = query
      .gte('due_date', today.toISOString())
      .lt('due_date', endOfWeek.toISOString());
  }
  else if (filters.dateRange === 'next-week') {
    const startOfNextWeek = new Date(today);
    startOfNextWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
    
    query = query
      .gte('due_date', startOfNextWeek.toISOString())
      .lt('due_date', endOfNextWeek.toISOString());
  }
  else if (filters.dateRange === 'overdue') {
    query = query
      .lt('due_date', now.toISOString())
      .not('status', 'in', '("completed","cancelled")');
  }

  // Búsqueda por texto
  if (filters.search) {
    const searchTerm = `%${filters.search.toLowerCase()}%`;
    query = query.or(
      `title.ilike.${searchTerm},description.ilike.${searchTerm},patient_name.ilike.${searchTerm}`
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map((task: any) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: new Date(task.due_date),
    priority: task.priority as TaskPriority,
    status: task.status as TaskStatus,
    category: task.category as TaskCategory,
    patientId: task.patient_id,
    patientName: task.patient_name,
    assignedTo: task.assigned_to,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    notes: task.notes,
    recurring: task.recurring ? JSON.parse(task.recurring) : undefined,
  })) as Task[];
};

// Suscripción a cambios en tiempo real
export const subscribeToTasks = (
  callback: (payload: any) => void,
  filters: { patientId?: string } = {}
) => {
  let subscription = supabase
    .channel('tasks_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'medical_tasks',
        ...(filters.patientId && {
          filter: `patient_id=eq.${filters.patientId}`,
        }),
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
