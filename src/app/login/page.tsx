'use client';

import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

const Login = () => {
  const supabase = createClient();

  const handleSignInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      console.error('Error signing in with Google', error);
    }

    if (data) {
      console.log('Signed in with Google', data);
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <button className="btn " onClick={handleSignInWithGoogle}>
          <Image
            src="/google-logo.svg"
            alt="Google logo"
            width={20}
            height={20}
          />
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
