'use client';

import { useState, useRef } from 'react';
import { tasksApi, uploadApi } from '@/lib/api';
import type { Task } from '@/lib/api';
import { FaTimes } from 'react-icons/fa';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TaskModal({ task, onClose, onSuccess }: TaskModalProps) {
  const [textAnswer, setTextAnswer] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  // Handle swipe down to close
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
      // Swipe down enough to close
      handleClose();
    } else {
      // Snap back
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    // Validate
    if (task.input_type === 'text' && !textAnswer.trim()) {
      alert('Нужно написать ответ!');
      return;
    }
    if (task.input_type === 'photo' && !photoFile) {
      alert('Нужно загрузить фото!');
      return;
    }
    if (task.input_type === 'text+photo' && (!textAnswer.trim() || !photoFile)) {
      alert('Нужны и текст, и фото!');
      return;
    }

    setSubmitting(true);

    try {
      let mediaUrl = null;

      // Upload photo if needed
      if (photoFile) {
        mediaUrl = await uploadApi.upload(photoFile);
      }

      // Submit task
      await tasksApi.submit(task.id, {
        text_answer: textAnswer.trim() || undefined,
        media_url: mediaUrl || undefined,
      });

      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Submit task error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка при отправке';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal content */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full h-[95vh] bg-gradient-to-b from-background-primary to-background-primary rounded-t-3xl shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
          background: 'linear-gradient(to bottom, #FBF2E8 0%, #FFF6EB 100%)'
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-11 h-11 bg-gradient-to-br from-card-red to-card-red/80 backdrop-blur-sm rounded-full flex items-center justify-center border-[3px] border-white shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-200 z-10"
          style={{
            boxShadow: '0 4px 16px rgba(139, 44, 44, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
        >
          <FaTimes className="text-white text-xl font-bold" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 pt-8">
          <div className="mb-8 text-center">
            <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
              {task.input_type === 'text' && '🎵'}
              {task.input_type === 'photo' && '📸'}
              {task.input_type === 'text+photo' && '🎬'}
            </div>
            <h2 className="text-4xl font-decorative font-bold text-text-primary mb-3 leading-tight">
              {task.title}
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Text input */}
          {task.input_type === 'text' && (
            <div className="mb-8">
              <label className="block text-xl font-decorative font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>💬</span>
                <span>{task.text_prompt || 'Твой ответ:'}</span>
              </label>
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder={task.text_prompt ? `Введи ${task.text_prompt.toLowerCase()}...` : 'Введи ответ...'}
                className="w-full p-5 text-lg border-[3px] border-border-soft rounded-2xl bg-white text-text-primary focus:ring-4 focus:ring-card-red/30 focus:border-card-red shadow-lg transition-all duration-200"
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
            </div>
          )}

          {/* Textarea + Photo компактная версия (text+photo) */}
          {task.input_type === 'text+photo' && (
            <div className="mb-8">
              <label className="block text-xl font-decorative font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>💭</span>
                <span>{task.text_prompt || 'Твой ответ:'}</span>
              </label>
              
              <div className="relative">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Расскажи нам всё... ✨"
                  className="w-full h-32 p-5 pr-20 text-lg border-[3px] border-border-soft rounded-2xl bg-white text-text-primary focus:ring-4 focus:ring-card-red/30 focus:border-card-red resize-none shadow-lg transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                />
                
                {/* Маленькая кнопка для фото справа внутри */}
                {!photoPreview ? (
                  <label className="absolute bottom-5 right-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <div className="h-10 px-3 border-[2px] border-dashed border-border-soft rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-card-red hover:bg-white transition-all duration-200 shadow-md group whitespace-nowrap">
                      <span className="text-lg mr-1.5 transform group-hover:scale-110 transition-transform duration-200">
                        📷
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        Фото
                      </span>
                    </div>
                  </label>
                ) : (
                  <div className="absolute bottom-5 right-3 h-10 px-2 rounded-lg overflow-hidden shadow-xl border-2 border-white">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-full w-auto object-cover"
                    />
                    <button
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-card-red rounded-full flex items-center justify-center text-white hover:bg-card-red/80 transition-all duration-200 shadow-lg"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo input - красивое drag & drop (только для photo) */}
          {task.input_type === 'photo' && (
            <div className="mb-8">
              <label className="block text-xl font-decorative font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>📷</span>
                <span>Твоё фото:</span>
              </label>
              
              {!photoPreview ? (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-full h-64 border-[3px] border-dashed border-border-soft rounded-2xl bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:border-card-red hover:bg-white/70 transition-all duration-200 shadow-lg group py-12 px-8"
                  >
                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-200">
                      📸
                    </div>
                    <p className="text-xl font-decorative font-bold text-text-primary mb-3 text-center">
                      Нажми, чтобы сделать фото или выбрать из галереи
                    </p>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <div className="rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200"
                  >
                    <FaTimes className="text-lg" />
                  </button>
                  <label className="absolute bottom-4 left-4 right-4">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-center cursor-pointer hover:bg-white transition-all duration-200 shadow-lg">
                      <span className="text-body font-bold text-text-primary">Изменить фото</span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Submit button - fixed at bottom */}
          <div className="mt-auto pt-6 pb-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-card-red via-card-red to-card-red/90 text-white text-xl font-decorative font-bold py-5 rounded-2xl border-[3px] border-card-red hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl relative overflow-hidden group"
              style={{
                boxShadow: '0 8px 24px rgba(139, 44, 44, 0.4)'
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Отправляем...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Отправить</span>
                    <span>✨</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

