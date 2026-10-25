import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ExternalLink, MessageCircle, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import { api } from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const participantLabel = (count) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'участников';
  if (last === 1) return 'участник';
  if (last >= 2 && last <= 4) return 'участника';
  return 'участников';
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [archivingId, setArchivingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadGroups();
    api.seedQuestions().catch(() => {});
  }, []);

  const loadGroups = async () => {
    try {
      setGroups(await api.getGroups());
    } catch (error) {
      toast.error('Не удалось загрузить разговоры');
    } finally {
      setLoading(false);
    }
  };

  const visibleGroups = useMemo(
    () => groups.filter((group) => filter === 'archive' ? group.is_archived : !group.is_archived),
    [groups, filter],
  );

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const group = await api.joinGroup(inviteCode.trim().toUpperCase());
      setJoinOpen(false);
      setInviteCode('');
      navigate(`/group/${group.id}`);
    } catch (error) {
      toast.error(error.message || 'Неверный код приглашения');
    } finally {
      setJoining(false);
    }
  };

  const toggleArchive = async (event, group) => {
    event.stopPropagation();
    setArchivingId(group.id);
    try {
      const updated = await api.setGroupArchived(group.id, !group.is_archived);
      setGroups((items) => items.map((item) => item.id === group.id ? updated : item));
      toast.success(updated.is_archived ? 'Разговор перемещён в архив' : 'Разговор восстановлен');
    } catch (error) {
      toast.error(error.message || 'Не удалось изменить архив');
    } finally {
      setArchivingId('');
    }
  };

  const openDeleteDialog = (event, group) => {
    event.stopPropagation();
    setDeleteTarget(group);
    setDeleteConfirmation('');
  };

  const closeDeleteDialog = (open) => {
    if (open || deleting) return;
    setDeleteTarget(null);
    setDeleteConfirmation('');
  };

  const deleteConversation = async () => {
    if (!deleteTarget || deleteConfirmation !== 'УДАЛИТЬ') return;
    setDeleting(true);
    try {
      await api.deleteGroup(deleteTarget.id);
      setGroups((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteConfirmation('');
      toast.success('Разговор удалён');
    } catch (error) {
      toast.error(error.message || 'Не удалось удалить разговор');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/25 pb-24">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Разговоры</h1><p className="mt-1 text-sm text-muted-foreground">Выберите разговор или начните новый</p></div>

        <Button type="button" onClick={() => navigate('/new-conversation')} className="mt-5 h-14 w-full rounded-xl text-base shadow-sm">
          <Plus className="mr-2 h-5 w-5" />Новый разговор
        </Button>
        <Button type="button" variant="ghost" onClick={() => setJoinOpen(true)} className="mt-2 h-11 w-full text-muted-foreground">
          <ExternalLink className="mr-2 h-4 w-4" />Присоединиться по коду
        </Button>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-muted p-1" role="tablist" aria-label="Фильтр разговоров">
          {[
            ['active', 'Активные'],
            ['archive', 'Архив'],
          ].map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`h-10 rounded-lg text-sm font-semibold transition-all ${filter === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>{label}</button>
          ))}
        </div>

        <section className="mt-4 space-y-3" aria-live="polite">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Загрузка…</div>
          ) : visibleGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center">
              {filter === 'archive' ? <Archive className="mx-auto h-10 w-10 text-muted-foreground/60" /> : <MessageCircle className="mx-auto h-10 w-10 text-primary/70" />}
              <h2 className="mt-4 font-semibold">{filter === 'archive' ? 'Архив пока пуст' : 'Пока нет разговоров'}</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{filter === 'archive' ? 'Здесь появятся разговоры, которые вы решите скрыть.' : 'Создайте первый или присоединитесь по приглашению.'}</p>
            </div>
          ) : visibleGroups.map((group) => {
            const count = group.members?.length || 0;
            const ArchiveIcon = group.is_archived ? RotateCcw : Archive;
            return (
              <article key={group.id} onClick={() => navigate(`/group/${group.id}`)} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{group.name}</h2><p className="mt-0.5 text-sm text-muted-foreground">{count} {participantLabel(count)}</p></div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={(event) => toggleArchive(event, group)} disabled={archivingId === group.id} title={group.is_archived ? 'Вернуть в активные' : 'В архив'} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArchiveIcon className="h-5 w-5" /><span className="sr-only">{group.is_archived ? 'Вернуть в активные' : 'В архив'}</span></button>
                  {group.is_archived && (group.can_delete || group.current_user_role === 'host') && (
                    <button type="button" onClick={(event) => openDeleteDialog(event, group)} title="Удалить навсегда" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"><Trash2 className="h-5 w-5" /><span className="sr-only">Удалить навсегда</span></button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <BottomNav />

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto top-[max(0.5rem,env(safe-area-inset-top))] translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader><DialogTitle>Присоединиться к разговору</DialogTitle><DialogDescription><span className="block">Введите код приглашения,</span><span className="block">который вам прислали.</span></DialogDescription></DialogHeader>
          <form onSubmit={handleJoin} className="space-y-4"><Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="Код приглашения" maxLength={8} autoCapitalize="characters" autoCorrect="off" autoComplete="one-time-code" className="h-12" autoFocus /><Button type="submit" className="h-12 w-full" disabled={joining || !inviteCode.trim()}>{joining ? 'Присоединяем…' : 'Присоединиться'}</Button></form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={closeDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить разговор навсегда?</DialogTitle>
            <DialogDescription>
              Разговор «{deleteTarget?.name}», его настройки, история и приглашения будут удалены без возможности восстановления.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="delete-confirmation">Для подтверждения введите УДАЛИТЬ</label>
              <Input id="delete-confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value.toUpperCase())} autoComplete="off" className="mt-2 h-12" placeholder="УДАЛИТЬ" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => closeDeleteDialog(false)} disabled={deleting}>Отмена</Button>
              <Button type="button" variant="destructive" onClick={deleteConversation} disabled={deleting || deleteConfirmation !== 'УДАЛИТЬ'}>{deleting ? 'Удаляем…' : 'Удалить'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupsPage;
