import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Bot, ChevronRight, CircleHelp, Download, FileQuestion, Info, LogOut, MessageCircleQuestion, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { InstructionsDialog } from '../components/InstructionsDialog';
import { SupportDialog } from '../components/SupportDialog';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { toast } from 'sonner';

const SettingRow = ({ icon: Icon, title, description, onClick, tone = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${tone === 'danger' ? 'text-destructive' : ''}`}
  >
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone === 'danger' ? 'bg-destructive/10' : 'bg-primary/10 text-primary'}`}>
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block font-semibold">{title}</span>
      {description && <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{description}</span>}
    </span>
    {tone !== 'danger' && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
  </button>
);

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { installed, canPrompt, install } = usePwaInstall();
  const [supportOpen, setSupportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  const handleInstall = async (platform) => {
    if (canPrompt) {
      const accepted = await install();
      if (accepted) toast.success('Установка начата');
      return;
    }
    setInstallOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/25 pb-24">
      <AppHeader onTitleClick={() => navigate('/groups')} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.name || user?.email}</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm divide-y divide-border/60">
          <SettingRow icon={UserRound} title="Профиль" description="Личные данные и контакты" onClick={() => navigate('/profile')} />
          <SettingRow icon={FileQuestion} title="Мои вопросы" description="Наборы, темы и личные вопросы" onClick={() => navigate('/settings/questions')} />
          <SettingRow icon={MessageCircleQuestion} title="Поддержка" description="Контакты и помощь" onClick={() => setSupportOpen(true)} />
          <SettingRow icon={CircleHelp} title="Справка" description="Как пользоваться Pro Общением" onClick={() => setHelpOpen(true)} />
          <SettingRow icon={Info} title="О приложении" description="Назначение и версия" onClick={() => setAboutOpen(true)} />
        </section>

        {!installed && (
          <section className="mt-5 rounded-2xl border border-primary/20 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Download className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold">Скачать PWA-приложение</h2>
                <p className="text-sm text-muted-foreground">Быстрый доступ с экрана телефона</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-14 rounded-xl" onClick={() => handleInstall('ios')}><Apple className="mr-2 h-6 w-6" />iPhone</Button>
              <Button type="button" variant="outline" className="h-14 rounded-xl" onClick={() => handleInstall('android')}><Bot className="mr-2 h-6 w-6" />Android</Button>
            </div>
          </section>
        )}

        <button type="button" onClick={() => { logout(); navigate('/login'); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/5">
          <LogOut className="h-4 w-4" />Выйти из аккаунта
        </button>
      </main>
      <BottomNav />

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} trigger={null} />
      <InstructionsDialog open={helpOpen} onOpenChange={setHelpOpen} trigger={null} />
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>О Pro Общении</DialogTitle><DialogDescription>Приложение помогает делать разговоры глубже, полезнее и интереснее.</DialogDescription></DialogHeader><p className="text-sm text-muted-foreground">Версия 1.0</p></DialogContent>
      </Dialog>
      <Dialog open={installOpen} onOpenChange={setInstallOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Установка приложения</DialogTitle><DialogDescription>На iPhone откройте меню «Поделиться» в Safari и выберите «На экран «Домой»». На Android откройте меню браузера и выберите «Установить приложение».</DialogDescription></DialogHeader></DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
