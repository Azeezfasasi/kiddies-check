'use client';

import React, { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function Toast({ message, type = 'info', duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 px-4 py-3 rounded-lg border flex items-center space-x-3 animate-in slide-in-from-top-2 duration-200 ${getStyles()}`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return { toasts, addToast };
}
