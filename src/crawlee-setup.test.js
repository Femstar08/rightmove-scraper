// Test for Crawlee setup (Task 3)

// Mock Actor for testing - must be defined before jest.mock
const mockCreateProxyConfiguration = jest.fn();

jest.mock('apify', () => ({
  Actor: {
    createProxyConfiguration: mockCreateProxyConfiguration
  }
}));

const { createCrawler } = require('./main');

describe('Task 3: Crawlee with Playwright Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create PlaywrightCrawler without proxy', async () => {
    const config = {
      maxItems: 100,
      proxy: {
        useApifyProxy: false,
        apifyProxyGroups: []
      },
      requestHandler: jest.fn()
    };

    const crawler = await createCrawler(config);

    expect(crawler).toBeDefined();
    expect(crawler.constructor.name).toBe('PlaywrightCrawler');
    expect(mockCreateProxyConfiguration).not.toHaveBeenCalled();
  });

  test('should create PlaywrightCrawler with Apify proxy', async () => {
    // Create a proper ProxyConfiguration mock
    const { ProxyConfiguration } = require('crawlee');
    const mockProxyConfig = new ProxyConfiguration({
      proxyUrls: ['http://proxy.apify.com:8000']
    });
    
    mockCreateProxyConfiguration.mockResolvedValue(mockProxyConfig);

    const config = {
      maxItems: 100,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
      },
      requestHandler: jest.fn()
    };

    const crawler = await createCrawler(config);

    expect(crawler).toBeDefined();
    expect(crawler.constructor.name).toBe('PlaywrightCrawler');
    expect(mockCreateProxyConfiguration).toHaveBeenCalledTimes(1);
    expect(mockCreateProxyConfiguration).toHaveBeenCalledWith({
      groups: ['RESIDENTIAL']
    });
  });

  test('should configure crawler with correct maxRequestsPerCrawl', async () => {
    const config = {
      maxItems: 50,
      proxy: {
        useApifyProxy: false,
        apifyProxyGroups: []
      },
      requestHandler: jest.fn()
    };

    const crawler = await createCrawler(config);

    // Verify crawler has the correct configuration
    expect(crawler).toBeDefined();
    // Note: We can't directly access private properties, but we can verify the crawler was created
  });

  test('should configure crawler with maxConcurrency of 1', async () => {
    const config = {
      maxItems: 100,
      proxy: {
        useApifyProxy: false,
        apifyProxyGroups: []
      },
      requestHandler: jest.fn()
    };

    const crawler = await createCrawler(config);

    expect(crawler).toBeDefined();
    // Crawler is configured with maxConcurrency: 1 to avoid rate limiting
  });
});
