import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Info } from 'lucide-react';

export const InstructionsDialog = () => {
  const [open, setOpen] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    // Check if user has viewed instructions before
    const viewed = localStorage.getItem('deeptalk_instructions_viewed');
    setHasViewed(viewed === 'true');
  }, []);

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && !hasViewed) {
      // Mark as viewed
      localStorage.setItem('deeptalk_instructions_viewed', 'true');
      setHasViewed(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full relative ${!hasViewed ? 'animate-pulse-gentle' : ''}`}
        >
          <Info className="w-5 h-5" />
          {!hasViewed && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full animate-ping" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Инструкция</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Сервис создан, чтобы сделать общение более ценным и интересным. Посмотрите видео.
            </p>

            <div className="space-y-4">
              <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '177.78%' }}>
                <video
                  className="absolute top-0 left-0 w-full h-full"
                  controls
                  playsInline
                  preload="metadata"
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 711'%3E%3Crect fill='%23222' width='400' height='711'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='20' font-family='system-ui'%3EВидео инструкция%3C/text%3E%3C/svg%3E"
                >
                  <source src="/path/to/your/video.mp4" type="video/mp4" />
                  Ваш браузер не поддерживает видео.
                </video>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsDialog;