const { Actor } = require('apify');
const cheerio = require('cheerio');

/**
 * Fetches HTML content from a URL
 * @param {string} url - The URL to fetch
 * @param {boolean} useProxy - Whether to use Apify proxy for the request
 * @returns {Promise<string>} The HTML content
 * @throws {Error} If the request fails
 */
async function fetchPage(url, useProxy = false) {
  try {
    console.log(`Fetching page: ${url}${useProxy ? ' (using proxy)' : ''}`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    // Configure proxy if enabled
    if (useProxy) {
      const proxyConfiguration = await Actor.createProxyConfiguration();
      const proxyUrl = await proxyConfiguration.newUrl();
      // For fetch API, we need to use an agent with proxy
      const { HttpsProxyAgent } = require('https-proxy-agent');
      options.agent = new HttpsProxyAgent(proxyUrl);
      console.log('Using Apify proxy for request');
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const body = await response.text();
    console.log(`Successfully fetched page (status: ${response.status})`);
    return body;
  } catch (error) {
    // Log detailed error information
    if (error.response) {
      // HTTP error status (4xx, 5xx)
      console.error(`HTTP error: Received status ${error.response.statusCode} for URL: ${url}`);
      throw new Error(`Failed to fetch URL: ${url}. HTTP status: ${error.response.statusCode}`);
    } else if (error.code) {
      // Network error (timeout, DNS failure, connection refused, etc.)
      console.error(`Network error: ${error.code} for URL: ${url}. Message: ${error.message}`);
      throw new Error(`Failed to fetch URL: ${url}. Error: ${error.message}`);
    } else {
      // Other errors
      console.error(`Unexpected error fetching URL: ${url}. Error: ${error.message}`);
      throw new Error(`Failed to fetch URL: ${url}. Error: ${error.message}`);
    }
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
      '[class*="propertyCard"]',
      '[class*="SearchResult"]',
      'div[id^="property-"]'
    ];
    
    let propertyCards = null;
    let usedSelector = null;
    
    // Try each selector until we find property cards
    console.log('🔎 Trying selectors to find property cards...');
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`  Selector "${selector}": ${elements.length} elements`);
      if (elements.length > 0) {
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
 * Validates the input object
 * @param {Object} input - The input object from Actor.getInput()
 * @throws {Error} If neither url nor urls field is provided
 */
function validateInput(input) {
  if (!input) {
    throw new Error('Input validation failed: No input provided. Please provide an input object with a "url" or "urls" field.');
  }
  
  // Check if either url or urls is provided
  const hasUrl = input.url && typeof input.url === 'string' && input.url.trim() !== '';
  const hasUrls = input.urls && Array.isArray(input.urls) && input.urls.length > 0;
  
  if (!hasUrl && !hasUrls) {
    throw new Error('Input validation failed: Must provide either "url" (string) or "urls" (array of strings). Please provide at least one Rightmove search URL.');
  }
  
  // Validate url if provided
  if (input.url) {
    if (typeof input.url !== 'string') {
      throw new Error(`Input validation failed: "url" field must be a string, but received type: ${typeof input.url}`);
    }
    
    if (input.url.trim() === '') {
      throw new Error('Input validation failed: "url" field cannot be empty. Please provide a valid Rightmove search URL.');
    }
  }
  
  // Validate urls if provided
  if (input.urls) {
    if (!Array.isArray(input.urls)) {
      throw new Error(`Input validation failed: "urls" field must be an array, but received type: ${typeof input.urls}`);
    }
    
    if (input.urls.length === 0) {
      throw new Error('Input validation failed: "urls" array cannot be empty. Please provide at least one URL.');
    }
    
    // Validate each URL in the array
    input.urls.forEach((url, index) => {
      if (typeof url !== 'string' || url.trim() === '') {
        throw new Error(`Input validation failed: urls[${index}] must be a non-empty string.`);
      }
    });
  }
}

/**
 * Reads and processes input with default values
 * @param {Object} input - The raw input object
 * @returns {Object} Processed input with defaults applied
 */
function processInput(input) {
  const maxItems = input.maxItems && typeof input.maxItems === 'number' && input.maxItems > 0
    ? input.maxItems
    : 50;

  const maxPages = input.maxPages && typeof input.maxPages === 'number' && input.maxPages > 0
    ? input.maxPages
    : 1;

  const useProxy = input.useProxy && typeof input.useProxy === 'boolean'
    ? input.useProxy
    : false;

  const distressKeywords = input.distressKeywords && Array.isArray(input.distressKeywords) && input.distressKeywords.length > 0
    ? input.distressKeywords
    : ['reduced', 'chain free', 'auction', 'motivated', 'cash buyers', 'needs renovation'];

  // Handle both single url and multiple urls
  let urls = [];
  if (input.urls && Array.isArray(input.urls) && input.urls.length > 0) {
    urls = input.urls;
  } else if (input.url) {
    urls = [input.url];
  }

  return {
    urls,
    maxItems,
    maxPages,
    useProxy,
    distressKeywords
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
 * Scrapes properties from a Rightmove URL with pagination support
 * Coordinates fetching, parsing, and extraction across multiple pages
 * @param {string} url - The Rightmove URL to scrape
 * @param {number} maxItems - Maximum number of properties to extract across all pages
 * @param {number} maxPages - Maximum number of pages to process
 * @param {Array<string>} distressKeywords - Array of distress keywords to detect
 * @param {boolean} useProxy - Whether to use Apify proxy for HTTP requests
 * @returns {Promise<Object>} Object containing properties array and pagesProcessed count
 */
async function scrapeProperties(url, maxItems, maxPages = 1, distressKeywords = [], useProxy = false) {
  const allProperties = [];
  let pagesProcessed = 0;

  try {
    console.log(`Starting pagination: will process up to ${maxPages} page(s) and extract up to ${maxItems} item(s)`);
    
    // Loop through pages up to maxPages
    for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
      // Stop if we've already reached maxItems
      if (allProperties.length >= maxItems) {
        console.log(`Reached maxItems limit (${maxItems}), stopping pagination`);
        break;
      }

      // Build the URL for this page
      const pageUrl = buildPageUrl(url, pageIndex);
      
      // Log each page being fetched with page number and URL
      console.log(`--- Page ${pageIndex + 1}/${maxPages} ---`);
      console.log(`URL: ${pageUrl}`);

      // Fetch HTML content with proxy support
      const html = await fetchPage(pageUrl, useProxy);
      
      // Parse HTML and get property cards
      const { $, propertyCards, count } = parseHTML(html);
      
      // Stop early if no properties found on this page
      if (count === 0) {
        console.log(`No properties found on page ${pageIndex + 1}, stopping pagination`);
        break;
      }

      // Log number of properties found on each page
      console.log(`Found ${count} property card(s) on page ${pageIndex + 1}`);
      
      // Calculate how many more properties we can extract
      const remainingSlots = maxItems - allProperties.length;
      
      // Extract properties from this page
      const pageProperties = [];
      
      propertyCards.each((index, element) => {
        // Stop if we've extracted enough from this page
        if (pageProperties.length >= remainingSlots) {
          return false; // Break out of .each() loop
        }
        
        const property = extractProperty($, element, distressKeywords);
        pageProperties.push(property);
      });
      
      // Add properties from this page to the aggregate
      allProperties.push(...pageProperties);
      pagesProcessed++;
      
      console.log(`Extracted ${pageProperties.length} property/properties from page ${pageIndex + 1} (total so far: ${allProperties.length}/${maxItems})`);
    }
    
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
    console.log(`URLs to scrape: ${input.urls.length}`);
    input.urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
    console.log(`Max items per URL: ${input.maxItems}`);
    console.log(`Max pages per URL: ${input.maxPages}`);
    console.log(`Use proxy: ${input.useProxy}`);
    console.log(`Distress keywords: [${input.distressKeywords.join(', ')}]`);
    console.log('===========================');
    
    // Scrape properties from all URLs
    const allProperties = [];
    let totalPagesProcessed = 0;
    
    for (let i = 0; i < input.urls.length; i++) {
      const url = input.urls[i];
      console.log(`\n=== Processing URL ${i + 1}/${input.urls.length} ===`);
      console.log(`URL: ${url}`);
      
      const result = await scrapeProperties(url, input.maxItems, input.maxPages, input.distressKeywords, input.useProxy);
      
      allProperties.push(...result.properties);
      totalPagesProcessed += result.pagesProcessed;
      
      console.log(`Extracted ${result.properties.length} properties from ${result.pagesProcessed} page(s) for this URL`);
    }
    
    // Push all results to Apify dataset
    console.log('\nSaving results to dataset...');
    await Actor.pushData(allProperties);
    
    // Log final summary
    console.log('\n=== Final Scraping Summary ===');
    console.log(`Total URLs processed: ${input.urls.length}`);
    console.log(`Total pages processed: ${totalPagesProcessed}`);
    console.log(`Total items extracted: ${allProperties.length}`);
    console.log(`Items with distress signals: ${allProperties.filter(p => p.distressScoreRule > 0).length}`);
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
  fetchPage,
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
  detectDistress
};

// Run the actor if this file is executed directly
if (require.main === module) {
  main();
}
