# Implementation Plan

- [x] 1. Set up project structure and configuration files

  - Create .actor/actor.json with Actor Specification 1 configuration
  - Create package.json with dependencies (apify, cheerio, got v12)
  - Create Dockerfile using apify/actor-node:20 base image
  - Create src directory for source code
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 2. Implement input validation and reading

  - Write input reading logic using Apify.getInput()
  - Implement validation for required url field
  - Implement default value handling for maxItems (default: 50)
  - Add error throwing for missing or invalid url
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x]\* 2.1 Write property test for input URL reading

  - **Property 1: Input URL reading**
  - **Validates: Requirements 1.1**

- [x]\* 2.2 Write property test for maxItems default value

  - **Property 2: MaxItems default value**
  - **Validates: Requirements 1.2**

- [x]\* 2.3 Write property test for invalid input rejection

  - **Property 3: Invalid input rejection**
  - **Validates: Requirements 1.3**

- [x] 3. Implement HTTP fetching functionality

  - Write fetchPage function using got library
  - Add User-Agent header to requests
  - Implement error handling for network failures
  - Add logging for HTTP errors
  - _Requirements: 3.1, 3.5_

- [x]\* 3.1 Write property test for network error handling

  - **Property 8: Network error handling**
  - **Validates: Requirements 3.5**

- [x] 4. Implement HTML parsing with Cheerio

  - Write HTML parsing logic to load content into Cheerio
  - Identify and select property card elements using CSS selectors
  - Handle cases where no property cards are found
  - _Requirements: 3.2, 3.3_

- [x] 5. Implement property data extraction

  - Write extractProperty function to extract all 6 fields from property cards
  - Implement extractUrl helper (handle relative/absolute URLs)
  - Implement extractAddress helper
  - Implement extractPrice helper
  - Implement extractDescription helper
  - Implement extractAddedOn helper
  - Implement extractImage helper (handle lazy-loaded images)
  - Ensure all fields return null for missing data instead of omitting fields
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x]\* 5.1 Write property test for complete property object structure

  - **Property 5: Complete property object structure**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2**

- [x] 6. Implement scraping orchestration

  - Write scrapeProperties function to coordinate fetching, parsing, and extraction
  - Implement maxItems limit enforcement (stop after maxItems properties)
  - Handle empty results gracefully (return empty array)
  - _Requirements: 3.4, 5.3_

- [x]\* 6.1 Write property test for maxItems limit enforcement

  - **Property 4: MaxItems limit enforcement**
  - **Validates: Requirements 3.4**

- [x] 7. Implement main entry point and output handling

  - Write main function to initialize Apify SDK
  - Orchestrate input reading, validation, scraping, and output
  - Push extracted data using Apify.pushData()
  - Add logging for extraction count
  - Ensure proper cleanup with Apify.exit()
  - _Requirements: 5.1, 5.4_

- [x]\* 7.1 Write property test for array output format

  - **Property 6: Array output format**
  - **Validates: Requirements 5.1**

- [x]\* 7.2 Write property test for extraction count logging

  - **Property 7: Extraction count logging**
  - **Validates: Requirements 5.4**

- [x]\* 8. Write unit tests for edge cases

  - Test with empty HTML (no property cards)
  - Test with incomplete property cards (missing fields)
  - Test with various URL formats (relative/absolute)
  - Test with lazy-loaded images
  - _Requirements: 4.7, 5.3_

- [x] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Extend input handling for new parameters

  - Update processInput function to handle maxPages, useProxy, and distressKeywords
  - Add default values: maxPages=1, useProxy=false, distressKeywords with default array
  - Update input validation to check new parameter types
  - Update actor.json input schema with new fields
  - _Requirements: 1.3, 1.4, 1.5, 1.11_

- [x]\* 10.1 Write property test for maxPages default value

  - **Property 9: MaxPages default value**
  - **Validates: Requirements 1.3**

- [x]\* 10.2 Write property test for useProxy default value

  - **Property 10: UseProxy default value**
  - **Validates: Requirements 1.4**

- [x]\* 10.3 Write property test for distressKeywords default value

  - **Property 11: DistressKeywords default value**
  - **Validates: Requirements 1.5**

- [x] 11. Implement distress keyword detection

  - Write detectDistress function that performs case-insensitive keyword matching
  - Return matched keywords array and calculated score
  - Implement scoring logic: min(10, matched_count \* 2)
  - Update extractProperty to call detectDistress and include results
  - Ensure distressKeywordsMatched defaults to empty array when no matches
  - Ensure distressScoreRule defaults to 0 when no matches
  - _Requirements: 4.7, 4.8, 4.9, 5.6_

- [x]\* 11.1 Write property test for distress keyword detection

  - **Property 15: Distress keyword detection**
  - **Validates: Requirements 4.7**

- [x]\* 11.2 Write property test for matched keywords collection

  - **Property 16: Matched keywords collection**
  - **Validates: Requirements 4.8**

- [x]\* 11.3 Write property test for distress score calculation

  - **Property 17: Distress score calculation**
  - **Validates: Requirements 4.9**

- [x]\* 11.4 Write property test for stable output shape

  - **Property 18: Stable output shape with null defaults**
  - **Validates: Requirements 5.6**

- [x] 12. Implement pagination support

  - Write buildPageUrl function to construct paginated URLs using index parameter
  - Update scrapeProperties to loop through pages up to maxPages
  - Aggregate properties from all pages until maxItems is reached
  - Stop early if a page returns no properties
  - Track pagesProcessed count for logging
  - _Requirements: 3.6, 3.7_

- [x]\* 12.1 Write property test for multi-page processing

  - **Property 13: Multi-page processing**
  - **Validates: Requirements 3.6**

- [x]\* 12.2 Write property test for cross-page aggregation

  - **Property 14: Cross-page aggregation with maxItems limit**
  - **Validates: Requirements 3.7**

- [x] 13. Implement proxy support

  - Update fetchPage function to accept useProxy parameter
  - When useProxy is true, use Apify.createProxyConfiguration() and apply proxy URL
  - Ensure proxy is used for all HTTP requests when enabled
  - _Requirements: 3.2_

- [x]\* 13.1 Write property test for proxy configuration usage

  - **Property 12: Proxy configuration usage**
  - **Validates: Requirements 3.2**

- [x] 14. Enhance logging throughout the actor

  - Log input configuration at startup (URL, maxItems, maxPages, useProxy, distressKeywords)
  - Log each page being fetched with page number and URL
  - Log number of properties found on each page
  - Log final summary with total pages processed and items extracted
  - Ensure error messages include context for debugging
  - _Requirements: 6.7, 6.8, 6.9, 6.10_

- [x] 15. Create README.md with documentation and examples

  - Write overview section describing Actor purpose and distress detection feature
  - Document all input parameters in a table with types, defaults, and descriptions
  - Include example input JSON showing all parameters
  - Include example output JSON showing complete property object with distress fields
  - Add usage examples for basic and advanced scenarios
  - Add integration examples for OpenAI Workflows, Zapier, Google Sheets
  - Document limitations and when to use proxy
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 16. Final checkpoint - Verify all features work end-to-end

  - Test with single page, no proxy, default distress keywords
  - Test with multiple pages, proxy enabled, custom distress keywords
  - Verify distress detection correctly identifies keywords
  - Verify output shape is stable with all fields present
  - Verify logging provides clear information at each step
  - Ensure all tests pass, ask the user if questions arise.
