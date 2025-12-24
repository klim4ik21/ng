'use client';

import { useEffect, useState, useRef } from 'react';
import { storiesApi } from '@/lib/api';
import type { Story } from '@/lib/api';
import { FaTimes } from 'react-icons/fa';

// Get API URL - use environment variable or detect from window location
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // If we're on mobile (not localhost), use the host's IP
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3001`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};
const API_URL = getApiUrl();

interface StoriesViewProps {
  onClose: () => void;
}

export default function StoriesView({ onClose }: StoriesViewProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const currentIndexRef = useRef(0);
  const storiesRef = useRef<Story[]>([]);
  const onCloseRef = useRef(onClose);
  
  // Update ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const data = await storiesApi.get();
        
        // Show only unread stories, but if none, show all active stories
        const unreadStories = data.stories.filter(s => !s.is_viewed);
        
        if (data.stories.length === 0) {
          onClose();
          return;
        }
        
        // Use unread stories if available, otherwise show all
        const storiesToShow = unreadStories.length > 0 ? unreadStories : data.stories;
        
        setStories(storiesToShow);
        storiesRef.current = storiesToShow;
      } catch (error) {
        console.error('Error loading stories:', error);
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update refs when state changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    storiesRef.current = stories;
  }, [currentIndex, stories]);

  // Progress timer for current story
  useEffect(() => {
    if (loading || stories.length === 0) return;

    setProgress(0); // Reset progress when story changes
    const duration = 10000; // 10 seconds
    const interval = 100; // Update every 100ms
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(timer);
        // Move to next story
        const idx = currentIndexRef.current;
        const storiesList = storiesRef.current;
        if (idx < storiesList.length - 1) {
          storiesApi.markViewed(storiesList[idx].id).then(() => {
            setCurrentIndex(idx + 1);
          });
        } else {
          // Mark last as viewed and close
          storiesApi.markViewed(storiesList[idx].id).then(() => {
            onCloseRef.current();
          });
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, loading]);

  const handleNext = async () => {
    if (currentIndex < stories.length - 1) {
      // Mark current as viewed
      await storiesApi.markViewed(stories[currentIndex].id);
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      // Mark last as viewed and close
      await storiesApi.markViewed(stories[currentIndex].id);
      onClose();
    }
  };

  const handleClose = async () => {
    // Mark current as viewed when closing
    if (stories[currentIndex]) {
      await storiesApi.markViewed(stories[currentIndex].id);
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const isImage = currentStory.media_type === 'image';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Progress indicator with space for close button */}
      <div className="absolute top-4 left-4 right-20 flex gap-2 z-10">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button - новогодний стиль */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 bg-card-red/90 backdrop-blur-sm rounded-full flex items-center justify-center border-[3px] border-white shadow-lg hover:bg-card-red hover:scale-110 transition-all duration-200"
        style={{
          boxShadow: '0 4px 12px rgba(139, 44, 44, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
      >
        <FaTimes className="text-white text-lg font-bold" />
      </button>

      {/* Story content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isImage ? (
          <img
            src={`${API_URL}${currentStory.media_url}`}
            alt={currentStory.title || 'Story'}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={`${API_URL}${currentStory.media_url}`}
            autoPlay
            muted
            className="max-w-full max-h-full object-contain"
            onEnded={handleNext}
          />
        )}
      </div>

      {/* Title if exists */}
      {currentStory.title && (
        <div className="absolute bottom-20 left-0 right-0 text-center z-10 px-4">
          <p className="text-white text-lg font-decorative font-bold bg-card-red/80 backdrop-blur-sm px-6 py-3 rounded-full inline-block border-2 border-white/50 shadow-lg">
            {currentStory.title}
          </p>
        </div>
      )}

      {/* Navigation areas (invisible click zones) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
        onClick={() => {
          if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
          }
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
        onClick={handleNext}
      />
    </div>
  );
}

