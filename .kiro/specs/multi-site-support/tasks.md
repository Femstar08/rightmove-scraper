# Implementation Plan

## Progress Summary

**Phase 1: Adapter Architecture Foundation** - 🟢 60% Complete (6/10 tasks)

- ✅ Base adapter interface created
- ✅ Site detector (AdapterFactory) implemented
- ✅ Rightmove adapter refactored (700+ lines)
- ✅ Input schema updated with `site` parameter
- ✅ main-v2.js created with adapter integration
- ✅ 16 adapter tests passing
- ⏳ Orchestrator needs URL grouping & statistics
- ⏳ Field mapping utilities needed
- ⏳ Enhanced logging needed

**Next Steps:**

1. Test main-v2.js with real scraping
2. Complete orchestrator features (URL grouping, statistics)
3. Implement field mapping utilities
4. Add enhanced logging
5. Replace main.js with main-v2.js

---

## Phase 1: Adapter Architecture Foundation (Tasks 1-10)

- [x] 1. Create base adapter interface and structure ✅ **COMPLETED**

  - ✅ Created `src/adapters/base-adapter.js` with interface definition
  - ✅ Defined required methods: extractFromJavaScript, extractFromDOM, extractFullPropertyDetails, buildPageUrl, isValidUrl, normalizeProperty
  - ✅ Added getSiteConfig method
  - ✅ Added JSDoc documentation for all methods
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x]\* 1.1 Write property test for adapter interface compliance ✅ **COMPLETED**

  - **Property 2: Adapter interface compliance**
  - ✅ 16 tests passing in `src/adapters/adapter.test.js`
  - **Validates: Requirements 3.1, 3.2**

- [x] 2. Create site detector module ✅ **COMPLETED** (via AdapterFactory)

  - ✅ Created `src/adapters/adapter-factory.js`
  - ✅ Implemented URL domain extraction via `_detectSite()`
  - ✅ Implemented adapter pattern matching
  - ✅ Handle unsupported URLs gracefully with error messages
  - ✅ Added `getSupportedSites()` and `isSiteSupported()` methods
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x]\* 2.1 Write property test for site detection ✅ **COMPLETED**

  - **Property 1: Site detection accuracy**
  - ✅ Tests for URL detection, site name detection, error handling
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 3. Create core orchestrator

  - Create `src/core/Orchestrator.js`
  - Implement adapter initialization
  - Implement URL grouping by site
  - Implement per-site processing
  - Add error handling per adapter
  - Add statistics tracking per portal
  - _Requirements: 1.1, 1.6, 9.2, 11.1, 11.5_

- [ ]\* 3.1 Write property test for error isolation

  - **Property 7: Error isolation**
  - **Validates: Requirements 11.1, 11.5**

- [x] 4. Refactor existing Rightmove code into adapter ✅ **COMPLETED**

  - ✅ Created `src/adapters/rightmove-adapter.js` (700+ lines)
  - ✅ Extends BaseSiteAdapter
  - ✅ Moved extractFromPageModel logic to `parseFromPageModel()` method
  - ✅ Moved extractFullPropertyDetails to `extractFullPropertyDetails()` method
  - ✅ Moved pagination logic to `buildPageUrl()` method
  - ✅ Implemented `isValidUrl()` for Rightmove URLs
  - ✅ Implemented `normalizeProperty()` (adds `_site` field)
  - ✅ All extraction methods: extractFromJavaScript, extractFromDOM
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3_

- [ ]\* 4.1 Write property test for backward compatibility

  - **Property 5: Backward compatibility**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 5. Update unified schema definition

  - Add `source` field (portal name)
  - Add `sourceUrl` field (original URL)
  - Add `sources` array for duplicates
  - Add `duplicateOf` array
  - Add `_isDuplicate` boolean
  - Add `additionalData` object for site-specific fields
  - Document all fields with JSDoc
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [ ]\* 5.1 Write property test for unified schema consistency

  - **Property 3: Unified schema consistency**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 6. Implement field mapping utilities

  - Create `src/utils/fieldMapping.js`
  - Implement validateUnifiedSchema function
  - Implement setMissingFieldsToNull function
  - Implement extractPostcode function (outcode/incode)
  - Add field type validation
  - _Requirements: 4.5, 4.7_

- [ ]\* 6.1 Write property test for field mapping completeness

  - **Property 9: Field mapping completeness**
  - **Validates: Requirements 4.5**

- [x] 7. Update input schema for multi-site support ✅ **PARTIALLY COMPLETED**

  - ✅ Updated `.actor/actor.json`
  - ✅ Added `site` parameter with enum ["rightmove"] (default: "rightmove")
  - ⏳ TODO: Add `crossSiteDeduplication` boolean field (default: true)
  - ⏳ TODO: Add `siteConfig` object with per-portal settings
  - ✅ Maintained backward compatibility with existing fields
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 8. Update main entry point for orchestrator ✅ **COMPLETED**

  - ✅ Created `src/main-v2.js` using adapter pattern
  - ✅ Adapter initialization via AdapterFactory
  - ✅ Integrated adapter into scraping flow
  - ✅ Maintained backward compatibility for Rightmove-only runs
  - ⏳ TODO: Replace `src/main.js` with main-v2.js after testing
  - _Requirements: 1.1, 1.2, 6.1, 6.4_

- [ ] 9. Add enhanced logging for multi-site

  - Add portal name to all log messages
  - Log adapter initialization per portal
  - Log site detection results
  - Log per-portal statistics
  - Log cross-site summary
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 10. Checkpoint - Phase 1 complete
  - Ensure all Phase 1 tests pass
  - Verify Rightmove adapter works identically to before
  - Verify orchestrator handles single-site correctly
  - Ask user if questions arise

## Phase 2: Zoopla Adapter Implementation (Tasks 11-20)

- [ ] 11. Research Zoopla page structure

  - Visit Zoopla search results pages
  - Inspect JavaScript data objects (window.**PRELOADED_STATE**)
  - Document property listing structure
  - Document pagination structure
  - Document property detail page structure
  - Identify field mappings to unified schema
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Create Zoopla adapter skeleton

  - Create `src/adapters/ZooplaAdapter.js`
  - Extend BaseAdapter
  - Set siteName to 'zoopla'
  - Set sitePattern to 'zoopla.co.uk'
  - Implement detectPropertyUrl for Zoopla URLs
  - Add placeholder methods for extraction
  - _Requirements: 3.1, 5.1_

- [ ] 13. Implement Zoopla search extraction

  - Implement extractFromSearch method
  - Extract window.**PRELOADED_STATE** from page
  - Parse listing data from JavaScript object
  - Map Zoopla fields to basic property format
  - Handle missing fields gracefully
  - Apply distress detection
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.10_

- [ ] 14. Implement Zoopla property details extraction

  - Implement extractPropertyDetails method
  - Extract full property data from detail pages
  - Map all available fields to unified schema
  - Extract coordinates (latitude, longitude)
  - Extract agent information
  - Extract property features
  - Extract listing dates
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.9_

- [ ] 15. Implement Zoopla pagination handling

  - Implement handlePagination method
  - Detect next page link (data-testid="pagination-next")
  - Extract next page URL
  - Handle last page (no next link)
  - Respect maxPages limit
  - _Requirements: 5.7_

- [ ] 16. Implement Zoopla field mapping

  - Implement mapToUnifiedSchema method
  - Add source: 'zoopla'
  - Add sourceUrl field
  - Extract and format postcode (outcode/incode)
  - Map Zoopla-specific fields
  - Handle missing fields with null
  - Add Zoopla-specific data to additionalData
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_

- [ ]\* 16.1 Write property test for source attribution

  - **Property 4: Source attribution**
  - **Validates: Requirements 4.3**

- [ ] 17. Add Zoopla-specific utilities

  - Create helper functions for Zoopla data parsing
  - Implement postcode extraction from Zoopla addresses
  - Implement image URL formatting
  - Implement date parsing for Zoopla date formats
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 18. Integrate Zoopla adapter into orchestrator

  - Add ZooplaAdapter to orchestrator's adapter list
  - Ensure site detector recognizes Zoopla URLs
  - Test Zoopla-only scraping
  - Test mixed Rightmove + Zoopla scraping
  - _Requirements: 1.1, 1.2, 2.3_

- [ ] 19. Add Zoopla-specific error handling

  - Handle missing **PRELOADED_STATE**
  - Handle malformed Zoopla data
  - Handle Zoopla-specific HTTP errors
  - Log Zoopla-specific warnings
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 20. Checkpoint - Phase 2 complete
  - Ensure all Phase 2 tests pass
  - Verify Zoopla adapter extracts data correctly
  - Test with real Zoopla URLs
  - Ask user if questions arise

## Phase 3: Cross-Site Features (Tasks 21-28)

- [ ] 21. Implement cross-site deduplication

  - Create `src/core/Deduplicator.js`
  - Implement address normalization
  - Implement property grouping by address
  - Implement duplicate detection logic
  - Implement property merging (keep most complete)
  - Add duplicateOf and sources fields
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 21.1 Write property test for deduplication

  - **Property 6: Cross-site deduplication correctness**
  - **Validates: Requirements 7.2, 7.3**

- [ ] 22. Integrate deduplication into orchestrator

  - Add deduplication step after all sites processed
  - Check crossSiteDeduplication input flag
  - Apply deduplication if enabled
  - Log deduplication statistics
  - _Requirements: 7.5, 7.6, 7.7_

- [ ] 23. Implement site-specific configuration

  - Parse siteConfig from input
  - Apply per-portal maxPages settings
  - Apply per-portal maxItems settings
  - Apply per-portal enabled/disabled settings
  - Merge site-specific distress keywords with global
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 24. Implement consistent distress detection

  - Ensure detectDistress function works for all adapters
  - Apply global distress keywords to all portals
  - Merge site-specific keywords
  - Use same scoring algorithm across portals
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]\* 24.1 Write property test for distress detection consistency

  - **Property 8: Distress detection consistency**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 25. Implement statistics aggregation

  - Track properties found per portal
  - Track pages processed per portal
  - Track errors per portal
  - Calculate total statistics
  - Verify statistics sum correctly
  - _Requirements: 9.2, 9.3, 9.7_

- [ ]\* 25.1 Write property test for statistics accuracy

  - **Property 10: Statistics accuracy**
  - **Validates: Requirements 9.2, 9.3**

- [ ] 26. Add cross-site monitoring mode support

  - Extend monitoring mode to work across portals
  - Load previous properties from all portals
  - Mark new properties with \_isNew flag
  - Handle monitoring mode per portal
  - _Requirements: 6.6_

- [ ] 27. Add cross-site delisting tracker support

  - Extend delisting tracker to work across portals
  - Store properties with portal source
  - Track lastSeen per portal
  - Identify delisted properties per portal
  - _Requirements: 6.6_

- [ ] 28. Checkpoint - Phase 3 complete
  - Ensure all Phase 3 tests pass
  - Verify deduplication works correctly
  - Test all cross-site features
  - Ask user if questions arise

## Phase 4: Testing & Documentation (Tasks 29-35)

- [ ] 29. Write comprehensive unit tests

  - Test site detector with various URLs
  - Test adapter interface compliance
  - Test field mapping utilities
  - Test deduplication logic
  - Test statistics calculation
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]\* 29.1 Write integration tests for multi-site scraping

  - Test Rightmove-only (backward compatibility)
  - Test Zoopla-only
  - Test mixed Rightmove + Zoopla
  - Test with cross-site deduplication
  - Test error handling across adapters
  - _Requirements: 13.6, 13.7, 13.8_

- [ ] 30. Update README with multi-site documentation

  - Add multi-site overview section
  - Document supported portals
  - Add examples with mixed URLs
  - Document crossSiteDeduplication feature
  - Document siteConfig options
  - Add feature comparison table per portal
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_

- [ ] 31. Create adapter development guide

  - Document how to create new adapters
  - Provide adapter template
  - Document BaseAdapter interface
  - Provide examples from Rightmove and Zoopla
  - Document field mapping requirements
  - _Requirements: 14.5_

- [ ] 32. Document unified output schema

  - Create complete schema documentation
  - Show examples from each portal
  - Document all fields with descriptions
  - Show deduplication fields
  - Document additionalData usage
  - _Requirements: 14.2_

- [ ] 33. Document known limitations

  - Document portal-specific limitations
  - Document field availability per portal
  - Document performance considerations
  - Document rate limiting per portal
  - _Requirements: 14.7_

- [ ] 34. Update actor metadata

  - Update `.actor/actor.json` title and description
  - Update version to 3.0.0
  - Add multi-site keywords
  - Update input schema examples
  - Add Zoopla URL examples
  - _Requirements: 14.1_

- [ ] 35. Checkpoint - Phase 4 complete
  - Ensure all tests pass
  - Verify documentation is complete
  - Review all examples work
  - Ask user if questions arise

## Phase 5: Deployment & Validation (Tasks 36-40)

- [ ] 36. Perform backward compatibility testing

  - Test with existing Rightmove configurations
  - Verify identical output for Rightmove-only runs
  - Test all existing features (monitoring, delisting, price history)
  - Verify performance is unchanged
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 37. Test with real Zoopla URLs

  - Test Zoopla search results scraping
  - Test Zoopla property details extraction
  - Test Zoopla pagination
  - Verify data accuracy against website
  - Test with various Zoopla search configurations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [ ] 38. Test cross-site scenarios

  - Test with URLs from both portals
  - Test cross-site deduplication with real data
  - Test site-specific configuration
  - Test error handling (one portal fails)
  - Verify statistics are accurate
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 8.1, 11.1_

- [ ] 39. Performance and load testing

  - Test with large datasets (100+ properties)
  - Test with multiple concurrent portals
  - Monitor memory usage
  - Monitor request rates per portal
  - Verify proxy usage per portal
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 40. Final deployment
  - Update version to 3.0.0
  - Create migration guide for existing users
  - Deploy to Apify platform
  - Monitor initial usage
  - Collect user feedback
  - _Requirements: All_

## Summary

**Total Tasks: 40**

- Phase 1 (Adapter Architecture): 10 tasks
- Phase 2 (Zoopla Implementation): 10 tasks
- Phase 3 (Cross-Site Features): 8 tasks
- Phase 4 (Testing & Documentation): 7 tasks
- Phase 5 (Deployment & Validation): 5 tasks

**Key Deliverables:**

- Adapter architecture with BaseAdapter interface
- Rightmove adapter (refactored from existing code)
- Zoopla adapter (new implementation)
- Core orchestrator for multi-site coordination
- Site detector for automatic portal identification
- Cross-site deduplication
- Unified output schema
- Enhanced logging and statistics
- Comprehensive documentation
- Backward compatibility maintained

**Estimated Timeline: 10-15 days**
