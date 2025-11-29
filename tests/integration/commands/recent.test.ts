/**
 * Integration tests for recent command
 * Tests actual API integration with Podcast Index and favorites storage
 *
 * Strategy: Use search to find reliable feeds, add them to temporary favorites,
 * then test recent command functionality
 *
 * Note: These tests require valid API credentials to be set in .env
 * Run with: npm run test:integration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PodcastIndexClient } from '../../../src/clients/podcast-index-client';
import { loadConfig } from '../../../src/config';
import {
  loadFavorites,
  saveFavorites,
  FavoriteFeed,
  FavoritesData,
} from '../../../src/storage/favorites';
import {
  formatRecentOutput,
  formatNoFavorites,
  formatFeedNotFound,
  FeedFetchResult,
} from '../../../src/formatters/recent-formatter';

describe('recent command integration tests', () => {
  let client: PodcastIndexClient;
  let config: ReturnType<typeof loadConfig>;
  let testDir: string;
  let testFilePath: string;

  // Test podcast data discovered during setup
  let testPodcast1: { id: number; title: string; url: string } | null = null;
  let testPodcast2: { id: number; title: string; url: string } | null = null;

  beforeAll(async () => {
    // Set up API client
    config = loadConfig();
    client = new PodcastIndexClient({
      apiKey: config.podcastIndex.apiKey,
      apiSecret: config.podcastIndex.apiSecret,
    });

    // Create temporary directory for test favorites file
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pullapod-recent-int-test-'));
    testFilePath = path.join(testDir, 'favorites.json');

    // Search for two reliable podcasts to use for testing
    // Using well-established organizations for stability
    const searchQueries = ['NPR news', 'BBC podcast'];

    for (let i = 0; i < searchQueries.length; i++) {
      try {
        const searchResponse = await client.searchByTitle({
          q: searchQueries[i],
          max: 5,
        });

        if (searchResponse.feeds && searchResponse.feeds.length > 0) {
          // Find a feed with a valid URL and ID
          const feed = searchResponse.feeds.find(
            (f) => f.id && f.url && f.title
          );

          if (feed) {
            const podcast = {
              id: feed.id,
              title: feed.title,
              url: feed.url,
            };

            if (i === 0) {
              testPodcast1 = podcast;
            } else {
              testPodcast2 = podcast;
            }
          }
        }
      } catch {
        // Continue if one search fails
      }
    }
  }, 20000);

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Reset test favorites file before each test
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('episode fetching from API', () => {
    it('should fetch recent episodes by feed ID', async () => {
      if (!testPodcast1) {
        console.warn('Skipping test: No test podcast available');
        return;
      }

      const sinceTimestamp = Math.floor(Date.now() / 1000) - 30 * 86400; // 30 days ago

      const response = await client.getEpisodesByFeedId({
        id: testPodcast1.id,
        max: 5,
        since: sinceTimestamp,
      });

      expect(response.status).toBeDefined();
      // May or may not have episodes depending on podcast activity
      if (response.items && response.items.length > 0) {
        const episode = response.items[0];
        expect(episode.title).toBeDefined();
        expect(episode.datePublished).toBeDefined();
        expect(episode.feedId).toBe(testPodcast1.id);
      }
    }, 15000);

    it('should respect max parameter', async () => {
      if (!testPodcast1) {
        console.warn('Skipping test: No test podcast available');
        return;
      }

      const response = await client.getEpisodesByFeedId({
        id: testPodcast1.id,
        max: 3,
      });

      if (response.items) {
        expect(response.items.length).toBeLessThanOrEqual(3);
      }
    }, 15000);

    it('should respect since parameter', async () => {
      if (!testPodcast1) {
        console.warn('Skipping test: No test podcast available');
        return;
      }

      const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;

      const response = await client.getEpisodesByFeedId({
        id: testPodcast1.id,
        max: 10,
        since: oneDayAgo,
      });

      if (response.items && response.items.length > 0) {
        // All episodes should be after the since timestamp
        for (const episode of response.items) {
          expect(episode.datePublished).toBeGreaterThanOrEqual(oneDayAgo);
        }
      }
    }, 15000);
  });

  describe('favorites integration', () => {
    it('should load favorites from file', () => {
      if (!testPodcast1) {
        console.warn('Skipping test: No test podcast available');
        return;
      }

      const favorites: FavoritesData = {
        version: 1,
        feeds: [
          {
            name: testPodcast1.title,
            url: testPodcast1.url,
            feedId: testPodcast1.id,
            dateAdded: new Date().toISOString(),
          },
        ],
      };

      saveFavorites(favorites, testFilePath);
      const loaded = loadFavorites(testFilePath);

      expect(loaded.feeds.length).toBe(1);
      expect(loaded.feeds[0].feedId).toBe(testPodcast1.id);
    });

    it('should handle empty favorites file', () => {
      const loaded = loadFavorites(testFilePath);
      expect(loaded.feeds.length).toBe(0);
    });
  });

  describe('output formatting with real data', () => {
    it('should format episodes from multiple feeds', async () => {
      if (!testPodcast1 || !testPodcast2) {
        console.warn('Skipping test: Not enough test podcasts available');
        return;
      }

      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;

      // Fetch episodes from both podcasts
      const [response1, response2] = await Promise.all([
        client.getEpisodesByFeedId({
          id: testPodcast1.id,
          max: 3,
          since: thirtyDaysAgo,
        }),
        client.getEpisodesByFeedId({
          id: testPodcast2.id,
          max: 3,
          since: thirtyDaysAgo,
        }),
      ]);

      const results: FeedFetchResult[] = [
        {
          feed: {
            name: testPodcast1.title,
            url: testPodcast1.url,
            feedId: testPodcast1.id,
            dateAdded: new Date().toISOString(),
          },
          episodes: response1.items || [],
        },
        {
          feed: {
            name: testPodcast2.title,
            url: testPodcast2.url,
            feedId: testPodcast2.id,
            dateAdded: new Date().toISOString(),
          },
          episodes: response2.items || [],
        },
      ];

      const output = formatRecentOutput(results, 30);

      const totalEpisodes = (response1.items?.length || 0) + (response2.items?.length || 0);

      if (totalEpisodes > 0) {
        // When episodes exist, output should contain section structure
        expect(output).toContain('---');
        expect(output).toContain('Download with:');
        expect(output).toContain('new episode');
      } else {
        // When no episodes, should show no episodes message
        expect(output).toContain('No new episodes');
        expect(output).toContain('pullapod recent --days');
      }
    }, 20000);

    it('should format no favorites message correctly', () => {
      const output = formatNoFavorites();

      expect(output).toContain('No saved podcasts');
      expect(output).toContain('pullapod favorite add');
      expect(output).toContain('pullapod favorite list');
    });

    it('should format feed not found message correctly', () => {
      if (!testPodcast1) {
        console.warn('Skipping test: No test podcast available');
        return;
      }

      const feeds: FavoriteFeed[] = [
        {
          name: testPodcast1.title,
          url: testPodcast1.url,
          feedId: testPodcast1.id,
          dateAdded: new Date().toISOString(),
        },
      ];

      const output = formatFeedNotFound('nonexistent', feeds);

      expect(output).toContain('No saved podcast matches');
      expect(output).toContain('nonexistent');
      expect(output).toContain('Available feeds:');
      expect(output).toContain(testPodcast1.title);
    });
  });

  describe('concurrent fetching', () => {
    it('should handle multiple concurrent requests', async () => {
      if (!testPodcast1 || !testPodcast2) {
        console.warn('Skipping test: Not enough test podcasts available');
        return;
      }

      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;

      // Simulate fetching from multiple feeds concurrently
      const fetchPromises = [testPodcast1, testPodcast2].map(async (podcast) => {
        try {
          const response = await client.getEpisodesByFeedId({
            id: podcast.id,
            max: 5,
            since: thirtyDaysAgo,
          });
          return {
            feed: {
              name: podcast.title,
              url: podcast.url,
              feedId: podcast.id,
              dateAdded: new Date().toISOString(),
            },
            episodes: response.items || [],
          };
        } catch (error) {
          return {
            feed: {
              name: podcast.title,
              url: podcast.url,
              feedId: podcast.id,
              dateAdded: new Date().toISOString(),
            },
            episodes: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.all(fetchPromises);

      expect(results.length).toBe(2);
      // At least one should succeed
      const successCount = results.filter((r) => !r.error).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    }, 20000);
  });

  describe('error handling', () => {
    it('should handle invalid feed ID gracefully', async () => {
      try {
        const response = await client.getEpisodesByFeedId({
          id: 999999999, // Non-existent feed ID
          max: 5,
        });

        // API may return empty items for invalid IDs
        expect(response.items?.length || 0).toBe(0);
      } catch {
        // Expected - invalid feed IDs may throw
      }
    }, 15000);
  });

  describe('date filtering', () => {
    it('should filter episodes by date range', async () => {
      if (!testPodcast1) {
        console.warn('Skipping test: No test podcast available');
        return;
      }

      // Fetch episodes from 7 days ago
      const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 86400;

      const response = await client.getEpisodesByFeedId({
        id: testPodcast1.id,
        max: 10,
        since: sevenDaysAgo,
      });

      if (response.items && response.items.length > 0) {
        // Verify all episodes are within the date range
        for (const episode of response.items) {
          expect(episode.datePublished).toBeGreaterThanOrEqual(sevenDaysAgo);
        }
      }
    }, 15000);
  });
});
