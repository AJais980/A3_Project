"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/lib/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { getUserByFirebaseId } from "@/actions/user.action";
import {
	HomeIcon,
	UserIcon,
	SearchIcon,
	LogOutIcon,
	MessageCircleIcon
} from "lucide-react";
import { Avatar, AvatarImage } from "./ui/avatar";
import NotificationPanel from "./NotificationPanel";

export function Navigation() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [dbUser, setDbUser] = useState<any>(null);
	const { user, loading } = useAuth();
	const { scrollY } = useScroll();

	// Handle scroll effects
	useMotionValueEvent(scrollY, "change", (latest) => {
		setIsScrolled(latest > 50);
	});

	// Lock/unlock body scroll when mobile menu opens/closes
	useEffect(() => {
		if (isMobileMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		// Cleanup on unmount
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isMobileMenuOpen]);

	// Fetch database user when Firebase user changes
	useEffect(() => {
		const fetchDbUser = async () => {
			if (user?.uid) {
				try {
					const userData = await getUserByFirebaseId(user.uid);
					setDbUser(userData);
				} catch (error) {
					console.error("Error fetching user data:", error);
				}
			} else {
				setDbUser(null);
			}
		};
		fetchDbUser();
	}, [user]);

	const handleSignOut = async () => {
		await signOut(auth);
		setIsMobileMenuOpen(false);
	};

	// Navigation items
	const navItems = [
		{
			name: "Home",
			href: "/",
			icon: HomeIcon,
			gradient: "from-blue-500 to-cyan-500"
		},
		{
			name: "Explore",
			href: "/explore",
			icon: SearchIcon,
			gradient: "from-purple-500 to-pink-500"
		},
		{
			name: "Chats",
			href: user ? "/conversations" : "/signin",
			icon: MessageCircleIcon,
			gradient: "from-orange-500 to-red-500"
		},
		{
			name: "Profile",
			href: user && dbUser?.username ? `/profile/${dbUser.username}` : "/signin",
			icon: UserIcon,
			gradient: "from-green-500 to-emerald-500"
		},
	];

	return (
		<>
			{/* Main Navbar */}
			<motion.nav
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				className="fixed top-4 left-1/2 z-50 w-full max-w-6xl px-4"
				style={{ x: "-50%" }}
			>
				<motion.div
					animate={{
						backgroundColor: isScrolled
							? "rgba(0, 0, 0, 0.8)"
							: "rgba(0, 0, 0, 0.4)",
						backdropFilter: isScrolled ? "blur(20px)" : "blur(10px)",
						borderColor: isScrolled
							? "rgba(255, 255, 255, 0.15)"
							: "rgba(255, 255, 255, 0.1)",
						boxShadow: isScrolled
							? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)"
							: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
					}}
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ring-1 ring-white/5"
				>
					{/* Animated background gradient */}
					<div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-2xl opacity-50" />

					<div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3">
						{/* Logo */}
						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="flex items-center space-x-2"
						>
							<Link href="/" className="flex items-center space-x-2">
								<div className="relative">
									<motion.div
										animate={{ rotate: 360 }}
										transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
										className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center"
									>
										<span className="text-white font-black text-lg">PP</span>
									</motion.div>
									<motion.div
										animate={{ scale: [1, 1.2, 1] }}
										transition={{ duration: 2, repeat: Infinity }}
										className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-lg blur-md"
									/>
								</div>
								<span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
									PeerPulse
								</span>
							</Link>
						</motion.div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-3">
							{navItems.map((item, index) => (
								<motion.div
									key={item.name}
									initial={{ opacity: 0, y: -20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Link href={item.href}>
										<motion.div
											whileHover={{ scale: 1.04, y: -1 }}
											whileTap={{ scale: 0.98 }}
											transition={{
												type: "spring",
												stiffness: 500,
												damping: 30,
												duration: 0.1
											}}
											className="relative group px-5 py-2 rounded-xl transition-all duration-200 overflow-hidden"
										>
											{/* Main hover background */}
											<div className="absolute inset-0 bg-white/12 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out" />

											{/* Gradient accent */}
											<div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-25 rounded-xl transition-all duration-200 ease-out`} />

											<div className="relative flex items-center space-x-2.5 z-10">
												<item.icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-200 ease-out" />
												<span className="text-gray-400 group-hover:text-white font-medium transition-colors duration-200 ease-out">
													{item.name}
												</span>
											</div>
										</motion.div>
									</Link>
								</motion.div>
							))}
						</div>

						{/* User Section */}
						<div className="flex items-center">
							{!loading && (
								<AnimatePresence mode="wait">
									{user ? (
										<motion.div
											key="user-menu"
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											className="flex items-center space-x-3"
										>
											{/* Notification Panel */}
											<NotificationPanel />

											{/* User Avatar */}
											{dbUser && (
												<Link href={`/profile/${dbUser.username}`}>
													<motion.div
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														className="relative"
													>
														<Avatar className="w-8 h-8 ring-2 ring-white/20 hover:ring-white/40 transition-all">
															<AvatarImage src={dbUser.image ?? "/avatar.png"} />
														</Avatar>
														<motion.div
															animate={{ scale: [1, 1.2, 1] }}
															transition={{ duration: 2, repeat: Infinity }}
															className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-cyan-500/30 blur-sm"
														/>
													</motion.div>
												</Link>
											)}

											{/* Logout Button */}
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={handleSignOut}
												className="hidden md:flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300"
											>
												<LogOutIcon className="w-4 h-4" />
												<span className="text-sm font-medium">Logout</span>
											</motion.button>
										</motion.div>
									) : (
										<motion.div
											key="auth-buttons"
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											className="hidden md:flex items-center space-x-3"
										>
											<Link href="/signin">
												<motion.button
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className="px-4 py-2 text-white font-medium rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-all duration-200 cursor-pointer"
												>
													Sign In
												</motion.button>
											</Link>
											<Link href="/signup">
												<motion.button
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
												>
													Sign Up
												</motion.button>
											</Link>
										</motion.div>
									)}
								</AnimatePresence>
							)}

							{/* Mobile Menu Button */}
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="md:hidden p-2 text-gray-300 hover:text-white transition-colors relative flex items-center justify-center"
							>
								<div className="w-6 h-6 flex flex-col justify-center items-center relative">
									{/* Top line */}
									<motion.span
										animate={isMobileMenuOpen ? {
											rotate: 45,
											y: 0,
											transition: { duration: 0.3, ease: "easeInOut" }
										} : {
											rotate: 0,
											y: -8,
											transition: { duration: 0.3, ease: "easeInOut" }
										}}
										className="w-5 h-0.5 bg-current absolute origin-center"
									/>
									{/* Middle line */}
									<motion.span
										animate={isMobileMenuOpen ? {
											opacity: 0,
											scale: 0,
											transition: { duration: 0.2, ease: "easeInOut" }
										} : {
											opacity: 1,
											scale: 1,
											transition: { duration: 0.3, ease: "easeInOut", delay: 0.1 }
										}}
										className="w-5 h-0.5 bg-current absolute"
									/>
									{/* Bottom line */}
									<motion.span
										animate={isMobileMenuOpen ? {
											rotate: -45,
											y: 0,
											transition: { duration: 0.3, ease: "easeInOut" }
										} : {
											rotate: 0,
											y: 8,
											transition: { duration: 0.3, ease: "easeInOut" }
										}}
										className="w-5 h-0.5 bg-current absolute origin-center"
									/>
								</div>
							</motion.button>
						</div>
					</div>
				</motion.div>
			</motion.nav>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
							onClick={() => setIsMobileMenuOpen(false)}
							className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
						/>

						{/* Mobile Menu Panel */}
						<motion.div
							initial={{ opacity: 0, y: -30, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -30, scale: 0.9 }}
							transition={{
								type: "spring",
								damping: 25,
								stiffness: 300,
								duration: 0.4
							}}
							className="fixed top-28 left-4 right-4 z-50 md:hidden"
						>
							<div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
								<div className="p-6">
									{/* Mobile Navigation Items */}
									<div className="space-y-3 mb-6">
										{navItems.map((item, index) => (
											<motion.div
												key={item.name}
												initial={{ opacity: 0, x: -30 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -30 }}
												transition={{
													delay: index * 0.1,
													duration: 0.3,
													ease: "easeOut"
												}}
											>
												<Link
													href={item.href}
													onClick={() => setIsMobileMenuOpen(false)}
												>
													<motion.div
														whileHover={{ scale: 1.02, x: 5 }}
														whileTap={{ scale: 0.98 }}
														transition={{ duration: 0.2 }}
														className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group"
													>
														<div className={`p-2.5 rounded-lg bg-gradient-to-r ${item.gradient} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300`}>
															<item.icon className="w-5 h-5 text-white" />
														</div>
														<span className="text-white font-medium text-lg">{item.name}</span>
													</motion.div>
												</Link>
											</motion.div>
										))}
									</div>

									{/* Mobile User Section */}
									{!loading && (
										<div className="pt-4 border-t border-white/10">
											{user ? (
												<motion.div
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.4, duration: 0.3 }}
													className="space-y-4"
												>
													{dbUser && (
														<div className="flex items-center space-x-3 p-4 rounded-xl bg-white/5">
															<Avatar className="w-10 h-10 ring-2 ring-white/20">
																<AvatarImage src={dbUser.image ?? "/avatar.png"} />
															</Avatar>
															<div>
																<p className="text-white font-medium">{dbUser.name || dbUser.username}</p>
																<p className="text-gray-400 text-sm">@{dbUser.username}</p>
															</div>
														</div>
													)}
													<motion.button
														whileHover={{ scale: 1.02 }}
														whileTap={{ scale: 0.98 }}
														onClick={handleSignOut}
														className="w-full flex items-center space-x-3 p-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-300"
													>
														<LogOutIcon className="w-5 h-5" />
														<span className="font-medium">Sign Out</span>
													</motion.button>
												</motion.div>
											) : (
												<motion.div
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.4, duration: 0.3 }}
													className="space-y-4"
												>
													<Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
														<motion.button
															whileHover={{ scale: 1.02 }}
															whileTap={{ scale: 0.98 }}
															className="w-full p-4 text-white font-medium rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition-all duration-300"
														>
															Sign In
														</motion.button>
													</Link>
													<div className="h-2"></div>
													<Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
														<motion.button
															whileHover={{ scale: 1.02 }}
															whileTap={{ scale: 0.98 }}
															className="w-full p-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg transition-all duration-300"
														>
															Sign Up
														</motion.button>
													</Link>
												</motion.div>
											)}
										</div>
									)}
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}