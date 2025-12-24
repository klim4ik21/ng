'use client';

import { useEffect, useState } from 'react';
import { finalApi } from '@/lib/api';

export default function FinalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const finalData = await finalApi.get();
        setData(finalData);
      } catch (error) {
        console.error('Error loading final data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-card-red mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <p className="text-text-secondary">Нет данных</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="text-h1 font-decorative font-bold text-text-primary text-center mb-8">
          🎊 Финальный экран
        </h1>

        {/* Winner */}
        {data.winner && (
          <div className="bg-gradient-to-br from-accent-gold to-card-red rounded-card shadow-card p-6 mb-6 text-center border border-border-soft">
            <div className="text-5xl mb-4">👑</div>
            <h2 className="text-h2 font-decorative font-bold text-text-inverse mb-2">
              Победитель рулетки!
            </h2>
            <p className="text-body text-text-inverse">
              Поздравляем участника с главным призом!
            </p>
          </div>
        )}

        {/* Text Submissions */}
        {data.text_submissions && data.text_submissions.length > 0 && (
          <div className="bg-card-beige rounded-card shadow-card p-6 mb-6 border border-border-soft">
            <h2 className="text-h2 font-decorative font-bold text-text-primary mb-4">
              📝 Все ответы
            </h2>
            <div className="space-y-4">
              {data.text_submissions.map((submission: any) => (
                <div key={submission.id} className="border-b border-border-soft pb-4 last:border-0">
                  <p className="text-body text-text-secondary mb-2">{submission.text_answer}</p>
                  <p className="text-caption text-text-muted">
                    {submission.title} • День {submission.day_number}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {data.photo_submissions && data.photo_submissions.length > 0 && (
          <div className="bg-card-beige rounded-card shadow-card p-6 mb-6 border border-border-soft">
            <h2 className="text-h2 font-decorative font-bold text-text-primary mb-4">
              📷 Галерея фото
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {data.photo_submissions.map((submission: any) => (
                <div key={submission.id} className="relative">
                  <img
                    src={`${typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://localhost:3001'}${submission.media_url}`}
                    alt={submission.title}
                    className="w-full h-48 object-cover rounded-card"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-body text-text-secondary">
            Спасибо за участие в челлендже! 🎄✨
          </p>
        </div>
      </div>
    </div>
  );
}
