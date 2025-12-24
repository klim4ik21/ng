'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { rouletteApi } from '@/lib/api';
import { FaArrowLeft } from 'react-icons/fa';

export default function RoulettePage() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [autoSpinScheduled, setAutoSpinScheduled] = useState(false);

  const handleAutoSpin = useCallback(async () => {
    if (spinning) return;

    setSpinning(true);
    try {
      const data = await rouletteApi.spin();
      setResult(data.prize_type);
      // Reload status to get updated has_spun
      const newStatus = await rouletteApi.getStatus();
      setStatus(newStatus);
    } catch (error: any) {
      console.error('Auto spin error:', error);
      // Retry after a short delay if not already spun
      setTimeout(async () => {
        try {
          const checkStatus = await rouletteApi.getStatus();
          if (!checkStatus.has_spun && !spinning) {
            handleAutoSpin();
          }
        } catch (e) {
          console.error('Retry check error:', e);
        }
      }, 2000);
    } finally {
      setSpinning(false);
    }
  }, [spinning]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await rouletteApi.getStatus();
        
        if (data.has_spun) {
          // Get result from backend if already spun
          setStatus(data);
          setResult('completed');
          return;
        }
        
        // Check exact time
        const rouletteDate = new Date('2025-12-31T23:59:59');
        const now = new Date();
        const diff = rouletteDate.getTime() - now.getTime();
        
        if (diff <= 0) {
          // Time has come, auto-spin
          setStatus({ ...data, available: true });
          if (!autoSpinScheduled && !spinning) {
            setAutoSpinScheduled(true);
            handleAutoSpin();
          }
        } else {
          // Still need to wait
          setStatus({ ...data, available: false });
        }
      } catch (error) {
        router.push('/');
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 1000);
    return () => clearInterval(interval);
  }, [router, autoSpinScheduled, spinning, handleAutoSpin]);

  // Timer countdown to exact time
  useEffect(() => {
    if (!status || status.available || status.has_spun) return;

    const updateTimer = () => {
      const rouletteDate = new Date('2025-12-31T23:59:59');
      const now = new Date();
      const diff = rouletteDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!autoSpinScheduled && !spinning) {
          setAutoSpinScheduled(true);
          handleAutoSpin();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [status, autoSpinScheduled, spinning, handleAutoSpin]);

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-card-red mx-auto"></div>
        </div>
      </div>
    );
  }

  // If not available yet, show countdown with blurred roulette
  if (!status.available && !status.has_spun) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 relative overflow-hidden">
        {/* Заблюренная рулетка на фоне */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            filter: 'blur(80px)',
            opacity: 0.3,
            zIndex: 0
          }}
        >
          <div 
            className="text-[300px] animate-spin"
            style={{ 
              animationDuration: '10s',
              lineHeight: 1
            }}
          >
            🎰
          </div>
        </div>
        
        {/* Круглая кнопка назад */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-5 left-5 w-12 h-12 bg-card-darkGreen/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 shadow-xl hover:bg-card-darkGreen hover:scale-110 transition-all duration-200 z-20"
        >
          <FaArrowLeft className="text-white text-lg" />
        </button>

        <div className="max-w-md w-full text-center relative z-10 mt-20">
          <div className="bg-card-darkGreen/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-border-soft">
            <div className="mb-10">
              <h2 className="text-3xl font-decorative font-bold text-accent-cream mb-6">
                🎁 Розыгрыш призов
              </h2>
              <div className="space-y-4 text-left">
                <p className="text-base text-accent-cream/90 leading-relaxed">
                  31 декабря в 23:59:59 мы запустим рулетку для всех участников челленджа
                </p>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-accent-cream/80 leading-relaxed">
                    Каждое выполненное задание увеличивает твой вес в розыгрыше
                  </p>
                </div>
              </div>
            </div>
            
            {timeLeft && (
              <div className="space-y-6 pt-4">
                <p className="text-sm text-accent-cream/80 font-medium mb-3">
                  До начала осталось:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {timeLeft.days > 0 ? (
                    <div className="bg-card-green/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border-2 border-white/20">
                      <div className="text-3xl font-bold text-text-inverse mb-1 leading-none text-center">{timeLeft.days}</div>
                      <div className="text-[10px] text-accent-cream font-medium uppercase tracking-wide text-center">дней</div>
                    </div>
                  ) : (
                    <div className="bg-card-green/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border-2 border-white/20 opacity-0 pointer-events-none">
                      <div className="text-3xl font-bold text-text-inverse mb-1 leading-none text-center">0</div>
                      <div className="text-[10px] text-accent-cream font-medium uppercase tracking-wide text-center">дней</div>
                    </div>
                  )}
                  <div className="bg-card-green/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border-2 border-white/20">
                    <div className="text-3xl font-bold text-text-inverse mb-1 leading-none text-center">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <div className="text-[10px] text-accent-cream font-medium uppercase tracking-wide text-center">часов</div>
                  </div>
                  <div className="bg-card-green/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border-2 border-white/20">
                    <div className="text-3xl font-bold text-text-inverse mb-1 leading-none text-center">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <div className="text-[10px] text-accent-cream font-medium uppercase tracking-wide text-center">мин</div>
                  </div>
                  <div className="bg-card-green/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border-2 border-white/20">
                    <div className="text-3xl font-bold text-text-inverse mb-1 leading-none text-center">{String(timeLeft.seconds).padStart(2, '0')}</div>
                    <div className="text-[10px] text-accent-cream font-medium uppercase tracking-wide text-center">сек</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Spinning state
  if (spinning && !result) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 relative overflow-hidden">
        {/* Заблюренная рулетка на фоне */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            filter: 'blur(60px)',
            opacity: 0.4,
            zIndex: 0
          }}
        >
          <div 
            className="text-[400px] animate-spin"
            style={{ 
              animationDuration: '1s',
              lineHeight: 1
            }}
          >
            🎰
          </div>
        </div>
        
        <div className="max-w-md w-full text-center relative z-10">
          <h1 className="text-5xl font-decorative font-bold text-text-primary mb-8">
            🎰 Рулетка
          </h1>
          <div className="bg-card-beige/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border-2 border-border-soft">
            <div className="text-8xl mb-6 animate-spin" style={{ animationDuration: '1s' }}>🎰</div>
            <p className="text-2xl font-decorative font-bold text-text-primary">
              Крутим рулетку...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-h1 font-decorative font-bold text-text-primary mb-8">
          🎰 Рулетка
        </h1>

        {result === 'main' && (
          <div className="bg-gradient-to-br from-accent-gold to-card-red rounded-card shadow-card p-8 border border-border-soft">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-h1 font-decorative font-bold text-text-inverse mb-4">
              Поздравляем!
            </h2>
            <p className="text-body text-text-inverse mb-6">
              Ты выиграл главный приз!
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-card-red px-6 py-3 rounded-button font-bold border border-card-red hover:bg-card-red hover:text-white transition-colors"
            >
              На главную
            </button>
          </div>
        )}

        {result === 'consolation' && (
          <div className="bg-card-beige rounded-card shadow-card p-8 border border-border-soft">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-h2 font-decorative font-bold text-text-primary mb-4">
              Утешительный приз!
            </h2>
            <p className="text-body text-text-secondary mb-6">
              Спасибо за участие в челлендже!
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-card-red px-6 py-3 rounded-button font-bold border border-card-red hover:bg-card-red hover:text-white transition-colors"
            >
              На главную
            </button>
          </div>
        )}

        {result === 'completed' && (
          <div className="bg-card-beige rounded-card shadow-card p-8 border border-border-soft">
            <p className="text-body text-text-secondary mb-4">
              Ты уже крутил рулетку! 🎉
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-card-red px-6 py-3 rounded-button font-bold border border-card-red hover:bg-card-red hover:text-white transition-colors"
            >
              На главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
