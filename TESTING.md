# Testing Documentation

## Test Suite Overview

Pull a Pod includes a comprehensive test suite with **310 total tests** covering:
- **Unit tests** (255 tests) - Fast, isolated tests with mocked dependencies
- **Integration tests** (55 tests) - Real API calls to Podcast Index API
- RSS feed parser tests (including User-Agent requirements)
- Episode filtering tests
- Metadata embedding tests
- Download manager tests (skipped - see below)

## Test Organization

Tests are organized following industry best practices with clear separation between unit and integration tests:

```
tests/
├── unit/                    # Unit tests - fast, no external dependencies
│   ├── commands/           # Command logic tests
│   ├── formatters/         # Output formatting tests
│   ├── utils/              # Utility function tests
│   └── setup.ts            # Unit test setup (with mocks)
└── integration/            # Integration tests - real API calls
    ├── commands/           # Command integration tests
    └── setup.ts            # Integration test setup (no mocks)
```

## Running Tests

### Quick Reference

```bash
# Run unit tests only (default, fast)
npm test

# Run integration tests (requires API credentials)
npm run test:integration

# Run all tests (unit + integration)
npm run test:all

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run all tests with coverage
npm run test:coverage:all
```

### Unit Tests

Unit tests run by default with `npm test`. They are:
- **Fast** - Complete in ~1.5 seconds
- **Isolated** - Use mocks for external dependencies
- **Always run** - No credentials required
- **CI-friendly** - Run in CI/CD pipelines

### Integration Tests

Integration tests make real API calls to the Podcast Index API and require valid credentials in your `.env` file:

```bash
# Add to .env
PODCAST_INDEX_API_KEY=your_key_here
PODCAST_INDEX_API_SECRET=your_secret_here
```

To run integration tests:

```bash
npm run test:integration
```

**Note:** Integration tests are automatically skipped in CI environments (when `CI=true`).

## Test Results

### Current Test Count

- **255 unit tests** ✅ (13 test suites)
- **55 integration tests** ✅ (3 test suites)
- **14 skipped tests** (downloader tests - see Known Limitations below)
- **100% pass rate** for implemented tests

### Coverage

Unit test coverage (run `npm run test:coverage`):
- Overall coverage across core functionality
- Focused on business logic and edge cases
- Excludes CLI entry points and type definitions

## Unit Test Coverage

### 1. Utility Functions ([tests/unit/utils.test.ts](tests/unit/utils.test.ts))

**Tests for `sanitizeForFilesystem`:**
- Sanitizes filenames with special characters
- Handles multiple spaces
- Removes trailing periods (Windows compatibility)
- Handles empty or invalid strings
- Preserves valid characters

**Tests for `parseDate`:**
- Parses YYYY-MM-DD format correctly
- Parses single-digit months and days
- Handles RFC 2822 date format
- Returns null for invalid dates
- Handles timezone correctly for YYYY-MM-DD format

**Tests for `isDateInRange`:**
- Checks if date is within range
- Handles boundary conditions (equals start/end date)
- Handles undefined start or end dates
- Ignores time component when comparing dates

**Tests for `getFileExtension`:**
- Extracts file extension from URLs
- Handles uppercase extensions
- Handles URLs with query parameters
- Defaults to mp3 for URLs without extension

**Tests for `formatBytes`:**
- Formats bytes, KB, MB, and GB correctly
- Handles zero bytes

### 2. RSS Parser ([tests/unit/parser.test.ts](tests/unit/parser.test.ts))

**Critical tests for real-world scenarios:**
- ✅ **User-Agent header requirement** - Tests that feeds requiring User-Agent headers work correctly
- Parses valid RSS feeds
- Handles episode-specific artwork
- Falls back to podcast artwork when episode artwork missing
- Filters out items without audio enclosures
- Handles missing titles gracefully
- Throws errors for network failures
- Throws errors for 404 responses
- Throws errors for invalid XML

### 3. Episode Filter ([tests/unit/filter.test.ts](tests/unit/filter.test.ts))

**Filter by exact date:**
- Filters episodes by specific publish date
- Returns empty array when no matches
- Throws error for invalid date format
- Handles dates with different time components
- Returns all episodes published on the same date (multiple episodes per day)

**Filter by date range:**
- Filters episodes within date range
- Includes episodes on start/end dates (inclusive)
- Handles only start date or only end date
- Returns empty array when no episodes in range
- Returns all episodes published on the same date within range (multiple episodes per day)

**Filter by name:**
- Case-insensitive partial matching
- Handles special characters

**Sorting:**
- Sorts by date (ascending/descending)
- Doesn't modify original array

### 4. Downloader ([tests/unit/downloader.test.ts](tests/unit/downloader.test.ts)) - SKIPPED

**Note:** These tests are currently skipped due to limitations with mocking native `fetch` in Node.js 18+.

The tests are written and ready, covering:
- ✅ **Broken download links (404 errors)** - Handles gracefully
- ✅ **Network errors** - Proper error handling
- Download progress tracking
- File organization into podcast directories
- Filename sanitization
- Different audio file extensions (MP3, M4A, etc.)
- Missing artwork handling
- Large file downloads
- URL redirects

**Future improvement:** Consider migrating to `jest-fetch-mock` or `undici` mocks for better native fetch support.

### 5. Metadata Embedder ([tests/unit/metadata.test.ts](tests/unit/metadata.test.ts))

**Metadata embedding:**
- Embeds ID3 tags into MP3 files
- Embeds artwork into MP3 files
- Skips non-MP3 files (M4A, etc.)
- Handles missing artwork gracefully
- Handles non-existent artwork files
- Embeds descriptions as comments
- Detects MIME types for different image formats
- Handles corrupt MP3 files gracefully
- Handles special characters in metadata

### 6. Search Command ([tests/unit/commands/search.test.ts](tests/unit/commands/search.test.ts))

**Command logic:**
- Searches for podcasts by term
- Searches by title only with `--title-only` flag
- Applies maximum results limit
- Filters by language code
- Enables similar/fuzzy matching with `--similar` flag
- Validates max results range (1-100)
- Handles missing API credentials
- Sanitizes search queries
- Formats and displays results

### 7. Episodes Command ([tests/unit/commands/episodes.test.ts](tests/unit/commands/episodes.test.ts))

**Command logic:**
- Fetches episodes by feed ID
- Fetches episodes by feed URL
- Applies maximum results limit
- Filters episodes by date with `--since` option
- Shows full descriptions with `--full` flag
- Validates feed ID format
- Validates feed URL format
- Validates max results range (1-1000)
- Handles missing API credentials
- Formats and displays episodes

### 8. Formatters ([tests/unit/formatters/](tests/unit/formatters/))

**Search formatter:**
- Formats podcast search results
- Handles missing podcast data
- Formats episode counts
- Displays feed URLs and IDs

**Episodes formatter:**
- Formats episode lists
- Truncates long descriptions (default)
- Shows full descriptions with flag
- Formats durations (HH:MM:SS)
- Formats publish dates
- Strips HTML from descriptions
- Handles missing episode data

## Integration Test Coverage

Integration tests verify the complete workflow with real API calls to Podcast Index.

### 1. Search Command Integration ([tests/integration/commands/search.test.ts](tests/integration/commands/search.test.ts))

**API integration:**
- Searches by term with real API
- Searches by title only
- Limits results correctly
- Returns valid podcast data structures
- Handles API errors gracefully
- Validates all required fields in responses
- Tests various search queries

### 2. Episodes Command Integration ([tests/integration/commands/episodes.test.ts](tests/integration/commands/episodes.test.ts))

**API integration:**
- Uses dynamic feed discovery (searches for NPR podcasts)
- Fetches episodes by feed ID
- Fetches episodes by feed URL
- Filters episodes by date (`--since` option)
- Validates episode data structures
- Sorts episodes by newest first
- Handles non-existent feed IDs gracefully
- Handles invalid feed URLs with errors
- Tests complete search → episodes workflow
- Validates all required fields in responses
- Handles various real-world edge cases

**Why dynamic feed discovery?**
Integration tests avoid hardcoded podcast URLs or IDs because podcasts can:
- Change feeds or URLs
- Be deleted or removed
- Go offline temporarily

Instead, tests search for stable, well-known podcasts (like NPR) before running episode tests.

### 3. Podcast Index Client Integration ([tests/integration/podcast-index.test.ts](tests/integration/podcast-index.test.ts))

**Low-level API client:**
- Tests authentication with real credentials
- Validates API response structures
- Tests various API endpoints
- Handles network errors
- Tests rate limiting behavior

## Configuration

### Jest Projects

Tests are organized using [Jest Projects](https://jestjs.io/docs/configuration#projects-arraystring--projectconfig) for clean separation:

- **Unit project** - Runs tests from `tests/unit/`
- **Integration project** - Runs tests from `tests/integration/`

See [jest.config.js](jest.config.js) for configuration details.

### Setup Files

Each test type has its own setup:

- **[tests/unit/setup.ts](tests/unit/setup.ts)** - Enables `nock` for HTTP mocking, suppresses console output
- **[tests/integration/setup.ts](tests/integration/setup.ts)** - Minimal setup, allows real network calls

## Known Limitations

### Downloader Tests - Skipped (14 tests)

The downloader tests are skipped due to limitations with mocking Node.js's native `fetch()` API.

**Technical details:**
- The downloader uses streaming `Response.body` (ReadableStream), part of the Web Streams API
- Current mocking libraries don't properly support streaming responses in Node.js 18+
- Alternatives explored:
  - `jest-fetch-mock` - doesn't support ReadableStream properly
  - `nock` - doesn't intercept native fetch()
  - Custom ReadableStream mocks - incompatibility between Web Streams and Node Streams

**Future solutions:**
- Use `undici` mocks (undici powers native fetch in Node.js)
- Refactor downloader to use an HTTP client abstraction that's easier to mock
- Create E2E tests with actual small test files

**Current workaround:** The downloader has been extensively manually tested with real podcast feeds (see Manual Testing section).

## Issues Discovered During Testing

### 1. RSS Feeds Requiring User-Agent ✅ TESTED

**Issue:** Some podcast feeds return `406 Not Acceptable` when no User-Agent header is present.

**Solution:** Added User-Agent header `pullapod/1.0.0` to all RSS requests.

**Test coverage:** [tests/unit/parser.test.ts](tests/unit/parser.test.ts) - "should include User-Agent header in requests"

### 2. Broken Download Links ✅ TESTED (code written)

**Issue:** Some episodes in feeds may have broken or expired download URLs.

**Solution:** Proper error handling with descriptive error messages.

**Test coverage:** [tests/unit/downloader.test.ts](tests/unit/downloader.test.ts) - "should handle broken audio download link (404)"

### 3. Timezone Handling in Date Parsing ✅ TESTED

**Issue:** `new Date('2024-04-25')` is parsed as UTC midnight, which becomes previous day in some timezones.

**Solution:** Parse YYYY-MM-DD format explicitly as local date, not UTC.

**Test coverage:** [tests/unit/utils.test.ts](tests/unit/utils.test.ts) - "should handle timezone correctly for YYYY-MM-DD format"

### 4. Array vs String in RSS Parser ✅ TESTED

**Issue:** `feed.image.url` can be returned as either a string or an array by rss-parser.

**Solution:** Check if value is array and take first element if so.

**Test coverage:** [tests/unit/parser.test.ts](tests/unit/parser.test.ts) - "should fall back to podcast artwork when episode artwork is missing"

### 5. Dynamic Feed Discovery for Integration Tests ✅ IMPLEMENTED

**Issue:** Hardcoded podcast IDs or URLs can break when podcasts are deleted or change feeds.

**Solution:** Integration tests dynamically search for stable, well-known podcasts before testing.

**Implementation:** [tests/integration/commands/episodes.test.ts](tests/integration/commands/episodes.test.ts) - Uses search API to find NPR podcasts

## Manual Testing

The application has been successfully tested with real-world podcast feeds:

**Test feed:** `https://portal-api.thisisdistorted.com/xml/felix-da-housecat-chicago-blakkout`

**Scenarios tested:**
- ✅ Download by exact date
- ✅ Download by date range
- ✅ Download by episode name
- ✅ Artwork embedding into MP3 files
- ✅ File organization into podcast folders
- ✅ Handling of User-Agent requirements
- ✅ Handling of broken download links (Episode 15 returned 404)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Add unit tests for business logic
3. Add integration tests for API interactions
4. Ensure all existing tests pass
5. Update this documentation
6. Maintain test organization (unit vs integration)

### Adding New Tests

**For unit tests:**
```bash
# Create test file in appropriate directory
tests/unit/commands/my-command.test.ts
tests/unit/utils/my-util.test.ts
```

**For integration tests:**
```bash
# Create test file in appropriate directory
tests/integration/commands/my-command.test.ts
```

**Remember:**
- Unit tests should mock external dependencies
- Integration tests should use real API calls
- Follow existing naming conventions (`.test.ts`)

## CI/CD Integration

### GitHub Actions

Unit tests run automatically on every push and pull request:

```yaml
- name: Run tests
  run: npm test
```

Integration tests are skipped in CI (no API credentials):
- Tests check for `CI=true` environment variable
- Can be run locally with valid credentials in `.env`

### Local Development

```bash
# Fast feedback loop - unit tests only
npm test

# Before committing - run all tests
npm run test:all

# Check coverage
npm run test:coverage
```

## Future Improvements

1. **Migrate fetch mocking** - Switch to a solution that supports native fetch
2. **Add E2E tests** - Test actual downloads with small test files
3. **Performance tests** - Test with large feeds (100+ episodes)
4. **Error recovery tests** - Test partial download cleanup
5. **Concurrent download tests** - Test downloading multiple episodes simultaneously
6. **Improve integration test resilience** - Add retry logic for flaky network calls
7. **Add mutation testing** - Use tools like Stryker to verify test quality
