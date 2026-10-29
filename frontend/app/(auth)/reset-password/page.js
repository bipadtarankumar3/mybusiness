'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthShell from '@/components/auth/AuthShell';
import { api, applyServerErrors } from '@/lib/api';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';

const resetSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Must include at least one letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: initialToken,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await api.post('/auth/reset-password', {
        token: values.token,
        password: values.password,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err) {
      if (!applyServerErrors(err, setError)) {
        setServerError(err?.message || 'Invalid or expired reset token. Please request a new reset link.');
      }
    }
  };

  if (success) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="alert alert-success" role="status">
          <CheckCircle2 />
          <div>
            <strong>Password updated!</strong>
            <p style={{ marginTop: 4, fontSize: '0.86rem' }}>
              Your password has been reset. Redirecting you to sign in...
            </p>
          </div>
        </div>
        <Link href="/login" className="btn btn-primary btn-block">
          Continue to Sign In →
        </Link>
      </div>
    );
  }

  return (
    <>
      {serverError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle />
          <span>{serverError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {!initialToken && (
          <div className="field">
            <label className="label" htmlFor="reset-token">
              Reset token
            </label>
            <input
              id="reset-token"
              type="text"
              placeholder="Paste the token from your reset link"
              className="input"
              aria-invalid={Boolean(errors.token)}
              {...register('token')}
            />
            {errors.token && <span className="field-error">{errors.token.message}</span>}
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="reset-password">
            New password
          </label>
          <div className="password-input-wrap">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        <div className="field">
          <label className="label" htmlFor="reset-confirm">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            className="input"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner" /> : <KeyRound size={18} />}
          {isSubmitting ? 'Updating password...' : 'Save New Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a strong password to secure your ChatFlow workspace."
      footer={
        <>
          Need a fresh reset link? <Link href="/forgot-password">Request another token</Link>
        </>
      }
    >
      <Suspense fallback={<div className="skeleton" style={{ height: 260 }} />}>
        <ResetPasswordInner />
      </Suspense>
    </AuthShell>
  );
}
