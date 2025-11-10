import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Settings2 } from 'lucide-react';

export const CategorySelector = ({ categories, onUpdate, children }) => {
  const [open, setOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);

  // Update local state when categories prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleToggle = (categoryId) => {
    setLocalCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

  const handleSelectAll = () => {
    setLocalCategories(prev => prev.map(cat => ({ ...cat, enabled: true })));
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
            <Settings2 className="w-5 h-5" />
            Выбрать категории ({selectedCount})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Категории вопросов</DialogTitle>
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
            <div className="space-y-3">
              {localCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Checkbox
                    id={category.id}
                    checked={category.enabled}
                    onCheckedChange={() => handleToggle(category.id)}
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={category.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {category.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {category.questions?.length || 0} вопросов
                    </p>
                  </div>
                </div>
              ))}
            </div>
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