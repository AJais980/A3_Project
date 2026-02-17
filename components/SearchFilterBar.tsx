"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Filter, SlidersHorizontal, FileText, Image, Code, User, Clock, Heart, MessageCircle, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchSuggestions, getExpansionInfo, SearchSuggestion, ExpansionInfo } from '@/lib/searchExpansion';

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

	// New state for suggestions and expansions
	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [expansionInfo, setExpansionInfo] = useState<ExpansionInfo[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
	const [hasSearched, setHasSearched] = useState(false); // Track if a search has been submitted
	const searchInputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const isSelectingSuggestion = useRef(false); // Flag to prevent race conditions

	// Update suggestions as user types (local only, no API call)
	useEffect(() => {
		if (searchQuery.trim().length > 0) {
			const newSuggestions = getSearchSuggestions(searchQuery, 6);
			setSuggestions(newSuggestions);
			if (!isSelectingSuggestion.current) {
				setShowSuggestions(newSuggestions.length > 0);
			}
		} else {
			setSuggestions([]);
			setShowSuggestions(false);
		}
		setSelectedSuggestionIndex(-1);
	}, [searchQuery]);

	// Update expansion info only when search has been submitted
	useEffect(() => {
		if (hasSearched && searchQuery.trim().length > 0) {
			const info = getExpansionInfo(searchQuery);
			setExpansionInfo(info);
		} else if (!searchQuery.trim()) {
			setExpansionInfo([]);
		}
	}, [searchQuery, hasSearched]);

	// Handle click outside to close suggestions
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(event.target as Node) &&
				searchInputRef.current &&
				!searchInputRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Handle input change - only update local state, no API call
	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		// Reset hasSearched when user modifies the query
		if (hasSearched) {
			setHasSearched(false);
			setExpansionInfo([]);
		}
	};

	// Execute the search (called on Enter or suggestion click)
	const executeSearch = (query: string) => {
		setHasSearched(true);
		setShowSuggestions(false);
		setSelectedSuggestionIndex(-1);
		onSearch(query);
	};

	const handleClearSearch = () => {
		setSearchQuery('');
		setExpansionInfo([]);
		setSuggestions([]);
		setShowSuggestions(false);
		setHasSearched(false);
		onSearch('');
	};

	const handleSuggestionClick = (suggestion: SearchSuggestion, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		isSelectingSuggestion.current = true;
		setSearchQuery(suggestion.term);
		setShowSuggestions(false);
		setSelectedSuggestionIndex(-1);
		setHasSearched(true);
		onSearch(suggestion.term);
		// Reset the flag after a short delay
		setTimeout(() => {
			isSelectingSuggestion.current = false;
		}, 100);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		switch (e.key) {
			case 'ArrowDown':
				if (showSuggestions && suggestions.length > 0) {
					e.preventDefault();
					setSelectedSuggestionIndex(prev =>
						prev < suggestions.length - 1 ? prev + 1 : prev
					);
				}
				break;
			case 'ArrowUp':
				if (showSuggestions && suggestions.length > 0) {
					e.preventDefault();
					setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
				}
				break;
			case 'Enter':
				e.preventDefault();
				// If a suggestion is selected, use that
				if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
					const suggestion = suggestions[selectedSuggestionIndex];
					setSearchQuery(suggestion.term);
					executeSearch(suggestion.term);
				} else if (searchQuery.trim()) {
					// Otherwise search with current query
					executeSearch(searchQuery.trim());
				}
				break;
			case 'Escape':
				setShowSuggestions(false);
				setSelectedSuggestionIndex(-1);
				break;
		}
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
					{/* Search Input with Suggestions */}
					<div className="relative flex-1">
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
						<input
							ref={searchInputRef}
							type="text"
							placeholder="Search posts by content, keywords, abbreviations..."
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							onKeyDown={handleKeyDown}
							onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
							className="w-full pl-12 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
						/>
						{searchQuery && (
							<button
								onClick={handleClearSearch}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
							>
								<X className="w-5 h-5" />
							</button>
						)}

						{/* Suggestions Dropdown */}
						<AnimatePresence>
							{showSuggestions && suggestions.length > 0 && (
								<motion.div
									ref={suggestionsRef}
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.15 }}
									className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
								>
									<div className="p-2 border-b border-gray-700/50">
										<span className="text-xs text-gray-400 flex items-center gap-1.5">
											<Sparkles className="w-3 h-3 text-purple-400" />
											Smart suggestions
										</span>
									</div>
									<div className="max-h-64 overflow-y-auto">
										{suggestions.map((suggestion, index) => (
											<button
												type="button"
												key={`${suggestion.term}-${index}`}
												onMouseDown={(e) => handleSuggestionClick(suggestion, e)}
												className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all ${index === selectedSuggestionIndex
														? 'bg-purple-600/20 border-l-2 border-purple-500'
														: 'hover:bg-gray-700/50 border-l-2 border-transparent'
													}`}
											>
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
														<span className="text-purple-400 text-xs font-bold">
															{suggestion.term.slice(0, 2)}
														</span>
													</div>
													<div>
														<div className="text-white font-medium text-sm">
															{suggestion.term}
														</div>
														<div className="text-gray-400 text-xs truncate max-w-50">
															{suggestion.fullForm}
														</div>
													</div>
												</div>
												<span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
													{suggestion.category}
												</span>
											</button>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
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

			{/* Smart Search Expansion Info */}
			<AnimatePresence>
				{expansionInfo.length > 0 && searchQuery.trim() && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="bg-linear-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-3">
								<div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center">
									<Sparkles className="w-3.5 h-3.5 text-purple-400" />
								</div>
								<span className="text-sm font-medium text-purple-300">
									Smart Search Active
								</span>
							</div>

							<div className="space-y-3">
								{expansionInfo.map((info, index) => (
									<div key={index} className="bg-gray-800/50 rounded-lg p-3">
										<div className="flex items-center gap-2 mb-2">
											<span className="text-white font-semibold text-sm">
												{info.original}
											</span>
											<ArrowRight className="w-3 h-3 text-gray-500" />
											<span className="text-purple-300 text-sm">
												{info.fullForm}
											</span>
											<span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-400">
												{info.category}
											</span>
										</div>

										<div className="flex flex-wrap gap-1.5">
											<span className="text-xs text-gray-400 mr-1">Also searching:</span>
											{info.relatedTerms.map((term, termIndex) => (
												<span
													key={termIndex}
													className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-700/50 text-gray-300 text-xs"
												>
													<Tag className="w-2.5 h-2.5" />
													{term}
												</span>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
