'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  rows?: number;
  submitLabel?: string;
}

export default function MentionsInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Escreva algo...',
  rows = 2,
  submitLabel = 'Enviar',
}: Props) {
  const [mentionResults, setMentionResults] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionResults.length]);

  const handleChange = async (newValue: string) => {
    onChange(newValue);
    const match = newValue.match(/@(\w*)$/);
    if (match) {
      try {
        const { data } = await api.get(`/api/users/search?q=${match[1]}`);
        setMentionResults(data);
      } catch {
        setMentionResults([]);
      }
    } else {
      setMentionResults([]);
    }
  };

  const insertMention = (user: User) => {
    const atIndex = value.lastIndexOf('@');
    const before = value.slice(0, atIndex);
    onChange(`${before}@${user.username} `);
    setMentionResults([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, mentionResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (selectedIndex >= 0 && selectedIndex < mentionResults.length) {
          e.preventDefault();
          insertMention(mentionResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setMentionResults([]);
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && mentionResults.length === 0) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
        rows={rows}
      />
      {mentionResults.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 shadow-lg max-h-32 overflow-y-auto z-10">
          {mentionResults.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onClick={() => insertMention(u)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${i === selectedIndex ? 'bg-gray-100 dark:bg-slate-600' : 'hover:bg-gray-100 dark:hover:bg-slate-600'}`}
            >
              <div className="w-6 h-6 rounded-full bg-primary-400 flex items-center justify-center text-white text-[10px] font-medium">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <span>@{u.username}</span>
              <span className="text-xs text-gray-400">{u.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <div />
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
