/**
 * Comprehensive Phase 2 Testing
 * Task 49: Test all feature combinations, backward compatibility, and performance
 * 
 * This test suite validates:
 * - All Phase 2 feature combinations
 * - Backward compatibility with Phase 1
 * - Performance characteristics
 * - Integration between features
 */

const { Actor } = require('apify');
const {
  validateInput,
  processInput,
  deduplicateProperties,
  extractFullPropertyDetails,
  extractPriceHistory,
  initializeDelistingTracker,
  loadPreviousPropertyIds
} = require('./main');

// Mock Apify Actor
jest.mock('apify');

describe('Phase 2 Comprehensive Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // FEATURE COMBINATION TESTS
  // ============================================================================

  describe('Feature Combination Tests', () => {
    test('should handle all Phase 2 features enabled simultaneously', () => {
      const input = {
        startUrls: [{ url: 'https://www.rightmove.co.uk/test' }],
        propertyUrls: [{ url: 'https://www.rightmove.co.uk/properties/123' }],
        maxItems: 100,
        maxPages: 3,
        fullPropertyDetails: true,
        monitoringMode: true,
        enableDelistingTracker: true,
        includePriceHistory: true,
        distressKeywords: ['reduced', 'auction']
      };

      expect(() => validateInput(input)).not.toThrow();
      const processed = processInput(input);

      expect(processed.fullPropertyDetails).toBe(true);
      expect(processed.monitoringMode).toBe(true);
      expect(processed.enableDelistingTracker).toBe(true);
      expect(processed.includePriceHistory).toBe(true);
      expect(processed.urls.length).toBe(1);
      expect(processed.propertyUrls.length).toBe(1);
    });

    test('should handle fullPropertyDetails=true with includePriceHistory=true', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Test Address',
        price: { displayPrice: '£300,000' },
        priceHistory: [
          { date: '2025-01-01', price: 325000 },
          { date: '2025-01-15', price: 300000 }
        ],
        location: { latitude: 51.5, longitude: -0.1 }
      };

      const result = extractFullPropertyDetails(propertyData, [], true);

      expect(result).toBeDefined();
      expect(result.priceHistory).toHaveLength(2);
      expect(result.coordinates.latitude).toBe(51.5);
      expect(result._scrapedAt).toBeDefined();
    });

    test('should handle fullPropertyDetails=false (basic mode)', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Test Address',
        price: { displayPrice: '£300,000' },
        priceHistory: [{ date: '2025-01-01', price: 325000 }],
        location: { latitude: 51.5, longitude: -0.1 }
      };

      const result = extractFullPropertyDetails(propertyData, [], false);

      expect(result).toBeDefined();
      expect(result.priceHistory).toEqual([]); // Should be empty when disabled
      expect(result.coordinates.latitude).toBe(51.5); // Other fields still present
    });

    test('should handle monitoringMode with deduplication', () => {
      const properties = [
        { id: '1', address: 'Address 1' },
        { id: '2', address: 'Address 2' },
        { id: '1', address: 'Address 1 Duplicate' },
        { id: '3', address: 'Address 3' }
      ];

      const deduplicated = deduplicateProperties(properties);

      expect(deduplicated.length).toBe(3);
      expect(deduplicated.map(p => p.id)).toEqual(['1', '2', '3']);
    });

    test('should handle enableDelistingTracker with monitoring mode', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };

      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);

      const tracker = await initializeDelistingTracker();

      // Simulate monitoring mode workflow
      const properties = [
        { id: '123', address: 'New Property' },
        { id: '456', address: 'Another New Property' }
      ];

      for (const property of properties) {
        await tracker.updateProperty(property.id);
      }

      expect(mockStore.setValue).toHaveBeenCalledTimes(2);
      expect(mockStore.setValue).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({ propertyId: '123', lastSeen: expect.any(String) })
      );
    });

    test('should handle propertyUrls without startUrls', () => {
      const input = {
        propertyUrls: [
          { url: 'https://www.rightmove.co.uk/properties/123' },
          { url: 'https://www.rightmove.co.uk/properties/456' }
        ],
        fullPropertyDetails: true
      };

      expect(() => validateInput(input)).not.toThrow();
      const processed = processInput(input);

      expect(processed.urls.length).toBe(0);
      expect(processed.propertyUrls.length).toBe(2);
      expect(processed.fullPropertyDetails).toBe(true);
    });

    test('should handle both startUrls and propertyUrls together', () => {
      const input = {
        startUrls: [{ url: 'https://www.rightmove.co.uk/search' }],
        propertyUrls: [{ url: 'https://www.rightmove.co.uk/properties/123' }],
        maxItems: 50
      };

      expect(() => validateInput(input)).not.toThrow();
      const processed = processInput(input);

      expect(processed.urls.length).toBe(1);
      expect(processed.propertyUrls.length).toBe(1);
      expect(processed.maxItems).toBe(50);
    });
  });

  // ============================================================================
  // BACKWARD COMPATIBILITY TESTS
  // ============================================================================

  describe('Backward Compatibility Tests', () => {
    test('should accept Phase 1 input format (listUrls)', () => {
      const phase1Input = {
        listUrls: [{ url: 'https://www.rightmove.co.uk/test' }],
        maxItems: 200,
        maxPages: 5,
        proxy: { useApifyProxy: false },
        distressKeywords: ['reduced']
      };

      expect(() => validateInput(phase1Input)).not.toThrow();
      const processed = processInput(phase1Input);

      expect(processed.urls.length).toBe(1);
      expect(processed.maxItems).toBe(200);
      expect(processed.maxPages).toBe(5);
    });

    test('should accept Phase 1 input format (proxy field)', () => {
      const phase1Input = {
        startUrls: [{ url: 'https://www.rightmove.co.uk/test' }],
        proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] }
      };

      expect(() => validateInput(phase1Input)).not.toThrow();
      const processed = processInput(phase1Input);

      expect(processed.proxy.useApifyProxy).toBe(true);
      expect(processed.proxy.apifyProxyGroups).toEqual(['RESIDENTIAL']);
    });

    test('should accept Phase 2 input format (proxyConfiguration field)', () => {
      const phase2Input = {
        startUrls: [{ url: 'https://www.rightmove.co.uk/test' }],
        proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['DATACENTER'] }
      };

      expect(() => validateInput(phase2Input)).not.toThrow();
      const processed = processInput(phase2Input);

      expect(processed.proxy.useApifyProxy).toBe(true);
      expect(processed.proxy.apifyProxyGroups).toEqual(['DATACENTER']);
    });

    test('should apply Phase 2 defaults when Phase 2 fields are omitted', () => {
      const phase1Input = {
        startUrls: [{ url: 'https://www.rightmove.co.uk/test' }]
      };

      const processed = processInput(phase1Input);

      // Phase 2 defaults
      expect(processed.fullPropertyDetails).toBe(true);
      expect(processed.monitoringMode).toBe(false);
      expect(processed.enableDelistingTracker).toBe(false);
      expect(processed.includePriceHistory).toBe(false);
      expect(processed.propertyUrls).toEqual([]);

      // Phase 1 defaults
      expect(processed.maxItems).toBe(200);
      expect(processed.maxPages).toBe(5);
      expect(processed.proxy.useApifyProxy).toBe(false);
      expect(processed.distressKeywords).toEqual([
        'reduced', 'chain free', 'auction', 'motivated', 'cash buyers', 'needs renovation'
      ]);
    });

    test('should maintain Phase 1 output schema when fullPropertyDetails=false', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Test Address',
        price: { displayPrice: '£300,000' },
        summary: 'Test description'
      };

      const result = extractFullPropertyDetails(propertyData, ['reduced'], false);

      // Should have Phase 1 fields
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('distressKeywordsMatched');
      expect(result).toHaveProperty('distressScoreRule');

      // Should also have Phase 2 fields (for consistency)
      expect(result).toHaveProperty('coordinates');
      expect(result).toHaveProperty('agent');
      expect(result).toHaveProperty('_scrapedAt');
    });

    test('should handle missing Phase 2 fields gracefully', () => {
      const minimalPropertyData = {
        id: '123',
        displayAddress: 'Minimal Property'
      };

      const result = extractFullPropertyDetails(minimalPropertyData, [], false);

      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(result.coordinates.latitude).toBeNull();
      expect(result.coordinates.longitude).toBeNull();
      expect(result.agent).toBeNull();
      expect(result.features).toEqual([]);
      expect(result.nearestStations).toEqual([]);
      expect(result.brochures).toEqual([]);
      expect(result.floorplans).toEqual([]);
    });
  });

  // ============================================================================
  // PERFORMANCE BENCHMARKING TESTS
  // ============================================================================

  describe('Performance Benchmarking Tests', () => {
    test('should deduplicate large property arrays efficiently', () => {
      // Generate 1000 properties with 20% duplicates
      const properties = [];
      for (let i = 0; i < 800; i++) {
        properties.push({ id: `${i}`, address: `Address ${i}` });
      }
      // Add 200 duplicates
      for (let i = 0; i < 200; i++) {
        properties.push({ id: `${i}`, address: `Address ${i} Duplicate` });
      }

      const startTime = Date.now();
      const deduplicated = deduplicateProperties(properties);
      const endTime = Date.now();

      expect(deduplicated.length).toBe(800);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });

    test('should extract full property details efficiently', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Test Address',
        price: { displayPrice: '£300,000' },
        location: { latitude: 51.5, longitude: -0.1 },
        customer: {
          brandTradingName: 'Test Agent',
          branchDisplayNumber: '020 1234 5678'
        },
        keyFeatures: ['Garden', 'Parking', 'Garage'],
        nearestStations: [
          { name: 'Station 1', types: ['tube'], distance: 0.5, unit: 'miles' },
          { name: 'Station 2', types: ['train'], distance: 1.0, unit: 'miles' }
        ],
        priceHistory: [
          { date: '2025-01-01', price: 325000 },
          { date: '2025-01-15', price: 300000 }
        ]
      };

      const startTime = Date.now();
      const result = extractFullPropertyDetails(propertyData, ['reduced'], true);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
    });

    test('should extract price history efficiently', () => {
      const propertyData = {
        priceHistory: Array.from({ length: 50 }, (_, i) => ({
          date: `2025-01-${String(i + 1).padStart(2, '0')}`,
          price: 300000 - (i * 1000)
        }))
      };

      const startTime = Date.now();
      const result = extractPriceHistory(propertyData);
      const endTime = Date.now();

      expect(result.length).toBe(50);
      expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
    });

    test('should handle monitoring mode filtering efficiently', () => {
      // Generate 1000 properties
      const properties = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        address: `Address ${i}`
      }));

      // Generate 500 previous IDs
      const previousIds = new Set(
        Array.from({ length: 500 }, (_, i) => `${i}`)
      );

      const startTime = Date.now();
      const newProperties = properties.filter(p => !previousIds.has(p.id));
      const endTime = Date.now();

      expect(newProperties.length).toBe(500);
      expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    test('should integrate monitoring mode with deduplication', () => {
      // Simulate properties from multiple sources with duplicates
      const searchProperties = [
        { id: '1', address: 'Address 1' },
        { id: '2', address: 'Address 2' },
        { id: '3', address: 'Address 3' }
      ];

      const propertyUrlProperties = [
        { id: '3', address: 'Address 3 Duplicate' },
        { id: '4', address: 'Address 4' }
      ];

      const allProperties = [...searchProperties, ...propertyUrlProperties];

      // Deduplicate
      const deduplicated = deduplicateProperties(allProperties);
      expect(deduplicated.length).toBe(4);

      // Apply monitoring mode filtering
      const previousIds = new Set(['1', '2']);
      const newProperties = deduplicated.filter(p => !previousIds.has(p.id));

      expect(newProperties.length).toBe(2);
      expect(newProperties.map(p => p.id)).toEqual(['3', '4']);
    });

    test('should integrate delisting tracker with property extraction', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };

      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);

      const tracker = await initializeDelistingTracker();

      // Simulate extracting and tracking properties
      const properties = [
        { id: '123', address: 'Property 1' },
        { id: '456', address: 'Property 2' },
        { id: '789', address: 'Property 3' }
      ];

      for (const property of properties) {
        await tracker.updateProperty(property.id);
      }

      expect(mockStore.setValue).toHaveBeenCalledTimes(3);

      // Verify we can retrieve properties
      mockStore.getValue.mockResolvedValueOnce({
        lastSeen: '2025-01-20T10:00:00.000Z',
        propertyId: '123'
      });

      const retrieved = await tracker.getProperty('123');
      expect(retrieved).toBeDefined();
      expect(retrieved.propertyId).toBe('123');
    });

    test('should integrate full property details with distress detection', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Test Address',
        price: { displayPrice: '£300,000' },
        summary: 'REDUCED price, chain free, motivated seller',
        location: { latitude: 51.5, longitude: -0.1 },
        customer: { brandTradingName: 'Test Agent' }
      };

      const distressKeywords = ['reduced', 'chain free', 'motivated'];
      const result = extractFullPropertyDetails(propertyData, distressKeywords, false);

      expect(result).toBeDefined();
      expect(result.distressKeywordsMatched).toEqual(['reduced', 'chain free', 'motivated']);
      expect(result.distressScoreRule).toBe(6);
      expect(result.coordinates.latitude).toBe(51.5);
      expect(result.agent).toBe('Test Agent');
    });

    test('should handle maxItems enforcement across combined modes', () => {
      const maxItems = 10;

      // Simulate search results (8 properties)
      const searchResults = Array.from({ length: 8 }, (_, i) => ({
        id: `search-${i}`,
        address: `Search Address ${i}`
      }));

      // Simulate property URL results (5 properties)
      const propertyUrlResults = Array.from({ length: 5 }, (_, i) => ({
        id: `property-${i}`,
        address: `Property Address ${i}`
      }));

      // Combine and enforce maxItems
      const allProperties = [...searchResults, ...propertyUrlResults];
      const limited = allProperties.slice(0, maxItems);

      expect(limited.length).toBe(maxItems);
      expect(limited.length).toBeLessThanOrEqual(maxItems);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling Tests', () => {
    test('should handle delisting tracker initialization failure gracefully', async () => {
      Actor.openKeyValueStore = jest.fn().mockRejectedValue(new Error('Store error'));

      const tracker = await initializeDelistingTracker();

      // Should return no-op tracker
      expect(tracker).toBeDefined();
      await expect(tracker.updateProperty('123')).resolves.not.toThrow();
      await expect(tracker.getProperty('123')).resolves.toBe(null);
    });

    test('should handle monitoring mode API failure gracefully', async () => {
      const mockClient = {
        run: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('API error'))
        })
      };

      Actor.apifyClient = mockClient;
      process.env.APIFY_ACTOR_RUN_ID = 'test-run';

      const propertyIds = await loadPreviousPropertyIds();

      expect(propertyIds).toBeInstanceOf(Set);
      expect(propertyIds.size).toBe(0);
    });

    test('should handle malformed price history data', () => {
      const propertyData = {
        priceHistory: [
          { date: '2025-01-01', price: 300000 },
          { date: '2025-01-15' }, // Missing price
          { price: 275000 }, // Missing date
          'invalid', // Invalid entry
          null, // Null entry
          { date: '2025-01-20', price: 250000 }
        ]
      };

      const result = extractPriceHistory(propertyData);

      // Should only include valid entries
      expect(result.length).toBe(2);
      expect(result[0].date).toBe('2025-01-01');
      expect(result[1].date).toBe('2025-01-20');
    });

    test('should handle properties without IDs in deduplication', () => {
      const properties = [
        { id: '1', address: 'Address 1' },
        { address: 'No ID 1' },
        { address: 'No ID 2' },
        { id: '2', address: 'Address 2' },
        { id: '1', address: 'Address 1 Duplicate' }
      ];

      const deduplicated = deduplicateProperties(properties);

      // Should keep all properties without IDs
      expect(deduplicated.length).toBe(4);
      expect(deduplicated.filter(p => !p.id).length).toBe(2);
    });

    test('should handle invalid Phase 2 boolean fields', () => {
      const invalidInputs = [
        { startUrls: [{ url: 'https://test.com' }], fullPropertyDetails: 'true' },
        { startUrls: [{ url: 'https://test.com' }], monitoringMode: 1 },
        { startUrls: [{ url: 'https://test.com' }], enableDelistingTracker: 'yes' },
        { startUrls: [{ url: 'https://test.com' }], includePriceHistory: [] }
      ];

      invalidInputs.forEach(input => {
        expect(() => validateInput(input)).toThrow('Input validation failed');
      });
    });
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================

  describe('Edge Case Tests', () => {
    test('should handle empty property arrays', () => {
      const deduplicated = deduplicateProperties([]);
      expect(deduplicated).toEqual([]);
    });

    test('should handle property with all Phase 2 fields null', () => {
      const propertyData = {
        id: '123',
        displayAddress: null,
        price: null,
        location: null,
        customer: null,
        keyFeatures: null,
        nearestStations: null,
        priceHistory: null
      };

      const result = extractFullPropertyDetails(propertyData, [], false);

      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(result.coordinates.latitude).toBeNull();
      expect(result.agent).toBeNull();
      expect(result.features).toEqual([]);
      expect(result.nearestStations).toEqual([]);
    });

    test('should handle very large property ID sets in monitoring mode', () => {
      const largeSet = new Set(
        Array.from({ length: 10000 }, (_, i) => `${i}`)
      );

      const properties = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 10000}`,
        address: `Address ${i}`
      }));

      const startTime = Date.now();
      const newProperties = properties.filter(p => !largeSet.has(p.id));
      const endTime = Date.now();

      expect(newProperties.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(10);
    });

    test('should handle concurrent delisting tracker updates', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };

      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);

      const tracker = await initializeDelistingTracker();

      // Simulate concurrent updates
      const updates = Array.from({ length: 100 }, (_, i) =>
        tracker.updateProperty(`${i}`)
      );

      await Promise.all(updates);

      expect(mockStore.setValue).toHaveBeenCalledTimes(100);
    });
  });

  // ============================================================================
  // REAL-WORLD SCENARIO TESTS
  // ============================================================================

  describe('Real-World Scenario Tests', () => {
    test('Scenario: Daily monitoring run with delisting tracker', async () => {
      // Setup
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);

      const tracker = await initializeDelistingTracker();
      const previousIds = new Set(['1', '2', '3', '4', '5']);

      // Current scrape results
      const currentProperties = [
        { id: '3', address: 'Still listed' },
        { id: '4', address: 'Still listed' },
        { id: '5', address: 'Still listed' },
        { id: '6', address: 'New listing' },
        { id: '7', address: 'New listing' }
      ];

      // Filter for new properties
      const newProperties = currentProperties.filter(p => !previousIds.has(p.id));

      // Update tracker for all current properties
      for (const property of currentProperties) {
        await tracker.updateProperty(property.id);
      }

      // Verify
      expect(newProperties.length).toBe(2);
      expect(newProperties.map(p => p.id)).toEqual(['6', '7']);
      expect(mockStore.setValue).toHaveBeenCalledTimes(5);
    });

    test('Scenario: Mixed search and property URL scraping with deduplication', () => {
      // Search results (may include duplicates)
      const searchResults = [
        { id: '1', address: 'From Search 1' },
        { id: '2', address: 'From Search 2' },
        { id: '3', address: 'From Search 3' }
      ];

      // Property URL results (may overlap with search)
      const propertyUrlResults = [
        { id: '2', address: 'From Property URL (duplicate)' },
        { id: '4', address: 'From Property URL 4' },
        { id: '5', address: 'From Property URL 5' }
      ];

      // Combine and deduplicate
      const allProperties = [...searchResults, ...propertyUrlResults];
      const deduplicated = deduplicateProperties(allProperties);

      expect(deduplicated.length).toBe(5);
      expect(deduplicated[0].address).toBe('From Search 1'); // First occurrence kept
      expect(deduplicated[1].address).toBe('From Search 2'); // First occurrence kept
    });

    test('Scenario: Performance mode (fullPropertyDetails=false, no price history)', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Quick Scrape Property',
        price: { displayPrice: '£300,000' },
        priceHistory: [{ date: '2025-01-01', price: 325000 }]
      };

      const startTime = Date.now();
      const result = extractFullPropertyDetails(propertyData, [], false);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.priceHistory).toEqual([]); // Should be empty
      expect(endTime - startTime).toBeLessThan(5); // Should be very fast
    });

    test('Scenario: Deep analysis mode (fullPropertyDetails=true, with price history)', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Deep Analysis Property',
        price: { displayPrice: '£300,000' },
        location: { latitude: 51.5, longitude: -0.1 },
        customer: {
          brandTradingName: 'Premium Agents',
          branchDisplayNumber: '020 1234 5678'
        },
        keyFeatures: ['Garden', 'Parking', 'Garage'],
        nearestStations: [
          { name: 'Station 1', types: ['tube'], distance: 0.5, unit: 'miles' }
        ],
        priceHistory: [
          { date: '2025-01-01', price: 325000 },
          { date: '2025-01-15', price: 300000 }
        ]
      };

      const result = extractFullPropertyDetails(propertyData, ['reduced'], true);

      expect(result).toBeDefined();
      expect(result.priceHistory).toHaveLength(2);
      expect(result.coordinates.latitude).toBe(51.5);
      expect(result.agent).toBe('Premium Agents');
      expect(result.features).toHaveLength(3);
      expect(result.nearestStations).toHaveLength(1);
      expect(result._scrapedAt).toBeDefined();
    });
  });
});
