# Design Document

## Overview

This design transforms the Rightmove Property Scraper into a multi-site property aggregator using an adapter pattern. Each property portal (Rightmove, Zoopla, etc.) will have its own adapter that implements a common interface, while a core orchestrator manages the workflow and ensures consistent output across all sites.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Core Orchestrator                        │
│  - Input validation                                          │
│  - Site detection                                            │
│  - Adapter routing                                           │
│  - Result aggregation                                        │
│  - Cross-site deduplication                                  │
│  - Output formatting                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Rightmove  │      │    Zoopla    │     │   Future     │
│   Adapter    │      │   Adapter    │     │   Adapters   │
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

### Component Flow

```
Input URLs → Site Detection → Adapter Selection → Scraping → Field Mapping → Deduplication → Output
```

## Components and Interfaces

### 1. Base Adapter Interface

All site adapters must implement this interface:

```javascript
class BaseAdapter {
  constructor(config) {
    this.config = config;
    this.siteName = "base";
    this.sitePattern = null;
  }

  // Required methods that all adapters must implement
  async extractFromSearch(page, distressKeywords) {
    throw new Error("extractFromSearch must be implemented");
  }

  async extractPropertyDetails(page, distressKeywords) {
    throw new Error("extractPropertyDetails must be implemented");
  }

  async handlePagination(page, currentPage, maxPages) {
    throw new Error("handlePagination must be implemented");
  }

  detectPropertyUrl(url) {
    throw new Error("detectPropertyUrl must be implemented");
  }

  mapToUnifiedSchema(rawProperty) {
    throw new Error("mapToUnifiedSchema must be implemented");
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

### 2. Site Detector

```javascript
class SiteDetector {
  constructor(adapters) {
    this.adapters = adapters;
    this.cache = new Map();
  }

  detectSite(url) {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Extract domain
    const domain = new URL(url).hostname;

    // Match against adapter patterns
    for (const adapter of this.adapters) {
      if (domain.includes(adapter.sitePattern)) {
        this.cache.set(url, adapter);
        return adapter;
      }
    }

    return null;
  }

  getSupportedSites() {
    return this.adapters.map((a) => a.siteName);
  }
}
```

### 3. Core Orchestrator

```javascript
class PropertyScraperOrchestrator {
  constructor(input) {
    this.input = input;
    this.adapters = this.initializeAdapters();
    this.siteDetector = new SiteDetector(this.adapters);
    this.results = {
      properties: [],
      statistics: {},
      errors: [],
    };
  }

  initializeAdapters() {
    return [new RightmoveAdapter(this.input), new ZooplaAdapter(this.input)];
  }

  async run() {
    // Group URLs by site
    const urlsBySite = this.groupUrlsBySite();

    // Process each site
    for (const [adapter, urls] of urlsBySite) {
      await this.processSite(adapter, urls);
    }

    // Deduplicate across sites
    if (this.input.crossSiteDeduplication) {
      this.deduplicateProperties();
    }

    // Return results
    return this.results;
  }

  groupUrlsBySite() {
    const groups = new Map();

    for (const urlObj of this.input.startUrls) {
      const adapter = this.siteDetector.detectSite(urlObj.url);

      if (!adapter) {
        console.warn(`Unsupported URL: ${urlObj.url}`);
        continue;
      }

      if (!groups.has(adapter)) {
        groups.set(adapter, []);
      }
      groups.get(adapter).push(urlObj);
    }

    return groups;
  }

  async processSite(adapter, urls) {
    try {
      await adapter.initialize();

      const properties = await adapter.scrape(urls);

      this.results.properties.push(...properties);
      this.results.statistics[adapter.siteName] = {
        urlsProcessed: urls.length,
        propertiesFound: properties.length,
      };

      await adapter.cleanup();
    } catch (error) {
      this.results.errors.push({
        site: adapter.siteName,
        error: error.message,
      });
      console.error(`Error processing ${adapter.siteName}:`, error);
    }
  }

  deduplicateProperties() {
    // Implementation in next section
  }
}
```

### 4. Rightmove Adapter

```javascript
class RightmoveAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.siteName = "rightmove";
    this.sitePattern = "rightmove.co.uk";
  }

  async extractFromSearch(page, distressKeywords) {
    // Use existing Rightmove extraction logic
    return await extractFromPageModel(page, distressKeywords);
  }

  async extractPropertyDetails(page, distressKeywords) {
    // Use existing full property details extraction
    return await extractFullPropertyDetails(page, distressKeywords);
  }

  async handlePagination(page, currentPage, maxPages) {
    // Use existing Rightmove pagination logic
    return await detectPaginationLinks(page);
  }

  detectPropertyUrl(url) {
    return url.includes("/properties/");
  }

  mapToUnifiedSchema(rawProperty) {
    // Rightmove already uses the unified schema
    return {
      ...rawProperty,
      source: "rightmove",
      sourceUrl: rawProperty.url,
    };
  }
}
```

### 5. Zoopla Adapter

```javascript
class ZooplaAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.siteName = "zoopla";
    this.sitePattern = "zoopla.co.uk";
  }

  async extractFromSearch(page, distressKeywords) {
    // Zoopla-specific search extraction
    const properties = await page.evaluate(() => {
      // Zoopla uses window.__PRELOADED_STATE__ or similar
      return window.__PRELOADED_STATE__?.listing?.regular?.listings || [];
    });

    return properties.map((prop) =>
      this.parseZooplaProperty(prop, distressKeywords)
    );
  }

  async extractPropertyDetails(page, distressKeywords) {
    // Zoopla-specific detail extraction
    const data = await page.evaluate(() => {
      return window.__PRELOADED_STATE__?.listing?.propertyDetails || {};
    });

    return this.parseZooplaPropertyDetails(data, distressKeywords);
  }

  async handlePagination(page, currentPage, maxPages) {
    // Zoopla pagination detection
    const nextPageUrl = await page.evaluate(() => {
      const nextLink = document.querySelector(
        'a[data-testid="pagination-next"]'
      );
      return nextLink ? nextLink.href : null;
    });

    return nextPageUrl ? [{ url: nextPageUrl }] : [];
  }

  detectPropertyUrl(url) {
    return url.includes("/for-sale/details/");
  }

  parseZooplaProperty(prop, distressKeywords) {
    // Map Zoopla fields to our format
    const description = prop.description || "";
    const distress = detectDistress(description, distressKeywords);

    return {
      id: prop.listing_id?.toString(),
      address: prop.displayable_address,
      price: prop.price,
      description: description,
      bedrooms: prop.num_bedrooms,
      bathrooms: prop.num_bathrooms,
      propertyType: prop.property_type,
      images: prop.image_url ? [prop.image_url] : [],
      addedOn: prop.first_published_date,
      distressKeywordsMatched: distress.matched,
      distressScoreRule: distress.score,
      // Zoopla-specific fields
      zooplaData: {
        listingId: prop.listing_id,
        agentName: prop.agent_name,
        agentPhone: prop.agent_phone,
      },
    };
  }

  parseZooplaPropertyDetails(data, distressKeywords) {
    // Full property details from Zoopla
    const description = data.detailed_description || data.description || "";
    const distress = detectDistress(description, distressKeywords);

    return {
      id: data.listing_id?.toString(),
      url: data.details_url,
      address: data.displayable_address,
      displayAddress: data.display_address,
      price: data.price,
      description: description,
      bedrooms: data.num_bedrooms,
      bathrooms: data.num_bathrooms,
      propertyType: data.property_type,
      tenure: data.tenure,
      images: data.image_urls || [],
      coordinates: {
        latitude: data.latitude,
        longitude: data.longitude,
      },
      agent: data.agent_name,
      agentPhone: data.agent_phone,
      agentLogo: data.agent_logo,
      features: data.features || [],
      addedOn: data.first_published_date,
      listingUpdateDate: data.last_published_date,
      distressKeywordsMatched: distress.matched,
      distressScoreRule: distress.score,
      _scrapedAt: new Date().toISOString(),
    };
  }

  mapToUnifiedSchema(rawProperty) {
    return {
      ...rawProperty,
      source: "zoopla",
      sourceUrl: rawProperty.url,
      // Map Zoopla-specific fields to unified schema
      countryCode: "GB",
      outcode: this.extractOutcode(rawProperty.address),
      incode: this.extractIncode(rawProperty.address),
    };
  }

  extractOutcode(address) {
    const postcodeMatch = address?.match(
      /([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})/
    );
    return postcodeMatch ? postcodeMatch[1] : null;
  }

  extractIncode(address) {
    const postcodeMatch = address?.match(
      /([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})/
    );
    return postcodeMatch ? postcodeMatch[2] : null;
  }
}
```

### 6. Cross-Site Deduplication

```javascript
function deduplicateProperties(properties) {
  const groups = new Map();

  // Group by normalized address
  for (const property of properties) {
    const key = normalizeAddress(property.address);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(property);
  }

  // Process each group
  const deduplicated = [];

  for (const [address, props] of groups) {
    if (props.length === 1) {
      deduplicated.push(props[0]);
    } else {
      // Multiple properties with same address
      const merged = mergeProperties(props);
      deduplicated.push(merged);
    }
  }

  return deduplicated;
}

function normalizeAddress(address) {
  if (!address) return "";

  return address
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeProperties(properties) {
  // Keep the property with most complete data
  const sorted = properties.sort((a, b) => {
    const aFields = Object.values(a).filter(
      (v) => v !== null && v !== ""
    ).length;
    const bFields = Object.values(b).filter(
      (v) => v !== null && v !== ""
    ).length;
    return bFields - aFields;
  });

  const primary = sorted[0];
  const sources = properties.map((p) => p.source);

  return {
    ...primary,
    sources: sources,
    duplicateOf: sources.filter((s) => s !== primary.source),
    _isDuplicate: true,
  };
}
```

## Data Models

### Unified Property Schema

```javascript
{
  // Core fields (present in all adapters)
  id: string,
  url: string,
  source: 'rightmove' | 'zoopla' | string,
  sourceUrl: string,
  address: string,
  displayAddress: string,
  price: string,
  description: string,
  bedrooms: number | null,
  bathrooms: number | null,
  propertyType: string,
  images: string[],
  addedOn: string,

  // Distress detection (universal)
  distressKeywordsMatched: string[],
  distressScoreRule: number,

  // Location data
  coordinates: {
    latitude: number,
    longitude: number
  } | null,
  countryCode: string,
  outcode: string | null,
  incode: string | null,

  // Agent information
  agent: string | null,
  agentPhone: string | null,
  agentLogo: string | null,
  agentDisplayAddress: string | null,
  agentProfileUrl: string | null,

  // Property details
  tenure: string | null,
  councilTaxBand: string | null,
  features: string[],

  // Media
  brochures: Array<{url: string, caption: string}>,
  floorplans: Array<{url: string, caption: string}>,

  // Transport
  nearestStations: Array<{
    name: string,
    types: string[],
    distance: number,
    unit: string
  }>,

  // Dates and status
  listingUpdateDate: string | null,
  firstVisibleDate: string | null,
  published: boolean,
  archived: boolean,
  sold: boolean,

  // Price history (optional)
  priceHistory: Array<{date: string, price: string}>,

  // Metadata
  _scrapedAt: string,
  _isNew: boolean,

  // Deduplication fields
  sources: string[] | undefined,
  duplicateOf: string[] | undefined,
  _isDuplicate: boolean | undefined,

  // Site-specific additional data
  additionalData: object | undefined
}
```

### Enhanced Input Schema

```javascript
{
  // Existing fields
  startUrls: Array<{url: string}>,
  propertyUrls: Array<{url: string}>,
  maxItems: number,
  maxPages: number,
  proxyConfiguration: object,
  distressKeywords: string[],
  onlyDistressed: boolean,
  fullPropertyDetails: boolean,
  monitoringMode: boolean,
  enableDelistingTracker: boolean,
  includePriceHistory: boolean,

  // New multi-site fields
  crossSiteDeduplication: boolean,  // default: true
  siteConfig: {
    rightmove: {
      enabled: boolean,  // default: true
      maxPages: number,
      maxItems: number,
      distressKeywords: string[]  // site-specific keywords
    },
    zoopla: {
      enabled: boolean,  // default: true
      maxPages: number,
      maxItems: number,
      distressKeywords: string[]
    }
  }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Site detection accuracy

_For any_ valid property portal URL, the site detector should correctly identify which adapter to use
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Adapter interface compliance

_For any_ adapter implementation, all required interface methods should be implemented and callable
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 3: Unified schema consistency

_For any_ property extracted from any portal, the output should conform to the unified schema with all required fields present
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 4: Source attribution

_For any_ extracted property, the source field should correctly identify which portal it came from
**Validates: Requirements 4.3**

### Property 5: Backward compatibility

_For any_ input containing only Rightmove URLs, the output should be identical to the previous version
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 6: Cross-site deduplication correctness

_For any_ set of properties with matching addresses from different portals, deduplication should identify them as duplicates
**Validates: Requirements 7.2, 7.3**

### Property 7: Error isolation

_For any_ adapter failure, other adapters should continue processing successfully
**Validates: Requirements 11.1, 11.2, 11.5**

### Property 8: Distress detection consistency

_For any_ property description containing distress keywords, the detection should work identically across all portals
**Validates: Requirements 10.1, 10.2**

### Property 9: Field mapping completeness

_For any_ adapter, all fields in the unified schema should be mapped or set to null
**Validates: Requirements 4.5**

### Property 10: Statistics accuracy

_For any_ scraping run, the per-portal statistics should sum to the total statistics
**Validates: Requirements 9.2, 9.3**

## Error Handling

### Adapter-Level Errors

- Wrap each adapter's scraping in try-catch
- Log detailed error information including site name
- Continue with other adapters if one fails
- Return partial results with error summary

### Site Detection Errors

- Log warning for unrecognized URLs
- Skip unsupported URLs
- Continue processing remaining URLs
- Provide list of supported sites in error message

### Field Mapping Errors

- Set missing fields to null rather than failing
- Log warnings for unexpected data structures
- Include raw data in additionalData for debugging
- Continue processing other properties

## Testing Strategy

### Unit Tests

- Site detector with various URL formats
- Adapter interface compliance
- Field mapping for each adapter
- Cross-site deduplication logic
- Unified schema validation

### Property-Based Tests

We'll use **fast-check** for universal property validation:

- Property 1: Site detection (test with random URLs)
- Property 3: Schema consistency (validate all extracted properties)
- Property 5: Backward compatibility (compare outputs)
- Property 6: Deduplication (generate duplicate properties)
- Property 8: Distress detection (test across adapters)

### Integration Tests

- Scrape from Rightmove only (backward compatibility)
- Scrape from Zoopla only
- Scrape from both portals simultaneously
- Cross-site deduplication with real data
- Error handling when one portal fails

### Adapter-Specific Tests

- Rightmove adapter with existing test cases
- Zoopla adapter with Zoopla-specific test cases
- Field mapping for each adapter
- Pagination handling per adapter

## Implementation Notes

### Refactoring Existing Code

1. **Extract Rightmove logic into adapter**:

   - Move existing extraction functions into RightmoveAdapter class
   - Maintain all existing functionality
   - Add adapter interface methods

2. **Create core orchestrator**:

   - Move main workflow logic to orchestrator
   - Add site detection
   - Add adapter routing

3. **Maintain backward compatibility**:
   - Keep existing input schema
   - Add new fields as optional
   - Ensure Rightmove-only runs work identically

### Zoopla-Specific Considerations

- Zoopla uses `__PRELOADED_STATE__` for data
- Different pagination structure (data-testid attributes)
- Different URL patterns for property details
- May have different field names requiring mapping

### Performance Optimization

- Initialize adapters lazily (only when needed)
- Reuse browser contexts per adapter
- Process different portals concurrently when possible
- Cache site detection results

## Deployment

### Backward Compatibility Strategy

- Version bump to 3.0.0 (major version for new features)
- Maintain 2.x branch for Rightmove-only users
- Provide migration guide for existing users
- Test extensively with existing Rightmove configurations

### Rollout Plan

1. **Phase 1**: Refactor into adapter architecture (Rightmove only)
2. **Phase 2**: Add Zoopla adapter
3. **Phase 3**: Add cross-site features (deduplication, unified schema)
4. **Phase 4**: Testing and documentation
5. **Phase 5**: Deployment and monitoring

### Configuration Updates

Update .actor/actor.json:

- Add new input fields
- Update description to mention multi-site support
- Add examples for mixed URLs
- Update version to 3.0.0
