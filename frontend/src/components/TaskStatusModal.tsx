import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface Props {
  projectId: string;
  stageId: string;
  task: any;
  onClose: () => void;
  onSuccess: () => void;
  viewerRole?: string;
}

export default function TaskStatusModal({ projectId, stageId, task, onClose, onSuccess, viewerRole = 'manager' }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // Поля для менеджера
  const [status, setStatus] = useState(task.status);
  const [pauseReason, setPauseReason] = useState('materials');
  
  // Поля для исполнителя
  const [contractorFee, setContractorFee] = useState(task.contractorFee || '');
  
  // Поля для всех
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const isReadOnly = viewerRole === 'client';
  const isContractor = viewerRole === 'contractor';
  const isSupervisor = viewerRole === 'supervisor';

  useEffect(() => {
    api.get(`/projects/${projectId}/stages/${stageId}/tasks/${task.id}/history`)
      .then(res => setHistory(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingHistory(false));
  }, [projectId, stageId, task.id]);

  // --- ЛОГИКА СОХРАНЕНИЯ ---

  const handleManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: any = { status, comment };
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

  const handleContractorAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/projects/${projectId}/stages/${stageId}/tasks/${task.id}/accept`, {
        contractorFee,
        comment
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка принятия задачи');
    }
  };

  const handleContractorSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/projects/${projectId}/stages/${stageId}/tasks/${task.id}/status`, {
        status: 'on_review',
        comment: comment || 'Работа сдана исполнителем',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сдачи работы');
    }
  };

  const handleSupervisorReview = async (newStatus: 'accepted' | 'paused') => {
    setError('');
    try {
      await api.post(`/projects/${projectId}/stages/${stageId}/tasks/${task.id}/review`, {
        status: newStatus,
        comment
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка проверки');
    }
  };

  // ================= ОТРИСОВКА =================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-800">
            {isContractor ? 'Принятие задачи' : isSupervisor ? 'Проверка задачи' : isReadOnly ? 'История задачи' : 'Управление задачей'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

          {/* ФОРМА ДЛЯ ИСПОЛНИТЕЛЯ (ПРИНЯТИЕ) */}
          {isContractor && task.status === 'sent_to_contractor' && (
            <form onSubmit={handleContractorAccept} className="mb-8 border-b pb-6 bg-blue-50 p-4 rounded-lg border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 text-lg">Условия работы</h4>
              <p className="text-sm text-blue-800 mb-4">Вы собираетесь взять задачу <strong>«{task.name}»</strong>. Укажите вашу стоимость.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-900 mb-1">Ваш гонорар (MDL)</label>
                <input 
                  type="number" step="0.01" required 
                  value={contractorFee} onChange={(e) => setContractorFee(e.target.value)} 
                  className="w-full border border-blue-300 p-2 rounded focus:ring-2 focus:ring-blue-500" 
                  placeholder="Например: 15000"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-900 mb-1">Комментарий (опционально)</label>
                <textarea 
                  value={comment} onChange={(e) => setComment(e.target.value)} 
                  className="w-full border border-blue-300 p-2 rounded focus:ring-2 focus:ring-blue-500" 
                  rows={2} placeholder="Сроки, условия и т.д." 
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium shadow-sm">
                  Отправить менеджеру
                </button>
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 font-medium">
                  Отмена
                </button>
              </div>
            </form>
          )}

          {/* ФОРМА ДЛЯ ИСПОЛНИТЕЛЯ (СДАТЬ РАБОТУ) */}
          {isContractor && task.status === 'in_progress' && (
            <form onSubmit={handleContractorSubmitWork} className="mb-8 border-b pb-6 bg-yellow-50 p-4 rounded-lg border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3 text-lg">Сдача работы</h4>
              <p className="text-sm text-yellow-800 mb-4">
                Вы сдаете задачу <strong>«{task.name}»</strong>. Она уйдет на проверку Технадзору.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-yellow-900 mb-1">Комментарий (опционально)</label>
                <textarea 
                  value={comment} onChange={(e) => setComment(e.target.value)} 
                  className="w-full border border-yellow-300 p-2 rounded focus:ring-2 focus:ring-yellow-500" 
                  rows={2} placeholder="Опишите, что было сделано..." 
                />
              </div>

              <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 font-medium shadow-sm">
                Сдать работу Технадзору
              </button>
            </form>
          )}

          {/* ФОРМА ДЛЯ ТЕХНАДЗОРА */}
          {isSupervisor && task.status === 'on_review' && (
            <div className="mb-8 border-b pb-6 bg-orange-50 p-4 rounded-lg border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3 text-lg">Отчет о проверке</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-orange-900 mb-1">Комментарий к отчету</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-orange-300 p-2 rounded" rows={3} placeholder="Опишите выявленные недостатки или подтвердите качество..." />
              </div>
              {/* Заглушка для фото (в будущем прикрепим MinIO) */}
              <div className="mb-4 border-2 border-dashed border-orange-300 p-4 text-center rounded text-orange-700">
                📷 Прикрепить фотоотчет (будет реализовано позже)
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => handleSupervisorReview('accepted')} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium">Принять и завершить</button>
                <button type="button" onClick={() => handleSupervisorReview('paused')} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-medium">Приостановить (Брак)</button>
              </div>
            </div>
          )}

          {/* ФОРМА ДЛЯ МЕНЕДЖЕРА (ОБЩАЯ) */}
          {!isContractor && !isSupervisor && !isReadOnly && (
            <form onSubmit={handleManagerSubmit} className="mb-8 border-b pb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Изменить статус</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Новый статус</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border p-2 rounded">
                    <option value="pending_approval">На утверждении</option>
                    <option value="sent_to_contractor">Отправить исполнителю</option>
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
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Комментарий</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border p-2 rounded" rows={2} placeholder="Комментарий к смене статуса..." />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
                Сохранить изменения
              </button>
            </form>
          )}

          {/* ИСТОРИЯ */}
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