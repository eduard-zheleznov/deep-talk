import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { ArrowLeft, Share2, SkipForward, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [question, setQuestion] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => {
    loadGroup();
    loadNextQuestion();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const groups = await api.getGroups();
      const currentGroup = groups.find(g => g.id === groupId);
      setGroup(currentGroup);
    } catch (error) {
      toast.error('Ошибка загрузки группы');
      navigate('/groups');
    }
  };

  const loadNextQuestion = async () => {
    setLoading(true);
    try {
      const data = await api.getNextQuestion(groupId);
      setQuestion(data.question);
      setStats({
        total: data.total_questions,
        answered: data.answered_count,
        skipped: data.skipped_count
      });
    } catch (error) {
      toast.error('Ошибка загрузки вопроса');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkQuestion = async (status) => {
    if (!question) return;

    try {
      await api.markQuestion(question.id, status, groupId);
      
      if (status === 'completed') {
        toast.success('Отлично! Вопрос отмечен как выполненный');
      } else {
        toast.info('Вопрос пропущен');
      }
      
      // Load next question
      setTimeout(() => {
        loadNextQuestion();
      }, 500);
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const data = await api.createInvite(groupId);
      setInviteData(data);
      setInviteDialog(true);
    } catch (error) {
      toast.error('Ошибка создания приглашения');
    }
  };

  const copyInviteCode = () => {
    if (inviteData) {
      navigator.clipboard.writeText(inviteData.invite_code);
      toast.success('Код скопирован!');
    }
  };

  if (loading && !question) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4\"></div>
          <p className=\"text-muted-foreground\">Загрузка вопроса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col\">
      {/* Header */}
      <header className=\"bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10\">
        <div className=\"flex items-center gap-3\">
          <Button variant=\"ghost\" size=\"icon\" onClick={() => navigate('/groups')}>
            <ArrowLeft className=\"w-5 h-5\" />
          </Button>
          <div>
            <h1 className=\"font-semibold\">{group?.name || 'Группа'}</h1>
            <p className=\"text-xs text-muted-foreground\">
              {stats && `${stats.answered}/${stats.total} отвечено`}
            </p>
          </div>
        </div>
        <Button variant=\"ghost\" size=\"icon\" onClick={handleGenerateInvite}>
          <Share2 className=\"w-5 h-5\" />
        </Button>
      </header>

      {/* Main Content */}
      <main className=\"flex-1 container mx-auto px-4 py-8 flex flex-col max-w-2xl\">
        {/* Question Card */}
        <div className=\"flex-1 flex items-center justify-center\">
          {question && (
            <div className=\"w-full\">
              <div className=\"bg-card rounded-2xl shadow-lg p-8 border border-border/50 mb-6\">
                <div className=\"mb-4\">
                  <span className=\"inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium\">
                    {question.category}
                  </span>
                </div>
                <p className=\"text-xl md:text-2xl font-medium text-center leading-relaxed\">
                  {question.text}
                </p>
              </div>

              {/* Action Buttons */}
              <div className=\"space-y-3\">
                <Button
                  onClick={() => handleMarkQuestion('completed')}
                  className=\"w-full h-14 text-lg\"
                >
                  <Check className=\"w-5 h-5 mr-2\" />
                  Обсудили
                </Button>
                <Button
                  onClick={() => handleMarkQuestion('skipped')}
                  variant=\"outline\"
                  className=\"w-full h-14 text-lg\"
                >
                  <SkipForward className=\"w-5 h-5 mr-2\" />
                  Пропустить
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить в группу</DialogTitle>
          </DialogHeader>
          <div className=\"space-y-4 mt-4\">
            <div className=\"text-center\">
              <p className=\"text-sm text-muted-foreground mb-2\">Код приглашения:</p>
              <div className=\"bg-muted rounded-lg p-4 mb-4\">
                <p className=\"text-3xl font-mono font-bold tracking-wider\">{inviteData?.invite_code}</p>
              </div>
              <Button onClick={copyInviteCode} variant=\"outline\" className=\"w-full\">
                Скопировать код
              </Button>
            </div>
            <p className=\"text-xs text-center text-muted-foreground\">
              Поделитесь этим кодом с друзьями, чтобы они могли присоединиться к группе
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetailPage;
