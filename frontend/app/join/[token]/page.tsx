'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  useEffect(() => {
    const join = async () => {
      try {
        await authApi.join(token);
        router.push('/');
      } catch (error: any) {
        alert(error.response?.data?.error || 'Ошибка при входе');
        router.push('/');
      }
    };

    if (token) {
      join();
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-card-red mx-auto"></div>
        <p className="mt-4 text-text-secondary">Входим...</p>
      </div>
    </div>
  );
}
