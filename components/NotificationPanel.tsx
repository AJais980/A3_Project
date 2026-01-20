"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";
import { useAuth } from "@/lib/useAuth";
import Image from "next/image";
import Link from "next/link";

interface NotificationData {
	id: string;
	type: "LIKE" | "COMMENT" | "FOLLOW";
	read: boolean;
	createdAt: Date;
	creator: {
		id: string;
		name: string | null;
		username: string;
		image: string | null;
	};
	post?: {
		id: string;
		content: string | null;
		fileUrl: string | null;
	} | null;
	comment?: {
		id: string;
		content: string;
		createdAt: Date;
	} | null;
}

export default function NotificationPanel() {
	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState<NotificationData[]>([]);
	const [loading, setLoading] = useState(false);
	const { user } = useAuth();
	const panelRef = useRef<HTMLDivElement>(null);

	// Close panel when clicking outside and handle body scroll
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			// Prevent body scroll when notification panel is open
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll when panel is closed
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	const loadNotifications = async () => {
		if (!user?.uid) return;

		setLoading(true);
		try {
			const data = await getNotifications(user.uid);
			setNotifications(data);
		} catch (error) {
			console.error("Failed to load notifications:", error);
		} finally {
			setLoading(false);
		}
	};

	// Load notifications when panel opens
	useEffect(() => {
		if (isOpen && user?.uid) {
			loadNotifications();
		}
	}, [isOpen, user?.uid]);

	const handleMarkAsRead = async () => {
		const unreadNotifications = notifications.filter(n => !n.read);
		if (unreadNotifications.length === 0) return;

		try {
			await markNotificationsAsRead(unreadNotifications.map(n => n.id));
			setNotifications(prev => prev.map(n => ({ ...n, read: true })));
		} catch (error) {
			console.error("Failed to mark notifications as read:", error);
		}
	};

	const getNotificationMessage = (notification: NotificationData) => {
		const creatorName = notification.creator.name || notification.creator.username;

		switch (notification.type) {
			case "LIKE":
				return `${creatorName} liked your post`;
			case "COMMENT":
				return `${creatorName} commented on your post`;
			case "FOLLOW":
				return `${creatorName} started following you`;
			default:
				return "New notification";
		}
	};

	const getNotificationLink = (notification: NotificationData) => {
		switch (notification.type) {
			case "LIKE":
			case "COMMENT":
				return `/explore`; // Navigate to explore page since no individual post pages
			case "FOLLOW":
				return `/profile/${notification.creator.username}`;
			default:
				return "#";
		}
	};

	const formatTimeAgo = (date: Date) => {
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return "just now";
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	};

	const unreadCount = notifications.filter(n => !n.read).length;

	return (
		<div className="relative" ref={panelRef}>
			{/* Notification Bell Button */}
			<motion.button
				onClick={() => setIsOpen(!isOpen)}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				className="relative w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 group shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center"
			>
				<Bell className={`w-4 h-4 transition-all duration-300 ${unreadCount > 0
					? 'text-blue-400 group-hover:text-blue-300'
					: 'text-gray-300 group-hover:text-white'
					}`} />

				{/* Notification Badge */}
				{unreadCount > 0 && (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{
							scale: 1,
							opacity: 1,
						}}
						exit={{ scale: 0, opacity: 0 }}
						className="absolute -top-1 -right-1 bg-linear-to-br from-red-500 via-red-600 to-red-700 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg ring-2 ring-black/40"
					>
						<motion.span
							animate={{ scale: [1, 1.1, 1] }}
							transition={{ duration: 2, repeat: Infinity }}
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</motion.span>
					</motion.div>
				)}
			</motion.button>

			{/* Notification Panel */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Full Screen Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/80 md:bg-black/60 backdrop-blur-md md:backdrop-blur-sm z-40"
							onClick={() => setIsOpen(false)}
						/>

						{/* Notification Panel */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
							className="fixed z-50 inset-x-6 top-28 bottom-28 h-[calc(100vh-14rem)] md:h-auto md:right-4 md:left-auto md:top-20 md:bottom-auto md:w-96 md:max-h-[480px] backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl ring-1 ring-white/10 flex flex-col overflow-hidden"
							style={{
								background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 25%, rgba(51, 65, 85, 0.95) 75%, rgba(15, 23, 42, 0.95) 100%)',
								backdropFilter: 'blur(24px) saturate(180%)',
								WebkitBackdropFilter: 'blur(24px) saturate(180%)',
							}}
						>
							{/* Header */}
							<div className="flex items-center justify-between p-5 border-b border-white/10 bg-linear-to-r from-white/5 to-transparent">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
										<Bell className="w-4 h-4 text-white" />
									</div>
									<h3 className="text-lg font-semibold text-white">Notifications</h3>
									{unreadCount > 0 && (
										<span className="px-2.5 py-1 text-xs font-medium bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-md">
											{unreadCount}
										</span>
									)}
								</div>

								<div className="flex items-center gap-2">
									{unreadCount > 0 && (
										<button
											onClick={handleMarkAsRead}
											className="px-3 py-1.5 text-sm text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
										>
											Mark all read
										</button>
									)}
									<button
										onClick={() => setIsOpen(false)}
										className="p-2 rounded-lg hover:bg-white/10 transition-colors"
									>
										<X className="w-5 h-5 text-gray-300" />
									</button>
								</div>
							</div>

							{/* Scrollable Content */}
							<div className="flex-1 overflow-y-auto scrollbar-hide">
								{loading ? (
									<div className="flex flex-col items-center justify-center p-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
										<p className="text-gray-300">Loading notifications...</p>
									</div>
								) : notifications.length === 0 ? (
									<div className="flex flex-col items-center justify-center p-8">
										<Bell className="w-12 h-12 text-gray-500 mb-4" />
										<h4 className="text-gray-200 font-medium mb-2">No notifications yet</h4>
										<p className="text-gray-400 text-sm text-center">
											When someone interacts with your content, you'll see it here
										</p>
									</div>
								) : (
									<div className="p-4 space-y-3">
										{notifications.map((notification, index) => (
											<motion.div
												key={notification.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												className={`p-4 rounded-xl border transition-all duration-200 hover:bg-white/5 backdrop-blur-sm ${!notification.read
													? 'bg-blue-500/15 border-blue-400/30 shadow-lg shadow-blue-500/10'
													: 'bg-white/5 border-white/10'
													}`}
											>
												<Link
													href={getNotificationLink(notification)}
													onClick={() => setIsOpen(false)}
													className="block"
												>
													<div className="flex items-start gap-3">
														{/* Avatar */}
														<div className="relative flex-shrink-0">
															<Image
																src={notification.creator.image || "/avatar.png"}
																alt={notification.creator.name || notification.creator.username}
																width={40}
																height={40}
																className="rounded-full object-cover ring-2 ring-white/20"
															/>
															{/* Notification Type Badge */}
															<div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-lg ${notification.type === 'LIKE' ? 'bg-linear-to-br from-red-500 to-pink-500' :
																notification.type === 'COMMENT' ? 'bg-linear-to-br from-blue-500 to-cyan-500' :
																	'bg-linear-to-br from-green-500 to-emerald-500'
																}`}>
																{notification.type === 'LIKE' ? '❤️' :
																	notification.type === 'COMMENT' ? '💬' : '👥'}
															</div>
														</div>

														{/* Content */}
														<div className="flex-1 min-w-0">
															<div className="flex items-center justify-between mb-1">
																<p className="text-sm text-gray-200">
																	<span className="font-semibold text-white">
																		{notification.creator.name || notification.creator.username}
																	</span>
																	<span className="ml-1">
																		{notification.type === 'LIKE' ? 'liked your post' :
																			notification.type === 'COMMENT' ? 'commented on your post' :
																				'started following you'}
																	</span>
																</p>
																{!notification.read && (
																	<div className="w-2 h-2 bg-linear-to-r from-blue-400 to-purple-400 rounded-full flex-shrink-0 shadow-lg"></div>
																)}
															</div>

															{/* Post Preview */}
															{(notification.type === "LIKE" || notification.type === "COMMENT") && notification.post?.content && (
																<div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10">
																	<p className="text-xs text-gray-300 line-clamp-2">
																		{notification.post.content}
																	</p>
																</div>
															)}

															{/* Comment Preview */}
															{notification.type === "COMMENT" && notification.comment && (
																<div className="mt-2 p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
																	<p className="text-xs text-blue-200">
																		"{notification.comment.content}"
																	</p>
																</div>
															)}

															<p className="text-xs text-gray-400 mt-2">
																{formatTimeAgo(notification.createdAt)}
															</p>
														</div>
													</div>
												</Link>
											</motion.div>
										))}
									</div>
								)}
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}