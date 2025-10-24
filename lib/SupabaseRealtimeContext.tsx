"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import { getSocket } from './socket';
import type { Socket } from 'socket.io-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RealtimeContextType {
  supabase: any | null;
  isConnected: boolean;
  socket: typeof Socket | null;
  joinChat: (chatId: string, userId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, message: any) => void;
  deleteMessage: (chatId: string, messageId: string, deleteForEveryone: boolean) => void;
  startTyping: (chatId: string, userId: string, username: string) => void;
  stopTyping: (chatId: string, userId: string, username?: string) => void;
  markMessagesAsRead: (chatId: string, userId: string, messageIds: string[]) => void;
  addReaction: (chatId: string, messageId: string, reaction: any) => void;
  removeReaction: (chatId: string, messageId: string, reactionId: string, userId: string) => void;
  updateUnreadCount: (chatId: string, userId: string, count: number) => void;
  requestUserStatus: (userIds: string[]) => void;
  userStatuses: Record<string, { isOnline: boolean; lastSeen?: Date | null }>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [supabase, setSupabase] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map());
  const [userChannel, setUserChannel] = useState<RealtimeChannel | null>(null);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [userStatuses, setUserStatuses] = useState<Record<string, { isOnline: boolean; lastSeen?: Date | null }>>({});
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null);
  const [useSupabasePresence, setUseSupabasePresence] = useState(false);

  // Initialize Supabase client
  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      setSupabase(client);
      setIsConnected(true);
    }
  }, []);

  // Get database user ID
  useEffect(() => {
    const fetchDbUserId = async () => {
      if (user && !dbUserId) {
        try {
          const { getDbUserId } = await import('@/actions/user.action');
          const id = await getDbUserId(user.uid);
          setDbUserId(id);
        } catch (error) {
          console.error('Error fetching database user ID:', error);
        }
      }
    };
    fetchDbUserId();
  }, [user, dbUserId]);

  // Setup Socket.IO connection for real-time features
  useEffect(() => {
    if (user && dbUserId) {
      const socketInstance = getSocket();

      // Set a timeout to check if Socket.IO connects
      const connectionTimeout = setTimeout(() => {
        if (!socketInstance.connected) {
          setUseSupabasePresence(true);
        }
      }, 5000); // 5 second timeout

      const handleConnect = () => {
        clearTimeout(connectionTimeout);
        setUseSupabasePresence(false);
        socketInstance.emit('join', dbUserId);
      };

      const handleDisconnect = () => {
        // Socket disconnected
      };

      const handleConnectError = (error: any) => {
        console.error('Socket.IO connection error:', error);
        clearTimeout(connectionTimeout);
        setUseSupabasePresence(true);
      };

      if (!socketInstance.connected) {
        socketInstance.connect();
      } else {
        clearTimeout(connectionTimeout);
        socketInstance.emit('join', dbUserId);
      }

      // Listen for connection events
      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('connect_error', handleConnectError);

      // Listen for user status changes
      const handleUserStatusChanged = (data: { userId: string; isOnline: boolean; lastSeen: Date | null }) => {
        setUserStatuses(prev => ({
          ...prev,
          [data.userId]: {
            isOnline: data.isOnline,
            lastSeen: data.lastSeen ? new Date(data.lastSeen) : null
          }
        }));
      };

      // Listen for user status responses
      const handleUserStatuses = (statuses: Record<string, { isOnline: boolean; lastSeen: Date | null; userId: string }>) => {
        const newStatuses: Record<string, { isOnline: boolean; lastSeen?: Date | null }> = {};
        Object.values(statuses).forEach(status => {
          newStatuses[status.userId] = {
            isOnline: status.isOnline,
            lastSeen: status.lastSeen ? new Date(status.lastSeen) : null
          };
        });
        setUserStatuses(prev => ({ ...prev, ...newStatuses }));
      };

      socketInstance.on('user_status_changed', handleUserStatusChanged);
      socketInstance.on('user_statuses', handleUserStatuses);

      setSocket(socketInstance);

      return () => {
        clearTimeout(connectionTimeout);
        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
        socketInstance.off('connect_error', handleConnectError);
        socketInstance.off('user_status_changed', handleUserStatusChanged);
        socketInstance.off('user_statuses', handleUserStatuses);
      };
    }
  }, [user, dbUserId]);

  // Setup user-specific channel for notifications
  useEffect(() => {
    if (supabase && user && isConnected) {
      const channel = supabase.channel(`user:${user.uid}`);

      channel.subscribe();

      setUserChannel(channel);

      return () => {
        channel.unsubscribe();
        setUserChannel(null);
      };
    }
  }, [supabase, user, isConnected]);

  // Setup Supabase Presence for online status (fallback for Vercel/serverless)
  useEffect(() => {
    if (supabase && dbUserId && useSupabasePresence) {
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: dbUserId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();

          // Update user statuses based on presence
          const newStatuses: Record<string, { isOnline: boolean; lastSeen?: Date | null }> = {};
          Object.keys(state).forEach(userId => {
            newStatuses[userId] = {
              isOnline: true,
              lastSeen: null
            };
          });
          setUserStatuses(newStatuses);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          setUserStatuses(prev => ({
            ...prev,
            [key]: { isOnline: true, lastSeen: null }
          }));
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          setUserStatuses(prev => ({
            ...prev,
            [key]: { isOnline: false, lastSeen: new Date() }
          }));
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Track this user as online
            await channel.track({
              user_id: dbUserId,
              online_at: new Date().toISOString(),
            });
          }
        });

      setPresenceChannel(channel);

      return () => {
        channel.unsubscribe();
        setPresenceChannel(null);
      };
    }
  }, [supabase, dbUserId, useSupabasePresence]);

  const joinChat = useCallback((chatId: string, userId: string) => {
    if (!supabase || !user) return;

    // Check if already subscribed to this chat
    if (channels.has(chatId)) {
      return;
    }

    const channel = supabase.channel(`chat:${chatId}`);

    channel.subscribe();

    setChannels(prev => new Map(prev).set(chatId, channel));

    // Also join via Socket.IO
    if (socket && socket.connected) {
      socket.emit('join_chat', { chatId, userId });
    }
  }, [supabase, user, channels, socket]);

  const leaveChat = useCallback((chatId: string) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.unsubscribe();
      setChannels(prev => {
        const newMap = new Map(prev);
        newMap.delete(chatId);
        return newMap;
      });
    }

    // Also leave via Socket.IO
    if (socket && socket.connected) {
      socket.emit('leave_chat', chatId);
    }
  }, [channels, socket]);

  const sendMessage = useCallback((chatId: string, message: any) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { message },
      });
    }
  }, [channels]);

  const deleteMessage = useCallback((chatId: string, messageId: string, deleteForEveryone: boolean) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'delete_message',
        payload: { messageId, deleteForEveryone },
      });
    }
  }, [channels]);

  const startTyping = useCallback((chatId: string, userId: string, username: string) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: { userId, username },
      });
    }
  }, [channels]);

  const stopTyping = useCallback((chatId: string, userId: string, username?: string) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: { userId, username },
      });
    }
  }, [channels]);

  const markMessagesAsRead = useCallback((chatId: string, userId: string, messageIds: string[]) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'messages_read',
        payload: { chatId, userId, messageIds },
      });
    }
  }, [channels]);

  const addReaction = useCallback((chatId: string, messageId: string, reaction: any) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'add_reaction',
        payload: { messageId, reaction },
      });
    }
  }, [channels]);

  const removeReaction = useCallback((chatId: string, messageId: string, reactionId: string, userId: string) => {
    const channel = channels.get(chatId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'remove_reaction',
        payload: { messageId, reactionId, userId },
      });
    }
  }, [channels]);

  const updateUnreadCount = useCallback((chatId: string, userId: string, count: number) => {
    if (userChannel) {
      userChannel.send({
        type: 'broadcast',
        event: 'unread_count_updated',
        payload: { chatId, userId, count },
      });
    }
  }, [userChannel]);

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      channels.forEach(channel => channel.unsubscribe());
      if (userChannel) {
        userChannel.unsubscribe();
      }
    };
  }, []);

  const requestUserStatus = useCallback((userIds: string[]) => {
    if (useSupabasePresence && presenceChannel) {
      // When using Supabase Presence, users are automatically tracked
      // Just check current presence state
      const state = presenceChannel.presenceState();
      const newStatuses: Record<string, { isOnline: boolean; lastSeen?: Date | null }> = {};

      userIds.forEach(userId => {
        newStatuses[userId] = {
          isOnline: !!state[userId],
          lastSeen: state[userId] ? null : new Date()
        };
      });

      setUserStatuses(prev => ({ ...prev, ...newStatuses }));
    } else if (socket && socket.connected) {
      socket.emit('request_user_status', { userIds });
    }
  }, [socket, useSupabasePresence, presenceChannel]);

  const value: RealtimeContextType = {
    supabase,
    isConnected,
    socket,
    joinChat,
    leaveChat,
    sendMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    addReaction,
    removeReaction,
    updateUnreadCount,
    requestUserStatus,
    userStatuses,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
