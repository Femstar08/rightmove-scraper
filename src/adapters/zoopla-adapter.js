/**
 * Zoopla Adapter
 * 
 * Handles property extraction from Zoopla.co.uk
 * Implements the BaseSiteAdapter interface for Zoopla-specific logic
 */

const BaseSiteAdapter = require('./base-adapter');
const { extractPostcode } = require('../utils/field-mapping');

class ZooplaAdapter extends BaseSiteAdapter {
  constructor() {
    super();
    this.siteName = 'zoopla';
    this.sitePattern = 'zoopla.co.uk';
  }

  /**
   * Detects if a URL is a Zoopla property URL
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is a Zoopla property URL
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    return url.includes('zoopla.co.uk') && 
           (url.includes('/for-sale/') || url.includes('/to-rent/'));
  }

  /**
   * Extracts properties from JavaScript data on search results page
   * @param {Object} page - Playwright page object
   * @param {Array<string>} distressKeywords - Keywords to detect distressed sales
   * @returns {Promise<Array<Object>>} Array of property objects
   */
  async extractFromJavaScript(page, distressKeywords = []) {
    console.log('[ZOOPLA] Extracting properties from JavaScript data...');
    
    try {
      // Extract __PRELOADED_STATE__ from page
      const properties = await page.evaluate(() => {
        // Try __PRELOADED_STATE__ first
        if (window.__PRELOADED_STATE__ && 
            window.__PRELOADED_STATE__.listing && 
            window.__PRELOADED_STATE__.listing.regular &&
            window.__PRELOADED_STATE__.listing.regular.listings) {
          return window.__PRELOADED_STATE__.listing.regular.listings;
        }
        
        // Try __INITIAL_STATE__ as fallback
        if (window.__INITIAL_STATE__ && 
            window.__INITIAL_STATE__.listings) {
          return window.__INITIAL_STATE__.listings;
        }
        
        return null;
      });

      if (!properties || properties.length === 0) {
        console.log('[ZOOPLA] No properties found in JavaScript data');
        return [];
      }

      console.log(`[ZOOPLA] Found ${properties.length} properties in JavaScript data`);

      // Map Zoopla properties to our format
      return properties.map(prop => this.parseZooplaProperty(prop, distressKeywords));
    } catch (error) {
      console.error('[ZOOPLA] Error extracting from JavaScript:', error.message);
      return [];
    }
  }

  /**
   * Extracts properties from DOM (fallback method)
   * @param {Object} page - Playwright page object
   * @param {Array<string>} distressKeywords - Keywords to detect distressed sales
   * @returns {Promise<Array<Object>>} Array of property objects
   */
  async extractFromDOM(page, distressKeywords = []) {
    console.log('[ZOOPLA] Extracting properties from DOM...');
    
    try {
      // TODO: Implement DOM extraction as fallback
      // This would parse HTML elements directly if JavaScript data is not available
      console.log('[ZOOPLA] DOM extraction not yet implemented');
      return [];
    } catch (error) {
      console.error('[ZOOPLA] Error extracting from DOM:', error.message);
      return [];
    }
  }

  /**
   * Extracts full property details from a property detail page
   * @param {Object} page - Playwright page object
   * @param {Array<string>} distressKeywords - Keywords to detect distressed sales
   * @returns {Promise<Object|null>} Property object with full details
   */
  async extractFullPropertyDetails(page, distressKeywords = []) {
    console.log('[ZOOPLA] Extracting full property details...');
    
    try {
      // Extract property details from __PRELOADED_STATE__
      const propertyData = await page.evaluate(() => {
        if (window.__PRELOADED_STATE__ && 
            window.__PRELOADED_STATE__.listing && 
            window.__PRELOADED_STATE__.listing.propertyDetails) {
          return window.__PRELOADED_STATE__.listing.propertyDetails;
        }
        
        return null;
      });

      if (!propertyData) {
        console.log('[ZOOPLA] No property details found');
        return null;
      }

      return this.parseZooplaPropertyDetails(propertyData, distressKeywords);
    } catch (error) {
      console.error('[ZOOPLA] Error extracting property details:', error.message);
      return null;
    }
  }

  /**
   * Builds pagination URL for Zoopla
   * @param {string} baseUrl - Base search URL
   * @param {number} pageNumber - Page number (0-indexed)
   * @returns {string} URL for the specified page
   */
  buildPageUrl(baseUrl, pageNumber) {
    if (pageNumber === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    url.searchParams.set('pn', pageNumber + 1); // Zoopla uses 1-indexed pages
    return url.toString();
  }

  /**
   * Parses a Zoopla property from search results
   * @param {Object} prop - Raw Zoopla property object
   * @param {Array<string>} distressKeywords - Keywords to detect distressed sales
   * @returns {Object} Normalized property object
   */
  parseZooplaProperty(prop, distressKeywords = []) {
    const description = prop.description || '';
    const distress = this.detectDistress(description, distressKeywords);
    
    // Extract postcode from address
    const postcodeData = extractPostcode(prop.displayable_address || '');

    return {
      id: prop.listing_id?.toString() || null,
      url: prop.details_url || `https://www.zoopla.co.uk/for-sale/details/${prop.listing_id}`,
      address: prop.displayable_address || null,
      displayAddress: prop.display_address || prop.displayable_address || null,
      price: this.formatPrice(prop.price),
      description: description,
      bedrooms: prop.num_bedrooms || null,
      bathrooms: prop.num_bathrooms || null,
      propertyType: prop.property_type || null,
      images: prop.image_url ? [prop.image_url] : [],
      addedOn: prop.first_published_date || null,
      agent: prop.agent_name || null,
      agentPhone: prop.agent_phone || null,
      distressKeywordsMatched: distress.matched,
      distressScoreRule: distress.score,
      outcode: postcodeData?.outcode || null,
      incode: postcodeData?.incode || null,
      countryCode: 'GB',
      _scrapedAt: new Date().toISOString()
    };
  }

  /**
   * Parses full Zoopla property details
   * @param {Object} data - Raw Zoopla property details object
   * @param {Array<string>} distressKeywords - Keywords to detect distressed sales
   * @returns {Object} Normalized property object with full details
   */
  parseZooplaPropertyDetails(data, distressKeywords = []) {
    const description = data.detailed_description || data.description || '';
    const distress = this.detectDistress(description, distressKeywords);
    
    // Extract postcode from address
    const postcodeData = extractPostcode(data.displayable_address || '');

    return {
      id: data.listing_id?.toString() || null,
      url: data.details_url || `https://www.zoopla.co.uk/for-sale/details/${data.listing_id}`,
      address: data.displayable_address || null,
      displayAddress: data.display_address || data.displayable_address || null,
      price: this.formatPrice(data.price),
      description: description,
      bedrooms: data.num_bedrooms || null,
      bathrooms: data.num_bathrooms || null,
      propertyType: data.property_type || null,
      tenure: data.tenure || null,
      images: data.image_urls || [],
      coordinates: data.latitude && data.longitude ? {
        latitude: data.latitude,
        longitude: data.longitude
      } : null,
      agent: data.agent_name || null,
      agentPhone: data.agent_phone || null,
      agentLogo: data.agent_logo || null,
      features: data.features || [],
      addedOn: data.first_published_date || null,
      listingUpdateDate: data.last_published_date || null,
      distressKeywordsMatched: distress.matched,
      distressScoreRule: distress.score,
      outcode: postcodeData?.outcode || null,
      incode: postcodeData?.incode || null,
      countryCode: 'GB',
      _scrapedAt: new Date().toISOString(),
      // Zoopla-specific data
      additionalData: {
        zooplaListingId: data.listing_id,
        zooplaAgentId: data.agent_id
      }
    };
  }

  /**
   * Normalizes a property to add source information
   * @param {Object} property - Property object to normalize
   * @returns {Object} Normalized property with source fields
   */
  normalizeProperty(property) {
    return {
      ...property,
      source: 'zoopla',
      sourceUrl: property.url,
      _site: 'zoopla'
    };
  }

  /**
   * Formats price to standard format
   * @param {string|number} price - Price to format
   * @returns {string} Formatted price string
   */
  formatPrice(price) {
    if (!price) return null;
    
    const priceStr = price.toString().replace(/[^\d]/g, '');
    if (!priceStr) return null;
    
    const formatted = parseInt(priceStr).toLocaleString('en-GB');
    return `£${formatted}`;
  }

  /**
   * Detects distress keywords in description
   * @param {string} description - Property description
   * @param {Array<string>} keywords - Keywords to search for
   * @returns {Object} { matched: Array<string>, score: number }
   */
  detectDistress(description, keywords = []) {
    if (!description || keywords.length === 0) {
      return { matched: [], score: 0 };
    }

    const lowerDesc = description.toLowerCase();
    const matched = keywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    );

    const score = Math.min(10, matched.length * 2);

    return { matched, score };
  }
}

module.exports = ZooplaAdapter;
