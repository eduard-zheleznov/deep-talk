import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { QuestionCard } from '../components/QuestionCard';
import { TimerSection } from '../components/TimerSection';
import { CategorySelector } from '../components/CategorySelector';
import { HistoryPanel } from '../components/HistoryPanel';
import { questionManager } from '../utils/questionManager';
import { hasEnabledQuestions, normalizeQuestionSets } from '../utils/questionSets';
import { CheckSquare, Copy, History, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS = {
  host: 'Организатор',
  participant: 'Участник',
  observer: 'Наблюдатель',
};

const ROLE_DESCRIPTIONS = {
  host: 'Управляет ролями, выбором тем и настройками вопросов.',
  participant: 'Обсуждает вопросы, отмечает историю и может приглашать.',
  observer: 'Смотрит вопросы и историю без изменения прогресса.',
};

const ROLE_OPTIONS = [
  { value: 'host', label: ROLE_LABELS.host },
  { value: 'participant', label: ROLE_LABELS.participant },
  { value: 'observer', label: ROLE_LABELS.observer },
];

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState({ used: [], skipped: [] });
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [rolesDialog, setRolesDialog] = useState(false);
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [roleSavingMemberId, setRoleSavingMemberId] = useState('');

  const currentUserRole = useMemo(() => {
    if (!group || !user) return 'participant';
    return group.current_user_role || group.member_roles?.[user.id] || (group.creator_id === user.id ? 'host' : 'participant');
  }, [group, user]);

  const canManageRoles = currentUserRole === 'host';
  const canManageQuestions = currentUserRole === 'host';
  const canShareInvite = currentUserRole !== 'observer';
  const canUseQuestionActions = currentUserRole !== 'observer';
  const hostCount = Object.values(group?.member_roles || {}).filter((role) => role === 'host').length;
  const hasEnabledCategories = hasEnabledQuestions(categories);

  useEffect(() => {
    loadGroupSession();
  }, [groupId]);

  const loadGroupSession = async () => {
    setLoading(true);
    try {
      const [loadedGroups, config] = await Promise.all([
        api.getGroups(),
        api.getGroupQuestionConfig(groupId),
      ]);
      const currentGroup = loadedGroups.find((item) => item.id === groupId);

      if (!currentGroup) {
        toast.error('Разговор не найден');
        navigate('/groups');
        return;
      }

      setGroup(currentGroup);
      setCategories(normalizeQuestionSets(config.categories || []));
      setHistory(config.history || { used: [], skipped: [] });
      setShowQuestion(false);
      setCurrentQuestion(null);
    } catch (error) {
      toast.error(error.message || 'Ошибка загрузки разговора');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const persistCategories = async (updatedCategories) => {
    if (!canManageQuestions) {
      toast.error('Только организатор может менять вопросы разговора');
      return;
    }

    const previousCategories = categories;
    const normalizedCategories = normalizeQuestionSets(updatedCategories);
    setCategories(normalizedCategories);

    try {
      const config = await api.updateGroupQuestionCategories(groupId, normalizedCategories);
      setCategories(normalizeQuestionSets(config.categories || []));
      setHistory(config.history || { used: [], skipped: [] });
      toast.success('Настройки вопросов сохранены');
    } catch (error) {
      setCategories(previousCategories);
      toast.error(error.message || 'Не удалось сохранить настройки');
    }
  };

  const persistHistory = async (updatedHistory, offlineAction = null) => {
    const previousHistory = history;
    setHistory(updatedHistory);

    try {
      const config = offlineAction
        ? await api.updateGroupQuestionHistoryAction(
          groupId,
          offlineAction.questionId,
          offlineAction.action,
          updatedHistory,
        )
        : await api.updateGroupQuestionHistory(groupId, updatedHistory);
      setHistory(config.history || updatedHistory);
      return true;
    } catch (error) {
      setHistory(previousHistory);
      toast.error(error.message || 'Не удалось сохранить историю');
      return false;
    }
  };

  const selectQuestion = (sourceHistory = history) => {
    const question = questionManager.getRandomQuestion(categories, sourceHistory);

    if (!question) {
      toast.error('Нет доступных вопросов. Выберите наборы или сбросьте историю.');
      return;
    }

    setCurrentQuestion(question);
    setShowQuestion(true);
  };

  const handleGetQuestion = () => {
    selectQuestion(history);
  };

  const handleMarkUsed = async () => {
    if (!currentQuestion) return;
    if (!canUseQuestionActions) {
      toast.info('Наблюдатель не может менять историю вопросов');
      return;
    }

    const updatedHistory = questionManager.markAsUsed(currentQuestion.id, history);
    const saved = await persistHistory(updatedHistory, {
      questionId: currentQuestion.id,
      action: 'used',
    });
    if (!saved) return;

    if (currentQuestion.serverQuestionId) {
      api.markQuestion(currentQuestion.serverQuestionId, 'completed', groupId).catch(() => {});
    }

    selectQuestion(updatedHistory);
  };

  const handleNext = async () => {
    if (!currentQuestion) return;
    if (!canUseQuestionActions) {
      toast.info('Наблюдатель не может менять историю вопросов');
      return;
    }

    const updatedHistory = questionManager.markAsSkipped(currentQuestion.id, history);
    const saved = await persistHistory(updatedHistory, {
      questionId: currentQuestion.id,
      action: 'skipped',
    });
    if (!saved) return;

    if (currentQuestion.serverQuestionId) {
      api.markQuestion(currentQuestion.serverQuestionId, 'skipped', groupId).catch(() => {});
    }

    selectQuestion(updatedHistory);
  };

  const handleResetHistory = async () => {
    const saved = await persistHistory({ used: [], skipped: [] });
    if (saved) {
      setShowQuestion(false);
      setCurrentQuestion(null);
      toast.success('История сброшена');
    }
  };

  const handleUnmarkQuestion = async (questionId) => {
    const updatedHistory = questionManager.unmarkQuestion(questionId, history);
    const saved = await persistHistory(updatedHistory);
    if (saved) {
      toast.success('Вопрос возвращён в список');
    }
  };

  const handleGenerateInvite = async () => {
    if (!canShareInvite) {
      toast.info('Наблюдатель не может создавать приглашения');
      return;
    }

    try {
      const data = await api.createInvite(groupId);
      setInviteData(data);
      setInviteDialog(true);
    } catch (error) {
      toast.error(error.message || 'Ошибка создания приглашения');
    }
  };

  const getInviteLink = () => {
    if (!inviteData?.invite_url) return '';
    try {
      return new URL(inviteData.invite_url, window.location.origin).toString();
    } catch (error) {
      return inviteData.invite_url;
    }
  };

  const copyInviteLink = async () => {
    const inviteLink = getInviteLink();
    if (!inviteLink) return;

    try {
      await copyText(inviteLink);
      toast.success('Ссылка скопирована');
    } catch (error) {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const copyInviteCode = async () => {
    if (!inviteData?.invite_code) return;
    try {
      await copyText(inviteData.invite_code);
      toast.success('Код скопирован');
    } catch (error) {
      toast.error('Не удалось скопировать код');
    }
  };

  const handleRoleChange = async (memberId, role) => {
    setRoleSavingMemberId(memberId);
    try {
      const updatedGroup = await api.updateMemberRole(groupId, memberId, role);
      setGroup(updatedGroup);
      toast.success('Роль обновлена');
    } catch (error) {
      toast.error(error.message || 'Не удалось изменить роль');
    } finally {
      setRoleSavingMemberId('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка разговора...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col pb-24">
      <AppHeader title={group?.name} onTitleClick={() => navigate('/groups')} />

      <main className="container mx-auto px-4 flex-1 flex flex-col justify-start overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-6 py-6 md:py-10">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Разговор</p>
            <h1 className="mt-1 truncate text-xl font-bold">{group?.name}</h1>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-card p-2 shadow-sm" aria-label="Настройки текущего разговора">
            <button type="button" onClick={() => setCategorySelectorOpen(true)} disabled={!canManageQuestions} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-45"><CheckSquare className="h-5 w-5 text-primary" />Темы</button>
            <button type="button" onClick={() => setRolesDialog(true)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-foreground transition hover:bg-muted"><Users className="h-5 w-5 text-primary" />Участники</button>
            <button type="button" onClick={() => setHistoryPanelOpen(true)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-foreground transition hover:bg-muted"><History className="h-5 w-5 text-primary" />История</button>
          </div>

          {showQuestion && currentQuestion && (
            <div className="space-y-6">
              <QuestionCard
                question={currentQuestion}
                onMarkUsed={handleMarkUsed}
                onNext={handleNext}
              />
            </div>
          )}

          <div className="flex justify-center py-2">
            <Button
              onClick={handleGetQuestion}
              size="lg"
              className="btn-smooth px-12 py-6 text-lg font-medium rounded-full shadow-md"
              disabled={!hasEnabledCategories}
            >
              Получить вопрос
            </Button>
          </div>

          <TimerSection />

          {!canUseQuestionActions && (
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-center text-sm text-muted-foreground">
              Наблюдатель может смотреть вопросы и историю, но не меняет прогресс разговора.
            </div>
          )}

        </div>
      </main>
      <BottomNav />

      <CategorySelector
        categories={categories}
        onUpdate={persistCategories}
        open={categorySelectorOpen}
        onOpenChange={setCategorySelectorOpen}
        trigger={null}
      />

      <HistoryPanel
        categories={categories}
        history={history}
        onResetHistory={handleResetHistory}
        onUnmarkQuestion={handleUnmarkQuestion}
        open={historyPanelOpen}
        onOpenChange={setHistoryPanelOpen}
        trigger={null}
      />

      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить в разговор</DialogTitle>
            <DialogDescription><span className="block">Отправьте эту ссылку тому,</span><span className="block">кого хотите пригласить.</span></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <button type="button" onClick={copyInviteCode} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm font-semibold tracking-wide transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Скопировать код ${inviteData?.invite_code || ''}`}>
              <span>Код: {inviteData?.invite_code}</span><Copy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </button>
            <Button onClick={copyInviteLink} className="w-full h-12">
              <Copy className="w-4 h-4 mr-2" />
              Скопировать ссылку
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rolesDialog} onOpenChange={setRolesDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Роли участников</DialogTitle>
            <DialogDescription>Организатор управляет ролями и настройками вопросов в этом разговоре.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-2 rounded-xl border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
            {ROLE_OPTIONS.map((option) => (
              <p key={option.value}>
                <span className="font-medium text-foreground">{option.label}:</span> {ROLE_DESCRIPTIONS[option.value]}
              </p>
            ))}
          </div>
          <div className="space-y-3 mt-4">
            {(group?.members || []).map((member) => {
              const role = group?.member_roles?.[member.id] || (member.id === group?.creator_id ? 'host' : 'participant');
              const isCurrentUser = member.id === user?.id;
              const canChangeThisRole = canManageRoles && !(isCurrentUser && role === 'host' && hostCount <= 1);
              const isOnlyHost = isCurrentUser && role === 'host' && hostCount <= 1;

              return (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/60 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.name || member.email}
                      {isCurrentUser && <span className="text-muted-foreground"> · вы</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {!canManageRoles ? ROLE_LABELS[role] : ROLE_DESCRIPTIONS[role]}
                    </p>
                    {isOnlyHost && (
                      <p className="mt-1 text-xs text-muted-foreground">Нужен хотя бы один организатор.</p>
                    )}
                  </div>

                  {canManageRoles ? (
                    <Select
                      value={role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                      disabled={!canChangeThisRole || roleSavingMemberId === member.id}
                    >
                      <SelectTrigger className="h-9 w-[132px] bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              );
            })}
          </div>
          {canShareInvite && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 h-11 w-full"
              onClick={() => {
                setRolesDialog(false);
                handleGenerateInvite();
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Пригласить участника
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetailPage;
