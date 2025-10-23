"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
	Sparkles,
	Users,
	MessageCircle,
	TrendingUp,
	Shield,
	Zap,
	ArrowRight,
	CheckCircle,
	Star,
	Code,
	FileText,
	Image as ImageIcon,
	Github,
	Linkedin,
	Mail
} from 'lucide-react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/useAuth';

export default function LandingPage() {
	const { scrollYProgress } = useScroll();
	const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
	const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
	const { user } = useAuth();

	// Team members data
	const team = [
		{
			name: "Aman Jaiswal",
			role: "Frontend & Backend Lead",
			image: "/images/Aman.jpg",
			linkedin: "https://www.linkedin.com/in/beingaman?utm_",
			github: "https://github.com/AJais980"
		},
		{
			name: "Akash Das",
			role: "Design & Frontend Lead",
			image: "/images/Akash.png",
			linkedin: "https://www.linkedin.com/in/akash-das-b504a2272?utm_",
			github: "https://github.com/Akxxhhxd"
		},
		{
			name: "Anuvab Munshi",
			role: "Backend Co-Lead",
			image: "/images/Anuvab.png",
			linkedin: "https://www.linkedin.com/in/anuvab-munshi",
			github: "https://github.com/A-Munshi"
		},
		{
			name: "Arijit Adhikary",
			role: "Frontend Co-Lead",
			image: "/images/Arijit.jpg",
			linkedin: "https://www.linkedin.com/in/arijit-adhikary-596a88281",
			github: "https://github.com/canUgitMe"
		},
		{
			name: "Anupama Bain",
			role: "Research & Content Lead",
			image: "/images/Anupama.png",
			linkedin: "https://www.linkedin.com/in/anupama-bain-36b263282",
			github: "https://github.com/anupamabain"
		},
		{
			name: "Anushka Midda",
			role: "Research & Content Co-Lead",
			image: "/images/Anushka.png",
			linkedin: "https://www.linkedin.com/in/anushka-midda-4a8144282",
			github: "https://github.com/anushkamidda"
		}
	];

	const features = [
		{
			icon: MessageCircle,
			title: "Micro-Feedback System",
			description: "Receive quick, constructive feedback on presentations, resumes, interviews, and communication skills, anonymously and growth-focused.",
			color: "from-purple-500 to-pink-500"
		},
		{
			icon: Users,
			title: "Guidance & Help Forums",
			description: "Ask questions, seek advice, and share insights on academic, career, and workplace challenges. Build a culture of mentorship and support.",
			color: "from-blue-500 to-cyan-500"
		},
		{
			icon: FileText,
			title: "Resume & Portfolio Reviews",
			description: "Upload your resume or portfolio and get structured peer or professional feedback that actually helps you grow.",
			color: "from-green-500 to-emerald-500"
		},
		{
			icon: Shield,
			title: "Professional Profiles",
			description: "Every registered user has a profile that highlights their role like Student, Educator, or Professional, making feedback contextual.",
			color: "from-yellow-500 to-orange-500"
		},
		{
			icon: Zap,
			title: "Skill Exchange & Collaboration",
			description: "Connect with peers in your network to share & learn skills whether it's coding, design, or public speaking.",
			color: "from-indigo-500 to-purple-500"
		},
		{
			icon: Sparkles,
			title: "Achievement Badges",
			description: "Earn recognition badges based on your contribution quality - from Rising Helper to Legendary Guide status.",
			color: "from-pink-500 to-red-500"
		}
	];

	const stats = [
		{ value: "5K+", label: "Active Members" },
		{ value: "50K+", label: "Feedback Sessions" },
		{ value: "96%", label: "Growth Rate" },
		{ value: "24/7", label: "Peer Support" }
	];

	const useCases = [
		{
			icon: FileText,
			title: "Resume Reviews",
			description: "Perfect your resume with feedback from industry professionals"
		},
		{
			icon: Code,
			title: "Code Reviews",
			description: "Improve your coding skills with peer programming insights"
		},
		{
			icon: ImageIcon,
			title: "Design Feedback",
			description: "Get constructive critiques on your creative work"
		}
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
			{/* Existing Navigation Component */}
			<Navigation />

			{/* Hero Section */}
			<section className="relative min-h-screen flex items-center justify-center pt-32 px-4 overflow-hidden">
				{/* Animated Background */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl top-20 -left-20 animate-pulse"></div>
					<div className="absolute w-96 h-96 bg-pink-600/20 rounded-full blur-3xl bottom-20 -right-20 animate-pulse delay-1000"></div>
					<div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
				</div>

				<motion.div
					style={{ opacity, scale }}
					className="relative z-10 max-w-6xl mx-auto text-center"
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						<div className="inline-flex items-center space-x-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-8">
							<Star className="w-4 h-4 text-purple-400" />
							<span className="text-sm text-purple-300">Professional Growth Through Peer Feedback</span>
						</div>

						<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
							<span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
								Elevate Your Skills
							</span>
							<br />
							<span className="text-white">Through Peer Feedback</span>
						</h1>

						<p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
							The professional social platform that empowers students, educators, and professionals to receive constructive micro-feedback on soft skills, presentations, resumes, and professional growth.
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<Link
								href={user ? "/explore" : "/signup"}
								className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl shadow-purple-500/50 flex items-center space-x-2 text-lg font-semibold"
							>
								<span>Start for Free</span>
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
							</Link>
							<a
								href="#features"
								className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all text-lg font-semibold"
							>
								Learn More
							</a>
						</div>						{/* Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
							{stats.map((stat, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 * index }}
									className="text-center"
								>
									<div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
										{stat.value}
									</div>
									<div className="text-gray-400">{stat.label}</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				</motion.div>

				{/* Scroll Indicator */}
				<motion.div
					animate={{ y: [0, 10, 0] }}
					transition={{ repeat: Infinity, duration: 2 }}
					className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
				>
					<div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2">
						<div className="w-1 h-3 bg-gradient-to-b from-purple-500 to-transparent rounded-full"></div>
					</div>
				</motion.div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-20 px-4 relative">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Powerful Features
							</span>
						</h2>
						<p className="text-xl text-gray-400 max-w-2xl mx-auto">
							Everything you need to grow your skills and help others succeed
						</p>
					</motion.div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
								className="group bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
							>
								<div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
									<feature.icon className="w-7 h-7 text-white" />
								</div>
								<h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
								<p className="text-gray-400 leading-relaxed">{feature.description}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Use Cases Section */}
			<section className="py-20 px-4 bg-gradient-to-b from-transparent to-gray-900/50">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Perfect For Every Use Case
							</span>
						</h2>
						<p className="text-xl text-gray-400">
							Share any type of content and get valuable feedback
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-8">
						{useCases.map((useCase, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, scale: 0.9 }}
								whileInView={{ opacity: 1, scale: 1 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
								className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-all"
							>
								<div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
									<useCase.icon className="w-8 h-8 text-white" />
								</div>
								<h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
								<p className="text-gray-400">{useCase.description}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section id="how-it-works" className="py-20 px-4">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								How PeerPulse Works
							</span>
						</h2>
						<p className="text-xl text-gray-400">
							Getting started is simple and takes less than a minute
						</p>
					</motion.div>

					<div className="grid md:grid-cols-4 gap-8">
						{[
							{ step: "01", title: "Sign Up", desc: "Create your free account with Google" },
							{ step: "02", title: "Upload", desc: "Share your work - docs, code, or designs" },
							{ step: "03", title: "Get Feedback", desc: "Receive constructive reviews from peers" },
							{ step: "04", title: "Grow & Help", desc: "Improve and give back to the community" }
						].map((item, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
								className="relative text-center"
							>
								<div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg shadow-purple-500/50">
									{item.step}
								</div>
								<h3 className="text-2xl font-bold mb-3">{item.title}</h3>
								<p className="text-gray-400">{item.desc}</p>
								{index < 3 && (
									<div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-600 to-transparent -z-10"></div>
								)}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Team Section */}
			<section id="team" className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-transparent">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Meet Our Team
							</span>
						</h2>
						<p className="text-xl text-gray-400">
							The minds behind PeerPulse
						</p>
					</motion.div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{team.map((member, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, scale: 0.9 }}
								whileInView={{ opacity: 1, scale: 1 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
								className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-all group"
							>
								<div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden border-4 border-purple-600/50 shadow-lg shadow-purple-500/50">
									<img
										src={member.image}
										alt={member.name}
										className="w-full h-full object-cover"
									/>
								</div>
								<h3 className="text-2xl font-bold mb-2">{member.name}</h3>
								<p className="text-purple-400 mb-4">{member.role}</p>
								<div className="flex items-center justify-center space-x-4">
									<a
										href={member.linkedin}
										target="_blank"
										rel="noopener noreferrer"
										className="text-gray-400 hover:text-purple-400 transition-colors"
									>
										<Linkedin className="w-5 h-5" />
									</a>
									{member.github && (
										<a
											href={member.github}
											target="_blank"
											rel="noopener noreferrer"
											className="text-gray-400 hover:text-purple-400 transition-colors"
										>
											<Github className="w-5 h-5" />
										</a>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Badge System Preview */}
			<section className="py-20 px-4">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-3xl p-12 text-center"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Earn Recognition
							</span>
						</h2>
						<p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
							Progress through our 5-tier badge system as you help others and improve your skills. Earn recognition for your valuable contributions to the community.
						</p>
						<div className="flex flex-wrap items-stretch justify-center gap-2 lg:gap-3">
							{[
								{ name: "Rising Helper", stars: "2.5★", minRatings: "5 ratings", description: "Consistently providing helpful feedback" },
								{ name: "Helpful Mind", stars: "3.5★", minRatings: "5 ratings", description: "Great insights and constructive comments" },
								{ name: "Trusted Advisor", stars: "4.0★", minRatings: "10 ratings", description: "Reliable and valuable guidance" },
								{ name: "Star Mentor", stars: "4.5★", minRatings: "15 ratings", description: "Exceptional mentoring and advice" },
								{ name: "Legendary Guide", stars: "4.8★", minRatings: "20 ratings", description: "The pinnacle of helpful community members" }
							].map((badge, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{
										opacity: { delay: index * 0.1 },
										type: "spring",
										stiffness: 400,
										damping: 17,
										duration: 0.15
									}}
									whileHover={{ scale: 1.03, y: -8 }}
									className="bg-gray-900 border border-purple-500/50 rounded-xl px-5 py-4 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-150 group cursor-pointer w-[220px] flex-shrink-0"
								>
									<div className="text-yellow-400 text-2xl font-bold mb-2 group-hover:scale-110 transition-transform duration-150">{badge.stars}</div>
									<div className="text-base font-semibold text-white mb-2 leading-tight group-hover:text-purple-300 transition-colors duration-150">{badge.name}</div>
									<div className="text-xs text-purple-400 mb-2">{badge.minRatings}</div>
									<div className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-150">{badge.description}</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-4">
				<div className="max-w-4xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
					>
						<h2 className="text-4xl md:text-6xl font-bold mb-6">
							Ready to{' '}
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Level Up?
							</span>
						</h2>
						<p className="text-xl text-gray-400 mb-10">
							Join thousands of professionals improving their skills through peer feedback
						</p>
						<Link
							href={user ? "/explore" : "/signup"}
							className="inline-flex items-center space-x-2 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl shadow-purple-500/50 text-lg font-semibold group"
						>
							<span>Get Started Free</span>
							<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
						</Link>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-gray-800 py-8 px-4">
				<div className="max-w-7xl mx-auto">
					<div className="text-center text-gray-400 text-sm">
						<p>© 2025 PeerPulse. All rights reserved. Built with ❤️ by Team A3</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
