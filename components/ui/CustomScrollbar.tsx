"use client";

import React from "react";

interface CustomScrollbarProps {
	children: React.ReactNode;
	className?: string;
	onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
	scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function CustomScrollbar({ children, className = "", onScroll, scrollRef }: CustomScrollbarProps) {
	return (
		<div
			ref={scrollRef}
			onScroll={onScroll}
			className={`overflow-y-auto overflow-x-hidden scroll-smooth ${className}`}
			style={{
				scrollBehavior: 'smooth'
			}}
		>
			{children}
		</div>
	);
}
