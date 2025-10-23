"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
	rating?: number; // Current rating (1-5)
	onRatingChange?: (rating: number) => void; // Callback when rating changes
	readonly?: boolean; // Whether the rating is read-only
	size?: "sm" | "md" | "lg"; // Size of the stars
	showText?: boolean; // Whether to show rating text
	loading?: boolean; // Loading state
}

export default function StarRating({
	rating = 0,
	onRatingChange,
	readonly = false,
	size = "md",
	showText = false,
	loading = false,
}: StarRatingProps) {
	const [hoverRating, setHoverRating] = useState(0);

	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
	};

	const handleStarClick = (starRating: number) => {
		if (readonly || loading) return;
		onRatingChange?.(starRating);
	};

	const handleStarHover = (starRating: number) => {
		if (readonly || loading) return;
		setHoverRating(starRating);
	};

	const handleMouseLeave = () => {
		if (readonly || loading) return;
		setHoverRating(0);
	};

	const displayRating = hoverRating || rating;

	const getRatingText = (rating: number) => {
		switch (rating) {
			case 1:
				return "Poor";
			case 2:
				return "Fair";
			case 3:
				return "Good";
			case 4:
				return "Very Good";
			case 5:
				return "Excellent";
			default:
				return "No rating";
		}
	};

	return (
		<div className="flex items-center space-x-1">
			<div className="flex items-center" onMouseLeave={handleMouseLeave}>
				{[1, 2, 3, 4, 5].map((starNumber) => (
					<button
						key={starNumber}
						type="button"
						disabled={readonly || loading}
						className={cn(
							"transition-colors",
							!readonly && !loading && "hover:scale-110 cursor-pointer",
							readonly && "cursor-default",
							loading && "cursor-wait"
						)}
						onClick={() => handleStarClick(starNumber)}
						onMouseEnter={() => handleStarHover(starNumber)}
						aria-label={`Rate ${starNumber} star${starNumber !== 1 ? "s" : ""}`}
					>
						<Star
							className={cn(
								sizeClasses[size],
								"transition-colors",
								starNumber <= displayRating
									? "fill-yellow-400 text-yellow-400"
									: "text-gray-400 hover:text-yellow-300",
								loading && "opacity-50"
							)}
						/>
					</button>
				))}
			</div>

			{showText && (
				<span className="text-sm text-gray-400 ml-2">
					{loading ? "Updating..." : getRatingText(displayRating)}
				</span>
			)}

			{rating > 0 && !showText && (
				<span className="text-xs text-gray-500 ml-1">
					({rating}/5)
				</span>
			)}
		</div>
	);
}