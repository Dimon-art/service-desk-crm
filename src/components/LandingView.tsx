import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquare,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

interface LandingViewProps {
  onCreateRequest?: () => void;
}

const steps = [
  {
    number: '01',
    title: 'Создайте заявку',
    text: 'Опишите вопрос или проблему. Чем подробнее обращение, тем быстрее команда сможет помочь.',
  },
  {
    number: '02',
    title: 'Мы обработаем обращение',
    text: 'Заявка попадёт ответственному сотруднику и будет проходить понятные этапы обработки.',
  },
  {
    number: '03',
    title: 'Получите результат',
    text: 'Следите за статусом и историей обращения до полного решения вопроса.',
  },
];

const advantages = [
  {
    icon: Ticket,
    title: 'Все обращения в одном месте',
    text: 'Заявки не теряются в почте и мессенджерах.',
  },
  {
    icon: Clock3,
    title: 'Понятные статусы',
    text: 'Всегда видно, на каком этапе находится обращение.',
  },
  {
    icon: ShieldCheck,
    title: 'Ответственные сотрудники',
    text: 'Каждая заявка может быть назначена конкретному специалисту.',
  },
  {
    icon: MessageSquare,
    title: 'История общения',
    text: 'Комментарии и изменения статуса сохраняются вместе с заявкой.',
  },
];

export default function LandingView({
  onCreateRequest,
}: LandingViewProps) {
  const handleCreateRequest = () => {
    if (onCreateRequest) {
      onCreateRequest();
      return;
    }

    window.location.href = '/create-request';
  };

  const handleManagerLogin = () => {
    window.location.href = '/?token=manager';
  };

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#171717]">
      {/* Header */}
      <header className="border-b border-black/10 bg-[#f4f1eb]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-[#f4c542]">
              <Ticket size={21} strokeWidth={2.5} />
            </div>

            <div>
              <div className="text-lg font-black tracking-tight">
                Сервис заявок
              </div>
              <div className="text-xs font-medium text-[#6b6258]">
                Трекер обращений команды
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManagerLogin}
            className="hidden rounded-xl border border-[#171717] px-5 py-2.5 text-sm font-bold transition hover:bg-[#171717] hover:text-white sm:block"
          >
            Войти для сотрудников
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid min-h-[calc(100svh-190px)] max-w-7xl items-center gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-7">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7c7ae] bg-[#eee6d8] px-4 py-2 text-sm font-bold text-[#665846]">
                <span className="h-2 w-2 rounded-full bg-[#e87521]" />
                Единое пространство для обращений
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Решаем обращения
                <span className="block text-[#e87521]">
                  быстро и прозрачно
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5f574e] sm:text-xl">
                Создавайте заявки, следите за их статусом и получайте помощь
                команды в одном удобном сервисе.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCreateRequest}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#e87521] px-6 py-3.5 text-base font-black text-white shadow-lg shadow-[#e87521]/20 transition hover:-translate-y-0.5 hover:bg-[#d96312]"
                >
                  Создать заявку
                  <ArrowRight
                    size={19}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={handleManagerLogin}
                  className="inline-flex items-center justify-center rounded-xl border-2 border-[#171717] px-6 py-3.5 text-base font-black transition hover:bg-[#171717] hover:text-white sm:hidden"
                >
                  Войти для сотрудников
                </button>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#f4c542]/40 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#e87521]/20 blur-3xl" />

              <div className="relative rounded-[2rem] border border-black/10 bg-[#1d1d1b] p-3 shadow-2xl">
                <div className="rounded-[1.5rem] bg-[#f7f4ee] p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-black/10 pb-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#817568]">
                        Заявка #1042
                      </div>
                      <div className="mt-1 text-lg font-black">
                        Не работает рабочее место
                      </div>
                    </div>

                    <div className="rounded-full bg-[#f4c542] px-3 py-1 text-xs font-black">
                      В работе
                    </div>
                  </div>

                  <div className="space-y-2 py-4">
                    {[
                      ['Новая', true],
                      ['Назначена специалисту', true],
                      ['В работе', true],
                      ['Решение', false],
                    ].map(([label, done], index) => (
                      <div
                        key={label}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            done
                              ? 'bg-[#e87521] text-white'
                              : 'border border-black/15 bg-white text-[#aaa]'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <span className="text-xs font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-sm font-bold ${
                            done ? 'text-[#292622]' : 'text-[#999187]'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-[#ebe3d6] p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#817568]">
                      Последний комментарий
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#403a34]">
                      Специалист уже проверяет обращение. Вернёмся с результатом
                      после диагностики.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="border-y border-black/10 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[#e87521]">
                Как это работает
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                От обращения до решения
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="rounded-2xl border border-black/10 bg-[#f4f1eb] p-7"
                >
                  <div className="text-5xl font-black tracking-tight text-[#f4c542]">
                    {step.number}
                  </div>

                  <h3 className="mt-7 text-xl font-black">
                    {step.title}
                  </h3>

                  <p className="mt-3 leading-7 text-[#686057]">
                    {step.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages */}
        <section>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.18em] text-[#e87521]">
                  Почему удобно
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Меньше хаоса.
                  <br />
                  Больше контроля.
                </h2>

                <p className="mt-5 max-w-md leading-7 text-[#686057]">
                  Сервис помогает команде видеть весь путь заявки и не
                  терять важные обращения.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {advantages.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4c542]/30 text-[#171717]">
                        <Icon size={21} />
                      </div>

                      <h3 className="mt-5 font-black">{item.title}</h3>

                      <p className="mt-2 text-sm leading-6 text-[#71685f]">
                        {item.text}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-16 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#171717] px-7 py-12 text-white sm:px-12 lg:py-16">
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.18em] text-[#f4c542]">
                  Готовы начать?
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Создайте первое обращение
                </h2>

                <p className="mt-3 max-w-xl leading-7 text-white/65">
                  Опишите задачу, а команда поддержки займётся её обработкой.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateRequest}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#f4c542] px-6 py-3.5 font-black text-[#171717] transition hover:bg-[#ffd75f]"
              >
                Создать заявку
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-[#ebe6de]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-7 text-sm text-[#756c62] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="font-bold text-[#292622]">
            Сервис заявок
          </span>
          <span>Внутренний сервис поддержки команды</span>
        </div>
      </footer>
    </div>
  );
}