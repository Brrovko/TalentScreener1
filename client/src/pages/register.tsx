import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    organizationName: '',
    fullName: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.email.match(/^\S+@\S+\.\S+$/)) return 'Введите корректный email';
    if (!form.username.trim()) return 'Имя пользователя обязательно';
    if (!form.organizationName.trim()) return 'Название организации обязательно';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      return 'Пароль должен быть не менее 8 символов, содержать букву, цифру и спецсимвол';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.status === 201) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Проверьте почту</h2>
          <p>Письмо для подтверждения регистрации отправлено на {form.email}.<br />После подтверждения вы сможете войти в систему.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Имя пользователя</label>
          <input name="username" value={form.username} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Полное имя</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Название организации</label>
          <input name="organizationName" value={form.organizationName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Пароль</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">Уже есть аккаунт? Войти</a>
        </div>
      </form>
    </div>
  );
}
