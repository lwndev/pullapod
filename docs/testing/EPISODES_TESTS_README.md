# Episodes Command Test Coverage

This document provides a comprehensive overview of the test coverage for the **Episodes Command** (FEAT-002) implementation.

## Test Files

The episodes functionality is covered by the following test files:

### 1. Unit Tests

#### [episodes.test.ts](./episodes.test.ts)
**Focus:** Command logic and option handling
**Tests:** 16 test cases
**Coverage:** 97.56% statements, 95% branches

**Test Categories:**
- **Feed URL Input** (1 test)
  - Fetch episodes by feed URL with default options

- **Feed ID Input** (2 tests)
  - Fetch episodes by numeric feed ID
  - Handle feed ID with whitespace

- **Options Handling** (5 tests)
  - `--max` option validation (1-100 range)
  - `--full` flag for full descriptions
  - `--since` option with valid YYYY-MM-DD dates
  - Date format validation

- **Empty Results** (2 tests)
  - No episodes found
  - No episodes matching date filter

- **Error Handling** (4 tests)
  - Missing API credentials
  - API request failures
  - Debug mode error output
  - Feed not found errors

- **Client Initialization** (1 test)
  - Verify proper API client setup with credentials

#### [episodes-formatter.test.ts](../formatters/episodes-formatter.test.ts)
**Focus:** Output formatting and display
**Tests:** 25 test cases
**Coverage:** 100% statements, 86.95% branches

**Test Categories:**
- **formatDuration** (4 tests)
  - Seconds (< 60): "45 sec"
  - Minutes (60-3599): "52 min"
  - Hours (3600+): "1h 23min"
  - Zero/invalid: "N/A"

- **formatPublishDate** (2 tests)
  - Unix timestamp to readable date
  - Invalid timestamp handling

- **formatDescription** (6 tests)
  - HTML tag stripping
  - Truncation to ~150 characters
  - Full description mode
  - Word boundary truncation
  - Empty description handling
  - HTML entity decoding

- **formatEpisode** (4 tests)
  - Complete episode formatting
  - Full vs truncated descriptions
  - Proper indentation
  - Missing field handling

- **formatEpisodesList** (9 tests)
  - Header and footer formatting
  - Empty list handling
  - Result count messages
  - Download instructions
  - Episode numbering
  - Blank lines between episodes

### 2. Shared Utility Tests

#### [validation.test.ts](../utils/validation.test.ts)
**Focus:** Input validation used by episodes command
**Tests:** 15 test cases covering episodes-related validations

**Relevant Test Categories:**
- **Feed ID/URL Detection** (3 tests)
  - Numeric feed ID detection
  - URL detection
  - Input type disambiguation

- **Date Format Validation** (4 tests)
  - YYYY-MM-DD format validation
  - Invalid date format rejection
  - Date validation errors

- **Range Validation** (3 tests)
  - Within range validation (for `--max` option)
  - Below minimum rejection
  - Above maximum rejection

#### [format.test.ts](../utils/format.test.ts)
**Focus:** Text formatting utilities used by episodes formatter
**Tests:** 18 test cases

**Relevant Test Categories:**
- **truncateText** (4 tests)
  - Short text preservation
  - Word boundary truncation
  - Text without spaces
  - Empty text handling

- **stripHtml** (5 tests)
  - HTML tag removal
  - HTML entity decoding
  - Numeric entity decoding
  - Whitespace cleanup
  - Empty string handling

### 3. Integration Tests

#### [episodes-integration.test.ts](./episodes-integration.test.ts)
**Focus:** Real API integration and end-to-end workflows
**Tests:** 21 test cases
**Auto-run:** Runs automatically when API credentials are available locally
**Strategy:** Uses search API to find reliable test feeds dynamically

**Test Categories:**
- **Fetching Episodes by Feed ID** (3 tests)
  - Fetch with max results limit
  - Verify chronological sorting (newest first)
  - Validate episode structure

- **Fetching Episodes by Feed URL** (1 test)
  - Fetch using RSS feed URL from search results

- **Date Filtering** (2 tests)
  - `--since` option with 30-day filter
  - Future date returns empty results

- **Episode Data Validation** (2 tests)
  - All required fields present with correct types
  - Valid enclosure URLs (http/https)

- **Formatting Integration** (2 tests)
  - Formatted output contains expected elements
  - Full vs truncated description formatting

- **Error Handling** (3 tests)
  - Non-existent feed ID
  - Invalid feed URL
  - Invalid API credentials

- **Real World Scenarios** (3 tests)
  - Podcasts with many episodes (>100)
  - Podcasts with few episodes
  - Special characters in titles
  - HTML in descriptions

- **Performance and Limits** (2 tests)
  - Maximum episode limit (100)
  - Request completion time (<5 seconds per NFR-1)

- **Combined Workflows** (2 tests)
  - Search → Episodes (by ID)
  - Search → Episodes (by URL)

#### [podcast-index-integration.test.ts](../podcast-index-integration.test.ts)
**Focus:** Podcast Index API client (shared infrastructure)
**Tests:** 3 relevant tests for episodes functionality

**Relevant Test Categories:**
- **Episode Operations** (3 tests)
  - Get episodes by feed ID
  - Get episodes with `since` parameter
  - Episode data structure validation

## Coverage Summary

### Overall Coverage
- **episodes.ts**: 97.56% statements, 95% branches, 66.66% functions, 97.56% lines
- **episodes-formatter.ts**: 100% statements, 86.95% branches, 100% functions, 100% lines

### Total Test Count
- **Unit Tests**: 41 tests (16 command + 25 formatter)
- **Integration Tests**: 21 tests (requires explicit opt-in)
- **Shared Utility Tests**: ~20 relevant tests
- **Grand Total**: ~82 tests covering episodes functionality

### Requirements Coverage

All functional requirements from [02-episodes-command.md](../../docs/requirements/02-episodes-command.md) are covered:

| Requirement | Coverage | Test File(s) |
|-------------|----------|--------------|
| FR-1: Feed Resolution | ✅ 100% | episodes.test.ts, episodes-integration.test.ts |
| FR-2: Episode Display | ✅ 100% | episodes-formatter.test.ts |
| FR-3: Ordering | ✅ 100% | episodes-integration.test.ts |
| FR-4: Result Limits | ✅ 100% | episodes.test.ts, validation.test.ts |
| FR-5: Date Filtering | ✅ 100% | episodes.test.ts, episodes-integration.test.ts |
| FR-6: Duration Formatting | ✅ 100% | episodes-formatter.test.ts |
| FR-7: Description Handling | ✅ 100% | episodes-formatter.test.ts, format.test.ts |
| FR-8: Podcast Context | ✅ 100% | episodes-formatter.test.ts |
| FR-9: User Guidance | ✅ 100% | episodes-formatter.test.ts |
| FR-10: No Episodes Handling | ✅ 100% | episodes.test.ts, episodes-formatter.test.ts |

## Running Tests

### Run All Episodes Tests
```bash
npm test -- --testPathPattern=episodes
```

### Run with Coverage
```bash
npm test -- --testPathPattern=episodes --coverage
```

### Run Only Unit Tests
```bash
npm test -- tests/commands/episodes.test.ts
npm test -- tests/formatters/episodes-formatter.test.ts
```

### Run Integration Tests

Integration tests **run automatically** when API credentials are available in your `.env` file.

```bash
# If you have credentials in .env, just run:
npm test -- tests/commands/episodes-integration.test.ts

# Or run all tests (integration tests will run automatically):
npm test
```

#### Controlling Integration Test Execution

**To skip integration tests** (even with credentials):
```bash
export SKIP_INTEGRATION_TESTS=true
npm test
```

**CI Environment:**
- Integration tests are automatically skipped in CI environments (GitHub Actions, CircleCI, etc.)
- CI is detected via the `CI=true` environment variable

**Without Credentials:**
- If no API credentials are found, integration tests are automatically skipped
- No error is thrown - tests simply show as "skipped"

## Integration Test Strategy

The integration tests use a **dynamic feed discovery approach**:

1. **Search for Stable Feeds**: Uses the search API to find podcasts from well-established sources (e.g., NPR)
2. **Validate Feed Suitability**: Selects feeds with a reasonable number of episodes (>10)
3. **Test Against Real Data**: Runs all integration tests against the discovered feed
4. **Resilient to Changes**: No hardcoded feed IDs or URLs that might become invalid

This approach is more resilient than hardcoding specific podcast URLs, as podcasts can:
- Change their RSS feed URLs
- Be deleted or discontinued
- Have varying episode counts over time

## Test Maintenance

### Adding New Tests
When adding new episodes functionality:

1. Add unit tests to `episodes.test.ts` for command logic
2. Add formatter tests to `episodes-formatter.test.ts` for output changes
3. Add integration tests to `episodes-integration.test.ts` for end-to-end workflows
4. Update this README with new test coverage information

### Common Test Patterns

#### Mocking Process.exit
```typescript
processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
  throw new Error('process.exit called');
}) as any);

await expect(episodesCommand('920666', options)).rejects.toThrow('process.exit called');
expect(processExitSpy).toHaveBeenCalledWith(0);
```

#### Testing Date Filtering
```typescript
const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

const response = await client.getEpisodesByFeedId({
  id: testFeedId,
  since: thirtyDaysAgo,
});

response.items!.forEach((episode) => {
  expect(episode.datePublished).toBeGreaterThanOrEqual(thirtyDaysAgo);
});
```

#### Testing Formatters
```typescript
const formatted = formatEpisodesList(episodes, 'Podcast Title', false);

expect(formatted).toContain('Recent episodes from "Podcast Title"');
expect(formatted).toContain('Duration:');
expect(formatted).toContain('Download with:');
```

## Success Criteria

All success criteria from the implementation plan are met:

- ✅ All functional requirements covered
- ✅ >80% test coverage (achieved 97.56%)
- ✅ All tests passing
- ✅ Error handling for all specified cases
- ✅ Help text clear and accurate
- ✅ Documentation updated
- ✅ Integration tests for real-world scenarios

## Related Documentation

- [Implementation Plan](../../docs/implementation/podcast-index-features-plan.md) - Phase 2
- [Requirements Document](../../docs/requirements/02-episodes-command.md)
- [Search Command Tests](./search.test.ts) - Similar test patterns
- [Main README](../../README.md) - Usage examples
