import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface RegisterFormProps {
  onSuccess?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function RegisterForm({ onSuccess, onDirtyChange }: RegisterFormProps) {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    organizationName: '',
    fullName: '',
    emailCode: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showCodeField, setShowCodeField] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Таймер обновления resendTimer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Следим за изменениями формы и уведомляем родителя
  useEffect(() => {
    const isDirty = Object.values(form).some((v) => v.trim && v.trim().length > 0);
    setDirty(isDirty);
    onDirtyChange && onDirtyChange(isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Проверка email на валидность
  const isEmailValid = form.email.match(/^\S+@\S+\.\S+$/);

  // Универсальная функция отправки email verification code
  const sendEmailCode = async () => {
    if (!isEmailValid || loadingSend || resendTimer > 0 || emailSent) return false;
    setLoadingSend(true);
    setInfo(null);
    setError(null);
    try {
      const res = await fetch('/api/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Ошибка отправки кода');
        setEmailSent(false);
        return false;
      }
      setEmailSent(true);
      setResendTimer(60);
      setShowCodeField(true);
      setInfo('Код отправлен на email');
      return true;
    } catch (e) {
      setError('Ошибка сети при отправке кода');
      return false;
    } finally {
      setLoadingSend(false);
    }
  };

  // Автоматическая отправка email verification code при потере фокуса
  const handleEmailBlur = async () => {
    if (!emailSent) await sendEmailCode();
  };

  useEffect(() => {
    if (success && autoLogin) {
      navigate('/dashboard');
    }
  }, [success, autoLogin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (!form.email || !form.password || !form.username || !form.organizationName) {
        setError('Заполните все обязательные поля');
        setLoading(false);
        return;
      }
      if (!form.emailCode) {
        setError('Введите код из письма');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          username: form.username,
          organizationName: form.organizationName,
          fullName: form.fullName,
          code: form.emailCode
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Ошибка регистрации');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.autoLogin) {
        setSuccess(true);
        setAutoLogin(true);
        setInfo('Регистрация успешна! Перенаправление...');
      } else {
        setSuccess(true);
        setAutoLogin(false);
        setInfo('Регистрация успешна, но автоматический вход не выполнен. Пожалуйста, войдите вручную.');
      }
      onSuccess && onSuccess();
    } catch (e) {
      setError('Ошибка сети при регистрации');
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Сбросить статусы при изменении email или кода
    if (name === 'email') {
      setEmailSent(false);
      setInfo(null);
      setError(null);
    }
    if (name === 'emailCode') {
      setInfo(null);
      setError(null);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="bg-white p-4 rounded text-center">
          <h2 className="text-xl font-bold mb-2">Проверьте почту</h2>
          <p className="text-sm mb-4">Письмо для подтверждения регистрации отправлено на {form.email}.<br />После подтверждения вы сможете войти в систему.</p>
          <button
            className="mt-2 px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            type="button"
            onClick={onSuccess}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-center">Регистрация</h2>
      <div>
        <label className="block mb-1 font-medium">Email</label>
        <div className="relative">
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            className="w-full border px-3 py-2 rounded pr-8"
            required
          />
          {loadingSend && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </span>
          )}
        </div>
      </div>
      {/* Поле для кода подтверждения email */}
      <div
        style={{
          maxHeight: emailSent ? 80 : 0,
          opacity: emailSent ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(.4,2,.6,1)',
          overflow: 'hidden',
          marginBottom: emailSent ? 16 : 0
        }}
      >
        <label className="block mb-1 font-medium">Код из почты</label>
        <div className="relative">
          <input
            name="emailCode"
            value={form.emailCode || ''}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded pr-8"
            placeholder="Введите код из письма"
            autoComplete="one-time-code"
          />
        </div>
      </div>
      <div>
        <label className="block mb-1 font-medium">Имя пользователя</label>
        <input name="username" value={form.username} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
      </div>
      <div>
        <label className="block mb-1 font-medium">Полное имя</label>
        <input name="fullName" value={form.fullName} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Название организации</label>
        <input name="organizationName" value={form.organizationName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
      </div>
      <div>
        <label className="block mb-1 font-medium">Пароль</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
      </div>
      {info && <div className="text-blue-700 text-sm">{info}</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
        disabled={loading || !emailSent || !form.emailCode}
      >
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
      <div className="flex justify-end mt-1">
        {showCodeField && (
          <button
            type="button"
            className="text-xs text-gray-600 underline"
            disabled={resendTimer > 0}
            style={{ opacity: resendTimer > 0 ? 0.5 : 1 }}
            onClick={handleEmailBlur}
          >
            {resendTimer > 0 ? `Отправить код повторно через ${resendTimer} сек` : 'Отправить код повторно'}
          </button>
        )}
      </div>
    </form>
  );
}
