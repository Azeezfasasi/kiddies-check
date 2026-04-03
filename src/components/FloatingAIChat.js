'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Loader2, X, MessageSquare } from 'lucide-react';

/**
 * FloatingAIChat Component
 * Minimizable floating chat widget that appears on all dashboard pages
 * Fetches real database context for accurate responses
 */
export default function FloatingAIChat({
  userRole = 'parent',
  studentData = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [token, setToken] = useState(null);
  const messagesEndRef = useRef(null);

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  // Fetch context data when token is available
  useEffect(() => {
    if (!token) {
      setContextLoading(false);
      return;
    }

    const fetchContext = async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };

        const response = await fetch('/api/ai/context', {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          setContextData(data);
        } else {
          console.error(
            `Failed to fetch AI context: ${response.status} ${response.statusText}`
          );
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          
          // If 401, token might be invalid - clear it
          if (response.status === 401) {
            console.warn('Token appears invalid, clearing from localStorage');
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI context:', error);
      } finally {
        setContextLoading(false);
      }
    };

    fetchContext();
  }, [token]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userRole,
          studentData,
          contextData, // Pass the full context data to the API
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage.content += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...assistantMessage };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 2}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expanded Chat View
  if (isOpen) {
    return (
      <div className="fixed bottom-4 right-4 w-full lg:w-96 h-[600px] bg-white rounded-lg border border-gray-200 shadow-2xl flex flex-col z-40">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Learning Assistant</h3>
              <p className="text-xs text-gray-600">
                {contextLoading ? 'Loading...' : contextData?.summary || 'Ask about learning'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 text-sm font-medium">
                {contextLoading ? 'Loading context...' : 'What would you like to know?'}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {contextData?.summary || 'Preparing AI context...'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-200 bg-white p-4 rounded-b-lg"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about students, performance..."
              disabled={isLoading || contextLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || contextLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-xs text-gray-600 text-center">
          <p>💡 Educational insights. For medical/psychological concerns, consult professionals.</p>
        </div>
      </div>
    );
  }

  // Minimized Ribbon Button
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group"
    >
      <MessageSquare className="w-5 h-5" />
      <span className="font-medium text-sm">
        {contextLoading ? 'Loading...' : contextData?.summary?.split(' - ')[0] || 'Learning Assistant'}
      </span>
      <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full group-hover:bg-opacity-30 transition-all">
        Click to open
      </span>
    </button>
  );
}
