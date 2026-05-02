// hooks/useChat.ts
// Fixes: chat messages not syncing via Socket.io

import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../service/socket';

// ── Types ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isOwn?: boolean;
}

export interface TypingUser {
  socketId: string;
  name: string;
}

interface UseChatOptions {
  roomId: string;
  userId: string;
  userName: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  unreadCount: number;
  isChatOpen: boolean;
  sendMessage: (text: string) => void;
  handleTyping: () => void;
  openChat: () => void;
  closeChat: () => void;
}

export function useChat({ roomId, userId, userName }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('chat-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (!isChatOpen && msg.senderId !== userId) {
        setUnreadCount(c => c + 1);
      }
    });

    socket.on('user-typing', ({ name, socketId }: { name: string; socketId: string }) => {
      setTypingUsers(prev =>
        prev.find(u => u.socketId === socketId)
          ? prev
          : [...prev, { name, socketId }]
      );
    });

    socket.on('user-stopped-typing', ({ socketId }: { socketId: string }) => {
      setTypingUsers(prev => prev.filter(u => u.socketId !== socketId));
    });

    return () => {
      socket.off('chat-history');
      socket.off('chat-message');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
    };
  }, [roomId, userId, isChatOpen]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      roomId,
      senderId: userId,
      senderName: userName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, { ...msg, isOwn: true }]);
    socket.emit('chat-message', msg);
    socket.emit('stopped-typing', { roomId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [roomId, userId, userName]);

  const handleTyping = useCallback(() => {
    socket.emit('typing', { roomId, name: userName });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stopped-typing', { roomId });
    }, 2000);
  }, [roomId, userName]);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => setIsChatOpen(false), []);

  return {
    messages,
    typingUsers,
    unreadCount,
    isChatOpen,
    sendMessage,
    handleTyping,
    openChat,
    closeChat,
  };
}
