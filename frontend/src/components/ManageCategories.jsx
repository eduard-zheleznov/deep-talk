import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Settings, Plus, Pencil, Trash2, Upload } from 'lucide-react';
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
import { questionManager } from '../utils/questionManager';

export const ManageCategories = ({ categories, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [questions, setQuestions] = useState('');

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setQuestions(category.questions.join('\n'));
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setQuestions('');
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!categoryName.trim()) {
      toast.error('Введите название категории');
      return;
    }

    const questionList = questions
      .split('\n')
      .map(q => q.trim())
      .filter(q => q);

    if (questionList.length === 0) {
      toast.error('Добавьте хотя бы один вопрос');
      return;
    }

    if (editingCategory) {
      // Update existing
      const updated = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: categoryName.trim(), questions: questionList }
          : cat
      );
      onUpdate(updated);
      toast.success('Категория обновлена');
    } else {
      // Create new
      const newCategory = {
        id: `custom_${Date.now()}`,
        name: categoryName.trim(),
        enabled: true,
        questions: questionList,
      };
      onUpdate([...categories, newCategory]);
      toast.success('Категория создана');
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

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const parsed = questionManager.parseExcelData(text);
        
        if (parsed.length === 0) {
          toast.error('Не удалось распознать категории и вопросы');
          return;
        }

        onUpdate(parsed);
        toast.success(`Загружено ${parsed.length} категорий`);
        setOpen(false);
      } catch (error) {
        toast.error('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Управление категориями</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="gap-2 flex-1">
                <Plus className="w-4 h-4" />
                Создать категорию
              </Button>
              <Label htmlFor="file-upload" className="flex-1">
                <div className="cursor-pointer">
                  <Button type="button" variant="secondary" className="w-full gap-2" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      Загрузить из Excel
                    </span>
                  </Button>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.csv,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>

            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">Формат файла Excel (сохранить как .txt или .csv):</p>
              <p>Колонка A: Название категории</p>
              <p>Колонка B: Вопрос</p>
              <p className="mt-1">Каждая строка = один вопрос. Разделитель: табуляция.</p>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.questions.length} вопросов
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => handleEdit(category)}
                      variant="ghost"
                      size="icon"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => setDeleteConfirm(category)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Название категории</Label>
              <Input
                id="categoryName"
                placeholder="Например: Мечты и цели"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questions">Вопросы (по одному на строку)</Label>
              <Textarea
                id="questions"
                placeholder="Введите вопросы, каждый с новой строки..."
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                rows={12}
              />
            </div>
            
            <Button onClick={handleSave} className="w-full">
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