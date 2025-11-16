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
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Сервис создан, чтобы сделать общение более ценным и интересным.
            </p>

            <div className="space-y-4">
              <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Инструкция DeepTalk"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Посмотрите видео, чтобы узнать как пользоваться сервисом
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsDialog;