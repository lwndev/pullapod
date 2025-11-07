/**
 * Search command implementation
 * Allows users to search for podcasts using Podcast Index API
 */

import { Command } from 'commander';
import { PodcastIndexClient } from '../clients/podcast-index-client';
import { loadConfig } from '../config';
import { formatSearchResults } from '../formatters/search-formatter';
import { sanitizeSearchQuery, validateRange } from '../utils/validation';
import { formatErrorMessage } from '../utils/errors';

export interface SearchOptions {
  max?: string;
  titleOnly?: boolean;
  similar?: boolean;
  language?: string;
}

/**
 * Execute search command
 */
export async function searchCommand(query: string, options: SearchOptions): Promise<void> {
  try {
    // Validate and parse options
    const maxResults = options.max ? parseInt(options.max, 10) : 10;
    validateRange(maxResults, 1, 100, 'Max results');

    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) {
      console.error('Error: Search query cannot be empty');
      process.exit(1);
    }

    // Initialize client
    const config = loadConfig();
    if (!config.podcastIndex.apiKey || !config.podcastIndex.apiSecret) {
      console.error('Error: Podcast Index API credentials not configured.');
      console.error('Please set PODCAST_INDEX_API_KEY and PODCAST_INDEX_API_SECRET environment variables.');
      console.error('You can get API keys at https://api.podcastindex.org/');
      process.exit(1);
    }

    const client = new PodcastIndexClient({
      apiKey: config.podcastIndex.apiKey,
      apiSecret: config.podcastIndex.apiSecret,
    });

    // Perform search
    console.log(`Searching for "${sanitizedQuery}"...`);

    let response;
    if (options.titleOnly) {
      // Search by title only
      response = await client.searchByTitle({
        q: sanitizedQuery,
        max: maxResults,
        similar: options.similar,
      });
    } else {
      // Search by term (searches title, author, description, etc.)
      response = await client.searchByTerm({
        q: sanitizedQuery,
        max: maxResults,
      });
    }

    // Filter by language if specified
    let feeds = response.feeds || [];
    if (options.language) {
      const langFilter = options.language.toLowerCase();
      feeds = feeds.filter(
        (feed) => feed.language && feed.language.toLowerCase() === langFilter
      );
    }

    // Format and display results
    const output = formatSearchResults(feeds);
    console.log('\n' + output);

    // Exit successfully (even with no results, per requirements FR-5)
    process.exit(0);
  } catch (error) {
    console.error('\nError:', formatErrorMessage(error));
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Register search command with Commander
 */
export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('Search for podcasts by title, author, or keywords')
    .argument('<query>', 'Search query')
    .option('--max <number>', 'Maximum number of results (1-100)', '10')
    .option('--title-only', 'Search titles only (more precise)')
    .option('--similar', 'Include similar matches (fuzzy matching)')
    .option('--language <code>', 'Filter by language code (e.g., "en", "es")')
    .action(searchCommand);
}
