/**
 * Tests for recent formatter
 */

import {
  formatShortDate,
  formatEpisodeLine,
  formatGroupHeader,
  groupEpisodesByPodcast,
  formatRecentOutput,
  formatNoFavorites,
  formatFeedNotFound,
  formatLargeFavoritesWarning,
  FeedFetchResult,
  PodcastGroup,
} from '../../../src/formatters/recent-formatter';
import { PodcastEpisode } from '../../../src/clients/podcast-index-types';
import { FavoriteFeed } from '../../../src/storage/favorites';

describe('recent formatter', () => {
  const mockFeed1: FavoriteFeed = {
    name: 'JavaScript Jabber',
    url: 'https://feeds.fireside.fm/javascriptjabber/rss',
    feedId: 920666,
    dateAdded: '2024-01-10T12:00:00Z',
  };

  const mockFeed2: FavoriteFeed = {
    name: 'Syntax FM',
    url: 'https://feed.syntax.fm/rss',
    feedId: 123456,
    dateAdded: '2024-01-09T12:00:00Z',
  };

  const mockEpisode1: PodcastEpisode = {
    id: 1001,
    title: 'JSJ 547: Modern React Patterns',
    link: 'https://example.com/ep1',
    description: 'Discussion about React',
    guid: 'guid-1',
    datePublished: 1705363200, // Jan 16, 2024
    datePublishedPretty: 'Jan 16, 2024',
    dateCrawled: 1705363200,
    enclosureUrl: 'https://example.com/ep1.mp3',
    enclosureType: 'audio/mpeg',
    enclosureLength: 50000000,
    duration: 3600,
    explicit: 0,
    image: '',
    feedImage: '',
    feedId: 920666,
    feedTitle: 'JavaScript Jabber',
    feedLanguage: 'en',
  };

  const mockEpisode2: PodcastEpisode = {
    id: 1002,
    title: 'JSJ 546: TypeScript 5.0 Deep Dive',
    link: 'https://example.com/ep2',
    description: 'TypeScript discussion',
    guid: 'guid-2',
    datePublished: 1705276800, // Jan 15, 2024
    datePublishedPretty: 'Jan 15, 2024',
    dateCrawled: 1705276800,
    enclosureUrl: 'https://example.com/ep2.mp3',
    enclosureType: 'audio/mpeg',
    enclosureLength: 45000000,
    duration: 3200,
    explicit: 0,
    image: '',
    feedImage: '',
    feedId: 920666,
    feedTitle: 'JavaScript Jabber',
    feedLanguage: 'en',
  };

  const mockEpisode3: PodcastEpisode = {
    id: 2001,
    title: 'Syntax 700: CSS Container Queries',
    link: 'https://example.com/ep3',
    description: 'CSS discussion',
    guid: 'guid-3',
    datePublished: 1705449600, // Jan 17, 2024
    datePublishedPretty: 'Jan 17, 2024',
    dateCrawled: 1705449600,
    enclosureUrl: 'https://example.com/ep3.mp3',
    enclosureType: 'audio/mpeg',
    enclosureLength: 30000000,
    duration: 1800,
    explicit: 0,
    image: '',
    feedImage: '',
    feedId: 123456,
    feedTitle: 'Syntax FM',
    feedLanguage: 'en',
  };

  describe('formatShortDate', () => {
    it('should format Unix timestamp to short date', () => {
      const result = formatShortDate(1705363200); // Jan 16, 2024 UTC
      expect(result).toMatch(/Jan\s+1[56],\s+2024/); // Allow for timezone differences
    });

    it('should return "Unknown date" for zero timestamp', () => {
      const result = formatShortDate(0);
      expect(result).toBe('Unknown date');
    });
  });

  describe('formatEpisodeLine', () => {
    it('should format episode with title and date', () => {
      const result = formatEpisodeLine(mockEpisode1);
      expect(result).toContain('*');
      expect(result).toContain('JSJ 547: Modern React Patterns');
      expect(result).toMatch(/Jan\s+1[56],\s+2024/);
    });

    it('should truncate long titles', () => {
      const longTitleEpisode = {
        ...mockEpisode1,
        title: 'This is a very long episode title that should definitely be truncated because it exceeds the maximum length allowed for display',
      };
      const result = formatEpisodeLine(longTitleEpisode, 40);
      expect(result.length).toBeLessThan(longTitleEpisode.title.length + 30);
      expect(result).toContain('...');
    });
  });

  describe('formatGroupHeader', () => {
    it('should format header with episode count (singular)', () => {
      const group: PodcastGroup = {
        feedName: 'JavaScript Jabber',
        feedUrl: 'https://example.com/feed',
        episodes: [mockEpisode1],
      };
      const result = formatGroupHeader(group);
      expect(result).toBe('JavaScript Jabber (1 new episode)');
    });

    it('should format header with episode count (plural)', () => {
      const group: PodcastGroup = {
        feedName: 'JavaScript Jabber',
        feedUrl: 'https://example.com/feed',
        episodes: [mockEpisode1, mockEpisode2],
      };
      const result = formatGroupHeader(group);
      expect(result).toBe('JavaScript Jabber (2 new episodes)');
    });
  });

  describe('groupEpisodesByPodcast', () => {
    it('should group episodes by podcast', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [mockEpisode1, mockEpisode2] },
        { feed: mockFeed2, episodes: [mockEpisode3] },
      ];
      const groups = groupEpisodesByPodcast(results);
      expect(groups.length).toBe(2);
    });

    it('should sort groups by most recent episode first', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [mockEpisode1, mockEpisode2] },
        { feed: mockFeed2, episodes: [mockEpisode3] }, // Jan 17 - most recent
      ];
      const groups = groupEpisodesByPodcast(results);
      expect(groups[0].feedName).toBe('Syntax FM'); // Most recent episode
    });

    it('should exclude feeds with no episodes', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [] },
        { feed: mockFeed2, episodes: [mockEpisode3] },
      ];
      const groups = groupEpisodesByPodcast(results);
      expect(groups.length).toBe(1);
      expect(groups[0].feedName).toBe('Syntax FM');
    });

    it('should sort episodes within group by newest first', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [mockEpisode2, mockEpisode1] }, // Out of order
      ];
      const groups = groupEpisodesByPodcast(results);
      expect(groups[0].episodes[0].id).toBe(mockEpisode1.id); // Most recent first
    });
  });

  describe('formatRecentOutput', () => {
    it('should format output for multiple feeds', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [mockEpisode1, mockEpisode2] },
        { feed: mockFeed2, episodes: [mockEpisode3] },
      ];
      const output = formatRecentOutput(results, 7);
      expect(output).toContain('Recent episodes from your saved podcasts');
      expect(output).toContain('last 7 days');
      expect(output).toContain('JavaScript Jabber');
      expect(output).toContain('Syntax FM');
      expect(output).toContain('Total: 3 new episodes across 2 podcasts');
      expect(output).toContain('Download with:');
    });

    it('should format output for single day', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [mockEpisode1] },
      ];
      const output = formatRecentOutput(results, 1);
      expect(output).toContain('last 1 day');
    });

    it('should format output when no new episodes', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [] },
        { feed: mockFeed2, episodes: [] },
      ];
      const output = formatRecentOutput(results, 7);
      expect(output).toContain('No new episodes from your saved podcasts');
      expect(output).toContain('Try: pullapod recent --days 30');
    });

    it('should format output with feed filter', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [mockEpisode1, mockEpisode2] },
      ];
      const output = formatRecentOutput(results, 7, 'JavaScript');
      expect(output).toContain('Recent episodes from "JavaScript Jabber"');
      expect(output).toContain('2 new episodes');
      expect(output).toContain(mockFeed1.url);
    });

    it('should format output with feed filter and no episodes', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [] },
      ];
      const output = formatRecentOutput(results, 7, 'JavaScript');
      expect(output).toContain('No new episodes from "JavaScript"');
      expect(output).toContain('Try: pullapod recent --days 30');
    });

    it('should show warnings for failed feeds', () => {
      const results: FeedFetchResult[] = [
        { feed: mockFeed1, episodes: [mockEpisode1] },
        { feed: mockFeed2, episodes: [], error: 'Network error' },
      ];
      const output = formatRecentOutput(results, 7);
      expect(output).toContain('Warning: 1 feed could not be fetched');
      expect(output).toContain('Syntax FM: Network error');
    });
  });

  describe('formatNoFavorites', () => {
    it('should include help message', () => {
      const result = formatNoFavorites();
      expect(result).toContain('No saved podcasts found');
      expect(result).toContain('pullapod favorite add');
      expect(result).toContain('pullapod favorite list');
    });
  });

  describe('formatFeedNotFound', () => {
    it('should list available feeds', () => {
      const result = formatFeedNotFound('unknown', [mockFeed1, mockFeed2]);
      expect(result).toContain('No saved podcast matches "unknown"');
      expect(result).toContain('Available feeds:');
      expect(result).toContain('JavaScript Jabber');
      expect(result).toContain('Syntax FM');
      expect(result).toContain('Try: pullapod recent --feed');
    });
  });

  describe('formatLargeFavoritesWarning', () => {
    it('should include count and suggestion', () => {
      const result = formatLargeFavoritesWarning(25);
      expect(result).toContain('Fetching from 25 podcasts');
      expect(result).toContain('--feed');
    });
  });
});
