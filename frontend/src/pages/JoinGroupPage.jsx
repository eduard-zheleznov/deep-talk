import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

const JoinGroupPage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    const join = async () => {
      if (!inviteCode || hasJoinedRef.current) return;
      hasJoinedRef.current = true;

      try {
        const group = await api.joinGroup(inviteCode.toUpperCase());
        toast.success('Вы присоединились к разговору');
        navigate(`/group/${group.id}`, { replace: true });
      } catch (requestError) {
        setError('Ссылка приглашения недействительна или уже не работает');
      }
    };

    join();
  }, [inviteCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8 border border-border/50 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-7 w-7" />
        </div>

        {error ? (
          <>
            <h1 className="text-2xl font-semibold mb-2">Ссылка не сработала</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/groups')} className="w-full h-12">
              Перейти к разговорам
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-2">Присоединяем к разговору</h1>
            <p className="text-sm text-muted-foreground mb-6">Это займет пару секунд</p>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinGroupPage;
