# Requirements Document

## Introduction

This document specifies the requirements for a Rightmove Property Scraper Actor that conforms to the Apify Actor Specification 1 (2025). The Actor shall fetch property listings from Rightmove search result pages and extract structured data including property details, pricing, and images.

## Glossary

- **Actor**: An Apify serverless compute unit that performs a specific web scraping or automation task
- **Actor Specification 1**: The 2025 version of Apify's actor configuration standard
- **Input Schema**: JSON Schema definition that validates actor input parameters
- **Property Card**: An HTML element on Rightmove containing information about a single property listing
- **Rightmove**: A UK property portal website (rightmove.co.uk)
- **Cheerio**: A fast, flexible HTML parsing library for Node.js
- **Apify SDK**: The official Apify software development kit for building actors
- **Distress Keywords**: Specific words or phrases in property descriptions that indicate potential distressed sale opportunities
- **Distress Score**: A numerical value (0-10) representing the likelihood that a property is a distressed sale based on keyword matches
- **Apify Proxy**: Apify's proxy service that rotates IP addresses to avoid rate limiting and blocking
- **Pagination**: The process of fetching and processing multiple pages of search results sequentially

## Requirements

### Requirement 1

**User Story:** As an Apify user, I want to configure the actor with comprehensive input options, so that I can control scraping depth, proxy usage, and distress detection parameters.

#### Acceptance Criteria

1. WHEN the actor starts, THE Actor SHALL read the url field from the input
2. WHEN the actor starts, THE Actor SHALL read the maxItems field from the input with a default value of 50
3. WHEN the actor starts, THE Actor SHALL read the maxPages field from the input with a default value of 1
4. WHEN the actor starts, THE Actor SHALL read the useProxy field from the input with a default value of false
5. WHEN the actor starts, THE Actor SHALL read the distressKeywords field from the input with a default array containing common distress indicators
6. WHEN the url field is missing or empty, THE Actor SHALL terminate with a clear error message
7. WHEN the maxItems field is not provided, THE Actor SHALL use 50 as the default value
8. WHEN the maxPages field is not provided, THE Actor SHALL use 1 as the default value
9. WHEN the useProxy field is not provided, THE Actor SHALL use false as the default value
10. WHEN the distressKeywords field is not provided, THE Actor SHALL use a default array containing ["reduced", "chain free", "auction", "motivated", "cash buyers", "needs renovation"]
11. WHERE the input schema is defined, THE Actor SHALL validate that url is a required string field, maxItems is an optional integer field, maxPages is an optional integer field, useProxy is an optional boolean field, and distressKeywords is an optional array of strings

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

**User Story:** As an Apify user, I want the actor to fetch and parse Rightmove search results with pagination support, so that I can extract property listing data from multiple pages programmatically.

#### Acceptance Criteria

1. WHEN the actor receives a valid Rightmove URL, THE Actor SHALL fetch the HTML content of that page
2. WHEN useProxy is set to true, THE Actor SHALL use Apify proxy configuration for all HTTP requests
3. WHEN useProxy is set to false, THE Actor SHALL make direct HTTP requests without proxy
4. WHEN the HTML content is retrieved, THE Actor SHALL parse it using Cheerio
5. WHEN parsing the page, THE Actor SHALL identify all property card elements
6. WHEN property cards are found and maxPages is greater than 1, THE Actor SHALL process additional pages up to the maxPages limit
7. WHEN processing multiple pages, THE Actor SHALL aggregate property cards from all pages until maxItems is reached
8. WHEN property cards are found, THE Actor SHALL extract data from up to maxItems cards across all pages
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
3. THE Actor SHALL declare cheerio as a dependency in package.json
4. THE Actor SHALL declare got version 12 as a dependency in package.json
5. THE Actor SHALL define a start script in package.json that executes "node src/main.js"
6. THE Actor SHALL organize the main scraping logic in a src/main.js file
7. WHEN the actor starts, THE Actor SHALL log the input URL and configuration parameters
8. WHEN processing each page, THE Actor SHALL log the page number and URL being fetched
9. WHEN extraction completes, THE Actor SHALL log summary statistics including total pages processed and items extracted
10. WHEN errors occur, THE Actor SHALL log clear error messages with context to aid debugging

### Requirement 7

**User Story:** As a user or developer, I want clear documentation with examples, so that I can quickly understand how to use the Actor and integrate it into my workflows.

#### Acceptance Criteria

1. THE Actor SHALL include a README.md file in the root directory
2. WHEN viewing the README, THE Actor SHALL provide a clear description of its purpose and distress detection capabilities
3. WHEN viewing the README, THE Actor SHALL include example input JSON with all available parameters
4. WHEN viewing the README, THE Actor SHALL include example output JSON showing the complete property object structure
5. WHEN viewing the README, THE Actor SHALL document all input parameters with their types, defaults, and purposes
