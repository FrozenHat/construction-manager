import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Project } from '../types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Ошибка загрузки проектов', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name: newProjectName });
      setNewProjectName('');
      setIsCreating(false);
      fetchProjects(); // Обновляем список
    } catch (error) {
      alert('Ошибка при создании проекта (возможно, нет прав)');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Мои проекты</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">{user.email}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-medium">
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Все проекты</h2>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          >
            + Новый проект
          </button>
        </div>

        {/* Форма создания */}
        {isCreating && (
          <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
            <input 
              type="text" 
              placeholder="Название проекта" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              className="flex-1 border p-2 rounded"
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Создать</button>
          </form>
        )}

        {/* Сетка проектов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{project.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Статус: {project.status}</p>
              <button 
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200"
              >
                Открыть
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              У вас пока нет доступных проектов
            </div>
          )}
        </div>
      </main>
    </div>
  );
}