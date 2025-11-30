const { Actor } = require('apify');
const { PlaywrightCrawler } = require('crawlee');
const { AdapterFactory } = require('./adapters');

/**
 * Creates and configures a PlaywrightCrawler instance
 */
async function createCrawler(config) {
  const { maxItems, proxy, requestHandler } = config;
  
  let proxyConfiguration = null;
  if (proxy.useApifyProxy) {
    console.log('Configuring Apify proxy...');
    proxyConfiguration = await Actor.createProxyConfiguration({
      groups: proxy.apifyProxyGroups.length > 0 ? proxy.apifyProxyGroups : undefined
    });
    console.log('Apify proxy configured successfully');
  }
  
  const crawlerConfig = {
    requestHandler,
    maxRequestsPerCrawl: maxItems,
    maxConcurrency: 1,
    launchContext: {
      launchOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled'
        ]
      },
      useChrome: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    navigationTimeoutSecs: 60,
    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 180,
    preNavigationHooks: [
      async ({ page, request }) => {
        const delay = Math.floor(Math.random() * 2000) + 1000;
        console.log(`Waiting ${delay}ms before navigation...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false
          });
        });
      }
    ]
  };
  
  if (proxyConfiguration) {
    crawlerConfig.proxyConfiguration = proxyConfiguration;
  }
  
  return new PlaywrightCrawler(crawlerConfig);
}

/**
 * Scrapes properties from a search URL with pagination
 */
async function scrapeProperties(url, adapter, maxItems, maxPages, distressKeywords, proxy) {
  const allProperties = [];
  let pagesProcessed = 0;
  let itemsExtracted = 0;

  try {
    console.log(`Starting pagination: up to ${maxPages} page(s), up to ${maxItems} item(s)`);
    
    const requestHandler = async ({ page, request }) => {
      console.log(`Processing page: ${request.url}`);
      
      try {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
      } catch (error) {
        console.warn(`Network idle timeout: ${error.message}`);
      }
      
      const remainingSlots = maxItems - itemsExtracted;
      let pageProperties = [];
      
      // Try JavaScript extraction first
      console.log('Attempting JavaScript extraction...');
      const jsData = await adapter.extractFromJavaScript(page);
      
      if (jsData) {
        pageProperties = adapter.parseFromPageModel(jsData, distressKeywords);
        if (pageProperties.length > 0) {
          console.log(`✓ JavaScript extraction: ${pageProperties.length} properties`);
        }
      }
      
      // Fallback to DOM extraction
      if (pageProperties.length === 0) {
        console.log('Falling back to DOM extraction...');
        pageProperties = await adapter.extractFromDOM(page, distressKeywords);
        
        if (pageProperties.length === 0) {
          console.log(`✗ No properties found, stopping pagination`);
          return;
        }
      }
      
      const propertiesToAdd = pageProperties.slice(0, remainingSlots);
      allProperties.push(...propertiesToAdd);
      itemsExtracted += propertiesToAdd.length;
      pagesProcessed++;
      
      console.log(`Extracted ${propertiesToAdd.length} properties (total: ${itemsExtracted}/${maxItems})`);
    };
    
    const crawler = await createCrawler({ maxItems, proxy, requestHandler });
    
    // Build paginated URLs
    const urls = [];
    for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
      const pageUrl = adapter.buildPageUrl(url, pageIndex);
      urls.push(pageUrl);
    }
    
    console.log(`Queuing ${urls.length} page(s)`);
    await crawler.addRequests(urls);
    await crawler.run();
    
    console.log(`Pagination complete: ${allProperties.length} properties from ${pagesProcessed} page(s)`);
    
    return { properties: allProperties, pagesProcessed };
  } catch (error) {
    console.error(`Scraping error: ${error.message}`);
    throw error;
  }
}

/**
 * Scrapes a single property detail page
 */
async function scrapePropertyDetail(url, adapter, distressKeywords, proxy, fullPropertyDetails, includePriceHistory) {
  try {
    console.log(`Scraping property: ${url}`);
    
    const requestHandler = async ({ page }) => {
      try {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
      } catch (error) {
        console.warn(`Network idle timeout: ${error.message}`);
      }
      
      const jsData = await adapter.extractFromJavaScript(page);
      
      if (!jsData) {
        console.warn(`No data found for: ${url}`);
        return null;
      }
      
      let property = null;
      
      if (fullPropertyDetails) {
        const propertyData = jsData.propertyData || jsData;
        property = adapter.extractFullPropertyDetails(propertyData, distressKeywords, includePriceHistory);
      } else {
        const properties = adapter.parseFromPageModel(jsData, distressKeywords);
        property = properties.length > 0 ? properties[0] : null;
      }
      
      return property;
    };
    
    const crawler = await createCrawler({ maxItems: 1, proxy, requestHandler });
    
    let result = null;
    const originalHandler = crawler.requestHandler;
    crawler.requestHandler = async (context) => {
      result = await originalHandler(context);
    };
    
    await crawler.addRequests([url]);
    await crawler.run();
    
    return result;
  } catch (error) {
    console.error(`Error scraping ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Scrapes multiple property URLs
 */
async function scrapePropertyUrls(urls, adapter, maxItems, distressKeywords, proxy, fullPropertyDetails, includePriceHistory) {
  const properties = [];
  
  console.log(`\n=== Scraping ${urls.length} Property URLs ===`);
  
  for (let i = 0; i < urls.length && properties.length < maxItems; i++) {
    const url = urls[i];
    console.log(`Property ${i + 1}/${urls.length}: ${url}`);
    
    const property = await scrapePropertyDetail(url, adapter, distressKeywords, proxy, fullPropertyDetails, includePriceHistory);
    
    if (property) {
      properties.push(property);
      console.log(`✓ Extracted property ${property.id || 'unknown'}`);
    } else {
      console.warn(`✗ Failed: ${url}`);
    }
    
    if (properties.length >= maxItems) {
      console.log(`Reached maxItems (${maxItems})`);
      break;
    }
  }
  
  console.log(`Extracted ${properties.length} properties`);
  return properties;
}

/**
 * Deduplicates properties by ID
 */
function deduplicateProperties(properties) {
  const seen = new Set();
  const deduplicated = [];
  let duplicateCount = 0;
  
  properties.forEach(property => {
    const id = property.id?.toString();
    
    if (!id) {
      deduplicated.push(property);
      return;
    }
    
    if (seen.has(id)) {
      duplicateCount++;
      return;
    }
    
    seen.add(id);
    deduplicated.push(property);
  });
  
  if (duplicateCount > 0) {
    console.log(`Removed ${duplicateCount} duplicates`);
  }
  
  return deduplicated;
}

/**
 * Validates input
 */
function validateInput(input) {
  if (!input) {
    throw new Error('No input provided');
  }
  
  const urls = input.startUrls || input.listUrls;
  const propertyUrls = input.propertyUrls;
  
  if (!urls && !propertyUrls) {
    throw new Error('Either startUrls or propertyUrls required');
  }
  
  if (urls) {
    if (!Array.isArray(urls)) {
      throw new Error('startUrls must be an array');
    }
    
    if (urls.length === 0 && (!propertyUrls || propertyUrls.length === 0)) {
      throw new Error('startUrls cannot be empty unless propertyUrls provided');
    }
    
    urls.forEach((urlObj, index) => {
      if (!urlObj || typeof urlObj !== 'object') {
        throw new Error(`startUrls[${index}] must be an object`);
      }
      
      if (!urlObj.url || typeof urlObj.url !== 'string' || urlObj.url.trim() === '') {
        throw new Error(`startUrls[${index}].url must be a non-empty string`);
      }
    });
  }
  
  if (propertyUrls) {
    if (!Array.isArray(propertyUrls)) {
      throw new Error('propertyUrls must be an array');
    }
    
    propertyUrls.forEach((urlObj, index) => {
      if (!urlObj || typeof urlObj !== 'object') {
        throw new Error(`propertyUrls[${index}] must be an object`);
      }
      
      if (!urlObj.url || typeof urlObj.url !== 'string' || urlObj.url.trim() === '') {
        throw new Error(`propertyUrls[${index}].url must be a non-empty string`);
      }
    });
  }
  
  // Validate site parameter
  if (input.site !== undefined) {
    if (typeof input.site !== 'string') {
      throw new Error('site must be a string');
    }
    
    if (!AdapterFactory.isSiteSupported(input.site)) {
      const supported = AdapterFactory.getSupportedSites().join(', ');
      throw new Error(`Unsupported site: ${input.site}. Supported: ${supported}`);
    }
  }
}

/**
 * Processes input with defaults
 */
function processInput(input) {
  const urlArray = input.startUrls || input.listUrls;
  const urls = urlArray ? urlArray.map(urlObj => urlObj.url) : [];
  
  const propertyUrlArray = input.propertyUrls || [];
  const propertyUrls = propertyUrlArray.map(urlObj => urlObj.url);
  
  // NEW: Site parameter (default: rightmove)
  const site = input.site || 'rightmove';
  
  const maxItems = input.maxItems !== undefined && typeof input.maxItems === 'number' && input.maxItems > 0
    ? input.maxItems : 200;

  const maxPages = input.maxPages !== undefined && typeof input.maxPages === 'number' && input.maxPages > 0
    ? input.maxPages : 5;

  const proxyConfig = input.proxyConfiguration || input.proxy || {};
  const proxy = {
    useApifyProxy: proxyConfig.useApifyProxy === true,
    apifyProxyGroups: proxyConfig.apifyProxyGroups || []
  };

  const distressKeywords = input.distressKeywords && Array.isArray(input.distressKeywords) && input.distressKeywords.length > 0
    ? input.distressKeywords
    : ['reduced', 'chain free', 'auction', 'motivated', 'cash buyers', 'needs renovation'];

  const fullPropertyDetails = input.fullPropertyDetails !== false;
  const monitoringMode = input.monitoringMode === true;
  const enableDelistingTracker = input.enableDelistingTracker === true;
  const addEmptyTrackerRecord = input.addEmptyTrackerRecord === true;
  const includePriceHistory = input.includePriceHistory === true;
  const onlyDistressed = input.onlyDistressed !== false;

  return {
    site,
    urls,
    propertyUrls,
    maxItems,
    maxPages,
    proxy,
    distressKeywords,
    fullPropertyDetails,
    monitoringMode,
    enableDelistingTracker,
    addEmptyTrackerRecord,
    includePriceHistory,
    onlyDistressed
  };
}

/**
 * Main actor entry point
 */
async function main() {
  await Actor.init();

  try {
    console.log('Reading input...');
    const rawInput = await Actor.getInput();
    
    console.log('Validating input...');
    validateInput(rawInput);
    
    const input = processInput(rawInput);
    
    // NEW: Create site adapter
    console.log(`\n=== Creating ${input.site} adapter ===`);
    const adapter = AdapterFactory.createAdapter(input.site);
    console.log(`Adapter created: ${adapter.siteName}`);
    console.log('=====================================');
    
    console.log('\n=== Configuration ===');
    console.log(`Site: ${input.site}`);
    console.log(`Search URLs: ${input.urls.length}`);
    input.urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
    console.log(`Property URLs: ${input.propertyUrls.length}`);
    input.propertyUrls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
    console.log(`Max items: ${input.maxItems}`);
    console.log(`Max pages: ${input.maxPages}`);
    console.log(`Proxy: ${input.proxy.useApifyProxy}`);
    console.log(`Full details: ${input.fullPropertyDetails}`);
    console.log(`Only distressed: ${input.onlyDistressed}`);
    console.log('=====================');
    
    const allProperties = [];
    let totalPagesProcessed = 0;
    
    // Process search URLs
    if (input.urls.length > 0) {
      console.log(`\n=== Processing ${input.urls.length} Search URLs ===`);
      
      for (let i = 0; i < input.urls.length; i++) {
        const url = input.urls[i];
        console.log(`\n=== Search URL ${i + 1}/${input.urls.length} ===`);
        console.log(`URL: ${url}`);
        
        const result = await scrapeProperties(url, adapter, input.maxItems, input.maxPages, input.distressKeywords, input.proxy);
        
        allProperties.push(...result.properties);
        totalPagesProcessed += result.pagesProcessed;
        
        console.log(`Extracted ${result.properties.length} properties from ${result.pagesProcessed} page(s)`);
      }
    }
    
    // Process property URLs
    if (input.propertyUrls.length > 0) {
      console.log(`\n=== Processing ${input.propertyUrls.length} Property URLs ===`);
      
      const remainingSlots = input.maxItems - allProperties.length;
      
      const propertyUrlProperties = await scrapePropertyUrls(
        input.propertyUrls,
        adapter,
        remainingSlots,
        input.distressKeywords,
        input.proxy,
        input.fullPropertyDetails,
        input.includePriceHistory
      );
      
      allProperties.push(...propertyUrlProperties);
    }
    
    // Deduplicate
    console.log(`\n=== Deduplication ===`);
    console.log(`Before: ${allProperties.length}`);
    const deduplicatedProperties = deduplicateProperties(allProperties);
    console.log(`After: ${deduplicatedProperties.length}`);
    
    // Filter distressed properties
    let finalProperties = deduplicatedProperties;
    let filteredCount = 0;
    
    if (input.onlyDistressed) {
      const propertiesWithDistress = deduplicatedProperties.filter(p => p.distressScoreRule > 0);
      filteredCount = deduplicatedProperties.length - propertiesWithDistress.length;
      finalProperties = propertiesWithDistress;
      
      if (filteredCount > 0) {
        console.log(`\n🔍 Filtered ${filteredCount} properties with no distress signals`);
        console.log(`📊 Keeping ${finalProperties.length} distressed properties`);
      }
    }
    
    // Save results
    console.log('\nSaving results...');
    await Actor.pushData(finalProperties);
    
    console.log('\n=== Summary ===');
    console.log(`Site: ${input.site}`);
    console.log(`URLs processed: ${input.urls.length}`);
    console.log(`Pages processed: ${totalPagesProcessed}`);
    console.log(`Items found: ${allProperties.length}`);
    console.log(`Distressed: ${allProperties.filter(p => p.distressScoreRule > 0).length}`);
    if (filteredCount > 0) {
      console.log(`Filtered: ${filteredCount}`);
    }
    console.log(`Final dataset: ${finalProperties.length}`);
    console.log('===============');
    
    await Actor.exit();
  } catch (error) {
    console.error('=== Actor Failed ===');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    throw error;
  }
}

module.exports = {
  main,
  validateInput,
  processInput,
  createCrawler,
  scrapeProperties,
  scrapePropertyDetail,
  scrapePropertyUrls,
  deduplicateProperties
};

if (require.main === module) {
  main();
}
