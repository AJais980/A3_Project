"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useChat } from "@/lib/useChat";
import { useRealtime } from "@/lib/SupabaseRealtimeContext";
import { getChatsForUser, deleteChat } from "@/actions/chat.action";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow, format, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { IconArrowLeft, IconSend, IconUser, IconMessageCircle, IconPhone, IconVideo, IconDotsVertical, IconCheck, IconChecks, IconMoodSmile } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { getDbUserId } from "@/actions/user.action";
import { ChatContextMenu } from "@/components/chat/ChatContextMenu";
import { MessageContextMenu } from "@/components/chat/MessageContextMenu";
import { MessageStatus } from "@/components/chat/MessageStatus";
import { ScrollToBottomButton } from "@/components/chat/ScrollToBottomButton";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { ReplyPreview } from "@/components/chat/ReplyPreview";
import { ReactionPicker } from "@/components/chat/ReactionPicker";
import { MessageReactions } from "@/components/chat/MessageReactions";
import { OnlineStatus } from "@/components/chat/OnlineStatus";
import { UnreadBadge } from "@/components/chat/UnreadBadge";
import { SearchBar } from "@/components/chat/SearchBar";
import { EmojiPicker } from "@/components/chat/EmojiPicker";

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
  user1Id?: string;
  user2Id?: string;
  user1UnreadCount?: number;
  user2UnreadCount?: number;
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
  updatedAt?: Date;
};

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const unwrappedParams = React.use(params); // Unwrap the promise
  const chatId = unwrappedParams.chatId;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { supabase, startTyping, stopTyping, requestUserStatus, userStatuses: globalUserStatuses, socket } = useRealtime();

  // Hook for chat data
  const { chat, isLoading, isSending, sendMessage, deleteMessage, markAsRead, addReaction, removeReaction, typingUsers } = useChat(chatId);

  // State for the message input and sidebar
  const [messageInput, setMessageInput] = React.useState("");
  const [allChats, setAllChats] = React.useState<Chat[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const [dbUserId, setDbUserId] = React.useState<string | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);
  const [isInChatView, setIsInChatView] = React.useState(true);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [authLoading, user, router]);

  // Fetch current user's database ID and all chats
  const fetchAllChats = React.useCallback(async () => {
    if (user) {
      const result = await getChatsForUser(user.uid);
      if (result.success && result.chats) {
        const sortedChats = result.chats.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setAllChats(sortedChats);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const id = await getDbUserId(user.uid);
        setDbUserId(id);
        await fetchAllChats();
      }
    };
    fetchData();
  }, [user, fetchAllChats]);

  // Request user status when chat loads
  useEffect(() => {
    if (chat && dbUserId && requestUserStatus) {
      const otherUser = chat.user1.id === dbUserId ? chat.user2 : chat.user1;
      requestUserStatus([otherUser.id]);
    }
  }, [chat, dbUserId, requestUserStatus]);

  // Auto-scroll to bottom on initial load only
  useEffect(() => {
    if (chat?.messages && chat.messages.length > 0 && !hasScrolledToBottom) {
      // Directly scroll the container to the bottom with multiple attempts
      const scrollToBottom = () => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight;
        }
      };

      // Multiple attempts at different intervals to ensure scroll happens
      scrollToBottom(); // Immediate
      const timer1 = setTimeout(scrollToBottom, 100);
      const timer2 = setTimeout(scrollToBottom, 300);
      const timer3 = setTimeout(() => {
        scrollToBottom();
        setHasScrolledToBottom(true);
      }, 500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [chat?.messages, hasScrolledToBottom]);

  // Auto-scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    if (messagesContainerRef.current && hasScrolledToBottom && chat?.messages) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

      if (isNearBottom) {
        const timer = setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [chat?.messages?.length, hasScrolledToBottom]);

  // Mark messages as read when user is actively viewing the chat
  useEffect(() => {
    if (chat && user && dbUserId && isInChatView) {
      // Mark as read when user is viewing the chat (even without scrolling to bottom)
      const unreadMessages = chat.messages.filter(
        msg => msg.sender.id !== dbUserId && msg.status !== 'READ'
      );

      if (unreadMessages.length > 0) {
        // Add a small delay to ensure user is actually viewing
        const timer = setTimeout(() => {
          markAsRead();
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [chat?.messages?.length, user, dbUserId, isInChatView, markAsRead]);

  // Track when user leaves/enters the chat view
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsInChatView(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen for unread count updates via Socket.IO
  useEffect(() => {
    if (socket && dbUserId) {
      const handleUnreadCountUpdated = () => {
        // Refresh chat list when unread count changes
        fetchAllChats();
      };

      socket.on('unread_count_updated', handleUnreadCountUpdated);

      return () => {
        socket.off('unread_count_updated', handleUnreadCountUpdated);
      };
    }
  }, [socket, dbUserId, fetchAllChats]);

  // Listen for unread count updates and refresh chat list
  useEffect(() => {
    if (supabase && dbUserId) {
      const channel = supabase.channel(`user:${dbUserId}`);

      channel
        .on('broadcast', { event: 'unread_count_updated' }, ({ payload }: any) => {
          fetchAllChats();
        })
        .on('broadcast', { event: 'new_message' }, ({ payload }: any) => {
          fetchAllChats();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [supabase, dbUserId, fetchAllChats]);

  // Handle scroll to show/hide scroll button
  const handleScroll = (e: any) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Show button if scrolled more than 200px from bottom
      setShowScrollButton(distanceFromBottom > 200);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending || !user || !chat) return;

    // Store message content and clear input immediately for better UX
    const messageContent = messageInput.trim();
    const replyToId = replyTo?.id;

    setMessageInput("");
    if (replyTo) {
      setReplyTo(null);
    }

    // Stop typing indicator immediately when sending
    if (isTyping && user && dbUserId) {
      setIsTyping(false);
      stopTyping(chatId, dbUserId, user.displayName || user.email || 'Anonymous');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    const result = await sendMessage(messageContent, replyToId);
    if (!result.success) {
      // If sending failed, restore the message content
      setMessageInput(messageContent);
      if (replyToId) {
        // Try to restore reply context if possible
        const replyMessage = chat.messages.find(msg => msg.id === replyToId);
        if (replyMessage) {
          setReplyTo(replyMessage);
        }
      }
      toast.error(result.error || "Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      const result = await deleteChat(chatId, user.uid);
      if (result.success) {
        setAllChats(allChats.filter(chat => chat.id !== chatId));
        toast.success("Chat deleted successfully");
        if (chatId === chat?.id) {
          router.push("/conversations");
        }
      } else {
        toast.error(result.error || "Failed to delete chat");
      }
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean = false) => {
    try {
      const result = await deleteMessage(messageId, deleteForEveryone);
      if (result.success) {
        toast.success(deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you");
      } else {
        toast.error(result.error || "Failed to delete message");
      }
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const formatMessageTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    return !isSameDay(new Date(currentMsg.createdAt), new Date(prevMsg.createdAt));
  };

  const getOtherUser = (currentChat: Chat) => {
    if (!dbUserId) return null;
    return currentChat.user1.id === dbUserId ? currentChat.user2 : currentChat.user1;
  };

  const getLastMessage = (chatItem: Chat) => {
    return chatItem.messages.length > 0 ? chatItem.messages[0] : null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Handle typing indicators with debouncing
    if (value.trim() && user && dbUserId) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(chatId, dbUserId, user.displayName || user.email || 'Anonymous');
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing (reduced from 2000ms to 1500ms for better UX)
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping && user && dbUserId) {
          setIsTyping(false);
          stopTyping(chatId, dbUserId, user.displayName || user.email || 'Anonymous');
        }
      }, 1500);
    } else if (!value.trim() && isTyping && user && dbUserId) {
      // If input is empty, stop typing immediately
      setIsTyping(false);
      stopTyping(chatId, dbUserId, user.displayName || user.email || 'Anonymous');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    const result = await addReaction(messageId, emoji);
    if (!result.success) {
      toast.error((result as any).error || "Failed to add reaction");
    }
    setShowReactionPicker(null);
  };

  const handleRemoveReaction = async (reaction: Reaction, messageId: string) => {
    if (reaction.userId === dbUserId) {
      const result = await removeReaction(reaction.id, messageId);
      if (!result.success) {
        toast.error((result as any).error || "Failed to remove reaction");
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  // Filter chats based on search query
  const filteredChats = allChats.filter(chatItem => {
    const otherUserInList = getOtherUser(chatItem);
    if (!otherUserInList) return false;

    const searchLower = searchQuery.toLowerCase();
    return (
      otherUserInList.name?.toLowerCase().includes(searchLower) ||
      otherUserInList.username.toLowerCase().includes(searchLower)
    );
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="w-16 h-16 border-4 border-gray-800 border-t-purple-600 rounded-full animate-spin"></div>
            {/* Inner pulsing circle */}
            <div className="absolute inset-0 m-auto w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-medium">Loading chat...</p>
            <p className="text-gray-400 text-sm mt-1">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !dbUserId) {
    // Silent redirect, no message shown
    if (!authLoading && !user) {
      return null; // Return null instead of showing redirect message
    }
    // Still loading dbUserId
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 m-auto w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-medium">Loading...</p>
            <p className="text-gray-400 text-sm mt-1">Setting up your chat</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <IconMessageCircle className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white text-xl font-semibold mb-2">Chat not found</p>
          <p className="text-gray-400 mb-6">This conversation doesn't exist or has been deleted.</p>
          <Button
            onClick={() => router.push("/conversations")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Back to Conversations
          </Button>
        </div>
      </div>
    );
  }

  const otherUser = getOtherUser(chat);

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <IconUser className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white text-xl font-semibold mb-2">User not found</p>
          <p className="text-gray-400 mb-6">Unable to load the other user in this chat.</p>
          <Button
            onClick={() => router.push("/conversations")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Back to Conversations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className="hidden lg:flex lg:w-80 border-r border-gray-800 bg-gray-900 flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Messages</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/conversations")}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <IconArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-800">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search conversations..."
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto chat-scrollbar">
          {filteredChats.map((chatItem) => {
            const otherUserInList = getOtherUser(chatItem);
            const lastMessage = getLastMessage(chatItem);
            const isActive = chatItem.id === chatId;

            if (!otherUserInList) return null;

            return (
              <ChatContextMenu
                key={chatItem.id}
                onDelete={() => handleDeleteChat(chatItem.id)}
              >
                <div
                  className={`border-b border-gray-800 cursor-pointer transition-all ${isActive ? "bg-gray-800/50 border-l-4 border-l-purple-500" : "hover:bg-gray-800/30"
                    }`}
                  onClick={() => router.push(`/conversations/${chatItem.id}`)}
                >
                  <div className="p-4 flex items-center space-x-3">
                    <Avatar className="w-12 h-12 flex-shrink-0 ring-2 ring-gray-700">
                      <AvatarImage
                        src={otherUserInList.image || "/avatar.png"}
                        alt={otherUserInList.name || otherUserInList.username}
                      />
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate text-sm">
                          {otherUserInList.name || otherUserInList.username}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {chatItem.updatedAt ? formatDistanceToNow(new Date(chatItem.updatedAt), { addSuffix: false }) : 'now'}
                        </span>
                      </div>

                      {lastMessage ? (
                        <p className="text-sm text-gray-400 truncate">
                          {lastMessage.sender.id === dbUserId ? (
                            <span className="text-gray-500">You: </span>
                          ) : null}
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No messages yet
                        </p>
                      )}
                    </div>

                    {/* Unread badge - only show if not the active chat */}
                    {!isActive && chatItem.user1Id && chatItem.user2Id && (
                      <UnreadBadge count={chatItem.user1Id === dbUserId ? (chatItem.user1UnreadCount || 0) : (chatItem.user2UnreadCount || 0)} />
                    )}
                  </div>
                </div>
              </ChatContextMenu>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Chat Header */}
        <div className="border-b border-gray-800 bg-gray-900 px-4 md:px-6 py-4 flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/conversations")}
                className="text-gray-400 hover:text-white lg:hidden flex-shrink-0 p-2 hover:bg-gray-800"
              >
                <IconArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-11 h-11 flex-shrink-0 ring-2 ring-purple-500/30">
                <AvatarImage
                  src={otherUser?.image || "/avatar.png"}
                  alt={otherUser?.name || otherUser?.username || "User"}
                />
              </Avatar>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-white truncate">
                  {otherUser?.name || otherUser?.username}
                </h1>
                <OnlineStatus
                  isOnline={globalUserStatuses[otherUser?.id]?.isOnline || false}
                  lastSeen={globalUserStatuses[otherUser?.id]?.lastSeen}
                  showText={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-gray-950 min-h-0 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth p-4 md:p-6 chat-scrollbar"
          >
            <div className="max-w-4xl mx-auto space-y-1">
              {chat.messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center h-full py-20 text-center"
                >
                  <motion.div
                    className="w-32 h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center mb-6 relative"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-full blur-xl" />
                    <IconMessageCircle className="w-16 h-16 text-purple-500 relative z-10" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Start the conversation
                  </h3>
                  <p className="text-gray-400 max-w-sm text-base">
                    Send your first message to <span className="text-purple-400 font-medium">{otherUser?.name || otherUser?.username}</span>
                  </p>
                </motion.div>
              ) : (
                chat.messages.map((msg, index) => {
                  const isOwnMessage = msg.sender.id === dbUserId;
                  const showAvatar = !isOwnMessage && (index === 0 || chat.messages[index - 1]?.sender.id !== msg.sender.id);
                  const prevMsg = index > 0 ? chat.messages[index - 1] : undefined;
                  const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
                  const now = new Date();
                  const messageAge = now.getTime() - new Date(msg.createdAt).getTime();
                  const canDeleteForEveryone = isOwnMessage && messageAge <= 60 * 60 * 1000; // 1 hour

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateSeparator && (
                        <DateSeparator date={new Date(msg.createdAt)} />
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2 group`}
                      >
                        <div className={`flex items-end gap-2 max-w-[75%] ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                          {/* Avatar - only show for other user's messages */}
                          {!isOwnMessage && showAvatar && (
                            <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-gray-800">
                              <AvatarImage
                                src={msg.sender.image || "/avatar.png"}
                                alt={msg.sender.name || msg.sender.username}
                              />
                            </Avatar>
                          )}
                          {!isOwnMessage && !showAvatar && (
                            <div className="w-8 h-8 flex-shrink-0" />
                          )}

                          <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                            <MessageContextMenu
                              isOwnMessage={isOwnMessage}
                              canDeleteForEveryone={canDeleteForEveryone}
                              isDeleted={msg.isDeleted}
                              onReply={() => handleReply(msg)}
                              onDeleteForMe={() => handleDeleteMessage(msg.id, false)}
                              onDeleteForEveryone={canDeleteForEveryone ? () => handleDeleteMessage(msg.id, true) : undefined}
                            >
                              <div
                                className={`px-4 py-2.5 rounded-2xl relative inline-block shadow-sm transition-all group-hover:shadow-md ${isOwnMessage
                                  ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white"
                                  : "bg-gray-800 text-white border border-gray-700"
                                  }`}
                                style={{
                                  borderBottomRightRadius: isOwnMessage ? '4px' : '16px',
                                  borderBottomLeftRadius: isOwnMessage ? '16px' : '4px',
                                }}
                              >
                                {/* Reply preview */}
                                {msg.replyTo && (
                                  <div className={`mb-2 p-2 rounded-lg border-l-2 ${isOwnMessage
                                    ? "bg-white/10 border-white/40"
                                    : "bg-gray-900 border-purple-500"
                                    }`}>
                                    <div className="text-xs font-medium mb-1 opacity-90">
                                      {msg.replyTo.sender.name || msg.replyTo.sender.username}
                                    </div>
                                    <div className="text-xs opacity-75 line-clamp-2">
                                      {msg.replyTo.content}
                                    </div>
                                  </div>
                                )}

                                {/* Message content */}
                                <div className="flex items-end gap-2">
                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words flex-1">
                                    {msg.isDeleted ? (
                                      <span className="italic opacity-70">This message was deleted</span>
                                    ) : (
                                      msg.content
                                    )}
                                  </p>
                                  <span className={`inline-flex items-center gap-1 flex-shrink-0 ml-2 ${isOwnMessage ? 'opacity-90' : 'opacity-60'
                                    }`}>
                                    <span className="text-[11px] font-medium">
                                      {formatMessageTime(new Date(msg.createdAt))}
                                    </span>
                                    {isOwnMessage && (
                                      <MessageStatus
                                        status={msg.status || "SENT"}
                                        isOwnMessage={isOwnMessage}
                                      />
                                    )}
                                  </span>
                                </div>
                              </div>
                            </MessageContextMenu>

                            {/* Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <MessageReactions
                                reactions={msg.reactions}
                                onReactionClick={(reaction) => handleRemoveReaction(reaction, msg.id)}
                                currentUserId={dbUserId || ""}
                              />
                            )}

                            {/* Reaction Button */}
                            {!msg.isDeleted && (
                              <div className="relative mt-1">
                                <button
                                  onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                                >
                                  <IconMoodSmile className="w-4 h-4" />
                                </button>
                                <ReactionPicker
                                  show={showReactionPicker === msg.id}
                                  onSelectReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                                  onClose={() => setShowReactionPicker(null)}
                                  isOwnMessage={isOwnMessage}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })
              )}
              <TypingIndicator typingUsers={typingUsers} />
              <div ref={messagesEndRef} />
            </div>
          </div>

          <ScrollToBottomButton
            show={showScrollButton}
            onClick={scrollToBottom}
          />
        </div>

        {/* Reply Preview */}
        {replyTo && (
          <ReplyPreview
            replyTo={replyTo}
            onCancel={handleCancelReply}
          />
        )}

        {/* Message Input */}
        <div className="border-t border-gray-800 bg-gray-900 p-4 flex-shrink-0">
          <div className="flex items-center space-x-3 max-w-4xl mx-auto ">
            {/* Emoji Picker */}
            <div className="flex-shrink-0 hidden md:block">
              <EmojiPicker onSelectEmoji={handleEmojiSelect} />
            </div>

            {/* Text Input */}
            <div className="flex-1">
              <Textarea
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="min-h-[44px] max-h-32 resize-none border-0 bg-gray-800 text-white placeholder-gray-400 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-800"
                disabled={isSending}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconSend className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}