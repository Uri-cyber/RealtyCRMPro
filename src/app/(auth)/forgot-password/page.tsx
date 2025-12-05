'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-success-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Check your email</h1>
            <p className="mt-2 text-neutral-600">
              If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent password reset instructions.
            </p>
            <p className="mt-4 text-sm text-neutral-500">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                try again
              </button>
            </p>
          </div>

          <div className="mt-8">
            <Link href="/login">
              <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Forgot password?</h1>
          <p className="mt-2 text-neutral-600">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg">
              {error}
            </div>
          )}

          <Input
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            autoFocus
          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            Send reset link
          </Button>
        </form>

        <div className="mt-6">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
