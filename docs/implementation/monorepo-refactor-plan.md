# Implementation Plan: Monorepo Refactor for Electron Desktop App

## Overview

This document outlines the implementation plan for restructuring pullapod-cli into a monorepo architecture that separates core business logic from the CLI interface. This enables code reuse between the CLI and a future Electron-based desktop application.

## Package & Repository Naming

| Item | Old (Archived) | New |
|------|----------------|-----|
| GitHub repo | `pullapod-cli` (archived) | `pullapod` (new repo) |
| npm CLI package | `pullapod-cli` (deprecated) | `pullapod` |
| npm core package | — | `@pullapod/core` (private) |
| CLI command (binary) | `pullapod` | `pullapod` (unchanged) |

**Approach:** Rather than renaming the existing repository and npm package, we will:
1. Create a **new** `pullapod` GitHub repository from the existing codebase
2. Publish to the **new** `pullapod` npm package
3. Archive the old `pullapod-cli` GitHub repository
4. Deprecate the old `pullapod-cli` npm package with a migration message

This approach preserves the history of the original project while starting fresh with the new monorepo structure.

---

## Phases Summary

| Phase | Description | Complexity | Status |
|-------|-------------|------------|--------|
| Phase 1 | Repository Setup & Workspace Configuration | Low | Pending |
| Phase 2 | Create Core Package Structure | Medium | Pending |
| Phase 3 | Extract API Clients to Core | Low | Pending |
| Phase 4 | Extract Business Logic to Core | Medium | Pending |
| Phase 5 | Create Service Layer | High | Pending |
| Phase 6 | Create CLI Package | Medium | Pending |
| Phase 7 | Migrate Tests | Medium | Pending |
| Phase 8 | Build System & CI/CD Updates | Medium | Pending |
| Phase 9 | Validation & Documentation | Low | Pending |
| Phase 10 | Publish, Archive & Deprecate | Low | Pending |

---

## Current Codebase Analysis

### Source Structure (28 files, ~4,500 lines)

```
src/
├── index.ts                 # CLI entry point (139 lines)
├── types.ts                 # Core type definitions (22 lines)
├── parser.ts                # RSS feed parsing (93 lines)
├── downloader.ts            # Episode download logic (122 lines)
├── filter.ts                # Episode filtering (74 lines)
├── metadata.ts              # ID3 tag embedding (74 lines)
├── utils.ts                 # Core utilities (96 lines)
├── clients/                 # API client abstraction (563 lines)
│   ├── base-client.ts
│   ├── podcast-index-client.ts
│   └── podcast-index-types.ts
├── commands/                # Command implementations (1,033 lines)
├── formatters/              # Output formatting (1,008 lines)
├── config/                  # Configuration (127 lines)
├── storage/                 # Data persistence (556 lines)
└── utils/                   # Utility modules (401 lines)
```

### Classification for Refactoring

| Category | Files | Target Package |
|----------|-------|----------------|
| CLI Entry | `index.ts` | cli |
| Commands | `commands/*` | cli |
| Formatters | `formatters/*` | cli |
| API Clients | `clients/*` | core |
| Business Logic | `parser.ts`, `downloader.ts`, `filter.ts`, `metadata.ts` | core |
| Storage | `storage/*` | core |
| Configuration | `config/*` | core |
| Utilities | `utils/*`, `utils.ts` | core |
| Types | `types.ts` | core |

---

## Recommended Build Sequence

### Phase 1: Repository Setup & Workspace Configuration

**Complexity:** Low

#### Rationale
- **Fresh start**: New repository allows clean monorepo structure from the beginning
- **Preserves history**: Old repository remains intact for reference
- **Foundation first**: Workspace configuration must be in place before any code moves
- **Validates tooling**: Ensures npm workspaces work correctly before proceeding

#### Implementation Steps

1. Create new GitHub repository
   - Create new repo named `pullapod` on GitHub
   - Clone the new empty repository locally
   ```bash
   gh repo create pullapod --public --clone
   cd pullapod
   ```

2. Copy existing codebase (without git history)
   - Copy source files from `pullapod-cli` to new `pullapod` repo
   - Exclude `.git` directory, `node_modules`, `dist`, `coverage`
   ```bash
   # From pullapod-cli directory
   rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='coverage' . ../pullapod/
   ```

3. Initialize as monorepo with workspaces
   - Create `packages/` directory structure
   ```bash
   mkdir -p packages/core/src
   mkdir -p packages/cli/src
   ```

4. Update root `package.json` for workspaces
   - Add `"private": true` (required for workspaces)
   - Add `"workspaces": ["packages/*"]`
   - Update name to reflect new repo
   - Move shared dev dependencies to root
   - Update scripts for workspace commands
   - Update repository URL to new repo

5. Create `tsconfig.base.json` at root level
   - Extract common TypeScript configuration
   - Configure path aliases for cross-package imports
   - Set up project references support

6. Create `packages/core/package.json`
   - Name: `@pullapod/core`
   - Set `"private": true` (not published initially)
   - Define entry points and types

7. Create `packages/cli/package.json`
   - Name: `pullapod` (new npm package name)
   - Add dependency on `@pullapod/core: "*"` (workspace link)
   - Move CLI-specific dependencies here

8. Create package-specific `tsconfig.json` files
   - Extend from `../../tsconfig.base.json`
   - Configure project references

9. Commit initial monorepo structure
   ```bash
   git add .
   git commit -m "Initial monorepo setup from pullapod-cli"
   git push origin main
   ```

10. Verify workspace setup
    ```bash
    npm install  # Should symlink packages
    npm run build --workspaces --if-present
    ```

#### Deliverables
- [ ] New `pullapod` GitHub repository created
- [ ] Existing codebase copied to new repo
- [ ] `packages/` directory structure created
- [ ] Root `package.json` with workspaces configuration
- [ ] `tsconfig.base.json` with shared config
- [ ] `packages/core/package.json`
- [ ] `packages/core/tsconfig.json`
- [ ] `packages/cli/package.json`
- [ ] `packages/cli/tsconfig.json`
- [ ] `npm install` succeeds with workspace linking
- [ ] Initial commit pushed to new repo

---

### Phase 2: Create Core Package Structure

**Complexity:** Medium

#### Rationale
- **Establishes boundaries**: Creates the directory structure for core package
- **Defines public API**: Sets up index.ts exports pattern
- **No breaking changes yet**: Just creates structure without moving code
- **Enables incremental migration**: Each subsequent phase moves code into this structure

#### Implementation Steps

1. Create core package directory structure
   ```
   packages/core/src/
   ├── clients/
   │   └── index.ts
   ├── services/
   │   └── index.ts
   ├── storage/
   │   └── index.ts
   ├── config/
   │   └── index.ts
   ├── types.ts
   ├── errors.ts
   └── index.ts          # Public API exports
   ```

2. Create placeholder `index.ts` files with export structure
   - Each module folder gets an `index.ts` for re-exports
   - Main `src/index.ts` aggregates all public exports

3. Define error types in `packages/core/src/errors.ts`
   - Create base `PullapodError` class
   - Create specific error types: `ApiError`, `ParseError`, `DownloadError`, `StorageError`
   - Ensure errors are serializable (for future Electron IPC)

4. Create `packages/core/src/types.ts`
   - Copy existing types from `src/types.ts`
   - Add new types for service layer interfaces

5. Set up build configuration
   - Configure TypeScript to output both CommonJS and ESM
   - Set up declaration file generation
   - Configure source maps

#### Deliverables
- [ ] Core package directory structure created
- [ ] All `index.ts` export files in place
- [ ] `errors.ts` with serializable error types
- [ ] `types.ts` with core type definitions
- [ ] Build produces `dist/` with .js, .d.ts, and .map files

---

### Phase 3: Extract API Clients to Core

**Complexity:** Low

#### Rationale
- **Minimal dependencies**: Clients have few external dependencies
- **Self-contained**: No coupling to CLI-specific code
- **High reuse value**: Both CLI and desktop will use these clients
- **Validates pattern**: Confirms cross-package imports work correctly

#### Implementation Steps

1. Copy client files to core package
   - `src/clients/base-client.ts` → `packages/core/src/clients/base-client.ts`
   - `src/clients/podcast-index-client.ts` → `packages/core/src/clients/podcast-index-client.ts`
   - `src/clients/podcast-index-types.ts` → `packages/core/src/clients/podcast-index-types.ts`
   - `src/clients/index.ts` → `packages/core/src/clients/index.ts`

2. Update imports within client files
   - Adjust relative paths as needed
   - Use type-only imports where appropriate: `import type { ... }`

3. Export clients from core package
   ```typescript
   // packages/core/src/index.ts
   export * from './clients';
   ```

4. Update original CLI imports to use core package
   - Change `import { PodcastIndexClient } from '../clients'`
   - To `import { PodcastIndexClient } from '@pullapod/core'`

5. Build and test
   - Verify core package builds successfully
   - Verify CLI still works with new import paths
   - Run existing client tests

6. Remove original client files from `src/clients/` (after validation)

#### Deliverables
- [ ] `packages/core/src/clients/base-client.ts`
- [ ] `packages/core/src/clients/podcast-index-client.ts`
- [ ] `packages/core/src/clients/podcast-index-types.ts`
- [ ] `packages/core/src/clients/index.ts`
- [ ] CLI imports updated to use `@pullapod/core`
- [ ] Original `src/clients/` directory removed
- [ ] All existing tests pass

---

### Phase 4: Extract Business Logic to Core

**Complexity:** Medium

#### Rationale
- **Core functionality**: Parser, downloader, filter, metadata are the heart of the application
- **Builds on Phase 3**: Uses established patterns for code migration
- **Enables service layer**: These modules will be wrapped by services in Phase 5
- **Medium complexity**: Some refactoring needed to remove CLI dependencies

#### Implementation Steps

1. Extract parser module
   - Copy `src/parser.ts` → `packages/core/src/parser.ts`
   - Verify no CLI-specific dependencies
   - Export from core index

2. Extract filter module
   - Copy `src/filter.ts` → `packages/core/src/filter.ts`
   - Remove any console output (return data, don't print)
   - Export from core index

3. Extract downloader module
   - Copy `src/downloader.ts` → `packages/core/src/downloader.ts`
   - **Important**: Abstract progress reporting
     - Remove direct `cli-progress` dependency
     - Accept `ProgressReporter` callback interface instead
   - Handle file operations with async/await
   - Export from core index

4. Extract metadata module
   - Copy `src/metadata.ts` → `packages/core/src/metadata.ts`
   - No changes needed (already pure)
   - Export from core index

5. Extract utility modules
   - Copy `src/utils.ts` → `packages/core/src/utils.ts`
   - Copy `src/utils/validation.ts` → `packages/core/src/utils/validation.ts`
   - Copy `src/utils/format.ts` → `packages/core/src/utils/format.ts`
   - Copy `src/utils/language.ts` → `packages/core/src/utils/language.ts`
   - Copy `src/utils/errors.ts` → `packages/core/src/utils/errors.ts`
   - Create `packages/core/src/utils/index.ts` with exports

6. Extract configuration module
   - Copy `src/config/env-config.ts` → `packages/core/src/config/env-config.ts`
   - Copy `src/config/index.ts` → `packages/core/src/config/index.ts`
   - Export from core index

7. Extract storage module
   - Copy `src/storage/favorites.ts` → `packages/core/src/storage/favorites.ts`
   - **Important**: Create `FavoritesStorage` interface (abstraction)
   - Rename current implementation to `FileFavoritesStorage`
   - Export interface and implementation from core index

8. Update CLI imports to use core package
   - Update all import statements in `src/commands/`
   - Update all import statements in `src/formatters/`
   - Verify no direct imports from old locations

9. Build and validate
   - Build core package
   - Build CLI package (should use core as dependency)
   - Run all tests

10. Remove migrated files from original `src/` directory

#### Progress Abstraction

```typescript
// packages/core/src/types.ts (add to existing)
export interface ProgressReporter {
  onStart(episode: EpisodeInfo, totalBytes: number): void;
  onProgress(bytesDownloaded: number, totalBytes: number): void;
  onComplete(episode: EpisodeInfo): void;
  onError(episode: EpisodeInfo, error: Error): void;
}

export interface DownloadOptions {
  feedUrl: string;
  outputDir: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  name?: string;
  embedMetadata?: boolean;
  progressReporter?: ProgressReporter;  // Optional callback
}
```

#### Storage Abstraction

```typescript
// packages/core/src/storage/types.ts
export interface FavoritesStorage {
  list(): Promise<Favorite[]>;
  add(favorite: Favorite): Promise<void>;
  remove(nameOrUrl: string): Promise<boolean>;
  clear(): Promise<void>;
  exists(feedId: number): Promise<boolean>;
}

export interface Favorite {
  name: string;
  url: string;
  feedId: number;
  dateAdded: string;
}
```

#### Deliverables
- [ ] `packages/core/src/parser.ts`
- [ ] `packages/core/src/filter.ts`
- [ ] `packages/core/src/downloader.ts` with `ProgressReporter` interface
- [ ] `packages/core/src/metadata.ts`
- [ ] `packages/core/src/utils/` with all utility modules
- [ ] `packages/core/src/config/` with configuration
- [ ] `packages/core/src/storage/` with `FavoritesStorage` interface
- [ ] All CLI imports updated
- [ ] Original files removed from `src/`
- [ ] All tests pass

---

### Phase 5: Create Service Layer

**Complexity:** High

#### Rationale
- **Clean API**: Services provide high-level operations for consumers
- **Encapsulates complexity**: Hides implementation details from CLI/desktop
- **Enables future enhancements**: Easy to add caching, validation, logging
- **Consistent patterns**: Both CLI and desktop use same service interfaces

#### Implementation Steps

1. Create search service
   ```typescript
   // packages/core/src/services/search.ts
   export interface SearchOptions {
     query: string;
     max?: number;
     titleOnly?: boolean;
     similar?: boolean;
     language?: string;
   }

   export interface SearchResult {
     feeds: PodcastFeed[];
     count: number;
   }

   export async function searchPodcasts(
     client: PodcastIndexClient,
     options: SearchOptions
   ): Promise<SearchResult>;
   ```

2. Create episodes service
   ```typescript
   // packages/core/src/services/episodes.ts
   export interface EpisodesOptions {
     feedIdOrUrl: string;
     max?: number;
     since?: Date;
   }

   export interface EpisodesResult {
     podcast: PodcastInfo;
     episodes: Episode[];
     count: number;
   }

   export async function getEpisodes(
     client: PodcastIndexClient,
     options: EpisodesOptions
   ): Promise<EpisodesResult>;
   ```

3. Create info service
   ```typescript
   // packages/core/src/services/info.ts
   export interface InfoResult {
     podcast: PodcastInfo;
     status: 'active' | 'inactive' | 'dead';
     categories: Category[];
   }

   export async function getPodcastInfo(
     client: PodcastIndexClient,
     feedIdOrUrl: string
   ): Promise<InfoResult>;
   ```

4. Create download service
   ```typescript
   // packages/core/src/services/download.ts
   export interface DownloadOptions {
     feedUrl: string;
     outputDir: string;
     date?: string;
     startDate?: string;
     endDate?: string;
     name?: string;
     embedMetadata?: boolean;
     onProgress?: (progress: DownloadProgress) => void;
   }

   export interface DownloadProgress {
     episode: string;
     bytesDownloaded: number;
     totalBytes: number;
     percentage: number;
     phase: 'downloading' | 'metadata' | 'complete';
   }

   export interface DownloadResult {
     episodes: DownloadedEpisode[];
     failed: FailedDownload[];
   }

   export async function downloadEpisodes(
     options: DownloadOptions
   ): Promise<DownloadResult>;
   ```

5. Create favorites service
   ```typescript
   // packages/core/src/services/favorites.ts
   export async function addFavorite(
     storage: FavoritesStorage,
     client: PodcastIndexClient,
     feedUrl: string,
     customName?: string
   ): Promise<Favorite>;

   export async function removeFavorite(
     storage: FavoritesStorage,
     nameOrUrl: string
   ): Promise<boolean>;

   export async function listFavorites(
     storage: FavoritesStorage
   ): Promise<Favorite[]>;
   ```

6. Create recent service
   ```typescript
   // packages/core/src/services/recent.ts
   export interface RecentOptions {
     storage: FavoritesStorage;
     client: PodcastIndexClient;
     maxPerFeed?: number;
     days?: number;
     feedName?: string;
   }

   export interface RecentResult {
     podcasts: PodcastWithEpisodes[];
     errors: FetchError[];
   }

   export async function getRecentEpisodes(
     options: RecentOptions
   ): Promise<RecentResult>;
   ```

7. Create services index
   ```typescript
   // packages/core/src/services/index.ts
   export * from './search';
   export * from './episodes';
   export * from './info';
   export * from './download';
   export * from './favorites';
   export * from './recent';
   ```

8. Update core package exports
   ```typescript
   // packages/core/src/index.ts
   export * from './clients';
   export * from './services';
   export * from './storage';
   export * from './types';
   export * from './errors';
   export * from './config';

   // Re-export lower-level modules for advanced use
   export * from './parser';
   export * from './filter';
   export * from './downloader';
   export * from './metadata';
   ```

9. Write unit tests for each service
   - Test with mocked clients and storage
   - Test error handling
   - Test edge cases

#### Deliverables
- [ ] `packages/core/src/services/search.ts`
- [ ] `packages/core/src/services/episodes.ts`
- [ ] `packages/core/src/services/info.ts`
- [ ] `packages/core/src/services/download.ts`
- [ ] `packages/core/src/services/favorites.ts`
- [ ] `packages/core/src/services/recent.ts`
- [ ] `packages/core/src/services/index.ts`
- [ ] Updated `packages/core/src/index.ts` with all exports
- [ ] Unit tests for all services
- [ ] All tests pass

---

### Phase 6: Create CLI Package

**Complexity:** Medium

#### Rationale
- **Completes separation**: CLI becomes a thin wrapper around core services
- **Validates architecture**: Proves the service layer works correctly
- **Maintains compatibility**: Existing CLI behavior unchanged
- **Enables desktop**: Same services can be used by Electron app

#### Implementation Steps

1. Create CLI package directory structure
   ```
   packages/cli/src/
   ├── commands/
   │   ├── search.ts
   │   ├── episodes.ts
   │   ├── info.ts
   │   ├── download.ts
   │   ├── favorite.ts
   │   └── recent.ts
   ├── formatters/
   │   ├── search-formatter.ts
   │   ├── episodes-formatter.ts
   │   ├── info-formatter.ts
   │   ├── favorite-formatter.ts
   │   └── recent-formatter.ts
   ├── utils/
   │   └── progress.ts      # Terminal progress bar implementation
   └── index.ts             # CLI entry point
   ```

2. Move formatters to CLI package
   - Copy `src/formatters/*` → `packages/cli/src/formatters/`
   - These are CLI-specific (colors, terminal width, etc.)
   - No changes needed to formatter logic

3. Create terminal progress reporter
   ```typescript
   // packages/cli/src/utils/progress.ts
   import { ProgressReporter } from '@pullapod/core';
   import cliProgress from 'cli-progress';

   export class TerminalProgressReporter implements ProgressReporter {
     private bar: cliProgress.SingleBar;

     onStart(episode: EpisodeInfo, totalBytes: number): void {
       this.bar = new cliProgress.SingleBar({...});
       this.bar.start(totalBytes, 0);
     }

     onProgress(bytesDownloaded: number, totalBytes: number): void {
       this.bar.update(bytesDownloaded);
     }

     onComplete(episode: EpisodeInfo): void {
       this.bar.stop();
     }

     onError(episode: EpisodeInfo, error: Error): void {
       this.bar.stop();
     }
   }
   ```

4. Refactor command handlers to use core services
   ```typescript
   // packages/cli/src/commands/search.ts (example)
   import { searchPodcasts, PodcastIndexClient } from '@pullapod/core';
   import { formatSearchResults } from '../formatters/search-formatter';

   export async function searchCommand(query: string, options: SearchCommandOptions) {
     const client = new PodcastIndexClient(/* config */);

     const results = await searchPodcasts(client, {
       query,
       max: options.max,
       titleOnly: options.titleOnly,
       similar: options.similar,
       language: options.language,
     });

     console.log(formatSearchResults(results));
   }
   ```

5. Move and update CLI entry point
   - Copy `src/index.ts` → `packages/cli/src/index.ts`
   - Update Commander.js setup
   - Import commands from local `./commands/`
   - Import core functionality from `@pullapod/core`

6. Update CLI package.json
   ```json
   {
     "name": "pullapod",
     "version": "2.0.0",
     "bin": {
       "pullapod": "./dist/index.js"
     },
     "dependencies": {
       "@pullapod/core": "*",
       "cli-progress": "^3.12.0",
       "commander": "^14.0.2"
     }
   }
   ```

   **Note:** Since this is a new repository, we use the new package name `pullapod` from the start. Version 2.0.0 signals the new architecture.

7. Build and test
   - Build core package first
   - Build CLI package
   - Run CLI commands manually
   - Verify output matches original behavior

8. Remove migrated files from original `src/` directory

#### Deliverables
- [ ] `packages/cli/src/commands/` with all command handlers
- [ ] `packages/cli/src/formatters/` with all formatters
- [ ] `packages/cli/src/utils/progress.ts` with terminal progress
- [ ] `packages/cli/src/index.ts` CLI entry point
- [ ] `packages/cli/package.json` with dependencies
- [ ] CLI builds successfully
- [ ] All CLI commands work correctly
- [ ] Original `src/` directory emptied or removed

---

### Phase 7: Migrate Tests

**Complexity:** Medium

#### Rationale
- **Validates refactoring**: Tests prove functionality is preserved
- **Organized by package**: Tests live near the code they test
- **Enables independent testing**: Core and CLI can be tested separately
- **Maintains coverage**: Preserve existing test coverage

#### Implementation Steps

1. Create test directory structure
   ```
   packages/core/tests/
   ├── unit/
   │   ├── clients/
   │   ├── services/
   │   ├── storage/
   │   ├── utils/
   │   └── setup.ts
   └── integration/
       └── setup.ts

   packages/cli/tests/
   ├── unit/
   │   ├── commands/
   │   ├── formatters/
   │   └── setup.ts
   └── integration/
       └── setup.ts
   ```

2. Move core-related tests
   - `tests/unit/base-client.test.ts` → `packages/core/tests/unit/clients/`
   - `tests/unit/podcast-index-client.test.ts` → `packages/core/tests/unit/clients/`
   - `tests/unit/parser.test.ts` → `packages/core/tests/unit/`
   - `tests/unit/downloader.test.ts` → `packages/core/tests/unit/`
   - `tests/unit/filter.test.ts` → `packages/core/tests/unit/`
   - `tests/unit/metadata.test.ts` → `packages/core/tests/unit/`
   - `tests/unit/utils/*.test.ts` → `packages/core/tests/unit/utils/`
   - `tests/unit/storage/*.test.ts` → `packages/core/tests/unit/storage/`
   - `tests/unit/env-config.test.ts` → `packages/core/tests/unit/config/`

3. Move CLI-related tests
   - `tests/unit/commands/*.test.ts` → `packages/cli/tests/unit/commands/`
   - `tests/unit/formatters/*.test.ts` → `packages/cli/tests/unit/formatters/`

4. Create service layer tests (new)
   - Write unit tests for each service in `packages/core/tests/unit/services/`
   - Mock client and storage dependencies
   - Test success and error scenarios

5. Update test imports
   - Update import paths to use package names
   - Core tests import from `../src/` or `@pullapod/core`
   - CLI tests import from `@pullapod/core` for core modules

6. Configure Jest for workspaces
   ```javascript
   // Root jest.config.js
   module.exports = {
     projects: [
       '<rootDir>/packages/core/jest.config.js',
       '<rootDir>/packages/cli/jest.config.js',
     ],
   };
   ```

7. Create package-level Jest configs
   ```javascript
   // packages/core/jest.config.js
   module.exports = {
     displayName: 'core',
     testEnvironment: 'node',
     testMatch: ['<rootDir>/tests/**/*.test.ts'],
     // ... other config
   };
   ```

8. Update npm scripts
   ```json
   // Root package.json
   {
     "scripts": {
       "test": "jest",
       "test:core": "npm test -w @pullapod/core",
       "test:cli": "npm test -w pullapod",
       "test:coverage": "jest --coverage"
     }
   }
   ```

   **Note:** The `-w pullapod` flag targets the CLI workspace by its package name.

9. Migrate integration tests
   - Update to use new package structure
   - Ensure API credentials work in new setup

10. Verify all tests pass
    - Run full test suite
    - Check coverage meets requirements (>80%)

#### Deliverables
- [ ] `packages/core/tests/` with migrated tests
- [ ] `packages/cli/tests/` with migrated tests
- [ ] New service layer unit tests
- [ ] Root `jest.config.js` for workspace testing
- [ ] Package-level Jest configurations
- [ ] All tests pass
- [ ] Coverage >80% for both packages

---

### Phase 8: Build System & CI/CD Updates

**Complexity:** Medium

#### Rationale
- **Automated builds**: Ensure packages build in correct dependency order
- **Continuous integration**: CI must work with new structure
- **Publishing ready**: Prepare for npm publishing workflow
- **Developer experience**: Watch mode, incremental builds

#### Implementation Steps

1. Configure TypeScript project references
   ```json
   // packages/cli/tsconfig.json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "references": [
       { "path": "../core" }
     ]
   }
   ```

2. Update root build scripts
   ```json
   // Root package.json
   {
     "scripts": {
       "build": "npm run build --workspaces",
       "build:core": "npm run build -w @pullapod/core",
       "build:cli": "npm run build -w pullapod",
       "clean": "npm run clean --workspaces",
       "watch": "tsc --build --watch"
     }
   }
   ```

3. Configure build output
   - Core: CommonJS + ESM dual output
   - CLI: CommonJS only (for Node.js execution)
   ```json
   // packages/core/package.json
   {
     "main": "./dist/cjs/index.js",
     "module": "./dist/esm/index.js",
     "types": "./dist/types/index.d.ts",
     "exports": {
       ".": {
         "require": "./dist/cjs/index.js",
         "import": "./dist/esm/index.js",
         "types": "./dist/types/index.d.ts"
       }
     }
   }
   ```

4. Update ESLint configuration
   - Root config for shared rules
   - Package-specific overrides if needed
   ```json
   // Root package.json
   {
     "scripts": {
       "lint": "eslint packages/*/src",
       "lint:fix": "eslint packages/*/src --fix"
     }
   }
   ```

5. Update CI/CD workflow (GitHub Actions)
   ```yaml
   # .github/workflows/ci.yml
   jobs:
     build:
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'
         - run: npm ci
         - run: npm run build
         - run: npm run lint
         - run: npm test
   ```

6. Add pre-commit hooks
   - Update existing git hooks for workspace structure
   - Run lint and tests before commit

7. Configure npm publishing (for CLI package)
   ```json
   // packages/cli/package.json
   {
     "publishConfig": {
       "access": "public"
     },
     "files": [
       "dist/**/*"
     ]
   }
   ```

8. Create release workflow
   - Version core and CLI together (for now)
   - Use npm workspace versioning
   ```json
   // Root package.json
   {
     "scripts": {
       "release:patch": "npm version patch --workspaces && npm publish -w pullapod",
       "release:minor": "npm version minor --workspaces && npm publish -w pullapod"
     }
   }
   ```

#### Deliverables
- [ ] TypeScript project references configured
- [ ] Build scripts work correctly
- [ ] `npm run build` builds packages in order
- [ ] `npm run watch` enables development mode
- [ ] ESLint works across workspaces
- [ ] CI/CD pipeline updated and passing
- [ ] Pre-commit hooks updated
- [ ] Release workflow functional

---

### Phase 9: Validation & Documentation

**Complexity:** Low

#### Rationale
- **Quality assurance**: Verify everything works as expected
- **User documentation**: Update README and usage guides
- **Developer documentation**: Document new architecture
- **Regression testing**: Ensure no functionality lost

#### Implementation Steps

1. Manual CLI testing
   - Test all commands end-to-end:
     - `pullapod search "javascript"`
     - `pullapod episodes <feed-url>`
     - `pullapod info <feed-id>`
     - `pullapod download <feed-url> --date 2024-01-01`
     - `pullapod favorite add <feed-url>`
     - `pullapod favorite list`
     - `pullapod recent`
   - Compare output with pre-refactor behavior

2. Test npm installation
   ```bash
   # Local installation test
   npm pack -w pullapod
   npm install -g pullapod-*.tgz
   pullapod --version
   pullapod search "test"
   ```

3. Cross-platform testing
   - Test on macOS
   - Test on Linux (CI)
   - Test on Windows (if available)

4. Performance comparison
   - Run benchmarks before and after
   - Ensure no significant performance regression

5. Update README.md
   - Document new monorepo structure
   - Update installation instructions (no change for users)
   - Add developer setup guide

6. Create ARCHITECTURE.md
   ```markdown
   # Architecture

   ## Package Structure
   - @pullapod/core: Business logic and API clients
   - pullapod: CLI interface

   ## Development
   npm install        # Install all dependencies
   npm run build      # Build all packages
   npm test           # Run all tests
   npm run dev        # Development mode
   ```

7. Update CONTRIBUTING.md
   - Document workspace development workflow
   - Explain how to add features to core vs CLI

8. Create changelog entry
   - Document the refactoring
   - Note that this is backward-compatible

9. Final test suite run
   - All unit tests pass
   - All integration tests pass
   - Coverage meets requirements

10. Clean up
    - Remove any leftover files in original `src/`
    - Remove old test files
    - Archive or remove old configuration files

#### Deliverables
- [ ] All CLI commands work correctly
- [ ] npm install works globally
- [ ] No performance regression
- [ ] README.md updated
- [ ] ARCHITECTURE.md created
- [ ] CONTRIBUTING.md updated
- [ ] CHANGELOG.md entry added
- [ ] All tests pass (>80% coverage)
- [ ] Clean repository with no orphaned files

---

### Phase 10: Publish, Archive & Deprecate

**Complexity:** Low

#### Rationale
- **Clean separation**: Old repo preserved for reference, new repo is the future
- **User migration**: Clear deprecation message guides users to new package
- **Fresh start**: Version 2.0.0 in new package signals the new architecture
- **No confusion**: Archived repo clearly indicates it's no longer maintained

#### Implementation Steps

1. Publish new `pullapod` package to npm
   ```bash
   cd packages/cli
   npm publish
   ```

2. Verify new package installation works
   ```bash
   npm install -g pullapod
   pullapod --version
   pullapod --help
   pullapod search "test"
   ```

3. Deprecate old `pullapod-cli` npm package
   ```bash
   npm deprecate pullapod-cli "This package has been renamed to 'pullapod'. Please run: npm uninstall -g pullapod-cli && npm install -g pullapod"
   ```

4. Archive old GitHub repository
   - Go to GitHub → `pullapod-cli` repo → Settings → General
   - Scroll to "Danger Zone" → "Archive this repository"
   - This makes the repo read-only but preserves all history and issues

5. Update old repo README with migration notice
   Before archiving, add a notice at the top of README.md:
   ```markdown
   > **⚠️ This repository has been archived.**
   >
   > The project has moved to [pullapod](https://github.com/lwndev/pullapod).
   >
   > To migrate: `npm uninstall -g pullapod-cli && npm install -g pullapod`
   ```

6. Update new repo documentation
   - Ensure README.md has correct installation: `npm install -g pullapod`
   - Add note about migration from `pullapod-cli`
   - Update any links to point to new repo

7. Update pullapod-site (if applicable)
   - Update installation instructions
   - Update any GitHub links
   - Add migration notice if needed

8. Create GitHub release in new repo
   - Tag as v2.0.0
   - Include release notes explaining:
     - New monorepo architecture
     - Migration from `pullapod-cli`
     - New features/improvements

#### Deliverables
- [ ] `pullapod` published on npm (v2.0.0)
- [ ] Global installation `npm install -g pullapod` works
- [ ] `pullapod-cli` deprecated with migration message
- [ ] `pullapod-cli` GitHub repo archived
- [ ] Old repo README updated with migration notice
- [ ] New repo documentation complete
- [ ] pullapod-site updated (if applicable)
- [ ] GitHub release v2.0.0 created with release notes

---

## Shared Infrastructure

### TypeScript Configuration

**tsconfig.base.json** (root)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

### Package Dependency Graph

```
┌─────────────────┐
│   Root (dev)    │
│  - typescript   │
│  - jest         │
│  - eslint       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ @pullapod │ │ pullapod │
│  /core    │◄─┤  (cli)   │
└───────┘ └───────┘
```

### Error Types (Core Package)

```typescript
// packages/core/src/errors.ts
export class PullapodError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'PullapodError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      cause: this.cause?.message,
    };
  }
}

export class ApiError extends PullapodError {
  constructor(message: string, public statusCode?: number, cause?: Error) {
    super(message, 'API_ERROR', cause);
    this.name = 'ApiError';
  }
}

export class ParseError extends PullapodError { /* ... */ }
export class DownloadError extends PullapodError { /* ... */ }
export class StorageError extends PullapodError { /* ... */ }
export class ValidationError extends PullapodError { /* ... */ }
```

---

## Testing Strategy

### Unit Testing

- **Coverage goal:** >80% for all packages
- **Test framework:** Jest (existing)
- **Focus areas:**
  - Service layer functions
  - Error handling and edge cases
  - Progress callback handling
  - Storage interface implementations
  - Type exports are correct

### Integration Testing

- **Test against:** Real Podcast Index API
- **Key scenarios:**
  - Full download workflow
  - Search → Episodes → Download flow
  - Favorites persistence
  - Error recovery

### End-to-End Testing

- **Manual testing:** All CLI commands
- **Test scenarios:**
  - Global npm installation
  - All command options
  - Cross-platform behavior
  - Error messages and exit codes

---

## Dependencies

### Root Package (devDependencies)
```json
{
  "typescript": "^5.3.3",
  "@types/node": "^24.10.0",
  "jest": "^30.2.0",
  "ts-jest": "^29.1.2",
  "eslint": "^9.x",
  "typescript-eslint": "^8.x"
}
```

### Core Package (dependencies)
```json
{
  "dotenv": "^17.2.3",
  "node-id3": "^0.2.6",
  "rss-parser": "^3.13.0",
  "sanitize-filename": "^1.6.3"
}
```

### CLI Package (dependencies)
```json
{
  "@pullapod/core": "*",
  "cli-progress": "^3.12.0",
  "commander": "^14.0.2"
}
```

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Circular dependencies between packages | High | Medium | Careful dependency planning, lint rules |
| TypeScript path resolution issues | Medium | Medium | Proper tsconfig setup, test early |
| npm workspace linking failures | High | Low | Use npm v10+, test on clean install |
| Test import path breakage | Medium | High | Update incrementally, run tests often |
| Performance regression | Medium | Low | Benchmark before/after, profile if needed |
| npm publish issues | High | Low | Test with `npm pack` before publishing |
| CI/CD breakage | Medium | Medium | Update CI early, test in feature branch |
| Progress callback memory leaks | Medium | Low | Proper cleanup in ProgressReporter |

---

## Success Criteria

### Per-Phase Criteria
Each phase must meet:
- [ ] All implementation steps completed
- [ ] No regressions in existing functionality
- [ ] Tests pass
- [ ] Builds successfully

### Overall Project Success
- [ ] Monorepo structure with npm workspaces
- [ ] Core package contains all business logic
- [ ] CLI package depends on core package
- [ ] All existing CLI commands work identically
- [ ] All existing tests pass
- [ ] New service layer tests added
- [ ] Build system produces correct output
- [ ] TypeScript project references configured
- [ ] IDE navigation works across packages
- [ ] npm installation of CLI works correctly
- [ ] Global installation works correctly
- [ ] Documentation updated for new structure
- [ ] CI/CD pipeline updated
- [ ] No performance regression
- [ ] >80% test coverage maintained

---

## Milestones

### Milestone 1: Foundation Complete
- [ ] Phase 1: Repository Setup
- [ ] Phase 2: Core Package Structure
- Validates: Workspace configuration, TypeScript setup

### Milestone 2: Core Extraction Complete
- [ ] Phase 3: Extract API Clients
- [ ] Phase 4: Extract Business Logic
- [ ] Phase 5: Create Service Layer
- Validates: Core package works independently

### Milestone 3: CLI Migration Complete
- [ ] Phase 6: Create CLI Package
- [ ] Phase 7: Migrate Tests
- Validates: CLI works using core package

### Milestone 4: Release Ready
- [ ] Phase 8: Build System & CI/CD
- [ ] Phase 9: Validation & Documentation
- Validates: Ready for production use

### Milestone 5: Published & Archived
- [ ] Phase 10: Publish, Archive & Deprecate
- Validates: New package live, old repo archived, old package deprecated

---

## Code Organization

### Target Structure

```
pullapod/
├── packages/
│   ├── core/                     # @pullapod/core
│   │   ├── src/
│   │   │   ├── clients/          # API clients
│   │   │   │   ├── base-client.ts
│   │   │   │   ├── podcast-index-client.ts
│   │   │   │   ├── podcast-index-types.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/         # Business logic services
│   │   │   │   ├── search.ts
│   │   │   │   ├── episodes.ts
│   │   │   │   ├── download.ts
│   │   │   │   ├── info.ts
│   │   │   │   ├── favorites.ts
│   │   │   │   ├── recent.ts
│   │   │   │   └── index.ts
│   │   │   ├── storage/          # Data persistence
│   │   │   │   ├── types.ts
│   │   │   │   ├── file-storage.ts
│   │   │   │   └── index.ts
│   │   │   ├── config/           # Configuration
│   │   │   │   ├── env-config.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/            # Utility modules
│   │   │   │   ├── validation.ts
│   │   │   │   ├── format.ts
│   │   │   │   ├── language.ts
│   │   │   │   ├── errors.ts
│   │   │   │   └── index.ts
│   │   │   ├── parser.ts
│   │   │   ├── downloader.ts
│   │   │   ├── metadata.ts
│   │   │   ├── filter.ts
│   │   │   ├── types.ts
│   │   │   ├── errors.ts
│   │   │   └── index.ts          # Public API exports
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── cli/                      # pullapod (npm package)
│       ├── src/
│       │   ├── commands/
│       │   │   ├── search.ts
│       │   │   ├── episodes.ts
│       │   │   ├── download.ts
│       │   │   ├── info.ts
│       │   │   ├── favorite.ts
│       │   │   └── recent.ts
│       │   ├── formatters/
│       │   │   ├── search-formatter.ts
│       │   │   ├── episodes-formatter.ts
│       │   │   ├── info-formatter.ts
│       │   │   ├── favorite-formatter.ts
│       │   │   ├── recent-formatter.ts
│       │   │   └── index.ts
│       │   ├── utils/
│       │   │   └── progress.ts
│       │   └── index.ts
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                  # Workspace root
├── tsconfig.base.json            # Shared TypeScript config
├── jest.config.js                # Root Jest config
├── eslint.config.mjs             # Shared ESLint config
└── README.md
```

---

## Development Guidelines

### Code Style
- Follow existing project conventions
- Use TypeScript strict mode
- Maintain consistent error handling patterns
- Use `import type` for type-only imports
- Document complex logic with comments

### Commit Strategy
- One logical change per commit
- Clear commit messages referencing phase
- Example: `refactor(core): extract API clients to core package (Phase 3)`

### Review Process
- Self-review before commit
- Run tests after each phase
- Verify no regressions
- Check build output

### Working Directory
- All development happens in the new `pullapod/` repository (created in Phase 1)
- The old `pullapod-cli/` repository is only used for reference and is archived in Phase 10
- Use workspace commands from root:
  ```bash
  npm run build -w @pullapod/core
  npm test -w pullapod
  ```

---

## Future Enhancements

After completing this refactoring, the following enhancements become possible:

1. **Desktop Application** (`packages/desktop/`)
   - Electron app using `@pullapod/core`
   - React/Vue/Svelte UI
   - Native file dialogs
   - System tray integration

2. **Shared UI Components** (`packages/shared-ui/`)
   - Reusable components for desktop and potential web UI

3. **JSON Output Mode**
   - Add `--json` flag to all CLI commands
   - Already supported by service layer return types

4. **SQLite Storage**
   - Alternative `FavoritesStorage` implementation
   - Better performance for large favorites lists

5. **Cloud Sync**
   - Sync favorites across devices
   - `CloudFavoritesStorage` implementation

6. **Cancellation Support**
   - Add `AbortController` support to services
   - Important for desktop app responsiveness

---

## Conclusion

This implementation plan provides a systematic approach to restructuring pullapod-cli into a monorepo architecture. By following the phased approach:

1. **Phase 1-2** creates a new `pullapod` repository and establishes the workspace foundation
2. **Phase 3-5** extracts and enhances the core business logic
3. **Phase 6-7** migrates the CLI and tests
4. **Phase 8-9** finalizes build system and documentation
5. **Phase 10** publishes to npm, archives the old repository, and deprecates the old package

By creating a new repository rather than renaming the existing one, we preserve the history of `pullapod-cli` while starting fresh with a clean monorepo structure. Each phase builds on previous work, allowing for incremental validation. The end result is a clean separation between core functionality and CLI interface, enabling future development of an Electron desktop application under the cleaner `pullapod` branding.
