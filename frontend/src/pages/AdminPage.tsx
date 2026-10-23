import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
// import type { User } from '../types';

const AVAILABLE_ROLES = [
  { code: 'chief', name: 'Шеф' },
  { code: 'admin', name: 'Администратор' },
  { code: 'manager', name: 'Менеджер' },
  { code: 'buyer', name: 'Закупщик' },
  { code: 'accountant', name: 'Бухгалтер' },
  { code: 'supervisor', name: 'Технадзор' },
  { code: 'client', name: 'Клиент' },
  { code: 'contractor', name: 'Исполнитель' },
];

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      setError('Нет доступа к списку пользователей. Требуются права администратора.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRemoveRole = async (userId: string, roleCode: string) => {
    if (!confirm('Вы уверены, что хотите забрать эту роль?')) return;
    try {
      await api.delete(`/users/${userId}/roles/${roleCode}`);
      fetchUsers();
    } catch (err) {
      alert('Ошибка удаления роли');
    }
  };

  const handleAssignRole = async (userId: string, roleCode: string) => {
    if (!roleCode) return;
    try {
      await api.post(`/users/${userId}/roles/${roleCode}`);
      fetchUsers(); // Обновляем список, чтобы увидеть новые роли
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка назначения роли');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Админ-панель: Пользователи</h1>
          <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline">
            ← К проектам
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-600">Сотрудник</th>
                <th className="p-4 font-semibold text-gray-600">Текущие роли</th>
                <th className="p-4 font-semibold text-gray-600">Назначить роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-800">{user.fullName}</p>
                    <p className="text-sm text-gray-500">{user.email || user.phone}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles?.map((r: any) => (
                        <span key={r.code} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded inline-flex items-center gap-1">
                          {r.name}
                          <button 
                            onClick={() => handleRemoveRole(user.id, r.code)} 
                            className="text-red-500 hover:text-red-700 font-bold ml-1"
                            title="Забрать роль"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {(!user.roles || user.roles.length === 0) && (
                        <span className="text-gray-400 text-sm italic">Нет ролей</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <select 
                      onChange={(e) => handleAssignRole(user.id, e.target.value)}
                      defaultValue=""
                      className="border p-2 rounded text-sm bg-white"
                    >
                      <option value="" disabled>+ Добавить роль</option>
                      {AVAILABLE_ROLES.map(role => (
                        <option key={role.code} value={role.code}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}