"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useRealtime } from "./SupabaseRealtimeContext";
import { getChatById, sendMessage as sendChatMessage, markMessagesAsRead, deleteMessage, addReaction as addReactionAction, removeReaction as removeReactionAction } from "@/actions/chat.action"; // Import your server actions

type Reaction = {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
};

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  deliveredAt?: Date | null;
  readAt?: Date | null;
  isDeleted?: boolean;
  deletedForUsers?: string[];
  replyToId?: string | null;
  reactions?: Reaction[];
  sender: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
      username: string;
    };
  } | null;
};

type Chat = {
  id: string;
  user1: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  user2: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  messages: Message[];
};

export function useChat(chatId: string) {
  const { user } = useAuth();
  const { supabase, isConnected, joinChat, leaveChat, sendMessage: emitMessage, deleteMessage: emitDeleteMessage, markMessagesAsRead: emitMarkAsRead, addReaction: emitAddReaction, removeReaction: emitRemoveReaction } = useRealtime();
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  // Fetch chat data
  const fetchChat = async () => {
    if (!user || !chatId) return;

    try {
      // Use your server action to get chat by ID
      const result = await getChatById(chatId, user.uid);

      if (result.success && result.chat) {
        // Ensure messages are sorted by createdAt ascending
        const chatData = result.chat as any;
        const sortedMessages = chatData.messages.sort((a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setChat({ ...chatData, messages: sortedMessages });

        // Get database user ID from chat data
        if (!dbUserId) {
          const userInChat = chatData.user1.id === user.uid || chatData.user2.id === user.uid;
          if (userInChat) {
            // Find which user in the chat matches the Firebase UID
            // This is a workaround - ideally we should have a proper mapping
            const currentUser = chatData.user1.id;
            setDbUserId(currentUser);
          }
        }
      } else {
        console.error("Failed to fetch chat:", result.error);
        setChat(null); // Clear chat if not found or error
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
      setChat(null); // Clear chat on unexpected error
    }
  };

  // Send message
  const sendMessage = async (content: string, replyToId?: string) => {
    if (!user || !chatId || isSending || !dbUserId) return { success: false, error: "User not authenticated or message already sending." };

    setIsSending(true);

    // Get current user info from chat
    const currentUserInfo = chat?.user1.id === dbUserId ? chat.user1 : chat?.user2;

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      content,
      createdAt: new Date(),
      status: 'SENT',
      deliveredAt: null,
      readAt: null,
      isDeleted: false,
      deletedForUsers: [],
      replyToId: replyToId || null,
      sender: {
        id: dbUserId, // Use database user ID instead of Firebase UID
        name: currentUserInfo?.name || user.displayName || null,
        username: currentUserInfo?.username || user.email?.split('@')[0] || 'user',
        image: currentUserInfo?.image || user.photoURL || null
      },
      replyTo: replyToId ? chat?.messages.find(msg => msg.id === replyToId)?.replyTo || null : null
    };

    // Optimistically update UI immediately
    setChat(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage]
      };
    });

    try {
      // Use your server action to send message
      const result = await sendChatMessage(chatId, content, user.uid, replyToId);

      if (result.success && result.message) {
        // Replace optimistic message with real message
        const newMessage: Message = {
          ...result.message,
          status: result.message.status as 'SENT' | 'DELIVERED' | 'READ',
          deliveredAt: result.message.deliveredAt,
          readAt: result.message.readAt
        };

        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === optimisticMessage.id ? newMessage : msg
            )
          };
        });

        // Emit the message via WebSocket to other users
        if (isConnected) {
          emitMessage(chatId, newMessage);
        }

        return { success: true, message: newMessage };
      } else {
        // Remove optimistic message on failure
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== optimisticMessage.id)
          };
        });
        return { success: false, error: result.error || "Failed to send message" };
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== optimisticMessage.id)
        };
      });
      return { success: false, error: "Failed to send message" };
    } finally {
      setIsSending(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user && chatId) {
      setIsLoading(true);
      fetchChat().finally(() => setIsLoading(false));
    }
  }, [user, chatId]);

  // Get database user ID
  useEffect(() => {
    const getDbId = async () => {
      if (user && !dbUserId) {
        const { getDbUserId } = await import('@/actions/user.action');
        const id = await getDbUserId(user.uid);
        setDbUserId(id);
      }
    };
    getDbId();
  }, [user, dbUserId]);

  // Supabase Realtime event listeners
  useEffect(() => {
    if (supabase && isConnected && chatId && dbUserId) {
      // Join the chat room with user ID
      joinChat(chatId, dbUserId);

      const channel = supabase.channel(`chat:${chatId}`);

      // Listen for new messages
      const handleNewMessage = (message: Message) => {
        setChat(prev => {
          if (!prev) return null;
          // Check if message already exists to prevent duplicates
          const messageExists = prev.messages.some(msg => msg.id === message.id);
          if (messageExists) return prev;

          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        });
      };

      // Listen for message deletions
      const handleMessageDeleted = (data: { messageId: string; deleteForEveryone: boolean }) => {
        setChat(prev => {
          if (!prev) return null;

          if (data.deleteForEveryone) {
            // Show dummy message for delete for everyone
            return {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === data.messageId
                  ? { ...msg, content: "This message was deleted", isDeleted: true }
                  : msg
              )
            };
          } else {
            // Remove message for delete for me
            return {
              ...prev,
              messages: prev.messages.filter(msg => msg.id !== data.messageId)
            };
          }
        });
      };

      // Listen for typing indicators
      const handleUserTyping = (data: { userId: string; username: string }) => {
        // Filter out current user's typing events using database user ID
        if (dbUserId && data.userId === dbUserId) return;

        setTypingUsers(prev => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      };

      const handleUserStoppedTyping = (data: { userId: string; username?: string }) => {
        setTypingUsers(prev => {
          // Remove by username if provided, otherwise try to match by userId
          if (data.username) {
            return prev.filter(username => username !== data.username);
          }
          return prev;
        });
      };

      // Listen for read receipts
      const handleMessagesRead = (data: { chatId: string; userId: string; messageIds: string[] }) => {
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg =>
              data.messageIds.includes(msg.id)
                ? { ...msg, status: 'READ' as const, readAt: new Date() }
                : msg
            )
          };
        });
      };

      // Listen for reactions
      const handleReactionAdded = (data: { messageId: string; reaction: any }) => {
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg => {
              if (msg.id === data.messageId) {
                const existingReactions = msg.reactions || [];
                // Check if this exact reaction already exists (by ID)
                const reactionExists = existingReactions.some(r => r.id === data.reaction.id);
                if (reactionExists) {
                  return msg; // Don't add duplicate
                }

                const userReactionIndex = existingReactions.findIndex(r => r.userId === data.reaction.userId && r.emoji === data.reaction.emoji);

                if (userReactionIndex >= 0) {
                  // Update existing reaction
                  const newReactions = [...existingReactions];
                  newReactions[userReactionIndex] = data.reaction;
                  return { ...msg, reactions: newReactions };
                } else {
                  // Add new reaction
                  return { ...msg, reactions: [...existingReactions, data.reaction] };
                }
              }
              return msg;
            })
          };
        });
      };

      const handleReactionRemoved = (data: { messageId: string; reactionId: string; userId: string }) => {
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg => {
              if (msg.id === data.messageId) {
                return {
                  ...msg,
                  reactions: (msg.reactions || []).filter(r => r.id !== data.reactionId)
                };
              }
              return msg;
            })
          };
        });
      };

      // Attach event listeners
      channel
        .on('broadcast', { event: 'new_message' }, ({ payload }: any) => handleNewMessage(payload.message))
        .on('broadcast', { event: 'delete_message' }, ({ payload }: any) => handleMessageDeleted(payload))
        .on('broadcast', { event: 'typing_start' }, ({ payload }: any) => handleUserTyping(payload))
        .on('broadcast', { event: 'typing_stop' }, ({ payload }: any) => handleUserStoppedTyping(payload))
        .on('broadcast', { event: 'messages_read' }, ({ payload }: any) => handleMessagesRead(payload))
        .on('broadcast', { event: 'add_reaction' }, ({ payload }: any) => handleReactionAdded(payload))
        .on('broadcast', { event: 'remove_reaction' }, ({ payload }: any) => handleReactionRemoved(payload))
        .subscribe();

      // Cleanup function
      return () => {
        channel.unsubscribe();
        leaveChat(chatId);
      };
    }
  }, [supabase, isConnected, chatId, dbUserId, joinChat, leaveChat]);

  // Delete message
  const deleteMessageById = async (messageId: string, deleteForEveryone: boolean = false) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      const result = await deleteMessage(messageId, user.uid, deleteForEveryone);

      if (result.success) {
        if (deleteForEveryone) {
          // For delete for everyone, show dummy message locally and remove from database
          setChat(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, content: "This message was deleted", isDeleted: true }
                  : msg
              )
            };
          });
        } else {
          // For delete for me, just remove from local state
          setChat(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.filter(msg => msg.id !== messageId)
            };
          });
        }

        // Emit deletion via WebSocket to other users ONLY for delete for everyone
        if (deleteForEveryone && isConnected && emitDeleteMessage) {
          emitDeleteMessage(chatId, messageId, deleteForEveryone);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || "Failed to delete message" };
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      return { success: false, error: "Failed to delete message" };
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    if (!user || !chatId || !chat) return;

    try {
      // Get unread message IDs
      const unreadMessageIds = chat.messages
        .filter(msg => msg.sender.id !== user.uid && msg.status !== 'READ')
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await markMessagesAsRead(chatId, user.uid);

        // Emit read receipt via WebSocket
        if (isConnected) {
          emitMarkAsRead(chatId, user.uid, unreadMessageIds);
        }

        // Update local state
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg =>
              unreadMessageIds.includes(msg.id)
                ? { ...msg, status: 'READ' as const, readAt: new Date() }
                : msg
            )
          };
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Add reaction to message
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      const result: any = await addReactionAction(messageId, emoji, user.uid);

      if (result.success && result.removed) {
        // Reaction was toggled off (removed)
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  reactions: (msg.reactions || []).filter(r => r.id !== result.reactionId)
                };
              }
              return msg;
            })
          };
        });

        // Emit reaction removal via Realtime
        if (isConnected) {
          emitRemoveReaction(chatId, messageId, result.reactionId, user.uid);
        }

        return { success: true };
      } else if (result.success && result.reaction) {
        // Update local state
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg => {
              if (msg.id === messageId) {
                const existingReactions = msg.reactions || [];
                const userReactionIndex = existingReactions.findIndex(r => r.userId === user.uid);

                if (userReactionIndex >= 0) {
                  // Update existing reaction
                  const newReactions = [...existingReactions];
                  newReactions[userReactionIndex] = result.reaction!;
                  return { ...msg, reactions: newReactions };
                } else {
                  // Add new reaction
                  return { ...msg, reactions: [...existingReactions, result.reaction!] };
                }
              }
              return msg;
            })
          };
        });

        // Emit reaction via Realtime
        if (isConnected) {
          emitAddReaction(chatId, messageId, result.reaction);
        }

        return { success: true };
      }
      return result;
    } catch (error) {
      console.error("Error adding reaction:", error);
      return { success: false, error: "Failed to add reaction" };
    }
  };

  // Remove reaction from message
  const removeReaction = async (reactionId: string, messageId: string) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      const result = await removeReactionAction(reactionId, user.uid);

      if (result.success) {
        // Update local state
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  reactions: (msg.reactions || []).filter(r => r.id !== reactionId)
                };
              }
              return msg;
            })
          };
        });

        // Emit reaction removal via WebSocket
        if (isConnected) {
          emitRemoveReaction(chatId, messageId, reactionId, user.uid);
        }

        return { success: true };
      }
      return result;
    } catch (error) {
      console.error("Error removing reaction:", error);
      return { success: false, error: "Failed to remove reaction" };
    }
  };

  return {
    chat,
    isLoading,
    isSending,
    sendMessage,
    deleteMessage: deleteMessageById,
    markAsRead,
    addReaction,
    removeReaction,
    typingUsers,
    refetch: fetchChat
  };
}
