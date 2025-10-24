"use server";

import prisma from "@/lib/prisma";
import { getEligibleBadges, type BadgeType } from "@/lib/badges";

// Helper function to check if badge system is available
function isBadgeSystemAvailable() {
	return 'userBadge' in prisma && typeof (prisma as any).userBadge?.findMany === 'function';
}

export async function calculateUserStats(userId: string) {
	try {
		// Get all comments by the user that have ratings
		const commentsWithRatings = await prisma.comment.findMany({
			where: {
				authorId: userId,
				rating: {
					not: null,
				},
			},
			select: {
				rating: true,
			},
		});

		if (commentsWithRatings.length === 0) {
			return {
				averageRating: 0,
				totalRatings: 0,
			};
		}

		const ratings = commentsWithRatings.map(comment => comment.rating!);
		const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

		return {
			averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
			totalRatings: ratings.length,
		};
	} catch (error) {
		console.error("Error calculating user stats:", error);
		throw new Error("Failed to calculate user stats");
	}
}

export async function updateUserBadges(userId: string) {
	try {
		const { averageRating, totalRatings } = await calculateUserStats(userId);
		const eligibleBadges = getEligibleBadges(averageRating, totalRatings);

		// Check if badge system is available
		if (!isBadgeSystemAvailable()) {
			return {
				averageRating,
				totalRatings,
				newBadges: [],
				totalBadges: 0,
			};
		}

		// Get current user badges
		const currentBadges = await (prisma as any).userBadge.findMany({
			where: { userId },
			select: { badgeType: true },
		});

		const currentBadgeTypes = currentBadges.map((badge: any) => badge.badgeType);

		// Find badges to add (eligible but not yet earned)
		const badgesToAdd = eligibleBadges.filter(badge =>
			!currentBadgeTypes.includes(badge.type)
		);

		// Add new badges
		if (badgesToAdd.length > 0) {
			await (prisma as any).userBadge.createMany({
				data: badgesToAdd.map(badge => ({
					userId,
					badgeType: badge.type,
				})),
				skipDuplicates: true,
			});
		}

		return {
			averageRating,
			totalRatings,
			newBadges: badgesToAdd,
			totalBadges: currentBadgeTypes.length + badgesToAdd.length,
		};
	} catch (error) {
		console.error("Error updating user badges:", error);

		// If error is related to missing table or client, provide helpful message
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes('UserBadge') || errorMessage.includes('userBadge')) {
			const { averageRating, totalRatings } = await calculateUserStats(userId);
			return {
				averageRating,
				totalRatings,
				newBadges: [],
				totalBadges: 0,
			};
		}

		throw new Error("Failed to update user badges");
	}
}

export async function getUserBadges(userId: string) {
	try {
		// Check if badge system is available
		if (!isBadgeSystemAvailable()) {
			return [];
		}

		const userBadges = await (prisma as any).userBadge.findMany({
			where: { userId },
			orderBy: { earnedAt: 'desc' },
		});

		return userBadges;
	} catch (error) {
		console.error("Error fetching user badges:", error);

		// If error is related to missing table or client, return empty array
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes('UserBadge') || errorMessage.includes('userBadge')) {
			return [];
		}

		throw new Error("Failed to fetch user badges");
	}
}

export async function getUserStats(userId: string) {
	try {
		const stats = await calculateUserStats(userId);
		const badges = await getUserBadges(userId);

		return {
			...stats,
			badges,
			badgeCount: badges.length,
		};
	} catch (error) {
		console.error("Error fetching user stats:", error);
		throw new Error("Failed to fetch user stats");
	}
}