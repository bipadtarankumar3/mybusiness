'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function GoogleAuthButton({ redirectTo = '/user/dashboard', label = 'Continue with Google' }) {
  const router = useRouter();
  const { loginWithGoogle, loginOfflineDemo } = useAuth();
  const googleBtnRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDevModal, setShowDevModal] = useState(false);
  const [devEmail, setDevEmail] = useState('owner@mybusiness.in');
  const [devName, setDevName] = useState('Aarav Mehta');
  const [devBusiness, setDevBusiness] = useState('Mehta Traders');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === 'undefined') return;

    const existingScript = document.getElementById('google-gsi-client');
    const initGsi = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response?.credential) return;
          setLoading(true);
          setError('');
          try {
            await loginWithGoogle({ idToken: response.credential });
            router.push(redirectTo);
          } catch (err) {
            setError(err?.message || 'Google sign-in failed. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'continue_with',
        shape: 'pill',
      });
    };

    if (existingScript) {
      initGsi();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGsi;
    document.body.appendChild(script);
  }, [loginWithGoogle, redirectTo, router]);

  const handleFallbackClick = () => {
    setError('');
    setShowDevModal(true);
  };

  const handleDevGoogleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle({
        email: devEmail.trim(),
        name: devName.trim(),
        businessName: devBusiness.trim() || undefined,
      });
      setShowDevModal(false);
      router.push(redirectTo);
    } catch (err) {
      if (err?.status === 0 || err?.code === 'NETWORK_ERROR') {
        loginOfflineDemo();
        setShowDevModal(false);
        router.push('/user/dashboard');
        return;
      }
      setError(err?.message || 'Could not complete Google Sign-In');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {GOOGLE_CLIENT_ID ? (
        <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
      ) : (
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={handleFallbackClick}
          disabled={loading}
          style={{ gap: 10, fontWeight: 700 }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          <span>{loading ? 'Connecting with Google...' : label}</span>
        </button>
      )}

      {error && (
        <span className="field-error" style={{ textAlign: 'center' }}>
          {error}
        </span>
      )}

      <Modal
        open={showDevModal}
        onClose={() => setShowDevModal(false)}
        title="Sign in with Google"
        subtitle="Creates a new ChatFlow account & workspace automatically if your Google email is not registered yet."
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowDevModal(false)}>
              Cancel
            </button>
            <button
              type="submit"
              form="google-dev-auth-form"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Continue with Google Account'}
            </button>
          </>
        }
      >
        <form id="google-dev-auth-form" onSubmit={handleDevGoogleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
            <span>
              <strong>Local Development Google Sign-In:</strong> Enter any Google email below. If the account does not
              exist in MySQL yet, ChatFlow automatically creates the user and business workspace. (Set{' '}
              <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> &amp; <code>GOOGLE_CLIENT_ID</code> in <code>.env</code> for live
              Google Identity popup.)
            </span>
          </div>

          <div className="field">
            <label className="label" htmlFor="google-dev-email">
              Google Email *
            </label>
            <input
              id="google-dev-email"
              type="email"
              required
              className="input"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder="you@gmail.com"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="google-dev-name">
              Full Name *
            </label>
            <input
              id="google-dev-name"
              type="text"
              required
              className="input"
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              placeholder="Your Name"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="google-dev-business">
              Business Name (used if creating a new account)
            </label>
            <input
              id="google-dev-business"
              type="text"
              className="input"
              value={devBusiness}
              onChange={(e) => setDevBusiness(e.target.value)}
              placeholder="e.g. Mehta Traders"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

