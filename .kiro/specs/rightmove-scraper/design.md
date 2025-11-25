# Design Document: Rightmove Property Scraper Actor

## Overview

The Rightmove Property Scraper Actor is an Apify Actor that extracts property listing data from Rightmove search result pages. It conforms to the Apify Actor Specification 1 (2025) and uses Cheerio for HTML parsing. The Actor accepts a Rightmove search URL and maximum items limit as input, fetches the page, parses property cards, and returns structured data containing property details.

The Actor follows a simple pipeline architecture:

1. Read and validate input parameters
2. Fetch the HTML content from the provided URL
3. Parse the HTML using Cheerio to extract property cards
4. Transform each property card into a structured object
5. Return an array of property objects

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Apify Platform │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Actor Runtime  │
│  (Node.js 20)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Main Entry Point            │
│         (src/main.js)               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Input Reading & Validation     │
│      (Apify.getInput())             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      HTTP Fetcher                   │
│      (got library)                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      HTML Parser                    │
│      (Cheerio)                      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Data Extractor                 │
│      (CSS Selectors)                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Output Handler                 │
│      (Apify.pushData())             │
└─────────────────────────────────────┘
```

### Component Responsibilities

1. **Actor Configuration** (.actor/actor.json)

   - Defines Actor metadata and specification version
   - Declares input schema with validation rules
   - Specifies build configuration and supported runtime

2. **Main Entry Point** (src/main.js)

   - Initializes Apify SDK
   - Orchestrates the scraping pipeline
   - Handles errors and logging

3. **Input Handler**

   - Reads input from Apify.getInput()
   - Validates required fields
   - Applies default values

4. **HTTP Fetcher**

   - Makes HTTP GET request to Rightmove URL
   - Handles network errors and retries
   - Returns HTML content

5. **HTML Parser**

   - Loads HTML into Cheerio
   - Selects property card elements
   - Provides DOM traversal interface

6. **Data Extractor**

   - Extracts individual fields from property cards
   - Handles missing or malformed data
   - Constructs property objects

7. **Output Handler**
   - Pushes extracted data to Apify dataset
   - Logs summary statistics

## Components and Interfaces

### Actor Configuration Interface

**File:** `.actor/actor.json`

```json
{
  "actorSpecification": 1,
  "name": "rightmove-scraper",
  "title": "Rightmove Property Scraper with Distress Detection",
  "description": "Scrapes property listings from Rightmove search results with built-in distress keyword detection for identifying investment opportunities",
  "version": "1.0",
  "buildTag": "latest",
  "dockerfile": "./Dockerfile",
  "input": {
    "title": "Rightmove Scraper Input",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
      "url": {
        "title": "Rightmove Search URL",
        "type": "string",
        "description": "The URL of the Rightmove search results page to scrape",
        "editor": "textfield",
        "example": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
      },
      "maxItems": {
        "title": "Maximum Items",
        "type": "integer",
        "description": "Maximum number of property listings to extract across all pages",
        "default": 50,
        "minimum": 1,
        "maximum": 1000
      },
      "maxPages": {
        "title": "Maximum Pages",
        "type": "integer",
        "description": "Maximum number of search result pages to process",
        "default": 1,
        "minimum": 1,
        "maximum": 50
      },
      "useProxy": {
        "title": "Use Proxy",
        "type": "boolean",
        "description": "Enable Apify proxy to avoid rate limiting and IP blocks",
        "default": false
      },
      "distressKeywords": {
        "title": "Distress Keywords",
        "type": "array",
        "description": "Keywords to detect in property descriptions that indicate potential distressed sales",
        "editor": "stringList",
        "default": [
          "reduced",
          "chain free",
          "auction",
          "motivated",
          "cash buyers",
          "needs renovation"
        ],
        "items": {
          "type": "string"
        }
      }
    },
    "required": ["url"]
  }
}
```

### Input Interface

```javascript
{
  url: string,                    // Required: Rightmove search URL
  maxItems: number,               // Optional: Max properties to extract (default: 50)
  maxPages: number,               // Optional: Max pages to scrape (default: 1)
  useProxy: boolean,              // Optional: Use Apify proxy (default: false)
  distressKeywords: string[]      // Optional: Keywords indicating distressed sales (default: ["reduced", "chain free", "auction", "motivated", "cash buyers", "needs renovation"])
}
```

### Output Interface

```javascript
[
  {
    url: string,                        // Property detail page URL
    address: string,                    // Property address
    price: string,                      // Property price (e.g., "£350,000")
    description: string,                // Property description
    addedOn: string,                    // Date added (e.g., "Added today", "Added on 15/01/2025")
    image: string,                      // Main property image URL
    distressKeywordsMatched: string[],  // Array of matched distress keywords
    distressScoreRule: number           // Simple rule-based distress score (0-10)
  },
  // ... more properties
];
```

### Main Module Interface

**File:** `src/main.js`

```javascript
// Main execution function
async function main() {
  // Initialize Apify
  await Apify.init();

  // Get input
  const input = await Apify.getInput();

  // Validate input
  validateInput(input);

  // Process input with defaults
  const config = processInput(input);

  // Log configuration
  console.log(`Starting scraper with URL: ${config.url}`);
  console.log(
    `Max items: ${config.maxItems}, Max pages: ${config.maxPages}, Use proxy: ${config.useProxy}`
  );
  console.log(`Distress keywords: ${config.distressKeywords.join(", ")}`);

  // Fetch and parse with pagination
  const properties = await scrapeProperties(config);

  // Push results
  await Apify.pushData(properties);

  // Log summary
  console.log(
    `Extracted ${properties.length} properties from ${config.pagesProcessed} page(s)`
  );

  // Exit
  await Apify.exit();
}

// Input validation
function validateInput(input) {
  if (!input || !input.url) {
    throw new Error('Input must contain a "url" field');
  }
}

// Process input with defaults
function processInput(input) {
  return {
    url: input.url,
    maxItems: input.maxItems || 50,
    maxPages: input.maxPages || 1,
    useProxy: input.useProxy || false,
    distressKeywords: input.distressKeywords || [
      "reduced",
      "chain free",
      "auction",
      "motivated",
      "cash buyers",
      "needs renovation",
    ],
    pagesProcessed: 0,
  };
}

// Scraping function with pagination
async function scrapeProperties(config) {
  const allProperties = [];

  for (let page = 0; page < config.maxPages; page++) {
    if (allProperties.length >= config.maxItems) break;

    const pageUrl = buildPageUrl(config.url, page);
    console.log(`Fetching page ${page + 1}/${config.maxPages}: ${pageUrl}`);

    // Fetch HTML
    const html = await fetchPage(pageUrl, config.useProxy);

    // Parse with Cheerio
    const $ = cheerio.load(html);

    // Extract properties from this page
    const pageProperties = extractPropertiesFromPage(
      $,
      config.distressKeywords,
      config.maxItems - allProperties.length
    );

    console.log(
      `Found ${pageProperties.length} properties on page ${page + 1}`
    );

    allProperties.push(...pageProperties);
    config.pagesProcessed++;

    if (pageProperties.length === 0) break; // No more results
  }

  return allProperties;
}

// Build paginated URL
function buildPageUrl(baseUrl, pageIndex) {
  if (pageIndex === 0) return baseUrl;

  const url = new URL(baseUrl);
  url.searchParams.set("index", (pageIndex * 24).toString()); // Rightmove uses index parameter
  return url.toString();
}

// HTTP fetcher with proxy support
async function fetchPage(url, useProxy) {
  const options = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  };

  if (useProxy) {
    options.proxyUrl = Apify.getApifyProxyUrl();
  }

  const response = await got(url, options);
  return response.body;
}

// Extract properties from a page
function extractPropertiesFromPage($, distressKeywords, maxItems) {
  const properties = [];

  $(".propertyCard").each((index, element) => {
    if (properties.length >= maxItems) return false;

    const property = extractProperty($, element, distressKeywords);
    properties.push(property);
  });

  return properties;
}

// Property extractor with distress detection
function extractProperty($, element, distressKeywords) {
  const description = extractDescription($, element);
  const distressData = detectDistress(description, distressKeywords);

  return {
    url: extractUrl($, element),
    address: extractAddress($, element),
    price: extractPrice($, element),
    description: description,
    addedOn: extractAddedOn($, element),
    image: extractImage($, element),
    distressKeywordsMatched: distressData.matched,
    distressScoreRule: distressData.score,
  };
}

// Detect distress keywords and calculate score
function detectDistress(description, distressKeywords) {
  if (!description) {
    return { matched: [], score: 0 };
  }

  const lowerDesc = description.toLowerCase();
  const matched = distressKeywords.filter((keyword) =>
    lowerDesc.includes(keyword.toLowerCase())
  );

  // Simple scoring: 2 points per keyword, max 10
  const score = Math.min(10, matched.length * 2);

  return { matched, score };
}
```

## Data Models

### Property Object

```javascript
{
  url: string | null,                    // Full URL to property detail page
  address: string | null,                // Full property address
  price: string | null,                  // Price as displayed (e.g., "£350,000", "POA")
  description: string | null,            // Property description text
  addedOn: string | null,                // Date information (e.g., "Added today")
  image: string | null,                  // URL of main property image
  distressKeywordsMatched: string[],     // Array of matched distress keywords (empty array if none)
  distressScoreRule: number              // Rule-based distress score 0-10 (0 if no matches)
}
```

**Field Specifications:**

- **url**: Absolute URL constructed from relative href if needed
- **address**: Complete address string as displayed on the card
- **price**: Price string including currency symbol, or "POA" for price on application
- **description**: Property description or summary text
- **addedOn**: Date string as displayed (various formats possible)
- **image**: Absolute URL to the property image, handling lazy-loaded images if needed
- **distressKeywordsMatched**: Array of keywords from distressKeywords input that were found in the description (case-insensitive matching)
- **distressScoreRule**: Simple score calculated as: min(10, number of matched keywords \* 2), providing a 0-10 scale

### Input Schema Model

```javascript
{
  url: {
    type: "string",
    required: true,
    validation: "non-empty string"
  },
  maxItems: {
    type: "integer",
    required: false,
    default: 50,
    validation: "1 <= value <= 1000"
  }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Input URL reading

_For any_ input object containing a url field, the actor should successfully read and use that URL value
**Validates: Requirements 1.1**

### Property 2: MaxItems default value

_For any_ input object, if the maxItems field is not provided, the actor should use 50 as the default value
**Validates: Requirements 1.2**

### Property 3: Invalid input rejection

_For any_ input object where the url field is missing, empty, or null, the actor should terminate with a clear error message
**Validates: Requirements 1.3**

### Property 4: MaxItems limit enforcement

_For any_ valid Rightmove page and any maxItems value, the number of extracted properties should not exceed the maxItems limit
**Validates: Requirements 3.4**

### Property 5: Complete property object structure

_For any_ extracted property object, it should contain all six required fields (url, address, price, description, addedOn, image), with null or empty values for missing data rather than omitting fields
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2**

### Property 6: Array output format

_For any_ actor execution, the output should be an array of property objects
**Validates: Requirements 5.1**

### Property 7: Extraction count logging

_For any_ successful actor execution, a log message should be produced containing the count of extracted properties
**Validates: Requirements 5.4**

### Property 8: Network error handling

_For any_ network error during page fetching, the actor should handle it gracefully and log an appropriate error message without crashing
**Validates: Requirements 3.5**

### Property 9: MaxPages default value

_For any_ input object, if the maxPages field is not provided, the actor should use 1 as the default value
**Validates: Requirements 1.3**

### Property 10: UseProxy default value

_For any_ input object, if the useProxy field is not provided, the actor should use false as the default value
**Validates: Requirements 1.4**

### Property 11: DistressKeywords default value

_For any_ input object, if the distressKeywords field is not provided, the actor should use the default array ["reduced", "chain free", "auction", "motivated", "cash buyers", "needs renovation"]
**Validates: Requirements 1.5**

### Property 12: Proxy configuration usage

_For any_ valid Rightmove URL, when useProxy is set to true, all HTTP requests should use Apify proxy configuration
**Validates: Requirements 3.2**

### Property 13: Multi-page processing

_For any_ valid Rightmove URL and maxPages value greater than 1, the actor should fetch and process up to maxPages pages
**Validates: Requirements 3.6**

### Property 14: Cross-page aggregation with maxItems limit

_For any_ multi-page scraping run, the total number of extracted properties should not exceed maxItems, even when aggregating across multiple pages
**Validates: Requirements 3.7**

### Property 15: Distress keyword detection

_For any_ property description and distressKeywords array, the actor should correctly identify all keywords present in the description (case-insensitive)
**Validates: Requirements 4.7**

### Property 16: Matched keywords collection

_For any_ property with distress keywords in the description, the distressKeywordsMatched field should contain exactly the keywords that were found
**Validates: Requirements 4.8**

### Property 17: Distress score calculation

_For any_ property, the distressScoreRule should equal min(10, number of matched keywords \* 2)
**Validates: Requirements 4.9**

### Property 18: Stable output shape with null defaults

_For any_ extracted property object, all fields (url, address, price, description, addedOn, image, distressKeywordsMatched, distressScoreRule) should be present, with null for missing string fields and empty array for distressKeywordsMatched when no keywords match
**Validates: Requirements 5.6**

## Error Handling

### Input Validation Errors

**Missing URL Error:**

- **Trigger:** Input object missing `url` field or `url` is empty/null
- **Response:** Throw descriptive error: "Input must contain a non-empty 'url' field"
- **Exit Code:** Non-zero exit

**Invalid MaxItems Error:**

- **Trigger:** `maxItems` is not a positive integer
- **Response:** Log warning and use default value of 50
- **Exit Code:** Continue execution

### Network Errors

**HTTP Request Failure:**

- **Trigger:** Network timeout, DNS failure, connection refused
- **Response:**
  - Log error with details: "Failed to fetch URL: {url}. Error: {error message}"
  - Throw error to terminate actor
- **Exit Code:** Non-zero exit

**HTTP Error Status:**

- **Trigger:** Response status >= 400 (404, 500, etc.)
- **Response:**
  - Log error: "Received HTTP {status} for URL: {url}"
  - Throw error to terminate actor
- **Exit Code:** Non-zero exit

### Parsing Errors

**Invalid HTML:**

- **Trigger:** Malformed HTML that Cheerio cannot parse
- **Response:**
  - Log warning: "HTML parsing encountered issues but will continue"
  - Continue with best-effort parsing
- **Exit Code:** Continue execution

**No Property Cards Found:**

- **Trigger:** No elements matching property card selector
- **Response:**
  - Log info: "No property cards found on page"
  - Return empty array
- **Exit Code:** Zero (success)

**Missing Field Data:**

- **Trigger:** Expected field not found in property card HTML
- **Response:**
  - Set field value to null
  - Log debug message: "Field {fieldName} not found for property"
  - Continue extraction
- **Exit Code:** Continue execution

### General Error Handling Strategy

1. **Fail Fast for Critical Errors:** Input validation and network errors should terminate execution immediately
2. **Graceful Degradation for Data Issues:** Missing fields or parsing issues should not stop extraction
3. **Comprehensive Logging:** All errors should be logged with sufficient context for debugging
4. **Clean Exit:** Always call `await Apify.exit()` to ensure proper cleanup

## Testing Strategy

The Rightmove Property Scraper Actor will employ a dual testing approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Unit Testing

Unit tests will verify specific examples, edge cases, and integration points:

**Input Validation Tests:**

- Test with valid URL and maxItems
- Test with missing URL (should throw error)
- Test with empty URL string (should throw error)
- Test with missing maxItems (should default to 50)
- Test with maxItems = 0 (should use default)

**Extraction Tests:**

- Test extraction with mock HTML containing complete property cards
- Test extraction with mock HTML containing incomplete property cards (missing fields)
- Test extraction with empty HTML (no property cards)
- Test URL construction for relative and absolute hrefs

**Integration Tests:**

- Test complete pipeline with mock HTTP responses
- Test error handling with simulated network failures

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using the **fast-check** library for JavaScript. Each property test will run a minimum of 100 iterations.

**Configuration:**

- Library: fast-check (npm package)
- Minimum iterations per property: 100
- Test framework: Jest or Mocha

**Property Test Requirements:**

- Each property-based test MUST be tagged with a comment referencing the correctness property
- Tag format: `// Feature: rightmove-scraper, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Property Tests to Implement:**

1. **Property 1 Test:** Generate random input objects with various URL values, verify actor reads them correctly
2. **Property 2 Test:** Generate random input objects with and without maxItems, verify default of 50 is applied
3. **Property 3 Test:** Generate invalid inputs (missing/empty/null URL), verify error is thrown
4. **Property 4 Test:** Generate mock HTML with varying numbers of property cards and random maxItems values, verify output length ≤ maxItems
5. **Property 5 Test:** Generate mock property cards with random field presence, verify all 6 fields exist in output (with null for missing)
6. **Property 6 Test:** Generate random valid inputs, verify output is always an array
7. **Property 7 Test:** Generate random valid inputs, verify log output contains extraction count
8. **Property 8 Test:** Simulate random network errors, verify graceful handling and error logging

### Test Data Generation

For property-based tests, we will need generators for:

- **URL Generator:** Valid and invalid URL strings
- **HTML Generator:** Mock Rightmove HTML with varying numbers of property cards
- **Property Card Generator:** HTML fragments with complete or partial property data
- **Input Object Generator:** Valid and invalid input configurations

### Testing Tools

- **Unit Testing:** Jest
- **Property-Based Testing:** fast-check
- **HTML Mocking:** Cheerio with string templates
- **HTTP Mocking:** nock or similar library for intercepting HTTP requests

### Test Coverage Goals

- **Line Coverage:** Minimum 80%
- **Branch Coverage:** Minimum 75%
- **Property Coverage:** 100% of correctness properties must have corresponding property-based tests

## Distress Detection Strategy

### Keyword-Based Detection

The Actor implements a simple but effective rule-based distress detection system that identifies potential investment opportunities without requiring external AI services.

**How It Works:**

1. **Keyword Matching**: For each property description, the system performs case-insensitive matching against the distressKeywords array
2. **Match Collection**: All matched keywords are collected in the `distressKeywordsMatched` array
3. **Score Calculation**: A simple rule-based score is calculated: `min(10, matched_count * 2)`

**Default Distress Keywords:**

- "reduced" - Price reductions often indicate motivated sellers
- "chain free" - No chain means faster completion
- "auction" - Auction properties often sell below market value
- "motivated" - Explicitly motivated sellers
- "cash buyers" - Urgency to sell
- "needs renovation" - Properties requiring work often sell at discount

**Scoring Logic:**

- 0 keywords matched = 0 score (not distressed)
- 1 keyword matched = 2 score (possibly distressed)
- 2 keywords matched = 4 score (likely distressed)
- 3 keywords matched = 6 score (very likely distressed)
- 4 keywords matched = 8 score (highly distressed)
- 5+ keywords matched = 10 score (maximum distress signal)

**Customization:**

Users can provide their own distressKeywords array to match their investment strategy. For example:

- Probate-focused: ["probate", "executor sale", "estate sale"]
- Renovation-focused: ["needs work", "renovation project", "modernisation required"]
- Quick-sale focused: ["quick sale", "immediate completion", "vacant possession"]

**Future Enhancements (v2):**

- AI-powered distress scoring using OpenAI API
- Sentiment analysis of descriptions
- Historical price change tracking
- Agent contact pattern analysis

## Implementation Notes

### CSS Selectors for Rightmove

The actual CSS selectors for Rightmove property cards will need to be determined by inspecting the live website. Common patterns to look for:

- Property card container: `.propertyCard`, `.property-card`, `[data-test="property-card"]`
- Property URL: `a.propertyCard-link`, `a[href*="/properties/"]`
- Address: `.propertyCard-address`, `.property-address`
- Price: `.propertyCard-priceValue`, `.price`
- Description: `.propertyCard-description`, `.property-description`
- Added date: `.propertyCard-contactsItem`, `[data-test="property-added"]`
- Image: `img.propertyCard-img`, `.property-image img`

**Note:** Rightmove's HTML structure may change over time. The implementation should include fallback selectors and handle missing elements gracefully.

### Handling Lazy-Loaded Images

Rightmove may use lazy loading for images. Common patterns:

- Image URL in `data-src` attribute instead of `src`
- Placeholder image in `src`, actual image in `data-lazy-src`

The extractor should check multiple attributes: `src`, `data-src`, `data-lazy-src`

### User-Agent Header

Rightmove may block requests without a proper User-Agent header. The HTTP fetcher should include:

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
```

### Pagination Implementation

Rightmove uses an `index` query parameter for pagination, where each page shows 24 properties:

- Page 1: `index=0` (or no index parameter)
- Page 2: `index=24`
- Page 3: `index=48`
- etc.

The Actor will:

1. Parse the base URL
2. For each page from 0 to maxPages-1, add/update the `index` parameter
3. Fetch and process each page sequentially
4. Stop early if no properties are found on a page
5. Stop early if maxItems limit is reached

**Example URL transformation:**

```
Base: https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490
Page 2: https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490&index=24
Page 3: https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490&index=48
```

### Proxy Configuration

When `useProxy` is set to true, the Actor will use Apify's proxy service:

```javascript
const proxyConfiguration = await Apify.createProxyConfiguration();
const proxyUrl = proxyConfiguration.newUrl();

const response = await got(url, {
  proxyUrl: proxyUrl,
  headers: { "User-Agent": "..." },
});
```

**Benefits of using proxy:**

- Avoids IP-based rate limiting
- Reduces risk of being blocked by Rightmove
- Enables higher-volume scraping
- Rotates IPs automatically

**Cost consideration:**

- Proxy usage incurs additional Apify platform costs
- For testing and low-volume scraping, useProxy=false is sufficient
- For production and multi-page scraping, useProxy=true is recommended

### Rate Limiting Considerations

For production use:

- Use `useProxy=true` for scraping more than 1-2 pages
- Consider adding small delays between page requests (e.g., 1-2 seconds)
- Respect robots.txt
- Implement retry logic with exponential backoff for failed requests
- Monitor Apify logs for HTTP 429 (Too Many Requests) responses

### Dockerfile

The Actor should use the official Apify Node.js 20 base image:

```dockerfile
FROM apify/actor-node:20

COPY package*.json ./
RUN npm install --production

COPY . ./

CMD npm start
```

## Dependencies

### Required npm Packages

```json
{
  "dependencies": {
    "apify": "^3.0.0",
    "cheerio": "^1.0.0-rc.12",
    "got": "^12.6.1"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "fast-check": "^3.0.0",
    "nock": "^13.0.0"
  }
}
```

**Package Justifications:**

- **apify:** Official Apify SDK for actor development
- **cheerio:** Fast, flexible HTML parsing library
- **got:** Lightweight HTTP client (v12 for CommonJS compatibility)
- **jest:** Testing framework for unit and integration tests
- **fast-check:** Property-based testing library
- **nock:** HTTP mocking for testing

### Version Constraints

- Node.js: 20.x (as specified in Actor Specification)
- got: Must use v12.x (v13+ is ESM-only, may cause compatibility issues)
- All other packages: Use latest stable versions

## Deployment Considerations

### Environment Variables

No sensitive environment variables are required for basic functionality. For production:

- `APIFY_PROXY_PASSWORD`: If using Apify proxy services
- `APIFY_TOKEN`: Automatically provided by Apify platform

### Memory Requirements

- **Minimum:** 256 MB (for basic scraping)
- **Recommended:** 512 MB (for better performance)
- **Maximum:** 1024 MB (for large result sets)

### Build Configuration

The Actor will use the default Apify build process:

1. Copy source files to container
2. Run `npm install --production`
3. Set entry point to `npm start`

No custom build command is required beyond the defaults.

## Documentation Requirements

### README.md Structure

The Actor must include a comprehensive README.md file with the following sections:

1. **Overview**

   - Brief description of the Actor's purpose
   - Key feature: distress detection for property investment
   - Use cases: property investors, deal sourcers, automation workflows

2. **Features**

   - Multi-page scraping with pagination
   - Built-in distress keyword detection
   - Proxy support for avoiding rate limits
   - Stable output schema for easy integration
   - Customizable distress keywords

3. **Input Parameters**

   - Table with parameter name, type, required/optional, default, and description
   - Example input JSON

4. **Output Format**

   - Description of output structure
   - Example output JSON showing all fields
   - Explanation of distressKeywordsMatched and distressScoreRule

5. **Usage Examples**

   - Basic usage (single page, no proxy)
   - Advanced usage (multiple pages with proxy)
   - Custom distress keywords example

6. **Integration Examples**

   - How to use with OpenAI Workflows
   - How to use with Zapier
   - How to push to Google Sheets
   - How to integrate with Base44 or other CRMs

7. **Limitations**
   - Rightmove's terms of service
   - Rate limiting considerations
   - When to use proxy

**Example Input JSON:**

```json
{
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490",
  "maxItems": 100,
  "maxPages": 5,
  "useProxy": true,
  "distressKeywords": [
    "reduced",
    "chain free",
    "auction",
    "motivated",
    "cash buyers",
    "needs renovation"
  ]
}
```

**Example Output JSON:**

```json
[
  {
    "url": "https://www.rightmove.co.uk/properties/123456",
    "address": "123 High Street, London, SW1A 1AA",
    "price": "£350,000",
    "description": "Chain free property in need of renovation. Motivated seller, reduced from £400,000.",
    "addedOn": "Added on 20/11/2025",
    "image": "https://media.rightmove.co.uk/123/456.jpg",
    "distressKeywordsMatched": [
      "chain free",
      "renovation",
      "motivated",
      "reduced"
    ],
    "distressScoreRule": 8
  }
]
```

## Future Enhancements (v2)

Potential improvements for future versions:

1. **AI-Powered Distress Scoring:** Integrate OpenAI API for sophisticated distress analysis
2. **Crawl4AI Engine:** Use Crawl4AI for more robust scraping and JavaScript rendering
3. **Filtering Options:** Allow filtering by price range, property type, bedrooms, etc.
4. **Detailed Property Data:** Fetch individual property pages for more details (floor plans, EPC ratings, etc.)
5. **Image Download:** Download and store property images in Apify key-value store
6. **Change Detection:** Track price changes and new listings over time with historical data
7. **Multiple Search URLs:** Support scraping multiple searches in one run
8. **Export Formats:** Built-in CSV, JSON, and Excel export within the Actor
9. **Email Alerts:** Send notifications when high-scoring distressed properties are found
10. **Property Comparison:** Compare properties against market averages and identify outliers
