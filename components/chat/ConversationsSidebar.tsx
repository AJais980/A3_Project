"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useRealtime } from "@/lib/SupabaseRealtimeContext";
import { getChatsForUser, deleteChat } from "@/actions/chat.action";
import { getDbUserId } from "@/actions/user.action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { IconArrowLeft, IconMessageCircle } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { ChatContextMenu } from "@/components/chat/ChatContextMenu";
import { UnreadBadge } from "@/components/chat/UnreadBadge";
import { SearchBar } from "@/components/chat/SearchBar";

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
	updatedAt?: Date;
};

export function ConversationsSidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const { user, loading: authLoading } = useAuth();
	const { supabase, socket } = useRealtime();

	const [allChats, setAllChats] = useState<Chat[]>([]);
	const [dbUserId, setDbUserId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isInitialized, setIsInitialized] = useState(false);

	// Extract current chatId from pathname
	const currentChatId = pathname?.startsWith('/conversations/')
		? pathname.split('/conversations/')[1]
		: null;

	// Fetch all chats
	const fetchAllChats = useCallback(async () => {
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

	// Initialize sidebar
	useEffect(() => {
		const initializeSidebar = async () => {
			if (user && !isInitialized) {
				const id = await getDbUserId(user.uid);
				setDbUserId(id);
				await fetchAllChats();
				setIsInitialized(true);
			}
		};
		initializeSidebar();
	}, [user, isInitialized, fetchAllChats]);

	// Listen for real-time updates via Socket.IO
	useEffect(() => {
		if (socket && dbUserId) {
			const handleUnreadCountUpdated = () => {
				fetchAllChats();
			};

			const handleMessageReceived = () => {
				fetchAllChats();
			};

			socket.on('unread_count_updated', handleUnreadCountUpdated);
			socket.on('message_received', handleMessageReceived);

			return () => {
				socket.off('unread_count_updated', handleUnreadCountUpdated);
				socket.off('message_received', handleMessageReceived);
			};
		}
	}, [socket, dbUserId, fetchAllChats]);

	// Listen for Supabase realtime updates
	useEffect(() => {
		if (supabase && dbUserId) {
			const channel = supabase.channel(`sidebar-global:${dbUserId}`);

			channel
				.on('broadcast', { event: 'unread_count_updated' }, () => {
					fetchAllChats();
				})
				.on('broadcast', { event: 'new_message' }, () => {
					fetchAllChats();
				})
				.subscribe();

			return () => {
				channel.unsubscribe();
			};
		}
	}, [supabase, dbUserId, fetchAllChats]);

	// Polling fallback
	useEffect(() => {
		if (user && isInitialized) {
			const pollInterval = setInterval(() => {
				fetchAllChats();
			}, 10000);

			return () => clearInterval(pollInterval);
		}
	}, [user, isInitialized, fetchAllChats]);

	const getOtherUser = (chat: Chat) => {
		if (!dbUserId) return null;
		return chat.user1.id === dbUserId ? chat.user2 : chat.user1;
	};

	const getLastMessage = (chat: Chat) => {
		return chat.messages.length > 0 ? chat.messages[0] : null;
	};

	const handleDeleteChat = async (chatId: string) => {
		if (!user) return;

		try {
			const result = await deleteChat(chatId, user.uid);
			if (result.success) {
				setAllChats(allChats.filter(chat => chat.id !== chatId));
				toast.success("Chat deleted successfully");
				if (chatId === currentChatId) {
					router.push("/conversations");
				}
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
	const filteredChats = allChats.filter(chatItem => {
		const otherUser = getOtherUser(chatItem);
		if (!otherUser) return false;

		const searchLower = searchQuery.toLowerCase();
		return (
			otherUser.name?.toLowerCase().includes(searchLower) ||
			otherUser.username.toLowerCase().includes(searchLower)
		);
	});

	if (authLoading || !isInitialized) {
		return (
			<div className="hidden lg:flex lg:w-80 border-r border-gray-800 bg-gray-900 flex-col shrink-0 h-screen">
				<div className="p-4 border-b border-gray-800 bg-gray-900/50">
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-semibold text-white">Messages</h1>
					</div>
				</div>
				<div className="flex-1 flex items-center justify-center">
					<div className="w-8 h-8 border-2 border-gray-700 border-t-purple-500 rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="hidden lg:flex lg:w-80 border-r border-gray-800 bg-gray-900 flex-col shrink-0 h-screen">
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
				{filteredChats.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full p-8 text-center">
						<div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
							<IconMessageCircle className="w-8 h-8 text-gray-600" />
						</div>
						<p className="text-gray-400 text-sm">
							{searchQuery ? 'No matches found' : 'No conversations yet'}
						</p>
					</div>
				) : (
					filteredChats.map((chatItem) => {
						const otherUser = getOtherUser(chatItem);
						const lastMessage = getLastMessage(chatItem);
						const isActive = chatItem.id === currentChatId;

						if (!otherUser) return null;

						return (
							<ChatContextMenu
								key={chatItem.id}
								onDelete={() => handleDeleteChat(chatItem.id)}
							>
								<div
									className={`border-b border-gray-800 cursor-pointer transition-all ${isActive
											? "bg-gray-800/50 border-l-4 border-l-purple-500"
											: "hover:bg-gray-800/30"
										}`}
									onClick={() => router.push(`/conversations/${chatItem.id}`)}
								>
									<div className="p-4 flex items-center space-x-3">
										<Avatar className="w-12 h-12 shrink-0 ring-2 ring-gray-700">
											<AvatarImage
												src={otherUser.image || "/avatar.png"}
												alt={otherUser.name || otherUser.username}
											/>
										</Avatar>

										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<h3 className="font-semibold text-white truncate text-sm">
													{otherUser.name || otherUser.username}
												</h3>
												<span className="text-xs text-gray-500 shrink-0">
													{chatItem.updatedAt
														? formatDistanceToNow(new Date(chatItem.updatedAt), { addSuffix: false })
														: 'now'}
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
											<UnreadBadge
												count={
													chatItem.user1Id === dbUserId
														? (chatItem.user1UnreadCount || 0)
														: (chatItem.user2UnreadCount || 0)
												}
											/>
										)}
									</div>
								</div>
							</ChatContextMenu>
						);
					})
				)}
			</div>
		</div>
	);
}
