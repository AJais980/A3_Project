/**
 * Search Query Expansion Utility
 * 
 * This utility expands search queries by finding related terms,
 * full forms, and synonyms from the search dictionary.
 */

import { SEARCH_DICTIONARY, getSearchEntry, SearchTerm } from './searchDictionary';

export interface ExpandedSearch {
	/** Original search query */
	originalQuery: string;
	/** All terms to search for (including original) */
	searchTerms: string[];
	/** Matched dictionary entries with details */
	matchedEntries: SearchTermMatch[];
	/** Whether any expansion was applied */
	wasExpanded: boolean;
}

export interface SearchTermMatch {
	/** The term that was matched */
	matchedTerm: string;
	/** The dictionary entry */
	entry: SearchTerm;
	/** How the term was matched */
	matchType: 'exact' | 'fullform' | 'related';
}

/**
 * Expand a search query to include related terms
 */
export function expandSearchQuery(query: string): ExpandedSearch {
	const originalQuery = query.trim();
	const queryLower = originalQuery.toLowerCase();
	const words = queryLower.split(/\s+/).filter(w => w.length > 0);

	const searchTerms = new Set<string>();
	const matchedEntries: SearchTermMatch[] = [];

	// Always include the original query
	if (originalQuery) {
		searchTerms.add(originalQuery);
	}

	// Check each word in the query
	words.forEach(word => {
		// Add the word itself
		searchTerms.add(word);

		// Check if it's a known abbreviation
		const entry = getSearchEntry(word);
		if (entry) {
			// Add the full form
			searchTerms.add(entry.fullForm.toLowerCase());

			// Add key related terms (limit to avoid too many)
			entry.related.slice(0, 5).forEach(related => {
				searchTerms.add(related.toLowerCase());
			});

			matchedEntries.push({
				matchedTerm: word,
				entry,
				matchType: 'exact'
			});
		}

		// Check if the word matches any full form
		SEARCH_DICTIONARY.forEach(dictEntry => {
			const fullFormLower = dictEntry.fullForm.toLowerCase();
			const fullFormWords = fullFormLower.split(/\s+/);

			// Check if word is part of a full form
			if (fullFormWords.includes(word) && word.length > 3) {
				// Add the abbreviation
				searchTerms.add(dictEntry.term.toLowerCase());

				// Check if we already have this entry
				const alreadyMatched = matchedEntries.some(
					m => m.entry.term === dictEntry.term && m.matchType === 'fullform'
				);

				if (!alreadyMatched) {
					matchedEntries.push({
						matchedTerm: word,
						entry: dictEntry,
						matchType: 'fullform'
					});
				}
			}
		});
	});

	// Convert to array and remove duplicates
	const searchTermsArray = Array.from(searchTerms).filter(t => t.length > 0);

	return {
		originalQuery,
		searchTerms: searchTermsArray,
		matchedEntries,
		wasExpanded: matchedEntries.length > 0
	};
}

/**
 * Get display-friendly expansion info for showing in UI
 */
export interface ExpansionInfo {
	/** Original term that was expanded */
	original: string;
	/** Full form of the abbreviation */
	fullForm: string;
	/** Category of the term */
	category: string;
	/** Related terms being searched */
	relatedTerms: string[];
}

export function getExpansionInfo(query: string): ExpansionInfo[] {
	const expanded = expandSearchQuery(query);

	return expanded.matchedEntries
		.filter(match => match.matchType === 'exact')
		.map(match => ({
			original: match.entry.term.toUpperCase(),
			fullForm: match.entry.fullForm,
			category: match.entry.category,
			relatedTerms: match.entry.related.slice(0, 5)
		}));
}

/**
 * Quick check if a query would be expanded
 */
export function wouldExpand(query: string): boolean {
	const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
	return words.some(word => getSearchEntry(word) !== undefined);
}

/**
 * Get suggestions as user types (for autocomplete)
 */
export interface SearchSuggestion {
	term: string;
	fullForm: string;
	category: string;
	type: 'abbreviation' | 'term';
}

export function getSearchSuggestions(partialQuery: string, limit: number = 8): SearchSuggestion[] {
	const queryLower = partialQuery.toLowerCase().trim();

	if (queryLower.length < 1) {
		return [];
	}

	const suggestions: SearchSuggestion[] = [];
	const seen = new Set<string>();

	// First, find exact prefix matches on abbreviations
	SEARCH_DICTIONARY.forEach(entry => {
		if (entry.term.toLowerCase().startsWith(queryLower) && !seen.has(entry.term)) {
			suggestions.push({
				term: entry.term.toUpperCase(),
				fullForm: entry.fullForm,
				category: entry.category,
				type: 'abbreviation'
			});
			seen.add(entry.term);
		}
	});

	// Then, find matches in full forms
	SEARCH_DICTIONARY.forEach(entry => {
		if (suggestions.length >= limit) return;

		if (entry.fullForm.toLowerCase().includes(queryLower) && !seen.has(entry.term)) {
			suggestions.push({
				term: entry.term.toUpperCase(),
				fullForm: entry.fullForm,
				category: entry.category,
				type: 'abbreviation'
			});
			seen.add(entry.term);
		}
	});

	// Also find matches in related terms
	SEARCH_DICTIONARY.forEach(entry => {
		if (suggestions.length >= limit) return;

		const hasRelatedMatch = entry.related.some(r =>
			r.toLowerCase().includes(queryLower)
		);

		if (hasRelatedMatch && !seen.has(entry.term)) {
			suggestions.push({
				term: entry.term.toUpperCase(),
				fullForm: entry.fullForm,
				category: entry.category,
				type: 'abbreviation'
			});
			seen.add(entry.term);
		}
	});

	return suggestions.slice(0, limit);
}

/**
 * Build a search string for database query with OR logic
 * Returns terms that should be searched with OR condition
 */
export function buildSearchTerms(query: string): string[] {
	const expanded = expandSearchQuery(query);
	return expanded.searchTerms;
}
