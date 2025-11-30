const { Actor } = require('apify');
const { PlaywrightCrawler } = require('crawlee');
const cheerio = require('cheerio');
const {
  extractPageModelAdaptive,
  findPropertyDataRecursive,
  discoverPropertyCardSelector,
  calculateConfidence
} = require('./adaptive-extraction');

/**
 * Creates and configures a PlaywrightCrawler instance
 * @param {Object} config - Configuration object
 * @param {number} config.maxItems - Maximum number of items to scrape
 * @param {Object} config.proxy - Proxy configuration
 * @param {boolean} config.proxy.useApifyProxy - Whether to use Apify proxy
 * @param {Array<string>} config.proxy.apifyProxyGroups - Apify proxy groups
 * @param {Function} config.requestHandler - Request handler function
 * @returns {Promise<PlaywrightCrawler>} Configured crawler instance
 */
async function createCrawler(config) {
  const { maxItems, proxy, requestHandler } = config;
  
  // Configure proxy if enabled
  let proxyConfiguration = null;
  if (proxy.useApifyProxy) {
    console.log('Configuring Apify proxy...');
    proxyConfiguration = await Actor.createProxyConfiguration({
      groups: proxy.apifyProxyGroups.length > 0 ? proxy.apifyProxyGroups : undefined
    });
    console.log('Apify proxy configured successfully');
  }
  
  // Build crawler configuration
  const crawlerConfig = {
    // Request handler for processing pages
    requestHandler,
    
    // Limit total requests based on maxItems
    maxRequestsPerCrawl: maxItems,
    
    // Set concurrency to 1 to avoid rate limiting
    maxConcurrency: 1,
    
    // Playwright launch options with anti-bot measures
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
      // Use realistic browser fingerprints
      useChrome: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    
    // Handle navigation timeouts gracefully
    navigationTimeoutSecs: 60,
    
    // Retry failed requests with exponential backoff
    maxRequestRetries: 3,
    
    // Add random delays between requests (1-3 seconds)
    requestHandlerTimeoutSecs: 180,
    
    // Pre-navigation hook to add random delays
    preNavigationHooks: [
      async ({ page, request }) => {
        // Random delay between 1-3 seconds
        const delay = Math.floor(Math.random() * 2000) + 1000;
        console.log(`Waiting ${delay}ms before navigation to avoid rate limiting...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Set realistic viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // Override navigator.webdriver to avoid detection
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false
          });
        });
      }
    ]
  };
  
  // Only add proxyConfiguration if it's not null
  if (proxyConfiguration) {
    crawlerConfig.proxyConfiguration = proxyConfiguration;
  }
  
  // Create PlaywrightCrawler with configuration
  const crawler = new PlaywrightCrawler(crawlerConfig);
  
  return crawler;
}

/**
 * Extracts window.PAGE_MODEL from a Playwright page
 * This is the primary method for extracting property data from Rightmove's JavaScript
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object|null>} The PAGE_MODEL object or null if not found
 */
async function extractPageModel(page) {
  try {
    console.log('Attempting to extract JavaScript data from page (adaptive mode)...');
    
    // Use adaptive extraction that tries multiple locations
    const jsData = await extractPageModelAdaptive(page);
    
    if (jsData) {
      // Try to find property data recursively
      const propertyData = findPropertyDataRecursive(jsData);
      if (propertyData) {
        console.log(`✓ Found property data with ${propertyData.length} properties`);
        // Wrap in expected format
        return { propertyData };
      }
      
      // Return raw data if no property array found (will be handled by extractFromPageModel)
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
 * Extracts property data from the PAGE_MODEL JavaScript object
 * Handles nested data structures and extracts all property fields
 * @param {Object} pageModel - The PAGE_MODEL object from window
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @returns {Array<Object>} Array of property objects
 */
function extractFromPageModel(pageModel, distressKeywords = []) {
  try {
    console.log('Parsing propertyData from PAGE_MODEL (adaptive mode)...');
    
    if (!pageModel) {
      console.log('No PAGE_MODEL provided');
      return [];
    }
    
    // ADAPTIVE: Use recursive discovery to find property data
    let propertyData = findPropertyDataRecursive(pageModel);
    
    // Fallback to manual checks if recursive search fails
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
    
    // Handle both single property and array of properties
    const properties = Array.isArray(propertyData) ? propertyData : [propertyData];
    
    console.log(`✓ Found ${properties.length} property/properties in JavaScript data`);
    
    // Extract each property
    const extractedProperties = properties.map(prop => {
      return extractPropertyFromJS(prop, distressKeywords);
    });
    
    return extractedProperties.filter(p => p !== null);
  } catch (error) {
    console.warn(`Error parsing propertyData from PAGE_MODEL: ${error.message}`);
    return [];
  }
}

/**
 * Extracts price history from property data
 * @param {Object} prop - Property data object from JavaScript
 * @returns {Array<Object>} Array of price history entries with date and price
 */
function extractPriceHistory(prop) {
  try {
    const priceHistory = [];
    
    if (prop.priceHistory && Array.isArray(prop.priceHistory)) {
      prop.priceHistory.forEach(entry => {
        // Skip invalid entries (null, undefined, non-objects)
        if (!entry || typeof entry !== 'object') {
          return;
        }
        
        // Only include entries with both date and price
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

/**
 * Extracts full property details (30+ fields) from JavaScript data object
 * This is the Phase 2 enhanced extraction for property detail pages
 * @param {Object} prop - Property data object from JavaScript (window.PAGE_MODEL.propertyData)
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @param {boolean} includePriceHistory - Whether to include price history
 * @returns {Object|null} Full property object with 30+ fields or null if extraction fails
 */
function extractFullPropertyDetails(prop, distressKeywords = [], includePriceHistory = false) {
  try {
    // Start with basic extraction
    const basicData = extractPropertyFromJS(prop, distressKeywords);
    if (!basicData) return null;
    
    // Extract additional Phase 2 fields
    
    // Display address (more detailed than basic address)
    const displayAddress = prop.displayAddress || 
                          prop.address?.displayAddress || 
                          basicData.address;
    
    // Country code
    const countryCode = prop.countryCode || 
                       prop.location?.countryCode || 
                       'GB';
    
    // Postcode components
    const outcode = prop.address?.outcode || null;
    const incode = prop.address?.incode || null;
    
    // Coordinates
    const coordinates = {
      latitude: prop.location?.latitude || prop.latitude || null,
      longitude: prop.location?.longitude || prop.longitude || null
    };
    
    // Tenure
    const tenure = prop.tenure || null;
    
    // Council tax band
    const councilTaxBand = prop.councilTaxBand || null;
    
    // Agent information
    const agent = prop.customer?.brandTradingName || 
                 prop.agent?.name || 
                 prop.contactInfo?.name || 
                 null;
    
    const agentPhone = prop.customer?.branchDisplayNumber || 
                      prop.agent?.phone || 
                      prop.contactInfo?.phone || 
                      null;
    
    const agentLogo = prop.customer?.brandPlusLogoUrl || 
                     prop.agent?.logo || 
                     null;
    
    const agentDisplayAddress = prop.customer?.branchAddress || 
                               prop.agent?.address || 
                               null;
    
    const agentProfileUrl = prop.customer?.branchUrl || 
                           prop.agent?.url || 
                           null;
    
    // Brochures
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
    
    // Floor plans
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
    
    // Nearest stations
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
    
    // Features/amenities
    const features = [];
    if (prop.keyFeatures && Array.isArray(prop.keyFeatures)) {
      features.push(...prop.keyFeatures);
    } else if (prop.features && Array.isArray(prop.features)) {
      features.push(...prop.features);
    }
    
    // Property status flags
    const published = prop.published !== false;
    const archived = prop.archived === true;
    const sold = prop.sold === true || prop.status === 'sold';
    
    // Dates
    const listingUpdateDate = prop.listingUpdate?.listingUpdateDate || 
                             prop.listingUpdateDate || 
                             null;
    
    const firstVisibleDate = prop.firstVisibleDate || 
                            prop.addedOn || 
                            basicData.addedOn;
    
    // Scraped timestamp
    const _scrapedAt = new Date().toISOString();
    
    // Price history (optional, can be slow)
    const priceHistory = includePriceHistory ? extractPriceHistory(prop) : [];
    
    // Build full property object
    return {
      // Phase 1 fields (basic)
      ...basicData,
      
      // Phase 2 additions (enhanced)
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
      _scrapedAt
    };
  } catch (error) {
    console.warn(`Error extracting full property details: ${error.message}`);
    return null;
  }
}

/**
 * Extracts a single property from JavaScript data object
 * Handles nested data structures and missing fields
 * @param {Object} prop - Property data object from JavaScript
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @returns {Object|null} Property object or null if extraction fails
 */
function extractPropertyFromJS(prop, distressKeywords = []) {
  try {
    // Extract ID (required for identification)
    const id = prop.id?.toString() || prop.propertyId?.toString() || null;
    
    // Extract URL
    let url = null;
    if (prop.propertyUrl) {
      url = prop.propertyUrl.startsWith('http') 
        ? prop.propertyUrl 
        : `https://www.rightmove.co.uk${prop.propertyUrl}`;
    } else if (id) {
      url = `https://www.rightmove.co.uk/properties/${id}`;
    }
    
    // Extract address (handle nested structure)
    const address = prop.displayAddress || 
                   prop.address?.displayAddress || 
                   prop.address || 
                   null;
    
    // Extract price (handle nested structure)
    const price = prop.price?.displayPrice || 
                 prop.price?.amount?.toString() || 
                 prop.displayPrice || 
                 prop.price?.toString() || 
                 null;
    
    // Extract description - try multiple possible field names
    const description = prop.summary || 
                       prop.description || 
                       prop.text || 
                       prop.propertyDescription ||
                       prop.displayAddress ||  // Fallback: use address for keyword matching
                       prop.propertySubType || 
                       null;
    
    // Debug: Log if description is missing (only for first property)
    if (!description && id && !extractPropertyFromJS._logged) {
      console.debug(`⚠️ Property ${id}: No description found. Available fields:`, Object.keys(prop).slice(0, 20).join(', '));
      extractPropertyFromJS._logged = true;
    }
    
    // Extract bedrooms
    const bedrooms = prop.bedrooms !== undefined ? prop.bedrooms : null;
    
    // Extract bathrooms
    const bathrooms = prop.bathrooms !== undefined ? prop.bathrooms : null;
    
    // Extract property type
    const propertyType = prop.propertyType || 
                        prop.propertySubType || 
                        prop.type || 
                        null;
    
    // Extract images (handle nested arrays)
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
    
    // Extract addedOn date
    const addedOn = prop.addedOn || 
                   prop.firstVisibleDate || 
                   prop.listingUpdate?.listingUpdateDate || 
                   null;
    
    // Detect distress keywords
    const distressData = detectDistress(description, distressKeywords);
    
    // Build property object with all fields
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
      distressScoreRule: distressData.score
    };
  } catch (error) {
    console.warn(`Error extracting property from JS data: ${error.message}`);
    return null;
  }
}

/**
 * Parses HTML content and extracts property card elements
 * @param {string} html - The HTML content to parse
 * @returns {Object} Object containing Cheerio instance and property card elements
 */
function parseHTML(html) {
  try {
    console.log('Parsing HTML content with Cheerio');
    
    // Load HTML into Cheerio
    const $ = cheerio.load(html);
    
    // Try multiple possible selectors for property cards
    // Rightmove's structure may vary, so we try common patterns
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
    let usedSelector = null;
    
    // Try each selector until we find property cards
    console.log('🔎 Trying selectors to find property cards...');
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`  Selector "${selector}": ${elements.length} elements`);
      if (elements.length > 0) {
        // Log the first few class names to help debug
        if (elements.length > 0 && elements.length < 100) {
          const firstClasses = [];
          elements.slice(0, 3).each((i, el) => {
            firstClasses.push($(el).attr('class'));
          });
          console.log(`    First element classes: ${firstClasses.join(' | ')}`);
        }
        propertyCards = elements;
        usedSelector = selector;
        break;
      }
    }
    
    // Handle case where no property cards are found
    if (!propertyCards || propertyCards.length === 0) {
      console.log('❌ No property cards found on page');
      console.log('📋 Tried selectors:', selectors.join(', '));
      console.log('📄 HTML preview (first 1000 chars):');
      console.log(html.substring(0, 1000));
      console.log('🔍 Looking for divs with "property" in class name...');
      const allDivs = $('div[class]');
      const propertyClasses = new Set();
      allDivs.each((i, el) => {
        const className = $(el).attr('class');
        if (className && className.toLowerCase().includes('property')) {
          propertyClasses.add(className);
        }
      });
      if (propertyClasses.size > 0) {
        console.log('Found classes with "property":', Array.from(propertyClasses).slice(0, 20).join(', '));
      } else {
        console.log('No classes containing "property" found');
      }
      return {
        $,
        propertyCards: [],
        count: 0
      };
    }
    
    console.log(`Found ${propertyCards.length} property cards using selector: ${usedSelector}`);
    
    return {
      $,
      propertyCards,
      count: propertyCards.length
    };
  } catch (error) {
    console.warn(`HTML parsing encountered issues but will continue: ${error.message}`);
    // Return empty result on parsing error
    const $ = cheerio.load(html);
    return {
      $,
      propertyCards: [],
      count: 0
    };
  }
}

/**
 * Extracts the property URL from a property card element
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Property card element
 * @returns {string|null} The property URL or null if not found
 */
function extractUrl($, element) {
  try {
    // Try multiple possible selectors for property links
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
          // Handle relative URLs by converting to absolute
          if (href.startsWith('/')) {
            href = `https://www.rightmove.co.uk${href}`;
          } else if (!href.startsWith('http')) {
            href = `https://www.rightmove.co.uk/${href}`;
          }
          return href;
        }
      }
    }
    
    console.debug('Property URL not found for element');
    return null;
  } catch (error) {
    console.debug(`Error extracting URL: ${error.message}`);
    return null;
  }
}

/**
 * Extracts the property address from a property card element
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Property card element
 * @returns {string|null} The property address or null if not found
 */
function extractAddress($, element) {
  try {
    // Try multiple possible selectors for address
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
        if (address) {
          return address;
        }
      }
    }
    
    console.debug('Property address not found for element');
    return null;
  } catch (error) {
    console.debug(`Error extracting address: ${error.message}`);
    return null;
  }
}

/**
 * Extracts the property price from a property card element
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Property card element
 * @returns {string|null} The property price or null if not found
 */
function extractPrice($, element) {
  try {
    // Try multiple possible selectors for price
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
        if (price) {
          return price;
        }
      }
    }
    
    console.debug('Property price not found for element');
    return null;
  } catch (error) {
    console.debug(`Error extracting price: ${error.message}`);
    return null;
  }
}

/**
 * Extracts the property description from a property card element
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Property card element
 * @returns {string|null} The property description or null if not found
 */
function extractDescription($, element) {
  try {
    // Try multiple possible selectors for description
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
        if (description) {
          return description;
        }
      }
    }
    
    console.debug('Property description not found for element');
    return null;
  } catch (error) {
    console.debug(`Error extracting description: ${error.message}`);
    return null;
  }
}

/**
 * Extracts the "added on" date from a property card element
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Property card element
 * @returns {string|null} The added on date or null if not found
 */
function extractAddedOn($, element) {
  try {
    // Try multiple possible selectors for added date
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
        if (dateText) {
          return dateText;
        }
      }
    }
    
    console.debug('Property added date not found for element');
    return null;
  } catch (error) {
    console.debug(`Error extracting added date: ${error.message}`);
    return null;
  }
}

/**
 * Extracts the property image URL from a property card element
 * Handles lazy-loaded images by checking multiple attributes
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Property card element
 * @returns {string|null} The image URL or null if not found
 */
function extractImage($, element) {
  try {
    // Try multiple possible selectors for images
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
        // Check multiple attributes for lazy-loaded images
        // Priority: data-src, data-lazy-src, src
        const dataSrc = imgElement.attr('data-src');
        const dataLazySrc = imgElement.attr('data-lazy-src');
        const src = imgElement.attr('src');
        
        const imageUrl = dataSrc || dataLazySrc || src;
        
        if (imageUrl) {
          // Handle relative URLs
          if (imageUrl.startsWith('/')) {
            return `https://www.rightmove.co.uk${imageUrl}`;
          } else if (!imageUrl.startsWith('http')) {
            return `https://www.rightmove.co.uk/${imageUrl}`;
          }
          return imageUrl;
        }
      }
    }
    
    console.debug('Property image not found for element');
    return null;
  } catch (error) {
    console.debug(`Error extracting image: ${error.message}`);
    return null;
  }
}

/**
 * Detects distress keywords in a property description
 * Performs case-insensitive keyword matching and calculates a distress score
 * @param {string|null} description - The property description text
 * @param {Array<string>} distressKeywords - Array of keywords to search for
 * @returns {Object} Object containing matched keywords array and calculated score
 */
function detectDistress(description, distressKeywords) {
  // Handle null or empty description
  if (!description || typeof description !== 'string') {
    return {
      matched: [],
      score: 0
    };
  }

  // Handle invalid or empty keywords array
  if (!distressKeywords || !Array.isArray(distressKeywords) || distressKeywords.length === 0) {
    return {
      matched: [],
      score: 0
    };
  }

  // Convert description to lowercase for case-insensitive matching
  const lowerDescription = description.toLowerCase();

  // Find all matching keywords (case-insensitive)
  const matched = distressKeywords.filter(keyword => {
    if (!keyword || typeof keyword !== 'string') {
      return false;
    }
    return lowerDescription.includes(keyword.toLowerCase());
  });

  // Calculate score: 2 points per keyword, max 10
  const score = Math.min(10, matched.length * 2);

  return {
    matched,
    score
  };
}

/**
 * Extracts all property data from a property card element
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Property card element
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @returns {Object} Property object with all fields including distress detection
 */
function extractProperty($, element, distressKeywords = []) {
  const description = extractDescription($, element);
  const distressData = detectDistress(description, distressKeywords);

  return {
    url: extractUrl($, element),
    address: extractAddress($, element),
    price: extractPrice($, element),
    description: description,
    addedOn: extractAddedOn($, element),
    image: extractImage($, element),
    distressKeywordsMatched: distressData.matched,
    distressScoreRule: distressData.score
  };
}

/**
 * Extracts property data from DOM when JavaScript data is unavailable
 * This is the fallback method when window.PAGE_MODEL extraction fails
 * @param {Object} page - Playwright page object
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @returns {Promise<Array<Object>>} Array of property objects extracted from DOM
 */
async function extractFromDOM(page, distressKeywords = []) {
  try {
    console.log('Extracting property data from DOM (adaptive mode)...');
    
    // ADAPTIVE: Try to discover the selector dynamically
    const discoveredSelector = await discoverPropertyCardSelector(page);
    
    // Get page HTML content
    const html = await page.content();
    const $ = cheerio.load(html);
    
    let propertyCards = null;
    let count = 0;
    
    // Try discovered selector first
    if (discoveredSelector) {
      console.log(`Trying discovered selector: ${discoveredSelector}`);
      propertyCards = $(discoveredSelector);
      count = propertyCards.length;
      
      if (count > 0) {
        console.log(`✓ Discovered selector found ${count} elements`);
      }
    }
    
    // Fallback to parseHTML if discovery failed
    if (count === 0) {
      console.log('Falling back to predefined selectors...');
      const result = parseHTML(html);
      propertyCards = result.propertyCards;
      count = result.count;
    }
    
    // Handle case where no property cards are found
    if (count === 0) {
      console.log('✗ No property cards found in DOM');
      return [];
    }
    
    console.log(`Found ${count} property card(s) in DOM`);
    
    // Extract properties from each card
    const properties = [];
    propertyCards.each((index, element) => {
      const property = extractProperty($, element, distressKeywords);
      properties.push(property);
    });
    
    // Calculate confidence
    const confidence = calculateConfidence(properties);
    console.log(`✓ DOM extraction successful: ${properties.length} properties (confidence: ${confidence}%)`);
    
    // Only return if confidence is acceptable
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
 * Validates the input object according to Actor Specification 1
 * @param {Object} input - The input object from Actor.getInput()
 * @throws {Error} If listUrls field is missing or invalid
 */
function validateInput(input) {
  if (!input) {
    throw new Error('Input validation failed: No input provided. Please provide an input object with a "startUrls" or "propertyUrls" field.');
  }
  
  // Support both startUrls (Apify standard) and listUrls (backward compatibility)
  const urls = input.startUrls || input.listUrls;
  const fieldName = input.startUrls ? 'startUrls' : 'listUrls';
  
  // Phase 2: Also support propertyUrls
  const propertyUrls = input.propertyUrls;
  
  // At least one of startUrls or propertyUrls must be provided
  if (!urls && !propertyUrls) {
    throw new Error(`Input validation failed: Either "${fieldName}" or "propertyUrls" field is required. Please provide at least one array of URL objects.`);
  }
  
  // Validate startUrls/listUrls if provided
  if (urls) {
    // Validate URLs is an array
    if (!Array.isArray(urls)) {
      throw new Error(`Input validation failed: "${fieldName}" must be an array, but received type: ${typeof urls}`);
    }
    
    // Validate URLs is not empty
    if (urls.length === 0 && (!propertyUrls || propertyUrls.length === 0)) {
      throw new Error(`Input validation failed: "${fieldName}" array cannot be empty unless "propertyUrls" is provided. Please provide at least one URL object.`);
    }
    
    // Validate each URL object in the array
    urls.forEach((urlObj, index) => {
      if (!urlObj || typeof urlObj !== 'object') {
        throw new Error(`Input validation failed: ${fieldName}[${index}] must be an object with a "url" property.`);
      }
      
      if (!urlObj.url || typeof urlObj.url !== 'string' || urlObj.url.trim() === '') {
        throw new Error(`Input validation failed: ${fieldName}[${index}].url must be a non-empty string.`);
      }
    });
  }
  
  // Phase 2: Validate propertyUrls if provided
  if (propertyUrls) {
    if (!Array.isArray(propertyUrls)) {
      throw new Error(`Input validation failed: "propertyUrls" must be an array, but received type: ${typeof propertyUrls}`);
    }
    
    propertyUrls.forEach((urlObj, index) => {
      if (!urlObj || typeof urlObj !== 'object') {
        throw new Error(`Input validation failed: propertyUrls[${index}] must be an object with a "url" property.`);
      }
      
      if (!urlObj.url || typeof urlObj.url !== 'string' || urlObj.url.trim() === '') {
        throw new Error(`Input validation failed: propertyUrls[${index}].url must be a non-empty string.`);
      }
    });
  }
  
  // Validate maxItems if provided (optional integer)
  if (input.maxItems !== undefined) {
    if (typeof input.maxItems !== 'number' || !Number.isInteger(input.maxItems) || input.maxItems < 1) {
      throw new Error(`Input validation failed: "maxItems" must be a positive integer, but received: ${input.maxItems}`);
    }
  }
  
  // Validate maxPages if provided (optional integer)
  if (input.maxPages !== undefined) {
    if (typeof input.maxPages !== 'number' || !Number.isInteger(input.maxPages) || input.maxPages < 1) {
      throw new Error(`Input validation failed: "maxPages" must be a positive integer, but received: ${input.maxPages}`);
    }
  }
  
  // Validate proxy/proxyConfiguration if provided (optional object)
  const proxyConfig = input.proxyConfiguration || input.proxy;
  if (proxyConfig !== undefined) {
    if (!proxyConfig || typeof proxyConfig !== 'object' || Array.isArray(proxyConfig)) {
      throw new Error(`Input validation failed: "proxyConfiguration" must be an object, but received type: ${typeof proxyConfig}`);
    }
    
    if (proxyConfig.useApifyProxy !== undefined && typeof proxyConfig.useApifyProxy !== 'boolean') {
      throw new Error(`Input validation failed: "proxyConfiguration.useApifyProxy" must be a boolean, but received type: ${typeof proxyConfig.useApifyProxy}`);
    }
  }
  
  // Validate distressKeywords if provided (optional array of strings)
  if (input.distressKeywords !== undefined) {
    if (!Array.isArray(input.distressKeywords)) {
      throw new Error(`Input validation failed: "distressKeywords" must be an array, but received type: ${typeof input.distressKeywords}`);
    }
    
    input.distressKeywords.forEach((keyword, index) => {
      if (typeof keyword !== 'string') {
        throw new Error(`Input validation failed: distressKeywords[${index}] must be a string, but received type: ${typeof keyword}`);
      }
    });
  }
  
  // Phase 2: Validate boolean fields
  const booleanFields = ['fullPropertyDetails', 'monitoringMode', 'enableDelistingTracker', 'addEmptyTrackerRecord', 'includePriceHistory'];
  booleanFields.forEach(field => {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') {
      throw new Error(`Input validation failed: "${field}" must be a boolean, but received type: ${typeof input[field]}`);
    }
  });
}

/**
 * Processes input with default values according to Actor Specification 1
 * @param {Object} input - The raw input object (already validated)
 * @returns {Object} Processed input with defaults applied
 */
function processInput(input) {
  // Extract URLs from startUrls or listUrls array of objects (support both)
  const urlArray = input.startUrls || input.listUrls;
  const urls = urlArray ? urlArray.map(urlObj => urlObj.url) : [];
  
  // Phase 2: Extract property URLs (direct property page URLs)
  const propertyUrlArray = input.propertyUrls || [];
  const propertyUrls = propertyUrlArray.map(urlObj => urlObj.url);
  
  // Apply default value for maxItems (default: 200)
  const maxItems = input.maxItems !== undefined && typeof input.maxItems === 'number' && input.maxItems > 0
    ? input.maxItems
    : 200;

  // Apply default value for maxPages (default: 5)
  const maxPages = input.maxPages !== undefined && typeof input.maxPages === 'number' && input.maxPages > 0
    ? input.maxPages
    : 5;

  // Process proxy configuration object (default: useApifyProxy = false)
  // Support both proxyConfiguration (Apify standard) and proxy (backward compatibility)
  const proxyConfig = input.proxyConfiguration || input.proxy || {};
  const proxy = {
    useApifyProxy: proxyConfig.useApifyProxy === true,
    apifyProxyGroups: proxyConfig.apifyProxyGroups || []
  };

  // Apply default value for distressKeywords
  const distressKeywords = input.distressKeywords && Array.isArray(input.distressKeywords) && input.distressKeywords.length > 0
    ? input.distressKeywords
    : ['reduced', 'chain free', 'auction', 'motivated', 'cash buyers', 'needs renovation'];

  // Phase 2: Apply default values for enhanced features
  const fullPropertyDetails = input.fullPropertyDetails !== false; // Default: true
  const monitoringMode = input.monitoringMode === true; // Default: false
  const enableDelistingTracker = input.enableDelistingTracker === true; // Default: false
  const addEmptyTrackerRecord = input.addEmptyTrackerRecord === true; // Default: false
  const includePriceHistory = input.includePriceHistory === true; // Default: false

  return {
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
    includePriceHistory
  };
}

/**
 * Builds a paginated URL for Rightmove search results
 * Rightmove uses an 'index' query parameter where each page shows 24 properties
 * Page 1: index=0 (or no index parameter)
 * Page 2: index=24
 * Page 3: index=48, etc.
 * @param {string} baseUrl - The base Rightmove search URL
 * @param {number} pageIndex - Zero-based page index (0 for first page, 1 for second, etc.)
 * @returns {string} The paginated URL
 */
function buildPageUrl(baseUrl, pageIndex) {
  // First page doesn't need index parameter
  if (pageIndex === 0) {
    return baseUrl;
  }

  try {
    // Parse the URL
    const url = new URL(baseUrl);
    
    // Rightmove shows 24 properties per page
    // Calculate the index parameter: pageIndex * 24
    const indexValue = pageIndex * 24;
    
    // Set or update the index parameter
    url.searchParams.set('index', indexValue.toString());
    
    return url.toString();
  } catch (error) {
    console.error(`Error building page URL for page ${pageIndex + 1}: ${error.message}`);
    console.error(`Base URL: ${baseUrl}`);
    console.error(`Falling back to base URL without pagination`);
    // If URL parsing fails, return the base URL
    return baseUrl;
  }
}

/**
 * Scrapes a single property detail page
 * @param {string} url - The property detail page URL
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @param {Object} proxy - Proxy configuration object
 * @param {boolean} fullPropertyDetails - Whether to extract full details (30+ fields)
 * @param {boolean} includePriceHistory - Whether to include price history
 * @returns {Promise<Object|null>} Property object or null if extraction fails
 */
async function scrapePropertyDetail(url, distressKeywords = [], proxy = { useApifyProxy: false }, fullPropertyDetails = true, includePriceHistory = false) {
  try {
    console.log(`Scraping property detail: ${url}`);
    
    // Create a simple crawler for single page
    const requestHandler = async ({ page }) => {
      // Wait for JavaScript content to load
      try {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
      } catch (error) {
        console.warn(`Network idle timeout, continuing anyway: ${error.message}`);
      }
      
      // Extract property data from JavaScript
      const pageModel = await extractPageModel(page);
      
      if (!pageModel) {
        console.warn(`No JavaScript data found for property: ${url}`);
        return null;
      }
      
      // Extract property details
      let property = null;
      
      if (fullPropertyDetails) {
        // Extract full details (30+ fields)
        const propertyData = pageModel.propertyData || pageModel;
        property = extractFullPropertyDetails(propertyData, distressKeywords, includePriceHistory);
      } else {
        // Extract basic details only
        const properties = extractFromPageModel(pageModel, distressKeywords);
        property = properties.length > 0 ? properties[0] : null;
      }
      
      return property;
    };
    
    // Create crawler
    const crawler = await createCrawler({
      maxItems: 1,
      proxy,
      requestHandler
    });
    
    // Store the result
    let result = null;
    
    // Override the request handler to capture the result
    const originalHandler = crawler.requestHandler;
    crawler.requestHandler = async (context) => {
      result = await originalHandler(context);
    };
    
    // Add the URL and run
    await crawler.addRequests([url]);
    await crawler.run();
    
    return result;
  } catch (error) {
    console.error(`Error scraping property detail ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Scrapes multiple property detail pages
 * @param {Array<string>} urls - Array of property detail page URLs
 * @param {number} maxItems - Maximum number of properties to extract
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @param {Object} proxy - Proxy configuration object
 * @param {boolean} fullPropertyDetails - Whether to extract full details (30+ fields)
 * @param {boolean} includePriceHistory - Whether to include price history
 * @returns {Promise<Array<Object>>} Array of property objects
 */
async function scrapePropertyUrls(urls, maxItems, distressKeywords = [], proxy = { useApifyProxy: false }, fullPropertyDetails = true, includePriceHistory = false) {
  const properties = [];
  
  console.log(`\n=== Scraping ${urls.length} Property URLs ===`);
  
  for (let i = 0; i < urls.length && properties.length < maxItems; i++) {
    const url = urls[i];
    console.log(`Processing property ${i + 1}/${urls.length}: ${url}`);
    
    const property = await scrapePropertyDetail(url, distressKeywords, proxy, fullPropertyDetails, includePriceHistory);
    
    if (property) {
      properties.push(property);
      console.log(`✓ Extracted property ${property.id || 'unknown'}`);
    } else {
      console.warn(`✗ Failed to extract property from ${url}`);
    }
    
    // Check if we've reached maxItems
    if (properties.length >= maxItems) {
      console.log(`Reached maxItems limit (${maxItems}), stopping`);
      break;
    }
  }
  
  console.log(`Extracted ${properties.length} properties from property URLs`);
  console.log('=====================================');
  
  return properties;
}

/**
 * Scrapes properties from a Rightmove URL with pagination support using Crawlee
 * @param {string} url - The Rightmove URL to scrape
 * @param {number} maxItems - Maximum number of properties to extract across all pages
 * @param {number} maxPages - Maximum number of pages to process
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @param {Object} proxy - Proxy configuration object
 * @returns {Promise<Object>} Object containing properties array and pagesProcessed count
 */
async function scrapeProperties(url, maxItems, maxPages = 1, distressKeywords = [], proxy = { useApifyProxy: false }) {
  const allProperties = [];
  let pagesProcessed = 0;
  let itemsExtracted = 0;

  try {
    console.log(`Starting pagination: will process up to ${maxPages} page(s) and extract up to ${maxItems} item(s)`);
    
    // Create request handler for Crawlee
    const requestHandler = async ({ page, request }) => {
      console.log(`Processing page: ${request.url}`);
      
      // Wait for JavaScript content to load
      try {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
      } catch (error) {
        console.warn(`Network idle timeout, continuing anyway: ${error.message}`);
      }
      
      // Calculate how many more properties we can extract
      const remainingSlots = maxItems - itemsExtracted;
      
      // Extract properties from this page
      let pageProperties = [];
      
      // PRIMARY METHOD: Try to extract from JavaScript data (adaptive)
      console.log('Attempting JavaScript data extraction (adaptive mode)...');
      const pageModel = await extractPageModel(page);
      
      if (pageModel) {
        pageProperties = extractFromPageModel(pageModel, distressKeywords);
        if (pageProperties.length > 0) {
          const jsConfidence = calculateConfidence(pageProperties);
          console.log(`✓ JavaScript extraction successful: ${pageProperties.length} properties (confidence: ${jsConfidence}%)`);
        }
      }
      
      // FALLBACK METHOD: If JavaScript extraction fails or returns no data, fall back to DOM parsing
      if (pageProperties.length === 0) {
        console.log('JavaScript extraction yielded no results, falling back to DOM parsing (adaptive mode)...');
        pageProperties = await extractFromDOM(page, distressKeywords);
        
        // Stop early if no properties found on this page
        if (pageProperties.length === 0) {
          console.log(`✗ No properties found on this page, stopping pagination`);
          return;
        }
      }
      
      // Limit to remaining slots
      const propertiesToAdd = pageProperties.slice(0, remainingSlots);
      
      // Add properties from this page to the aggregate
      allProperties.push(...propertiesToAdd);
      itemsExtracted += propertiesToAdd.length;
      pagesProcessed++;
      
      console.log(`Extracted ${propertiesToAdd.length} property/properties from this page (total so far: ${itemsExtracted}/${maxItems})`);
    };
    
    // Create crawler with configuration
    const crawler = await createCrawler({
      maxItems,
      proxy,
      requestHandler
    });
    
    // Build URLs for all pages up to maxPages
    const urls = [];
    for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
      const pageUrl = buildPageUrl(url, pageIndex);
      urls.push(pageUrl);
    }
    
    console.log(`Queuing ${urls.length} page(s) for crawling`);
    
    // Add URLs to crawler queue
    await crawler.addRequests(urls);
    
    // Run the crawler
    await crawler.run();
    
    console.log(`Pagination complete: extracted ${allProperties.length} properties from ${pagesProcessed} page(s)`);
    
    return {
      properties: allProperties,
      pagesProcessed
    };
  } catch (error) {
    console.error(`Error during scraping (processed ${pagesProcessed} pages, extracted ${allProperties.length} properties before failure)`);
    console.error(`Error details: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    throw error;
  }
}

/**
 * Deduplicates properties by ID
 * @param {Array<Object>} properties - Array of property objects
 * @returns {Array<Object>} Deduplicated array of properties
 */
function deduplicateProperties(properties) {
  const seen = new Set();
  const deduplicated = [];
  let duplicateCount = 0;
  
  properties.forEach(property => {
    const id = property.id?.toString();
    
    // If no ID, keep the property (can't deduplicate without ID)
    if (!id) {
      deduplicated.push(property);
      return;
    }
    
    // If we've seen this ID before, skip it
    if (seen.has(id)) {
      duplicateCount++;
      return;
    }
    
    // Add to seen set and deduplicated array
    seen.add(id);
    deduplicated.push(property);
  });
  
  if (duplicateCount > 0) {
    console.log(`Removed ${duplicateCount} duplicate properties`);
  }
  
  return deduplicated;
}

/**
 * Initializes the delisting tracker using Key-Value store
 * @returns {Promise<Object>} Tracker object with updateProperty method
 */
async function initializeDelistingTracker() {
  try {
    console.log('Initializing delisting tracker...');
    
    // Open or create the Key-Value store
    const store = await Actor.openKeyValueStore('rightmove-properties');
    console.log('Delisting tracker initialized successfully');
    
    return {
      /**
       * Updates the lastSeen timestamp for a property
       * @param {string} propertyId - The property ID
       */
      async updateProperty(propertyId) {
        try {
          if (!propertyId) return;
          
          await store.setValue(propertyId, {
            lastSeen: new Date().toISOString(),
            propertyId: propertyId
          });
        } catch (error) {
          console.warn(`Error updating property ${propertyId} in tracker: ${error.message}`);
        }
      },
      
      /**
       * Gets the lastSeen timestamp for a property
       * @param {string} propertyId - The property ID
       * @returns {Promise<Object|null>} Property record or null
       */
      async getProperty(propertyId) {
        try {
          if (!propertyId) return null;
          return await store.getValue(propertyId);
        } catch (error) {
          console.warn(`Error getting property ${propertyId} from tracker: ${error.message}`);
          return null;
        }
      }
    };
  } catch (error) {
    console.error(`Error initializing delisting tracker: ${error.message}`);
    console.warn('Delisting tracker disabled due to initialization error');
    
    // Return a no-op tracker
    return {
      async updateProperty() {},
      async getProperty() { return null; }
    };
  }
}

/**
 * Loads property IDs from the previous actor run for monitoring mode
 * @returns {Promise<Set<string>>} Set of property IDs from previous run
 */
async function loadPreviousPropertyIds() {
  try {
    console.log('Loading previous run data for monitoring mode...');
    
    // Get the Apify client
    const client = Actor.apifyClient;
    
    // Get the current actor run ID
    const actorRunId = process.env.APIFY_ACTOR_RUN_ID;
    if (!actorRunId) {
      console.log('No actor run ID found, cannot load previous run');
      return new Set();
    }
    
    // Get the current run to find the actor ID
    const currentRun = await client.run(actorRunId).get();
    const actorId = currentRun.actId;
    
    if (!actorId) {
      console.log('No actor ID found, cannot load previous run');
      return new Set();
    }
    
    // Get the last 10 runs for this actor
    const runsClient = client.actor(actorId).runs();
    const runsList = await runsClient.list({ limit: 10, desc: true });
    
    if (!runsList || !runsList.items || runsList.items.length < 2) {
      console.log('No previous run found (this might be the first run)');
      return new Set();
    }
    
    // Get the second most recent run (the one before current)
    const previousRun = runsList.items[1];
    console.log(`Found previous run: ${previousRun.id} (finished: ${previousRun.finishedAt})`);
    
    // Get the dataset from the previous run
    const datasetId = previousRun.defaultDatasetId;
    if (!datasetId) {
      console.log('Previous run has no dataset');
      return new Set();
    }
    
    // Load all items from the previous dataset
    const dataset = client.dataset(datasetId);
    const { items } = await dataset.listItems({ limit: 100000 });
    
    // Extract property IDs
    const propertyIds = new Set();
    items.forEach(item => {
      if (item.id) {
        propertyIds.add(item.id.toString());
      }
    });
    
    console.log(`Loaded ${propertyIds.size} property IDs from previous run`);
    return propertyIds;
  } catch (error) {
    console.warn(`Error loading previous run data: ${error.message}`);
    console.warn('Continuing without monitoring mode filtering');
    return new Set();
  }
}

/**
 * Main actor entry point
 */
async function main() {
  await Actor.init();

  try {
    // Read input
    console.log('Reading actor input...');
    const rawInput = await Actor.getInput();
    
    // Validate input
    console.log('Validating input...');
    validateInput(rawInput);
    
    // Process input with defaults
    const input = processInput(rawInput);
    
    // Log input configuration at startup
    console.log('=== Actor Configuration ===');
    console.log(`Search URLs: ${input.urls.length}`);
    input.urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
    console.log(`Property URLs: ${input.propertyUrls.length}`);
    input.propertyUrls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
    console.log(`Max items: ${input.maxItems}`);
    console.log(`Max pages per search URL: ${input.maxPages}`);
    const proxyConfig = input.proxyConfiguration || input.proxy || {};
    console.log(`Use Apify proxy: ${proxyConfig.useApifyProxy || false}`);
    if (proxyConfig.apifyProxyGroups && proxyConfig.apifyProxyGroups.length > 0) {
      console.log(`Proxy groups: [${proxyConfig.apifyProxyGroups.join(', ')}]`);
    }
    console.log(`Distress keywords: [${input.distressKeywords.join(', ')}]`);
    console.log('--- Phase 2 Features ---');
    console.log(`Full property details: ${input.fullPropertyDetails}`);
    console.log(`Monitoring mode: ${input.monitoringMode}`);
    console.log(`Delisting tracker: ${input.enableDelistingTracker}`);
    console.log(`Include price history: ${input.includePriceHistory}`);
    console.log('===========================');
    
    // Phase 2: Initialize monitoring mode
    let previousPropertyIds = new Set();
    if (input.monitoringMode) {
      console.log('\n=== Monitoring Mode Enabled ===');
      previousPropertyIds = await loadPreviousPropertyIds();
      console.log(`Will filter out ${previousPropertyIds.size} previously seen properties`);
      console.log('===============================');
    }
    
    // Phase 2: Initialize delisting tracker
    let delistingTracker = null;
    if (input.enableDelistingTracker) {
      console.log('\n=== Delisting Tracker Enabled ===');
      delistingTracker = await initializeDelistingTracker();
      console.log('=================================');
    }
    
    // Scrape properties from all URLs
    const allProperties = [];
    let totalPagesProcessed = 0;
    
    // Process search URLs (if any)
    if (input.urls.length > 0) {
      console.log(`\n=== Processing ${input.urls.length} Search URLs ===`);
      
      for (let i = 0; i < input.urls.length; i++) {
        const url = input.urls[i];
        console.log(`\n=== Processing Search URL ${i + 1}/${input.urls.length} ===`);
        console.log(`URL: ${url}`);
        
        const proxyConfig = input.proxyConfiguration || input.proxy || { useApifyProxy: false, apifyProxyGroups: [] };
        const result = await scrapeProperties(url, input.maxItems, input.maxPages, input.distressKeywords, proxyConfig);
        
        allProperties.push(...result.properties);
        totalPagesProcessed += result.pagesProcessed;
        
        console.log(`Extracted ${result.properties.length} properties from ${result.pagesProcessed} page(s) for this URL`);
      }
    }
    
    // Phase 2: Process property URLs (if any)
    if (input.propertyUrls.length > 0) {
      console.log(`\n=== Processing ${input.propertyUrls.length} Property URLs ===`);
      
      const proxyConfig = input.proxyConfiguration || input.proxy || { useApifyProxy: false, apifyProxyGroups: [] };
      const remainingSlots = input.maxItems - allProperties.length;
      
      const propertyUrlProperties = await scrapePropertyUrls(
        input.propertyUrls,
        remainingSlots,
        input.distressKeywords,
        proxyConfig,
        input.fullPropertyDetails,
        input.includePriceHistory
      );
      
      allProperties.push(...propertyUrlProperties);
      console.log(`Extracted ${propertyUrlProperties.length} properties from property URLs`);
    }
    
    // Phase 2: Deduplicate properties by ID
    console.log(`\n=== Deduplication ===`);
    console.log(`Properties before deduplication: ${allProperties.length}`);
    const deduplicatedProperties = deduplicateProperties(allProperties);
    console.log(`Properties after deduplication: ${deduplicatedProperties.length}`);
    console.log('=====================');
    
    // Phase 2: Apply monitoring mode filtering
    let monitoredProperties = deduplicatedProperties;
    if (input.monitoringMode && previousPropertyIds.size > 0) {
      console.log(`\n=== Monitoring Mode Filtering ===`);
      console.log(`Properties before filtering: ${deduplicatedProperties.length}`);
      
      monitoredProperties = deduplicatedProperties.map(property => {
        const id = property.id?.toString();
        const isNew = !id || !previousPropertyIds.has(id);
        
        return {
          ...property,
          _isNew: isNew
        };
      }).filter(p => p._isNew);
      
      console.log(`New properties found: ${monitoredProperties.length}`);
      console.log(`Previously seen properties filtered: ${deduplicatedProperties.length - monitoredProperties.length}`);
      console.log('=================================');
    }
    
    // Phase 2: Update delisting tracker
    if (delistingTracker && input.enableDelistingTracker) {
      console.log(`\n=== Updating Delisting Tracker ===`);
      let updateCount = 0;
      
      for (const property of monitoredProperties) {
        if (property.id) {
          await delistingTracker.updateProperty(property.id.toString());
          updateCount++;
        }
      }
      
      console.log(`Updated ${updateCount} properties in delisting tracker`);
      console.log('==================================');
    }
    
    // Filter to only include properties with distress signals (if enabled)
    const onlyDistressed = input.onlyDistressed !== false; // Default to true
    let finalProperties = monitoredProperties;
    let filteredCount = 0;
    
    if (onlyDistressed) {
      const propertiesWithDistress = monitoredProperties.filter(p => p.distressScoreRule > 0);
      filteredCount = monitoredProperties.length - propertiesWithDistress.length;
      finalProperties = propertiesWithDistress;
      
      if (filteredCount > 0) {
        console.log(`\n🔍 Filtered out ${filteredCount} properties with no distress signals`);
        console.log(`📊 Keeping ${finalProperties.length} properties with distress signals`);
      }
    }
    
    // Push results to Apify dataset
    console.log('\nSaving results to dataset...');
    await Actor.pushData(finalProperties);
    
    // Log final summary
    console.log('\n=== Final Scraping Summary ===');
    console.log(`Total URLs processed: ${input.urls.length}`);
    console.log(`Total pages processed: ${totalPagesProcessed}`);
    console.log(`Total items found: ${allProperties.length}`);
    console.log(`Items with distress signals: ${allProperties.filter(p => p.distressScoreRule > 0).length}`);
    if (onlyDistressed && filteredCount > 0) {
      console.log(`Items filtered out: ${filteredCount}`);
    }
    console.log(`Final dataset size: ${finalProperties.length}`);
    console.log('==============================');
    
    await Actor.exit();
  } catch (error) {
    console.error('=== Actor Failed ===');
    console.error(`Error: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    console.error('====================');
    throw error;
  }
}

// Export functions for testing
module.exports = {
  main,
  validateInput,
  processInput,
  createCrawler,
  parseHTML,
  scrapeProperties,
  buildPageUrl,
  extractProperty,
  extractUrl,
  extractAddress,
  extractPrice,
  extractDescription,
  extractAddedOn,
  extractImage,
  detectDistress,
  extractPageModel,
  extractFromPageModel,
  extractPropertyFromJS,
  extractFromDOM,
  // Phase 2 functions
  deduplicateProperties,
  initializeDelistingTracker,
  loadPreviousPropertyIds,
  extractFullPropertyDetails,
  extractPriceHistory,
  scrapePropertyDetail,
  scrapePropertyUrls
};

// Run the actor if this file is executed directly
if (require.main === module) {
  main();
}
