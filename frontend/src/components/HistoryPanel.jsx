import React, { useState } from 'react';
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

export const HistoryPanel = ({ categories, history, onResetHistory, onUnmarkQuestion }) => {
  const [open, setOpen] = useState(false);

  const getQuestionById = (questionId) => {
    const [categoryId, indexStr] = questionId.split('_');
    const index = parseInt(indexStr, 10);
    const category = categories.find(cat => cat.id === categoryId);
    
    if (category && category.questions && category.questions[index]) {
      return {
        text: category.questions[index],
        categoryName: category.name,
      };
    }
    return null;
  };

  const getQuestionStatus = (questionId) => {
    if (history.used.includes(questionId)) return 'used';
    if (history.skipped.includes(questionId)) return 'skipped';
    return 'new';
  };

  const categoriesWithQuestions = categories.map(category => {
    const questionsWithStatus = category.questions.map((question, index) => {
      const questionId = `${category.id}_${index}`;
      return {
        id: questionId,
        text: question,
        status: getQuestionStatus(questionId),
      };
    });

    return {
      ...category,
      questionsWithStatus,
    };
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-transparent">
          <History className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
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
            <Accordion type="multiple" className="space-y-2">
              {categoriesWithQuestions.map((category) => {
                if (!category.enabled) return null;
                
                const usedCount = category.questionsWithStatus.filter(q => q.status === 'used').length;
                const skippedCount = category.questionsWithStatus.filter(q => q.status === 'skipped').length;
                const totalCount = category.questionsWithStatus.length;
                
                return (
                  <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {usedCount}/{totalCount}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {category.questionsWithStatus.map((question) => (
                          <div
                            key={question.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {question.status === 'used' && (
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                              )}
                              {question.status === 'skipped' && (
                                <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                </div>
                              )}
                              {question.status === 'new' && (
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/20" />
                              )}
                            </div>
                            
                            <p className="flex-1 text-sm leading-relaxed">{question.text}</p>
                            
                            {question.status !== 'new' && (
                              <Button
                                onClick={() => onUnmarkQuestion(question.id)}
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0 h-8 w-8"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistoryPanel;