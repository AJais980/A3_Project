import React from 'react';
import { motion } from 'framer-motion';
import { BadgeList } from './BadgeDisplay';
import { GraduationCap, BookOpen, Briefcase } from 'lucide-react';

type DesignationType = 'STUDENT' | 'TEACHER' | 'WORKING_PROFESSIONAL';

interface DesignationBadgeProps {
	designation: DesignationType;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	userBadges?: Array<{ badgeType: string; earnedAt: Date }>;
	showBadges?: boolean;
}

interface DesignationConfig {
	label: string;
	gradientClasses: string;
	icon: React.ComponentType<{ className?: string }>;
}

const designationConfig: Record<DesignationType, DesignationConfig> = {
	STUDENT: {
		label: 'Student',
		gradientClasses: 'from-indigo-500 via-purple-500 to-pink-500',
		icon: GraduationCap
	},
	TEACHER: {
		label: 'Teacher',
		gradientClasses: 'from-emerald-400 via-teal-500 to-cyan-600',
		icon: BookOpen
	},
	WORKING_PROFESSIONAL: {
		label: 'Professional',
		gradientClasses: 'from-amber-400 via-orange-500 to-red-500',
		icon: Briefcase
	}
};

const iconSizeClasses = {
	sm: 'w-3 h-3',
	md: 'w-4 h-4',
	lg: 'w-5 h-5',
};

const containerSizeClasses = {
	sm: 'px-2 py-0.5',
	md: 'px-2.5 py-1',
	lg: 'px-3 py-1.5',
};

export default function DesignationBadge({
	designation,
	size = 'md',
	className = '',
	userBadges = [],
	showBadges = true
}: DesignationBadgeProps) {
	const config = designationConfig[designation];

	if (!config) return null;

	const IconComponent = config.icon;

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 20 }}
				className={`
					inline-flex items-center gap-2 rounded-full font-medium
					bg-gradient-to-r ${config.gradientClasses}
					text-white shadow-md hover:shadow-lg transition-shadow
					${containerSizeClasses[size]}
				`}
				title={`${config.label} designation`}
			>
				<IconComponent className={`${iconSizeClasses[size]} text-white drop-shadow-sm`} />
				<span className="text-white font-medium text-xs">{config.label}</span>
			</motion.div>
			{showBadges && userBadges.length > 0 && (
				<BadgeList
					badges={userBadges}
					size={size === 'lg' ? 'md' : 'sm'}
					maxDisplay={3}
				/>
			)}
		</div>
	);
}

// Helper component for multiple badges (future use)
interface DesignationBadgesProps {
	designations: DesignationType[];
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	maxVisible?: number;
}

export function DesignationBadges({
	designations,
	size = 'md',
	className = '',
	maxVisible = 3
}: DesignationBadgesProps) {
	const visibleDesignations = designations.slice(0, maxVisible);
	const remainingCount = designations.length - maxVisible;

	return (
		<div className={`flex items-center gap-1 flex-wrap ${className}`}>
			{visibleDesignations.map((designation, index) => (
				<DesignationBadge
					key={`${designation}-${index}`}
					designation={designation}
					size={size}
				/>
			))}
			{remainingCount > 0 && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
					className={`
						inline-flex items-center rounded-full font-medium
						bg-gradient-to-r from-gray-400 to-gray-600
						text-white shadow-md
						${containerSizeClasses[size]}
					`}
				>
					+{remainingCount}
				</motion.div>
			)}
		</div>
	);
}