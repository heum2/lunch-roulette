import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

import Cursor from '@/app/components/Cursor';
import Loulette from '@/app/components/Loulette';

const Home = async () => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  return (
    <Cursor>
      <Loulette />
    </Cursor>
  );
};

export default Home;
