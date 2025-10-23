"use client";

import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	getProfileByUsername,
	getUserPosts,
	isFollowing,
} from "@/actions/profile.action";
import { getUserStats } from "@/actions/badge.action";
import ProfilePageClient from "./ProfilePageClient";
import Loader from "@/components/Loader";

interface ClientWrapperProps {
	params: { username: string };
	profileUser: NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>;
}

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;
type BadgeStats = Awaited<ReturnType<typeof getUserStats>>;

export default function ClientWrapper({ params, profileUser }: ClientWrapperProps) {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [data, setData] = useState<{
		user: NonNullable<User>;
		posts: Posts;
		isFollowing: boolean;
		badgeStats: BadgeStats;
	} | null>(null);
	const [dataLoading, setDataLoading] = useState(true);

	useEffect(() => {
		if (!loading && !user) {
			router.replace("/signin");
		}
	}, [user, loading, router]);

	useEffect(() => {
		const fetchData = async () => {
			if (!user) return;
			try {
				// Since we already have the profileUser from server, no need to fetch it again
				const [posts, isCurrentUserFollowing, badgeStats] = await Promise.all([
					getUserPosts(profileUser.id),
					isFollowing(profileUser.id, user.uid),
					getUserStats(profileUser.id),
				]);
				setData({
					user: profileUser,
					posts,
					isFollowing: isCurrentUserFollowing,
					badgeStats,
				});
			} catch (error) {
				console.error("Error fetching profile data:", error);
			} finally {
				setDataLoading(false);
			}
		};
		fetchData();
	}, [user, params, profileUser]);

	// Show loader while loading auth or data
	if (loading || !user || dataLoading || !data) {
		return <Loader />;
	}

	return (
		<ProfilePageClient
			user={data.user}
			posts={data.posts}
			isFollowing={data.isFollowing}
			badgeStats={data.badgeStats}
		/>
	);
}
