"use client";

import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePostModal from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";
import SearchFilterBar, { FilterOptions, SortOption } from "@/components/SearchFilterBar";
import { useAuth } from "@/lib/useAuth";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

// Import the Post type from your post action file or define it here
type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}

export default function Home() {
	const { user, loading: authLoading } = useAuth();
	const router = useRouter();

	// Redirect to /signin if not authenticated
	useEffect(() => {
		if (!authLoading && !user) {
			router.push("/signin");
		}
	}, [user, authLoading, router]);

	const [posts, setPosts] = useState<Posts>([]);
	const [dbUserId, setDbUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Search and filter state
	const [searchQuery, setSearchQuery] = useState('');
	const [filters, setFilters] = useState<FilterOptions>({ fileType: 'all', username: '' });
	const [sortOption, setSortOption] = useState<SortOption>('latest');

	// Modal state
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const handleNewPost = (newPost: Post) => {
		setPosts(prevPosts => [newPost, ...prevPosts]);
	};

	// Debounced fetch function
	const debouncedFetchPosts = useCallback(
		debounce(async (query: string, filterOptions: FilterOptions, sort: SortOption, userId: string | null) => {
			setIsLoading(true);
			try {
				const postsData = await getPosts({
					searchQuery: query,
					fileType: filterOptions.fileType,
					username: filterOptions.username,
					sortBy: sort,
				});
				setPosts(postsData);
			} catch (error) {
				console.error("Error fetching posts:", error);
			} finally {
				setIsLoading(false);
			}
		}, 300),
		[]
	);

	// Get user ID when user changes
	useEffect(() => {
		const getUserId = async () => {
			if (authLoading) return;

			if (user) {
				const userId = await getDbUserId(user.uid);
				setDbUserId(userId);
				console.log('User ID loaded:', userId);
			} else {
				setDbUserId(null);
			}
		};

		getUserId();
	}, [user, authLoading]);

	// Fetch posts when filters change or on initial load
	useEffect(() => {
		if (authLoading) return;

		const fetchPosts = async () => {
			setIsLoading(true);
			try {
				const postsData = await getPosts({
					searchQuery,
					fileType: filters.fileType,
					username: filters.username,
					sortBy: sortOption,
				});
				setPosts(postsData);
				console.log('Posts loaded:', postsData.length);
			} catch (error) {
				console.error("Error fetching posts:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPosts();
	}, [searchQuery, filters, sortOption, authLoading]);

	const handleSearch = (query: string) => {
		setSearchQuery(query);
	};

	const handleFilterChange = (newFilters: FilterOptions) => {
		setFilters(newFilters);
	};

	const handleSortChange = (sort: SortOption) => {
		setSortOption(sort);
	};

	return (
		<div className="min-h-screen bg-gray-950 py-8">
			<div className="max-w-2xl mx-auto px-4 space-y-6">
				{/* Search and Filter Bar */}
				<SearchFilterBar
					onSearch={handleSearch}
					onFilterChange={handleFilterChange}
					onSortChange={handleSortChange}
				/>

				{/* Posts List */}
				<div className="space-y-6">
					{isLoading ? (
						<>
							{[1, 2, 3].map((n) => (
								<div key={n} className="w-full h-64 bg-gray-800 rounded-lg animate-pulse border border-gray-700" />
							))}
						</>
					) : posts.length === 0 ? (
						<div className="bg-gray-800/50 rounded-lg p-12 text-center border border-gray-700">
							<p className="text-gray-400 text-lg mb-2">No posts found</p>
							<p className="text-gray-500 text-sm">
								{searchQuery || filters.fileType !== 'all' || filters.username
									? 'Try adjusting your search or filters'
									: 'Be the first to create a post!'}
							</p>
						</div>
					) : (
						posts.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								dbUserId={dbUserId}
							/>
						))
					)}
				</div>
			</div>

			{/* Floating Action Button - Instagram Style */}
			{user && (
				<motion.button
					onClick={() => setIsCreateModalOpen(true)}
					className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl shadow-purple-500/50 flex items-center justify-center text-white hover:scale-110 transition-transform z-50 group"
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
				>
					<Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
				</motion.button>
			)}

			{/* Create Post Modal */}
			<CreatePostModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onPostCreated={handleNewPost}
			/>
		</div>
	);
}

