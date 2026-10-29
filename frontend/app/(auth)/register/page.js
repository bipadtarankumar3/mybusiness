'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthShell from '@/components/auth/AuthShell';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import FacebookAuthButton from '@/components/auth/FacebookAuthButton';
import { useAuth } from '@/hooks/useAuth';
import { applyServerErrors, ApiError } from '@/lib/api';
import { AlertCircle, Eye, EyeOff, FlaskConical, UserPlus } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name (at least 2 characters)'),
  businessName: z.string().trim().min(2, 'Enter your shop or business name'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Must include at least one letter')
    .regex(/[0-9]/, 'Must include at least one number'),
});

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'free';
  const { register: registerAccount, loginOfflineDemo } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [canUseDemoFallback, setCanUseDemoFallback] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      businessName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    setCanUseDemoFallback(false);
    try {
      await registerAccount(values);
      router.push('/user/dashboard');
    } catch (err) {
      if (!applyServerErrors(err, setError)) {
        const isNetworkError =
          err instanceof ApiError && (err.status === 0 || err.status >= 500 || err.code === 'NETWORK_ERROR');
        if (isNetworkError) {
          setCanUseDemoFallback(true);
          setServerError(
            'Unable to reach the backend API right now. You can explore the interactive Demo Workspace immediately.'
          );
        } else {
          setServerError(err?.message || 'Could not create your account. Please check your details.');
        }
      }
    }
  };

  return (
    <>
      {selectedPlan && (
        <div className="alert alert-info" style={{ padding: '10px 14px', fontSize: '0.84rem' }}>
          <span>
            Starting with the <strong style={{ textTransform: 'capitalize' }}>{selectedPlan}</strong> workspace — free
            to set up, no credit card required.
          </span>
        </div>
      )}

      {serverError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle />
          <div style={{ display: 'grid', gap: 8 }}>
            <span>{serverError}</span>
            {canUseDemoFallback && (
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={() => {
                  loginOfflineDemo();
                  router.push('/user/dashboard');
                }}
              >
                <FlaskConical size={14} /> Launch Interactive Demo Workspace →
              </button>
            )}
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label className="label" htmlFor="reg-name">
            Your full name
          </label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Rajesh Sharma"
            className="input"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="reg-business">
            Business or shop name
          </label>
          <input
            id="reg-business"
            type="text"
            placeholder="e.g. Sharma Fashion House"
            className="input"
            aria-invalid={Boolean(errors.businessName)}
            {...register('businessName')}
          />
          {errors.businessName && <span className="field-error">{errors.businessName.message}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="reg-email">
            Work email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="rajesh@sharmafashion.in"
            className="input"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="reg-password">
            Create password
          </label>
          <div className="password-input-wrap">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters with letters & numbers"
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
          {errors.password ? (
            <span className="field-error">{errors.password.message}</span>
          ) : (
            <span className="field-hint">Creates your owner account and a isolated business workspace.</span>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner" /> : <UserPlus size={18} />}
          {isSubmitting ? 'Creating workspace...' : 'Create Free Workspace'}
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
          <span>OR SIGN UP WITH</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <GoogleAuthButton redirectTo="/user/dashboard" label="Sign up with Google" />
        <FacebookAuthButton redirectTo="/user/dashboard" label="Sign up with Facebook" />
      </form>
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start managing WhatsApp customer enquiries, follow-ups, and broadcasts in minutes."
      footer={
        <>
          Already have an account? <Link href="/login">Sign in</Link>
        </>
      }
    >
      <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}>
        <RegisterFormInner />
      </Suspense>
    </AuthShell>
  );
}
