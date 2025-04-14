'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Loulette from '@/app/components/Loulette';

import { createClient } from '@/utils/supabase/client';

function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { error } = await supabase.auth.getUser();
        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error fetching user', error);
        router.replace('/login');
      }
    };
    fetchSession();
  }, [supabase.auth, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loulette />
    </div>
  );
}

export default Home;
