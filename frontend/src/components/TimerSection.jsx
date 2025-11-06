import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Play, Pause } from 'lucide-react';

const TIMER_OPTIONS = [60, 120, 180, 240, 300]; // in seconds

export const TimerSection = ({ className = '' }) => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioRef.current = new AudioContext();
    }
  }, []);

  const playBeep = () => {
    if (!audioRef.current) return;
    
    const oscillator = audioRef.current.createOscillator();
    const gainNode = audioRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioRef.current.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioRef.current.currentTime + 0.5);
    
    oscillator.start(audioRef.current.currentTime);
    oscillator.stop(audioRef.current.currentTime + 0.5);
  };

  useEffect(() => {
    if (activeTimer !== null && !isPaused && remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer, isPaused, remainingTime]);

  const startTimer = (seconds) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setActiveTimer(seconds);
    setRemainingTime(seconds);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerLabel = (seconds) => {
    const minutes = seconds / 60;
    return `${minutes} мин`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {TIMER_OPTIONS.map((seconds) => {
          const isActive = activeTimer === seconds;
          const showTime = isActive && remainingTime > 0;
          
          return (
            <Button
              key={seconds}
              onClick={() => startTimer(seconds)}
              variant={isActive ? 'default' : 'outline'}
              size="lg"
              className={`rounded-full w-20 h-20 p-0 font-medium transition-all ${
                isActive && remainingTime > 0 ? 'timer-active' : ''
              }`}
            >
              <span className="text-sm">
                {showTime ? formatTime(remainingTime) : getTimerLabel(seconds)}
              </span>
            </Button>
          );
        })}
      </div>
      
      {activeTimer !== null && remainingTime > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={togglePause}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4" />
                Продолжить
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Пауза
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TimerSection;