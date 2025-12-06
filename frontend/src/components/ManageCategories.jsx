import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Settings, Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export const ManageCategories = ({ categories, onUpdate, activeGroupId, allGroups, onUpdateForAllGroups }) => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [questions, setQuestions] = useState('');
  const [categoryScope, setCategoryScope] = useState('current'); // 'current' or 'all'
  const [step, setStep] = useState(1); // Step 1: name and scope, Step 2: questions

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setQuestions(category.questions.join('\n\n'));
    setStep(1);
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setQuestions('');
    setCategoryScope('current');
    setStep(1);
    setEditDialogOpen(true);
  };
  
  const handleNextStep = () => {
    if (step === 1) {
      if (!categoryName.trim()) {
        toast.error('Введите название категории');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };
  
  const handleBack = () => {
    if (step === 3) {
      setStep(editingCategory ? 1 : 2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  const handleSave = () => {
    if (!categoryName.trim()) {
      toast.error('Введите название категории');
      return;
    }

    const questionList = questions
      .split(/\n\n+/)
      .map(q => q.trim())
      .filter(q => q);

    if (questionList.length === 0) {
      toast.error('Добавьте хотя бы один вопрос');
      return;
    }

    const newCategory = {
      id: editingCategory ? editingCategory.id : `custom_${Date.now()}`,
      name: categoryName.trim(),
      enabled: true,
      questions: questionList,
    };

    if (editingCategory) {
      const updated = categories.map(cat =>
        cat.id === editingCategory.id ? newCategory : cat
      );
      onUpdate(updated);
      toast.success('Категория обновлена');
    } else {
      if (categoryScope === 'all') {
        // Apply to all groups
        onUpdateForAllGroups(newCategory);
        toast.success('Категория создана для всех групп');
      } else {
        // Apply only to current group
        onUpdate([...categories, newCategory]);
        toast.success('Категория создана');
      }
    }

    setEditDialogOpen(false);
    setCategoryName('');
    setQuestions('');
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      const updated = categories.filter(cat => cat.id !== deleteConfirm.id);
      onUpdate(updated);
      toast.success('Категория удалена');
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-50 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </button>
          <DialogHeader className="text-center">
            <DialogTitle className="text-center leading-tight">
              Управление категориями<br />и вопросами
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Создать категорию и вопросы
            </Button>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.questions.length} вопросов
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => handleEdit(category)}
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => setDeleteConfirm(category)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(isOpen) => {
        setEditDialogOpen(isOpen);
        if (!isOpen) {
          setStep(1);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[100vh] sm:max-h-[85vh] flex flex-col">
          <button
            onClick={() => setEditDialogOpen(false)}
            className="absolute right-3 top-3 z-50 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </button>
          
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden min-h-0 pt-4">
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Напишите название категории</Label>
                  <Input
                    id="categoryName"
                    placeholder="Например: Мечты и цели"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="h-12 text-base rounded-lg border-2 focus:border-primary focus:ring-0 focus:ring-offset-0"
                    autoFocus
                  />
                </div>
                
                <div className="flex-1" />
                
                <Button onClick={handleNextStep} className="w-full h-12 text-base">
                  Далее
                </Button>
              </div>
            )}
            
            {/* Step 2: Scope */}
            {step === 2 && !editingCategory && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-3">
                  <Label>Применить категорию</Label>
                  <RadioGroup value={categoryScope} onValueChange={setCategoryScope} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="current" id="current" className="w-5 h-5 border-2" />
                      <Label htmlFor="current" className="font-normal cursor-pointer text-base">
                        Для текущей группы
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="all" id="all" className="w-5 h-5 border-2" />
                      <Label htmlFor="all" className="font-normal cursor-pointer text-base">
                        Для всех групп
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex-1" />
                
                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1 h-12 text-base">
                    Назад
                  </Button>
                  <Button onClick={handleNextStep} className="flex-1 h-12 text-base">
                    Далее
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Questions */}
            {(step === 3 || (step === 2 && editingCategory)) && (
              <div className="flex-1 flex flex-col overflow-y-auto pt-6">
                <div className="space-y-3">
                  <Label htmlFor="questions">Напишите вопросы (разделяя пустой строкой)</Label>
                  <Textarea
                    id="questions"
                    placeholder="Например:&#10;&#10;Прогресс в какой сфере жизни больше всего повлияет на твоё счастье?&#10;&#10;Какая цель до конца этого года является для тебя самой главной?"
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    style={{minHeight: '500px'}}
                    className="w-full resize-none rounded-xl border border-border/50 focus:border-primary focus:ring-0 focus:outline-none text-base bg-background p-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-12 text-base">
                      Назад
                    </Button>
                    <Button onClick={handleSave} className="flex-1 h-12 text-base">
                      {editingCategory ? 'Сохранить' : 'Создать'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Категория "{deleteConfirm?.name}" и все её вопросы будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageCategories;
