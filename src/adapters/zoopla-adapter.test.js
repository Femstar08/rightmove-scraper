/**
 * Zoopla Adapter Tests
 */

const ZooplaAdapter = require('./zoopla-adapter');

describe('ZooplaAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new ZooplaAdapter();
  });

  describe('Constructor', () => {
    test('should initialize with correct site name', () => {
      expect(adapter.siteName).toBe('zoopla');
    });

    test('should initialize with correct site pattern', () => {
      expect(adapter.sitePattern).toBe('zoopla.co.uk');
    });
  });

  describe('isValidUrl', () => {
    test('should return true for valid Zoopla for-sale URL', () => {
      const url = 'https://www.zoopla.co.uk/for-sale/property/london/';
      expect(adapter.isValidUrl(url)).toBe(true);
    });

    test('should return true for valid Zoopla to-rent URL', () => {
      const url = 'https://www.zoopla.co.uk/to-rent/property/manchester/';
      expect(adapter.isValidUrl(url));
    });

    test('should return true for Zoopla property detail URL', () => {
      const url = 'https://www.zoopla.co.uk/for-sale/details/12345678';
      expect(adapter.isValidUrl(url)).toBe(true);
    });

    test('should return false for non-Zoopla URL', () => {
      const url = 'https://www.rightmove.co.uk/property-for-sale/';
      expect(adapter.isValidUrl(url)).toBe(false);
    });

    test('should return false for null URL', () => {
      expect(adapter.isValidUrl(null)).toBe(false);
    });

    test('should return false for undefined URL', () => {
      expect(adapter.isValidUrl(undefined)).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(adapter.isValidUrl('')).toBe(false);
    });
  });

  describe('buildPageUrl', () => {
    test('should return base URL for page 0', () => {
      const baseUrl = 'https://www.zoopla.co.uk/for-sale/property/london/';
      const result = adapter.buildPageUrl(baseUrl, 0);
      expect(result).toBe(baseUrl);
    });

    test('should add pn=2 for page 1', () => {
      const baseUrl = 'https://www.zoopla.co.uk/for-sale/property/london/';
      const result = adapter.buildPageUrl(baseUrl, 1);
      expect(result).toContain('pn=2');
    });

    test('should add pn=3 for page 2', () => {
      const baseUrl = 'https://www.zoopla.co.uk/for-sale/property/london/';
      const result = adapter.buildPageUrl(baseUrl, 2);
      expect(result).toContain('pn=3');
    });

    test('should handle URL with existing query parameters', () => {
      const baseUrl = 'https://www.zoopla.co.uk/for-sale/property/london/?radius=5';
      const result = adapter.buildPageUrl(baseUrl, 1);
      expect(result).toContain('pn=2');
      expect(result).toContain('radius=5');
    });
  });

  describe('formatPrice', () => {
    test('should format numeric price', () => {
      const result = adapter.formatPrice(350000);
      expect(result).toBe('£350,000');
    });

    test('should format string price', () => {
      const result = adapter.formatPrice('425000');
      expect(result).toBe('£425,000');
    });

    test('should handle price with currency symbol', () => {
      const result = adapter.formatPrice('£500,000');
      expect(result).toBe('£500,000');
    });

    test('should return null for null price', () => {
      const result = adapter.formatPrice(null);
      expect(result).toBeNull();
    });

    test('should return null for undefined price', () => {
      const result = adapter.formatPrice(undefined);
      expect(result).toBeNull();
    });

    test('should return null for empty string', () => {
      const result = adapter.formatPrice('');
      expect(result).toBeNull();
    });
  });

  describe('detectDistress', () => {
    test('should detect single keyword', () => {
      const description = 'This property has a price reduced recently';
      const keywords = ['price reduced', 'chain free'];
      const result = adapter.detectDistress(description, keywords);
      
      expect(result.matched).toContain('price reduced');
      expect(result.score).toBe(2);
    });

    test('should detect multiple keywords', () => {
      const description = 'Price reduced! Chain free property for quick sale';
      const keywords = ['price reduced', 'chain free', 'quick sale'];
      const result = adapter.detectDistress(description, keywords);
      
      expect(result.matched).toHaveLength(3);
      expect(result.score).toBe(6);
    });

    test('should be case insensitive', () => {
      const description = 'PRICE REDUCED property';
      const keywords = ['price reduced'];
      const result = adapter.detectDistress(description, keywords);
      
      expect(result.matched).toContain('price reduced');
    });

    test('should cap score at 10', () => {
      const description = 'price reduced chain free auction motivated quick sale urgent must sell';
      const keywords = ['price reduced', 'chain free', 'auction', 'motivated', 'quick sale', 'urgent', 'must sell'];
      const result = adapter.detectDistress(description, keywords);
      
      expect(result.score).toBe(10);
    });

    test('should return empty result for no keywords', () => {
      const description = 'Beautiful property in great location';
      const keywords = ['price reduced', 'chain free'];
      const result = adapter.detectDistress(description, keywords);
      
      expect(result.matched).toHaveLength(0);
      expect(result.score).toBe(0);
    });

    test('should handle empty description', () => {
      const result = adapter.detectDistress('', ['price reduced']);
      expect(result.matched).toHaveLength(0);
      expect(result.score).toBe(0);
    });

    test('should handle empty keywords array', () => {
      const result = adapter.detectDistress('Price reduced property', []);
      expect(result.matched).toHaveLength(0);
      expect(result.score).toBe(0);
    });
  });

  describe('parseZooplaProperty', () => {
    test('should parse basic Zoopla property', () => {
      const mockProperty = {
        listing_id: 12345678,
        displayable_address: 'Baker Street, London NW1 6XE',
        price: '425000',
        num_bedrooms: 3,
        num_bathrooms: 2,
        property_type: 'Flat',
        description: 'Spacious apartment',
        image_url: 'https://lid.zoocdn.com/image.jpg',
        first_published_date: '2024-01-10T08:00:00Z',
        agent_name: 'Test Agents',
        agent_phone: '020 1234 5678'
      };

      const result = adapter.parseZooplaProperty(mockProperty, []);

      expect(result.id).toBe('12345678');
      expect(result.address).toBe('Baker Street, London NW1 6XE');
      expect(result.price).toBe('£425,000');
      expect(result.bedrooms).toBe(3);
      expect(result.bathrooms).toBe(2);
      expect(result.propertyType).toBe('Flat');
      expect(result.description).toBe('Spacious apartment');
      expect(result.images).toHaveLength(1);
      expect(result.agent).toBe('Test Agents');
      expect(result.agentPhone).toBe('020 1234 5678');
      expect(result.outcode).toBe('NW1');
      expect(result.incode).toBe('6XE');
      expect(result.countryCode).toBe('GB');
    });

    test('should handle missing optional fields', () => {
      const mockProperty = {
        listing_id: 12345678,
        displayable_address: 'Test Street, London',
        price: '300000'
      };

      const result = adapter.parseZooplaProperty(mockProperty, []);

      expect(result.id).toBe('12345678');
      expect(result.bedrooms).toBeNull();
      expect(result.bathrooms).toBeNull();
      expect(result.propertyType).toBeNull();
      expect(result.description).toBe('');
      expect(result.agent).toBeNull();
    });

    test('should detect distress keywords', () => {
      const mockProperty = {
        listing_id: 12345678,
        displayable_address: 'Test Street, London',
        price: '300000',
        description: 'Price reduced! Chain free property'
      };

      const result = adapter.parseZooplaProperty(mockProperty, ['price reduced', 'chain free']);

      expect(result.distressKeywordsMatched).toHaveLength(2);
      expect(result.distressScoreRule).toBe(4);
    });
  });

  describe('normalizeProperty', () => {
    test('should add source fields', () => {
      const property = {
        id: '12345678',
        url: 'https://www.zoopla.co.uk/for-sale/details/12345678',
        address: 'Test Street, London'
      };

      const result = adapter.normalizeProperty(property);

      expect(result.source).toBe('zoopla');
      expect(result.sourceUrl).toBe(property.url);
      expect(result._site).toBe('zoopla');
      expect(result.id).toBe('12345678');
      expect(result.address).toBe('Test Street, London');
    });
  });

  describe('parseFromPageModel', () => {
    test('should parse properties from JavaScript data', () => {
      const jsData = {
        source: '__PRELOADED_STATE__',
        properties: [
          {
            listing_id: '12345',
            displayable_address: 'Test Street, London SW1A 1AA',
            price: 250000,
            num_bedrooms: 2,
            num_bathrooms: 1,
            property_type: 'Flat',
            description: 'A lovely property',
            details_url: 'https://www.zoopla.co.uk/for-sale/details/12345'
          }
        ]
      };

      const result = adapter.parseFromPageModel(jsData, ['reduced']);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', '12345');
      expect(result[0]).toHaveProperty('address', 'Test Street, London SW1A 1AA');
      expect(result[0]).toHaveProperty('price', '£250,000');
    });

    test('should return empty array for null data', () => {
      const result = adapter.parseFromPageModel(null, []);
      expect(result).toEqual([]);
    });

    test('should return empty array for data without properties', () => {
      const jsData = { source: '__PRELOADED_STATE__' };
      const result = adapter.parseFromPageModel(jsData, []);
      expect(result).toEqual([]);
    });
  });

  describe('extractFullPropertyDetails', () => {
    test('should extract full property details', () => {
      const propertyData = {
        listing_id: '12345',
        displayable_address: 'Test Street, London SW1A 1AA',
        price: 250000,
        num_bedrooms: 2,
        num_bathrooms: 1,
        property_type: 'Flat',
        description: 'A lovely property with reduced price',
        details_url: 'https://www.zoopla.co.uk/for-sale/details/12345',
        features: ['Garden', 'Parking'],
        latitude: 51.5074,
        longitude: -0.1278
      };

      const result = adapter.extractFullPropertyDetails(propertyData, ['reduced'], false);

      expect(result).toHaveProperty('id', '12345');
      expect(result).toHaveProperty('features', ['Garden', 'Parking']);
      expect(result).toHaveProperty('coordinates');
      expect(result.coordinates).toEqual({ latitude: 51.5074, longitude: -0.1278 });
      expect(result).toHaveProperty('distressKeywordsMatched', ['reduced']);
    });

    test('should handle property data with properties array', () => {
      const propertyData = {
        properties: [{
          listing_id: '12345',
          displayable_address: 'Test Street, London SW1A 1AA',
          price: 250000
        }]
      };

      const result = adapter.extractFullPropertyDetails(propertyData, [], false);

      expect(result).toHaveProperty('id', '12345');
    });

    test('should return null for null data', () => {
      const result = adapter.extractFullPropertyDetails(null, [], false);
      expect(result).toBeNull();
    });
  });
});
