/**
 * Search result formatting
 */

import { PodcastFeed } from '../clients/podcast-index-types';
import { truncateText, stripHtml, formatNumber } from '../utils/format';

export interface SearchFormatterOptions {
  /** Maximum length for description (default: 200) */
  descriptionLength?: number;
  /** Show full details or compact format */
  compact?: boolean;
}

/**
 * Format search results for display
 */
export function formatSearchResults(
  feeds: PodcastFeed[],
  options: SearchFormatterOptions = {}
): string {
  const { descriptionLength = 200, compact = false } = options;

  if (!feeds || feeds.length === 0) {
    return 'No podcasts found.\n\nTry:\n- Checking your spelling\n- Using different keywords\n- Broadening your search terms';
  }

  const output: string[] = [];
  output.push(`Found ${feeds.length} podcast${feeds.length === 1 ? '' : 's'}:\n`);

  feeds.forEach((feed, index) => {
    output.push(formatPodcastFeed(feed, index + 1, descriptionLength, compact));
    if (index < feeds.length - 1) {
      output.push(''); // Blank line between results
    }
  });

  // Add helpful tip
  output.push('\n---');
  output.push('Tip: Download episodes with: pullapod <feed-url> --date YYYY-MM-DD');

  return output.join('\n');
}

/**
 * Format a single podcast feed
 */
function formatPodcastFeed(
  feed: PodcastFeed,
  index: number,
  descriptionLength: number,
  compact: boolean
): string {
  const lines: string[] = [];

  // Title
  lines.push(`${index}. ${feed.title}`);

  // Author (use "by" prefix)
  const author = feed.author || feed.ownerName;
  if (author) {
    lines.push(`   by ${author}`);
  }

  if (!compact) {
    // Episodes and Language on same line
    const info: string[] = [];
    if (feed.episodeCount !== undefined) {
      info.push(`Episodes: ${formatNumber(feed.episodeCount)}`);
    }
    if (feed.language) {
      info.push(`Language: ${feed.language}`);
    }
    if (info.length > 0) {
      lines.push(`   ${info.join(' | ')}`);
    }

    // Feed URL
    lines.push(`   Feed: ${feed.url}`);

    // Description
    if (feed.description) {
      const cleanDescription = stripHtml(feed.description);
      const truncatedDescription = truncateText(cleanDescription, descriptionLength);
      lines.push(`   Description: ${truncatedDescription}`);
    }
  } else {
    // Compact format: just essential info
    const info: string[] = [];
    if (feed.episodeCount !== undefined) {
      info.push(`${formatNumber(feed.episodeCount)} episodes`);
    }
    if (feed.language) {
      info.push(feed.language);
    }
    if (info.length > 0) {
      lines.push(`   ${info.join(' | ')}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a single podcast feed for list display (one line)
 */
export function formatPodcastFeedCompact(feed: PodcastFeed): string {
  const parts: string[] = [feed.title];

  if (feed.author) {
    parts.push(`by ${feed.author}`);
  }

  if (feed.episodeCount !== undefined) {
    parts.push(`(${formatNumber(feed.episodeCount)} episodes)`);
  }

  return parts.join(' ');
}
