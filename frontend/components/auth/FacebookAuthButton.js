'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';

export default function FacebookAuthButton({
  redirectTo = '/user/dashboard',
  label = 'Continue with Facebook',
}) {
  const router = useRouter();
  const { loginWithFacebook, loginOfflineDemo } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDevModal, setShowDevModal] = useState(false);
  const [devEmail, setDevEmail] = useState('priya.fb@chatflow.local');
  const [devName, setDevName] = useState('Priya Sharma');
  const [devBusiness, setDevBusiness] = useState('Priya Ethnic Couture');

  useEffect(() => {
    if (!FACEBOOK_APP_ID || typeof window === 'undefined') return;

    if (window.FB) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
    };

    const existingScript = document.getElementById('facebook-jssdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleFacebookClick = () => {
    setError('');
    if (FACEBOOK_APP_ID && typeof window !== 'undefined' && window.FB) {
      setLoading(true);
      window.FB.login(
        async (response) => {
          if (response.authResponse?.accessToken) {
            try {
              await loginWithFacebook({ accessToken: response.authResponse.accessToken });
              router.push(redirectTo);
            } catch (err) {
              setError(err?.message || 'Facebook authentication failed. Please try again.');
            } finally {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        },
        { scope: 'email,public_profile' }
      );
      return;
    }

    // Fallback: interactive dialog for development/testing
    setShowDevModal(true);
  };

  const handleDevFacebookSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithFacebook({
        email: devEmail.trim(),
        name: devName.trim(),
        businessName: devBusiness.trim() || undefined,
        facebookId: `fb_${devEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
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
      setError(err?.message || 'Could not complete Facebook Sign-In');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button
        type="button"
        className="btn btn-outline btn-block"
        onClick={handleFacebookClick}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontWeight: 700,
          background: '#1877F2',
          borderColor: '#1877F2',
          color: '#ffffff',
          transition: 'all 0.15s ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>{loading ? 'Connecting Facebook...' : label}</span>
      </button>

      {error ? (
        <div className="alert alert-danger" style={{ fontSize: '0.8125rem', padding: '8px 12px' }}>
          {error}
        </div>
      ) : null}

      <Modal
        isOpen={showDevModal}
        onClose={() => setShowDevModal(false)}
        title="Facebook Sign-In (Dev & Testing)"
        description="Connect with Facebook. If an account already exists with this email, you will be logged in immediately; otherwise a new workspace is created with a Free tier plan."
        size="md"
      >
        <form onSubmit={handleDevFacebookSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="dev-fb-email">
              Facebook Account Email *
            </label>
            <input
              id="dev-fb-email"
              type="email"
              className="form-control"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              required
              placeholder="e.g. user@facebook.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dev-fb-name">
              Full Name *
            </label>
            <input
              id="dev-fb-name"
              type="text"
              className="form-control"
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              required
              placeholder="e.g. Priya Sharma"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dev-fb-biz">
              Business / Workspace Name (For new accounts)
            </label>
            <input
              id="dev-fb-biz"
              type="text"
              className="form-control"
              value={devBusiness}
              onChange={(e) => setDevBusiness(e.target.value)}
              placeholder="e.g. Priya Ethnic Couture"
            />
          </div>

          <div
            style={{
              padding: 10,
              background: 'var(--color-bg-subtle, #f8fafc)',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: 'var(--color-text-muted, #64748b)',
            }}
          >
            Tip: In production, setting <code>NEXT_PUBLIC_FACEBOOK_APP_ID</code> and backend{' '}
            <code>FACEBOOK_APP_ID</code> enables the live Meta OAuth popup dialog.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowDevModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading}
              style={{ background: '#1877F2', borderColor: '#1877F2', color: '#fff' }}
            >
              {loading ? 'Signing in...' : 'Sign In with Facebook'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

