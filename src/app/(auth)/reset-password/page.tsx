'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-danger-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Invalid link</h1>
            <p className="mt-2 text-neutral-600">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/forgot-password">
              <Button className="w-full">Request new reset link</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-success-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Password reset!</h1>
            <p className="mt-2 text-neutral-600">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/login">
              <Button className="w-full">Go to login</Button>
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
          <h1 className="text-2xl font-bold text-neutral-900">Reset your password</h1>
          <p className="mt-2 text-neutral-600">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="New password"
              placeholder="Enter your new password"
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm new password"
              placeholder="Confirm your new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-xs text-neutral-500">
            Password must be at least 8 characters long.
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Reset password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
