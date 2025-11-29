const Orchestrator = require('./orchestrator');
const { RightmoveAdapter } = require('../adapters');

describe('Orchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  describe('URL Grouping', () => {
    test('groups URLs by site correctly', () => {
      const urls = [
        'https://www.rightmove.co.uk/property-for-sale/find.html',
        'https://www.rightmove.co.uk/property-for-sale/find.html?page=2',
        'https://www.zoopla.co.uk/for-sale/property/',
        'https://www.onthemarket.com/for-sale/'
      ];

      const grouped = orchestrator.groupUrlsBySite(urls);

      expect(grouped.size).toBe(3);
      expect(grouped.get('rightmove')).toHaveLength(2);
      expect(grouped.get('zoopla')).toHaveLength(1);
      expect(grouped.get('onthemarket')).toHaveLength(1);
    });

    test('handles single site URLs', () => {
      const urls = [
        'https://www.rightmove.co.uk/property-for-sale/find.html',
        'https://www.rightmove.co.uk/properties/123456'
      ];

      const grouped = orchestrator.groupUrlsBySite(urls);

      expect(grouped.size).toBe(1);
      expect(grouped.get('rightmove')).toHaveLength(2);
    });

    test('handles invalid URLs gracefully', () => {
      const urls = [
        'https://www.rightmove.co.uk/property-for-sale/find.html',
        'invalid-url',
        'https://www.google.com'
      ];

      const grouped = orchestrator.groupUrlsBySite(urls);

      expect(grouped.size).toBe(1);
      expect(grouped.get('rightmove')).toHaveLength(1);
    });

    test('returns empty map for empty URLs', () => {
      const grouped = orchestrator.groupUrlsBySite([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('Adapter Management', () => {
    test('creates adapter on first access', () => {
      const adapter = orchestrator.getAdapter('rightmove');
      
      expect(adapter).toBeInstanceOf(RightmoveAdapter);
      expect(orchestrator.adapters.size).toBe(1);
    });

    test('reuses existing adapter', () => {
      const adapter1 = orchestrator.getAdapter('rightmove');
      const adapter2 = orchestrator.getAdapter('rightmove');
      
      expect(adapter1).toBe(adapter2);
      expect(orchestrator.adapters.size).toBe(1);
    });

    test('creates different adapters for different sites', () => {
      const rightmoveAdapter = orchestrator.getAdapter('rightmove');
      
      expect(rightmoveAdapter.siteName).toBe('rightmove');
      expect(orchestrator.adapters.size).toBe(1);
    });
  });

  describe('Statistics', () => {
    test('initializes statistics for a site', () => {
      orchestrator.initializeStatistics('rightmove');
      
      const stats = orchestrator.getStatistics('rightmove');
      expect(stats).toBeDefined();
      expect(stats.site).toBe('rightmove');
      expect(stats.urlsProcessed).toBe(0);
      expect(stats.pagesProcessed).toBe(0);
      expect(stats.propertiesFound).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.startTime).toBeDefined();
      expect(stats.endTime).toBeNull();
    });

    test('updates statistics', () => {
      orchestrator.initializeStatistics('rightmove');
      orchestrator.updateStatistics('rightmove', {
        urlsProcessed: 1,
        pagesProcessed: 5,
        propertiesFound: 50
      });
      
      const stats = orchestrator.getStatistics('rightmove');
      expect(stats.urlsProcessed).toBe(1);
      expect(stats.pagesProcessed).toBe(5);
      expect(stats.propertiesFound).toBe(50);
    });

    test('finalizes statistics', () => {
      orchestrator.initializeStatistics('rightmove');
      orchestrator.finalizeStatistics('rightmove');
      
      const stats = orchestrator.getStatistics('rightmove');
      expect(stats.endTime).toBeDefined();
      expect(stats.endTime).not.toBeNull();
    });

    test('aggregates statistics across sites', () => {
      orchestrator.initializeStatistics('rightmove');
      orchestrator.updateStatistics('rightmove', {
        urlsProcessed: 2,
        pagesProcessed: 10,
        propertiesFound: 100,
        propertiesWithDistress: 20
      });

      orchestrator.initializeStatistics('zoopla');
      orchestrator.updateStatistics('zoopla', {
        urlsProcessed: 1,
        pagesProcessed: 5,
        propertiesFound: 50,
        propertiesWithDistress: 10
      });

      const aggregated = orchestrator.getAggregatedStatistics();
      
      expect(aggregated.totalSites).toBe(2);
      expect(aggregated.totalUrlsProcessed).toBe(3);
      expect(aggregated.totalPagesProcessed).toBe(15);
      expect(aggregated.totalPropertiesFound).toBe(150);
      expect(aggregated.totalPropertiesWithDistress).toBe(30);
      expect(aggregated.perSite.rightmove).toBeDefined();
      expect(aggregated.perSite.zoopla).toBeDefined();
    });

    test('handles errors and increments error count', () => {
      orchestrator.initializeStatistics('rightmove');
      
      const error = new Error('Test error');
      orchestrator.handleError('rightmove', error, 'test context');
      
      const stats = orchestrator.getStatistics('rightmove');
      expect(stats.errors).toBe(1);
    });
  });

  describe('Validation', () => {
    test('validates URLs successfully', () => {
      const urls = [
        'https://www.rightmove.co.uk/property-for-sale/find.html'
      ];

      const grouped = orchestrator.validateUrls(urls);
      expect(grouped.size).toBe(1);
    });

    test('throws error for empty URLs', () => {
      expect(() => {
        orchestrator.validateUrls([]);
      }).toThrow('No URLs provided');
    });

    test('throws error for no supported sites', () => {
      const urls = ['https://www.google.com'];
      
      expect(() => {
        orchestrator.validateUrls(urls);
      }).toThrow('No supported property sites found');
    });

    test('gets processing sites list', () => {
      const urls = [
        'https://www.rightmove.co.uk/property-for-sale/find.html',
        'https://www.zoopla.co.uk/for-sale/property/'
      ];

      const sites = orchestrator.getProcessingSites(urls);
      expect(sites).toContain('rightmove');
      expect(sites).toContain('zoopla');
      expect(sites).toHaveLength(2);
    });
  });

  describe('Logging', () => {
    test('logs statistics without errors', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      orchestrator.initializeStatistics('rightmove');
      orchestrator.updateStatistics('rightmove', {
        urlsProcessed: 1,
        pagesProcessed: 5,
        propertiesFound: 50,
        propertiesWithDistress: 10
      });
      
      orchestrator.logStatistics('rightmove');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('logs aggregated statistics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      orchestrator.initializeStatistics('rightmove');
      orchestrator.updateStatistics('rightmove', { propertiesFound: 50 });
      
      orchestrator.logAggregatedStatistics();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
