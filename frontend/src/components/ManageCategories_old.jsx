import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Settings, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
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
    setQuestions(category.questions.join('\n\n'));
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
      .split(/\n\n+/)
      .map(q => q.trim())
      .filter(q => q);

    if (questionList.length === 0) {
      toast.error('Добавьте хотя бы один вопрос');
      return;
    }

    if (editingCategory) {
      const updated = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: categoryName.trim(), questions: questionList }
          : cat
      );
      onUpdate(updated);
      toast.success('Категория обновлена');
    } else {
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
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: ['category', 'question'], defval: '' });
        
        const categoriesMap = {};
        jsonData.forEach((row) => {
          const category = row.category?.toString().trim();
          const question = row.question?.toString().trim();
          
          if (category && question) {
            if (!categoriesMap[category]) {
              categoriesMap[category] = [];
            }
            categoriesMap[category].push(question);
          }
        });
        
        const parsed = Object.keys(categoriesMap).map((name, index) => ({
          id: `custom_${index}_${Date.now()}`,
          name,
          enabled: true,
          questions: categoriesMap[name],
        }));
        
        if (parsed.length === 0) {
          toast.error('Не удалось распознать категории и вопросы');
          return;
        }

        onUpdate(parsed);
        toast.success(`Загружено ${parsed.length} категорий`);
        setOpen(false);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Ошибка при чтении файла');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
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
          <DialogHeader>
            <DialogTitle>Управление категориями</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCreate} className="gap-2 flex-1">
                <Plus className="w-4 h-4" />
                Создать категорию
              </Button>
              <Label htmlFor="file-upload" className="flex-1">
                <div className="cursor-pointer">
                  <Button type="button" variant="secondary" className="w-full gap-2" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Загрузить из</span> Excel
                    </span>
                  </Button>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>

            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-2">
              <p className="font-medium">При загрузке через Excel такие правила:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Название категории пишите в колонке A</li>
                <li>Сам вопрос пишите напротив, в колонке B</li>
                <li>Категорию писать рядом С КАЖДЫМ вопросом</li>
                <li>Для одного вопроса используется только 1 строка</li>
              </ol>
            </div>
            
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

      {/* Edit/Create Dialog - fixed positioning */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden min-h-0 py-2">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Название категории</Label>
              <Input
                id="categoryName"
                placeholder="Например: Мечты и цели"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden min-h-0">
              <Label htmlFor="questions">Вопросы (разделяйте пустой строкой)</Label>
              <Textarea
                id="questions"
                placeholder={`Введите вопросы, разделяя их пустой строкой. Например:\n\nПрогресс в какой сфере жизни больше всего повлияет на твоё счастье?\n\nТвоя главная цель до конца года?`}
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                className="flex-1 resize-none min-h-[200px] rounded-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              />
            </div>
            
            <Button onClick={handleSave} className="w-full h-12">
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