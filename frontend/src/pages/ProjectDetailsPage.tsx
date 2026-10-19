import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Stage, Task } from '../types';
import TaskStatusModal from '../components/TaskStatusModal';

export default function ProjectDetailsPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  
  const [stages, setStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  
  // Стейт для задач (ключ - id этапа)
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [newTaskName, setNewTaskName] = useState<Record<string, string>>({});
  
  // Модалка смены статуса
  const [selectedTask, setSelectedTask] = useState<{ stageId: string, task: Task } | null>(null);

  const fetchStages = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/stages`);
      setStages(data);
      // После загрузки этапов грузим задачи для каждого
      data.forEach((stage: Stage) => fetchTasks(stage.id));
    } catch (error) {
      console.error('Ошибка загрузки этапов', error);
    }
  };

  const fetchTasks = async (stageId: string) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/stages/${stageId}/tasks`);
      setTasks(prev => ({ ...prev, [stageId]: data }));
    } catch (error) {
      console.error('Ошибка загрузки задач', error);
    }
  };

  useEffect(() => {
    fetchStages();
  }, [projectId]);

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/stages`, { name: newStageName });
      setNewStageName('');
      fetchStages();
    } catch (error) {
      alert('Ошибка при создании этапа (возможно, нет прав)');
    }
  };

  const handleCreateTask = async (e: React.FormEvent, stageId: string) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/stages/${stageId}/tasks`, { 
        name: newTaskName[stageId] 
      });
      setNewTaskName(prev => ({ ...prev, [stageId]: '' }));
      fetchTasks(stageId);
    } catch (error) {
      alert('Ошибка при создании задачи');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline">
            ← Назад
          </button>
          <h1 className="text-xl font-bold text-gray-800">Управление проектом</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Форма создания этапа */}
        <form onSubmit={handleCreateStage} className="bg-white p-4 rounded-lg shadow-sm mb-8 flex gap-4 border border-gray-200">
          <input 
            type="text" placeholder="Название нового этапа (например: Фундамент)" 
            value={newStageName} onChange={(e) => setNewStageName(e.target.value)} required
            className="flex-1 border p-2 rounded"
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Добавить этап
          </button>
        </form>

        {/* Список этапов */}
        <div className="space-y-6">
          {stages.map(stage => (
            <div key={stage.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{stage.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${getStatusColor(stage.status)}`}>
                    {stage.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Задачи этапа */}
                <div className="space-y-3 mb-4">
                  {(tasks[stage.id] || []).map(task => (
                    <div key={task.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-800">{task.name}</p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          {task.contractorFee && (
                            <span className="text-xs text-green-600 font-medium">Сумма: {task.contractorFee} MDL</span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedTask({ stageId: stage.id, task })}
                        className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                      >
                        Изменить статус
                      </button>
                    </div>
                  ))}
                  {(tasks[stage.id] || []).length === 0 && (
                    <p className="text-sm text-gray-500 italic">В этом этапе пока нет задач.</p>
                  )}
                </div>

                {/* Форма быстрого добавления задачи */}
                <form onSubmit={(e) => handleCreateTask(e, stage.id)} className="flex gap-2">
                  <input 
                    type="text" placeholder="Новая задача..." 
                    value={newTaskName[stage.id] || ''} 
                    onChange={(e) => setNewTaskName(prev => ({ ...prev, [stage.id]: e.target.value }))}
                    required
                    className="flex-1 border p-2 rounded text-sm"
                  />
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                    + Задача
                  </button>
                </form>
              </div>
            </div>
          ))}
          {stages.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed">
              <p className="text-gray-500">В проекте еще нет этапов. Создайте первый этап выше!</p>
            </div>
          )}
        </div>
      </main>

      {/* Модалка смены статуса */}
      {selectedTask && (
        <TaskStatusModal 
          projectId={projectId!}
          stageId={selectedTask.stageId}
          task={selectedTask.task}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => {
            fetchStages(); // Обновляем задачи
            // Также обновляем сами этапы, вдруг статус этапа изменился (в будущем)
          }}
        />
      )}
    </div>
  );
}