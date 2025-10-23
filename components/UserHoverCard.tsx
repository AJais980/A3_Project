"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import DesignationBadge from "./DesignationBadge";
import BadgeDisplay from "./BadgeDisplay";
import { getUserProfile, toggleFollow } from "@/actions/profile.action";
import { getUserBadges } from "@/actions/badge.action";
import { createOrGetChat } from "@/actions/chat.action";
import { getDbUserId } from "@/actions/user.action";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserPlusIcon, UserMinusIcon, MessageCircleIcon } from "lucide-react";

interface UserStats {
	id: string;
	username: string;
	name: string | null;
	image: string | null;
	bio: string | null;
	designation: string | null;
	_count: {
		posts: number;
		followers: number;
		following: number;
	};
	badges?: Array<{ badgeType: string }>;
	isFollowing?: boolean;
}

interface UserHoverCardProps {
	userId: string;
	username: string;
	children: React.ReactNode;
	currentUserId?: string | null;
}

export default function UserHoverCard({
	userId,
	username,
	children,
	currentUserId,
}: UserHoverCardProps) {
	const { user } = useAuth();
	const router = useRouter();
	const [userStats, setUserStats] = useState<UserStats | null>(null);
	const [userBadges, setUserBadges] = useState<Array<{ badgeType: string }>>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isFollowing, setIsFollowing] = useState(false);
	const [isFollowLoading, setIsFollowLoading] = useState(false);
	const [isChatLoading, setIsChatLoading] = useState(false);
	const [showCard, setShowCard] = useState(false);
	const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
	const [position, setPosition] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0,
	});

	const isOwnProfile = currentUserId === userId;

	useEffect(() => {
		if (showCard && !userStats) {
			loadUserStats();
		}
	}, [showCard, userStats]);

	const loadUserStats = async () => {
		setIsLoading(true);
		try {
			const [profile, badges] = await Promise.all([
				getUserProfile(username, currentUserId),
				getUserBadges(userId)
			]);

			if (profile) {
				setUserStats(profile);
				setIsFollowing(profile.isFollowing || false);
			}

			if (badges && Array.isArray(badges)) {
				setUserBadges(badges);
			}
		} catch (error) {
			console.error("Error loading user stats:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleFollow = async () => {
		if (!user || !currentUserId || isFollowLoading) return;

		setIsFollowLoading(true);
		try {
			const result = await toggleFollow(userId, currentUserId);
			if (result.success) {
				setIsFollowing(!isFollowing);
				setUserStats((prev) =>
					prev
						? {
							...prev,
							_count: {
								...prev._count,
								followers: prev._count.followers + (isFollowing ? -1 : 1),
							},
						}
						: null
				);
				toast.success(
					isFollowing ? "Unfollowed successfully" : "Following successfully"
				);
			} else {
				toast.error(result.error || "Failed to update follow status");
			}
		} catch (error) {
			toast.error("Failed to update follow status");
		} finally {
			setIsFollowLoading(false);
		}
	};

	const handleChatClick = async () => {
		if (!user || !currentUserId || isChatLoading) return;

		setIsChatLoading(true);
		try {
			// Prevent chatting with oneself
			if (currentUserId === userId) {
				toast.error("You cannot chat with yourself.");
				return;
			}

			// Call the server action to create or get the chat
			const result = await createOrGetChat(currentUserId, userId);

			if (result.success && result.chat) {
				router.push(`/conversations/${result.chat.id}`);
			} else {
				toast.error(result.error || "Failed to start chat.");
			}
		} catch (error) {
			console.error("Error initiating chat:", error);
			toast.error("An unexpected error occurred while starting chat.");
		} finally {
			setIsChatLoading(false);
		}
	};

	const handleMouseEnter = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		if (hoverTimeout) clearTimeout(hoverTimeout);

		// Calculate smart positioning with viewport awareness
		const rect = e.currentTarget.getBoundingClientRect();
		const cardWidth = 384; // w-96 = 384px
		const cardHeight = 300; // estimated height
		const padding = 10;

		let left = rect.left;
		let top = rect.bottom + window.scrollY + 8;

		// Ensure card stays within viewport bounds horizontally
		if (left + cardWidth > window.innerWidth - padding) {
			left = window.innerWidth - cardWidth - padding;
		}
		if (left < padding) {
			left = padding;
		}

		// Ensure card stays within viewport bounds vertically
		if (top + cardHeight > window.innerHeight + window.scrollY - padding) {
			top = rect.top + window.scrollY - cardHeight - 8;
		}
		if (top < window.scrollY + padding) {
			top = window.scrollY + padding;
		}

		setPosition({ top, left });

		const timeout = setTimeout(() => setShowCard(true), 300);
		setHoverTimeout(timeout);
	};

	const handleMouseLeave = () => {
		if (hoverTimeout) clearTimeout(hoverTimeout);
		const timeout = setTimeout(() => setShowCard(false), 150);
		setHoverTimeout(timeout);
	};

	return (
		<div
			className="relative inline-block"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{children}

			{showCard &&
				createPortal(
					<div
						className="absolute z-50"
						style={{
							top: position.top,
							left: position.left,
							position: "absolute",
						}}
						onMouseEnter={() => {
							if (hoverTimeout) clearTimeout(hoverTimeout);
						}}
						onMouseLeave={handleMouseLeave}
					>
						<Card className="w-96 bg-gray-900 border-gray-700 shadow-xl overflow-hidden">
							<CardContent className="p-4">
								{isLoading ? (
									<div className="flex items-center space-x-3">
										<div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse"></div>
										<div className="flex-1">
											<div className="h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
											<div className="h-3 bg-gray-700 rounded animate-pulse w-3/4"></div>
										</div>
									</div>
								) : userStats ? (
									<div className="space-y-4">
										{/* User Info */}
										<div className="flex items-start space-x-3">
											<Avatar className="w-16 h-16 ring-2 ring-gray-600 flex-shrink-0">
												<AvatarImage
													src={userStats.image || "/avatar.png"}
												/>
											</Avatar>
											<div className="flex-1 min-w-0 overflow-hidden">
												<h3 className="font-semibold text-white truncate">
													{userStats.name || userStats.username}
												</h3>
												<div className="flex items-center min-w-0 gap-2">
													<p className="text-gray-400 text-sm truncate flex-shrink">
														@{userStats.username}
													</p>
													<div className="flex items-center gap-1 flex-shrink-0">
														{userStats.designation && (
															<DesignationBadge
																designation={
																	userStats.designation as
																	| "STUDENT"
																	| "TEACHER"
																	| "WORKING_PROFESSIONAL"
																}
																size="sm"
															/>
														)}
														{userBadges.length > 0 && (
															<div className="flex items-center gap-1">
																{userBadges.map((badge, index) => (
																	<BadgeDisplay
																		key={index}
																		badgeType={badge.badgeType}
																		size="sm"
																		showName={false}
																	/>
																))}
															</div>
														)}
													</div>
												</div>
												{userStats.bio && (
													<p className="text-gray-300 text-sm mt-1 max-h-10 overflow-hidden break-words">
														{userStats.bio.length > 80
															? userStats.bio.substring(0, 80) + "..."
															: userStats.bio}
													</p>
												)}
											</div>
										</div>

										{/* Stats */}
										<div className="flex justify-evenly items-center space-x-6 text-sm">
											<div className="text-center">
												<div className="font-semibold text-white">
													{userStats._count.posts}
												</div>
												<div className="text-gray-400">Posts</div>
											</div>
											<div className="text-center">
												<div className="font-semibold text-white">
													{userStats._count.followers}
												</div>
												<div className="text-gray-400">Followers</div>
											</div>
											<div className="text-center">
												<div className="font-semibold text-white">
													{userStats._count.following}
												</div>
												<div className="text-gray-400">Following</div>
											</div>
										</div>

										{/* Follow Button */}
										{user && !isOwnProfile && (
											<div className="flex gap-2">
												<Button
													onClick={handleFollow}
													disabled={isFollowLoading}
													className={`flex-1 transition-all ${isFollowing
														? "bg-gray-700 hover:bg-red-600 text-white"
														: "bg-purple-600 hover:bg-purple-700 text-white"
														}`}
												>
													{isFollowLoading ? (
														<div className="flex items-center space-x-2">
															<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
															<span>Loading...</span>
														</div>
													) : isFollowing ? (
														<div className="flex items-center space-x-2">
															<UserMinusIcon className="w-4 h-4" />
															<span>Unfollow</span>
														</div>
													) : (
														<div className="flex items-center space-x-2">
															<UserPlusIcon className="w-4 h-4" />
															<span>Follow</span>
														</div>
													)}
												</Button>

												<Button
													onClick={handleChatClick}
													disabled={isChatLoading}
													className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all"
												>
													{isChatLoading ? (
														<div className="flex items-center space-x-2">
															<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
															<span>Starting...</span>
														</div>
													) : (
														<div className="flex items-center space-x-2">
															<MessageCircleIcon className="w-4 h-4" />
															<span>Chat</span>
														</div>
													)}
												</Button>
											</div>
										)}
									</div>
								) : (
									<div className="text-center text-gray-400 py-4">
										Failed to load user data
									</div>
								)}
							</CardContent>
						</Card>
					</div>,
					document.body
				)}
		</div>
	);
}