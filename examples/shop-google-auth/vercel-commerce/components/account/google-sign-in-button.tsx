'use client';

import { Button } from '@/ui-components/ui/button';
import { useToast } from '@/ui-components/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signInWithGoogle } from './actions';
import { FaGoogle } from 'react-icons/fa';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google: any;
    handleCredentialResponse?: (response: any) => void;
  }
}

export function GoogleSignInButton() {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Define the callback function globally
    window.handleCredentialResponse = async (response: any) => {
      setPending(true);
      try {
        const result = await signInWithGoogle(response.credential);
        
        if (result?.type === 'success') {
          toast({
            variant: 'default',
            title: 'Welcome!',
            description: 'Successfully signed in with Google'
          });
          router.replace('/account');
        } else {
          toast({
            variant: 'destructive',
            title: 'Authentication Failed',
            description: result?.message || 'Unknown error occurred'
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to authenticate with Google'
        });
      } finally {
        setPending(false);
      }
    };

    // Load Google Identity Services
    if (!window.google && GOOGLE_CLIENT_ID) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: window.handleCredentialResponse,
        });
      };
      document.head.appendChild(script);
    }

    return () => {
      delete window.handleCredentialResponse;
    };
  }, [toast, router]);

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Google authentication is not configured'
      });
      return;
    }

    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Google Sign-In is not loaded yet'
      });
    }
  };

  if (pending) {
    return (
      <Button disabled className="w-full">
        <FaGoogle className="mr-2 h-4 w-4" />
        Authenticating...
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleGoogleSignIn}
      className="w-full"
      type="button"
    >
      <FaGoogle className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  );
}