# Multi-Site Scraper Template Guide

## Overview

This document explains how to reuse the architecture from this property scraper for building other multi-site scrapers. The adapter pattern we've built is highly reusable for any scenario where you need to scrape data from multiple sources with different structures.

---

## Architecture Pattern

### Core Concept

The **Adapter Pattern** allows you to:

1. Define a common interface for all data sources
2. Implement site-specific logic in separate adapters
3. Use a factory to automatically route requests to the right adapter
4. Maintain a unified output schema across all sources

### Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Core Orchestrator                        │
│  - Input validation                                          │
│  - Site detection                                            │
│  - Adapter routing                                           │
│  - Result aggregation                                        │
│  - Cross-site deduplication                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Site A     │      │    Site B    │     │   Site C     │
│   Adapter    │      │   Adapter    │     │   Adapter    │
└──────────────┘      └──────────────┘     └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Unified Schema  │
                    │  Output          │
                    └──────────────────┘
```

---

## Template Structure

### 1. Base Adapter Interface

**File:** `src/adapters/base-adapter.js`

This defines the contract that all site adapters must follow:

```javascript
class BaseSiteAdapter {
  constructor(config = {}) {
    this.config = config;
    this.siteName = "base";
    this.sitePattern = null;
  }

  // Required methods - must be implemented by all adapters
  async extractFromJavaScript(page, options) {
    throw new Error("extractFromJavaScript must be implemented");
  }

  async extractFromDOM(page, options) {
    throw new Error("extractFromDOM must be implemented");
  }

  async extractFullDetails(page, options) {
    throw new Error("extractFullDetails must be implemented");
  }

  buildPageUrl(baseUrl, pageNumber) {
    throw new Error("buildPageUrl must be implemented");
  }

  isValidUrl(url) {
    throw new Error("isValidUrl must be implemented");
  }

  normalizeData(rawData) {
    throw new Error("normalizeData must be implemented");
  }

  // Optional methods with default implementations
  async initialize() {
    // Override if adapter needs initialization
  }

  async cleanup() {
    // Override if adapter needs cleanup
  }
}
```

### 2. Adapter Factory

**File:** `src/adapters/adapter-factory.js`

Automatically detects which adapter to use:

```javascript
class AdapterFactory {
  static createAdapter(siteNameOrUrl, config = {}) {
    const siteName = this._detectSite(siteNameOrUrl);

    switch (siteName) {
      case "siteA":
        return new SiteAAdapter(config);
      case "siteB":
        return new SiteBAdapter(config);
      default:
        throw new Error(`Unsupported site: ${siteName}`);
    }
  }

  static _detectSite(siteNameOrUrl) {
    // URL detection logic
    if (siteNameOrUrl.includes("sitea.com")) return "siteA";
    if (siteNameOrUrl.includes("siteb.com")) return "siteB";
    throw new Error(`Unknown site: ${siteNameOrUrl}`);
  }

  static getSupportedSites() {
    return ["siteA", "siteB"];
  }
}
```

### 3. Core Orchestrator

**File:** `src/core/orchestrator.js`

Coordinates multiple adapters:

```javascript
class Orchestrator {
  constructor(input) {
    this.input = input;
    this.adapters = new Map();
    this.results = { items: [], statistics: {}, errors: [] };
  }

  async run() {
    // Group URLs by site
    const urlsBySite = this.groupUrlsBySite();

    // Process each site
    for (const [siteName, urls] of urlsBySite) {
      await this.processSite(siteName, urls);
    }

    // Deduplicate across sites (if enabled)
    if (this.input.crossSiteDeduplication) {
      this.deduplicateResults();
    }

    return this.results;
  }

  groupUrlsBySite() {
    // Group URLs by detected site
  }

  async processSite(siteName, urls) {
    // Process all URLs for a specific site
  }
}
```

### 4. Unified Schema

**File:** `src/schemas/unified-schema.js`

Define your output format:

```javascript
const UNIFIED_SCHEMA = {
  // Core identification
  id: "string",
  url: "string",
  source: "string", // Site name
  sourceUrl: "string",

  // Your domain-specific fields
  title: "string",
  description: "string",
  // ... add your fields

  // Cross-site deduplication
  sources: "array",
  duplicateOf: "array",
  _isDuplicate: "boolean",

  // Site-specific data
  additionalData: "object",

  // Metadata
  _scrapedAt: "string",
  _site: "string",
};
```

### 5. Field Mapping Utilities

**File:** `src/utils/field-mapping.js`

Validation and normalization:

```javascript
function validateUnifiedSchema(item, strict = false) {
  // Validate against schema
}

function setMissingFieldsToNull(item) {
  // Ensure all schema fields present
}

function mergeItems(items) {
  // Merge duplicates from different sites
}
```

---

## Step-by-Step: Creating a New Scraper

### Example: Job Board Aggregator

Let's say you want to scrape jobs from Indeed, LinkedIn, and Glassdoor.

#### Step 1: Define Your Schema

```javascript
// src/schemas/unified-job-schema.js
const UNIFIED_JOB_SCHEMA = {
  // Core fields
  id: "string",
  url: "string",
  source: "string", // 'indeed', 'linkedin', 'glassdoor'

  // Job details
  title: "string",
  company: "string",
  location: "string",
  salary: "string",
  description: "string",
  requirements: "array",
  benefits: "array",

  // Dates
  postedDate: "string",
  expiryDate: "string",

  // Company info
  companyLogo: "string",
  companySize: "string",
  industry: "string",

  // Cross-site
  sources: "array",
  duplicateOf: "array",
  _isDuplicate: "boolean",

  // Metadata
  _scrapedAt: "string",
  _site: "string",
};
```

#### Step 2: Create Base Adapter

```javascript
// src/adapters/base-job-adapter.js
class BaseJobAdapter {
  constructor(config = {}) {
    this.config = config;
    this.siteName = "base";
    this.sitePattern = null;
  }

  async extractJobs(page, searchParams) {
    throw new Error("extractJobs must be implemented");
  }

  async extractJobDetails(page) {
    throw new Error("extractJobDetails must be implemented");
  }

  buildSearchUrl(location, keywords, pageNumber) {
    throw new Error("buildSearchUrl must be implemented");
  }

  isValidUrl(url) {
    throw new Error("isValidUrl must be implemented");
  }

  normalizeJob(rawJob) {
    throw new Error("normalizeJob must be implemented");
  }
}
```

#### Step 3: Implement Site Adapters

```javascript
// src/adapters/indeed-adapter.js
class IndeedAdapter extends BaseJobAdapter {
  constructor(config) {
    super(config);
    this.siteName = "indeed";
    this.sitePattern = "indeed.com";
  }

  async extractJobs(page, searchParams) {
    // Extract jobs from Indeed's page structure
    const jobs = await page.evaluate(() => {
      // Indeed-specific extraction logic
      return window.__INDEED_DATA__.jobs;
    });

    return jobs.map((job) => this.parseIndeedJob(job));
  }

  parseIndeedJob(rawJob) {
    return {
      id: rawJob.jobkey,
      url: `https://www.indeed.com/viewjob?jk=${rawJob.jobkey}`,
      title: rawJob.title,
      company: rawJob.company,
      location: rawJob.formattedLocation,
      salary: rawJob.salary,
      description: rawJob.snippet,
      postedDate: rawJob.formattedRelativeTime,
      // ... map other fields
    };
  }

  buildSearchUrl(location, keywords, pageNumber) {
    const params = new URLSearchParams({
      q: keywords,
      l: location,
      start: pageNumber * 10,
    });
    return `https://www.indeed.com/jobs?${params}`;
  }

  isValidUrl(url) {
    return url.includes("indeed.com");
  }

  normalizeJob(job) {
    return {
      ...job,
      source: "indeed",
      sourceUrl: job.url,
      _site: "indeed",
    };
  }
}
```

```javascript
// src/adapters/linkedin-adapter.js
class LinkedInAdapter extends BaseJobAdapter {
  constructor(config) {
    super(config);
    this.siteName = "linkedin";
    this.sitePattern = "linkedin.com";
  }

  async extractJobs(page, searchParams) {
    // LinkedIn-specific extraction
    const jobs = await page.evaluate(() => {
      return window.__APOLLO_STATE__.jobs;
    });

    return jobs.map((job) => this.parseLinkedInJob(job));
  }

  // ... implement other methods
}
```

#### Step 4: Create Adapter Factory

```javascript
// src/adapters/job-adapter-factory.js
const IndeedAdapter = require("./indeed-adapter");
const LinkedInAdapter = require("./linkedin-adapter");
const GlassdoorAdapter = require("./glassdoor-adapter");

class JobAdapterFactory {
  static createAdapter(siteNameOrUrl, config = {}) {
    const siteName = this._detectSite(siteNameOrUrl);

    switch (siteName) {
      case "indeed":
        return new IndeedAdapter(config);
      case "linkedin":
        return new LinkedInAdapter(config);
      case "glassdoor":
        return new GlassdoorAdapter(config);
      default:
        throw new Error(`Unsupported job site: ${siteName}`);
    }
  }

  static _detectSite(siteNameOrUrl) {
    const lower = siteNameOrUrl.toLowerCase();

    if (lower.includes("indeed.com")) return "indeed";
    if (lower.includes("linkedin.com")) return "linkedin";
    if (lower.includes("glassdoor.com")) return "glassdoor";

    throw new Error(`Unknown job site: ${siteNameOrUrl}`);
  }

  static getSupportedSites() {
    return ["indeed", "linkedin", "glassdoor"];
  }
}
```

#### Step 5: Create Orchestrator

```javascript
// src/core/job-orchestrator.js
class JobOrchestrator {
  constructor(input) {
    this.input = input;
    this.factory = JobAdapterFactory;
    this.results = { jobs: [], statistics: {}, errors: [] };
  }

  async run() {
    const searchesBySite = this.groupSearchesBySite();

    for (const [siteName, searches] of searchesBySite) {
      await this.processSite(siteName, searches);
    }

    if (this.input.crossSiteDeduplication) {
      this.deduplicateJobs();
    }

    return this.results;
  }

  groupSearchesBySite() {
    // Group searches by site
    const groups = new Map();

    for (const search of this.input.searches) {
      const adapter = this.factory.createAdapter(search.site);
      const siteName = adapter.siteName;

      if (!groups.has(siteName)) {
        groups.set(siteName, []);
      }
      groups.get(siteName).push(search);
    }

    return groups;
  }

  async processSite(siteName, searches) {
    try {
      const adapter = this.factory.createAdapter(siteName);
      const jobs = [];

      for (const search of searches) {
        const siteJobs = await adapter.extractJobs(page, search);
        jobs.push(...siteJobs);
      }

      this.results.jobs.push(...jobs);
      this.results.statistics[siteName] = {
        searchesProcessed: searches.length,
        jobsFound: jobs.length,
      };
    } catch (error) {
      this.results.errors.push({
        site: siteName,
        error: error.message,
      });
    }
  }

  deduplicateJobs() {
    // Deduplicate jobs by title + company
    const groups = new Map();

    for (const job of this.results.jobs) {
      const key = `${job.title}-${job.company}`.toLowerCase();

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(job);
    }

    // Merge duplicates
    this.results.jobs = Array.from(groups.values()).map((group) => {
      if (group.length === 1) return group[0];

      return {
        ...group[0],
        sources: group.map((j) => j.source),
        duplicateOf: group.map((j) => j.id),
        _isDuplicate: true,
      };
    });
  }
}
```

#### Step 6: Create Main Entry Point

```javascript
// src/main.js
const { Actor } = require("apify");
const { PlaywrightCrawler } = require("crawlee");
const JobOrchestrator = require("./core/job-orchestrator");

Actor.main(async () => {
  const input = await Actor.getInput();

  // Validate input
  if (!input.searches || input.searches.length === 0) {
    throw new Error("No searches provided");
  }

  // Create orchestrator
  const orchestrator = new JobOrchestrator(input);

  // Create crawler
  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request }) {
      // Use orchestrator to process page
      const adapter = orchestrator.factory.createAdapter(request.url);
      const jobs = await adapter.extractJobs(page, request.userData);

      // Store results
      await Actor.pushData(jobs);
    },
  });

  // Run orchestrator
  const results = await orchestrator.run();

  // Output results
  console.log(`Total jobs found: ${results.jobs.length}`);
  console.log(`Statistics:`, results.statistics);

  await Actor.pushData(results.jobs);
});
```

---

## Reusable Components

### 1. Logger Utility

Copy `src/utils/logger.js` - works for any multi-site scraper:

```javascript
class Logger {
  static log(siteName, message) {
    console.log(`[${siteName.toUpperCase()}] ${message}`);
  }

  static success(siteName, message) {
    console.log(`✓ [${siteName.toUpperCase()}] ${message}`);
  }

  static error(siteName, message) {
    console.error(`❌ [${siteName.toUpperCase()}] ${message}`);
  }

  static warn(siteName, message) {
    console.warn(`⚠️  [${siteName.toUpperCase()}] ${message}`);
  }
}
```

### 2. Field Mapping Utilities

Copy `src/utils/field-mapping.js` - adapt for your schema:

```javascript
function validateSchema(item, schema, strict = false) {
  const errors = [];
  const warnings = [];

  // Check required fields
  for (const [field, type] of Object.entries(schema)) {
    if (item[field] === undefined || item[field] === null) {
      if (REQUIRED_FIELDS.includes(field)) {
        errors.push(`Required field missing: ${field}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function setMissingFieldsToNull(item, schema) {
  const normalized = { ...item };

  for (const [field, type] of Object.entries(schema)) {
    if (normalized[field] === undefined) {
      normalized[field] = type === "array" ? [] : null;
    }
  }

  return normalized;
}
```

### 3. Orchestrator Pattern

Copy `src/core/orchestrator.js` - minimal changes needed:

- Change `properties` to your domain (jobs, products, etc.)
- Update statistics tracking
- Adapt deduplication logic

---

## Configuration Template

### Input Schema (`.actor/actor.json`)

```json
{
  "title": "Multi-Site Job Scraper",
  "type": "object",
  "properties": {
    "searches": {
      "title": "Job Searches",
      "type": "array",
      "description": "List of job searches across different sites",
      "items": {
        "type": "object",
        "properties": {
          "site": {
            "type": "string",
            "enum": ["indeed", "linkedin", "glassdoor"]
          },
          "keywords": {
            "type": "string"
          },
          "location": {
            "type": "string"
          }
        }
      }
    },
    "crossSiteDeduplication": {
      "title": "Cross-Site Deduplication",
      "type": "boolean",
      "default": true
    },
    "siteConfig": {
      "title": "Site-Specific Configuration",
      "type": "object",
      "properties": {
        "indeed": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "maxResults": { "type": "integer" }
          }
        },
        "linkedin": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "maxResults": { "type": "integer" }
          }
        }
      }
    }
  }
}
```

---

## Testing Template

### Adapter Tests

```javascript
// src/adapters/indeed-adapter.test.js
describe("IndeedAdapter", () => {
  let adapter;

  beforeEach(() => {
    adapter = new IndeedAdapter();
  });

  test("should initialize with correct site name", () => {
    expect(adapter.siteName).toBe("indeed");
  });

  test("should validate Indeed URLs", () => {
    expect(adapter.isValidUrl("https://www.indeed.com/jobs")).toBe(true);
    expect(adapter.isValidUrl("https://www.linkedin.com/jobs")).toBe(false);
  });

  test("should build search URL correctly", () => {
    const url = adapter.buildSearchUrl("London", "developer", 0);
    expect(url).toContain("indeed.com");
    expect(url).toContain("q=developer");
    expect(url).toContain("l=London");
  });

  test("should parse Indeed job correctly", () => {
    const mockJob = {
      jobkey: "12345",
      title: "Software Developer",
      company: "Tech Corp",
      formattedLocation: "London, UK",
    };

    const result = adapter.parseIndeedJob(mockJob);

    expect(result.id).toBe("12345");
    expect(result.title).toBe("Software Developer");
    expect(result.company).toBe("Tech Corp");
  });
});
```

---

## Quick Start Checklist

When creating a new multi-site scraper:

- [ ] **1. Define your domain**

  - What are you scraping? (jobs, products, properties, etc.)
  - What sites will you support?

- [ ] **2. Create unified schema**

  - List all fields you need
  - Define required vs optional fields
  - Plan for site-specific data

- [ ] **3. Copy base components**

  - `src/adapters/base-adapter.js`
  - `src/adapters/adapter-factory.js`
  - `src/core/orchestrator.js`
  - `src/utils/field-mapping.js`
  - `src/utils/logger.js`

- [ ] **4. Implement site adapters**

  - One adapter per site
  - Extend base adapter
  - Implement all required methods

- [ ] **5. Create tests**

  - Unit tests for each adapter
  - Integration tests for orchestrator
  - Test with mock data

- [ ] **6. Configure Apify**

  - Update `.actor/actor.json`
  - Define input schema
  - Set memory/timeout limits

- [ ] **7. Document**
  - README with usage examples
  - Schema documentation
  - Site-specific notes

---

## Common Patterns

### Pattern 1: JavaScript Data Extraction

Many sites embed data in JavaScript:

```javascript
async extractFromJavaScript(page) {
  return await page.evaluate(() => {
    // Try common patterns
    if (window.__DATA__) return window.__DATA__;
    if (window.__PRELOADED_STATE__) return window.__PRELOADED_STATE__;
    if (window.__INITIAL_STATE__) return window.__INITIAL_STATE__;

    // Look for JSON-LD
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) return JSON.parse(jsonLd.textContent);

    return null;
  });
}
```

### Pattern 2: Pagination

```javascript
buildPageUrl(baseUrl, pageNumber) {
  const url = new URL(baseUrl);

  // Common pagination patterns:
  // ?page=2
  url.searchParams.set('page', pageNumber + 1);

  // ?offset=20
  // url.searchParams.set('offset', pageNumber * 20);

  // ?start=20
  // url.searchParams.set('start', pageNumber * 20);

  return url.toString();
}
```

### Pattern 3: Deduplication

```javascript
deduplicateItems(items, keyFn) {
  const groups = new Map();

  for (const item of items) {
    const key = keyFn(item);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }

  return Array.from(groups.values()).map(group => {
    if (group.length === 1) return group[0];

    // Merge duplicates
    return {
      ...group[0],
      sources: group.map(i => i.source),
      _isDuplicate: true
    };
  });
}
```

---

## Best Practices

### 1. Separation of Concerns

- Keep site-specific logic in adapters
- Keep common logic in utilities
- Keep orchestration in orchestrator

### 2. Error Handling

- Isolate errors per site
- Continue processing other sites if one fails
- Log detailed error information

### 3. Testing

- Test each adapter independently
- Test with mock data first
- Test integration with orchestrator

### 4. Documentation

- Document each site's structure
- Document field mappings
- Document known limitations

### 5. Performance

- Reuse browser contexts
- Implement caching where appropriate
- Respect rate limits per site

---

## Example Projects

This architecture works well for:

1. **Job Aggregators** - Indeed, LinkedIn, Glassdoor
2. **E-commerce** - Amazon, eBay, Etsy
3. **Real Estate** - Rightmove, Zoopla, OnTheMarket (this project!)
4. **News Aggregators** - Multiple news sites
5. **Price Comparison** - Multiple retailers
6. **Social Media** - Multiple platforms
7. **Review Aggregators** - Yelp, Google, TripAdvisor

---

## Conclusion

The adapter pattern provides a clean, maintainable way to scrape multiple sites with different structures. By following this template, you can quickly build new multi-site scrapers with:

- ✅ Clean separation of concerns
- ✅ Easy to add new sites
- ✅ Unified output format
- ✅ Cross-site deduplication
- ✅ Comprehensive error handling
- ✅ Well-tested components

**Next Steps:**

1. Copy the base components
2. Define your schema
3. Implement site adapters
4. Test thoroughly
5. Deploy to Apify

---

_Template created from: UK Property Scraper v2.1.0_  
_Architecture: Adapter Pattern with Orchestrator_  
_Last updated: November 30, 2025_
