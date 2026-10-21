import React, { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { History, Check, ArrowRight, RotateCcw, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { getQuestionId, normalizeQuestionSets } from '../utils/questionSets';

export const HistoryPanel = ({
  categories,
  history,
  onResetHistory,
  onUnmarkQuestion,
  open: controlledOpen,
  onOpenChange,
  trigger,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const safeHistory = {
    used: Array.isArray(history?.used) ? history.used : [],
    skipped: Array.isArray(history?.skipped) ? history.skipped : [],
  };

  const getQuestionStatus = (questionId) => {
    if (safeHistory.used.includes(questionId)) return 'used';
    if (safeHistory.skipped.includes(questionId)) return 'skipped';
    return 'new';
  };

  const questionSetsWithStatus = useMemo(() => (
    normalizeQuestionSets(categories).map((questionSet) => {
      const subcategories = questionSet.subcategories.map((subcategory) => {
        const questionsWithStatus = subcategory.questions.map((question, index) => {
          const questionId = getQuestionId(subcategory, index);

          return {
            id: questionId,
            text: question,
            status: getQuestionStatus(questionId),
          };
        });

        return {
          ...subcategory,
          questionsWithStatus,
        };
      });

      return {
        ...questionSet,
        subcategories,
      };
    })
  ), [categories, safeHistory.used, safeHistory.skipped]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="rounded-full history-icon-no-hover">
              <History className="w-5 h-5" />
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-full sm:max-w-md">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-50 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted hover:bg-accent"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Закрыть</span>
        </button>
        <SheetHeader className="text-center">
          <SheetTitle className="text-center">История вопросов</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <RotateCcw className="w-4 h-4" />
                  Сбросить историю
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Сбросить историю?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Все отметки будут удалены, и вопросы снова станут доступными.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={onResetHistory}>
                    Сбросить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            {questionSetsWithStatus.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Наборы вопросов пока не созданы.
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {questionSetsWithStatus.map((questionSet) => {
                  const allQuestions = questionSet.subcategories.flatMap((subcategory) => subcategory.questionsWithStatus);
                  const usedCount = allQuestions.filter((question) => question.status === 'used').length;
                  const skippedCount = allQuestions.filter((question) => question.status === 'skipped').length;

                  return (
                    <AccordionItem key={questionSet.id} value={questionSet.id} className="rounded-lg border px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2">
                          <div className="min-w-0 text-left">
                            <span className="block truncate font-medium">{questionSet.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {usedCount} использовано · {skippedCount} пропущено
                            </span>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {usedCount}/{allQuestions.length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Accordion type="multiple" className="space-y-2">
                          {questionSet.subcategories.map((subcategory) => (
                            <AccordionItem key={subcategory.id} value={subcategory.id} className="rounded-lg bg-muted/30 px-3">
                              <AccordionTrigger className="py-3 hover:no-underline">
                                <span className="truncate text-left font-medium">{subcategory.name}</span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pt-1">
                                  {subcategory.questionsWithStatus.map((question) => (
                                    <div
                                      key={question.id}
                                      className="flex items-start gap-3 rounded-lg bg-background/70 p-3 transition-colors hover:bg-background"
                                    >
                                      <div className="mt-0.5 flex-shrink-0">
                                        {question.status === 'used' && (
                                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                                            <Check className="h-3 w-3 text-primary" />
                                          </div>
                                        )}
                                        {question.status === 'skipped' && (
                                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/20">
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                          </div>
                                        )}
                                        {question.status === 'new' && (
                                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20" />
                                        )}
                                      </div>
                                      
                                      <p className="min-w-0 flex-1 text-sm leading-relaxed">{question.text}</p>
                                      
                                      {question.status !== 'new' && (
                                        <Button
                                          onClick={() => onUnmarkQuestion(question.id)}
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 flex-shrink-0"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistoryPanel;
