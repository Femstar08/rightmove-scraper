const { Logger, createLogger, globalLogger } = require('./logger');

describe('Logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new Logger('rightmove');
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation()
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Basic Logging', () => {
    test('logs info messages with context', () => {
      logger.info('Test message');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('[RIGHTMOVE]');
      expect(message).toContain('Test message');
      expect(message).toContain('INFO');
    });

    test('logs success messages with checkmark', () => {
      logger.success('Operation successful');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('✓');
      expect(message).toContain('Operation successful');
    });

    test('logs warning messages', () => {
      logger.warn('Warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalled();
      const message = consoleSpy.warn.mock.calls[0][0];
      expect(message).toContain('⚠️');
      expect(message).toContain('Warning message');
      expect(message).toContain('WARN');
    });

    test('logs error messages', () => {
      logger.error('Error message');
      
      expect(consoleSpy.error).toHaveBeenCalled();
      const message = consoleSpy.error.mock.calls[0][0];
      expect(message).toContain('❌');
      expect(message).toContain('Error message');
      expect(message).toContain('ERROR');
    });

    test('logs error with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      
      expect(consoleSpy.error).toHaveBeenCalledTimes(2);
      expect(consoleSpy.error.mock.calls[1][0]).toContain('Error: Test error');
    });
  });

  describe('Context', () => {
    test('includes site name in context', () => {
      logger.info('Test');
      
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('[RIGHTMOVE]');
    });

    test('works without site name', () => {
      const noContextLogger = new Logger();
      noContextLogger.info('Test');
      
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).not.toContain('[');
      expect(message).toContain('Test');
    });

    test('creates child logger with additional context', () => {
      const childLogger = logger.child('scraper');
      childLogger.info('Test');
      
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('[RIGHTMOVE:SCRAPER]');
    });
  });

  describe('Adapter Logging', () => {
    test('logs adapter initialization', () => {
      logger.logAdapterInit();
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Initializing rightmove adapter');
    });

    test('logs adapter initialization success', () => {
      logger.logAdapterInitSuccess();
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('✓');
      expect(message).toContain('rightmove adapter initialized');
    });
  });

  describe('URL and Page Logging', () => {
    test('logs URL processing start', () => {
      logger.logUrlStart('https://example.com', 1, 5);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Processing URL 1/5');
      expect(message).toContain('https://example.com');
    });

    test('logs page processing', () => {
      logger.logPageProcessing(2, 'https://example.com/page/2');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Processing page 2');
    });
  });

  describe('Extraction Logging', () => {
    test('logs properties extracted', () => {
      logger.logPropertiesExtracted(50, 'JavaScript');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('✓');
      expect(message).toContain('50 properties');
      expect(message).toContain('JavaScript');
    });

    test('logs extraction method', () => {
      logger.logExtractionMethod('JavaScript');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Using JavaScript extraction');
    });

    test('logs extraction fallback', () => {
      logger.logExtractionFallback('JavaScript', 'DOM');
      
      expect(consoleSpy.warn).toHaveBeenCalled();
      const message = consoleSpy.warn.mock.calls[0][0];
      expect(message).toContain('JavaScript extraction failed');
      expect(message).toContain('falling back to DOM');
    });
  });

  describe('Statistics Logging', () => {
    test('logs statistics', () => {
      const stats = {
        urlsProcessed: 5,
        pagesProcessed: 25,
        propertiesFound: 250,
        propertiesWithDistress: 50,
        errors: 2
      };

      logger.logStatistics(stats);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled(); // For errors
      
      const messages = consoleSpy.log.mock.calls.map(call => call[0]).join(' ');
      expect(messages).toContain('URLs processed: 5');
      expect(messages).toContain('Pages processed: 25');
      expect(messages).toContain('Properties found: 250');
      expect(messages).toContain('With distress signals: 50');
    });

    test('logs cross-site summary', () => {
      const aggregated = {
        totalSites: 2,
        totalUrlsProcessed: 10,
        totalPagesProcessed: 50,
        totalPropertiesFound: 500,
        totalPropertiesWithDistress: 100,
        totalErrors: 0,
        perSite: {
          rightmove: { propertiesFound: 300, pagesProcessed: 30 },
          zoopla: { propertiesFound: 200, pagesProcessed: 20 }
        }
      };

      logger.logCrossSiteSummary(aggregated);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const messages = consoleSpy.log.mock.calls.map(call => call[0]).join(' ');
      expect(messages).toContain('MULTI-SITE SCRAPING SUMMARY');
      expect(messages).toContain('Sites processed: 2');
      expect(messages).toContain('Total properties: 500');
      expect(messages).toContain('rightmove: 300 properties');
      expect(messages).toContain('zoopla: 200 properties');
    });
  });

  describe('Site Detection Logging', () => {
    test('logs site detection results', () => {
      const grouped = new Map([
        ['rightmove', ['url1', 'url2']],
        ['zoopla', ['url3']]
      ]);

      logger.logSiteDetection(grouped);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const messages = consoleSpy.log.mock.calls.map(call => call[0]).join(' ');
      expect(messages).toContain('Site detection complete');
      expect(messages).toContain('rightmove: 2 URL(s)');
      expect(messages).toContain('zoopla: 1 URL(s)');
    });
  });

  describe('Deduplication and Filtering', () => {
    test('logs deduplication with duplicates', () => {
      logger.logDeduplication(100, 80);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('100 → 80');
      expect(message).toContain('removed 20 duplicates');
    });

    test('logs deduplication without duplicates', () => {
      logger.logDeduplication(100, 100);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('No duplicates found');
    });

    test('logs filtering results', () => {
      logger.logFiltering(100, 50, 'distress');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('distress filtering');
      expect(message).toContain('100 → 50');
      expect(message).toContain('filtered 50');
    });
  });

  describe('Monitoring and Progress', () => {
    test('logs monitoring mode status', () => {
      logger.logMonitoringMode(25, 100);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Monitoring mode');
      expect(message).toContain('25 new properties');
      expect(message).toContain('100 total checked');
    });

    test('logs progress', () => {
      logger.logProgress(50, 100, 'properties');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Progress: 50/100 properties');
      expect(message).toContain('50%');
    });
  });

  describe('Configuration Logging', () => {
    test('logs proxy enabled', () => {
      logger.logProxyConfig(true, ['RESIDENTIAL']);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Proxy enabled');
      expect(message).toContain('RESIDENTIAL');
    });

    test('logs proxy disabled', () => {
      logger.logProxyConfig(false);
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];
      expect(message).toContain('Proxy disabled');
    });
  });

  describe('Factory Functions', () => {
    test('createLogger creates logger instance', () => {
      const newLogger = createLogger('zoopla');
      expect(newLogger).toBeInstanceOf(Logger);
      expect(newLogger.siteName).toBe('zoopla');
    });

    test('globalLogger exists', () => {
      expect(globalLogger).toBeInstanceOf(Logger);
      expect(globalLogger.siteName).toBeNull();
    });
  });
});
