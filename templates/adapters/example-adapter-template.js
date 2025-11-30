/**
 * Example Site Adapter Template
 * 
 * Copy this file and rename it for each site you want to scrape.
 * Implement all the required methods with site-specific logic.
 */

const BaseAdapter = require('./base-adapter-template');

class ExampleAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.siteName = 'example'; // Change to your site name
    this.sitePattern = 'example.com'; // Change to your site's domain
  }

  /**
   * Extract items from JavaScript data
   */
  async extractFromJavaScript(page, options = {}) {
    console.log(`[${this.siteName.toUpperCase()}] Extracting from JavaScript...`);
    
    try {
      // Extract data from JavaScript objects in the page
      const items = await page.evaluate(() => {
        // Example: Extract from window object
        // if (window.__DATA__) return window.__DATA__.items;
        // if (window.__PRELOADED_STATE__) return window.__PRELOADED_STATE__.items;
        
        // Example: Extract from JSON-LD
        // const jsonLd = document.querySelector('script[type="application/ld+json"]');
        // if (jsonLd) return JSON.parse(jsonLd.textContent);
        
        return [];
      });

      if (!items || items.length === 0) {
        console.log(`[${this.siteName.toUpperCase()}] No items found in JavaScript data`);
        return [];
      }

      console.log(`[${this.siteName.toUpperCase()}] Found ${items.length} items`);

      // Parse and normalize each item
      return items.map(item => this.parseItem(item, options));
    } catch (error) {
      console.error(`[${this.siteName.toUpperCase()}] Error extracting from JavaScript:`, error.message);
      return [];
    }
  }

  /**
   * Extract items from DOM (fallback)
   */
  async extractFromDOM(page, options = {}) {
    console.log(`[${this.siteName.toUpperCase()}] Extracting from DOM...`);
    
    try {
      // Extract data from DOM elements
      const items = await page.evaluate(() => {
        // Example: Extract from list items
        // const elements = document.querySelectorAll('.item-card');
        // return Array.from(elements).map(el => ({
        //   title: el.querySelector('.title')?.textContent,
        //   description: el.querySelector('.description')?.textContent,
        //   url: el.querySelector('a')?.href
        // }));
        
        return [];
      });

      console.log(`[${this.siteName.toUpperCase()}] Found ${items.length} items in DOM`);
      return items.map(item => this.parseItem(item, options));
    } catch (error) {
      console.error(`[${this.siteName.toUpperCase()}] Error extracting from DOM:`, error.message);
      return [];
    }
  }

  /**
   * Extract full details for a single item
   */
  async extractFullDetails(page, options = {}) {
    console.log(`[${this.siteName.toUpperCase()}] Extracting full details...`);
    
    try {
      // Extract detailed data from detail page
      const data = await page.evaluate(() => {
        // Example: Extract from detail page
        // return {
        //   title: document.querySelector('.detail-title')?.textContent,
        //   description: document.querySelector('.detail-description')?.textContent,
        //   // ... extract all fields
        // };
        
        return null;
      });

      if (!data) {
        console.log(`[${this.siteName.toUpperCase()}] No details found`);
        return null;
      }

      return this.parseItemDetails(data, options);
    } catch (error) {
      console.error(`[${this.siteName.toUpperCase()}] Error extracting details:`, error.message);
      return null;
    }
  }

  /**
   * Build pagination URL
   */
  buildPageUrl(baseUrl, pageNumber) {
    if (pageNumber === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    
    // Choose your pagination pattern:
    
    // Pattern 1: ?page=2
    url.searchParams.set('page', pageNumber + 1);
    
    // Pattern 2: ?offset=20
    // url.searchParams.set('offset', pageNumber * 20);
    
    // Pattern 3: ?start=20
    // url.searchParams.set('start', pageNumber * 20);
    
    return url.toString();
  }

  /**
   * Validate URL for this site
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    return url.includes(this.sitePattern);
  }

  /**
   * Normalize item to unified schema
   */
  normalizeData(item) {
    return {
      ...item,
      source: this.siteName,
      sourceUrl: item.url,
      _site: this.siteName
    };
  }

  /**
   * Parse raw item from site
   * @private
   */
  parseItem(rawItem, options = {}) {
    return {
      id: rawItem.id?.toString() || null,
      url: rawItem.url || null,
      title: rawItem.title || null,
      description: rawItem.description || null,
      // ... map other fields to your unified schema
      _scrapedAt: new Date().toISOString()
    };
  }

  /**
   * Parse detailed item data
   * @private
   */
  parseItemDetails(rawData, options = {}) {
    return {
      id: rawData.id?.toString() || null,
      url: rawData.url || null,
      title: rawData.title || null,
      description: rawData.description || null,
      // ... map all detailed fields
      _scrapedAt: new Date().toISOString()
    };
  }
}

module.exports = ExampleAdapter;
