---
title: Apify Actor Template System
description: Reusable template for building multi-site Apify actors
inclusion: manual
tags: [apify, template, scraping, architecture]
---

# Apify Actor Template System

## Quick Reference for Kiro

When building new Apify actors, use the proven template system from the UK Property Scraper project.

### Template Location

`templates/starter-kit/` - Complete, production-ready template

### Key Components to Reuse

**Always copy as-is:**

- `src/adapters/base-adapter.js` - Interface definition
- `src/adapters/adapter-factory.js` - Site routing (update site list)
- `src/utils/logger.js` - Structured logging
- `src/utils/field-mapping.js` - Schema validation (update schema)
- `jest.config.js` - Test configuration
- `Dockerfile` - Container setup

**Always customize:**

- Schema in `field-mapping.js` - Define domain-specific fields
- Site adapters - Create new `[site]-adapter.js` files
- `adapter-factory.js` - Add site detection patterns
- `.actor/actor.json` - Input schema for use case
- `src/main.js` - Scraping logic

### Architecture Pattern

```
User Input → Adapter Factory → Site Adapter → Unified Schema → Output
```

**Adapter Pattern Benefits:**

- Site-specific logic isolated in adapters
- Easy to add new sites
- Consistent output across all sources
- Testable components

### Creating a New Site Adapter

```javascript
const BaseAdapter = require("./base-adapter");

class NewSiteAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.siteName = "newsite";
  }

  isValidUrl(url) {
    return url.includes("newsite.com");
  }

  buildPageUrl(baseUrl, pageNumber) {
    const url = new URL(baseUrl);
    url.searchParams.set("page", pageNumber + 1);
    return url.toString();
  }

  async extractFromJavaScript(page) {
    return await page.evaluate(() => window.__DATA__);
  }

  async extractFromDOM(page) {
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".item")).map((el) => ({
        id: el.getAttribute("data-id"),
        title: el.querySelector(".title")?.textContent,
        url: el.querySelector("a")?.href,
      }));
    });
  }

  normalizeData(rawData) {
    return {
      id: rawData.id,
      url: rawData.url,
      source: this.siteName,
      // Map to unified schema
      _scrapedAt: new Date().toISOString(),
      _site: this.siteName,
    };
  }
}

module.exports = NewSiteAdapter;
```

### Common Patterns

**JavaScript Extraction:**

```javascript
async extractFromJavaScript(page) {
  return await page.evaluate(() => {
    if (window.__DATA__) return window.__DATA__;
    if (window.__INITIAL_STATE__) return window.__INITIAL_STATE__;

    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) return JSON.parse(jsonLd.textContent);

    return null;
  });
}
```

**Pagination:**

```javascript
buildPageUrl(baseUrl, pageNumber) {
  const url = new URL(baseUrl);
  // Common patterns:
  url.searchParams.set('page', pageNumber + 1);      // ?page=2
  // url.searchParams.set('offset', pageNumber * 20); // ?offset=20
  // url.searchParams.set('start', pageNumber * 20);  // ?start=20
  return url.toString();
}
```

**Retry Logic:**

```javascript
async retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Unified Schema Template

```javascript
const UNIFIED_SCHEMA = {
  // Core fields
  id: "string",
  url: "string",
  source: "string",

  // Domain-specific fields (customize these)
  title: "string",
  description: "string",
  // ... add your fields

  // Cross-site features
  sources: "array",
  duplicateOf: "array",
  _isDuplicate: "boolean",

  // Metadata
  _scrapedAt: "string",
  _site: "string",
};

const REQUIRED_FIELDS = ["id", "url", "source"];
```

### Testing Template

```javascript
describe("SiteAdapter", () => {
  let adapter;

  beforeEach(() => {
    adapter = new SiteAdapter();
  });

  test("should validate URLs", () => {
    expect(adapter.isValidUrl("https://site.com")).toBe(true);
  });

  test("should build page URLs", () => {
    const url = adapter.buildPageUrl("https://site.com/search", 2);
    expect(url).toContain("page=3");
  });

  test("should normalize data", () => {
    const raw = { id: "123", title: "Test" };
    const normalized = adapter.normalizeData(raw);
    expect(normalized.source).toBe("site");
  });
});
```

### Quick Start Checklist

When building a new actor:

- [ ] Copy `templates/starter-kit/` to new directory
- [ ] Run `npm install`
- [ ] Define schema in `src/utils/field-mapping.js`
- [ ] Create first site adapter
- [ ] Update `adapter-factory.js` with site detection
- [ ] Configure `.actor/actor.json` input schema
- [ ] Write tests
- [ ] Test locally with `apify run`
- [ ] Deploy with `apify push`

### Time Savings

- Without template: 9-15 days
- With template: 4-7 hours
- **Savings: 95%**

### Documentation References

For detailed information:

- `START_HERE.md` - Entry point
- `HOW_TO_REUSE.md` - Reuse strategies
- `ACTOR_STARTER_KIT.md` - Complete reference
- `templates/starter-kit/QUICK_START.md` - 5-minute tutorial
- `templates/starter-kit/IMPLEMENTATION_GUIDE.md` - Step-by-step
- `docs/SCRAPER_TEMPLATE_GUIDE.md` - Architecture deep-dive

### Real Examples

Reference these production implementations:

- `src/adapters/rightmove-adapter.js` - Full-featured adapter
- `src/adapters/zoopla-adapter.js` - Second site example
- `src/core/orchestrator.js` - Multi-site coordination
- `src/core/deduplicator.js` - Cross-site deduplication

---

**When Kiro asks about building a new Apify actor, reference this steering document and the template system.**
