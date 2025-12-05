'use client';

import React, { useState, useEffect, useCallback, useRef, Component, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Textarea } from '@/components/ui/Textarea';
import {
  Send,
  RefreshCw,
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Loader2,
  WifiOff,
  ChevronDown,
  User,
  TrendingUp,
} from 'lucide-react';
import type { Communication, CommunicationType, Lead } from '@/types/crm';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationMessage {
  id: string;
  type: CommunicationType;
  body: string;
  subject?: string;
  sentAt: string;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  direction: 'inbound' | 'outbound';
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ConversationThreadProps {
  /** Lead ID to load conversation for */
  leadId: string;
  /** Lead information */
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    aiScore?: number;
  };
  /** Current user session information */
  currentUser: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  /** Auto-refresh interval in milliseconds (default: 5000) */
  refreshInterval?: number;
  /** Whether to enable auto-refresh (default: true) */
  autoRefresh?: boolean;
  /** Callback when a new message is sent */
  onMessageSent?: (message: ConversationMessage) => void;
  /** Callback when conversation is refreshed */
  onRefresh?: () => void;
  /** Custom class name */
  className?: string;
  /** API endpoint for fetching messages (default: /api/communications) */
  apiEndpoint?: string;
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ConversationErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ConversationThread Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
          <AlertCircle className="w-12 h-12 text-danger-500 mb-4" />
          <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-danger-600 dark:text-danger-400 text-center mb-4">
            {this.state.error?.message || 'An unexpected error occurred while loading the conversation.'}
          </p>
          <Button variant="danger" size="sm" onClick={this.handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// LEAD SCORE BADGE COMPONENT
// ============================================================================

interface LeadScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function LeadScoreBadge({ score, size = 'md', showLabel = true, className }: LeadScoreBadgeProps) {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color based on score thresholds
  const getScoreColor = (score: number): { bg: string; text: string; ring: string } => {
    if (score >= 80) {
      return {
        bg: 'bg-success-100 dark:bg-success-900/30',
        text: 'text-success-700 dark:text-success-300',
        ring: 'ring-success-500/30',
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-primary-100 dark:bg-primary-900/30',
        text: 'text-primary-700 dark:text-primary-300',
        ring: 'ring-primary-500/30',
      };
    } else if (score >= 40) {
      return {
        bg: 'bg-warning-100 dark:bg-warning-900/30',
        text: 'text-warning-700 dark:text-warning-300',
        ring: 'ring-warning-500/30',
      };
    } else if (score >= 20) {
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        ring: 'ring-orange-500/30',
      };
    } else {
      return {
        bg: 'bg-danger-100 dark:bg-danger-900/30',
        text: 'text-danger-700 dark:text-danger-300',
        ring: 'ring-danger-500/30',
      };
    }
  };

  const colors = getScoreColor(clampedScore);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full ring-1',
        colors.bg,
        colors.text,
        colors.ring,
        sizeClasses[size],
        className
      )}
      title={`Lead Score: ${clampedScore}/100`}
    >
      <TrendingUp className={iconSizes[size]} />
      <span>{clampedScore}</span>
      {showLabel && <span className="font-normal opacity-80">score</span>}
    </span>
  );
}

// ============================================================================
// MESSAGE STATUS ICON
// ============================================================================

function MessageStatusIcon({ status }: { status: ConversationMessage['status'] }) {
  switch (status) {
    case 'delivered':
      return <CheckCheck className="w-4 h-4 text-success-500" />;
    case 'sent':
      return <Check className="w-4 h-4 text-neutral-400" />;
    case 'pending':
    case 'queued':
      return <Clock className="w-4 h-4 text-warning-500" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-danger-500" />;
    case 'received':
      return null;
    default:
      return null;
  }
}

// ============================================================================
// MESSAGE TYPE ICON
// ============================================================================

function MessageTypeIcon({ type, className }: { type: CommunicationType; className?: string }) {
  switch (type) {
    case 'EMAIL':
      return <Mail className={cn('w-4 h-4', className)} />;
    case 'SMS':
      return <MessageSquare className={cn('w-4 h-4', className)} />;
    case 'CALL':
      return <Phone className={cn('w-4 h-4', className)} />;
    default:
      return null;
  }
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
        <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/6" />
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <MessageSkeleton />
      <div className="flex gap-3 animate-pulse justify-end">
        <div className="flex-1 space-y-2 flex flex-col items-end">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
          <div className="h-12 bg-primary-100 dark:bg-primary-900/30 rounded w-2/3" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/6" />
        </div>
        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
      </div>
      <MessageSkeleton />
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

interface MessageBubbleProps {
  message: ConversationMessage;
  isCurrentUser: boolean;
}

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const formattedTime = new Date(message.sentAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      className={cn(
        'flex gap-3 group',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar
        className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10"
        name={message.sender.name}
      />

      <div
        className={cn(
          'flex flex-col max-w-[85%] md:max-w-[70%]',
          isCurrentUser ? 'items-end' : 'items-start'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {message.sender.name}
          </span>
          <MessageTypeIcon type={message.type} className="text-neutral-400" />
        </div>

        {message.subject && (
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Subject: {message.subject}
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 break-words',
            isCurrentUser
              ? 'bg-primary-500 text-white rounded-br-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-neutral-400">
            {formattedTime}
          </span>
          {isCurrentUser && <MessageStatusIcon status={message.status} />}
          {message.status === 'failed' && (
            <span className="text-xs text-danger-500">Failed to send</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONVERSATION HEADER
// ============================================================================

interface ConversationHeaderProps {
  lead: ConversationThreadProps['lead'];
  isRefreshing: boolean;
  lastRefreshTime: Date | null;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
}

function ConversationHeader({
  lead,
  isRefreshing,
  lastRefreshTime,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onManualRefresh,
}: ConversationHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <Avatar
          className="w-10 h-10 md:w-12 md:h-12"
          name={`${lead.firstName} ${lead.lastName}`}
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              {lead.firstName} {lead.lastName}
            </h2>
            {typeof lead.aiScore === 'number' && (
              <LeadScoreBadge score={lead.aiScore} size="sm" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            {lead.email && <span className="truncate max-w-[150px] md:max-w-none">{lead.email}</span>}
            {lead.email && lead.phone && <span>|</span>}
            {lead.phone && <span>{lead.phone}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          onClick={onToggleAutoRefresh}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
            autoRefreshEnabled
              ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
          )}
          title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
        >
          <RefreshCw className={cn('w-3 h-3', autoRefreshEnabled && 'animate-spin')} />
          <span className="hidden sm:inline">Auto</span>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {lastRefreshTime && (
          <span className="text-xs text-neutral-400 hidden md:inline">
            Updated {lastRefreshTime.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MESSAGE INPUT COMPONENT
// ============================================================================

interface MessageInputProps {
  onSend: (message: string, type: CommunicationType) => Promise<void>;
  disabled?: boolean;
  isAdmin: boolean;
  isSending: boolean;
}

function MessageInput({ onSend, disabled, isAdmin, isSending }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<CommunicationType>('SMS');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSending) return;

    await onSend(message.trim(), messageType);
    setMessage('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <User className="w-4 h-4" />
          <span>Only administrators can send messages in this conversation.</span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Send as:
          </span>
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            {(['SMS', 'EMAIL'] as CommunicationType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMessageType(type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  messageType === type
                    ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <MessageTypeIcon type={type} className="w-4 h-4" />
                <span className="hidden sm:inline">{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type your ${messageType.toLowerCase()} message...`}
            disabled={disabled || isSending}
            rows={2}
            className="flex-1 resize-none min-h-[60px] max-h-[120px]"
          />

          <Button
            type="submit"
            disabled={!message.trim() || disabled || isSending}
            className="self-end"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Send</span>
          </Button>
        </div>

        <p className="text-xs text-neutral-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </form>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyConversation({ leadName }: { leadName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        No messages yet
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
        Start a conversation with {leadName} by sending the first message below.
      </p>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-danger-500" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        Connection Error
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-4">
        Unable to load messages. Please check your connection and try again.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ConversationThreadInner({
  leadId,
  lead,
  currentUser,
  refreshInterval = 5000,
  autoRefresh = true,
  onMessageSent,
  onRefresh,
  className,
  apiEndpoint = '/api/communications',
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Check if current user is admin
  const isAdmin = currentUser.role === 'ADMIN';

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Handle scroll position detection
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch(`${apiEndpoint}?leadId=${leadId}&limit=100`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();

      // Transform API response to ConversationMessage format
      const transformedMessages: ConversationMessage[] = (data.communications || []).map(
        (comm: Communication) => ({
          id: comm.id,
          type: comm.type,
          body: comm.body,
          subject: comm.subject,
          sentAt: comm.sentAt,
          status: comm.status,
          direction: comm.userId === currentUser.id ? 'outbound' : 'inbound',
          sender: {
            id: comm.userId === currentUser.id ? currentUser.id : lead.id,
            name: comm.userId === currentUser.id
              ? currentUser.name
              : `${lead.firstName} ${lead.lastName}`,
          },
        })
      );

      // Sort by date ascending (oldest first)
      transformedMessages.sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );

      setMessages(transformedMessages);
      setLastRefreshTime(new Date());
      onRefresh?.();

      // Scroll to bottom if user was already at bottom
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [leadId, apiEndpoint, currentUser, lead, onRefresh, isAtBottom, scrollToBottom]);

  // Send message
  const handleSendMessage = useCallback(async (body: string, type: CommunicationType) => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          type,
          body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      // Create new message from response
      const newMessage: ConversationMessage = {
        id: data.communication?.id || crypto.randomUUID(),
        type,
        body,
        sentAt: new Date().toISOString(),
        status: data.communication?.status || 'sent',
        direction: 'outbound',
        sender: {
          id: currentUser.id,
          name: currentUser.name,
        },
      };

      setMessages((prev) => [...prev, newMessage]);
      onMessageSent?.(newMessage);

      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [leadId, apiEndpoint, currentUser, onMessageSent, scrollToBottom]);

  // Initial fetch
  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, refreshInterval, fetchMessages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [isLoading, messages.length, scrollToBottom]);

  const leadName = `${lead.firstName} ${lead.lastName}`;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <ConversationHeader
        lead={lead}
        isRefreshing={isRefreshing}
        lastRefreshTime={lastRefreshTime}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
        onManualRefresh={() => fetchMessages(false)}
      />

      {/* Messages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {isLoading ? (
          <ConversationSkeleton />
        ) : error && messages.length === 0 ? (
          <ConnectionError onRetry={() => fetchMessages(true)} />
        ) : messages.length === 0 ? (
          <EmptyConversation leadName={leadName} />
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.sender.id === currentUser.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 p-2 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Error Banner */}
      {error && messages.length > 0 && (
        <div className="px-4 py-2 bg-danger-50 dark:bg-danger-900/20 border-t border-danger-200 dark:border-danger-800">
          <div className="flex items-center gap-2 text-sm text-danger-700 dark:text-danger-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-danger-500 hover:text-danger-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isLoading}
        isAdmin={isAdmin}
        isSending={isSending}
      />
    </div>
  );
}

// ============================================================================
// EXPORTED COMPONENT WITH ERROR BOUNDARY
// ============================================================================

export function ConversationThread(props: ConversationThreadProps) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <ConversationErrorBoundary
      key={resetKey}
      onReset={() => setResetKey((k) => k + 1)}
    >
      <ConversationThreadInner {...props} />
    </ConversationErrorBoundary>
  );
}

export default ConversationThread;
