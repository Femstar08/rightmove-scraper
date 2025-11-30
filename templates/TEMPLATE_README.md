# Multi-Site Scraper Template

## Quick Start

This template provides a ready-to-use architecture for building multi-site scrapers based on the adapter pattern.

## What's Included

### Core Files (Copy These)

```
templates/
├── adapters/
│   ├── base-adapter.js          # Base adapter interface
│   ├── adapter-factory.js       # Adapter factory pattern
│   └── example-adapter.js       # Example implementation
├── core/
│   └── orchestrator.js          # Multi-site orchestrator
├── utils/
│   ├── field-mapping.js         # Schema validation
│   └── logger.js                # Site-contextual logging
└── schemas/
    └── unified-schema.js        # Output schema definition
```

## Usage

### 1. Copy Template Files

```bash
# Copy the template to your new project
cp -r templates/adapters src/adapters
cp -r templates/core src/core
cp -r templates/utils src/utils
cp -r templates/schemas src/schemas
```

### 2. Define Your Schema

Edit `src/schemas/unified-schema.js`:

```javascript
const UNIFIED_SCHEMA = {
  // Core fields
  id: "string",
  url: "string",
  source: "string",

  // Your domain-specific fields
  title: "string",
  description: "string",
  // ... add your fields
};
```

### 3. Implement Site Adapters

Create a new adapter for each site:

```javascript
// src/adapters/site-a-adapter.js
const BaseAdapter = require("./base-adapter");

class SiteAAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.siteName = "siteA";
    this.sitePattern = "sitea.com";
  }

  async extractData(page, options) {
    // Site-specific extraction logic
  }

  // Implement other required methods
}

module.exports = SiteAAdapter;
```

### 4. Update Adapter Factory

Add your adapters to the factory:

```javascript
// src/adapters/adapter-factory.js
const SiteAAdapter = require("./site-a-adapter");
const SiteBAdapter = require("./site-b-adapter");

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
    if (siteNameOrUrl.includes("sitea.com")) return "siteA";
    if (siteNameOrUrl.includes("siteb.com")) return "siteB";
    throw new Error(`Unknown site: ${siteNameOrUrl}`);
  }
}
```

### 5. Create Main Entry Point

```javascript
// src/main.js
const { Actor } = require("apify");
const Orchestrator = require("./core/orchestrator");

Actor.main(async () => {
  const input = await Actor.getInput();
  const orchestrator = new Orchestrator(input);
  const results = await orchestrator.run();
  await Actor.pushData(results.items);
});
```

## Features

✅ **Multi-Site Support** - Scrape from multiple sources  
✅ **Unified Output** - Consistent data format  
✅ **Automatic Site Detection** - Routes to correct adapter  
✅ **Cross-Site Deduplication** - Merge duplicates  
✅ **Error Isolation** - One site failure doesn't affect others  
✅ **Enhanced Logging** - Site-contextual messages  
✅ **Extensible** - Easy to add new sites

## Architecture

```
Input URLs → Site Detection → Adapter Factory
                                    ↓
                            Site-Specific Adapter
                                    ↓
                            Field Mapping
                                    ↓
                            Unified Schema Output
```

## Testing

```bash
# Run tests
npm test

# Test specific adapter
npm test -- src/adapters/site-a-adapter.test.js
```

## Documentation

- [Full Template Guide](../docs/SCRAPER_TEMPLATE_GUIDE.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)
- [API Reference](../docs/API.md)

## Examples

See the main project for a complete implementation:

- Rightmove adapter (property scraping)
- Zoopla adapter (property scraping)
- Multi-site orchestration
- Cross-site deduplication

## Support

For questions or issues:

1. Check the [Template Guide](../docs/SCRAPER_TEMPLATE_GUIDE.md)
2. Review example implementations
3. Check test files for usage examples

---

_Based on: UK Property Scraper v2.1.0_  
_Pattern: Adapter Pattern with Orchestrator_
