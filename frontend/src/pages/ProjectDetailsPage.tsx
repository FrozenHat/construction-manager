import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline mb-2">
            ← Назад к проектам
          </button>
          <h1 className="text-xl font-bold">Проект ID: {id}</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded shadow text-center text-gray-500">
          Здесь скоро будет управление этапами, задачами и документами
        </div>
      </main>
    </div>
  );
}