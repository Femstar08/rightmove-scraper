/**
 * Integration tests for adapter pattern
 * Tests the complete flow with adapters
 */

const { AdapterFactory } = require('./index');
const { validateUnifiedSchema } = require('../utils/field-mapping');

describe('Adapter Integration Tests', () => {
  describe('RightmoveAdapter Integration', () => {
    let adapter;

    beforeAll(() => {
      adapter = AdapterFactory.createAdapter('rightmove');
    });

    test('adapter is created successfully', () => {
      expect(adapter).toBeDefined();
      expect(adapter.siteName).toBe('rightmove');
    });

    test('validates Rightmove URLs correctly', () => {
      const validUrls = [
        'https://www.rightmove.co.uk/property-for-sale/find.html',
        'https://www.rightmove.co.uk/properties/123456',
        'https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490'
      ];

      validUrls.forEach(url => {
        expect(adapter.isValidUrl(url)).toBe(true);
      });
    });

    test('rejects non-Rightmove URLs', () => {
      const invalidUrls = [
        'https://www.zoopla.co.uk/for-sale/',
        'https://www.google.com',
        'invalid-url'
      ];

      invalidUrls.forEach(url => {
        expect(adapter.isValidUrl(url)).toBe(false);
      });
    });

    test('builds paginated URLs correctly', () => {
      const baseUrl = 'https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490';
      
      const page1 = adapter.buildPageUrl(baseUrl, 0);
      expect(page1).toBe(baseUrl);
      
      const page2 = adapter.buildPageUrl(baseUrl, 1);
      expect(page2).toContain('index=24');
      
      const page3 = adapter.buildPageUrl(baseUrl, 2);
      expect(page3).toContain('index=48');
    });

    test('normalizes property with site metadata', () => {
      const rawProperty = {
        id: '123',
        url: 'https://www.rightmove.co.uk/properties/123',
        address: '123 Test Street',
        price: '£250,000'
      };

      const normalized = adapter.normalizeProperty(rawProperty);
      
      expect(normalized._site).toBe('rightmove');
      expect(normalized._normalized).toBe(true);
      expect(normalized.id).toBe('123');
    });

    test('extracts property from mock JavaScript data', () => {
      const mockJsData = {
        id: '123456',
        propertyUrl: '/properties/123456',
        displayAddress: '123 Test Street, London',
        price: {
          displayPrice: '£250,000'
        },
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Terraced',
        summary: 'Beautiful property in great location',
        propertyImages: [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' }
        ],
        addedOn: '2024-01-15'
      };

      const property = adapter._extractPropertyFromJS(mockJsData, ['beautiful']);
      
      expect(property).toBeDefined();
      expect(property.id).toBe('123456');
      expect(property.url).toContain('rightmove.co.uk');
      expect(property.address).toBe('123 Test Street, London');
      expect(property.price).toBe('£250,000');
      expect(property.bedrooms).toBe(3);
      expect(property.bathrooms).toBe(2);
      expect(property.propertyType).toBe('Terraced');
      expect(property.description).toBe('Beautiful property in great location');
      expect(property.images).toHaveLength(2);
      expect(property.distressKeywordsMatched).toContain('beautiful');
      expect(property._site).toBe('rightmove');
    });

    test('extracted property validates against unified schema', () => {
      const mockJsData = {
        id: '123456',
        propertyUrl: '/properties/123456',
        displayAddress: '123 Test Street, London',
        price: {
          displayPrice: '£250,000'
        },
        bedrooms: 3,
        summary: 'Test property'
      };

      const property = adapter._extractPropertyFromJS(mockJsData, []);
      
      // Add required fields for validation
      property.source = 'rightmove';
      property.sourceUrl = property.url;
      
      const validation = validateUnifiedSchema(property);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('detects distress keywords correctly', () => {
      const description = 'Price reduced! Chain free property needs renovation';
      const keywords = ['price reduced', 'chain free', 'needs renovation'];
      
      const result = adapter._detectDistress(description, keywords);
      
      expect(result.matched).toHaveLength(3);
      expect(result.matched).toContain('price reduced');
      expect(result.matched).toContain('chain free');
      expect(result.matched).toContain('needs renovation');
      expect(result.score).toBe(6); // 3 keywords * 2 points
    });

    test('handles missing fields gracefully', () => {
      const mockJsData = {
        id: '123456'
        // Missing most fields
      };

      const property = adapter._extractPropertyFromJS(mockJsData, []);
      
      expect(property).toBeDefined();
      expect(property.id).toBe('123456');
      expect(property.address).toBeNull();
      expect(property.price).toBeNull();
      expect(property.bedrooms).toBeNull();
      expect(property.images).toEqual([]);
    });

    test('extracts full property details', () => {
      const mockJsData = {
        id: '123456',
        propertyUrl: '/properties/123456',
        displayAddress: '123 Test Street, London',
        price: { displayPrice: '£250,000' },
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Terraced',
        summary: 'Beautiful property',
        location: {
          latitude: 51.5074,
          longitude: -0.1278
        },
        tenure: 'Freehold',
        councilTaxBand: 'D',
        customer: {
          brandTradingName: 'Test Estate Agents',
          branchDisplayNumber: '020 1234 5678'
        },
        keyFeatures: ['Garden', 'Parking', 'Modern kitchen'],
        published: true,
        archived: false,
        sold: false
      };

      const fullDetails = adapter.extractFullPropertyDetails(mockJsData, [], false);
      
      expect(fullDetails).toBeDefined();
      expect(fullDetails.id).toBe('123456');
      expect(fullDetails.coordinates.latitude).toBe(51.5074);
      expect(fullDetails.coordinates.longitude).toBe(-0.1278);
      expect(fullDetails.tenure).toBe('Freehold');
      expect(fullDetails.councilTaxBand).toBe('D');
      expect(fullDetails.agent).toBe('Test Estate Agents');
      expect(fullDetails.agentPhone).toBe('020 1234 5678');
      expect(fullDetails.features).toContain('Garden');
      expect(fullDetails.published).toBe(true);
      expect(fullDetails.archived).toBe(false);
      expect(fullDetails.sold).toBe(false);
      expect(fullDetails._scrapedAt).toBeDefined();
      expect(fullDetails._site).toBe('rightmove');
    });
  });

  describe('AdapterFactory Integration', () => {
    test('creates correct adapter from URL', () => {
      const rightmoveUrl = 'https://www.rightmove.co.uk/property-for-sale/find.html';
      const adapter = AdapterFactory.createAdapter(rightmoveUrl);
      
      expect(adapter.siteName).toBe('rightmove');
    });

    test('throws error for unsupported site URL', () => {
      const unsupportedUrl = 'https://www.zoopla.co.uk/for-sale/';
      
      expect(() => {
        AdapterFactory.createAdapter(unsupportedUrl);
      }).toThrow('Unsupported site: zoopla');
    });

    test('lists supported sites', () => {
      const sites = AdapterFactory.getSupportedSites();
      
      expect(sites).toContain('rightmove');
      expect(Array.isArray(sites)).toBe(true);
    });

    test('checks site support correctly', () => {
      expect(AdapterFactory.isSiteSupported('rightmove')).toBe(true);
      expect(AdapterFactory.isSiteSupported('zoopla')).toBe(false);
      expect(AdapterFactory.isSiteSupported('https://www.rightmove.co.uk')).toBe(true);
    });
  });

  describe('End-to-End Property Processing', () => {
    test('complete property extraction and validation flow', () => {
      // 1. Create adapter
      const adapter = AdapterFactory.createAdapter('rightmove');
      
      // 2. Mock property data
      const mockJsData = {
        id: '123456',
        propertyUrl: '/properties/123456',
        displayAddress: '123 Test Street, London, SW1A 1AA',
        price: { displayPrice: '£250,000' },
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Terraced',
        summary: 'Chain free property with development potential',
        propertyImages: [
          { url: 'https://example.com/image1.jpg' }
        ],
        location: {
          latitude: 51.5074,
          longitude: -0.1278
        },
        addedOn: '2024-01-15'
      };
      
      // 3. Extract property
      const distressKeywords = ['chain free', 'development potential'];
      const property = adapter._extractPropertyFromJS(mockJsData, distressKeywords);
      
      // 4. Normalize
      const normalized = adapter.normalizeProperty(property);
      
      // 5. Add required fields for validation
      normalized.source = 'rightmove';
      normalized.sourceUrl = normalized.url;
      
      // 6. Validate
      const validation = validateUnifiedSchema(normalized);
      
      // Assertions
      expect(property).toBeDefined();
      expect(property.distressKeywordsMatched).toHaveLength(2);
      expect(property.distressScoreRule).toBe(4);
      expect(normalized._site).toBe('rightmove');
      expect(normalized._normalized).toBe(true);
      expect(validation.valid).toBe(true);
    });
  });
});
