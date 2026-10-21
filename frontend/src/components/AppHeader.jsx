import React from 'react';

export const AppHeader = ({ title, onTitleClick }) => (
  <>
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[78px] max-w-3xl items-center justify-center px-4 py-3 text-center">
        <button
          type="button"
          onClick={onTitleClick}
          className="rounded-lg px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="На главный экран"
        >
          <span className="block text-xl font-bold leading-tight text-primary sm:text-2xl">Pro Общение</span>
          <span className="mt-0.5 block text-sm font-medium leading-tight text-muted-foreground">Улучшаем разговоры</span>
        </button>
        {title && (
          <span className="absolute left-4 hidden max-w-[25%] truncate text-sm font-medium text-muted-foreground md:block">
            {title}
          </span>
        )}
      </div>
    </header>
    <div className="h-[78px] shrink-0" aria-hidden="true" />
  </>
);

export default AppHeader;
