import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Users, Plus, ExternalLink, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
    seedQuestionsIfNeeded();
  }, []);

  const seedQuestionsIfNeeded = async () => {
    try {
      await api.seedQuestions();
    } catch (error) {
      // Already seeded, ignore
    }
  };

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (error) {
      toast.error('Ошибка загрузки групп');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      await api.createGroup(newGroupName);
      toast.success('Группа создана!');
      setNewGroupName('');
      setCreateDialogOpen(false);
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Ошибка создания группы');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      await api.joinGroup(inviteCode.toUpperCase());
      toast.success('Вы присоединились к группе!');
      setInviteCode('');
      setJoinDialogOpen(false);
      loadGroups();
    } catch (error) {
      toast.error(error.message || 'Неверный код приглашения');
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">DeepTalk</h1>
            <p className="text-sm text-muted-foreground">Привет, {user?.name || user?.email}!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Мои группы</h2>
          <div className="flex gap-3">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 h-12">
                  <Plus className="w-5 h-5 mr-2" />
                  Создать группу
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую группу</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
                  <Input
                    placeholder="Название группы"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-12"
                    autoFocus
                  />
                  <Button type="submit" className="w-full h-12">Создать</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 h-12">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Присоединиться
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Присоединиться к группе</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoinGroup} className="space-y-4 mt-4">
                  <Input
                    placeholder="Код приглашения"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="h-12"
                    maxLength={8}
                    autoFocus
                  />
                  <Button type="submit" className="w-full h-12">Присоединиться</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">У вас пока нет групп</p>
              <p className="text-sm text-muted-foreground">
                Создайте новую группу или присоединитесь к существующей
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group.id)}
                className="bg-card rounded-xl p-4 border border-border/50 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.members?.length || 0} {group.members?.length === 1 ? 'участник' : 'участников'}
                    </p>
                  </div>
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default GroupsPage;
