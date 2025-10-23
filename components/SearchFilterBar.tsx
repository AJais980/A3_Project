"use client";

import React, { useState } from 'react';
import { Search, X, Filter, SlidersHorizontal, FileText, Image, Code, User, Clock, Heart, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchFilterBarProps {
	onSearch: (query: string) => void;
	onFilterChange: (filters: FilterOptions) => void;
	onSortChange: (sort: SortOption) => void;
}

export interface FilterOptions {
	fileType: 'all' | 'pdf' | 'code' | 'image';
	username?: string;
}

export type SortOption = 'latest' | 'mostLiked' | 'mostCommented';

export default function SearchFilterBar({ onSearch, onFilterChange, onSortChange }: SearchFilterBarProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [activeFileType, setActiveFileType] = useState<FilterOptions['fileType']>('all');
	const [usernameFilter, setUsernameFilter] = useState('');
	const [activeSortOption, setActiveSortOption] = useState<SortOption>('latest');

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		onSearch(value);
	};

	const handleClearSearch = () => {
		setSearchQuery('');
		onSearch('');
	};

	const handleFileTypeChange = (type: FilterOptions['fileType']) => {
		setActiveFileType(type);
		onFilterChange({ fileType: type, username: usernameFilter });
	};

	const handleUsernameFilterChange = (username: string) => {
		setUsernameFilter(username);
		onFilterChange({ fileType: activeFileType, username });
	};

	const handleSortChange = (sort: SortOption) => {
		setActiveSortOption(sort);
		onSortChange(sort);
	};

	const activeFiltersCount =
		(activeFileType !== 'all' ? 1 : 0) +
		(usernameFilter ? 1 : 0) +
		(activeSortOption !== 'latest' ? 1 : 0);

	return (
		<div className="w-full space-y-4">
			{/* Search Bar */}
			<div className="relative">
				<div className="flex items-center space-x-3">
					{/* Search Input */}
					<div className="relative flex-1">
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search posts by content, keywords..."
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="w-full pl-12 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
						/>
						{searchQuery && (
							<button
								onClick={handleClearSearch}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						)}
					</div>

					{/* Filter Toggle Button */}
					<button
						onClick={() => setShowFilters(!showFilters)}
						className={`relative p-3 rounded-lg border transition-all ${showFilters || activeFiltersCount > 0
							? 'bg-purple-600 border-purple-500 text-white'
							: 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
							}`}
					>
						<SlidersHorizontal className="w-5 h-5" />
						{activeFiltersCount > 0 && (
							<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
								{activeFiltersCount}
							</span>
						)}
					</button>
				</div>
			</div>

			{/* Filters Panel */}
			<AnimatePresence>
				{showFilters && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-6">
							{/* Sort Options */}
							<div>
								<h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
									<Filter className="w-4 h-4 mr-2" />
									Sort By
								</h3>
								<div className="flex flex-wrap gap-2">
									{[
										{ value: 'latest' as SortOption, label: 'Latest First', icon: Clock },
										{ value: 'mostLiked' as SortOption, label: 'Most Liked', icon: Heart },
										{ value: 'mostCommented' as SortOption, label: 'Most Commented', icon: MessageCircle }
									].map((option) => {
										const IconComponent = option.icon;
										return (
											<button
												key={option.value}
												onClick={() => handleSortChange(option.value)}
												className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${activeSortOption === option.value
													? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
													: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
													}`}
											>
												<IconComponent className="w-4 h-4" />
												<span>{option.label}</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* File Type Filter */}
							<div>
								<h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
									<FileText className="w-4 h-4 mr-2" />
									Content Type
								</h3>
								<div className="flex flex-wrap gap-2">
									{[
										{ value: 'all' as const, label: 'All Posts', icon: FileText },
										{ value: 'pdf' as const, label: 'PDFs', icon: FileText },
										{ value: 'code' as const, label: 'Code', icon: Code },
										{ value: 'image' as const, label: 'Images', icon: Image }
									].map((type) => (
										<button
											key={type.value}
											onClick={() => handleFileTypeChange(type.value)}
											className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${activeFileType === type.value
												? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
												: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
												}`}
										>
											<type.icon className="w-4 h-4" />
											<span>{type.label}</span>
										</button>
									))}
								</div>
							</div>

							{/* Username Filter */}
							<div>
								<h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
									<User className="w-4 h-4 mr-2" />
									Filter by User
								</h3>
								<div className="relative">
									<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<input
										type="text"
										placeholder="Enter username..."
										value={usernameFilter}
										onChange={(e) => handleUsernameFilterChange(e.target.value)}
										className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
									/>
									{usernameFilter && (
										<button
											onClick={() => handleUsernameFilterChange('')}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
										>
											<X className="w-4 h-4" />
										</button>
									)}
								</div>
							</div>

							{/* Clear All Filters */}
							{activeFiltersCount > 0 && (
								<div className="pt-4 border-t border-gray-700">
									<button
										onClick={() => {
											setActiveFileType('all');
											setUsernameFilter('');
											setActiveSortOption('latest');
											onFilterChange({ fileType: 'all', username: '' });
											onSortChange('latest');
										}}
										className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
									>
										<X className="w-4 h-4" />
										<span>Clear All Filters</span>
									</button>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Active Filters Display */}
			{activeFiltersCount > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm text-gray-400">Active filters:</span>
					{activeFileType !== 'all' && (
						<span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-medium flex items-center space-x-1">
							<span>Type: {activeFileType.toUpperCase()}</span>
							<button onClick={() => handleFileTypeChange('all')} className="hover:text-white">
								<X className="w-3 h-3" />
							</button>
						</span>
					)}
					{usernameFilter && (
						<span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-medium flex items-center space-x-1">
							<span>User: @{usernameFilter}</span>
							<button onClick={() => handleUsernameFilterChange('')} className="hover:text-white">
								<X className="w-3 h-3" />
							</button>
						</span>
					)}
					{activeSortOption !== 'latest' && (
						<span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-medium flex items-center space-x-1">
							<span>Sort: {activeSortOption === 'mostLiked' ? 'Most Liked' : 'Most Commented'}</span>
							<button onClick={() => handleSortChange('latest')} className="hover:text-white">
								<X className="w-3 h-3" />
							</button>
						</span>
					)}
				</div>
			)}
		</div>
	);
}
