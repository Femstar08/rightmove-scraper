# Rightmove Property Scraper - Unified Spec

## Overview

This spec defines a complete rewrite of the Rightmove Property Scraper using browser automation (Crawlee + Playwright) to handle JavaScript-rendered content. The previous HTTP + Cheerio approach no longer works because Rightmove has migrated to a Single Page Application (SPA) architecture.

## Why the Rewrite?

**Problem Identified:**

- Rightmove now uses JavaScript to render property listings dynamically
- Simple HTTP requests return empty pages or 404 errors
- Property data is embedded in JavaScript objects (`window.PAGE_MODEL`)
- The working Apify actors use Crawlee + Playwright for browser automation

**Solution:**

- Use Crawlee framework with PlaywrightCrawler
- Extract data from JavaScript objects in the page
- Implement anti-bot measures (fingerprints, delays, proxies)
- Support multiple URLs with pagination

## Key Changes from Old Implementation

### Input Format

**Old:**

```json
{
  "url": "https://www.rightmove.co.uk/...",
  "maxItems": 50,
  "useProxy": false
}
```

**New:**

```json
{
  "listUrls": [
    { "url": "https://www.rightmove.co.uk/..." },
    { "url": "https://www.rightmove.co.uk/..." }
  ],
  "maxItems": 200,
  "maxPages": 5,
  "proxy": {
    "useApifyProxy": true,
    "apifyProxyGroups": []
  },
  "distressKeywords": ["reduced", "chain free", "auction"]
}
```

### Technology Stack

**Old:**

- HTTP requests with `got`
- HTML parsing with `cheerio`
- Simple CSS selectors

**New:**

- Browser automation with `crawlee` + `playwright`
- JavaScript object extraction (`window.PAGE_MODEL`)
- DOM parsing as fallback
- Anti-bot measures built-in

### Output Format

**Enhanced with more fields:**

```json
{
  "id": "160113350",
  "url": "https://www.rightmove.co.uk/properties/160113350",
  "address": "Example Street, Manchester",
  "price": "£275,000",
  "description": "Delightful extended semi-detached...",
  "bedrooms": 3,
  "bathrooms": 1,
  "propertyType": "Semi-Detached",
  "images": ["https://media.rightmove.co.uk/..."],
  "addedOn": "2025-11-20",
  "distressKeywordsMatched": ["reduced", "motivated"],
  "distressScoreRule": 4
}
```

## Spec Structure

This unified spec contains:

1. **requirements.md** - Complete requirements for Phase 1 (browser automation) and Phase 2 (enhanced commercial features)
2. **design.md** - Technical design for both phases using Crawlee + Playwright
3. **tasks.md** - Implementation plan with Phase 1 (15 tasks) and Phase 2 (35 tasks)

### Two-Phase Approach

**Phase 1: Core Browser-Based Scraper (Tasks 1-15)**

- Browser automation with Crawlee + Playwright
- JavaScript data extraction
- Anti-bot measures
- Multiple URL support
- Basic property fields
- Distress detection

**Phase 2: Enhanced Commercial Features (Tasks 16-50)**

- Full property details (30+ fields)
- Monitoring mode (incremental scraping)
- Delisting tracker (Key-Value store)
- Price history extraction
- Direct property URL support
- Performance optimizations

## Implementation Approach

### Phase 1: Core Browser-Based Scraper

1. **Setup** (Tasks 1-2): Update dependencies, configure Playwright, implement new input validation
2. **Core Extraction** (Tasks 3-5): Set up Crawlee, implement JavaScript extraction, add DOM fallback
3. **Features** (Tasks 6-9): Add distress detection, pagination, URL processing, anti-bot measures
4. **Integration** (Tasks 10-12): Output formatting, logging, main entry point
5. **Testing & Deployment** (Tasks 13-15): Testing, documentation, deployment

### Phase 2: Enhanced Commercial Features (After Phase 1 Complete)

1. **Core Infrastructure** (Tasks 16-25): Monitoring mode, delisting tracker, enhanced input
2. **Full Property Details** (Tasks 26-35): 30+ field extraction, coordinates, agent data, media
3. **Advanced Features** (Tasks 36-45): Price history, property URLs, combined mode, optimizations
4. **Documentation & Deployment** (Tasks 46-50): Comprehensive docs, testing, deployment

## Getting Started

To begin implementation:

1. Open `.kiro/specs/rightmove-scraper/tasks.md`
2. Click "Start task" on Task 1
3. Follow the implementation plan sequentially

## Testing Strategy

- **Unit Tests**: Input validation, data extraction, distress detection
- **Property-Based Tests**: Using fast-check for universal properties
- **Integration Tests**: Full scraping workflow with real URLs
- **Manual Testing**: Verify against live Rightmove website

## Deployment

- **Docker**: Use `apify/actor-node-playwright-chrome:20` base image
- **Dependencies**: crawlee ^3.15.0, playwright ^1.40.0, apify ^3.5.0
- **Platform**: Apify Actor platform

## Notes

- All old HTTP + Cheerio code will be replaced
- The new approach is the only reliable way to scrape modern Rightmove
- Anti-bot measures are essential for production use
- Proxy usage recommended for multi-page scraping
