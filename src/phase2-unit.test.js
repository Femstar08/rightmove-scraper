/**
 * Phase 2 Unit Tests
 * Tests for delisting tracker, monitoring mode, and other Phase 2 features
 */

const { Actor } = require('apify');
const {
  initializeDelistingTracker,
  loadPreviousPropertyIds,
  deduplicateProperties,
  extractFullPropertyDetails,
  extractPriceHistory,
  scrapePropertyDetail
} = require('./main');

// Mock Apify Actor
jest.mock('apify');

describe('Delisting Tracker Unit Tests', () => {
  // Task 19.1: Write unit tests for delisting tracker
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDelistingTracker', () => {
    test('should initialize Key-Value store successfully', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };
      
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);
      
      const tracker = await initializeDelistingTracker();
      
      expect(Actor.openKeyValueStore).toHaveBeenCalledWith('rightmove-properties');
      expect(tracker).toBeDefined();
      expect(tracker).toHaveProperty('updateProperty');
      expect(tracker).toHaveProperty('getProperty');
    });

    test('should handle store initialization errors gracefully', async () => {
      Actor.openKeyValueStore = jest.fn().mockRejectedValue(new Error('Store error'));
      
      const tracker = await initializeDelistingTracker();
      
      // Should return no-op tracker
      expect(tracker).toBeDefined();
      expect(tracker).toHaveProperty('updateProperty');
      expect(tracker).toHaveProperty('getProperty');
      
      // No-op methods should not throw
      await expect(tracker.updateProperty('123')).resolves.not.toThrow();
      await expect(tracker.getProperty('123')).resolves.toBe(null);
    });
  });

  describe('updateProperty', () => {
    test('should update property with lastSeen timestamp', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };
      
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);
      
      const tracker = await initializeDelistingTracker();
      await tracker.updateProperty('123456789');
      
      expect(mockStore.setValue).toHaveBeenCalledWith(
        '123456789',
        expect.objectContaining({
          lastSeen: expect.any(String),
          propertyId: '123456789'
        })
      );
    });

    test('should handle null or undefined property IDs', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };
      
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);
      
      const tracker = await initializeDelistingTracker();
      
      await tracker.updateProperty(null);
      await tracker.updateProperty(undefined);
      await tracker.updateProperty('');
      
      // Should not call setValue for invalid IDs
      expect(mockStore.setValue).not.toHaveBeenCalled();
    });

    test('should handle setValue errors gracefully', async () => {
      const mockStore = {
        setValue: jest.fn().mockRejectedValue(new Error('Write error')),
        getValue: jest.fn().mockResolvedValue(null)
      };
      
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);
      
      const tracker = await initializeDelistingTracker();
      
      // Should not throw
      await expect(tracker.updateProperty('123')).resolves.not.toThrow();
    });
  });

  describe('getProperty', () => {
    test('should retrieve property record from store', async () => {
      const mockRecord = {
        lastSeen: '2025-01-20T10:00:00.000Z',
        propertyId: '123456789'
      };
      
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(mockRecord)
      };
      
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);
      
      const tracker = await initializeDelistingTracker();
      const result = await tracker.getProperty('123456789');
      
      expect(mockStore.getValue).toHaveBeenCalledWith('123456789');
      expect(result).toEqual(mockRecord);
    });

    test('should return null for non-existent properties', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockResolvedValue(null)
      };
      
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);
      
      const tracker = await initializeDelistingTracker();
      const result = await tracker.getProperty('nonexistent');
      
      expect(result).toBeNull();
    });

    test('should handle getValue errors gracefully', async () => {
      const mockStore = {
        setValue: jest.fn().mockResolvedValue(undefined),
        getValue: jest.fn().mockRejectedValue(new Error('Read error'))
      };
      
      Actor.openKeyValueStore = jest.fn().mockResolvedValue(mockStore);
      
      const tracker = await initializeDelistingTracker();
      const result = await tracker.getProperty('123');
      
      expect(result).toBeNull();
    });
  });
});

describe('Monitoring Mode Unit Tests', () => {
  // Task 18.1: Write property test for monitoring mode
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPreviousPropertyIds', () => {
    test('should load property IDs from previous run', async () => {
      const mockDataset = {
        listItems: jest.fn().mockResolvedValue({
          items: [
            { id: '123' },
            { id: '456' },
            { id: '789' }
          ]
        })
      };
      
      const mockClient = {
        run: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            actId: 'actor123'
          })
        }),
        actor: jest.fn().mockReturnValue({
          runs: jest.fn().mockReturnValue({
            list: jest.fn().mockResolvedValue({
              items: [
                { id: 'current-run', defaultDatasetId: 'dataset-current' },
                { id: 'previous-run', defaultDatasetId: 'dataset-previous', finishedAt: '2025-01-19' }
              ]
            })
          })
        }),
        dataset: jest.fn().mockReturnValue(mockDataset)
      };
      
      Actor.apifyClient = mockClient;
      process.env.APIFY_ACTOR_RUN_ID = 'current-run';
      
      const propertyIds = await loadPreviousPropertyIds();
      
      expect(propertyIds).toBeInstanceOf(Set);
      expect(propertyIds.size).toBe(3);
      expect(propertyIds.has('123')).toBe(true);
      expect(propertyIds.has('456')).toBe(true);
      expect(propertyIds.has('789')).toBe(true);
    });

    test('should return empty set when no previous run exists', async () => {
      const mockClient = {
        run: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            actId: 'actor123'
          })
        }),
        actor: jest.fn().mockReturnValue({
          runs: jest.fn().mockReturnValue({
            list: jest.fn().mockResolvedValue({
              items: [
                { id: 'current-run', defaultDatasetId: 'dataset-current' }
              ]
            })
          })
        })
      };
      
      Actor.apifyClient = mockClient;
      process.env.APIFY_ACTOR_RUN_ID = 'current-run';
      
      const propertyIds = await loadPreviousPropertyIds();
      
      expect(propertyIds).toBeInstanceOf(Set);
      expect(propertyIds.size).toBe(0);
    });

    test('should handle missing actor run ID', async () => {
      delete process.env.APIFY_ACTOR_RUN_ID;
      
      const propertyIds = await loadPreviousPropertyIds();
      
      expect(propertyIds).toBeInstanceOf(Set);
      expect(propertyIds.size).toBe(0);
    });

    test('should handle API errors gracefully', async () => {
      const mockClient = {
        run: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('API error'))
        })
      };
      
      Actor.apifyClient = mockClient;
      process.env.APIFY_ACTOR_RUN_ID = 'current-run';
      
      const propertyIds = await loadPreviousPropertyIds();
      
      expect(propertyIds).toBeInstanceOf(Set);
      expect(propertyIds.size).toBe(0);
    });

    test('should filter out properties without IDs', async () => {
      const mockDataset = {
        listItems: jest.fn().mockResolvedValue({
          items: [
            { id: '123' },
            { address: 'No ID property' },
            { id: null },
            { id: '456' },
            { id: '' }
          ]
        })
      };
      
      const mockClient = {
        run: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            actId: 'actor123'
          })
        }),
        actor: jest.fn().mockReturnValue({
          runs: jest.fn().mockReturnValue({
            list: jest.fn().mockResolvedValue({
              items: [
                { id: 'current-run' },
                { id: 'previous-run', defaultDatasetId: 'dataset-previous' }
              ]
            })
          })
        }),
        dataset: jest.fn().mockReturnValue(mockDataset)
      };
      
      Actor.apifyClient = mockClient;
      process.env.APIFY_ACTOR_RUN_ID = 'current-run';
      
      const propertyIds = await loadPreviousPropertyIds();
      
      expect(propertyIds.size).toBe(2);
      expect(propertyIds.has('123')).toBe(true);
      expect(propertyIds.has('456')).toBe(true);
    });
  });
});

describe('Deduplication Unit Tests', () => {
  // Task 22.1: Write property test for deduplication
  
  describe('deduplicateProperties', () => {
    test('should remove exact duplicates by ID', () => {
      const properties = [
        { id: '123', address: 'Address 1' },
        { id: '456', address: 'Address 2' },
        { id: '123', address: 'Address 1 Duplicate' },
        { id: '789', address: 'Address 3' }
      ];
      
      const result = deduplicateProperties(properties);
      
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('123');
      expect(result[0].address).toBe('Address 1'); // First occurrence kept
      expect(result[1].id).toBe('456');
      expect(result[2].id).toBe('789');
    });

    test('should handle properties without IDs', () => {
      const properties = [
        { id: '123', address: 'Address 1' },
        { address: 'No ID 1' },
        { address: 'No ID 2' },
        { id: '456', address: 'Address 2' }
      ];
      
      const result = deduplicateProperties(properties);
      
      // Properties without IDs should all be kept
      expect(result.length).toBe(4);
    });

    test('should handle empty array', () => {
      const result = deduplicateProperties([]);
      expect(result).toEqual([]);
    });

    test('should handle array with no duplicates', () => {
      const properties = [
        { id: '123', address: 'Address 1' },
        { id: '456', address: 'Address 2' },
        { id: '789', address: 'Address 3' }
      ];
      
      const result = deduplicateProperties(properties);
      expect(result.length).toBe(3);
    });

    test('should handle numeric IDs', () => {
      const properties = [
        { id: 123, address: 'Address 1' },
        { id: 456, address: 'Address 2' },
        { id: 123, address: 'Address 1 Duplicate' }
      ];
      
      const result = deduplicateProperties(properties);
      expect(result.length).toBe(2);
    });
  });
});

describe('Price History Unit Tests', () => {
  // Task 37.1: Write unit tests for price history
  
  describe('extractPriceHistory', () => {
    test('should extract price history from property data', () => {
      const propertyData = {
        priceHistory: [
          { date: '2025-01-01', price: 375000 },
          { date: '2025-01-15', price: 350000 }
        ]
      };
      
      const result = extractPriceHistory(propertyData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ date: '2025-01-01', price: '375000' });
      expect(result[1]).toEqual({ date: '2025-01-15', price: '350000' });
    });

    test('should return empty array for missing price history', () => {
      const propertyData = { id: '123' };
      const result = extractPriceHistory(propertyData);
      
      expect(result).toEqual([]);
    });

    test('should return empty array for null price history', () => {
      const propertyData = { priceHistory: null };
      const result = extractPriceHistory(propertyData);
      
      expect(result).toEqual([]);
    });

    test('should handle malformed price history entries', () => {
      const propertyData = {
        priceHistory: [
          { date: '2025-01-01', price: 375000 },
          { date: '2025-01-15' }, // Missing price
          { price: 350000 }, // Missing date
          { date: '2025-01-20', price: 325000 }
        ]
      };
      
      const result = extractPriceHistory(propertyData);
      
      // Should only include valid entries
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2025-01-01');
      expect(result[1].date).toBe('2025-01-20');
    });

    test('should handle extraction errors gracefully', () => {
      const propertyData = {
        priceHistory: 'not an array'
      };
      
      const result = extractPriceHistory(propertyData);
      expect(result).toEqual([]);
    });
  });
});

describe('Full Property Details Unit Tests', () => {
  // Task 28.1: Write property test for full extraction
  
  describe('extractFullPropertyDetails', () => {
    test('should extract all Phase 2 fields', () => {
      const propertyData = {
        id: '123456789',
        displayAddress: 'High Street, London',
        price: { displayPrice: '£350,000' },
        summary: 'Beautiful property',
        location: {
          latitude: 51.5074,
          longitude: -0.1278
        },
        address: {
          outcode: 'SW1A',
          incode: '1AA'
        },
        tenure: 'Leasehold',
        councilTaxBand: 'D',
        customer: {
          brandTradingName: 'Premium Agents',
          branchDisplayNumber: '020 1234 5678',
          brandPlusLogoUrl: 'https://example.com/logo.jpg',
          branchAddress: '123 Main St',
          branchUrl: 'https://example.com/agent'
        },
        keyFeatures: ['Garden', 'Parking'],
        nearestStations: [
          {
            name: 'Westminster',
            types: ['tube'],
            distance: 0.3,
            unit: 'miles'
          }
        ]
      };
      
      const result = extractFullPropertyDetails(propertyData, [], false);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('123456789');
      expect(result.displayAddress).toBe('High Street, London');
      expect(result.coordinates.latitude).toBe(51.5074);
      expect(result.coordinates.longitude).toBe(-0.1278);
      expect(result.outcode).toBe('SW1A');
      expect(result.incode).toBe('1AA');
      expect(result.tenure).toBe('Leasehold');
      expect(result.councilTaxBand).toBe('D');
      expect(result.agent).toBe('Premium Agents');
      expect(result.agentPhone).toBe('020 1234 5678');
      expect(result.features).toEqual(['Garden', 'Parking']);
      expect(result.nearestStations).toHaveLength(1);
      expect(result._scrapedAt).toBeDefined();
    });

    test('should include price history when enabled', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Test',
        price: { displayPrice: '£300,000' },
        priceHistory: [
          { date: '2025-01-01', price: 325000 },
          { date: '2025-01-15', price: 300000 }
        ]
      };
      
      const result = extractFullPropertyDetails(propertyData, [], true);
      
      expect(result.priceHistory).toHaveLength(2);
    });

    test('should not include price history when disabled', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Test',
        price: { displayPrice: '£300,000' },
        priceHistory: [
          { date: '2025-01-01', price: 325000 }
        ]
      };
      
      const result = extractFullPropertyDetails(propertyData, [], false);
      
      expect(result.priceHistory).toEqual([]);
    });

    test('should handle missing optional fields', () => {
      const propertyData = {
        id: '123',
        displayAddress: 'Minimal Property'
      };
      
      const result = extractFullPropertyDetails(propertyData, [], false);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(result.coordinates.latitude).toBeNull();
      expect(result.agent).toBeNull();
      expect(result.features).toEqual([]);
      expect(result.nearestStations).toEqual([]);
    });
  });
});
