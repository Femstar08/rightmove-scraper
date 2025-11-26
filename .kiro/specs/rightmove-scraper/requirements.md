# Requirements Document

## Introduction

This document specifies the requirements for a Rightmove Property Scraper Actor that conforms to the Apify Actor Specification 1 (2025). The Actor shall fetch property listings from Rightmove search result pages using browser automation to handle JavaScript-rendered content, and extract structured data including property details, pricing, and images.

## Glossary

- **Actor**: An Apify serverless compute unit that performs a specific web scraping or automation task
- **Actor Specification 1**: The 2025 version of Apify's actor configuration standard
- **Input Schema**: JSON Schema definition that validates actor input parameters
- **Property Card**: An HTML element on Rightmove containing information about a single property listing
- **Rightmove**: A UK property portal website (rightmove.co.uk)
- **Crawlee**: Modern web scraping framework that supports both HTTP and browser-based crawling
- **Playwright**: Browser automation library for rendering JavaScript-heavy websites
- **SPA**: Single Page Application - websites that load content dynamically with JavaScript
- **Property Data Module**: JavaScript object embedded in the page containing structured property data
- **Browser Context**: Isolated browser session for scraping
- **Apify SDK**: The official Apify software development kit for building actors
- **Distress Keywords**: Specific words or phrases in property descriptions that indicate potential distressed sale opportunities
- **Distress Score**: A numerical value (0-10) representing the likelihood that a property is a distressed sale based on keyword matches
- **Apify Proxy**: Apify's proxy service that rotates IP addresses to avoid rate limiting and blocking
- **Pagination**: The process of fetching and processing multiple pages of search results sequentially

## Requirements

### Requirement 1

**User Story:** As an Apify user, I want to configure the actor with comprehensive input options, so that I can control scraping depth, proxy usage, and distress detection parameters.

#### Acceptance Criteria

1. THE Actor SHALL accept `listUrls` array with URL objects containing search URLs
2. WHEN the actor starts, THE Actor SHALL read the maxItems field from the input with a default value of 200
3. WHEN the actor starts, THE Actor SHALL read the maxPages field from the input with a default value of 5
4. THE Actor SHALL accept `proxy` configuration object with `useApifyProxy` boolean field
5. WHEN the actor starts, THE Actor SHALL read the distressKeywords field from the input with a default array containing common distress indicators
6. WHEN the listUrls field is missing or empty, THE Actor SHALL terminate with a clear error message
7. WHEN the maxItems field is not provided, THE Actor SHALL use 200 as the default value
8. WHEN the maxPages field is not provided, THE Actor SHALL use 5 as the default value
9. WHEN the proxy.useApifyProxy field is not provided, THE Actor SHALL use false as the default value
10. WHEN the distressKeywords field is not provided, THE Actor SHALL use a default array containing ["reduced", "chain free", "auction", "motivated", "cash buyers", "needs renovation"]
11. WHERE the input schema is defined, THE Actor SHALL validate that listUrls is a required array field, maxItems is an optional integer field, maxPages is an optional integer field, proxy is an optional object field, and distressKeywords is an optional array of strings

### Requirement 2

**User Story:** As an Apify user, I want the actor to conform to Actor Specification 1, so that it integrates properly with the Apify platform and passes validation.

#### Acceptance Criteria

1. THE Actor SHALL include a .actor/actor.json file with actorSpecification set to 1
2. THE Actor SHALL define name, title, and description fields in actor.json
3. THE Actor SHALL specify a default version in actor.json
4. THE Actor SHALL specify a default buildCommand in actor.json
5. THE Actor SHALL declare Node.js 20 as a supported language in actor.json
6. THE Actor SHALL include a complete input schema in actor.json that defines all input parameters

### Requirement 3

**User Story:** As an Apify user, I want the actor to use browser automation to handle JavaScript-rendered pages, so that I can extract property listing data reliably from modern Rightmove pages.

#### Acceptance Criteria

1. THE Actor SHALL use Crawlee framework version 3.x or higher
2. THE Actor SHALL use PlaywrightCrawler for browser-based scraping
3. WHEN the actor starts, THE Actor SHALL initialize a Playwright browser context
4. WHEN processing pages, THE Actor SHALL wait for JavaScript content to load
5. WHEN a property listing page loads, THE Actor SHALL locate the `window.PAGE_MODEL` or similar JavaScript data object
6. WHEN property data is found in JavaScript objects, THE Actor SHALL parse the JSON structure
7. WHEN JavaScript data is unavailable, THE Actor SHALL fall back to DOM parsing
8. WHEN proxy.useApifyProxy is set to true, THE Actor SHALL use Apify proxy configuration for all browser requests
9. WHEN network errors occur during fetching, THE Actor SHALL handle them gracefully and log appropriate error messages
10. WHEN processing each page, THE Actor SHALL log the current page number and items found

### Requirement 4

**User Story:** As a data consumer, I want each property listing to include comprehensive details with distress indicators, so that I can identify potentially distressed properties for investment opportunities.

#### Acceptance Criteria

1. WHEN extracting a property card, THE Actor SHALL extract the property URL
2. WHEN extracting a property card, THE Actor SHALL extract the property address
3. WHEN extracting a property card, THE Actor SHALL extract the property price
4. WHEN extracting a property card, THE Actor SHALL extract the property description
5. WHEN extracting a property card, THE Actor SHALL extract the addedOn date information
6. WHEN extracting a property card, THE Actor SHALL extract the property image URL
7. WHEN extracting a property card, THE Actor SHALL detect distress keywords in the description by matching against the distressKeywords input array
8. WHEN distress keywords are detected, THE Actor SHALL include an array of matched keywords in the distressKeywordsMatched field
9. WHEN distress keywords are detected, THE Actor SHALL calculate a simple rule-based distress score (0-10) based on the number of matches
10. WHEN any field is missing from a property card, THE Actor SHALL include the field with a null or empty value rather than omitting it

### Requirement 5

**User Story:** As an Apify user, I want the actor to return structured data with stable output shape, so that I can easily integrate with downstream workflows and automation tools.

#### Acceptance Criteria

1. WHEN the actor completes scraping, THE Actor SHALL return an array of property objects
2. WHEN returning property objects, THE Actor SHALL ensure each object contains url, address, price, description, addedOn, image, distressKeywordsMatched, and distressScoreRule fields
3. WHEN the scraping yields no results, THE Actor SHALL return an empty array
4. WHEN the actor completes successfully, THE Actor SHALL log the number of properties extracted
5. WHEN the actor completes successfully, THE Actor SHALL log the number of pages processed
6. WHEN any property field is missing, THE Actor SHALL include the field with null for strings or empty array for distressKeywordsMatched to maintain stable output shape

### Requirement 6

**User Story:** As a developer, I want the actor to have proper Node.js project structure with comprehensive logging, so that dependencies are managed correctly and I can debug issues easily.

#### Acceptance Criteria

1. THE Actor SHALL include a package.json file with a valid name and version
2. THE Actor SHALL declare apify as a dependency in package.json
3. THE Actor SHALL declare crawlee version 3.x as a dependency in package.json
4. THE Actor SHALL declare playwright as a dependency in package.json
5. THE Actor SHALL define a start script in package.json that executes "node src/main.js"
6. THE Actor SHALL organize the main scraping logic in a src/main.js file
7. WHEN the actor starts, THE Actor SHALL log the input URLs and configuration parameters
8. WHEN processing each page, THE Actor SHALL log the page number and URL being fetched
9. WHEN extraction completes, THE Actor SHALL log summary statistics including total pages processed and items extracted
10. WHEN errors occur, THE Actor SHALL log clear error messages with context to aid debugging
11. THE Actor SHALL continue processing remaining URLs after individual failures

### Requirement 7

**User Story:** As a user or developer, I want clear documentation with examples, so that I can quickly understand how to use the Actor and integrate it into my workflows.

#### Acceptance Criteria

1. THE Actor SHALL include a README.md file in the root directory
2. WHEN viewing the README, THE Actor SHALL provide a clear description of its purpose and distress detection capabilities
3. WHEN viewing the README, THE Actor SHALL include example input JSON with all available parameters
4. WHEN viewing the README, THE Actor SHALL include example output JSON showing the complete property object structure
5. WHEN viewing the README, THE Actor SHALL document all input parameters with their types, defaults, and purposes

### Requirement 8

**User Story:** As a user, I want the scraper to handle Rightmove's anti-bot measures, so that scraping remains reliable over time.

#### Acceptance Criteria

1. WHEN making requests, THE Actor SHALL use realistic browser fingerprints
2. THE Actor SHALL rotate user agents automatically
3. WHEN using proxy, THE Actor SHALL configure Apify proxy with appropriate settings
4. THE Actor SHALL implement random delays between requests
5. THE Actor SHALL handle rate limiting gracefully with exponential backoff

### Requirement 9

**User Story:** As a user, I want to scrape multiple search URLs with pagination, so that I can collect comprehensive property data.

#### Acceptance Criteria

1. WHEN provided with search URLs in listUrls array, THE Actor SHALL process each URL sequentially
2. WHEN on a search results page, THE Actor SHALL detect and follow pagination links
3. THE Actor SHALL respect maxPages limit per search URL
4. THE Actor SHALL aggregate results across all pages and URLs
5. WHEN pagination ends, THE Actor SHALL move to the next search URL
6. THE Actor SHALL enforce maxItems limit across all URLs combined

---

# PHASE 2: Enhanced Commercial Features

## Introduction to Phase 2

Phase 2 extends the base scraper with advanced commercial features including full property details (30+ fields), monitoring mode, delisting tracker, price history, and support for direct property URLs. These features should be implemented AFTER Phase 1 (basic browser-based scraper) is complete and working.

## Phase 2 Requirements

### Requirement 10: Enhanced Input Configuration

**User Story:** As an Apify user, I want to provide either search URLs or direct property URLs, and control whether to fetch full details, enable monitoring, and track delistings.

#### Acceptance Criteria

1. WHEN the actor starts, THE Actor SHALL accept propertyUrls array containing direct property page URLs
2. WHEN the actor starts, THE Actor SHALL accept fullPropertyDetails field with default value true
3. WHEN the actor starts, THE Actor SHALL accept monitoringMode field with default value false
4. WHEN the actor starts, THE Actor SHALL accept enableDelistingTracker field with default value false
5. WHEN the actor starts, THE Actor SHALL accept addEmptyTrackerRecord field with default value false
6. WHEN the actor starts, THE Actor SHALL accept includePriceHistory field with default value false
7. WHERE fullPropertyDetails is true, THE Actor SHALL visit each property detail page to extract comprehensive data
8. WHERE fullPropertyDetails is false, THE Actor SHALL only extract data from search result cards

### Requirement 11: Full Property Detail Extraction

**User Story:** As a property investor, I want comprehensive property data including coordinates, agent details, amenities, and documents, so I can make informed investment decisions.

#### Acceptance Criteria

1. WHEN extracting full property details, THE Actor SHALL extract 30+ comprehensive fields
2. WHEN extracting full property details, THE Actor SHALL extract coordinates (latitude, longitude)
3. WHEN extracting full property details, THE Actor SHALL extract agent information (name, phone, logo, address, URLs)
4. WHEN extracting full property details, THE Actor SHALL extract all images, brochures, and floor plans
5. WHEN extracting full property details, THE Actor SHALL extract features/amenities array
6. WHEN extracting full property details, THE Actor SHALL extract nearest stations with distance
7. WHEN extracting full property details, THE Actor SHALL extract property status and dates
8. WHEN any field is not available, THE Actor SHALL set it to null rather than omitting it

### Requirement 12: Monitoring Mode

**User Story:** As a property investor running daily scrapes, I want to only receive newly added properties compared to my previous scrapes, so I don't process duplicates.

#### Acceptance Criteria

1. WHEN monitoringMode is enabled, THE Actor SHALL load the previous run's dataset
2. WHEN monitoringMode is enabled, THE Actor SHALL extract property IDs from the previous dataset
3. WHEN monitoringMode is enabled, THE Actor SHALL only include properties whose IDs were not in the previous dataset
4. WHEN monitoringMode is enabled and no previous run exists, THE Actor SHALL process all properties as new
5. WHEN monitoringMode is disabled, THE Actor SHALL return all scraped properties regardless of previous runs

### Requirement 13: Delisting Tracker

**User Story:** As a property investor, I want to track when properties are removed from Rightmove, so I can identify properties that sold or were withdrawn.

#### Acceptance Criteria

1. WHEN enableDelistingTracker is true, THE Actor SHALL use a Key-Value store named "rightmove-properties"
2. WHEN enableDelistingTracker is true, THE Actor SHALL store each property ID with lastSeen timestamp
3. WHEN enableDelistingTracker is true, THE Actor SHALL update the lastSeen timestamp for each property found
4. WHEN a property exists in Key-Value store but not in current scrape, THE property is considered delisted
5. WHERE Key-Value store is used, THE Actor SHALL handle store creation if it doesn't exist

### Requirement 14: Price History Extraction

**User Story:** As a property investor, I want to see historical price changes for properties, so I can identify price reductions and motivated sellers.

#### Acceptance Criteria

1. WHEN includePriceHistory is true, THE Actor SHALL extract price history from property detail pages
2. WHEN includePriceHistory is true, THE Actor SHALL include priceHistory array in output
3. WHEN includePriceHistory is false, THE Actor SHALL NOT extract price history to improve performance
4. WHEN price history is not available for a property, THE Actor SHALL set priceHistory to empty array

### Requirement 15: Direct Property URL Support

**User Story:** As an Apify user, I want to provide direct property URLs to scrape specific properties without searching.

#### Acceptance Criteria

1. WHEN propertyUrls array is provided, THE Actor SHALL skip search result scraping
2. WHEN propertyUrls array is provided, THE Actor SHALL directly fetch each property detail page
3. WHEN propertyUrls array is provided, THE Actor SHALL extract full property details for each URL
4. WHEN both listUrls and propertyUrls are provided, THE Actor SHALL process both
5. WHEN processing propertyUrls, THE Actor SHALL handle invalid URLs gracefully
