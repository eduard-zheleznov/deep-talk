import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Info } from 'lucide-react';

export const InstructionsDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Info className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Инструкция</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-6 text-sm">
            <p className="text-base">
              Данный сервис создан для того чтобы сделать ваше общение более ценным и интересным.
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-base">Пошаговая инструкция:</h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Шаг №1:</h4>
                  <p className="text-muted-foreground">Тут будет текст</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Шаг №2:</h4>
                  <p className="text-muted-foreground">Тут будет текст</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Шаг №3:</h4>
                  <p className="text-muted-foreground">Тут будет текст</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-base">Примечания:</h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-accent/10">
                  <h4 className="font-medium mb-2">Примечание №1:</h4>
                  <p className="text-muted-foreground">Тут будет текст</p>
                </div>

                <div className="p-4 rounded-lg bg-accent/10">
                  <h4 className="font-medium mb-2">Примечание №2:</h4>
                  <p className="text-muted-foreground">Тут будет текст</p>
                </div>

                <div className="p-4 rounded-lg bg-accent/10">
                  <h4 className="font-medium mb-2">Примечание №3:</h4>
                  <p className="text-muted-foreground">Тут будет текст</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsDialog;