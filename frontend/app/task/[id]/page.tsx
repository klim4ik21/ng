'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { tasksApi, authApi } from '@/lib/api';
import type { Task } from '@/lib/api';

export default function TaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = parseInt(params.id as string);
  
  const [task, setTask] = useState<Task | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const data = await tasksApi.getToday();
        const foundTask = data.tasks.find((t: Task) => t.id === taskId);
        if (!foundTask) {
          router.push('/');
          return;
        }
        if (foundTask.is_completed) {
          router.push('/');
          return;
        }
        setTask(foundTask);
      } catch (error) {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId, router]);

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

  const handleSubmit = async () => {
    if (!task) return;

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
        const formData = new FormData();
        formData.append('file', photoFile);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          mediaUrl = data.url;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка загрузки фото');
        }
      }

      // Submit task
      await tasksApi.submit(taskId, {
        text_answer: textAnswer || undefined,
        media_url: mediaUrl || undefined,
      });

      alert('Задание выполнено! 🎉');
      router.push('/');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка при отправке');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-card-red mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-primary pb-8">
      <div className="max-w-md mx-auto px-4 pt-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Назад
        </button>

        <div className="bg-card-beige rounded-card shadow-card p-6 mb-6 border border-border-soft">
          <h1 className="text-h2 font-decorative font-bold text-text-primary mb-3">
            {task.title}
          </h1>
          <p className="text-body text-text-secondary mb-6">{task.description}</p>

          {/* Text input */}
          {(task.input_type === 'text' || task.input_type === 'text+photo') && (
            <div className="mb-6">
              <label className="block text-body font-medium text-text-primary mb-2">
                Твой ответ:
              </label>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Напиши здесь..."
                className="w-full h-32 p-3 border border-border-soft rounded-card bg-white text-text-primary focus:ring-2 focus:ring-card-red focus:border-card-red resize-none"
              />
            </div>
          )}

          {/* Photo input */}
          {(task.input_type === 'photo' || task.input_type === 'text+photo') && (
            <div className="mb-6">
              <label className="block text-body font-medium text-text-primary mb-2">
                Фото:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full p-3 border border-border-soft rounded-card bg-white text-text-primary focus:ring-2 focus:ring-card-red focus:border-card-red"
              />
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full rounded-card"
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-white text-card-red text-body font-bold py-4 rounded-button border border-card-red hover:bg-card-red hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Отправляем...' : 'Отправить ✨'}
          </button>
        </div>
      </div>
    </div>
  );
}
