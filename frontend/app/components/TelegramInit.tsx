'use client';

import { useEffect } from 'react';

/**
 * Компонент для инициализации Telegram WebApp
 * Автоматически настраивает тему, расширяет на весь экран и т.д.
 */
export default function TelegramInit() {
  useEffect(() => {
    // Ждем загрузки Telegram WebApp скрипта
    const initTelegram = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;

        // Говорим Telegram, что приложение готово
        tg.ready();

        // Расширяем на весь экран
        tg.expand();

        // Включаем автоматическое закрытие при свайпе вниз
        tg.enableClosingConfirmation();

        // Устанавливаем цвет темы (опционально)
        tg.setHeaderColor('#C62828'); // Красный цвет из дизайна
        tg.setBackgroundColor('#FBF2E8'); // Фон из дизайна

        // Логируем данные пользователя (для отладки)
        if (tg.initDataUnsafe?.user) {
          console.log('Telegram user:', tg.initDataUnsafe.user);
          console.log('Telegram initData:', tg.initData);
        }

        console.log('Telegram WebApp initialized');
      } else {
        console.log('Not in Telegram WebApp context');
      }
    };

    // Если скрипт уже загружен
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      initTelegram();
    } else {
      // Ждем загрузки скрипта
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          clearInterval(checkInterval);
          initTelegram();
        }
      }, 100);

      // Таймаут на случай, если скрипт не загрузится
      setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof window !== 'undefined' && !window.Telegram?.WebApp) {
          console.warn('Telegram WebApp script not loaded');
        }
      }, 5000);
    }
  }, []);

  return null; // Компонент не рендерит ничего
}

// Расширяем Window интерфейс для TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          chat?: any;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void;
          getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
          getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void;
          removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void;
          getKeys: (callback: (error: Error | null, keys: string[]) => void) => void;
        };
        expand: () => void;
        close: () => void;
        ready: () => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }, callback?: (id: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup: (params: {
          text?: string;
        }, callback?: (text: string) => void) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback?: (text: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean) => void) => void;
        invokeCustomMethod: (method: string, params: Record<string, any>, callback?: (error: Error | null, result: any) => void) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableVerticalSwipes: () => void;
        disableVerticalSwipes: () => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}
