import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', { fullName, email, password });
      // Автоматически логиним после регистрации
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/projects');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      // Если бэкенд вернул массив ошибок (валидация), берем первую
      setError(Array.isArray(msg) ? msg[0] : msg || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Регистрация</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Создайте аккаунт для доступа к системе</p>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <input
          type="text" placeholder="Ваше ФИО" required value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-gray-300 p-3 mb-4 rounded focus:outline-none focus:border-blue-500"
        />
        <input
          type="email" placeholder="Email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-3 mb-4 rounded focus:outline-none focus:border-blue-500"
        />
        <input
          type="password" placeholder="Пароль (мин. 8 символов)" required value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-3 mb-6 rounded focus:outline-none focus:border-blue-500"
        />
        
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition-colors mb-4">
          Зарегистрироваться
        </button>
        
        <p className="text-center text-sm text-gray-600">
          Уже есть аккаунт? <Link to="/login" className="text-blue-600 hover:underline">Войти</Link>
        </p>
      </form>
    </div>
  );
}