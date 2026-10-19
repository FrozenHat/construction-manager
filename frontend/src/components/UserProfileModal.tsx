import type { User } from '../types';

interface Props {
  user: User;
  viewerRole: string; // Роль того, кто сейчас смотрит на карточку
  onClose: () => void;
}

export default function UserProfileModal({ user, viewerRole, onClose }: Props) {
  // Кто может видеть личные контакты (телефон, email)?
  const canSeeContacts = ['chief', 'admin', 'manager', 'supervisor'].includes(viewerRole);
  
  // Получаем глобальные роли пользователя
  const globalRoles = user.roles?.map(r => r.name).join(', ') || 'Нет глобальных ролей';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        
        {/* Шапка карточки */}
        <div className="bg-gray-50 p-6 border-b flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Аватарка-заглушка */}
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{user.fullName}</h2>
              <p className="text-sm text-gray-500">{globalRoles}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Тело карточки */}
        <div className="p-6 space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
            {canSeeContacts || user.id === user.id ? ( // Себя видеть можно всем
              <p className="text-gray-800">{user.email || 'Не указан'}</p>
            ) : (
              <p className="text-gray-400 italic text-sm">Скрыто настройками приватности</p>
            )}
          </div>
          
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Телефон</p>
            {canSeeContacts || user.id === user.id ? (
              <p className="text-gray-800">{user.phone || 'Не указан'}</p>
            ) : (
              <p className="text-gray-400 italic text-sm">Скрыто настройками приватности</p>
            )}
          </div>

          {/* Здесь можно добавить статистику, например "В системе с 2026 года" */}
        </div>

        {/* Футер */}
        <div className="bg-gray-50 p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}