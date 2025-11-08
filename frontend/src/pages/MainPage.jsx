import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { DeepTalkLogo } from '../components/DeepTalkLogo';
import { QuestionCard } from '../components/QuestionCard';
import { TimerSection } from '../components/TimerSection';
import { CategorySelector } from '../components/CategorySelector';
import { GroupSelector } from '../components/GroupSelector';
import { HistoryPanel } from '../components/HistoryPanel';
import { ManageCategories } from '../components/ManageCategories';
import { InstructionsDialog } from '../components/InstructionsDialog';
import { storage } from '../utils/storage';
import { questionManager } from '../utils/questionManager';
import { toast } from 'sonner';
import { Users, Settings2 } from 'lucide-react';

export const MainPage = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState({ used: [], skipped: [] });
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const loadedGroups = storage.getGroups();
    
    if (loadedGroups.length === 0) {
      // Create default group
      const defaultGroup = {
        id: `group_${Date.now()}`,
        name: 'Основная группа',
        createdAt: Date.now(),
      };
      storage.saveGroups([defaultGroup]);
      storage.setActiveGroup(defaultGroup.id);
      setGroups([defaultGroup]);
      setActiveGroupId(defaultGroup.id);
    } else {
      setGroups(loadedGroups);
      const activeId = storage.getActiveGroup() || loadedGroups[0].id;
      setActiveGroupId(activeId);
      storage.setActiveGroup(activeId);
    }
  }, []);

  // Load data when active group changes
  useEffect(() => {
    if (activeGroupId) {
      const loadedCategories = storage.getCategories(activeGroupId);
      const loadedHistory = storage.getQuestionHistory(activeGroupId);
      setCategories(loadedCategories);
      setHistory(loadedHistory);
      setShowQuestion(false);
      setCurrentQuestion(null);
    }
  }, [activeGroupId]);

  // Group management
  const handleCreateGroup = (name) => {
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    storage.saveGroups(updatedGroups);
    setActiveGroupId(newGroup.id);
    storage.setActiveGroup(newGroup.id);
    toast.success('Группа создана');
  };

  const handleUpdateGroup = (groupId, newName) => {
    const updatedGroups = groups.map(g =>
      g.id === groupId ? { ...g, name: newName } : g
    );
    setGroups(updatedGroups);
    storage.saveGroups(updatedGroups);
    toast.success('Группа обновлена');
  };

  const handleDeleteGroup = (groupId) => {
    const updatedGroups = groups.filter(g => g.id !== groupId);
    
    if (updatedGroups.length === 0) {
      // Create a default group if all are deleted
      const defaultGroup = {
        id: `group_${Date.now()}`,
        name: 'Основная группа',
        createdAt: Date.now(),
      };
      updatedGroups.push(defaultGroup);
    }
    
    setGroups(updatedGroups);
    storage.saveGroups(updatedGroups);
    
    if (groupId === activeGroupId) {
      setActiveGroupId(updatedGroups[0].id);
      storage.setActiveGroup(updatedGroups[0].id);
    }
    
    toast.success('Группа удалена');
  };

  const handleSelectGroup = (groupId) => {
    setActiveGroupId(groupId);
    storage.setActiveGroup(groupId);
  };

  // Category management
  const handleUpdateCategories = (updatedCategories) => {
    setCategories(updatedCategories);
    storage.saveCategories(activeGroupId, updatedCategories);
  };

  // Question management
  const handleGetQuestion = () => {
    const question = questionManager.getRandomQuestion(categories, history);
    
    if (!question) {
      toast.error('Нет доступных вопросов. Выберите категории или сбросьте историю.');
      return;
    }
    
    setCurrentQuestion(question);
    setShowQuestion(true);
  };

  const handleMarkUsed = () => {
    if (!currentQuestion) return;
    
    const updatedHistory = questionManager.markAsUsed(currentQuestion.id, history);
    setHistory(updatedHistory);
    storage.saveQuestionHistory(activeGroupId, updatedHistory);
    
    // Get next question
    handleGetQuestion();
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    
    const updatedHistory = questionManager.markAsSkipped(currentQuestion.id, history);
    setHistory(updatedHistory);
    storage.saveQuestionHistory(activeGroupId, updatedHistory);
    
    handleGetQuestion();
  };

  const handleResetHistory = () => {
    storage.resetHistory(activeGroupId);
    setHistory({ used: [], skipped: [] });
    setShowQuestion(false);
    setCurrentQuestion(null);
    toast.success('История сброшена');
  };

  const handleUnmarkQuestion = (questionId) => {
    const updatedHistory = questionManager.unmarkQuestion(questionId, history);
    setHistory(updatedHistory);
    storage.saveQuestionHistory(activeGroupId, updatedHistory);
    toast.success('Вопрос возвращён в список');
  };

  const handleLogoClick = () => {
    // Reset to home view
    setShowQuestion(false);
    setCurrentQuestion(null);
  };

  const hasEnabledCategories = categories.some(cat => cat.enabled);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={handleLogoClick} className="hover:opacity-80 transition-opacity">
              <DeepTalkLogo />
            </button>
            
            <InstructionsDialog />
            
            <div className="flex items-center gap-2">
              <GroupSelector
                groups={groups}
                activeGroupId={activeGroupId}
                onSelectGroup={handleSelectGroup}
                onCreateGroup={handleCreateGroup}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
              >
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Users className="w-5 h-5" />
                </Button>
              </GroupSelector>
              
              <CategorySelector
                categories={categories}
                onUpdate={handleUpdateCategories}
              >
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings2 className="w-5 h-5" />
                </Button>
              </CategorySelector>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ManageCategories
              categories={categories}
              onUpdate={handleUpdateCategories}
            />
            <HistoryPanel
              categories={categories}
              history={history}
              onResetHistory={handleResetHistory}
              onUnmarkQuestion={handleUnmarkQuestion}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {/* Get Question Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGetQuestion}
              size="lg"
              className="btn-smooth px-12 py-6 text-lg font-medium rounded-full"
              disabled={!hasEnabledCategories}
            >
              Получить вопрос
            </Button>
          </div>

          {/* Question Display */}
          {showQuestion && currentQuestion && (
            <div className="space-y-6">
              <QuestionCard
                question={currentQuestion}
                onMarkUsed={handleMarkUsed}
                onNext={handleNext}
              />
              
              <TimerSection />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>DeepTalk — глубокие разговоры начинаются здесь</p>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;