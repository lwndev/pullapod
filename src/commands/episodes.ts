/**
 * Episodes command implementation
 * Allows users to preview recent episodes from a podcast feed
 */

import { Command } from 'commander';
import { PodcastIndexClient } from '../clients/podcast-index-client';
import { loadConfig } from '../config';
import { formatEpisodesList } from '../formatters/episodes-formatter';
import { detectFeedIdOrUrl, validateRange, requireValidDate } from '../utils/validation';
import { formatErrorMessage } from '../utils/errors';

export interface EpisodesOptions {
  max?: string;
  since?: string;
  full?: boolean;
}

/**
 * Convert YYYY-MM-DD date to Unix timestamp
 */
function dateToTimestamp(dateString: string): number {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Execute episodes command
 */
export async function episodesCommand(
  feedInput: string,
  options: EpisodesOptions
): Promise<void> {
  try {
    // Validate and parse options
    const maxResults = options.max ? parseInt(options.max, 10) : 20;
    validateRange(maxResults, 1, 100, 'Max episodes');

    // Validate date if provided
    let sinceTimestamp: number | undefined;
    if (options.since) {
      requireValidDate(options.since, '--since');
      sinceTimestamp = dateToTimestamp(options.since);
    }

    // Initialize client
    const config = loadConfig();
    if (!config.podcastIndex.apiKey || !config.podcastIndex.apiSecret) {
      console.error('Error: Podcast Index API credentials not configured.');
      console.error(
        'Please set PODCAST_INDEX_API_KEY and PODCAST_INDEX_API_SECRET environment variables.'
      );
      console.error('You can get API keys at https://api.podcastindex.org/');
      process.exit(1);
    }

    const client = new PodcastIndexClient({
      apiKey: config.podcastIndex.apiKey,
      apiSecret: config.podcastIndex.apiSecret,
    });

    // Detect if input is feed ID or URL
    const feedDetection = detectFeedIdOrUrl(feedInput);

    console.log(`Fetching episodes from ${feedDetection.type === 'id' ? 'feed ID' : 'feed URL'}...`);

    // Fetch episodes based on input type
    let response;
    if (feedDetection.type === 'id') {
      response = await client.getEpisodesByFeedId({
        id: feedDetection.value as number,
        max: maxResults,
        since: sinceTimestamp,
        fulltext: true,
      });
    } else {
      response = await client.getEpisodesByFeedUrl({
        url: feedDetection.value as string,
        max: maxResults,
        since: sinceTimestamp,
        fulltext: true,
      });
    }

    // Check if we got a valid response
    if (!response.items || response.items.length === 0) {
      if (options.since) {
        console.log('No episodes found matching the specified date filter.');
      } else {
        console.log('No episodes found for this feed.');
      }
      process.exit(0);
    }

    // Get podcast title from first episode
    const podcastTitle = response.items[0]?.feedTitle || 'Unknown Podcast';

    // Format and display results
    const output = formatEpisodesList(
      response.items,
      podcastTitle,
      options.full || false,
      maxResults
    );
    console.log('\n' + output);

    // Exit successfully
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
 * Register episodes command with Commander
 */
export function registerEpisodesCommand(program: Command): void {
  program
    .command('episodes')
    .description('Preview recent episodes from a podcast feed')
    .argument('<feed>', 'RSS feed URL or Podcast Index feed ID')
    .option('--max <number>', 'Maximum episodes to show (1-100)', '20')
    .option('--since <date>', 'Only episodes after date (YYYY-MM-DD format)')
    .option('--full', 'Show full descriptions instead of truncated')
    .action(episodesCommand);
}
