import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { FileText, X } from 'lucide-react';

export const InstructionsDialog = () => {
  const [open, setOpen] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user has viewed instructions before
    const viewed = localStorage.getItem('deeptalk_instructions_viewed');
    setHasViewed(viewed === 'true');
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && !hasViewed) {
      // Mark as viewed
      localStorage.setItem('deeptalk_instructions_viewed', 'true');
      setHasViewed(true);
    }
  };

  // Debug: Add button to clear viewed status
  const handleResetViewed = () => {
    localStorage.removeItem('deeptalk_instructions_viewed');
    setHasViewed(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full relative ${!hasViewed ? 'animate-pulse-gentle' : ''}`}
          >
            <FileText className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-50 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted hover:bg-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </button>
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">Инструкция</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                Сервис создан, чтобы делать общение интереснее и полезнее. Посмотрите видео.
              </p>

              <div className="space-y-4">
                <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: isMobile ? '177.78%' : '56.25%' }}>
                  <video
                    className="absolute top-0 left-0 w-full h-full"
                    controls
                    playsInline
                    preload="metadata"
                  >
                    <source src={isMobile ? '/mobile_instruction.mp4' : '/desktop_instruction.mp4'} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstructionsDialog;