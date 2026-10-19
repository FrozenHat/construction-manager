import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface Props {
  projectId: string;
  stageId: string;
  task: any;
  onClose: () => void;
  onSuccess: () => void;
  viewerRole?: string; // Передаем роль того, кто смотрит
}

export default function TaskStatusModal({ projectId, stageId, task, onClose, onSuccess, viewerRole = 'manager' }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const [status, setStatus] = useState(task.status);
  const [comment, setComment] = useState('');
  const [contractorFee, setContractorFee] = useState(task.contractorFee || '');
  const [foremanFee, setForemanFee] = useState(task.foremanFee || '');
  const [pauseReason, setPauseReason] = useState('materials');
  const [error, setError] = useState('');

  const isReadOnly = viewerRole === 'client';

  useEffect(() => {
    api.get(`/projects/${projectId}/stages/${stageId}/tasks/${task.id}/history`)
      .then(res => setHistory(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingHistory(false));
  }, [projectId, stageId, task.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: any = { status, comment };
      
      if (task.status === 'sent_to_contractor' && status === 'in_progress') {
        payload.contractorFee = contractorFee;
        payload.foremanFee = foremanFee;
      }
      
      if (status === 'paused') {
        payload.pauseReason = pauseReason;
        payload.pauseComment = comment;
      }

      await api.post(`/projects/${projectId}/stages/${stageId}/tasks/${task.id}/status`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка смены статуса');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-800">{isReadOnly ? 'История задачи' : 'Управление задачей'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

          {/* Форма смены статуса (только если не readonly) */}
          {!isReadOnly && (
            <form onSubmit={handleSubmit} className="mb-8 border-b pb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Изменить статус</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Новый статус</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border p-2 rounded">
                    <option value="pending_approval">На утверждении</option>
                    <option value="sent_to_contractor">Отправлено исполнителю</option>
                    <option value="in_progress">В работе</option>
                    <option value="on_review">На проверке (Технадзор)</option>
                    <option value="accepted">Принято</option>
                    <option value="completed">Завершено</option>
                    <option value="paused">Приостановлено</option>
                  </select>
                </div>
                {status === 'paused' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Причина паузы</label>
                    <select value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} className="w-full border p-2 rounded">
                      <option value="materials">Нет материалов</option>
                      <option value="finance">Нет финансирования</option>
                      <option value="quality">Брак / Качество</option>
                    </select>
                  </div>
                )}
              </div>

              {task.status === 'sent_to_contractor' && status === 'in_progress' && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Ваш гонорар (Исполнитель)</label>
                    <input type="number" step="0.01" value={contractorFee} required onChange={(e) => setContractorFee(e.target.value)} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">Гонорар прораба</label>
                    <input type="number" step="0.01" value={foremanFee} onChange={(e) => setForemanFee(e.target.value)} className="w-full border p-2 rounded" />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Комментарий</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border p-2 rounded" rows={2} placeholder="Комментарий к смене статуса..." />
              </div>

              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
                Сохранить изменения
              </button>
            </form>
          )}

          {/* История */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">История изменений</h4>
            {isLoadingHistory ? (
              <p className="text-gray-500 text-sm">Загрузка...</p>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-sm">Нет записей об изменениях.</p>
            ) : (
              <div className="space-y-4 border-l-2 border-gray-200 ml-2 pl-4">
                {history.map((h: any) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                    <p className="text-sm font-medium text-gray-800">
                      {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : `Создано (${h.toStatus})`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(h.createdAt).toLocaleString('ru-RU')} • {h.user?.fullName || 'Система'}
                    </p>
                    {h.comment && <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">{h.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}