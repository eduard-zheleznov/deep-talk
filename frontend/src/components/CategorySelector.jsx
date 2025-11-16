import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { CheckSquare, X } from 'lucide-react';

export const CategorySelector = ({ categories, onUpdate, children }) => {
  const [open, setOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleToggleCategory = (categoryId) => {
    setLocalCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

  const handleToggleQuestion = (categoryId, questionIndex) => {
    setLocalCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          const disabledQuestions = cat.disabledQuestions || [];
          const isDisabled = disabledQuestions.includes(questionIndex);
          
          return {
            ...cat,
            disabledQuestions: isDisabled
              ? disabledQuestions.filter(i => i !== questionIndex)
              : [...disabledQuestions, questionIndex]
          };
        }
        return cat;
      })
    );
  };

  const handleSelectAll = () => {
    setLocalCategories(prev => prev.map(cat => ({ ...cat, enabled: true, disabledQuestions: [] })));
  };

  const handleReset = () => {
    setLocalCategories(prev => prev.map(cat => ({ ...cat, enabled: false })));
  };

  const handleSave = () => {
    onUpdate(localCategories);
    setOpen(false);
  };

  const selectedCount = localCategories.filter(cat => cat.enabled).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="lg" className="gap-2">
            <CheckSquare className="w-5 h-5" />
            Выбрать категории ({selectedCount})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="text-center relative">
          <DialogTitle className="text-center pr-8">Выбор категорий и вопросов</DialogTitle>
          <button
            onClick={() => setOpen(false)}
            className="absolute right-0 top-0 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-muted hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </button>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-2">
            <Button onClick={handleSelectAll} variant="secondary" size="sm" className="flex-1">
              Выбрать все
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
              Сбросить
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <Accordion type="multiple" className="space-y-2">
              {localCategories.map((category) => {
                const disabledQuestions = category.disabledQuestions || [];
                const activeQuestionsCount = category.questions.length - disabledQuestions.length;
                
                return (
                  <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={category.enabled}
                            onCheckedChange={() => handleToggleCategory(category.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {activeQuestionsCount}/{category.questions.length} вопросов
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {category.questions.map((question, index) => {
                          const isDisabled = disabledQuestions.includes(index);
                          
                          return (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                checked={!isDisabled}
                                onCheckedChange={() => handleToggleQuestion(category.id, index)}
                              />
                              <p className={`flex-1 text-sm leading-relaxed ${isDisabled ? 'text-muted-foreground line-through' : ''}`}>
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
          </div>
          
          <Button onClick={handleSave} className="w-full" size="lg">
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategorySelector;