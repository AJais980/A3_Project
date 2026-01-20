"use client";

import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getChatsForUser, deleteChat } from "@/actions/chat.action";
import { getDbUserId } from "@/actions/user.action";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { IconMessageCircle, IconUser } from "@tabler/icons-react";
import { ChatContextMenu } from "@/components/chat/ChatContextMenu";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";
import { SearchBar } from "@/components/chat/SearchBar";
import { UnreadBadge } from "@/components/chat/UnreadBadge";
import { OnlineStatus } from "@/components/chat/OnlineStatus";
import { useRealtime } from "@/lib/SupabaseRealtimeContext";
import toast from "react-hot-toast";
import { Navigation } from "@/components/Navigation";

type Chat = {
  id: string;
  user1Id: string;
  user2Id: string;
  user1UnreadCount: number;
  user2UnreadCount: number;
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
  messages: {
    id: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string | null;
      username: string;
      image: string | null;
    };
  }[];
  updatedAt: Date;
};

export default function ConversationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { supabase, socket, requestUserStatus, userStatuses } = useRealtime();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbUserId, setDbUserId] = useState<string | null>(null); // State for current user's database ID
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [user, authLoading, router]);

  const loadChats = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      const result = await getChatsForUser(user.uid);
      if (result.success && result.chats) {
        // Optional: Sort chats by updatedAt descending (most recent first)
        const sortedChats = result.chats.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setChats(sortedChats); // Now TypeScript knows chats is Chat[]
      } else {
        // Fallback to empty array if success is false or chats is undefined
        setChats([]);
        console.error("Failed to load chats:", result.error);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
      setChats([]); // Fallback on error
    }
  }, [user, authLoading]);

  useEffect(() => {
    const initializeChats = async () => {
      if (authLoading || !user) return;

      setIsLoading(true);
      try {
        // Fetch current user's database ID first (for consistent ID comparisons)
        const currentDbUserId = await getDbUserId(user.uid);
        setDbUserId(currentDbUserId);

        if (!currentDbUserId) {
          console.error("Current user's database ID not found");
          setChats([]);
          setIsLoading(false);
          return;
        }

        await loadChats();
      } finally {
        setIsLoading(false);
      }
    };

    initializeChats();
  }, [user, authLoading, loadChats]);

  // Listen for real-time updates to refresh chat list via Supabase
  useEffect(() => {
    if (supabase && user && dbUserId) {
      const channel = supabase.channel(`conversations-updates:${dbUserId}`);

      channel
        .on('broadcast', { event: 'new_message' }, ({ payload }: any) => {
          loadChats();
        })
        .on('broadcast', { event: 'unread_count_updated' }, ({ payload }: any) => {
          loadChats();
        })
        .on('broadcast', { event: 'messages_read' }, ({ payload }: any) => {
          loadChats();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [supabase, user, dbUserId, loadChats]);

  // Listen for Socket.IO updates for new messages and unread counts
  useEffect(() => {
    if (socket && dbUserId) {
      const handleUnreadCountUpdated = () => {
        loadChats();
      };

      const handleMessageReceived = () => {
        // Refresh chat list when a new message is received
        loadChats();
      };

      socket.on('unread_count_updated', handleUnreadCountUpdated);
      socket.on('message_received', handleMessageReceived);

      return () => {
        socket.off('unread_count_updated', handleUnreadCountUpdated);
        socket.off('message_received', handleMessageReceived);
      };
    }
  }, [socket, dbUserId, loadChats]);

  // Request user statuses for all users in chats
  useEffect(() => {
    if (chats.length > 0 && dbUserId && requestUserStatus) {
      const userIds = chats.map(chat => {
        const otherUser = chat.user1.id === dbUserId ? chat.user2 : chat.user1;
        return otherUser.id;
      }).filter(Boolean);

      if (userIds.length > 0) {
        requestUserStatus(userIds);
      }
    }
  }, [chats, dbUserId, requestUserStatus]);

  const getOtherUser = (chat: Chat) => {
    if (!dbUserId) return null;
    // Find the other user in the chat (not the current user) - compare database IDs
    return chat.user1.id === dbUserId ? chat.user2 : chat.user1;
  };

  const getLastMessage = (chat: Chat) => {
    // Since messages are ordered by createdAt: "desc" with take: 1 in getChatsForUser ,
    // messages[0] is the most recent (latest) message
    return chat.messages.length > 0 ? chat.messages[0] : null;
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      const result = await deleteChat(chatId, user.uid);
      if (result.success) {
        setChats(chats.filter(chat => chat.id !== chatId));
        toast.success("Chat deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete chat");
      }
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chatItem => {
    const otherUser = getOtherUser(chatItem);
    if (!otherUser) return false;

    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser.name?.toLowerCase().includes(searchLower) ||
      otherUser.username.toLowerCase().includes(searchLower)
    );
  });

  if (authLoading || isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="w-16 h-16 border-4 border-gray-800 border-t-purple-600 rounded-full animate-spin"></div>
              {/* Inner pulsing circle */}
              <div className="absolute inset-0 m-auto w-8 h-8 bg-linear-to-br from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-medium">Loading conversations...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user || !dbUserId) {
    // Silent redirect
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-950 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Sidebar - Conversations List */}
            <div className="w-full lg:w-96 flex flex-col bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-800 bg-linear-to-r from-purple-900/20 to-pink-900/20">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold text-white mb-1 flex items-center space-x-2">
                    <IconMessageCircle className="w-7 h-7 text-purple-500" />
                    <span>Messages</span>
                  </h1>
                </motion.div>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Search conversations..."
                />
              </div>

              {/* Conversations List */}
              <CustomScrollbar className="flex-1">
                {filteredChats.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col items-center justify-center h-full p-8 text-center"
                  >
                    <div className="w-20 h-20 bg-linear-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4">
                      <IconMessageCircle className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchQuery ? 'No matches found' : 'No conversations yet'}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-xs">
                      {searchQuery
                        ? 'Try searching for a different name or username'
                        : 'Start a conversation by visiting a user\'s profile and clicking the chat button.'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => router.push("/explore")}
                        className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/25"
                      >
                        Explore Users
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {filteredChats.map((chat, index) => {
                      const otherUser = getOtherUser(chat);
                      const lastMessage = getLastMessage(chat);
                      const unreadCount = chat.user1Id === dbUserId ? chat.user1UnreadCount : chat.user2UnreadCount;

                      if (!otherUser) return null;

                      return (
                        <ChatContextMenu
                          key={chat.id}
                          onDelete={() => handleDeleteChat(chat.id)}
                        >
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-gray-800/50 transition-all cursor-pointer group"
                            onClick={() => router.push(`/conversations/${chat.id}`)}
                          >
                            <div className="p-4 flex items-center space-x-3">
                              <div className="relative">
                                <Avatar className="w-14 h-14 ring-2 ring-gray-700 group-hover:ring-purple-500 transition-all">
                                  <AvatarImage
                                    src={otherUser.image || "/avatar.png"}
                                    alt={otherUser.name || otherUser.username}
                                  />
                                </Avatar>
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                                  <OnlineStatus
                                    isOnline={userStatuses[otherUser.id]?.isOnline || false}
                                    showText={false}
                                  />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-white truncate text-base group-hover:text-purple-400 transition-colors">
                                    {otherUser.name || otherUser.username}
                                  </h3>
                                  <span className="text-xs text-gray-500 shrink-0 ml-2">
                                    {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: false })}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  {lastMessage ? (
                                    <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
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

                                  {unreadCount > 0 && (
                                    <UnreadBadge count={unreadCount} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </ChatContextMenu>
                      );
                    })}
                  </div>
                )}
              </CustomScrollbar>
            </div>

            {/* Main Content Area - Welcome Message */}
            <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl hidden lg:flex items-center justify-center overflow-hidden relative">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-transparent to-pink-900/10" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md px-4 relative z-10"
              >
                <motion.div
                  className="w-32 h-32 mx-auto mb-6 bg-linear-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/25"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <IconMessageCircle className="w-16 h-16 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Welcome to <span className="bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">PeerPulse</span> Chat
                </h2>
                <p className="text-base text-gray-400 leading-relaxed mb-6">
                  Select a conversation from the sidebar to start chatting with your professional network.
                  Build meaningful connections and exchange valuable feedback.
                </p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time messaging</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}