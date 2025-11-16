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
    if (!categoryName.trim()) {
      toast.error('Введите название категории');
      return;
    }
    setStep(2);
  };
  
  const handleBack = () => {
    setStep(1);
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
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">Управление категориями</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Создать категорию
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
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[75vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Название категории</Label>
              <Input
                id="categoryName"
                placeholder="Например: Мечты и цели"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="h-10 focus:ring-2 focus:ring-primary focus:ring-offset-0"
              />
            </div>
            
            {!editingCategory && (
              <div className="space-y-2">
                <Label>Применить категорию</Label>
                <RadioGroup value={categoryScope} onValueChange={setCategoryScope}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id="current" />
                    <Label htmlFor="current" className="font-normal cursor-pointer">
                      Для текущей группы
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="font-normal cursor-pointer">
                      Для всех групп
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden min-h-0">
              <Label htmlFor="questions">Вопросы (разделяйте пустой строкой)</Label>
              <div className="flex-1 overflow-y-auto">
                <Textarea
                  id="questions"
                  placeholder={`Введите вопросы, разделяя их пустой строкой. Например:\n\nПрогресс в какой сфере жизни больше всего повлияет на твоё счастье?\n\nТвоя главная цель до конца года?`}
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  className="min-h-[150px] h-full resize-none rounded-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                />
              </div>
            </div>
            
            <Button onClick={handleSave} className="w-full h-10">
              {editingCategory ? 'Сохранить' : 'Создать'}
            </Button>
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
