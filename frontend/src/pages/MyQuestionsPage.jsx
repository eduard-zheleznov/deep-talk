import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileQuestion, LockKeyhole } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { ManageCategories } from '../components/ManageCategories';
import { normalizeQuestionSets } from '../utils/questionSets';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['info@biz-vip.ru'];

export const MyQuestionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasAccess = ADMIN_EMAILS.includes((user?.email || '').toLowerCase()) || user?.subscription_active === true;
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    api.getGroups().then(setGroups).catch(() => toast.error('Не удалось загрузить разговоры')).finally(() => setLoading(false));
  }, [hasAccess]);

  const openEditor = async (group) => {
    try {
      const config = await api.getGroupQuestionConfig(group.id);
      setSelectedGroup(group);
      setCategories(normalizeQuestionSets(config.categories || []));
      setEditorOpen(true);
    } catch (error) {
      toast.error(error.message || 'Не удалось загрузить вопросы');
    }
  };

  const persistCategories = async (updated) => {
    const normalized = normalizeQuestionSets(updated);
    const config = await api.updateGroupQuestionCategories(selectedGroup.id, normalized);
    setCategories(normalizeQuestionSets(config.categories || []));
    toast.success('Мои вопросы обновлены');
  };

  const addToAllGroups = async (newSet) => {
    await Promise.all(groups.map(async (group) => {
      const config = group.id === selectedGroup.id ? { categories } : await api.getGroupQuestionConfig(group.id);
      return api.updateGroupQuestionCategories(group.id, [...normalizeQuestionSets(config.categories || []), newSet]);
    }));
    const config = await api.getGroupQuestionConfig(selectedGroup.id);
    setCategories(normalizeQuestionSets(config.categories || []));
    toast.success('Набор добавлен во все разговоры');
  };

  return (
    <div className="min-h-screen bg-muted/25 pb-24">
      <AppHeader onTitleClick={() => navigate('/groups')} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Мои вопросы</h1>
        <p className="mt-1 text-sm text-muted-foreground">Наборы, темы и вопросы для ваших разговоров</p>

        {!hasAccess ? (
          <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="h-6 w-6" /></span>
            <h2 className="mt-4 font-semibold">Раздел доступен по подписке</h2>
            <p className="mt-2 text-sm text-muted-foreground">Создание своих наборов и вопросов доступно администратору и пользователям с активной подпиской.</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm divide-y divide-border/60">
            {loading ? <p className="p-6 text-center text-sm text-muted-foreground">Загрузка…</p> : groups.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Сначала создайте разговор.</p> : groups.map((group) => (
              <button key={group.id} type="button" onClick={() => openEditor(group)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileQuestion className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{group.name}</span><span className="block text-sm text-muted-foreground">Открыть наборы и вопросы</span></span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
      {selectedGroup && <ManageCategories categories={categories} onUpdate={persistCategories} activeGroupId={selectedGroup.id} allGroups={groups} onUpdateForAllGroups={addToAllGroups} open={editorOpen} onOpenChange={setEditorOpen} trigger={null} />}
    </div>
  );
};

export default MyQuestionsPage;
