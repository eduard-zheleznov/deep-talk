import React, { useEffect, useState } from 'react';

export const AppHeader = ({ title, onTitleClick }) => {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return <>
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[78px] max-w-3xl items-center justify-center px-4 py-3 text-center">
        <button
          type="button"
          onClick={onTitleClick}
          className="rounded-lg px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="На главный экран"
        >
          <span className="flex items-center justify-center gap-0 text-xl font-bold leading-tight text-primary sm:text-2xl">
            <span aria-hidden="true" className="font-semibold">&gt;</span>
            <span>Pro Общение</span>
            <span aria-hidden="true" className="font-semibold">&lt;</span>
          </span>
          <span className="mt-0.5 block text-sm font-medium leading-tight text-muted-foreground">Улучшаем разговоры</span>
        </button>
        {title && (
          <span className="absolute left-4 hidden max-w-[25%] truncate text-sm font-medium text-muted-foreground md:block">
            {title}
          </span>
        )}
        {!online && (
          <span role="status" title="Нет интернета — доступен просмотр сохранённых данных" className="absolute right-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background shadow-sm">
            Офлайн
          </span>
        )}
      </div>
    </header>
    <div className="h-[78px] shrink-0" aria-hidden="true" />
  </>;
};

export default AppHeader;
