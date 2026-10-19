import { useState } from 'react';
import { api } from '../api/client';

interface Props {
  projectId: string;
  stageId: string;
  task: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskStatusModal({ projectId, stageId, task, onClose, onSuccess }: Props) {
  const [status, setStatus] = useState(task.status);
  const [comment, setComment] = useState('');
  const [contractorFee, setContractorFee] = useState(task.contractorFee || '');
  const [foremanFee, setForemanFee] = useState(task.foremanFee || '');
  const [pauseReason, setPauseReason] = useState('materials');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const payload: any = { status, comment };
      
      // Если берем в работу из статуса sent_to_contractor — требуем ввести сумму
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
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold mb-4">Смена статуса задачи</h3>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Новый статус</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="pending_approval">На утверждении</option>
              <option value="sent_to_contractor">Отправлено исполнителю</option>
              <option value="in_progress">В работе</option>
              <option value="on_review">На проверке (Технадзор)</option>
              <option value="accepted">Принято</option>
              <option value="completed">Завершено</option>
              <option value="paused">Приостановлено</option>
            </select>
          </div>

          {/* Блок ввода стоимости, если исполнитель принимает задачу */}
          {task.status === 'sent_to_contractor' && status === 'in_progress' && (
            <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-200">
              <p className="text-sm text-blue-800 mb-2 font-medium">Подтверждение условий</p>
              <div className="mb-2">
                <label className="block text-xs mb-1">Ваш гонорар (Исполнитель)</label>
                <input 
                  type="number" step="0.01" value={contractorFee} required
                  onChange={(e) => setContractorFee(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Гонорар прораба</label>
                <input 
                  type="number" step="0.01" value={foremanFee}
                  onChange={(e) => setForemanFee(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
          )}

          {/* Блок паузы */}
          {status === 'paused' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Причина паузы</label>
              <select 
                value={pauseReason} 
                onChange={(e) => setPauseReason(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="materials">Нет материалов</option>
                <option value="finance">Нет финансирования</option>
                <option value="quality">Брак / Качество</option>
              </select>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              className="w-full border p-2 rounded" 
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              Отмена
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}