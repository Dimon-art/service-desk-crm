import React, { useState } from 'react';
import { 
  Mail, 
  User, 
  Type, 
  AlignLeft, 
  Send, 
  CheckCircle2, 
  ArrowLeft, 
  Terminal, 
  ShieldAlert, 
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { CreateRequestInput, SupportRequest } from '../types';

interface CreateRequestFormProps {
  onAddRequest: (input: CreateRequestInput) => Promise<SupportRequest>;
  onNavigateHome: () => void;
  onNavigateList: () => void;
}

export default function CreateRequestForm({
  onAddRequest,
  onNavigateHome,
  onNavigateList,
}: CreateRequestFormProps) {
  const [formData, setFormData] = useState<CreateRequestInput>({
    requester_name: '',
    requester_email: '',
    title: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<CreateRequestInput>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successRequest, setSuccessRequest] = useState<SupportRequest | null>(null);

  const validate = (): boolean => {
    const newErrors: Partial<CreateRequestInput> = {};
    if (!formData.requester_name.trim()) {
      newErrors.requester_name = 'Пожалуйста, введите ваше имя';
    }
    if (!formData.requester_email.trim()) {
      newErrors.requester_email = 'Пожалуйста, введите адрес электронной почты';
    } else if (!formData.requester_email.includes('@')) {
      newErrors.requester_email = 'Адрес электронной почты должен содержать символ @';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Пожалуйста, укажите тему обращения';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Пожалуйста, подробно опишите вашу проблему';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const created = await onAddRequest(formData);
      setSuccessRequest(created);
      setFormData({ requester_name: '', requester_email: '', title: '', description: '' });
    } catch (err: any) {
      setGeneralError(err.message || 'Произошла непредвиденная ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successRequest) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#14213D]">Заявка успешно зарегистрирована</h2>
          <p className="text-xs text-[#64748B]">
            Обращению в службу поддержки присвоен регистрационный номер <span className="font-mono font-extrabold text-[#4D83FF] bg-blue-50 px-2 py-0.5 rounded">#{successRequest.id}</span>
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4.5 text-left space-y-2.5 text-xs text-[#14213D]">
          <div className="flex justify-between border-b border-slate-200/50 pb-2">
            <span className="font-semibold text-slate-400">Тема:</span>
            <span className="font-extrabold text-[#14213D] truncate max-w-[280px]">{successRequest.title}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/50 pb-2">
            <span className="font-semibold text-slate-400">Отправитель:</span>
            <span className="font-extrabold text-[#14213D]">{successRequest.requester_name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/50 pb-2">
            <span className="font-semibold text-slate-400">Регистр. Email:</span>
            <span className="font-mono text-slate-600">{successRequest.requester_email}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="font-semibold text-slate-400">Статус SLA:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#4D83FF] border border-blue-100 uppercase tracking-wider">Новая</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-4 justify-center">
          <button
            onClick={() => setSuccessRequest(null)}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Создать еще одну заявку
          </button>
          <button
            onClick={onNavigateList}
            className="px-4 py-2.5 bg-[#4D83FF] hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/10"
          >
            Перейти к списку заявок
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Кнопка возврата */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#4D83FF] transition uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Вернуться на главную
        </button>
        <span className="text-xs text-slate-400 font-extrabold font-mono">ФОРМА РЕГИСТРАЦИИ</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Контейнер формы (3 колонки) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#14213D] uppercase tracking-wider">Создание обращения</h2>
            <p className="text-xs text-[#64748B] font-light">Заполните форму для отправки заявки инженерам технической поддержки.</p>
          </div>

          {generalError && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-3.5 text-xs font-semibold">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ФИО */}
            <div className="space-y-1.5">
              <label htmlFor="requester_name" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                ФИО заявителя <span className="text-[#D84A5A]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="requester_name"
                  type="text"
                  value={formData.requester_name}
                  onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                  placeholder="Иван Иванов"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                    errors.requester_name ? 'border-[#D84A5A] focus:ring-red-50' : 'border-slate-200/80 focus:border-[#4D83FF]'
                  } rounded-xl outline-none focus:bg-white text-xs text-[#14213D] transition font-medium`}
                />
              </div>
              {errors.requester_name && (
                <p className="text-[10px] text-[#D84A5A] font-bold">{errors.requester_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="requester_email" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Служебный Email <span className="text-[#D84A5A]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="requester_email"
                  type="text"
                  value={formData.requester_email}
                  onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                  placeholder="i.ivanov@company.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                    errors.requester_email ? 'border-[#D84A5A] focus:ring-red-50' : 'border-slate-200/80 focus:border-[#4D83FF]'
                  } rounded-xl outline-none focus:bg-white text-xs text-[#14213D] transition font-medium`}
                />
              </div>
              {errors.requester_email && (
                <p className="text-[10px] text-[#D84A5A] font-bold">{errors.requester_email}</p>
              )}
            </div>

            {/* Тема */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Тема / Название инцидента <span className="text-[#D84A5A]">*</span>
              </label>
              <div className="relative">
                <Type className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Сбой авторизации в CRM"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                    errors.title ? 'border-[#D84A5A] focus:ring-red-50' : 'border-slate-200/80 focus:border-[#4D83FF]'
                  } rounded-xl outline-none focus:bg-white text-xs text-[#14213D] transition font-medium`}
                />
              </div>
              {errors.title && (
                <p className="text-[10px] text-[#D84A5A] font-bold">{errors.title}</p>
              )}
            </div>

            {/* Описание */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Детальное описание проблемы <span className="text-[#D84A5A]">*</span>
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Опишите хронологию возникновения неисправности и шаги её воспроизведения..."
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${
                    errors.description ? 'border-[#D84A5A] focus:ring-red-50' : 'border-slate-200/80 focus:border-[#4D83FF]'
                  } rounded-xl outline-none focus:bg-white text-xs text-[#14213D] resize-none transition font-medium`}
                />
              </div>
              {errors.description && (
                <p className="text-[10px] text-[#D84A5A] font-bold">{errors.description}</p>
              )}
            </div>

            {/* Кнопка отправки */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#4D83FF] hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/10 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Отправка в систему...' : 'Зарегистрировать инцидент'}
              </button>
            </div>
          </form>
        </div>

        {/* Информационная боковая панель (2 колонки) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#172033] text-slate-300 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
              <Terminal className="w-4 h-4 text-[#4D83FF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Регламент Service Desk</h3>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-300 font-light">
              <div className="space-y-1">
                <span className="font-bold text-white block">1. Время ответа</span>
                <p className="leading-relaxed text-[11px] text-slate-400">Инциденты обрабатываются в реальном времени. Среднее время первой реакции диспетчера составляет до 15 минут.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-white block">2. Приоритеты SLA</span>
                <p className="leading-relaxed text-[11px] text-slate-400">Назначение инженера поддержки L1/L2 и установка критичности дедлайна происходят автоматически на основе темы и специфики тикета.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-white block">3. Логирование</span>
                <p className="leading-relaxed text-[11px] text-slate-400">Все изменения статуса, комментарии и время реагирования записываются в атомарный реестр БД.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm text-xs text-[#14213D]">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#14213D]">
              <ShieldCheck className="w-4.5 h-4.5 text-[#159570]" />
              <span className="font-bold uppercase tracking-wider text-[10px]">Безопасность БД</span>
            </div>
            <p className="text-slate-500 leading-relaxed font-light text-[11px]">
              Данные хранятся в защищенном виде во внутренней базе SQLite. Доступ к контактным данным заявителя строго регламентирован правами авторизации инженера.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
