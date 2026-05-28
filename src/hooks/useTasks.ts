import { useState, useEffect } from 'react';
import { API_URL, MESSAGES } from '../utils/constants';
import type { Task, TaskFormData, UseTasksReturn } from '../types';

//Validação dos dados
function validateTask(taskData: TaskFormData): string | null {
  if (!taskData.title.trim()) {
    return MESSAGES.ERROR_EMPTY_TITLE;
  }

  return null;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  //Função para chamar a api
  
  const request = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = MESSAGES.ERROR_CONNECTION;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {}

      throw new Error(errorMessage);
    }

    //Parada para retorno de dados
    if (response.status === 204) {
          return {} as T;
        }
        return response.json();
      }, []);

    
  //Controle submits
  const handleSubmit = useCallback(async (
    callback: () => Promise<void>
  ): Promise<boolean> => {

    setSubmitting(true);
    setError(null);

    try {
      await callback();
      return true;

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : MESSAGES.ERROR_CONNECTION
      );

      console.error(err);

      return false;

    } finally {
      setSubmitting(false);
    }
  }, []);

  //Buscar tarefas
  const fetchTasks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await request<Task[]>(API_URL);
      setTasks(data);

    } catch (err) {
      setError(MESSAGES.ERROR_LOAD);
      console.error(err);

    } finally {
      setLoading(false);
    }
  }, [request]);

  //Criar tarefa
  const createTask = useCallback(async (
    taskData: TaskFormData
  ): Promise<boolean> => {

    const validationError = validateTask(taskData);

    if (validationError) {
      setError(validationError);
      return false;
    }

    return handleSubmit(async () => {
      const newTask = await request<Task>(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          ...taskData,
          completed: false,
        }),
      });

      // atualização local sem novo fetch
      setTasks((prev) => [...prev, newTask]);
    });

  }, [request, handleSubmit]);

  //Atualizar tarefa
  const updateTask = useCallback(async (
    id: number,
    taskData: TaskFormData
  ): Promise<boolean> => {

    const validationError = validateTask(taskData);

    if (validationError) {
      setError(validationError);
      return false;
    }

    return handleSubmit(async () => {
      const updatedTask = await request<Task>(
        `${API_URL}/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(taskData),
        }
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? updatedTask : task
        )
      );
    });

  }, [request, handleSubmit]);

  // Alternar status
  const toggleTask = useCallback(async (
    id: number
  ): Promise<void> => {

    try {
      const updatedTask = await request<Task>(
        `${API_URL}/${id}/toggle`,
        {
          method: 'PATCH',
        }
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? updatedTask : task
        )
      );

    } catch (err) {
      setError(MESSAGES.ERROR_UPDATE);
      console.error(err);
    }

  }, [request]);

  //Deletar tarefa
  const deleteTask = useCallback(async (
    id: number
  ): Promise<void> => {

    try {
      await request(
        `${API_URL}/${id}`,
        {
          method: 'DELETE',
        }
      );

      setTasks((prev) =>
        prev.filter((task) => task.id !== id)
      );

    } catch (err) {
      setError(MESSAGES.ERROR_DELETE);
      console.error(err);
    }

  }, [request]);

  // Carrega tarefas ao iniciar
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    submitting,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    fetchTasks,
  };
}
  