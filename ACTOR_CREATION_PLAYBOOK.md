# Apify Actor Creation Playbook

> **Your complete guide to building production-ready Apify Actors from scratch**  
> Based on lessons learned from building the UK Property Scraper (Rightmove + Zoopla)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Architecture Patterns](#architecture-patterns)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Checklist](#deployment-checklist)
7. [Common Pitfalls](#common-pitfalls)
8. [Reusable Templates](#reusable-templates)

---

## Quick Start

### Prerequisites

```bash
# Install Apify CLI
npm install -g apify-cli

# Login to Apify
apify login
```

### Create New Actor (3 Options)

#### Option 1: From Scratch

```bash
apify create my-actor
cd my-actor
npm install
```

#### Option 2: From This Template

```bash
# Clone this repo as starting point
git clone <this-repo> my-new-actor
cd my-new-actor
rm -rf .git
git init
npm install
```

#### Option 3: Use Apify Console

1. Go to Apify Console → Actors → Create new
2. Choose "Empty project"
3. Clone the repo locally

---

## Project Structure

### Essential Files

```
my-actor/
├── .actor/
│   ├── actor.json          # Actor configuration & input schema
│   ├── dataset_schema.json # Output schema definition
│   └── output_schema.json  # Alternative output format
├── src/
│   ├── main.js            # Entry point
│   ├── adapters/          # Site-specific logic (if multi-site)
│   ├── core/              # Core business logic
│   ├── utils/             # Utilities
│   └── schemas/           # Data schemas
├── docs/                  # Documentation
├── templates/             # Reusable templates for future actors
├── Dockerfile             # Docker configuration
├── package.json           # Dependencies
├── jest.config.js         # Test configuration
├── .gitignore
└── README.md
```

### File Purposes

| File                | Purpose                                    | When to Edit                            |
| ------------------- | ------------------------------------------ | --------------------------------------- |
| `.actor/actor.json` | Actor metadata, input schema, build config | Always - defines your actor's interface |
| `src/main.js`       | Entry point, orchestrates scraping         | Always - your main logic                |
| `Dockerfile`        | Build environment                          | Rarely - only if special dependencies   |
| `package.json`      | Dependencies, scripts                      | Always - add your dependencies          |
| `README.md`         | User documentation                         | Always - critical for Apify Store       |

---

## Development Workflow

### Phase 1: Planning (1-2 hours)

1. **Define Your Goal**

   - What data are you extracting?
   - From how many sites?
   - What's the output format?

2. **Research Target Sites**

   - Inspect page structure (DevTools)
   - Check for JavaScript data (window.**DATA**)
   - Test pagination
   - Check robots.txt
   - Test with/without JavaScript

3. **Design Schema**
   ```javascript
   // Start with this template
   const SCHEMA = {
     // Core identification
     id: "string",
     url: "string",

     // Your domain fields
     title: "string",
     description: "string",
     // ... add your fields

     // Metadata
     _scrapedAt: "string",
     _source: "string",
   };
   ```

### Phase 2: Setup (30 minutes)

1. **Initialize Project**

   ```bash
   apify create my-actor
   cd my-actor
   npm install apify crawlee playwright cheerio
   npm install --save-dev jest fast-check nock
   ```

2. **Configure Actor**

   - Edit `.actor/actor.json`
   - Define input parameters
   - Set memory/timeout limits

3. **Setup Testing**
   ```bash
   # Copy jest.config.js from this project
   npm test
   ```

### Phase 3: Core Development (2-5 days)

#### Day 1: Basic Extraction

1. **Create Main Entry Point**

   ```javascript
   // src/main.js
   const { Actor } = require("apify");
   const { PlaywrightCrawler } = require("crawlee");

   Actor.main(async () => {
     const input = await Actor.getInput();

     const crawler = new PlaywrightCrawler({
       async requestHandler({ page, request }) {
         // Your extraction logic
       },
     });

     await crawler.run(input.startUrls);
   });
   ```

2. **Test Locally**

   ```bash
   # Create test-input.json
   apify run
   ```

3. **Verify Output**
   ```bash
   # Check storage/datasets/default/
   ```

#### Day 2-3: Enhanced Features

1. **Add Pagination**
2. **Add Full Detail Extraction**
3. **Add Error Handling**
4. **Add Logging**

#### Day 4: Multi-Site Support (if needed)

1. **Create Adapter Pattern** (see Architecture section)
2. **Implement Site Adapters**
3. **Add Orchestrator**
4. **Add Deduplication**

#### Day 5: Polish

1. **Add Comprehensive Tests**
2. **Optimize Performance**
3. **Write Documentation**
4. **Test Edge Cases**

### Phase 4: Testing (1 day)

1. **Unit Tests**

   ```bash
   npm test
   ```

2. **Integration Tests**

   ```bash
   apify run --purge
   ```

3. **Test on Apify Platform**
   ```bash
   apify push
   # Run on platform
   ```

### Phase 5: Deployment (1 day)

1. **Final Checks** (see Deployment Checklist)
2. **Push to Apify**
   ```bash
   apify push
   ```
3. **Publish to Store** (if public)
4. **Monitor First Runs**

---

## Architecture Patterns

### Pattern 1: Simple Single-Site Scraper

**Use when:** Scraping one site, straightforward structure

```javascript
// src/main.js
Actor.main(async () => {
  const input = await Actor.getInput();

  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request }) {
      const data = await extractData(page);
      await Actor.pushData(data);
    },
  });

  await crawler.run(input.startUrls);
});
```

**Pros:** Simple, fast to build  
**Cons:** Hard to extend to multiple sites

### Pattern 2: Adapter Pattern (Multi-Site)

**Use when:** Scraping multiple sites with different structures

```
Orchestrator
    ↓
AdapterFactory
    ↓
Site Adapters (A, B, C)
    ↓
Unified Schema
```

**Files:**

- `src/core/orchestrator.js` - Coordinates everything
- `src/adapters/adapter-factory.js` - Routes to correct adapter
- `src/adapters/base-adapter.js` - Common interface
- `src/adapters/site-a-adapter.js` - Site-specific logic
- `src/schemas/unified-schema.js` - Output format

**Pros:** Clean, maintainable, easy to add sites  
**Cons:** More initial setup

**See:** `docs/SCRAPER_TEMPLATE_GUIDE.md` for full implementation

### Pattern 3: Extraction Strategies

**Strategy 1: JavaScript Data Extraction**

```javascript
async extractFromJavaScript(page) {
  return await page.evaluate(() => {
    // Try common patterns
    if (window.__DATA__) return window.__DATA__;
    if (window.__PRELOADED_STATE__) return window.__PRELOADED_STATE__;

    // JSON-LD
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) return JSON.parse(jsonLd.textContent);

    return null;
  });
}
```

**Strategy 2: DOM Extraction**

```javascript
async extractFromDOM(page) {
  return await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('.item').forEach(el => {
      items.push({
        title: el.querySelector('.title')?.textContent,
        price: el.querySelector('.price')?.textContent
      });
    });
    return items;
  });
}
```

**Strategy 3: Adaptive Extraction**

```javascript
async extract(page) {
  // Try JavaScript first (faster)
  let data = await this.extractFromJavaScript(page);

  // Fallback to DOM
  if (!data) {
    data = await this.extractFromDOM(page);
  }

  return data;
}
```

---

## Testing Strategy

### Test Pyramid

```
        E2E Tests (5%)
       /            \
      /              \
     /                \
    Integration (15%)
   /                  \
  /                    \
 /                      \
Unit Tests (80%)
```

### Unit Tests

**Test:** Individual functions, utilities, adapters

```javascript
// src/utils/field-mapping.test.js
describe("validateSchema", () => {
  test("should validate required fields", () => {
    const item = { id: "123", url: "https://..." };
    const result = validateSchema(item, SCHEMA);
    expect(result.valid).toBe(true);
  });

  test("should fail on missing required fields", () => {
    const item = { id: "123" }; // missing url
    const result = validateSchema(item, SCHEMA);
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests

**Test:** Multiple components working together

```javascript
// src/adapters/integration.test.js
describe("Adapter Integration", () => {
  test("should process site A correctly", async () => {
    const adapter = AdapterFactory.createAdapter("siteA");
    const mockPage = createMockPage();

    const result = await adapter.extract(mockPage);

    expect(result).toHaveLength(10);
    expect(result[0]).toMatchSchema(UNIFIED_SCHEMA);
  });
});
```

### E2E Tests

**Test:** Full actor run

```javascript
// src/main.test.js
describe("Actor E2E", () => {
  test("should scrape and output valid data", async () => {
    const input = {
      startUrls: [{ url: "https://example.com" }],
      maxItems: 10,
    };

    await Actor.main();

    const dataset = await Actor.openDataset();
    const data = await dataset.getData();

    expect(data.items).toHaveLength(10);
    data.items.forEach((item) => {
      expect(item).toMatchSchema(UNIFIED_SCHEMA);
    });
  });
});
```

### Property-Based Testing

**Test:** Edge cases automatically

```javascript
const fc = require("fast-check");

test("should handle any valid input", () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.string(),
        url: fc.webUrl(),
        title: fc.string(),
      }),
      (item) => {
        const normalized = normalizeItem(item);
        expect(normalized).toMatchSchema(SCHEMA);
      }
    )
  );
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Code Quality**

  - [ ] All tests passing
  - [ ] No console.log (use Actor.log)
  - [ ] Error handling in place
  - [ ] Input validation

- [ ] **Configuration**

  - [ ] `.actor/actor.json` complete
  - [ ] Input schema documented
  - [ ] Output schema defined
  - [ ] Memory limits set (4096 MB recommended)
  - [ ] Timeout set (3600s recommended)

- [ ] **Documentation**

  - [ ] README.md complete
  - [ ] Usage examples
  - [ ] Input/output examples
  - [ ] Limitations documented

- [ ] **Testing**
  - [ ] Tested locally
  - [ ] Tested on Apify platform
  - [ ] Tested with various inputs
  - [ ] Tested error scenarios

### Deployment

1. **Push to Apify**

   ```bash
   apify push
   ```

2. **Test on Platform**

   - Run with test input
   - Check logs
   - Verify output
   - Check resource usage

3. **Create Build**

   - Tag as `latest`
   - Wait for build to complete

4. **Publish** (if public)
   - Add to Apify Store
   - Set pricing (if paid)
   - Add screenshots
   - Add categories/tags

### Post-Deployment

- [ ] Monitor first runs
- [ ] Check error rates
- [ ] Verify output quality
- [ ] Update documentation if needed

---

## Common Pitfalls

### 1. Not Using Proxies

**Problem:** Site blocks you after a few requests

**Solution:**

```javascript
const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ["RESIDENTIAL"], // or ['SHADER']
});

const crawler = new PlaywrightCrawler({
  proxyConfiguration,
  // ...
});
```

### 2. Not Handling Missing Data

**Problem:** Actor crashes when field is missing

**Solution:**

```javascript
// Bad
const price = data.price.toString();

// Good
const price = data.price?.toString() ?? null;
```

### 3. Not Validating Input

**Problem:** Actor fails with cryptic errors

**Solution:**

```javascript
const input = await Actor.getInput();

if (!input.startUrls || input.startUrls.length === 0) {
  throw new Error("startUrls is required");
}

if (input.maxItems < 1 || input.maxItems > 10000) {
  throw new Error("maxItems must be between 1 and 10000");
}
```

### 4. Memory Leaks

**Problem:** Actor runs out of memory

**Solution:**

- Use `maxRequestsPerCrawl` to limit
- Clear large objects after use
- Use streaming for large datasets
- Set appropriate memory limits

### 5. Not Testing on Platform

**Problem:** Works locally, fails on platform

**Solution:**

- Always test on Apify platform before publishing
- Check logs for platform-specific errors
- Test with different memory/timeout settings

### 6. Poor Error Messages

**Problem:** Users don't know what went wrong

**Solution:**

```javascript
try {
  // scraping logic
} catch (error) {
  Actor.log.error(`Failed to scrape ${url}: ${error.message}`);
  throw new Error(
    `Scraping failed. Please check the URL and try again. Details: ${error.message}`
  );
}
```

### 7. Not Using Dataset Schema

**Problem:** Output format inconsistent

**Solution:**

- Define `.actor/dataset_schema.json`
- Validate all output against schema
- Use `setMissingFieldsToNull()` utility

---

## Reusable Templates

### Template 1: Basic Actor

**Location:** `templates/basic-actor/`

**Use for:** Simple single-site scrapers

**Files:**

- `src/main.js` - Basic entry point
- `.actor/actor.json` - Minimal config
- `README.md` - Basic documentation

### Template 2: Multi-Site Actor

**Location:** `templates/multi-site-actor/`

**Use for:** Scraping multiple sites

**Files:**

- `src/core/orchestrator.js`
- `src/adapters/base-adapter.js`
- `src/adapters/adapter-factory.js`
- `src/adapters/example-adapter.js`
- `src/schemas/unified-schema.js`
- `src/utils/field-mapping.js`
- `src/utils/logger.js`

**See:** `docs/SCRAPER_TEMPLATE_GUIDE.md`

### Template 3: Adapter

**Location:** `templates/adapters/`

**Use for:** Adding new site to multi-site actor

**Files:**

- `base-adapter-template.js`
- `example-adapter-template.js`
- `adapter-factory-template.js`

---

## Key Learnings from This Project

### 1. Start Simple, Add Complexity

- Phase 1: Basic extraction (1 site, basic fields)
- Phase 2: Enhanced features (full details, monitoring)
- Phase 3: Multi-site support (adapters, deduplication)

### 2. Adaptive Extraction is Powerful

Sites change. Having multiple extraction strategies (JavaScript → DOM → Fallback) makes your actor resilient.

### 3. Testing Saves Time

Every hour spent writing tests saves 3 hours debugging in production.

### 4. Documentation is Critical

Good README = more users = more revenue (if paid actor)

### 5. Adapter Pattern Scales

Adding Zoopla took 2 hours because the adapter pattern was in place.

### 6. Schema Validation Prevents Bugs

Validating output against schema catches issues early.

### 7. Logging is Essential

Detailed logs help users debug issues without contacting you.

### 8. Proxy Configuration Matters

Residential proxies are expensive but necessary for some sites.

---

## Quick Reference

### Essential Commands

```bash
# Create new actor
apify create my-actor

# Run locally
apify run

# Run with specific input
apify run --input-file=test-input.json

# Push to Apify
apify push

# Pull from Apify
apify pull

# View logs
apify log

# Test
npm test

# Test with coverage
npm test -- --coverage
```

### Essential Packages

```json
{
  "dependencies": {
    "apify": "^3.5.0",
    "crawlee": "^3.15.0",
    "playwright": "^1.40.0",
    "cheerio": "^1.0.0-rc.12"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "fast-check": "^3.0.0",
    "nock": "^13.0.0"
  }
}
```

### Essential Patterns

**Input Validation:**

```javascript
const input = await Actor.getInput();
if (!input.startUrls) throw new Error("startUrls required");
```

**Proxy Setup:**

```javascript
const proxyConfiguration = await Actor.createProxyConfiguration(
  input.proxyConfiguration
);
```

**Error Handling:**

```javascript
try {
  // scraping
} catch (error) {
  Actor.log.error(`Error: ${error.message}`);
  throw error;
}
```

**Output:**

```javascript
await Actor.pushData(items);
```

---

## Next Steps

1. **Choose Your Template**

   - Simple actor → Use Template 1
   - Multi-site → Use Template 2

2. **Copy Reusable Components**

   - Adapters (if multi-site)
   - Utilities (logger, field-mapping)
   - Tests

3. **Customize for Your Domain**

   - Define schema
   - Implement extraction logic
   - Add domain-specific features

4. **Test Thoroughly**

   - Unit tests
   - Integration tests
   - Platform tests

5. **Deploy**
   - Follow deployment checklist
   - Monitor first runs
   - Iterate based on feedback

---

## Resources

### From This Project

- `docs/SCRAPER_TEMPLATE_GUIDE.md` - Multi-site architecture
- `docs/MULTI_SITE_GUIDE.md` - Multi-site usage
- `docs/UNIFIED_SCHEMA.md` - Schema design
- `templates/` - Reusable templates

### External Resources

- [Apify Documentation](https://docs.apify.com/)
- [Crawlee Documentation](https://crawlee.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Apify SDK Reference](https://docs.apify.com/sdk/js/)

---

## Conclusion

Building production-ready Apify Actors requires:

1. **Good Planning** - Define schema and architecture upfront
2. **Clean Architecture** - Use patterns that scale
3. **Comprehensive Testing** - Test early and often
4. **Great Documentation** - Help users succeed
5. **Iterative Development** - Start simple, add complexity

This playbook captures everything learned from building a complex multi-site property scraper. Use it as your starting point for future actors.

**Time to first actor:** 1-2 days (simple) to 1-2 weeks (complex multi-site)

**Good luck building! 🚀**

---

_Created from: UK Property Scraper v2.2.0_  
_Last updated: December 4, 2025_
