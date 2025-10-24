"use client";

import { Badge, getBadgeByType, BADGES } from "@/lib/badges";
import { motion } from "framer-motion";
import {
	Sprout,
	Lightbulb,
	Handshake,
	Star,
	Trophy
} from "lucide-react";

interface BadgeProps {
	badgeType: string;
	size?: "sm" | "md" | "lg";
	showName?: boolean;
	className?: string;
}

const iconMap = {
	seedling: Sprout,
	lightbulb: Lightbulb,
	handshake: Handshake,
	star: Star,
	trophy: Trophy,
};

const sizeClasses = {
	sm: "w-4 h-4",
	md: "w-6 h-6",
	lg: "w-8 h-8",
};

const containerSizeClasses = {
	sm: "p-1",
	md: "p-2",
	lg: "p-3",
};

export default function BadgeDisplay({
	badgeType,
	size = "md",
	showName = false,
	className = ""
}: BadgeProps) {
	const badge = getBadgeByType(badgeType as any);

	if (!badge) return null;

	const IconComponent = iconMap[badge.icon as keyof typeof iconMap];

	if (!IconComponent) return null;

	const badgeColors = {
		RISING_HELPER: "from-green-400 to-emerald-600",
		HELPFUL_MIND: "from-yellow-400 to-orange-500",
		TRUSTED_ADVISOR: "from-blue-400 to-indigo-600",
		STAR_MENTOR: "from-purple-400 to-pink-600",
		LEGENDARY_GUIDE: "from-amber-400 to-yellow-600",
	};

	return (
		<motion.div
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ type: "spring", stiffness: 300, damping: 20 }}
			className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${badgeColors[badge.type as keyof typeof badgeColors]
				} ${containerSizeClasses[size]} ${className}`}
			title={`${badge.name}: ${badge.description}`}
		>
			<IconComponent
				className={`${sizeClasses[size]} text-white drop-shadow-sm`}
			/>
			{showName && (
				<span className="text-white font-medium text-xs pr-1">
					{badge.name}
				</span>
			)}
		</motion.div>
	);
}

interface BadgeListProps {
	badges: Array<{ badgeType: string; earnedAt: Date }>;
	maxDisplay?: number;
	size?: "sm" | "md" | "lg";
	showNames?: boolean;
	className?: string;
}

export function BadgeList({
	badges,
	maxDisplay = 5,
	size = "sm",
	showNames = false,
	className = ""
}: BadgeListProps) {
	const displayBadges = badges.slice(0, maxDisplay);
	const remainingCount = badges.length - maxDisplay;

	if (badges.length === 0) return null;

	return (
		<div className={`flex items-center gap-1 flex-wrap ${className}`}>
			{displayBadges.map((userBadge, index) => (
				<BadgeDisplay
					key={`${userBadge.badgeType}-${index}`}
					badgeType={userBadge.badgeType}
					size={size}
					showName={showNames}
				/>
			))}

			{remainingCount > 0 && (
				<span className="text-xs text-gray-500 ml-1">
					+{remainingCount} more
				</span>
			)}
		</div>
	);
}

// Component to show all available badges with progress
interface BadgeProgressProps {
	userBadges: Array<{ badgeType: string; earnedAt: Date }>;
	averageRating: number;
	totalRatings: number;
}

export function BadgeProgress({ userBadges, averageRating, totalRatings }: BadgeProgressProps) {
	const earnedBadgeTypes = userBadges.map(b => b.badgeType);

	return (
		<div className="space-y-3">
			<h3 className="text-lg font-semibold text-white">Badge Progress</h3>
			<div className="grid gap-3">
				{BADGES.map((badge) => {
					const isEarned = earnedBadgeTypes.includes(badge.type);
					const meetsRating = averageRating >= badge.requirements.minRating;
					const meetsCount = totalRatings >= badge.requirements.minRatingsCount;

					return (
						<div
							key={badge.type}
							className={`p-3 rounded-lg border ${isEarned
								? 'bg-green-900/20 border-green-800'
								: 'bg-gray-900/20 border-gray-700'
								}`}
						>
							<div className="flex items-center gap-3">
								<BadgeDisplay
									badgeType={badge.type}
									size="md"
									className={!isEarned ? 'opacity-50' : ''}
								/>
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<h4 className={`font-medium ${isEarned ? 'text-green-300' : 'text-gray-300'
											}`}>
											{badge.name}
											{isEarned && <span className="ml-2 text-green-600">✓</span>}
										</h4>
									</div>
									<p className="text-sm text-gray-400 mt-1">
										{badge.description}
									</p>
									<div className="text-xs text-gray-400 mt-2">
										Requires: {badge.requirements.minRating}⭐ avg rating, {badge.requirements.minRatingsCount} ratings
									</div>
									{!isEarned && (
										<div className="text-xs mt-1">
											<span className={meetsRating ? 'text-green-600' : 'text-red-600'}>
												Rating: {averageRating.toFixed(1)}/{badge.requirements.minRating}
											</span>
											<span className="mx-2">•</span>
											<span className={meetsCount ? 'text-green-600' : 'text-red-600'}>
												Ratings: {totalRatings}/{badge.requirements.minRatingsCount}
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}