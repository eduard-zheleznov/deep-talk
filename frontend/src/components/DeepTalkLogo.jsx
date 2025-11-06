import React from 'react';
import { MessageCircle } from 'lucide-react';

export const DeepTalkLogo = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <MessageCircle className="w-6 h-6 text-primary" strokeWidth={2} />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
      </div>
      <span className="font-semibold text-xl tracking-tight text-foreground">DeepTalk</span>
    </div>
  );
};

export default DeepTalkLogo;