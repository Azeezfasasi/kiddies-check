'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ChatMarkdown from '@/components/ChatMarkdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

interface Welcome {
  greeting: string;
  suggestions: string[];
  roleLabel?: string;
  school?: string | null;
}

// Kept for the dashboard layout's existing props; data now comes from the server.
interface FloatingAIChatProps {
  userRole?: string;
  studentData?: unknown;
}

const readActiveSchool = () => {
  try {
    return localStorage.getItem('activeSchoolId') || localStorage.getItem('schoolId') || '';
  } catch {
    return '';
  }
};

/**
 * KiddiesCheck Assistant: floating chat on every dashboard page. The server
 * looks up data through permission-filtered tools, so the widget only sends
 * the conversation and the currently selected school.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- props kept for the layout's existing call
export default function FloatingAIChat(_props: FloatingAIChatProps) {
  const { user } = useAuth();
  const storageKey = user?._id ? `kc_ai_chat_${user._id}` : null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcome, setWelcome] = useState<Welcome | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore this user's conversation for the browser session.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      // Storage full or unavailable: the chat still works, it just won't persist.
    }
  }, [messages, storageKey]);

  // Greeting and suggestions, loaded the first time the chat opens.
  useEffect(() => {
    if (!isOpen || welcome) return;
    const school = readActiveSchool();
    fetch(`/api/ai/chat${school ? `?activeSchoolId=${encodeURIComponent(school)}` : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setWelcome(data))
      .catch(() => setWelcome({ greeting: "Hi! I'm your KiddiesCheck Assistant. How can I help?", suggestions: [] }));
  }, [isOpen, welcome]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isLoading) return;

      const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content };
      const history = [...messages.filter((m) => !m.error), userMessage];
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map(({ role, content: c }) => ({ role, content: c })),
            activeSchoolId: readActiveSchool() || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            response.status === 401
              ? 'Your session has expired. Please log in again.'
              : data.error || 'The assistant is unavailable right now.'
          );
        }

        const reply = await response.text();
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: 'assistant', content: error.message || 'Something went wrong. Please try again.', error: true },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-indigo-600 to-blue-600 text-white pl-4 pr-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        aria-label="Open KiddiesCheck Assistant"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-semibold">Ask AI</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[420px] sm:h-[640px] sm:max-h-[calc(100vh-2rem)] bg-white sm:rounded-2xl border border-gray-200 shadow-2xl flex flex-col z-50"
      role="dialog"
      aria-label="KiddiesCheck Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-blue-600 text-white sm:rounded-t-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight">KiddiesCheck Assistant</h3>
            <p className="text-xs text-indigo-100 truncate">
              {[welcome?.roleLabel, welcome?.school].filter(Boolean).join(' · ') || 'Ask about your school data'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={newChat} title="New chat" aria-label="New chat" className="p-2 rounded-lg hover:bg-white/15 transition">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsOpen(false)} title="Close" aria-label="Close" className="p-2 rounded-lg hover:bg-white/15 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-sm">
                {welcome ? welcome.greeting : <span className="text-gray-400">Getting ready…</span>}
              </div>
            </div>
            {welcome?.suggestions?.length ? (
              <div className="mt-5">
                <p className="text-xs font-medium text-gray-500 mb-2 px-1">Try asking</p>
                <div className="flex flex-col gap-2">
                  {welcome.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm px-3 py-2 rounded-xl border border-indigo-100 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm ${
                    m.error ? 'bg-red-50 border border-red-200 text-red-700 text-sm' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {m.error ? m.content : <ChatMarkdown text={m.content} />}
                </div>
              </div>
            )
          )
        )}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-gray-500 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              Looking into that…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-gray-100 bg-white p-3 sm:rounded-b-2xl"
      >
        <div className="flex items-end gap-2 rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your school…"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none bg-transparent text-sm focus:outline-none max-h-32"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send"
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 transition shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 text-center">
          AI answers can be wrong. For medical or safeguarding concerns, contact the school or a professional.
        </p>
      </form>
    </div>
  );
}
