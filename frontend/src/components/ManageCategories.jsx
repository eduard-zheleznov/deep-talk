import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Settings, Plus, Pencil, Trash2, X, Layers3 } from 'lucide-react';
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
import {
  formatRuCount,
  getSetStats,
  normalizeQuestionSet,
  normalizeQuestionSets,
  parseQuestionSetText,
  questionSetToText,
} from '../utils/questionSets';

const EXAMPLE_TEXT = `Что ты любил делать в детстве?
Какой семейный момент ты чаще всего вспоминаешь?

## Детство
Каким ты был в школе?
Что тебе особенно нравилось дома?

## Семейные традиции
Какая традиция была для тебя важной?`;

export const ManageCategories = ({
  categories,
  onUpdate,
  onUpdateForAllGroups,
  open: controlledOpen,
  onOpenChange,
  trigger,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [setName, setSetName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [setScope, setSetScope] = useState('current');
  const [step, setStep] = useState(1);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const questionSets = useMemo(() => normalizeQuestionSets(categories), [categories]);
  const parsedPreview = useMemo(() => parseQuestionSetText(questionText, setName, editingSet), [questionText, setName, editingSet]);
  const previewStats = useMemo(() => getSetStats(parsedPreview), [parsedPreview]);

  const handleEdit = (questionSet) => {
    const normalizedSet = normalizeQuestionSet(questionSet);
    setEditingSet(normalizedSet);
    setSetName(normalizedSet.name);
    setQuestionText(questionSetToText(normalizedSet));
    setSetScope('current');
    setStep(1);
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSet(null);
    setSetName('');
    setQuestionText('');
    setSetScope('current');
    setStep(1);
    setEditDialogOpen(true);
  };
  
  const handleNextStep = () => {
    if (step === 1) {
      if (!setName.trim()) {
        toast.error('Введите название набора');
        return;
      }
      setStep(editingSet ? 3 : 2);
      return;
    }

    if (step === 2) {
      setStep(3);
    }
  };
  
  const handleBack = () => {
    if (step === 3) {
      setStep(editingSet ? 1 : 2);
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  };

  const handleSave = () => {
    if (!setName.trim()) {
      toast.error('Введите название набора');
      return;
    }

    const newSet = parseQuestionSetText(questionText, setName.trim(), editingSet);

    if (newSet.subcategories.length === 0) {
      toast.error('Добавьте хотя бы один вопрос');
      return;
    }

    if (editingSet) {
      const updated = questionSets.map((questionSet) => (
        questionSet.id === editingSet.id ? newSet : questionSet
      ));
      onUpdate(updated);
      toast.success('Набор обновлён');
    } else if (setScope === 'all') {
      onUpdateForAllGroups(newSet);
      toast.success('Набор создан для всех разговоров');
    } else {
      onUpdate([...questionSets, newSet]);
      toast.success('Набор создан');
    }

    setEditDialogOpen(false);
    setSetName('');
    setQuestionText('');
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      const updated = questionSets.filter((questionSet) => questionSet.id !== deleteConfirm.id);
      onUpdate(updated);
      toast.success('Набор удалён');
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger !== null && (
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent className="max-w-2xl max-h-[92dvh] flex flex-col p-0 overflow-hidden">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-50 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </button>

          <DialogHeader className="px-6 pt-6 pb-3 text-center">
            <DialogTitle className="text-center leading-tight">
              Настройки наборов{' '}
              <br aria-hidden="true" />
              и вопросов
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
            <Button onClick={handleCreate} className="gap-2 mb-4 h-11 flex-shrink-0">
              <Plus className="w-4 h-4" />
              Создать набор вопросов
            </Button>
            
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 -mr-2">
              {questionSets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Наборы вопросов пока не созданы.
                </div>
              ) : (
                questionSets.map((questionSet) => {
                  const stats = getSetStats(questionSet);
                  const visibleSubcategories = questionSet.subcategories.slice(0, 3);
                  const hiddenCount = Math.max(0, questionSet.subcategories.length - visibleSubcategories.length);

                  return (
                    <div
                      key={questionSet.id}
                      className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Layers3 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="break-words font-medium leading-tight">{questionSet.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatRuCount(stats.subcategories, ['раздел', 'раздела', 'разделов'])} · {formatRuCount(stats.totalQuestions, ['вопрос', 'вопроса', 'вопросов'])}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {visibleSubcategories.map((subcategory) => (
                              <span
                                key={subcategory.id}
                                className="max-w-full rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                              >
                                {subcategory.name}
                              </span>
                            ))}
                            {hiddenCount > 0 && (
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                ещё {hiddenCount}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <Button
                            onClick={() => handleEdit(questionSet)}
                            variant="ghost"
                            size="icon"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            onClick={() => setDeleteConfirm(questionSet)}
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(isOpen) => {
        setEditDialogOpen(isOpen);
        if (!isOpen) setStep(1);
      }}>
        <DialogContent className="max-w-2xl max-h-[92dvh] flex flex-col p-0 overflow-hidden">
          <button
            onClick={() => setEditDialogOpen(false)}
            className="absolute right-3 top-3 z-50 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </button>
          
          <div className="flex min-h-0 flex-1 flex-col p-6 pt-10">
            {step === 1 && (
              <div className="flex min-h-0 flex-1 flex-col space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setName">Название набора</Label>
                  <Input
                    id="setName"
                    placeholder="Например: Разговор с родителями"
                    value={setName}
                    onChange={(event) => setSetName(event.target.value)}
                    className="h-12 rounded-lg border-2 text-base focus:border-primary focus:ring-0 focus:ring-offset-0"
                    autoFocus
                  />
                </div>
                
                <div className="flex-1" />
                
                <Button onClick={handleNextStep} className="w-full h-12 text-base">
                  Далее
                </Button>
              </div>
            )}
            
            {step === 2 && !editingSet && (
              <div className="flex min-h-0 flex-1 flex-col space-y-4">
                <div className="space-y-3">
                  <Label>Применить набор</Label>
                  <RadioGroup value={setScope} onValueChange={setSetScope} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="current" id="current-set" className="w-5 h-5 border-2" />
                      <Label htmlFor="current-set" className="cursor-pointer text-base font-normal">
                        Для текущего разговора
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="all" id="all-sets" className="w-5 h-5 border-2" />
                      <Label htmlFor="all-sets" className="cursor-pointer text-base font-normal">
                        Для всех разговоров
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
            
            {step === 3 && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-shrink-0 space-y-2">
                  <Label htmlFor="questionText">Вопросы набора</Label>
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    Без заголовков вопросы попадут в раздел «Общие вопросы». Для разделов используйте строки вида «## Детство».
                  </div>
                </div>

                <div className="min-h-0 flex-1 py-4">
                  <Textarea
                    id="questionText"
                    placeholder={EXAMPLE_TEXT}
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    rows={10}
                    className="h-full min-h-[280px] w-full resize-none rounded-xl border border-border/60 bg-background p-4 text-base focus:border-primary focus:outline-none focus:ring-0"
                    autoFocus
                  />
                </div>

                <div className="flex-shrink-0 space-y-3">
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    {formatRuCount(previewStats.subcategories, ['раздел', 'раздела', 'разделов'])} · {formatRuCount(previewStats.totalQuestions, ['вопрос', 'вопроса', 'вопросов'])}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-12 text-base">
                      Назад
                    </Button>
                    <Button onClick={handleSave} className="flex-1 h-12 text-base">
                      {editingSet ? 'Сохранить' : 'Создать'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить набор?</AlertDialogTitle>
            <AlertDialogDescription>
              Набор "{deleteConfirm?.name}" и все его вопросы будут удалены.
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
