const BaseSiteAdapter = require('./base-adapter');
const cheerio = require('cheerio');
const {
  extractPageModelAdaptive,
  findPropertyDataRecursive,
  discoverPropertyCardSelector,
  calculateConfidence
} = require('../adaptive-extraction');

/**
 * Rightmove Site Adapter
 * Handles all Rightmove-specific extraction logic
 */
class RightmoveAdapter extends BaseSiteAdapter {
  constructor(config = {}) {
    super(config);
    this.siteName = 'rightmove';
    this.config = {
      baseUrl: 'https://www.rightmove.co.uk',
      propertiesPerPage: 24,
      ...config
    };
  }

  /**
   * Validates if a URL belongs to Rightmove
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('rightmove.co.uk');
    } catch {
      return false;
    }
  }

  /**
   * Builds paginated URL for Rightmove search results
   * Rightmove uses 'index' parameter: 0, 24, 48, etc.
   */
  buildPageUrl(baseUrl, pageIndex) {
    if (pageIndex === 0) {
      return baseUrl;
    }

    try {
      const url = new URL(baseUrl);
      const indexValue = pageIndex * this.config.propertiesPerPage;
      url.searchParams.set('index', indexValue.toString());
      return url.toString();
    } catch (error) {
      console.error(`Error building page URL: ${error.message}`);
      return baseUrl;
    }
  }

  /**
   * Extracts property data from JavaScript (window.PAGE_MODEL)
   */
  async extractFromJavaScript(page) {
    try {
      console.log('Extracting Rightmove data from JavaScript (adaptive mode)...');
      
      const jsData = await extractPageModelAdaptive(page);
      
      if (jsData) {
        const propertyData = findPropertyDataRecursive(jsData);
        if (propertyData) {
          console.log(`✓ Found property data with ${propertyData.length} properties`);
          return { propertyData };
        }
        return jsData;
      }
      
      console.log('✗ No JavaScript data found');
      return null;
    } catch (error) {
      console.warn(`Error extracting JavaScript data: ${error.message}`);
      return null;
    }
  }

  /**
   * Extracts property data from DOM
   */
  async extractFromDOM(page, distressKeywords = []) {
    try {
      console.log('Extracting Rightmove data from DOM (adaptive mode)...');
      
      const discoveredSelector = await discoverPropertyCardSelector(page);
      const html = await page.content();
      const $ = cheerio.load(html);
      
      let propertyCards = null;
      let count = 0;
      
      if (discoveredSelector) {
        console.log(`Trying discovered selector: ${discoveredSelector}`);
        propertyCards = $(discoveredSelector);
        count = propertyCards.length;
        
        if (count > 0) {
          console.log(`✓ Discovered selector found ${count} elements`);
        }
      }
      
      if (count === 0) {
        console.log('Falling back to predefined selectors...');
        const result = this._parseHTML(html);
        propertyCards = result.propertyCards;
        count = result.count;
      }
      
      if (count === 0) {
        console.log('✗ No property cards found in DOM');
        return [];
      }
      
      console.log(`Found ${count} property card(s) in DOM`);
      
      const properties = [];
      propertyCards.each((index, element) => {
        const property = this._extractPropertyFromCard($, element, distressKeywords);
        properties.push(property);
      });
      
      const confidence = calculateConfidence(properties);
      console.log(`✓ DOM extraction successful: ${properties.length} properties (confidence: ${confidence}%)`);
      
      if (confidence < 30) {
        console.warn(`⚠️ Low confidence (${confidence}%), data may be incomplete`);
      }
      
      return properties;
    } catch (error) {
      console.warn(`Error during DOM extraction: ${error.message}`);
      return [];
    }
  }

  /**
   * Extracts full property details (30+ fields)
   */
  extractFullPropertyDetails(prop, distressKeywords = [], includePriceHistory = false) {
    try {
      const basicData = this._extractPropertyFromJS(prop, distressKeywords);
      if (!basicData) return null;
      
      const displayAddress = prop.displayAddress || prop.address?.displayAddress || basicData.address;
      const countryCode = prop.countryCode || prop.location?.countryCode || 'GB';
      const outcode = prop.address?.outcode || null;
      const incode = prop.address?.incode || null;
      
      const coordinates = {
        latitude: prop.location?.latitude || prop.latitude || null,
        longitude: prop.location?.longitude || prop.longitude || null
      };
      
      const tenure = prop.tenure || null;
      const councilTaxBand = prop.councilTaxBand || null;
      
      const agent = prop.customer?.brandTradingName || prop.agent?.name || prop.contactInfo?.name || null;
      const agentPhone = prop.customer?.branchDisplayNumber || prop.agent?.phone || prop.contactInfo?.phone || null;
      const agentLogo = prop.customer?.brandPlusLogoUrl || prop.agent?.logo || null;
      const agentDisplayAddress = prop.customer?.branchAddress || prop.agent?.address || null;
      const agentProfileUrl = prop.customer?.branchUrl || prop.agent?.url || null;
      
      const brochures = [];
      if (prop.brochures && Array.isArray(prop.brochures)) {
        prop.brochures.forEach(brochure => {
          if (brochure.url || brochure.uri) {
            brochures.push({
              url: brochure.url || brochure.uri,
              caption: brochure.caption || brochure.title || ''
            });
          }
        });
      }
      
      const floorplans = [];
      if (prop.floorplans && Array.isArray(prop.floorplans)) {
        prop.floorplans.forEach(plan => {
          if (plan.url || plan.uri) {
            floorplans.push({
              url: plan.url || plan.uri,
              caption: plan.caption || plan.title || ''
            });
          }
        });
      }
      
      const nearestStations = [];
      if (prop.nearestStations && Array.isArray(prop.nearestStations)) {
        prop.nearestStations.forEach(station => {
          nearestStations.push({
            name: station.name || station.stationName || '',
            types: station.types || station.transportTypes || [],
            distance: station.distance || null,
            unit: station.unit || station.distanceUnit || 'miles'
          });
        });
      }
      
      const features = [];
      if (prop.keyFeatures && Array.isArray(prop.keyFeatures)) {
        features.push(...prop.keyFeatures);
      } else if (prop.features && Array.isArray(prop.features)) {
        features.push(...prop.features);
      }
      
      const published = prop.published !== false;
      const archived = prop.archived === true;
      const sold = prop.sold === true || prop.status === 'sold';
      
      const listingUpdateDate = prop.listingUpdate?.listingUpdateDate || prop.listingUpdateDate || null;
      const firstVisibleDate = prop.firstVisibleDate || prop.addedOn || basicData.addedOn;
      const _scrapedAt = new Date().toISOString();
      
      const priceHistory = includePriceHistory ? this._extractPriceHistory(prop) : [];
      
      return {
        ...basicData,
        displayAddress,
        countryCode,
        outcode,
        incode,
        coordinates,
        tenure,
        councilTaxBand,
        agent,
        agentPhone,
        agentLogo,
        agentDisplayAddress,
        agentProfileUrl,
        brochures,
        floorplans,
        nearestStations,
        features,
        priceHistory,
        published,
        archived,
        sold,
        listingUpdateDate,
        firstVisibleDate,
        _scrapedAt,
        _site: 'rightmove'
      };
    } catch (error) {
      console.warn(`Error extracting full property details: ${error.message}`);
      return null;
    }
  }

  /**
   * Normalizes property data to common format
   */
  normalizeProperty(rawProperty) {
    return {
      ...rawProperty,
      _site: 'rightmove',
      _normalized: true
    };
  }

  /**
   * Parses properties from PAGE_MODEL data
   */
  parseFromPageModel(pageModel, distressKeywords = []) {
    try {
      console.log('Parsing propertyData from PAGE_MODEL (adaptive mode)...');
      
      if (!pageModel) {
        console.log('No PAGE_MODEL provided');
        return [];
      }
      
      let propertyData = findPropertyDataRecursive(pageModel);
      
      if (!propertyData) {
        console.log('Recursive search failed, trying manual locations...');
        if (pageModel.propertyData) {
          propertyData = pageModel.propertyData;
        } else if (pageModel.properties) {
          propertyData = pageModel.properties;
        } else if (pageModel.results) {
          propertyData = pageModel.results;
        } else if (pageModel.props?.pageProps?.properties) {
          propertyData = pageModel.props.pageProps.properties;
        }
      }
      
      if (!propertyData) {
        console.log('✗ No propertyData found in PAGE_MODEL');
        return [];
      }
      
      const properties = Array.isArray(propertyData) ? propertyData : [propertyData];
      console.log(`✓ Found ${properties.length} property/properties in JavaScript data`);
      
      const extractedProperties = properties.map(prop => {
        return this._extractPropertyFromJS(prop, distressKeywords);
      });
      
      return extractedProperties.filter(p => p !== null);
    } catch (error) {
      console.warn(`Error parsing propertyData from PAGE_MODEL: ${error.message}`);
      return [];
    }
  }

  // Private helper methods

  _extractPriceHistory(prop) {
    try {
      const priceHistory = [];
      
      if (prop.priceHistory && Array.isArray(prop.priceHistory)) {
        prop.priceHistory.forEach(entry => {
          if (!entry || typeof entry !== 'object') return;
          
          if (entry.date && entry.price) {
            priceHistory.push({
              date: entry.date,
              price: entry.price.toString()
            });
          }
        });
      }
      
      return priceHistory;
    } catch (error) {
      console.warn(`Error extracting price history: ${error.message}`);
      return [];
    }
  }

  _extractPropertyFromJS(prop, distressKeywords = []) {
    try {
      const id = prop.id?.toString() || prop.propertyId?.toString() || null;
      
      let url = null;
      if (prop.propertyUrl) {
        url = prop.propertyUrl.startsWith('http') 
          ? prop.propertyUrl 
          : `${this.config.baseUrl}${prop.propertyUrl}`;
      } else if (id) {
        url = `${this.config.baseUrl}/properties/${id}`;
      }
      
      const address = prop.displayAddress || prop.address?.displayAddress || prop.address || null;
      const price = prop.price?.displayPrice || prop.price?.amount?.toString() || prop.displayPrice || prop.price?.toString() || null;
      const description = prop.summary || prop.description || prop.text || prop.propertyDescription || prop.displayAddress || prop.propertySubType || null;
      const bedrooms = prop.bedrooms !== undefined ? prop.bedrooms : null;
      const bathrooms = prop.bathrooms !== undefined ? prop.bathrooms : null;
      const propertyType = prop.propertyType || prop.propertySubType || prop.type || null;
      
      let images = [];
      if (prop.propertyImages && Array.isArray(prop.propertyImages)) {
        images = prop.propertyImages.map(img => {
          if (typeof img === 'string') return img;
          return img.url || img.srcUrl || img.imageUrl || null;
        }).filter(Boolean);
      } else if (prop.images && Array.isArray(prop.images)) {
        images = prop.images.map(img => {
          if (typeof img === 'string') return img;
          return img.url || img.srcUrl || img.imageUrl || null;
        }).filter(Boolean);
      } else if (prop.mainImage) {
        const mainImg = typeof prop.mainImage === 'string' 
          ? prop.mainImage 
          : prop.mainImage.url || prop.mainImage.srcUrl;
        if (mainImg) images.push(mainImg);
      }
      
      const addedOn = prop.addedOn || prop.firstVisibleDate || prop.listingUpdate?.listingUpdateDate || null;
      const distressData = this._detectDistress(description, distressKeywords);
      
      return {
        id,
        url,
        address,
        price,
        description,
        bedrooms,
        bathrooms,
        propertyType,
        images,
        addedOn,
        distressKeywordsMatched: distressData.matched,
        distressScoreRule: distressData.score,
        _site: 'rightmove'
      };
    } catch (error) {
      console.warn(`Error extracting property from JS data: ${error.message}`);
      return null;
    }
  }

  _parseHTML(html) {
    try {
      const $ = cheerio.load(html);
      
      const selectors = [
        '.propertyCard',
        '.property-card',
        '[data-test="property-card"]',
        '.l-searchResult',
        '.propertyCard-wrapper',
        'div.propertyCard',
        'article.propertyCard',
        'div[class^="propertyCard"]',
        'article[class^="propertyCard"]',
        '[class*="SearchResult"]',
        'div[id^="property-"]',
        '.searchResult',
        'div.l-searchResult'
      ];
      
      let propertyCards = null;
      
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          propertyCards = elements;
          break;
        }
      }
      
      if (!propertyCards || propertyCards.length === 0) {
        return { $, propertyCards: [], count: 0 };
      }
      
      return { $, propertyCards, count: propertyCards.length };
    } catch (error) {
      console.warn(`HTML parsing error: ${error.message}`);
      const $ = cheerio.load(html);
      return { $, propertyCards: [], count: 0 };
    }
  }

  _extractPropertyFromCard($, element, distressKeywords = []) {
    const url = this._extractUrl($, element);
    const address = this._extractAddress($, element);
    const price = this._extractPrice($, element);
    const description = this._extractDescription($, element);
    const addedOn = this._extractAddedOn($, element);
    const image = this._extractImage($, element);
    const distressData = this._detectDistress(description, distressKeywords);

    return {
      url,
      address,
      price,
      description,
      addedOn,
      image,
      distressKeywordsMatched: distressData.matched,
      distressScoreRule: distressData.score,
      _site: 'rightmove'
    };
  }

  _extractUrl($, element) {
    const selectors = [
      'a.propertyCard-link',
      'a[href*="/properties/"]',
      'a.propertyCard-priceLink',
      '.propertyCard-details a',
      'a[data-test="property-link"]'
    ];
    
    for (const selector of selectors) {
      const link = $(element).find(selector).first();
      if (link.length > 0) {
        let href = link.attr('href');
        if (href) {
          if (href.startsWith('/')) {
            href = `${this.config.baseUrl}${href}`;
          } else if (!href.startsWith('http')) {
            href = `${this.config.baseUrl}/${href}`;
          }
          return href;
        }
      }
    }
    return null;
  }

  _extractAddress($, element) {
    const selectors = [
      '.propertyCard-address',
      '.property-address',
      'address',
      '[data-test="property-address"]',
      '.propertyCard-title'
    ];
    
    for (const selector of selectors) {
      const addressElement = $(element).find(selector).first();
      if (addressElement.length > 0) {
        const address = addressElement.text().trim();
        if (address) return address;
      }
    }
    return null;
  }

  _extractPrice($, element) {
    const selectors = [
      '.propertyCard-priceValue',
      '.price',
      '.propertyCard-price',
      '[data-test="property-price"]',
      '.propertyCard-priceLink'
    ];
    
    for (const selector of selectors) {
      const priceElement = $(element).find(selector).first();
      if (priceElement.length > 0) {
        const price = priceElement.text().trim();
        if (price) return price;
      }
    }
    return null;
  }

  _extractDescription($, element) {
    const selectors = [
      '.propertyCard-description',
      '.property-description',
      '[data-test="property-description"]',
      '.propertyCard-details',
      'span.propertyCard-description'
    ];
    
    for (const selector of selectors) {
      const descElement = $(element).find(selector).first();
      if (descElement.length > 0) {
        const description = descElement.text().trim();
        if (description) return description;
      }
    }
    return null;
  }

  _extractAddedOn($, element) {
    const selectors = [
      '.propertyCard-contactsItem',
      '[data-test="property-added"]',
      '.propertyCard-branchSummary-addedOrReduced',
      '.propertyCard-contactsAddedOrReduced',
      'span[class*="added"]'
    ];
    
    for (const selector of selectors) {
      const dateElement = $(element).find(selector).first();
      if (dateElement.length > 0) {
        const dateText = dateElement.text().trim();
        if (dateText) return dateText;
      }
    }
    return null;
  }

  _extractImage($, element) {
    const selectors = [
      'img.propertyCard-img',
      '.property-image img',
      'img[class*="property"]',
      '[data-test="property-image"] img',
      '.propertyCard-image img'
    ];
    
    for (const selector of selectors) {
      const imgElement = $(element).find(selector).first();
      if (imgElement.length > 0) {
        const dataSrc = imgElement.attr('data-src');
        const dataLazySrc = imgElement.attr('data-lazy-src');
        const src = imgElement.attr('src');
        
        const imageUrl = dataSrc || dataLazySrc || src;
        
        if (imageUrl) {
          if (imageUrl.startsWith('/')) {
            return `${this.config.baseUrl}${imageUrl}`;
          } else if (!imageUrl.startsWith('http')) {
            return `${this.config.baseUrl}/${imageUrl}`;
          }
          return imageUrl;
        }
      }
    }
    return null;
  }

  _detectDistress(description, distressKeywords) {
    if (!description || typeof description !== 'string') {
      return { matched: [], score: 0 };
    }

    if (!distressKeywords || !Array.isArray(distressKeywords) || distressKeywords.length === 0) {
      return { matched: [], score: 0 };
    }

    const lowerDescription = description.toLowerCase();
    const matched = distressKeywords.filter(keyword => {
      if (!keyword || typeof keyword !== 'string') return false;
      return lowerDescription.includes(keyword.toLowerCase());
    });

    const score = Math.min(10, matched.length * 2);
    return { matched, score };
  }
}

module.exports = RightmoveAdapter;
