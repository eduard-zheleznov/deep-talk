import React, { useState } from 'react';
import {
  Apple,
  Bot,
  Download,
  Menu,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Separator } from './ui/separator';

const INSTALL_MESSAGE = 'Позже тут будет инструкция для установки приложения';

const MenuAction = ({ icon: Icon, label, description, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-medium leading-tight text-foreground">{label}</span>
      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>
    </span>
  </button>
);

export const GroupActionsMenu = ({
  open,
  onOpenChange,
  groupName,
  roleLabel,
  actions,
}) => {
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  const closeAndRun = (action) => {
    onOpenChange(false);
    window.setTimeout(action, 140);
  };

  const openInstallDialog = () => {
    closeAndRun(() => setInstallDialogOpen(true));
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 sm:h-11 rounded-full border border-accent/45 bg-accent/20 px-1.5 pl-2 sm:px-2 sm:pl-3 gap-1.5 sm:gap-2 shadow-[0_8px_24px_-16px_hsl(var(--accent-foreground)/0.45)] hover:border-accent/60 hover:bg-accent/25 data-[state=open]:border-accent/60 data-[state=open]:bg-accent/25 focus-visible:ring-2 focus-visible:ring-accent/45"
            title="Меню разговора"
            aria-label="Меню разговора"
          >
            <span className="text-[13px] sm:text-sm font-semibold text-foreground">Меню:</span>
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
              <Menu className="h-4 w-4" />
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex h-full w-[88vw] max-w-[380px] flex-col overflow-hidden p-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-10 rounded-full p-2 opacity-70 transition-opacity hover:bg-muted hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </button>

          <SheetHeader className="px-5 pb-2 pt-5 text-left">
            <SheetTitle className="pr-9 text-xl">Меню разговора</SheetTitle>
            <div className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
              <p className="truncate font-medium text-foreground">{groupName}</p>
              <p>{roleLabel}</p>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="space-y-0.5">
              {actions.map((action) => (
                <MenuAction
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  description={action.description}
                  disabled={action.disabled}
                  onClick={() => closeAndRun(action.onClick)}
                />
              ))}
            </div>

            <Separator className="my-3" />

            <section className="rounded-xl border border-border/60 bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Download className="h-4 w-4 text-primary" />
                Скачать приложение
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl bg-background"
                  onClick={openInstallDialog}
                  aria-label="iPhone"
                >
                  <Apple className="h-5 w-5" />
                  <span>iPhone</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl bg-background"
                  onClick={openInstallDialog}
                  aria-label="Android"
                >
                  <Bot className="h-5 w-5" />
                  <span>Android</span>
                </Button>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Скачать приложение</DialogTitle>
            <DialogDescription>{INSTALL_MESSAGE}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupActionsMenu;
