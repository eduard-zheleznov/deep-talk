import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { CheckSquare, Layers3, X } from 'lucide-react';
import {
  getQuestionSetsSummary,
  getSetStats,
  formatRuCount,
  normalizeQuestionSets,
} from '../utils/questionSets';

export const CategorySelector = ({ categories, onUpdate, children, open: controlledOpen, onOpenChange, trigger }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [localQuestionSets, setLocalQuestionSets] = useState(() => normalizeQuestionSets(categories));
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    setLocalQuestionSets(normalizeQuestionSets(categories));
  }, [categories]);

  const summary = useMemo(() => getQuestionSetsSummary(localQuestionSets), [localQuestionSets]);

  const updateSet = (setId, updater) => {
    setLocalQuestionSets((prev) => prev.map((questionSet) => (
      questionSet.id === setId ? updater(questionSet) : questionSet
    )));
  };

  const handleToggleSet = (setId) => {
    updateSet(setId, (questionSet) => ({ ...questionSet, enabled: !questionSet.enabled }));
  };

  const handleToggleSubcategory = (setId, subcategoryId) => {
    updateSet(setId, (questionSet) => ({
      ...questionSet,
      subcategories: questionSet.subcategories.map((subcategory) => (
        subcategory.id === subcategoryId
          ? { ...subcategory, enabled: !subcategory.enabled }
          : subcategory
      )),
    }));
  };

  const handleToggleQuestion = (setId, subcategoryId, questionIndex) => {
    updateSet(setId, (questionSet) => ({
      ...questionSet,
      subcategories: questionSet.subcategories.map((subcategory) => {
        if (subcategory.id !== subcategoryId) return subcategory;

        const disabledQuestions = subcategory.disabledQuestions || [];
        const isDisabled = disabledQuestions.includes(questionIndex);

        return {
          ...subcategory,
          disabledQuestions: isDisabled
            ? disabledQuestions.filter((index) => index !== questionIndex)
            : [...disabledQuestions, questionIndex],
        };
      }),
    }));
  };

  const handleSelectAll = () => {
    setLocalQuestionSets((prev) => prev.map((questionSet) => ({
      ...questionSet,
      enabled: true,
      subcategories: questionSet.subcategories.map((subcategory) => ({
        ...subcategory,
        enabled: true,
        disabledQuestions: [],
      })),
    })));
  };

  const handleReset = () => {
    setLocalQuestionSets((prev) => prev.map((questionSet) => ({ ...questionSet, enabled: false })));
  };

  const handleSave = () => {
    onUpdate(localQuestionSets);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || children || (
            <Button variant="outline" size="lg" className="gap-2">
              <CheckSquare className="w-5 h-5" />
              Выбрать вопросы ({summary.enabledQuestions})
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[92dvh] flex flex-col p-0 overflow-hidden">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-50 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted hover:bg-accent"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Закрыть</span>
        </button>

        <DialogHeader className="px-6 pt-6 pb-3 text-center">
          <DialogTitle className="text-center">Выбор вопросов</DialogTitle>
          <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            <Layers3 className="h-3.5 w-3.5" />
            {formatRuCount(summary.sets, ['набор', 'набора', 'наборов'])} · {formatRuCount(summary.subcategories, ['раздел', 'раздела', 'разделов'])} · {summary.enabledQuestions}/{summary.totalQuestions}
          </div>
        </DialogHeader>
        
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6">
          <div className="flex gap-2">
            <Button onClick={handleSelectAll} variant="secondary" size="sm" className="flex-1">
              Выбрать все
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
              Сбросить
            </Button>
          </div>
          
          <div className="min-h-0 flex-1 overflow-y-auto pr-2 -mr-2">
            {localQuestionSets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Наборы вопросов пока не созданы.
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {localQuestionSets.map((questionSet) => {
                  const setStats = getSetStats(questionSet);

                  return (
                    <AccordionItem key={questionSet.id} value={questionSet.id} className="rounded-xl border bg-card px-4 shadow-sm">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Checkbox
                              checked={questionSet.enabled}
                              onCheckedChange={() => handleToggleSet(questionSet.id)}
                              onClick={(event) => event.stopPropagation()}
                              className="h-5 w-5"
                            />
                            <div className="min-w-0 text-left">
                              <span className="block truncate font-medium">{questionSet.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatRuCount(setStats.subcategories, ['раздел', 'раздела', 'разделов'])}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {setStats.enabledQuestions}/{setStats.totalQuestions}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Accordion type="multiple" className="space-y-2">
                          {questionSet.subcategories.map((subcategory) => {
                            const disabledQuestions = subcategory.disabledQuestions || [];
                            const activeQuestionsCount = subcategory.enabled === false
                              ? 0
                              : subcategory.questions.length - disabledQuestions.length;

                            return (
                              <AccordionItem
                                key={subcategory.id}
                                value={subcategory.id}
                                className="rounded-lg border border-border/70 bg-muted/20 px-3"
                              >
                                <AccordionTrigger className="py-3 hover:no-underline">
                                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                      <Checkbox
                                        checked={subcategory.enabled}
                                        onCheckedChange={() => handleToggleSubcategory(questionSet.id, subcategory.id)}
                                        onClick={(event) => event.stopPropagation()}
                                      />
                                      <span className="truncate text-left font-medium">{subcategory.name}</span>
                                    </div>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                      {activeQuestionsCount}/{subcategory.questions.length}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2 pt-1">
                                    {subcategory.questions.map((question, index) => {
                                      const isDisabled = disabledQuestions.includes(index);

                                      return (
                                        <div
                                          key={`${subcategory.id}_${index}`}
                                          className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-background/70"
                                        >
                                          <Checkbox
                                            checked={!isDisabled}
                                            onCheckedChange={() => handleToggleQuestion(questionSet.id, subcategory.id, index)}
                                            className="mt-0.5"
                                          />
                                          <p className={`min-w-0 flex-1 text-sm leading-relaxed ${isDisabled ? 'text-muted-foreground line-through' : ''}`}>
                                            {question}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
          
          <Button onClick={handleSave} className="w-full h-12" size="lg">
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategorySelector;
