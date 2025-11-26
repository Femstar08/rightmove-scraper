# Design Document

## Overview

This design outlines a robust browser-based Rightmove property scraper using Crawlee and Playwright. The scraper extracts property data from JavaScript-rendered pages by accessing embedded data objects and parsing the DOM when necessary. Rightmove has migrated to a Single Page Application (SPA) architecture, requiring browser automation instead of simple HTTP requests.

## Architecture

### High-Level Flow

```
Input Validation → Crawlee Initialization → URL Processing → Data Extraction → Output
```

### Components

1. **Input Handler**: Validates and processes input configuration
2. **Crawlee Router**: Manages request routing and page handlers
3. **Data Extractor**: Extracts property data from JavaScript objects and DOM
4. **Distress Detector**: Identifies distress keywords and calculates scores
5. **Output Manager**: Formats and pushes data to Apify dataset

## Components and Interfaces

### 1. Input Handler

```javascript
interface Input {
  listUrls: Array<{url: string}>;
  maxItems?: number;
  maxPages?: number;
  proxy?: {
    useApifyProxy: boolean;
    apifyProxyGroups?: string[];
  };
  distressKeywords?: string[];
}

function validateInput(input: Input): void
function processInput(input: Input): ProcessedInput
```

### 2. Crawlee Configuration

```javascript
interface CrawleeConfig {
  requestHandler: (context) => Promise<void>;
  maxRequestsPerCrawl: number;
  maxConcurrency: number;
  proxyConfiguration?: ProxyConfiguration;
}

function createCrawler(config: CrawleeConfig): PlaywrightCrawler
```

### 3. Data Extractor

```javascript
interface PropertyData {
  id: string;
  url: string;
  address: string;
  price: string;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  images: string[];
  addedOn?: string;
  distressKeywordsMatched: string[];
  distressScoreRule: number;
}

function extractFromPageModel(page: Page): PropertyData[]
function extractFromDOM(page: Page): PropertyData[]
function extractProperty(data: any, distressKeywords: string[]): PropertyData
```

### 4. Distress Detector

```javascript
interface DistressResult {
  matched: string[];
  score: number;
}

function detectDistress(description: string | null, keywords: string[]): DistressResult
```

## Data Models

### Property Object

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

### Input Schema

```json
{
  "listUrls": [
    { "url": "https://www.rightmove.co.uk/property-for-sale/find.html?..." }
  ],
  "maxItems": 200,
  "maxPages": 5,
  "proxy": {
    "useApifyProxy": true,
    "apifyProxyGroups": []
  },
  "distressKeywords": ["reduced", "chain free", "auction", "motivated"]
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Browser initialization succeeds

_For any_ valid input configuration, initializing the Playwright crawler should succeed without errors
**Validates: Requirements 3.3**

### Property 2: JavaScript data extraction

_For any_ Rightmove property page with embedded JavaScript data, the extractor should successfully parse the PAGE_MODEL object
**Validates: Requirements 3.5, 3.6**

### Property 3: Pagination handling

_For any_ search results page with pagination, the crawler should correctly identify and queue next page URLs up to maxPages limit
**Validates: Requirements 9.2, 9.3**

### Property 4: Proxy configuration

_For any_ input where useApifyProxy is true, all browser requests should route through Apify proxy
**Validates: Requirements 3.8**

### Property 5: Distress keyword detection

_For any_ property description containing distress keywords, the detector should identify all matching keywords case-insensitively
**Validates: Requirements 4.7**

### Property 6: Distress score calculation

_For any_ set of matched keywords, the distress score should equal min(10, matched_count \* 2)
**Validates: Requirements 4.9**

### Property 7: Output schema consistency

_For any_ extracted property, the output object should contain all required fields with appropriate null values for missing data
**Validates: Requirements 5.2**

### Property 8: Error recovery

_For any_ individual URL failure, the crawler should continue processing remaining URLs
**Validates: Requirements 6.11**

### Property 9: MaxItems enforcement

_For any_ maxItems value, the total number of extracted properties should not exceed maxItems
**Validates: Requirements 1.2, 9.6**

## Error Handling

### Network Errors

- Implement retry logic with exponential backoff
- Log failed URLs for manual review
- Continue with remaining URLs after failures

### JavaScript Extraction Errors

- Fall back to DOM parsing if PAGE_MODEL is unavailable
- Log warnings for missing data fields
- Return partial data rather than failing completely

### Rate Limiting

- Detect 429 status codes and rate limit errors
- Implement automatic delays between requests
- Use session rotation to avoid blocks

## Testing Strategy

### Unit Tests

- Input validation with various invalid inputs
- Data extraction from sample HTML/JavaScript
- Distress keyword detection with edge cases
- Score calculation with boundary values

### Property-Based Tests

We'll use **fast-check** (JavaScript property-based testing library) for universal property validation:

- Property 1: Browser initialization (test with random valid configs)
- Property 5: Distress keyword detection (generate random descriptions and keywords)
- Property 6: Distress score calculation (generate random keyword match counts)
- Property 7: Output schema consistency (validate all extracted properties)
- Property 9: MaxItems enforcement (test with random maxItems values)

### Integration Tests

- Full scrape of a test URL
- Multi-page pagination handling
- Proxy configuration verification
- Error recovery scenarios

### Manual Testing

- Test against live Rightmove URLs
- Verify data accuracy against website
- Check for anti-bot detection
- Monitor performance and memory usage

## Implementation Notes

### Crawlee Setup

```javascript
import { PlaywrightCrawler } from "crawlee";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    // Extract data from page
    // Handle pagination
    // Push to dataset
  },
  maxRequestsPerCrawl: maxItems,
  maxConcurrency: 1, // Avoid rate limiting
  proxyConfiguration: proxyConfig,
});
```

### JavaScript Data Extraction

```javascript
const pageModel = await page.evaluate(() => {
  return window.PAGE_MODEL || window.__NEXT_DATA__ || null;
});

if (pageModel && pageModel.propertyData) {
  // Extract from structured data
  properties = parsePropertyData(pageModel.propertyData);
} else {
  // Fall back to DOM parsing
  properties = await extractFromDOM(page);
}
```

### Anti-Bot Measures

- Use Crawlee's built-in fingerprint generation
- Implement random delays (1-3 seconds between requests)
- Rotate user agents automatically
- Use residential proxies when available
- Respect robots.txt and rate limits

## Performance Considerations

- **Concurrency**: Start with maxConcurrency=1, increase if stable
- **Memory**: Monitor browser memory usage, restart browsers periodically
- **Speed**: Balance speed vs. detection risk
- **Caching**: Cache session data to avoid re-authentication

## Deployment

### Dependencies

```json
{
  "crawlee": "^3.15.0",
  "playwright": "^1.40.0",
  "apify": "^3.5.0"
}
```

### Docker Configuration

Use Apify's official Playwright base image:

```dockerfile
FROM apify/actor-node-playwright-chrome:20
```

### Environment Variables

- `APIFY_PROXY_PASSWORD`: For proxy authentication
- `APIFY_TOKEN`: For API access

---

# PHASE 2: Enhanced Commercial Features Design

## Phase 2 Overview

Phase 2 extends the base scraper with advanced features from the Rightmove Commercial Properties Scraper. These features should be implemented AFTER Phase 1 is complete and stable.

## Phase 2 Enhanced Data Model

### Full Property Object (30+ Fields)

```javascript
{
  // Phase 1 fields (basic)
  id: string,
  url: string,
  address: string,
  price: string,
  description: string,
  images: string[],
  addedOn: string,
  distressKeywordsMatched: string[],
  distressScoreRule: number,

  // Phase 2 additions (enhanced)
  displayAddress: string,
  countryCode: string,
  outcode: string,
  incode: string,
  coordinates: {
    latitude: number,
    longitude: number
  },
  bathrooms: number | null,
  bedrooms: number | null,
  propertyType: string,
  tenure: string | null,
  councilTaxBand: string | null,
  agent: string,
  agentPhone: string,
  agentLogo: string,
  agentDisplayAddress: string,
  agentProfileUrl: string,
  brochures: Array<{url: string, caption: string}>,
  floorplans: Array<{url: string, caption: string}>,
  nearestStations: Array<{
    name: string,
    types: string[],
    distance: number,
    unit: string
  }>,
  features: string[],
  priceHistory: Array<{date: string, price: string}>,
  published: boolean,
  archived: boolean,
  sold: boolean,
  listingUpdateDate: string,
  firstVisibleDate: string,
  _scrapedAt: string,
  _isNew: boolean
}
```

## Phase 2 Components

### 1. Monitoring Mode Handler

```javascript
async function loadPreviousPropertyIds() {
  const previousRuns = await Actor.apifyClient
    .runs()
    .list({ limit: 10, desc: true });
  if (previousRuns.items.length < 2) return new Set();

  const previousRun = previousRuns.items[1];
  const dataset = await Actor.apifyClient.dataset(previousRun.defaultDatasetId);
  const { items } = await dataset.listItems();

  return new Set(items.map((item) => item.id).filter(Boolean));
}
```

### 2. Delisting Tracker

```javascript
async function initializeDelistingTracker() {
  const store = await Actor.openKeyValueStore("rightmove-properties");
  return {
    async updateProperty(propertyId) {
      await store.setValue(propertyId, {
        lastSeen: new Date().toISOString(),
      });
    },
  };
}
```

### 3. Full Property Detail Extractor

```javascript
async function extractFullPropertyDetails(page) {
  const pageModel = await page.evaluate(() => window.PAGE_MODEL);

  if (!pageModel?.propertyData) {
    return extractBasicPropertyDetails(page);
  }

  const prop = pageModel.propertyData;
  return {
    // Extract all 30+ fields from prop object
    id: prop.id,
    coordinates: {
      latitude: prop.location?.latitude,
      longitude: prop.location?.longitude,
    },
    agent: prop.customer?.brandTradingName,
    // ... all other fields
  };
}
```

### 4. Price History Extractor

```javascript
async function extractPriceHistory(page) {
  const priceHistory = await page.evaluate(() => {
    return window.PAGE_MODEL?.propertyData?.priceHistory || [];
  });

  return priceHistory.map((entry) => ({
    date: entry.date,
    price: entry.price,
  }));
}
```

## Phase 2 Enhanced Input Schema

```json
{
  "listUrls": [{ "url": "..." }],
  "propertyUrls": [{ "url": "..." }],
  "maxItems": 200,
  "maxPages": 5,
  "proxy": { "useApifyProxy": true },
  "distressKeywords": ["reduced", "chain free"],
  "fullPropertyDetails": true,
  "includePriceHistory": false,
  "monitoringMode": false,
  "enableDelistingTracker": false,
  "addEmptyTrackerRecord": false
}
```

## Phase 2 Implementation Notes

### Performance Considerations

| Configuration                                       | Speed  | Detail  | Use Case      |
| --------------------------------------------------- | ------ | ------- | ------------- |
| fullPropertyDetails=false                           | Fast   | Basic   | Quick scans   |
| fullPropertyDetails=true, includePriceHistory=false | Medium | High    | Standard      |
| fullPropertyDetails=true, includePriceHistory=true  | Slow   | Maximum | Deep analysis |

### Error Handling Strategy

1. **Property Page Fails**: Log error, continue with next property
2. **Field Extraction Fails**: Set field to null, continue
3. **KV Store Fails**: Log warning, disable tracking, continue
4. **Monitoring Mode Fails**: Log warning, process all properties

## Phase 2 Testing Strategy

- Unit tests for monitoring mode filtering
- Unit tests for delisting tracker operations
- Unit tests for full property extraction (30+ fields)
- Integration tests for property URL mode
- Property-based tests for deduplication
- End-to-end tests with all features enabled
