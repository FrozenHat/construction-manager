import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Stage, Task, User, AppDocument, Transaction } from '../types';
import TaskStatusModal from '../components/TaskStatusModal';
import UserProfileModal from '../components/UserProfileModal';

type Tab = 'tasks' | 'finance' | 'documents';

export default function ProjectDetailsPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [myRole, setMyRole] = useState<string>('client');

  // --- СОСТОЯНИЯ ---
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newMember, setNewMember] = useState({ userId: '', roleCode: 'contractor' });
  
  const [newStageName, setNewStageName] = useState('');
  const [newTask, setNewTask] = useState<Record<string, { name: string, foremanId: string, contractorId: string, clientPrice: string }>>({});
  
  const [selectedTask, setSelectedTask] = useState<{ stageId: string, task: Task } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);

  // Финансы
  const [balance, setBalance] = useState<string>('0.00');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseType, setExpenseType] = useState('work');
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Документы
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    determineRole();
  }, [projectId]);

  const determineRole = async () => {
    const globalRoles = currentUser.roles?.map((r: any) => r.code) || [];
    if (globalRoles.includes('chief') || globalRoles.includes('admin')) {
      setMyRole('chief');
      loadAllData();
      return;
    }

    try {
      const { data: membersData } = await api.get(`/projects/${projectId}/members`);
      setMembers(membersData);
      const myMembership = membersData.find((m: any) => m.userId === currentUser.id);
      
      if (myMembership) {
        setMyRole(myMembership.roleCode);
        if (myMembership.roleCode === 'contractor') {
          loadMyTasks();
        } else {
          loadAllData();
        }
      } else {
        setMyRole('none');
      }
    } catch (error) {
      console.error('Ошибка определения роли:', error);
    }
  };

  const loadAllData = () => {
    fetchStages();
    fetchUsers();
    fetchBalance();
    fetchDocuments();
    fetchTransactions();
  };

  const fetchStages = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/stages`);
      setStages(data);
      data.forEach((stage: Stage) => fetchTasks(stage.id));
    } catch (error) { console.error(error); }
  };

  const fetchTasks = async (stageId: string) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/stages/${stageId}/tasks`);
      setTasks(prev => ({ ...prev, [stageId]: data }));
    } catch (error) { console.error(error); }
  };

  const loadMyTasks = async () => {
    try {
      const { data: stagesData } = await api.get(`/projects/${projectId}/stages`);
      let allMyTasks: any[] = [];
      for (const stage of stagesData) {
        const { data: tasksData } = await api.get(`/projects/${projectId}/stages/${stage.id}/tasks`);
        const assigned = tasksData
          .filter((t: any) => t.contractorId === currentUser.id)
          .map((t: any) => ({ ...t, stageId: stage.id }));
        allMyTasks = [...allMyTasks, ...assigned];
      }
      setMyTasks(allMyTasks);
    } catch (error) { console.error(error); }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/members`);
      setMembers(data);
    } catch (error) { console.error(error); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setAllUsers(data);
    } catch (error) { console.warn('Нет доступа к списку пользователей'); }
  };

  const fetchBalance = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/transactions/balance`);
      setBalance(data.balance);
    } catch (error) { console.error(error); }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/documents`);
      setDocuments(data);
    } catch (error) { console.error(error); }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/transactions`);
      setTransactions(data);
    } catch (error) { console.error(error); }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/stages`, { name: newStageName });
      setNewStageName('');
      fetchStages();
    } catch (error) { alert('Ошибка при создании этапа'); }
  };

  const handleCreateTask = async (e: React.FormEvent, stageId: string) => {
    e.preventDefault();
    const taskData = newTask[stageId] || { name: '', foremanId: '', contractorId: '', clientPrice: '' };
    try {
      await api.post(`/projects/${projectId}/stages/${stageId}/tasks`, { 
        name: taskData.name,
        foremanId: taskData.foremanId || undefined,
        contractorId: taskData.contractorId || undefined,
        clientPrice: taskData.clientPrice || undefined,
      });
      setNewTask(prev => ({ ...prev, [stageId]: { name: '', foremanId: '', contractorId: '', clientPrice: '' } }));
      fetchTasks(stageId);
    } catch (error) { alert('Ошибка при создании задачи'); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/members`, newMember);
      setNewMember({ userId: '', roleCode: 'contractor' });
      fetchMembers();
    } catch (error: any) { alert(error.response?.data?.message || 'Ошибка'); }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingIncome(true);
    try {
      await api.post(`/projects/${projectId}/transactions`, {
        type: 'income', category: 'client_payment', amount: incomeAmount, comment: 'Пополнение'
      });
      setIncomeAmount('');
      fetchTransactions();
    } catch (error) { alert('Ошибка создания транзакции'); } 
    finally { setIsAddingIncome(false); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingExpense(true);
    try {
      await api.post(`/projects/${projectId}/transactions`, {
        type: 'expense', 
        category: expenseType, 
        amount: expenseAmount, 
        comment: 'Выплата по задаче'
      });
      setExpenseAmount('');
      fetchTransactions();
    } catch (error) { alert('Ошибка создания расхода'); } 
    finally { setIsAddingExpense(false); }
  };

  const handleApproveTransaction = async (txId: string) => {
    try {
      await api.patch(`/projects/${projectId}/transactions/${txId}/approve`);
      fetchBalance();
      fetchTransactions();
    } catch (error) { alert('Ошибка утверждения'); }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ownerType', 'project');
    formData.append('ownerId', projectId!);
    setIsUploading(true);
    try {
      await api.post(`/projects/${projectId}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDocuments();
    } catch (error) { alert('Ошибка загрузки файла'); } 
    finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/documents/${docId}/download`);
      window.open(data.url, '_blank');
    } catch (error) { alert('Ошибка получения ссылки'); }
  };

  const handleDeclineTask = async (stageId: string, taskId: string) => {
    if (!confirm('Вы уверены, что хотите отказаться?')) return;
    try {
      await api.post(`/projects/${projectId}/stages/${stageId}/tasks/${taskId}/decline`);
      loadMyTasks();
    } catch (error) {
      alert('Ошибка отказа');
    }
  };

  const handleRequestPayment = async (stageId: string, taskId: string) => {
    if (!confirm('Запросить выплату у бухгалтера?')) return;
    try {
      await api.post(`/projects/${projectId}/stages/${stageId}/tasks/${taskId}/request-payment`);
      loadMyTasks();
    } catch (error) {
      alert('Ошибка запроса выплаты');
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

  const formatMoney = (val: string | null) => new Intl.NumberFormat('ru-RU').format(Number(val || 0));
  
  const canSeeFinance = ['chief', 'admin', 'manager', 'accountant'].includes(myRole);
  const canManageTasks = ['chief', 'admin', 'manager'].includes(myRole);

  if (myRole === 'contractor') {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Мои задачи</h1>
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-red-500 text-sm hover:underline">Выйти</button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          {myTasks.map(task => (
            <div key={task.id} className="bg-white p-5 rounded-lg shadow border flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{task.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Статус: <span className={`px-2 py-1 rounded font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                </p>
                {task.contractorFee && (
                  <p className="text-sm text-green-600 font-medium mt-2 bg-green-50 inline-block px-2 py-1 rounded">
                    Ваш гонорар: {formatMoney(task.contractorFee)} MDL
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {task.status === 'sent_to_contractor' && (
                  <>
                    <button 
                      onClick={() => setSelectedTask({ stageId: (task as any).stageId, task })}
                      className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm"
                    >
                      Согласиться
                    </button>
                    <button 
                      onClick={() => handleDeclineTask((task as any).stageId, task.id)}
                      className="bg-red-100 text-red-700 px-5 py-2 rounded-lg hover:bg-red-200 font-medium"
                    >
                      Отказаться
                    </button>
                  </>
                )}
                {task.status === 'in_progress' && (
                  <button 
                    onClick={() => setSelectedTask({ stageId: (task as any).stageId, task })}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                  >
                    Сдать работу
                  </button>
                )}
                {task.status === 'accepted' && (
                  <button 
                    onClick={() => handleRequestPayment((task as any).stageId, task.id)}
                    className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 font-medium shadow-sm"
                  >
                    Запросить выплату
                  </button>
                )}
              </div>
            </div>
          ))}
          {myTasks.length === 0 && <p className="text-center text-gray-500 py-8">У вас пока нет назначенных задач.</p>}
        </main>
        
        {selectedTask && (
          <TaskStatusModal 
            projectId={projectId!} 
            stageId={selectedTask.stageId} 
            task={selectedTask.task} 
            viewerRole={myRole}
            onClose={() => setSelectedTask(null)} 
            onSuccess={() => { setSelectedTask(null); loadMyTasks(); }} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
          <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline">← Назад</button>
          <h1 className="text-xl font-bold text-gray-800">Управление проектом</h1>
          
          <div className="ml-auto flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'tasks' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Задачи</button>
            {canSeeFinance && (
              <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'finance' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Финансы</button>
            )}
            <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'documents' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Документы</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-3">
          
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {canManageTasks && (
                <form onSubmit={handleCreateStage} className="bg-white p-4 rounded-lg shadow-sm flex gap-4 border">
                  <input type="text" placeholder="Название нового этапа" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} required className="flex-1 border p-2 rounded" />
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Добавить этап</button>
                </form>
              )}

              {stages.map(stage => (
                <div key={stage.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800">{stage.name}</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-4">
                      {(tasks[stage.id] || []).map(task => (
                        <div key={task.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 border rounded-lg hover:bg-gray-50 bg-white gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-lg">{task.name}</p>
                            <div className="flex gap-3 items-center mt-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              {task.clientPrice && (myRole !== 'supervisor') && (
                                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                  Клиенту: {formatMoney(task.clientPrice)} MDL
                                </span>
                              )}
                              {task.contractorFee && (
                                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                  Исполнителю: {formatMoney(task.contractorFee)} MDL
                                </span>
                              )}
                            </div>

                            <div className="flex gap-6 mt-4 pt-3 border-t text-sm">
                              <div>
                                <span className="text-gray-400 text-xs">Прораб:</span>{' '}
                                {task.foreman ? (
                                  <button onClick={() => setSelectedProfile(task.foreman!)} className="text-blue-600 font-medium hover:underline">
                                    {task.foreman.fullName}
                                  </button>
                                ) : (
                                  <span className="text-gray-400 italic">Не назначен</span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-400 text-xs">Исполнитель:</span>{' '}
                                {task.contractor ? (
                                  <button onClick={() => setSelectedProfile(task.contractor!)} className="text-blue-600 font-medium hover:underline">
                                    {task.contractor.fullName}
                                  </button>
                                ) : (
                                  <span className="text-gray-400 italic">Не назначен</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="ml-0 md:ml-4 flex flex-col gap-2">
                            {myRole === 'client' ? (
                              <button onClick={() => setSelectedTask({ stageId: stage.id, task })} className="text-sm bg-gray-100 border px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">История</button>
                            ) : (
                              <button onClick={() => setSelectedTask({ stageId: stage.id, task })} className="text-sm bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium shadow-sm">Изменить статус</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {canManageTasks && (
                      <form onSubmit={(e) => handleCreateTask(e, stage.id)} className="bg-gray-50 p-4 rounded-lg border flex flex-col gap-3">
                        <input type="text" placeholder="Название новой задачи" required value={newTask[stage.id]?.name || ''} onChange={(e) => setNewTask(prev => ({ ...prev, [stage.id]: { ...prev[stage.id], name: e.target.value } }))} className="border p-2 rounded text-sm" />
                        <div className="flex flex-col md:flex-row gap-2">
                          <select value={newTask[stage.id]?.foremanId || ''} onChange={(e) => setNewTask(prev => ({ ...prev, [stage.id]: { ...prev[stage.id], foremanId: e.target.value } }))} className="flex-1 border p-2 rounded text-sm text-gray-600">
                            <option value="">Прораб (не выбран)</option>
                            {allUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                          </select>
                          <select value={newTask[stage.id]?.contractorId || ''} onChange={(e) => setNewTask(prev => ({ ...prev, [stage.id]: { ...prev[stage.id], contractorId: e.target.value } }))} className="flex-1 border p-2 rounded text-sm text-gray-600">
                            <option value="">Исполнитель (не выбран)</option>
                            {allUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 items-center">
                          <input type="number" step="0.01" placeholder="Цена для клиента (MDL)" value={newTask[stage.id]?.clientPrice || ''} onChange={(e) => setNewTask(prev => ({ ...prev, [stage.id]: { ...prev[stage.id], clientPrice: e.target.value } }))} className="flex-1 border p-2 rounded text-sm" />
                          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700 font-medium w-full md:w-auto">+ Добавить задачу</button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'finance' && canSeeFinance && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                <h3 className="text-gray-500 font-medium mb-2">Текущий баланс проекта</h3>
                <p className={`text-5xl font-bold ${Number(balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatMoney(balance)} <span className="text-2xl">MDL</span>
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold mb-4">Внести поступление</h3>
                <form onSubmit={handleAddIncome} className="flex flex-col md:flex-row gap-4">
                  <input type="number" step="0.01" placeholder="Сумма в MDL" required value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className="flex-1 border p-2 rounded" />
                  <button type="submit" disabled={isAddingIncome} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium">
                    {isAddingIncome ? 'Отправка...' : 'Создать транзакцию'}
                  </button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold mb-4">Внести расход (Оплата работ/материалов)</h3>
                <form onSubmit={handleAddExpense} className="flex flex-col md:flex-row gap-4">
                  <select value={expenseType} onChange={(e) => setExpenseType(e.target.value)} className="border p-2 rounded">
                    <option value="work">Оплата работ</option>
                    <option value="material">Оплата материалов</option>
                  </select>
                  <input type="number" step="0.01" placeholder="Сумма MDL" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="flex-1 border p-2 rounded" />
                  <button type="submit" disabled={isAddingExpense} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50 font-medium">
                    {isAddingExpense ? 'Отправка...' : 'Списать средства'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h3 className="text-lg font-bold">История операций</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b text-sm text-gray-600">
                        <th className="p-3 font-semibold">Дата</th>
                        <th className="p-3 font-semibold">Тип</th>
                        <th className="p-3 font-semibold">Сумма</th>
                        <th className="p-3 font-semibold">Статус</th>
                        <th className="p-3 font-semibold">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-b last:border-0 text-sm hover:bg-gray-50">
                          <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString('ru-RU')}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {tx.type === 'income' ? 'Приход' : 'Расход'}
                            </span>
                          </td>
                          <td className="p-3 font-medium whitespace-nowrap">{formatMoney(tx.amount)} MDL</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`text-xs font-medium ${tx.status === 'approved' ? 'text-green-600' : tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {tx.status === 'approved' ? 'Утверждено' : tx.status === 'pending' ? 'Ожидает' : 'Отклонено'}
                            </span>
                          </td>
                          <td className="p-3">
                            {tx.status === 'pending' && (
                              <button onClick={() => handleApproveTransaction(tx.id)} className="text-blue-600 hover:underline font-medium text-xs">Утвердить</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Нет операций</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold">Документы проекта</h3>
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleUploadFile} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium">
                    {isUploading ? 'Загрузка...' : '+ Загрузить файл'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Нет загруженных документов</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">Версия {doc.version} • {(Number(doc.sizeBytes) / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => handleDownload(doc.id)} className="text-blue-600 hover:underline text-sm font-medium">Скачать</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {canManageTasks && (
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-24">
              <h3 className="text-lg font-bold mb-4">Команда проекта</h3>
              <div className="space-y-2 mb-6">
                {members.map(m => (
                  <div key={m.id} className="text-sm border-b pb-2">
                    <button onClick={() => setSelectedProfile(m.user)} className="font-medium text-blue-600 hover:underline">{m.user.fullName}</button>
                    <p className="text-gray-500 text-xs">{m.role.name}</p>
                  </div>
                ))}
                {members.length === 0 && <p className="text-gray-500 text-sm italic">Нет участников</p>}
              </div>

              <form onSubmit={handleAddMember} className="flex flex-col gap-2 border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">ДОБАВИТЬ В КОМАНДУ</p>
                <select required value={newMember.userId} onChange={(e) => setNewMember(prev => ({ ...prev, userId: e.target.value }))} className="border p-2 rounded text-sm">
                  <option value="">Выберите пользователя...</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
                <select required value={newMember.roleCode} onChange={(e) => setNewMember(prev => ({ ...prev, roleCode: e.target.value }))} className="border p-2 rounded text-sm">
                  <option value="manager">Менеджер</option>
                  <option value="contractor">Исполнитель</option>
                  <option value="supervisor">Технадзор</option>
                  <option value="client">Клиент</option>
                  <option value="buyer">Закупщик</option>
                  <option value="accountant">Бухгалтер</option>
                </select>
                <button type="submit" className="bg-gray-800 text-white p-2 rounded text-sm hover:bg-black font-medium">Добавить</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {selectedTask && (
        <TaskStatusModal 
          projectId={projectId!} stageId={selectedTask.stageId} task={selectedTask.task} 
          viewerRole={myRole}
          onClose={() => setSelectedTask(null)} 
          onSuccess={() => { fetchStages(); fetchBalance(); }} 
        />
      )}

      {selectedProfile && (
        <UserProfileModal user={selectedProfile} viewerRole={myRole} onClose={() => setSelectedProfile(null)} />
      )}
    </div>
  );
}