'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { createClient } from '@/utils/supabase/client';
import { useEffect } from 'react';

const Login = () => {
  const supabase = createClient();
  const router = useRouter();

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      'http://localhost:3000/';

    url = url.startsWith('http') ? url : `https://${url}`;

    url = url.endsWith('/') ? url : `${url}/`;
    return url;
  };

  const handleSignInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: getURL(),
      },
    });

    if (error) {
      console.error('Error signing in with Google', error);
    }

    if (data.url) {
      router.push(data.url);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.push('/');
      }
    };

    checkSession();
  }, []);

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content">
        <button className="btn btn-primary" onClick={handleSignInWithGoogle}>
          <Image
            src="/icons/google-logo.svg"
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
