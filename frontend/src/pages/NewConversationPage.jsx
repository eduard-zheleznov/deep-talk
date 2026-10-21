import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Copy, UserPlus } from 'lucide-react';
import { api } from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { CategorySelector } from '../components/CategorySelector';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { normalizeQuestionSets } from '../utils/questionSets';
import { toast } from 'sonner';

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const field = document.createElement('textarea');
  field.value = text;
  document.body.appendChild(field);
  field.select();
  document.execCommand('copy');
  field.remove();
};

export const NewConversationPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [group, setGroup] = useState(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState([]);
  const [themesOpen, setThemesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(null);

  const ensureGroup = async () => {
    if (group) return group;
    if (!name.trim()) {
      toast.error('Укажите название разговора');
      return null;
    }
    setCreating(true);
    try {
      const created = await api.createGroup(name.trim());
      const config = await api.getGroupQuestionConfig(created.id);
      setGroup(created);
      setCategories(normalizeQuestionSets(config.categories || []));
      return created;
    } catch (error) {
      toast.error(error.message || 'Не удалось создать разговор');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    const current = await ensureGroup();
    if (!current) return;
    try {
      const data = await api.createInvite(current.id);
      setInvite(data);
      setInviteOpen(true);
    } catch (error) {
      toast.error(error.message || 'Не удалось создать приглашение');
    }
  };

  const handleThemes = async () => {
    const current = await ensureGroup();
    if (current) setThemesOpen(true);
  };

  const updateThemes = async (updated) => {
    const normalized = normalizeQuestionSets(updated);
    setCategories(normalized);
    try {
      const config = await api.updateGroupQuestionCategories(group.id, normalized);
      setCategories(normalizeQuestionSets(config.categories || []));
      toast.success('Темы сохранены');
    } catch (error) {
      toast.error(error.message || 'Не удалось сохранить темы');
    }
  };

  const startConversation = async () => {
    const current = await ensureGroup();
    if (current) navigate(`/group/${current.id}`);
  };

  const inviteLink = invite?.invite_url ? new URL(invite.invite_url, window.location.origin).toString() : '';

  return (
    <div className="min-h-screen bg-muted/25 pb-24">
      <AppHeader onTitleClick={() => navigate('/groups')} />
      <main className="mx-auto max-w-xl px-4 py-7">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-primary">Новый разговор</p>
          <h1 className="mt-2 text-2xl font-bold">Как назовём разговор?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Название — единственное обязательное поле. Участников и темы можно добавить сейчас или позже.</p>
          <label className="mt-6 block text-sm font-semibold" htmlFor="conversation-name">Название разговора</label>
          <Input id="conversation-name" value={name} onChange={(event) => setName(event.target.value)} disabled={Boolean(group)} maxLength={80} autoFocus className="mt-2 h-12" placeholder="Например, Наш вечер" />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" className="h-12 justify-start" onClick={handleInvite} disabled={creating}><UserPlus className="mr-2 h-5 w-5" />Пригласить участников</Button>
            <Button type="button" variant="outline" className="h-12 justify-start" onClick={handleThemes} disabled={creating}><CheckSquare className="mr-2 h-5 w-5" />Выбрать темы</Button>
          </div>
          <Button type="button" className="mt-6 h-12 w-full rounded-xl text-base" onClick={startConversation} disabled={creating || !name.trim()}>
            {creating ? 'Создаём…' : 'Начать разговор'}
          </Button>
        </div>
      </main>
      <BottomNav />

      <CategorySelector categories={categories} onUpdate={updateThemes} open={themesOpen} onOpenChange={setThemesOpen} trigger={null} />
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Пригласить в разговор</DialogTitle><DialogDescription>Отправьте эту ссылку тому, кого хотите пригласить.</DialogDescription></DialogHeader><div className="rounded-xl border bg-muted/40 p-3 text-sm break-all">{inviteLink}</div><Button onClick={async () => { await copyText(inviteLink); toast.success('Ссылка скопирована'); }}><Copy className="mr-2 h-4 w-4" />Скопировать ссылку</Button></DialogContent>
      </Dialog>
    </div>
  );
};

export default NewConversationPage;
