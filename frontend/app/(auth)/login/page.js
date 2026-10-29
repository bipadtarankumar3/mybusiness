'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthShell from '@/components/auth/AuthShell';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { useAuth } from '@/hooks/useAuth';
import { applyServerErrors, ApiError } from '@/lib/api';
import { AlertCircle, Eye, EyeOff, FlaskConical, LogIn, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_EMAIL = 'demo@chatflow.local';
const DEMO_PASSWORD = 'Demo@12345';
const ADMIN_EMAIL = 'admin@chatflow.local';
const ADMIN_PASSWORD = 'Admin@12345';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';
  const { login, loginOfflineDemo } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [canLaunchOfflineDemo, setCanLaunchOfflineDemo] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    setCanLaunchOfflineDemo(false);
    try {
      await login(values);
      router.push(nextUrl);
    } catch (err) {
      if (!applyServerErrors(err, setError)) {
        const isNetworkOrServerDown =
          err instanceof ApiError && (err.status === 0 || err.status >= 500 || err.code === 'NETWORK_ERROR');
        if (isNetworkOrServerDown) {
          setCanLaunchOfflineDemo(true);
          setServerError(
            'The backend API server is currently unreachable. You can start the backend or launch the interactive Demo Workspace preview below.'
          );
        } else {
          setServerError(err?.message || 'Invalid email or password. Please try again.');
        }
      }
    }
  };

  const handleFillDemo = () => {
    setValue('email', DEMO_EMAIL, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
    setServerError('');
  };

  const handleOneClickDemoLogin = async () => {
    setValue('email', DEMO_EMAIL, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
    setServerError('');
    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      router.push(nextUrl);
    } catch {
      // Fallback cleanly to interactive offline demo mode if backend is not running during preview
      loginOfflineDemo();
      router.push('/dashboard');
    }
  };

  const handleOneClickAdminLogin = async () => {
    setValue('email', ADMIN_EMAIL, { shouldValidate: true });
    setValue('password', ADMIN_PASSWORD, { shouldValidate: true });
    setServerError('');
    try {
      await login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      router.push('/dashboard/admin');
    } catch {
      loginOfflineDemo();
      router.push('/dashboard/admin');
    }
  };

  const handleEnterOfflinePreview = () => {
    loginOfflineDemo();
    router.push('/dashboard');
  };

  return (
    <>
      <div className="auth-demo-box">
        <div className="auth-demo-box-head">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} /> Instant Evaluator Demo Access
          </span>
          <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
            Pre-seeded CRM
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
          Explore ChatFlow with pre-loaded Indian SMB conversations, contacts, campaigns, and workflows:
        </p>
        <div className="auth-demo-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleFillDemo}>
            <FlaskConical size={14} /> Fill Demo Credentials
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOneClickDemoLogin}
            disabled={isSubmitting}
          >
            One-Click User Demo →
          </button>
          <button
            type="button"
            className="btn btn-dark btn-sm"
            onClick={handleOneClickAdminLogin}
            disabled={isSubmitting}
          >
            <Sparkles size={14} /> Super Admin Login →
          </button>
        </div>
      </div>

      {serverError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle />
          <div style={{ display: 'grid', gap: 8 }}>
            <span>{serverError}</span>
            {canLaunchOfflineDemo && (
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={handleEnterOfflinePreview}
                style={{ justifySelf: 'start' }}
              >
                <FlaskConical size={14} /> Open Interactive Demo Preview Anyway →
              </button>
            )}
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label className="label" htmlFor="login-email">
            Work or business email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@yourbusiness.in"
            className="input"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </div>

        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <Link
              href="/forgot-password"
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--green-deep)' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="password-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="input"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner" /> : <LogIn size={18} />}
          {isSubmitting ? 'Signing in...' : 'Sign in to ChatFlow'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '4px 0',
            color: 'var(--muted)',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
        >
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>OR</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <GoogleAuthButton redirectTo={nextUrl} label="Continue with Google" />
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your WhatsApp inbox, customer follow-ups, and campaigns."
      footer={
        <>
          New to ChatFlow? <Link href="/register">Create your free business workspace</Link>
        </>
      }
    >
      <Suspense fallback={<div className="skeleton" style={{ height: 280 }} />}>
        <LoginFormInner />
      </Suspense>
    </AuthShell>
  );
}
