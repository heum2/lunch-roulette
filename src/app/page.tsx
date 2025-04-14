import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

import Loulette from '@/app/components/Loulette';

const Home = async () => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loulette />
    </div>
  );
};

export default Home;
