'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthShell from '@/components/auth/AuthShell';
import { api, applyServerErrors } from '@/lib/api';
import { AlertCircle, CheckCircle2, KeyRound, Mail } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    setDevResetUrl('');
    try {
      const res = await api.post('/auth/forgot-password', values);
      const data = res?.data || res;
      if (data?.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
      setSubmitted(true);
    } catch (err) {
      if (!applyServerErrors(err, setError)) {
        setServerError(err?.message || 'Unable to process request right now. Please try again.');
      }
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address linked to your ChatFlow account and we’ll send a single-use reset link."
      footer={
        <>
          Remembered your password? <Link href="/login">Back to sign in</Link>
        </>
      }
    >
      {serverError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle />
          <span>{serverError}</span>
        </div>
      )}

      {submitted ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="alert alert-success" role="status">
            <CheckCircle2 />
            <div>
              <strong>Check your inbox</strong>
              <p style={{ marginTop: 4, fontSize: '0.86rem' }}>
                If an account exists for that email, we’ve generated a password reset link valid for 30 minutes.
              </p>
            </div>
          </div>

          {devResetUrl && (
            <div className="auth-demo-box">
              <div className="auth-demo-box-head">
                <span>Development Mode Reset Link (SMTP not configured)</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', wordBreak: 'break-all' }}>{devResetUrl}</p>
              <Link href={devResetUrl} className="btn btn-primary btn-sm" style={{ justifySelf: 'start' }}>
                <KeyRound size={15} /> Open Reset Password Link →
              </Link>
            </div>
          )}

          <button type="button" className="btn btn-outline btn-block" onClick={() => setSubmitted(false)}>
            Send to another email
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label className="label" htmlFor="forgot-email">
              Account email address
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@yourbusiness.in"
              className="input"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : <Mail size={18} />}
            {isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
