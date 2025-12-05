'use client';

import React from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  alt,
  name,
  size = 'md',
  status,
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusClasses = {
    online: 'bg-success-500',
    offline: 'bg-neutral-400',
    busy: 'bg-danger-500',
    away: 'bg-warning-500',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5 -bottom-0.5 -right-0.5',
    sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0 right-0',
    xl: 'w-4 h-4 bottom-0.5 right-0.5',
  };

  const initials = name ? getInitials(name) : '?';

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn(
            'rounded-full object-cover bg-neutral-200',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium bg-primary-100 text-primary-700',
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-white',
            statusClasses[status],
            statusSizeClasses[size]
          )}
        />
      )}
    </div>
  );
};

export { Avatar };
