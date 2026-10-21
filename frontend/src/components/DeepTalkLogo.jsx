import React from 'react';
import { MessageCircle } from 'lucide-react';

export const DeepTalkLogo = ({
  className = '',
  title = 'Pro Общение',
  subtitle = '',
  compact = false,
}) => {
  const subtitleLines = String(subtitle || '').split('\n').filter(Boolean);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <MessageCircle className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} strokeWidth={2} />
        <div className={`absolute -top-0.5 -right-0.5 ${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'} rounded-full bg-accent`} />
      </div>
      <span className="min-w-0">
        <span className={`block font-semibold leading-tight tracking-tight text-primary ${compact ? 'text-lg' : 'text-xl'}`}>
          {title}
        </span>
        {subtitleLines.length > 0 && (
          <span className={`block pl-0 text-left font-medium leading-tight text-muted-foreground ${compact ? 'text-[11px] min-[380px]:text-xs sm:text-sm' : 'text-xs sm:text-sm'}`}>
            {subtitleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        )}
      </span>
    </div>
  );
};

export default DeepTalkLogo;
