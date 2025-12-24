'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, tasksApi, progressApi, rouletteApi, storiesApi } from '@/lib/api';
import type { User, Task, Progress, Submission } from '@/lib/api';
import { FaSnowflake, FaCandyCane, FaStar, FaTree, FaTimes } from 'react-icons/fa';
import StoriesView from './components/StoriesView';
import TaskModal from './components/TaskModal';

// TasksEmptyView Component
function TasksEmptyView() {
  return (
    <div className="mt-6 flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">❄️</div>
      <h3 className="text-h2 font-decorative font-bold text-text-primary mb-2 text-center">
        Нет заданий на сегодня
      </h3>
      <p className="text-body text-text-secondary text-center max-w-sm">
        Задания появятся позже. Возвращайся завтра! ✨
      </p>
    </div>
  );
}

// OnboardingModal Component
function OnboardingModal({ onComplete }: { onComplete: (name: string) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      emoji: '🎄',
      title: 'Че это ваще??',
      description: '7 дней до Нового года, а новогоднего настроения нет!',
      buttonText: 'Тааак. И что?',
    },
    {
      emoji: '🎅',
      title: 'А вот Климка подсуеитлся',
      description: 'Каждый день с 25 по 31 декабря тебя ждут легкие новогодние задания, за выполнение которых ты копишь шансы на главный приз',
      buttonText: 'Что за приз, что за задания?',
    },
    {
      emoji: '🎰',
      title: 'Насчет призов',
      description: 'в 23:59 мы крутанем рулетку, которая определит победителя и он получит от меня подарок. остальные получат приятный приз но меньше',
      buttonText: 'Интересно',
    },
    {
        emoji: '😎',
        title: 'Кстати',
        description: 'Если нажимать на деда мороза ты увидишь сторисы от меня, там будет много чего интересного',
        buttonText: 'Понял(а)',
      },
    {
      emoji: '✨',
      title: 'Надо только понять кто-ты',
      description: 'Имя твое короче',
      buttonText: 'Погнали!',
      isNameInput: true,
    },
  ];

  const currentStep = steps[step];

  const handleNext = async () => {
    if (step === steps.length - 1) {
      // Last step - submit name
      if (!name.trim()) {
        alert('Пожалуйста, введите имя');
        return;
      }
      setLoading(true);
      try {
        await onComplete(name.trim());
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-gradient-to-b from-background-primary to-accent-cream rounded-2xl shadow-2xl p-6 max-w-md w-full border-2 border-card-red/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-card-red/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-card-green/5 rounded-full blur-2xl translate-y-14 -translate-x-14" />
        
        <div className="relative z-10">
          {/* Progress indicator */}
          <div className="flex justify-center gap-1.5 mb-5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index <= step
                    ? 'bg-card-red w-6'
                    : 'bg-border-soft w-1.5'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-5">
            <div className="text-5xl mb-4">
              {currentStep.emoji}
            </div>
            <h2 className="text-xl font-decorative font-bold text-card-red mb-3">
              {currentStep.title}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {currentStep.description}
            </p>
            
            {currentStep.isNameInput && (
              <div className="mt-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введи своё имя"
                  className="w-full px-4 py-2.5 border-2 border-card-red/50 rounded-xl focus:outline-none focus:border-card-red focus:ring-2 focus:ring-card-red/20 text-sm font-medium"
                  autoFocus
                  maxLength={50}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      handleNext();
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Button */}
          <button
            onClick={handleNext}
            disabled={loading || (currentStep.isNameInput && !name.trim())}
            className="w-full bg-card-red text-white py-2.5 rounded-xl font-medium text-sm hover:bg-card-red/90 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : currentStep.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [rouletteStatus, setRouletteStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [unreadStoriesCount, setUnreadStoriesCount] = useState(0);
  const [showStories, setShowStories] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCompletedTask, setSelectedCompletedTask] = useState<{ task: Task; submission: Submission } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔍 Initializing app...');
        
        // Check for invite token in URL
        const token = searchParams.get('token');
        if (token) {
          console.log('🔑 Found token in URL, joining...');
          await authApi.join(token);
          router.replace('/');
          return; // Exit early after join
        }

        // Get user data
        console.log('👤 Getting user data...');
        const userData = await authApi.getMe();
        console.log('✅ User data received:', userData);
        setUser(userData);
        
        // Check if user needs onboarding (no name)
        if (!userData.name) {
          setShowOnboarding(true);
        }

        // Get today's tasks
        try {
          const tasksData = await tasksApi.getToday();
          if (tasksData.tasks && tasksData.tasks.length > 0) {
            setTasks(tasksData.tasks);
            setCurrentDay(tasksData.day);
          } else {
            setTasks([]);
            setCurrentDay(tasksData.day || 1);
          }
        } catch (error) {
          console.error('Error loading tasks:', error);
          setTasks([]);
          setCurrentDay(1);
        }

        // Get progress
        const progressData = await progressApi.get();
        setProgress(progressData);

        // Get roulette status
        const rouletteData = await rouletteApi.getStatus();
        setRouletteStatus(rouletteData);

        // Auto-redirect to roulette if available
        if (rouletteData.available && !rouletteData.has_spun) {
          router.push('/roulette');
        }

        // Check for unread stories
        try {
          const storiesData = await storiesApi.get();
          const unreadCount = storiesData.stories.filter((s: any) => !s.is_viewed).length;
          setUnreadStoriesCount(unreadCount);
        } catch (error) {
          // Ignore stories errors
        }
      } catch (error: any) {
        console.error('❌ Error during initialization:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        
        if (error.response?.status === 401) {
          // Not authenticated, need to join
          console.log('🔒 User not authenticated (401)');
          // В Telegram Mini App показываем другое сообщение
          const isTelegram = typeof window !== 'undefined' && window.Telegram?.WebApp;
          if (isTelegram) {
            // В Telegram можно показать кнопку для получения ссылки
            console.log('📱 User not authenticated in Telegram');
            // TODO: Можно добавить логику авторизации через Telegram
          } else {
            alert('Нужна персональная ссылка для входа');
          }
        } else {
          // Other errors - still stop loading
          console.error('Unexpected error:', error);
        }
      } finally {
        console.log('🏁 Initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    init();
  }, [searchParams, router]);

  // Timer countdown
  useEffect(() => {
    if (!rouletteStatus || rouletteStatus.available) return;

    const updateTimer = () => {
      const rouletteDate = new Date('2025-12-31T23:59:59');
      const now = new Date();
      const diff = rouletteDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
  }, [rouletteStatus]);

  const handleTaskClick = async (task: Task) => {
    if (task.is_completed) {
      // Open view modal for completed task
      try {
        const submission = await tasksApi.getSubmission(task.id);
        setSelectedCompletedTask({ task, submission });
      } catch (error) {
        console.error('Error loading submission:', error);
        alert('Ошибка при загрузке ответа');
      }
    } else {
      setSelectedTask(task);
    }
  };

  const handleTaskSuccess = async () => {
    // Refresh tasks and progress after submission
    try {
      const [tasksData, progressData] = await Promise.all([
        tasksApi.getToday(),
        progressApi.get()
      ]);
      
      if (tasksData.tasks) {
        setTasks(tasksData.tasks);
        setCurrentDay(tasksData.day);
      }
      setProgress(progressData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Try to reload page data
      try {
        const progressData = await progressApi.get();
        setProgress(progressData);
      } catch (e) {
        console.error('Error refreshing progress:', e);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-card-red mx-auto"></div>
          <p className="mt-4 text-text-secondary">Загружаем...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
        <div className="text-center max-w-md">
          <h1 className="text-h1 font-decorative font-bold text-text-primary mb-4">
            Привет! 👋
          </h1>
          <p className="text-body text-text-secondary mb-6">
            Для участия в челлендже нужна персональная ссылка
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary pb-6">
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Header with Santa icon and timer */}
        <div className="flex items-start justify-between mb-6">
          {/* Left side - Santa icon and day */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <img 
                src="/santa-icon.png" 
                alt="Santa" 
                className="w-16 h-16 object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowStories(true)}
              />
              {unreadStoriesCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-card-red rounded-full border-2 border-white flex items-center justify-center px-1.5 shadow-lg z-10">
                  <span className="text-white text-xs font-bold leading-none">{unreadStoriesCount}</span>
                </div>
              )}
            </div>
            {/* Day counter */}
            <div className="pt-1">
              <div className="text-caption text-text-muted mb-1">День</div>
              <div className="text-h1 font-decorative font-bold text-card-red">
                {currentDay}/7
              </div>
            </div>
          </div>

          {/* Right side - Timer */}
          {rouletteStatus && !rouletteStatus.available && !rouletteStatus.has_spun && timeLeft && (
            <div 
              onClick={() => router.push('/roulette')}
              className="bg-card-darkGreen rounded-card px-3 py-2 border border-border-soft shadow-card cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-accent-cream">🎰</span>
                <div className="flex items-center gap-1">
                  {timeLeft.days > 0 && (
                    <>
                      <span className="text-small font-bold text-text-inverse">{timeLeft.days}</span>
                      <span className="text-caption text-accent-cream">д</span>
                    </>
                  )}
                  <span className="text-small font-bold text-text-inverse">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-caption text-accent-cream">:</span>
                  <span className="text-small font-bold text-text-inverse">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-caption text-accent-cream">:</span>
                  <span className="text-small font-bold text-text-inverse">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

         {/* Compact progress */}
         {progress && (
           <div className="border-candy-cane mb-4">
             <div className="bg-card-beige rounded-card px-5 py-3.5 shadow-card bg-snowflake-pattern relative">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="text-2xl font-decorative font-bold text-card-red leading-none">
                     {progress.total_completed_tasks}
                   </div>
                   <div className="text-small text-text-muted leading-none">заданий</div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="text-2xl font-decorative font-bold text-card-green leading-none">
                     {progress.days_participated}
                   </div>
                   <div className="text-small text-text-muted leading-none">/7 дней</div>
                 </div>
               </div>
             </div>
           </div>
         )}

        {/* Tasks */}
        {tasks.length > 0 ? (
          <div className="space-y-3 mt-6">
            <div className="mb-3">
              <h2 className="text-body font-medium text-text-muted">
                Задания на сегодня
              </h2>
            </div>
            {tasks.map((task, index) => {
              const themes = [
              {
                bg: 'bg-card-red',
                outerBorder: 'border-card-green',
                icon: FaSnowflake,
                iconColor: 'text-white',
              },
              {
                bg: 'bg-accent-gold',
                outerBorder: 'border-card-red',
                icon: FaCandyCane,
                iconColor: 'text-white',
              },
              {
                bg: 'bg-card-green',
                outerBorder: 'border-accent-gold',
                icon: FaStar,
                iconColor: 'text-white',
              },
              ];
              const theme = themes[index % themes.length];

              // Pattern with icons and dots in rows
              const PatternBackground = () => {
                const Icon = theme.icon;
                const iconColor = theme.iconColor;
              
              // Create pattern: 2 rows of icons with dots between
              const topRowIcons = Array.from({ length: 5 }).map((_, i) => ({
                left: 8 + (i * 18),
                top: 25,
              }));
              
              const bottomRowIcons = Array.from({ length: 5 }).map((_, i) => ({
                left: 8 + (i * 18),
                top: 65,
              }));
              
              const topRowDots = Array.from({ length: 4 }).map((_, i) => ({
                left: 17 + (i * 18),
                top: 25,
              }));
              
              const bottomRowDots = Array.from({ length: 4 }).map((_, i) => ({
                left: 17 + (i * 18),
                top: 65,
              }));

              return (
                <div className={`absolute inset-0 overflow-hidden pointer-events-none pattern-background ${task.is_completed ? 'frozen-effect' : ''}`} style={{ filter: task.is_completed ? 'blur(2px) grayscale(100%)' : 'blur(3px)' }}>
                  {/* Top row icons */}
                  {topRowIcons.map((pos, i) => (
                    <Icon
                      key={`top-icon-${i}`}
                      className={iconColor}
                      size={14}
                      style={{
                        position: 'absolute',
                        left: `${pos.left}%`,
                        top: `${pos.top}%`,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                  {/* Bottom row icons */}
                  {bottomRowIcons.map((pos, i) => (
                    <Icon
                      key={`bottom-icon-${i}`}
                      className={iconColor}
                      size={14}
                      style={{
                        position: 'absolute',
                        left: `${pos.left}%`,
                        top: `${pos.top}%`,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                  {/* Top row dots */}
                  {topRowDots.map((pos, i) => (
                    <div
                      key={`top-dot-${i}`}
                      className="absolute w-1.5 h-1.5 bg-white rounded-full"
                      style={{
                        left: `${pos.left}%`,
                        top: `${pos.top}%`,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                  {/* Bottom row dots */}
                  {bottomRowDots.map((pos, i) => (
                    <div
                      key={`bottom-dot-${i}`}
                      className="absolute w-1.5 h-1.5 bg-white rounded-full"
                      style={{
                        left: `${pos.left}%`,
                        top: `${pos.top}%`,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
                );
              };

              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`relative rounded-full shadow-lg px-6 py-3 border-4 ${theme.outerBorder} ${theme.bg} overflow-hidden transition-all duration-200 ${
                    task.is_completed
                      ? 'frozen-effect cursor-default'
                      : 'cursor-pointer hover:shadow-xl active:scale-[0.98]'
                  }`}
                  style={{
                    borderStyle: 'solid',
                    borderWidth: '4px',
                  }}
                >
                  {/* Inner white border */}
                  <div className="absolute inset-0 border-2 border-white rounded-full pointer-events-none" />
                  
                  <PatternBackground />
                  
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-decorative font-bold text-white mb-0.5">
                        {task.title}
                      </h3>
                      <p className="text-xs text-white/90">
                        {task.description}
                      </p>
                    </div>
                    {task.is_completed ? (
                      <div className="flex-shrink-0 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                        className="px-4 py-1.5 rounded-full text-xs font-medium bg-white text-card-red border-2 border-white hover:bg-white/90 transition-all duration-200 flex-shrink-0"
                      >
                        Добавить
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <TasksEmptyView />
        )}

        {/* Roulette status */}
        {rouletteStatus && rouletteStatus.has_spun && (
          <div className="mt-4 bg-card-beige rounded-card shadow-card p-4 text-center border border-border-soft">
            <p className="text-small text-text-secondary">Ты уже крутил рулетку! 🎉</p>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={async (name: string) => {
            try {
              const updatedUser = await authApi.updateName(name);
              setUser(updatedUser);
              setShowOnboarding(false);
            } catch (error) {
              console.error('Error updating name:', error);
              alert('Ошибка при сохранении имени');
            }
          }}
        />
      )}

      {/* Stories View */}
      {showStories && (
        <StoriesView onClose={() => {
          setShowStories(false);
          // Refresh unread count after closing
          storiesApi.get().then(data => {
            const unreadCount = data.stories.filter((s: any) => !s.is_viewed).length;
            setUnreadStoriesCount(unreadCount);
          }).catch(() => {});
        }} />
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleTaskSuccess}
        />
      )}

      {/* Completed Task View Modal */}
      {selectedCompletedTask && (
        <CompletedTaskModal
          task={selectedCompletedTask.task}
          submission={selectedCompletedTask.submission}
          onClose={() => setSelectedCompletedTask(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-card-red mx-auto"></div>
          <p className="mt-4 text-text-secondary">Загрузка...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

// CompletedTaskModal Component - для просмотра выполненного задания
function CompletedTaskModal({ task, submission, onClose }: { task: Task; submission: Submission; onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  // Get API URL for images
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3001`;
      }
    }
    return 'http://localhost:3001';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startYRef.current || !modalRef.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      modalRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startYRef.current || !modalRef.current) return;
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 100) {
      handleClose();
    } else {
      modalRef.current.style.transform = 'translateY(0)';
    }
    startYRef.current = null;
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full max-h-[90vh] bg-gradient-to-b from-background-primary to-accent-cream rounded-t-3xl shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-11 h-11 bg-gradient-to-br from-card-red to-card-red/80 backdrop-blur-sm rounded-full flex items-center justify-center border-[3px] border-white shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-200 z-10"
        >
          <FaTimes className="text-white text-xl font-bold" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-4xl font-decorative font-bold text-text-primary mb-3 leading-tight">
              {task.title}
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Submission content */}
          <div className="space-y-6">
            {submission.text_answer && (
              <div>
                <h3 className="text-xl font-decorative font-bold text-text-primary mb-3">
                  Твой ответ:
                </h3>
                <div className="bg-white rounded-2xl p-5 border-2 border-border-soft shadow-lg overflow-hidden">
                  <p className="text-lg text-text-primary whitespace-pre-wrap break-words word-break-break-word">
                    {submission.text_answer}
                  </p>
                </div>
              </div>
            )}

            {submission.media_url && (
              <div>
                <h3 className="text-xl font-decorative font-bold text-text-primary mb-3">
                  Твоё фото:
                </h3>
                <div className="bg-white rounded-2xl p-2 border-2 border-border-soft shadow-lg overflow-hidden">
                  <img
                    src={`${getApiUrl()}${submission.media_url}`}
                    alt="Submission"
                    className="w-full h-auto rounded-xl object-contain"
                  />
                </div>
              </div>
            )}

            <div className="text-center text-sm text-text-muted pt-4">
              Отправлено: {new Date(submission.created_at).toLocaleString('ru-RU')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
