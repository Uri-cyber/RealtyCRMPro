'use client';

import React, { useState } from 'react';
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
  Trash2,
  Reply,
  Forward,
  Clock,
  Check,
  CheckCheck,
  Plus,
  FileText,
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

// Mock conversations data
const conversations = [
  {
    id: '1',
    contact: {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '(512) 555-1234',
    },
    lastMessage: 'That sounds great! I can make it at 2pm tomorrow.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    unread: 2,
    channel: 'email',
    property: '123 Main St',
  },
  {
    id: '2',
    contact: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '(512) 555-5678',
    },
    lastMessage: 'Can you send me more photos of the kitchen?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: 0,
    channel: 'sms',
    property: '456 Oak Ave',
  },
  {
    id: '3',
    contact: {
      name: 'Mike Thompson',
      email: 'mike@example.com',
      phone: '(512) 555-9012',
    },
    lastMessage: 'Thanks for the offer details, I will review them tonight.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5),
    unread: 0,
    channel: 'email',
    property: '789 Elm Dr',
  },
  {
    id: '4',
    contact: {
      name: 'Emily Davis',
      email: 'emily@example.com',
      phone: '(512) 555-3456',
    },
    lastMessage: 'Is the property still available?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unread: 1,
    channel: 'email',
    property: '123 Main St',
  },
  {
    id: '5',
    contact: {
      name: 'Robert Wilson',
      email: 'robert@example.com',
      phone: '(512) 555-7890',
    },
    lastMessage: 'What is the HOA fee for this property?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
    unread: 0,
    channel: 'sms',
    property: '321 Pine Rd',
  },
];

// Mock messages for selected conversation
const mockMessages = [
  {
    id: '1',
    type: 'received',
    content: 'Hi, I saw your listing for 123 Main St and I\'m very interested!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
  {
    id: '2',
    type: 'sent',
    content:
      'Hello John! Thank you for your interest. The property is still available. Would you like to schedule a showing?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23),
    read: true,
    delivered: true,
  },
  {
    id: '3',
    type: 'received',
    content: 'Yes, that would be great! When are you available?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
    read: true,
  },
  {
    id: '4',
    type: 'sent',
    content:
      'I have availability tomorrow at 2pm or Friday at 10am. Which works better for you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
    delivered: true,
  },
  {
    id: '5',
    type: 'received',
    content: 'That sounds great! I can make it at 2pm tomorrow.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
];

// Message templates
const templates = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Thank you for your interest!',
    body: 'Hi {{name}},\n\nThank you for your interest in {{property}}. I would be happy to schedule a showing at your convenience.\n\nBest regards,\n{{agent}}',
    type: 'email',
  },
  {
    id: '2',
    name: 'Showing Confirmation',
    subject: 'Showing Confirmed',
    body: 'Hi {{name}},\n\nThis is to confirm your showing at {{property}} on {{date}} at {{time}}.\n\nSee you there!\n{{agent}}',
    type: 'email',
  },
  {
    id: '3',
    name: 'Follow-up',
    subject: 'Following up on {{property}}',
    body: 'Hi {{name}},\n\nI wanted to follow up after your showing at {{property}}. Do you have any questions or would you like to schedule a second viewing?\n\nBest,\n{{agent}}',
    type: 'email',
  },
  {
    id: '4',
    name: 'Quick SMS - Available?',
    subject: '',
    body: 'Hi {{name}}, just checking if you\'re still interested in {{property}}. Let me know if you\'d like to schedule a showing!',
    type: 'sms',
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'email' | 'sms'>('all');

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && conv.unread > 0) ||
      conv.channel === filter;
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    // Handle sending message
    setMessageInput('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
          <p className="text-neutral-500">
            {conversations.filter((c) => c.unread > 0).length} unread conversations
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  'w-full px-4 py-3 text-left border-b border-neutral-100 hover:bg-neutral-50 transition-colors',
                  selectedConversation?.id === conv.id && 'bg-primary-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar name={conv.contact.name} size="sm" />
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
                          conv.unread > 0
                            ? 'font-semibold text-neutral-900'
                            : 'font-medium text-neutral-700'
                        )}
                      >
                        {conv.contact.name}
                      </p>
                      <span className="text-xs text-neutral-400 flex-shrink-0">
                        {formatRelativeTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-1">{conv.property}</p>
                    <p
                      className={cn(
                        'text-sm truncate',
                        conv.unread > 0 ? 'text-neutral-900' : 'text-neutral-500'
                      )}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedConversation.contact.name} size="md" />
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {selectedConversation.contact.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedConversation.contact.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {selectedConversation.contact.phone}
                      </span>
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
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.type === 'sent' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2',
                        message.type === 'sent'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div
                        className={cn(
                          'flex items-center justify-end gap-1 mt-1',
                          message.type === 'sent'
                            ? 'text-primary-200'
                            : 'text-neutral-400'
                        )}
                      >
                        <span className="text-xs">
                          {message.timestamp.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        {message.type === 'sent' && (
                          message.delivered ? (
                            <CheckCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                    />
                    <button
                      type="button"
                      className="absolute right-3 bottom-3 p-1 text-neutral-400 hover:text-neutral-600"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                  </div>
                  <Button type="submit" leftIcon={<Send className="w-4 h-4" />}>
                    Send
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
                  <button
                    type="button"
                    className={cn(
                      'text-xs',
                      selectedConversation.channel === 'email'
                        ? 'text-primary-600'
                        : 'text-neutral-400'
                    )}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'text-xs',
                      selectedConversation.channel === 'sms'
                        ? 'text-success-600'
                        : 'text-neutral-400'
                    )}
                  >
                    SMS
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              <p>Select a conversation to view messages</p>
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
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors"
              onClick={() => {
                setMessageInput(template.body);
                setShowTemplatesModal(false);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-neutral-900">{template.name}</p>
                <Badge variant={template.type === 'email' ? 'primary' : 'success'}>
                  {template.type.toUpperCase()}
                </Badge>
              </div>
              {template.subject && (
                <p className="text-sm text-neutral-600 mb-1">
                  Subject: {template.subject}
                </p>
              )}
              <p className="text-sm text-neutral-500 line-clamp-2">{template.body}</p>
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowTemplatesModal(false)}>
            Close
          </Button>
          <Button>Create New Template</Button>
        </ModalFooter>
      </Modal>

      {/* New Message Modal */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        title="New Message"
      >
        <form className="space-y-4">
          <Select
            label="To"
            placeholder="Select a lead..."
            options={conversations.map((c) => ({
              value: c.id,
              label: `${c.contact.name} - ${c.contact.email}`,
            }))}
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="channel"
                value="email"
                defaultChecked
                className="text-primary-600"
              />
              <span className="text-sm">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="channel" value="sms" className="text-primary-600" />
              <span className="text-sm">SMS</span>
            </label>
          </div>
          <Input label="Subject" placeholder="Enter subject..." />
          <Textarea label="Message" placeholder="Type your message..." rows={6} />
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowNewMessageModal(false)}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={<Send className="w-4 h-4" />}>
              Send Message
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
