"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, X, AlertCircle, Info, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SliderMassage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch("/api/slider-message");
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Failed to fetch slider messages:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  if (loading || messages.length === 0 || dismissed) {
    return null;
  }

  // Duplicate messages for seamless infinite scroll
  const duplicatedMessages = [...messages, ...messages, ...messages];

  // Pick the first message's colors as default, or fallback to theme
  const defaultBg = messages[0]?.bgColor || "#1e3a8a";
  const defaultText = messages[0]?.textColor || "#ffffff";

  return (
    <div
      className="relative w-full overflow-hidden z-[60]"
      style={{
        background: defaultBg,
        color: defaultText,
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss ticker"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Marquee container */}
      <div className="flex overflow-hidden py-2.5 sm:py-3">
        <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
          {duplicatedMessages.map((msg, index) => (
            <MessageItem key={`${msg._id}-${index}`} message={msg} />
          ))}
        </div>
        <div
          className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]"
          aria-hidden="true"
        >
          {duplicatedMessages.map((msg, index) => (
            <MessageItem key={`${msg._id}-dup-${index}`} message={msg} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageItem({ message }) {
  const IconComponent = getIconComponent(message.icon);

  const content = (
    <span className="inline-flex items-center gap-2 px-6 sm:px-8 text-sm sm:text-base font-medium">
      <IconComponent className="w-4 h-4 shrink-0 opacity-90" />
      <span>{message.text}</span>
      {message.link && (
        <span className="underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity">
          Learn more →
        </span>
      )}
    </span>
  );

  if (message.link) {
    return (
      <Link
        href={message.link}
        className="inline-flex items-center shrink-0 hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return <div className="inline-flex items-center shrink-0">{content}</div>;
}

function getIconComponent(iconName) {
  switch (iconName) {
    case "alert":
      return AlertCircle;
    case "info":
      return Info;
    case "check":
      return CheckCircle;
    case "megaphone":
      return Megaphone;
    default:
      return Megaphone;
  }
}

