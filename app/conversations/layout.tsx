"use client";

import { ConversationsSidebar } from "@/components/chat/ConversationsSidebar";
import { usePathname } from "next/navigation";

export default function ConversationsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	// Only show sidebar on chat pages (conversations/[chatId]), not on the main conversations list
	const isChatPage = pathname !== "/conversations" && pathname?.startsWith("/conversations/");

	if (!isChatPage) {
		return children;
	}

	return (
		<div className="flex h-full min-h-screen bg-black">
			<ConversationsSidebar />
			<div className="flex-1 flex flex-col min-w-0">
				{children}
			</div>
		</div>
	);
}
