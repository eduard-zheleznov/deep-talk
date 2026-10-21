import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  {
    title: 'Как вас зовут?',
    subtitle: 'Можно указать имя или псевдоним. Это поможет другим обращаться к вам в разговоре.',
  },
  {
    title: 'Данные для входа',
    subtitle: 'Email нужен для входа в приложение. Пароль должен быть не короче 6 символов.',
  },
  {
    title: 'Восстановление доступа',
    subtitle: 'Секретный вопрос поможет вернуть доступ, если пароль забудется.',
  },
];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretQuestion: '',
    secretAnswer: '',
  });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/groups';
  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const progressPercent = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step]
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep = () => {
    if (step === 0 && !formData.name.trim()) {
      toast.error('Введите имя или псевдоним');
      return false;
    }

    if (step === 1) {
      if (!formData.email.trim()) {
        toast.error('Введите email');
        return false;
      }

      if (!formData.email.includes('@')) {
        toast.error('Проверьте формат email');
        return false;
      }

      if (formData.password.length < 6) {
        toast.error('Пароль должен содержать минимум 6 символов');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Пароли не совпадают');
        return false;
      }
    }

    if (step === 2) {
      if (!formData.secretQuestion.trim()) {
        toast.error('Введите секретный вопрос');
        return false;
      }

      if (!formData.secretAnswer.trim()) {
        toast.error('Введите ответ на секретный вопрос');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLastStep) {
      handleNext();
      return;
    }

    if (!validateStep()) return;

    setLoading(true);

    try {
      await register(
        formData.email.trim(),
        formData.password,
        formData.secretQuestion.trim(),
        formData.secretAnswer.trim(),
        formData.name.trim()
      );
      toast.success('Регистрация успешна!');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-start justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4 pb-8 pt-6 sm:pt-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Pro Общение</h1>
          <p className="text-lg text-muted-foreground leading-snug">Улучшаем разговоры</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8 border border-border/50">
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Шаг {step + 1} из {STEPS.length}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold leading-tight">{currentStep.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{currentStep.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 0 && (
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Например, Эдуард"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  autoFocus
                  className="h-12"
                />
              </div>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    autoFocus
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Повторите пароль</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Ещё раз тот же пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="h-12"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="secretQuestion">Секретный вопрос</Label>
                  <Input
                    id="secretQuestion"
                    name="secretQuestion"
                    placeholder="Например, любимый город"
                    value={formData.secretQuestion}
                    onChange={handleChange}
                    autoFocus
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretAnswer">Ответ</Label>
                  <Input
                    id="secretAnswer"
                    name="secretAnswer"
                    placeholder="Ваш ответ"
                    value={formData.secretAnswer}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-14 shrink-0"
                  onClick={handleBack}
                  disabled={loading}
                  aria-label="Назад"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Button
                type="submit"
                className="h-12 flex-1 text-base"
                disabled={loading}
              >
                {loading ? 'Создаем аккаунт...' : isLastStep ? 'Создать аккаунт' : 'Далее'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link to="/login" state={{ from: redirectTo }} className="text-primary hover:underline font-medium">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
