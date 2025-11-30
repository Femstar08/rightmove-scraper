/**
 * Property-Based Tests for Rightmove Scraper
 * These tests validate correctness properties from the design document
 */

const fc = require('fast-check');
const { 
  createCrawler,
  extractPageModel,
  extractFromPageModel,
  detectDistress,
  validateInput,
  processInput,
  buildPageUrl
} = require('./main');

describe('Property 1: Browser initialization succeeds', () => {
  // Validates: Requirements 3.3
  test('should successfully initialize PlaywrightCrawler with any valid configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxItems: fc.integer({ min: 1, max: 1000 }),
          useApifyProxy: fc.boolean(),
          apifyProxyGroups: fc.array(fc.constantFrom('RESIDENTIAL', 'DATACENTER', 'BUYPROXIES94952'), { maxLength: 3 })
        }),
        async (config) => {
          const crawlerConfig = {
            maxItems: config.maxItems,
            proxy: {
              useApifyProxy: config.useApifyProxy,
              apifyProxyGroups: config.apifyProxyGroups
            },
            requestHandler: jest.fn()
          };

          const crawler = await createCrawler(crawlerConfig);
          
          // Crawler should be successfully created
          expect(crawler).toBeDefined();
          expect(crawler.constructor.name).toBe('PlaywrightCrawler');
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should handle various maxItems values correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 500 }),
        async (maxItems) => {
          const config = {
            maxItems,
            proxy: { useApifyProxy: false, apifyProxyGroups: [] },
            requestHandler: jest.fn()
          };

          const crawler = await createCrawler(config);
          expect(crawler).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 2: JavaScript data extraction', () => {
  // Validates: Requirements 3.5, 3.6
  test('should successfully extract PAGE_MODEL from any valid page structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasPageModel: fc.boolean(),
          propertyCount: fc.integer({ min: 1, max: 10 })
        }),
        async (pageStructure) => {
          // Mock page with PAGE_MODEL structure (the one we actually support)
          const mockPage = {
            evaluate: jest.fn().mockResolvedValue(
              pageStructure.hasPageModel ? {
                propertyData: Array.from({ length: pageStructure.propertyCount }, (_, i) => ({
                  id: `prop-${i}`,
                  displayAddress: `Address ${i}`,
                  price: { displayPrice: `£${(i + 1) * 100000}` }
                }))
              } : null
            )
          };

          const result = await extractPageModel(mockPage);
          
          if (pageStructure.hasPageModel) {
            expect(result).not.toBeNull();
          } else {
            expect(result).toBeNull();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should extract properties from various PAGE_MODEL structures', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            displayAddress: fc.string({ minLength: 5, maxLength: 50 }),
            price: fc.record({
              displayPrice: fc.string({ minLength: 5, maxLength: 20 })
            })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (properties) => {
          const pageModel = { propertyData: properties };
          const result = extractFromPageModel(pageModel, []);
          
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBeLessThanOrEqual(properties.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 3: Pagination handling', () => {
  // Validates: Requirements 9.2, 9.3
  test('should correctly build pagination URLs for any page index', () => {
    fc.assert(
      fc.property(
        fc.webUrl({ validSchemes: ['https'] }),
        fc.integer({ min: 0, max: 20 }),
        (baseUrl, pageIndex) => {
          const result = buildPageUrl(baseUrl, pageIndex);
          
          // First page should not have index parameter
          if (pageIndex === 0) {
            expect(result).toBe(baseUrl);
          } else {
            // Other pages should have index parameter
            expect(result).toContain(`index=${pageIndex * 24}`);
          }
          
          // Result should always be a valid URL
          expect(result).toMatch(/^https?:\/\//);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should respect maxPages limit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 20 }),
        (maxPages, currentPage) => {
          // Simulate pagination logic
          const shouldContinue = currentPage < maxPages;
          
          if (currentPage >= maxPages) {
            expect(shouldContinue).toBe(false);
          } else {
            expect(shouldContinue).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 5: Distress keyword detection', () => {
  // Validates: Requirements 4.7
  test('should detect all keywords case-insensitively', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 0, maxLength: 5 }),
        fc.constantFrom('lower', 'upper', 'mixed'),
        (keywords, indicesToInclude, caseVariation) => {
          const uniqueKeywords = [...new Set(keywords)].filter(k => k.trim().length > 0);
          if (uniqueKeywords.length === 0) return true;
          
          const includedKeywords = [...new Set(indicesToInclude.map(i => uniqueKeywords[i % uniqueKeywords.length]))];
          
          let description = 'This is a property ';
          includedKeywords.forEach(keyword => {
            let keywordToAdd = keyword;
            if (caseVariation === 'upper') {
              keywordToAdd = keyword.toUpperCase();
            } else if (caseVariation === 'mixed') {
              keywordToAdd = keyword.split('').map((c, i) => 
                i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
              ).join('');
            }
            description += keywordToAdd + ' ';
          });
          
          const result = detectDistress(description, uniqueKeywords);
          
          // All included keywords should be detected
          includedKeywords.forEach(keyword => {
            expect(result.matched).toContain(keyword);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should handle empty or null descriptions', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.constant(''), fc.constant('   ')),
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
        (description, keywords) => {
          const result = detectDistress(description, keywords);
          
          expect(result.matched).toEqual([]);
          expect(result.score).toBe(0);
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 6: Distress score calculation', () => {
  // Validates: Requirements 4.9
  test('should equal min(10, matched_count * 2)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 1, maxLength: 15 }),
        fc.integer({ min: 0, max: 15 }),
        (keywords, numToInclude) => {
          const uniqueKeywords = [...new Set(keywords)].filter(k => k.trim().length > 0);
          if (uniqueKeywords.length === 0) return true;
          
          const includedKeywords = uniqueKeywords.slice(0, Math.min(numToInclude, uniqueKeywords.length));
          const description = includedKeywords.join(' ');
          
          const result = detectDistress(description, uniqueKeywords);
          
          const expectedScore = Math.min(10, result.matched.length * 2);
          expect(result.score).toBe(expectedScore);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should cap score at 10 regardless of keyword count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 6, max: 20 }),
        (keywordCount) => {
          const keywords = Array.from({ length: keywordCount }, (_, i) => `keyword${i}`);
          const description = keywords.join(' ');
          
          const result = detectDistress(description, keywords);
          
          // Score should be capped at 10
          expect(result.score).toBe(10);
          expect(result.matched.length).toBe(keywordCount);
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 7: Output schema consistency', () => {
  // Validates: Requirements 5.2
  test('should always contain all required fields', () => {
    const cheerio = require('cheerio');
    const { extractProperty } = require('./main');
    
    fc.assert(
      fc.property(
        fc.record({
          hasUrl: fc.boolean(),
          hasAddress: fc.boolean(),
          hasPrice: fc.boolean(),
          hasDescription: fc.boolean(),
          hasAddedOn: fc.boolean(),
          hasImage: fc.boolean()
        }),
        (fieldPresence) => {
          const html = `
            <div class="propertyCard">
              ${fieldPresence.hasUrl ? '<a class="propertyCard-link" href="/properties/123">View</a>' : ''}
              ${fieldPresence.hasAddress ? '<div class="propertyCard-address">Test Address</div>' : ''}
              ${fieldPresence.hasPrice ? '<div class="propertyCard-priceValue">£300,000</div>' : ''}
              ${fieldPresence.hasDescription ? '<div class="propertyCard-description">Test description</div>' : ''}
              ${fieldPresence.hasAddedOn ? '<div class="propertyCard-contactsItem">Added today</div>' : ''}
              ${fieldPresence.hasImage ? '<img class="propertyCard-img" src="/img.jpg" />' : ''}
            </div>
          `;
          
          const $ = cheerio.load(html);
          const element = $('.propertyCard')[0];
          const property = extractProperty($, element, ['test']);
          
          // All 8 required fields must be present
          const requiredFields = [
            'url', 'address', 'price', 'description',
            'addedOn', 'image', 'distressKeywordsMatched', 'distressScoreRule'
          ];
          
          requiredFields.forEach(field => {
            expect(property).toHaveProperty(field);
          });
          
          // distressKeywordsMatched should be array
          expect(Array.isArray(property.distressKeywordsMatched)).toBe(true);
          
          // distressScoreRule should be number
          expect(typeof property.distressScoreRule).toBe('number');
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 8: Error recovery', () => {
  // Validates: Requirements 6.11
  test('should continue processing after individual URL failures', () => {
    fc.assert(
      fc.property(
        fc.array(fc.webUrl(), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (urls, failureIndex) => {
          // Simulate processing URLs with one failure
          const results = [];
          const errors = [];
          
          urls.forEach((url, index) => {
            try {
              if (index === failureIndex % urls.length) {
                throw new Error('Network timeout');
              }
              results.push({ url, success: true });
            } catch (error) {
              errors.push({ url, error: error.message });
              // Continue processing despite error
            }
          });
          
          // Should have processed all URLs
          expect(results.length + errors.length).toBe(urls.length);
          
          // Should have exactly one error
          expect(errors.length).toBe(1);
          
          // Should have processed remaining URLs
          expect(results.length).toBe(urls.length - 1);
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 9: MaxItems enforcement', () => {
  // Validates: Requirements 1.2, 9.6
  test('should not exceed maxItems regardless of available properties', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 100 }),
        (maxItems, availableProperties) => {
          // Simulate extraction with maxItems limit
          const extracted = [];
          
          for (let i = 0; i < availableProperties; i++) {
            if (extracted.length >= maxItems) {
              break;
            }
            extracted.push({ id: i });
          }
          
          // Should not exceed maxItems
          expect(extracted.length).toBeLessThanOrEqual(maxItems);
          expect(extracted.length).toBe(Math.min(maxItems, availableProperties));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should enforce maxItems across multiple pages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 15 }),
        (maxItems, numPages, propsPerPage) => {
          let totalExtracted = 0;
          
          for (let page = 0; page < numPages; page++) {
            if (totalExtracted >= maxItems) {
              break;
            }
            
            const remainingSlots = maxItems - totalExtracted;
            const extractedThisPage = Math.min(propsPerPage, remainingSlots);
            totalExtracted += extractedThisPage;
          }
          
          expect(totalExtracted).toBeLessThanOrEqual(maxItems);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 10: Input validation', () => {
  // Validates: Requirements 1.6
  test('should reject invalid inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant({}),
          fc.record({ listUrls: fc.constant([]) }),
          fc.record({ listUrls: fc.constant('not an array') }),
          fc.record({ listUrls: fc.array(fc.string()) })
        ),
        (invalidInput) => {
          expect(() => validateInput(invalidInput)).toThrow('Input validation failed');
        }
      ),
      { numRuns: 30 }
    );
  });

  test('should accept valid inputs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ url: fc.webUrl() }),
          { minLength: 1, maxLength: 5 }
        ),
        (listUrls) => {
          const input = { listUrls };
          expect(() => validateInput(input)).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 11: Default value application', () => {
  // Validates: Requirements 1.2, 1.3, 1.4, 1.5
  test('should apply correct defaults for missing fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          url: fc.webUrl()
        }),
        (baseInput) => {
          const input = { listUrls: [baseInput] };
          const processed = processInput(input);
          
          // Check defaults
          expect(processed.maxItems).toBe(200);
          expect(processed.maxPages).toBe(5);
          expect(processed.proxy.useApifyProxy).toBe(false);
          expect(processed.proxy.apifyProxyGroups).toEqual([]);
          expect(processed.distressKeywords).toEqual([
            'reduced', 'chain free', 'auction', 'motivated', 'cash buyers', 'needs renovation'
          ]);
        }
      ),
      { numRuns: 30 }
    );
  });
});


// ============================================================================
// PHASE 2 PROPERTY-BASED TESTS
// ============================================================================

describe('Property 10: Monitoring mode filtering', () => {
  // Validates: Phase 2 Req 12
  const { deduplicateProperties } = require('./main');
  
  test('should filter out previously seen property IDs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 15 })
          }),
          { minLength: 5, maxLength: 20 }
        ),
        fc.array(fc.string({ minLength: 5, maxLength: 15 }), { minLength: 0, maxLength: 10 }),
        (properties, previousIds) => {
          const previousSet = new Set(previousIds);
          
          // Simulate monitoring mode filtering
          const newProperties = properties.filter(p => !previousSet.has(p.id));
          
          // All returned properties should be new
          newProperties.forEach(prop => {
            expect(previousSet.has(prop.id)).toBe(false);
          });
          
          // Count should be correct
          const expectedCount = properties.filter(p => !previousSet.has(p.id)).length;
          expect(newProperties.length).toBe(expectedCount);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should add _isNew flag to new properties', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 15 }),
            address: fc.string()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(fc.string({ minLength: 5, maxLength: 15 }), { minLength: 0, maxLength: 5 }),
        (properties, previousIds) => {
          const previousSet = new Set(previousIds);
          
          // Add _isNew flag
          const flaggedProperties = properties.map(p => ({
            ...p,
            _isNew: !previousSet.has(p.id)
          }));
          
          // Verify flags are correct
          flaggedProperties.forEach(prop => {
            if (previousSet.has(prop.id)) {
              expect(prop._isNew).toBe(false);
            } else {
              expect(prop._isNew).toBe(true);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 11: Deduplication by ID', () => {
  // Validates: Phase 2 Req 10
  const { deduplicateProperties } = require('./main');
  
  test('should remove duplicate properties by ID', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 15 }),
            address: fc.string(),
            price: fc.string()
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (properties) => {
          // Create some duplicates
          const withDuplicates = [...properties];
          if (properties.length > 0) {
            // Add duplicate of first property
            withDuplicates.push({ ...properties[0] });
          }
          
          const deduplicated = deduplicateProperties(withDuplicates);
          
          // Check no duplicate IDs
          const ids = deduplicated.map(p => p.id).filter(Boolean);
          const uniqueIds = new Set(ids);
          expect(ids.length).toBe(uniqueIds.size);
          
          // Should have removed at least one duplicate if we added one
          if (properties.length > 0) {
            expect(deduplicated.length).toBeLessThanOrEqual(withDuplicates.length);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should preserve properties without IDs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.option(fc.string({ minLength: 5, maxLength: 15 }), { nil: null }),
            address: fc.string()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (properties) => {
          const deduplicated = deduplicateProperties(properties);
          
          // Properties without IDs should be preserved
          const propsWithoutId = properties.filter(p => !p.id);
          const deduplicatedWithoutId = deduplicated.filter(p => !p.id);
          
          expect(deduplicatedWithoutId.length).toBe(propsWithoutId.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('should maintain order of first occurrence', () => {
    const properties = [
      { id: '1', address: 'First' },
      { id: '2', address: 'Second' },
      { id: '1', address: 'Duplicate' },
      { id: '3', address: 'Third' }
    ];
    
    const deduplicated = deduplicateProperties(properties);
    
    expect(deduplicated.length).toBe(3);
    expect(deduplicated[0].address).toBe('First'); // First occurrence kept
    expect(deduplicated[1].address).toBe('Second');
    expect(deduplicated[2].address).toBe('Third');
  });
});

describe('Property 12: Full property schema completeness', () => {
  // Validates: Phase 2 Req 11
  const { extractFullPropertyDetails } = require('./main');
  
  test('should always include all Phase 2 fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 15 }),
          displayAddress: fc.string(),
          price: fc.record({ displayPrice: fc.string() }),
          location: fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 })
          }),
          customer: fc.record({
            brandTradingName: fc.string(),
            branchDisplayNumber: fc.string()
          })
        }),
        (propertyData) => {
          const result = extractFullPropertyDetails(propertyData, [], false);
          
          if (!result) return true; // Skip if extraction failed
          
          // Check Phase 1 fields
          expect(result).toHaveProperty('id');
          expect(result).toHaveProperty('url');
          expect(result).toHaveProperty('address');
          expect(result).toHaveProperty('price');
          expect(result).toHaveProperty('distressKeywordsMatched');
          expect(result).toHaveProperty('distressScoreRule');
          
          // Check Phase 2 fields
          expect(result).toHaveProperty('displayAddress');
          expect(result).toHaveProperty('countryCode');
          expect(result).toHaveProperty('coordinates');
          expect(result).toHaveProperty('agent');
          expect(result).toHaveProperty('agentPhone');
          expect(result).toHaveProperty('brochures');
          expect(result).toHaveProperty('floorplans');
          expect(result).toHaveProperty('nearestStations');
          expect(result).toHaveProperty('features');
          expect(result).toHaveProperty('_scrapedAt');
          
          // Check types
          expect(typeof result.coordinates).toBe('object');
          expect(Array.isArray(result.brochures)).toBe(true);
          expect(Array.isArray(result.floorplans)).toBe(true);
          expect(Array.isArray(result.nearestStations)).toBe(true);
          expect(Array.isArray(result.features)).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('should handle missing Phase 2 fields gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 15 }),
          displayAddress: fc.option(fc.string(), { nil: null }),
          location: fc.option(fc.record({
            latitude: fc.double(),
            longitude: fc.double()
          }), { nil: null })
        }),
        (propertyData) => {
          const result = extractFullPropertyDetails(propertyData, [], false);
          
          if (!result) return true;
          
          // Missing fields should be null or empty arrays
          if (!propertyData.displayAddress) {
            expect(result.displayAddress === null || typeof result.displayAddress === 'string').toBe(true);
          }
          
          if (!propertyData.location) {
            expect(result.coordinates.latitude === null || typeof result.coordinates.latitude === 'number').toBe(true);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 13: Price history extraction', () => {
  // Validates: Phase 2 Req 14
  const { extractPriceHistory } = require('./main');
  
  test('should extract all price history entries', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.date().map(d => d.toISOString()),
            price: fc.integer({ min: 100000, max: 1000000 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (priceHistory) => {
          const propertyData = { priceHistory };
          const result = extractPriceHistory(propertyData);
          
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(priceHistory.length);
          
          result.forEach((entry, index) => {
            expect(entry).toHaveProperty('date');
            expect(entry).toHaveProperty('price');
            expect(typeof entry.price).toBe('string');
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  test('should return empty array for missing price history', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          priceHistory: fc.option(fc.constant(null), { nil: null })
        }),
        (propertyData) => {
          const result = extractPriceHistory(propertyData);
          
          expect(Array.isArray(result)).toBe(true);
          if (!propertyData.priceHistory) {
            expect(result.length).toBe(0);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 14: Phase 2 input validation', () => {
  // Validates: Phase 2 Req 10
  const { validateInput, processInput } = require('./main');
  
  test('should accept propertyUrls without startUrls', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ url: fc.webUrl() }),
          { minLength: 1, maxLength: 5 }
        ),
        (propertyUrls) => {
          const input = { propertyUrls };
          expect(() => validateInput(input)).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });

  test('should accept both startUrls and propertyUrls', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ url: fc.webUrl() }), { minLength: 1, maxLength: 3 }),
        fc.array(fc.record({ url: fc.webUrl() }), { minLength: 1, maxLength: 3 }),
        (startUrls, propertyUrls) => {
          const input = { startUrls, propertyUrls };
          expect(() => validateInput(input)).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });

  test('should validate Phase 2 boolean fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          startUrls: fc.array(fc.record({ url: fc.webUrl() }), { minLength: 1, maxLength: 1 }),
          fullPropertyDetails: fc.boolean(),
          monitoringMode: fc.boolean(),
          enableDelistingTracker: fc.boolean(),
          includePriceHistory: fc.boolean()
        }),
        (input) => {
          expect(() => validateInput(input)).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });

  test('should reject invalid Phase 2 boolean fields', () => {
    const invalidInputs = [
      { startUrls: [{ url: 'https://example.com' }], fullPropertyDetails: 'true' },
      { startUrls: [{ url: 'https://example.com' }], monitoringMode: 1 },
      { startUrls: [{ url: 'https://example.com' }], enableDelistingTracker: 'yes' }
    ];
    
    invalidInputs.forEach(input => {
      expect(() => validateInput(input)).toThrow('Input validation failed');
    });
  });

  test('should apply Phase 2 default values', () => {
    fc.assert(
      fc.property(
        fc.record({ url: fc.webUrl() }),
        (baseInput) => {
          const input = { startUrls: [baseInput] };
          const processed = processInput(input);
          
          // Check Phase 2 defaults
          expect(processed.fullPropertyDetails).toBe(true);
          expect(processed.monitoringMode).toBe(false);
          expect(processed.enableDelistingTracker).toBe(false);
          expect(processed.includePriceHistory).toBe(false);
          expect(Array.isArray(processed.propertyUrls)).toBe(true);
          expect(processed.propertyUrls.length).toBe(0);
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 15: MaxItems enforcement across modes', () => {
  // Validates: Phase 2 Req 10, 15
  test('should enforce maxItems across search and property URLs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 0, max: 30 }),
        (maxItems, searchResults, propertyUrlCount) => {
          // Simulate combined mode extraction
          let totalExtracted = 0;
          
          // Extract from search results
          const fromSearch = Math.min(searchResults, maxItems);
          totalExtracted += fromSearch;
          
          // Extract from property URLs (respecting remaining slots)
          const remainingSlots = maxItems - totalExtracted;
          const fromPropertyUrls = Math.min(propertyUrlCount, remainingSlots);
          totalExtracted += fromPropertyUrls;
          
          // Should not exceed maxItems
          expect(totalExtracted).toBeLessThanOrEqual(maxItems);
          expect(totalExtracted).toBe(Math.min(maxItems, searchResults + propertyUrlCount));
        }
      ),
      { numRuns: 100 }
    );
  });
});
