import api from './api';

export const taskService = {
  // Obtener tareas del empleado
  getTasks: async () => {
    try {
      const response = await api.get('/api/tasks/employee');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tareas:', error);
      // Retornar tareas de demo en caso de error
      return [];
    }
  },

  // Marcar tarea como completada
  markTaskCompleted: async (taskId) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error marcando tarea como completada:', error);
      throw error;
    }
  },

  // Agregar tarea manualmente
  addTask: async (taskData) => {
    try {
      const response = await api.post('/api/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Error agregando tarea:', error);
      throw error;
    }
  },

  // Eliminar tarea
  deleteTask: async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      return true;
    } catch (error {
      console.error('Error eliminando tarea:', error);
      throw error;
    }
  }
};

export default taskService;