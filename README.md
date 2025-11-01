# Pull a Pod

A command-line utility to download podcast episodes from RSS feeds with proper naming and artwork embedding.

## Features

- Download podcast episodes from any RSS feed
- Filter episodes by:
  - Specific publish date
  - Date range
  - Episode name (partial match)
- Automatically downloads episode artwork
- Embeds artwork and metadata into MP3 files
- Organizes downloads into podcast-specific folders
- Clean, sanitized filenames (no GUIDs!)
- Progress indicators for downloads

## Installation

This package is published to GitHub Packages. You'll need to configure npm to use GitHub's registry for the `@lwndev` scope.

### One-time setup:

Create or edit `~/.npmrc` and add:

```
@lwndev:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

To create a GitHub token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `read:packages` scope
3. Copy the token and replace `YOUR_GITHUB_TOKEN` above

### Install globally via npm:

```bash
npm install -g @lwndev/pullapod
```

### Or install locally for development:

```bash
npm install
npm run build
npm link
```

## Usage

```bash
pullapod --feed <RSS_URL> [options]
```

### Options

- `-f, --feed <url>` - RSS feed URL (required)
- `-o, --output <directory>` - Output directory (defaults to current directory)
- `-d, --date <date>` - Download episode from specific date (YYYY-MM-DD)
- `-s, --start <date>` - Start date for range download (YYYY-MM-DD)
- `-e, --end <date>` - End date for range download (YYYY-MM-DD)
- `-n, --name <name>` - Download episode by name (partial match)
- `--no-metadata` - Skip embedding artwork and metadata
- `-h, --help` - Display help
- `-V, --version` - Display version

### Examples

Download an episode from a specific date:
```bash
pullapod --feed https://example.com/podcast.rss --date 2024-01-15
```

Download episodes from a date range:
```bash
pullapod --feed https://example.com/podcast.rss --start 2024-01-01 --end 2024-01-31
```

Download episodes by name:
```bash
pullapod --feed https://example.com/podcast.rss --name "interview"
```

Download to a specific directory:
```bash
pullapod --feed https://example.com/podcast.rss --date 2024-01-15 --output ~/Podcasts
```

Download without embedding metadata:
```bash
pullapod --feed https://example.com/podcast.rss --date 2024-01-15 --no-metadata
```

## File Organization

Downloads are organized as follows:

```
[output-directory]/
  [Podcast Name]/
    [Episode Title].mp3
    [Episode Title].jpg
```

For example:
```
~/Podcasts/
  My Favorite Podcast/
    Episode 42 - The Answer.mp3
    Episode 42 - The Answer.jpg
```

## Requirements

- Node.js 18.0.0 or higher

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (with ts-node)
npm run dev -- --feed <url> --date 2024-01-01

# Watch mode
npm run watch
```

## License

MIT
