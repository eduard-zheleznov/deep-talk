import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Check, ArrowRight } from 'lucide-react';

export const QuestionCard = ({ question, onMarkUsed, onNext, className = '' }) => {
  if (!question) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <p className="text-muted-foreground">Нет доступных вопросов. Выберите категории или сбросьте историю.</p>
      </Card>
    );
  }

  return (
    <Card className={`p-8 md:p-12 question-enter ${className}`} style={{ boxShadow: 'var(--shadow-medium)' }}>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
            {question.categoryName}
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium leading-snug text-balance">
            {question.text}
          </h2>
        </div>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            onClick={onMarkUsed}
            size="lg"
            className="btn-smooth rounded-full w-14 h-14 p-0"
            variant="default"
            title="Обсудили"
          >
            <Check className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={onNext}
            size="lg"
            className="btn-smooth rounded-full w-14 h-14 p-0"
            variant="secondary"
            title="Следующий вопрос"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QuestionCard;