import React from 'react';
import { MessageCircle, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { label: 'Разговоры', path: '/groups', icon: MessageCircle },
  { label: 'Настройки', path: '/settings', icon: Settings },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md" aria-label="Основная навигация">
      <div className="mx-auto grid h-16 max-w-md grid-cols-2">
        {TABS.map(({ label, path, icon: Icon }) => {
          const active = path === '/groups'
            ? location.pathname === '/groups' || location.pathname.startsWith('/group/') || location.pathname === '/new-conversation'
            : location.pathname.startsWith('/settings') || location.pathname === '/profile';
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
