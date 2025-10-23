// Try to import from Prisma client, fallback to local type
let BadgeType: any;
try {
	const { BadgeType: PrismaBadgeType } = require("@prisma/client");
	BadgeType = PrismaBadgeType;
} catch {
	// Fallback type definition
}

export type BadgeType =
	| "RISING_HELPER"
	| "HELPFUL_MIND"
	| "TRUSTED_ADVISOR"
	| "STAR_MENTOR"
	| "LEGENDARY_GUIDE";

export interface Badge {
	type: BadgeType;
	name: string;
	icon: string;
	description: string;
	requirements: {
		minRating: number;
		minRatingsCount: number;
	};
}

export const BADGES: Badge[] = [
	{
		type: "RISING_HELPER",
		name: "Rising Helper",
		icon: "seedling",
		description: "Consistently providing helpful feedback",
		requirements: {
			minRating: 2.5,
			minRatingsCount: 5,
		},
	},
	{
		type: "HELPFUL_MIND",
		name: "Helpful Mind",
		icon: "lightbulb",
		description: "Great insights and constructive comments",
		requirements: {
			minRating: 3.5,
			minRatingsCount: 5,
		},
	},
	{
		type: "TRUSTED_ADVISOR",
		name: "Trusted Advisor",
		icon: "handshake",
		description: "Reliable and valuable guidance",
		requirements: {
			minRating: 4.0,
			minRatingsCount: 10,
		},
	},
	{
		type: "STAR_MENTOR",
		name: "Star Mentor",
		icon: "star",
		description: "Exceptional mentoring and advice",
		requirements: {
			minRating: 4.5,
			minRatingsCount: 15,
		},
	},
	{
		type: "LEGENDARY_GUIDE",
		name: "Legendary Guide",
		icon: "trophy",
		description: "The pinnacle of helpful community members",
		requirements: {
			minRating: 4.8,
			minRatingsCount: 20,
		},
	},
];

export function getBadgeByType(type: BadgeType): Badge | undefined {
	return BADGES.find(badge => badge.type === type);
}

export function getEligibleBadges(averageRating: number, totalRatings: number): Badge[] {
	return BADGES.filter(badge =>
		averageRating >= badge.requirements.minRating &&
		totalRatings >= badge.requirements.minRatingsCount
	);
}

export function getHighestBadge(averageRating: number, totalRatings: number): Badge | null {
	const eligibleBadges = getEligibleBadges(averageRating, totalRatings);
	if (eligibleBadges.length === 0) return null;

	// Return the badge with the highest requirements
	return eligibleBadges.reduce((highest, current) => {
		if (current.requirements.minRating > highest.requirements.minRating) {
			return current;
		}
		if (current.requirements.minRating === highest.requirements.minRating &&
			current.requirements.minRatingsCount > highest.requirements.minRatingsCount) {
			return current;
		}
		return highest;
	});
}