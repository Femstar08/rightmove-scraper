const { AdapterFactory, RightmoveAdapter, BaseSiteAdapter } = require('./index');

describe('Adapter Pattern', () => {
  describe('AdapterFactory', () => {
    test('creates Rightmove adapter by name', () => {
      const adapter = AdapterFactory.createAdapter('rightmove');
      expect(adapter).toBeInstanceOf(RightmoveAdapter);
      expect(adapter).toBeInstanceOf(BaseSiteAdapter);
      expect(adapter.siteName).toBe('rightmove');
    });

    test('creates Rightmove adapter from URL', () => {
      const adapter = AdapterFactory.createAdapter('https://www.rightmove.co.uk/property-for-sale/find.html');
      expect(adapter).toBeInstanceOf(RightmoveAdapter);
      expect(adapter.siteName).toBe('rightmove');
    });

    test('throws error for unsupported site', () => {
      expect(() => {
        AdapterFactory.createAdapter('zoopla');
      }).toThrow('Unsupported site: zoopla');
    });

    test('throws error for invalid input', () => {
      expect(() => {
        AdapterFactory.createAdapter('');
      }).toThrow();
    });

    test('getSupportedSites returns array', () => {
      const sites = AdapterFactory.getSupportedSites();
      expect(Array.isArray(sites)).toBe(true);
      expect(sites).toContain('rightmove');
    });

    test('isSiteSupported works correctly', () => {
      expect(AdapterFactory.isSiteSupported('rightmove')).toBe(true);
      expect(AdapterFactory.isSiteSupported('zoopla')).toBe(false);
      expect(AdapterFactory.isSiteSupported('https://www.rightmove.co.uk')).toBe(true);
    });
  });

  describe('RightmoveAdapter', () => {
    let adapter;

    beforeEach(() => {
      adapter = new RightmoveAdapter();
    });

    test('has correct site name', () => {
      expect(adapter.siteName).toBe('rightmove');
    });

    test('validates Rightmove URLs', () => {
      expect(adapter.isValidUrl('https://www.rightmove.co.uk/property-for-sale/find.html')).toBe(true);
      expect(adapter.isValidUrl('https://www.zoopla.co.uk/for-sale/')).toBe(false);
      expect(adapter.isValidUrl('invalid-url')).toBe(false);
    });

    test('builds paginated URLs correctly', () => {
      const baseUrl = 'https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490';
      
      // Page 1 (index 0) - no index parameter
      expect(adapter.buildPageUrl(baseUrl, 0)).toBe(baseUrl);
      
      // Page 2 (index 1) - index=24
      const page2 = adapter.buildPageUrl(baseUrl, 1);
      expect(page2).toContain('index=24');
      
      // Page 3 (index 2) - index=48
      const page3 = adapter.buildPageUrl(baseUrl, 2);
      expect(page3).toContain('index=48');
    });

    test('getSiteConfig returns correct config', () => {
      const config = adapter.getSiteConfig();
      expect(config.name).toBe('rightmove');
      expect(config.baseUrl).toBe('https://www.rightmove.co.uk');
      expect(config.propertiesPerPage).toBe(24);
    });

    test('normalizeProperty adds site metadata', () => {
      const rawProperty = {
        id: '123',
        address: 'Test Address',
        price: '£250,000'
      };
      
      const normalized = adapter.normalizeProperty(rawProperty);
      expect(normalized._site).toBe('rightmove');
      expect(normalized._normalized).toBe(true);
      expect(normalized.id).toBe('123');
    });

    test('detects distress keywords', () => {
      const description = 'Price reduced! Chain free property needs renovation';
      const keywords = ['price reduced', 'chain free', 'needs renovation'];
      
      const result = adapter._detectDistress(description, keywords);
      expect(result.matched).toHaveLength(3);
      expect(result.score).toBe(6); // 3 keywords * 2 points
    });

    test('handles empty description in distress detection', () => {
      const result = adapter._detectDistress(null, ['reduced']);
      expect(result.matched).toHaveLength(0);
      expect(result.score).toBe(0);
    });

    test('handles empty keywords in distress detection', () => {
      const result = adapter._detectDistress('Some description', []);
      expect(result.matched).toHaveLength(0);
      expect(result.score).toBe(0);
    });
  });

  describe('BaseSiteAdapter', () => {
    test('throws errors for unimplemented methods', async () => {
      const adapter = new BaseSiteAdapter();
      
      expect(() => adapter.isValidUrl('test')).toThrow('must be implemented');
      expect(() => adapter.buildPageUrl('test', 0)).toThrow('must be implemented');
      await expect(adapter.extractFromJavaScript({})).rejects.toThrow('must be implemented');
      await expect(adapter.extractFromDOM({})).rejects.toThrow('must be implemented');
      expect(() => adapter.extractFullPropertyDetails({})).toThrow('must be implemented');
      expect(() => adapter.normalizeProperty({})).toThrow('must be implemented');
    });

    test('getSiteConfig returns default config', () => {
      const adapter = new BaseSiteAdapter({ customKey: 'value' });
      const config = adapter.getSiteConfig();
      
      expect(config.name).toBe('unknown');
      expect(config.baseUrl).toBe('');
      expect(config.propertiesPerPage).toBe(24);
      expect(config.customKey).toBe('value');
    });
  });
});
