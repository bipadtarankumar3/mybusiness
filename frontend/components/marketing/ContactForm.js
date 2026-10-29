'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { api, applyServerErrors } from '@/lib/api';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name (at least 2 characters).').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(160),
  phone: z
    .string()
    .trim()
    .max(25, 'Phone number is too long.')
    .optional()
    .or(z.literal('')),
  businessName: z
    .string()
    .trim()
    .max(160, 'Business name is too long.')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Please share a few more details (at least 10 characters).')
    .max(2000, 'Message is too long.'),
});

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      businessName: '',
      message: '',
    },
  });

  async function onSubmit(values) {
    setServerError('');
    try {
      await api.post('/contact-requests', {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        businessName: values.businessName || undefined,
        message: values.message,
      });
      setSubmitted(true);
      reset();
    } catch (err) {
      if (!applyServerErrors(err, setError)) {
        setServerError(err.message || 'Could not submit your message. Please try again.');
      }
    }
  }

  if (submitted) {
    return (
      <div className="alert alert-success" role="status">
        <CheckCircle2 size={20} />
        <div>
          <strong>Thank you for reaching out!</strong>
          <p style={{ marginTop: 4 }}>
            Your enquiry has been recorded. Our team will get back to you shortly.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => setSubmitted(false)}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'grid', gap: 16 }}>
      {serverError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="contact-name" className="label">
          Your name *
        </label>
        <input
          id="contact-name"
          type="text"
          className="input"
          placeholder="e.g. Rajesh Sharma"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="contact-email" className="label">
          Work or personal email *
        </label>
        <input
          id="contact-email"
          type="email"
          className="input"
          placeholder="you@business.in"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && <span className="field-error">{errors.email.message}</span>}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="field">
          <label htmlFor="contact-phone" className="label">
            Phone / WhatsApp number
          </label>
          <input
            id="contact-phone"
            type="tel"
            className="input"
            placeholder="+91 98765 43210"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
          {errors.phone && <span className="field-error">{errors.phone.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="contact-business" className="label">
            Business name
          </label>
          <input
            id="contact-business"
            type="text"
            className="input"
            placeholder="e.g. Sharma Fashion House"
            aria-invalid={Boolean(errors.businessName)}
            {...register('businessName')}
          />
          {errors.businessName && (
            <span className="field-error">{errors.businessName.message}</span>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="contact-message" className="label">
          How can we help you? *
        </label>
        <textarea
          id="contact-message"
          className="textarea"
          placeholder="Tell us about your business, team size or plan questions…"
          aria-invalid={Boolean(errors.message)}
          {...register('message')}
        />
        {errors.message && <span className="field-error">{errors.message.message}</span>}
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
        {isSubmitting ? <span className="spinner" aria-hidden="true" /> : <Send size={17} />}
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}

