'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Mail,
  MessageSquare,
  Phone,
  Star,
  Archive,
  Clock,
  Check,
  CheckCheck,
  Plus,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  Input,
  Textarea,
  Modal,
  ModalFooter,
  Select,
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import type {
  Communication,
  MessageTemplate,
  CommunicationType,
  CommunicationServiceStatus,
} from '@/types/crm';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface ConversationGroup {
  leadId: string;
  lead: Lead;
  lastMessage: Communication;
  unreadCount: number;
  channel: 'email' | 'sms';
  communications: Communication[];
}

export default function MessagesPage() {
  // State for data
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [serviceStatus, setServiceStatus] = useState<CommunicationServiceStatus | null>(null);

  // UI State
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'email' | 'sms'>('all');

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New message form state
  const [newMessage, setNewMessage] = useState({
    leadId: '',
    channel: 'email' as CommunicationType,
    subject: '',
    body: '',
  });

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'EMAIL' as CommunicationType,
    isDefault: false,
  });

  // Fetch communications
  const fetchCommunications = useCallback(async () => {
    try {
      const response = await fetch('/api/communications?limit=100');
      if (!response.ok) throw new Error('Failed to fetch communications');
      const data = await response.json();

      // Group communications by lead
      const grouped = data.communications.reduce(
        (acc: Record<string, ConversationGroup>, comm: Communication) => {
          if (!comm.lead) return acc;

          if (!acc[comm.leadId]) {
            acc[comm.leadId] = {
              leadId: comm.leadId,
              lead: comm.lead,
              lastMessage: comm,
              unreadCount: 0,
              channel: comm.type === 'SMS' ? 'sms' : 'email',
              communications: [],
            };
          }

          acc[comm.leadId].communications.push(comm);

          // Update last message if this one is more recent
          if (new Date(comm.sentAt) > new Date(acc[comm.leadId].lastMessage.sentAt)) {
            acc[comm.leadId].lastMessage = comm;
            acc[comm.leadId].channel = comm.type === 'SMS' ? 'sms' : 'email';
          }

          return acc;
        },
        {}
      );

      setConversations(Object.values(grouped));
    } catch (err) {
      console.error('Error fetching communications:', err);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }, []);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  }, []);

  // Fetch service status
  const fetchServiceStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/communications/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setServiceStatus(data);
    } catch (err) {
      console.error('Error fetching service status:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchCommunications(),
          fetchTemplates(),
          fetchLeads(),
          fetchServiceStatus(),
        ]);
      } catch (err) {
        setError('Failed to load messages. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchCommunications, fetchTemplates, fetchLeads, fetchServiceStatus]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const name = `${conv.lead.firstName} ${conv.lead.lastName}`.toLowerCase();
    const email = conv.lead.email?.toLowerCase() || '';
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && conv.unreadCount > 0) ||
      conv.channel === filter;
    return matchesSearch && matchesFilter;
  });

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedConversation.leadId,
          type: selectedConversation.channel === 'sms' ? 'SMS' : 'EMAIL',
          body: messageInput,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setMessageInput('');
      await fetchCommunications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Send new message handler
  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.body.trim() || !newMessage.leadId) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: newMessage.leadId,
          type: newMessage.channel,
          subject: newMessage.subject || undefined,
          body: newMessage.body,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setShowNewMessageModal(false);
      setNewMessage({ leadId: '', channel: 'EMAIL', subject: '', body: '' });
      await fetchCommunications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Create template handler
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim() || !newTemplate.body.trim()) return;

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create template');
      }

      setShowNewTemplateModal(false);
      setNewTemplate({ name: '', subject: '', body: '', type: 'EMAIL', isDefault: false });
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  // Delete template handler
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  // Get messages for selected conversation
  const selectedMessages = selectedConversation?.communications.sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error-600" />
          <p className="text-error-700 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-error-600 hover:text-error-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Service Status Banner */}
      {serviceStatus && !serviceStatus.services.sms.configured && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning-600" />
          <p className="text-warning-700">
            SMS service is not configured. Set up Twilio credentials to enable SMS messaging.
          </p>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
          <p className="text-neutral-500">
            {conversations.filter((c) => c.unreadCount > 0).length} unread conversations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => {
              fetchCommunications();
              fetchTemplates();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => setShowTemplatesModal(true)}
          >
            Templates
          </Button>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowNewMessageModal(true)}
          >
            New Message
          </Button>
        </div>
      </div>

      {/* Messages Layout */}
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <div className="flex items-center gap-2 mt-3">
              {(['all', 'unread', 'email', 'sms'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                    filter === f
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Send a message to get started</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.leadId}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    'w-full px-4 py-3 text-left border-b border-neutral-100 hover:bg-neutral-50 transition-colors',
                    selectedConversation?.leadId === conv.leadId && 'bg-primary-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar name={`${conv.lead.firstName} ${conv.lead.lastName}`} size="sm" />
                      {conv.channel === 'sms' ? (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-2.5 h-2.5 text-white" />
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                          <Mail className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={cn(
                            'text-sm truncate',
                            conv.unreadCount > 0
                              ? 'font-semibold text-neutral-900'
                              : 'font-medium text-neutral-700'
                          )}
                        >
                          {conv.lead.firstName} {conv.lead.lastName}
                        </p>
                        <span className="text-xs text-neutral-400 flex-shrink-0">
                          {formatRelativeTime(new Date(conv.lastMessage.sentAt))}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-sm truncate',
                          conv.unreadCount > 0 ? 'text-neutral-900' : 'text-neutral-500'
                        )}
                      >
                        {conv.lastMessage.body}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${selectedConversation.lead.firstName} ${selectedConversation.lead.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {selectedConversation.lead.firstName} {selectedConversation.lead.lastName}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      {selectedConversation.lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {selectedConversation.lead.email}
                        </span>
                      )}
                      {selectedConversation.lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {selectedConversation.lead.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-neutral-100">
                    <Star className="w-5 h-5 text-neutral-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-neutral-100">
                    <Archive className="w-5 h-5 text-neutral-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-neutral-100">
                    <MoreVertical className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedMessages.length === 0 ? (
                  <div className="text-center text-neutral-500 py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  selectedMessages.map((message) => {
                    const isSent = message.userId !== undefined;
                    return (
                      <div
                        key={message.id}
                        className={cn('flex', isSent ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-2xl px-4 py-2',
                            isSent
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
                          )}
                        >
                          {message.subject && (
                            <p className={cn('text-xs font-medium mb-1', isSent ? 'text-primary-200' : 'text-neutral-500')}>
                              {message.subject}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                          <div
                            className={cn(
                              'flex items-center justify-end gap-1 mt-1',
                              isSent ? 'text-primary-200' : 'text-neutral-400'
                            )}
                          >
                            <span className="text-xs">
                              {new Date(message.sentAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            {isSent && (
                              message.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5" />
                              ) : message.status === 'sent' ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : message.status === 'failed' ? (
                                <AlertCircle className="w-3.5 h-3.5 text-error-300" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      rows={1}
                      className="resize-none pr-12"
                      disabled={isSending}
                    />
                    <button
                      type="button"
                      className="absolute right-3 bottom-3 p-1 text-neutral-400 hover:text-neutral-600"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                  </div>
                  <Button
                    type="submit"
                    leftIcon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    disabled={isSending || !messageInput.trim()}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowTemplatesModal(true)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Use template
                  </button>
                  <span className="text-neutral-300">|</span>
                  <span
                    className={cn(
                      'text-xs',
                      selectedConversation.channel === 'email'
                        ? 'text-primary-600 font-medium'
                        : 'text-neutral-400'
                    )}
                  >
                    Email
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      selectedConversation.channel === 'sms'
                        ? 'text-success-600 font-medium'
                        : 'text-neutral-400'
                    )}
                  >
                    SMS
                  </span>
                  {!serviceStatus?.services.sms.configured && selectedConversation.channel === 'sms' && (
                    <span className="text-xs text-warning-600 ml-2">
                      (SMS not configured)
                    </span>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <p className="text-lg">Select a conversation to view messages</p>
                <p className="text-sm mt-1">Or start a new conversation</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        title="Message Templates"
        size="lg"
      >
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>No templates yet</p>
              <p className="text-sm mt-1">Create your first template to get started</p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors group"
                onClick={() => {
                  setMessageInput(template.body);
                  setShowTemplatesModal(false);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-neutral-900">{template.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.type === 'EMAIL' ? 'primary' : 'success'}>
                      {template.type}
                    </Badge>
                    {template.isDefault && (
                      <Badge variant="neutral">Default</Badge>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-error-600 hover:text-error-700 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {template.subject && (
                  <p className="text-sm text-neutral-600 mb-1">
                    Subject: {template.subject}
                  </p>
                )}
                <p className="text-sm text-neutral-500 line-clamp-2">{template.body}</p>
              </div>
            ))
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowTemplatesModal(false)}>
            Close
          </Button>
          <Button onClick={() => {
            setShowTemplatesModal(false);
            setShowNewTemplateModal(true);
          }}>
            Create New Template
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Template Modal */}
      <Modal
        isOpen={showNewTemplateModal}
        onClose={() => setShowNewTemplateModal(false)}
        title="Create Template"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g., Welcome Email"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            required
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="templateType"
                value="EMAIL"
                checked={newTemplate.type === 'EMAIL'}
                onChange={() => setNewTemplate({ ...newTemplate, type: 'EMAIL' })}
                className="text-primary-600"
              />
              <span className="text-sm">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="templateType"
                value="SMS"
                checked={newTemplate.type === 'SMS'}
                onChange={() => setNewTemplate({ ...newTemplate, type: 'SMS' })}
                className="text-primary-600"
              />
              <span className="text-sm">SMS</span>
            </label>
          </div>
          {newTemplate.type === 'EMAIL' && (
            <Input
              label="Subject"
              placeholder="Email subject"
              value={newTemplate.subject}
              onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
            />
          )}
          <Textarea
            label="Message Body"
            placeholder="Type your template message... Use {{name}}, {{property}}, {{date}}, {{time}}, {{agent}} for placeholders"
            value={newTemplate.body}
            onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
            rows={6}
            required
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newTemplate.isDefault}
              onChange={(e) => setNewTemplate({ ...newTemplate, isDefault: e.target.checked })}
              className="text-primary-600"
            />
            <span className="text-sm">Set as default template for this type</span>
          </label>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowNewTemplateModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">Create Template</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* New Message Modal */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        title="New Message"
      >
        <form onSubmit={handleSendNewMessage} className="space-y-4">
          <Select
            label="To"
            placeholder="Select a lead..."
            value={newMessage.leadId}
            onChange={(e) => setNewMessage({ ...newMessage, leadId: e.target.value })}
            options={leads.map((lead) => ({
              value: lead.id,
              label: `${lead.firstName} ${lead.lastName}${lead.email ? ` - ${lead.email}` : ''}`,
            }))}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="channel"
                value="EMAIL"
                checked={newMessage.channel === 'EMAIL'}
                onChange={() => setNewMessage({ ...newMessage, channel: 'EMAIL' })}
                className="text-primary-600"
              />
              <span className="text-sm">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="channel"
                value="SMS"
                checked={newMessage.channel === 'SMS'}
                onChange={() => setNewMessage({ ...newMessage, channel: 'SMS' })}
                className="text-primary-600"
                disabled={!serviceStatus?.services.sms.configured}
              />
              <span className={cn('text-sm', !serviceStatus?.services.sms.configured && 'text-neutral-400')}>
                SMS {!serviceStatus?.services.sms.configured && '(not configured)'}
              </span>
            </label>
          </div>
          {newMessage.channel === 'EMAIL' && (
            <Input
              label="Subject"
              placeholder="Enter subject..."
              value={newMessage.subject}
              onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
            />
          )}
          <Textarea
            label="Message"
            placeholder="Type your message..."
            value={newMessage.body}
            onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
            rows={6}
          />
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowNewMessageModal(false)} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              leftIcon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              disabled={isSending || !newMessage.leadId || !newMessage.body.trim()}
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
