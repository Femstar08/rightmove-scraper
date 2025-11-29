# Requirements Document

## Introduction

This document specifies the requirements for extending the Rightmove Property Scraper to support multiple UK property portals (Rightmove, Zoopla, and potentially others) through a unified adapter architecture. The system shall automatically detect the property portal from URLs and apply the appropriate extraction logic while maintaining a consistent output format and preserving all existing functionality.

## Glossary

- **Property Portal**: A UK property listing website (e.g., Rightmove, Zoopla, OnTheMarket)
- **Adapter**: A site-specific module that implements extraction logic for a particular property portal
- **Core Orchestrator**: The main system component that coordinates adapters and manages the scraping workflow
- **Unified Schema**: A standardized output format that works across all property portals
- **Site Detection**: The process of identifying which property portal a URL belongs to
- **Field Mapping**: The process of converting site-specific data fields to the unified schema
- **Cross-Site Deduplication**: Removing duplicate properties that appear on multiple portals
- **Backward Compatibility**: Ensuring existing Rightmove functionality continues to work without changes

## Requirements

### Requirement 1: Multi-Site URL Support

**User Story:** As an Apify user, I want to provide URLs from different property portals in a single run, so that I can aggregate property data from multiple sources efficiently.

#### Acceptance Criteria

1. WHEN the actor receives URLs from multiple property portals, THE Actor SHALL process all URLs regardless of their source portal
2. WHEN processing a URL, THE Actor SHALL automatically detect which property portal it belongs to
3. THE Actor SHALL support Rightmove URLs with the pattern `rightmove.co.uk`
4. THE Actor SHALL support Zoopla URLs with the pattern `zoopla.co.uk`
5. WHEN a URL does not match any supported portal, THE Actor SHALL log a warning and skip that URL
6. WHEN mixing URLs from different portals, THE Actor SHALL process them in the order provided
7. THE Actor SHALL maintain separate statistics per portal (pages processed, properties found)

### Requirement 2: Automatic Site Detection

**User Story:** As a user, I want the scraper to automatically detect which property portal I'm scraping, so that I don't need to manually specify the site type.

#### Acceptance Criteria

1. WHEN the actor processes a URL, THE Actor SHALL extract the domain name
2. WHEN the domain contains `rightmove.co.uk`, THE Actor SHALL route the request to the Rightmove adapter
3. WHEN the domain contains `zoopla.co.uk`, THE Actor SHALL route the request to the Zoopla adapter
4. WHEN the domain is not recognized, THE Actor SHALL log an error with the unsupported domain
5. THE Actor SHALL perform site detection before any scraping operations
6. THE Actor SHALL cache site detection results to avoid repeated parsing

### Requirement 3: Adapter Architecture

**User Story:** As a developer, I want a clean adapter pattern for site-specific logic, so that adding new property portals is straightforward and doesn't affect existing adapters.

#### Acceptance Criteria

1. THE Actor SHALL implement a base adapter interface that all site adapters must follow
2. WHEN creating a new adapter, THE adapter SHALL implement methods for extracting property data
3. WHEN creating a new adapter, THE adapter SHALL implement methods for handling pagination
4. WHEN creating a new adapter, THE adapter SHALL implement methods for extracting property details
5. THE Actor SHALL maintain separate adapter modules for each property portal
6. WHEN an adapter throws an error, THE Actor SHALL handle it gracefully without affecting other adapters
7. THE Actor SHALL allow adapters to define site-specific configuration options

### Requirement 4: Unified Output Schema

**User Story:** As a data consumer, I want all properties from different portals to follow the same output format, so that I can process them uniformly in my workflows.

#### Acceptance Criteria

1. WHEN extracting properties from any portal, THE Actor SHALL map all fields to a unified schema
2. THE unified schema SHALL include all fields from the existing Rightmove schema
3. THE unified schema SHALL include a `source` field indicating which portal the property came from
4. THE unified schema SHALL include a `sourceUrl` field with the original property URL
5. WHEN a portal does not provide a field that exists in the unified schema, THE Actor SHALL set that field to null
6. WHEN a portal provides additional fields not in the unified schema, THE Actor SHALL include them in an `additionalData` object
7. THE Actor SHALL ensure consistent data types across all portals (e.g., price as string, coordinates as numbers)

### Requirement 5: Zoopla Adapter Implementation

**User Story:** As a property investor, I want to scrape Zoopla listings with the same features as Rightmove, so that I can find investment opportunities across multiple portals.

#### Acceptance Criteria

1. THE Zoopla adapter SHALL extract property ID from Zoopla URLs and page data
2. THE Zoopla adapter SHALL extract property address, price, and description
3. THE Zoopla adapter SHALL extract bedrooms, bathrooms, and property type
4. THE Zoopla adapter SHALL extract property images
5. THE Zoopla adapter SHALL extract agent information (name, phone, logo)
6. THE Zoopla adapter SHALL extract coordinates (latitude, longitude)
7. THE Zoopla adapter SHALL handle Zoopla's pagination structure
8. THE Zoopla adapter SHALL extract property features and amenities
9. THE Zoopla adapter SHALL extract listing dates (added, updated)
10. THE Zoopla adapter SHALL apply distress keyword detection to descriptions

### Requirement 6: Backward Compatibility

**User Story:** As an existing user, I want my current Rightmove scraping configurations to continue working without any changes, so that I don't need to update my workflows.

#### Acceptance Criteria

1. WHEN the actor receives only Rightmove URLs, THE Actor SHALL behave identically to the previous version
2. THE Actor SHALL maintain the existing input schema with all current parameters
3. THE Actor SHALL produce the same output format for Rightmove properties as before
4. WHEN using existing Rightmove-specific features, THE Actor SHALL function without modification
5. THE Actor SHALL maintain the same performance characteristics for Rightmove scraping
6. THE Actor SHALL preserve all existing Rightmove adapter functionality (monitoring mode, delisting tracker, price history)

### Requirement 7: Cross-Site Deduplication

**User Story:** As a user scraping multiple portals, I want to identify properties that appear on multiple sites, so that I can avoid processing duplicates.

#### Acceptance Criteria

1. WHEN properties from multiple portals are extracted, THE Actor SHALL attempt to identify duplicates
2. THE Actor SHALL consider properties duplicates if they have matching addresses and postcodes
3. WHEN duplicates are found, THE Actor SHALL keep the property with the most complete data
4. WHEN duplicates are found, THE Actor SHALL add a `duplicateOf` field listing other portal sources
5. THE Actor SHALL provide a configuration option to enable or disable cross-site deduplication
6. WHEN deduplication is disabled, THE Actor SHALL return all properties from all portals
7. THE Actor SHALL log statistics about duplicates found across portals

### Requirement 8: Site-Specific Configuration

**User Story:** As a user, I want to configure site-specific options for each portal, so that I can optimize scraping for different sites.

#### Acceptance Criteria

1. THE Actor SHALL accept a `siteConfig` object in the input schema
2. THE siteConfig object SHALL allow specifying maxPages per portal
3. THE siteConfig object SHALL allow specifying maxItems per portal
4. THE siteConfig object SHALL allow enabling or disabling specific portals
5. WHEN no site-specific config is provided, THE Actor SHALL use global defaults
6. WHEN site-specific config conflicts with global config, THE Actor SHALL prioritize site-specific settings
7. THE Actor SHALL validate site-specific configuration and log warnings for invalid options

### Requirement 9: Enhanced Logging and Statistics

**User Story:** As a user, I want detailed logging that shows which portal each property came from, so that I can monitor scraping performance per site.

#### Acceptance Criteria

1. WHEN logging property extraction, THE Actor SHALL include the portal name in log messages
2. WHEN scraping completes, THE Actor SHALL log statistics per portal (properties found, pages processed)
3. WHEN scraping completes, THE Actor SHALL log cross-site statistics (total properties, duplicates found)
4. WHEN errors occur, THE Actor SHALL log which portal and URL caused the error
5. THE Actor SHALL log adapter initialization for each portal
6. THE Actor SHALL log site detection results for each URL
7. THE Actor SHALL provide a summary showing properties per portal at the end

### Requirement 10: Distress Detection Across Portals

**User Story:** As a property investor, I want distress keyword detection to work consistently across all property portals, so that I can identify opportunities regardless of the source.

#### Acceptance Criteria

1. THE Actor SHALL apply the same distress keywords to all property portals
2. THE Actor SHALL calculate distress scores using the same algorithm for all portals
3. THE Actor SHALL allow portal-specific distress keywords in addition to global keywords
4. WHEN a portal uses different terminology, THE Actor SHALL map it to standard distress indicators
5. THE Actor SHALL include the portal name when logging distress matches
6. THE Actor SHALL maintain the same distress score range (0-10) across all portals

### Requirement 11: Error Handling and Resilience

**User Story:** As a user, I want the scraper to continue working even if one portal fails, so that I can still get data from other sources.

#### Acceptance Criteria

1. WHEN one adapter fails, THE Actor SHALL continue processing URLs from other portals
2. WHEN a portal is temporarily unavailable, THE Actor SHALL log the error and skip that portal
3. WHEN an adapter throws an exception, THE Actor SHALL catch it and log detailed error information
4. THE Actor SHALL implement retry logic per portal with exponential backoff
5. WHEN all URLs from one portal fail, THE Actor SHALL still return results from successful portals
6. THE Actor SHALL provide a summary of failures per portal at the end
7. THE Actor SHALL not terminate the entire run due to a single portal failure

### Requirement 12: Performance Optimization

**User Story:** As a user scraping multiple portals, I want efficient resource usage, so that I can scrape large datasets without excessive costs.

#### Acceptance Criteria

1. THE Actor SHALL reuse browser contexts across URLs from the same portal
2. THE Actor SHALL implement concurrent scraping across different portals when possible
3. THE Actor SHALL respect rate limits per portal independently
4. THE Actor SHALL cache adapter instances to avoid repeated initialization
5. THE Actor SHALL implement efficient memory management when processing multiple portals
6. THE Actor SHALL provide configuration options for concurrency per portal
7. THE Actor SHALL log performance metrics per portal (requests per minute, average response time)

### Requirement 13: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for multi-site functionality, so that I can ensure reliability across all supported portals.

#### Acceptance Criteria

1. THE Actor SHALL include unit tests for the adapter interface
2. THE Actor SHALL include unit tests for site detection logic
3. THE Actor SHALL include unit tests for field mapping to unified schema
4. THE Actor SHALL include integration tests for each adapter
5. THE Actor SHALL include tests for cross-site deduplication
6. THE Actor SHALL include tests for backward compatibility with Rightmove
7. THE Actor SHALL include property-based tests for adapter behavior
8. THE Actor SHALL include tests for error handling across adapters

### Requirement 14: Documentation Updates

**User Story:** As a user, I want clear documentation on how to use multi-site scraping, so that I can take advantage of the new functionality.

#### Acceptance Criteria

1. THE Actor SHALL update the README with multi-site usage examples
2. THE Actor SHALL document the unified output schema with examples from each portal
3. THE Actor SHALL provide examples of mixing URLs from different portals
4. THE Actor SHALL document site-specific configuration options
5. THE Actor SHALL document how to add new portal adapters
6. THE Actor SHALL include a comparison table showing supported features per portal
7. THE Actor SHALL document known limitations or differences between portals
