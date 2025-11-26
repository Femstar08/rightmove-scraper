/**
 * Adaptive Extraction Module
 * Handles Rightmove's frequently changing page structure with multiple fallback strategies
 */

/**
 * STRATEGY 1: Multi-Path JavaScript Extraction
 * Tries multiple data locations to handle structure changes
 */
async function extractPageModelAdaptive(page) {
  try {
    console.log('🔍 Adaptive extraction: Trying multiple data locations...');
    
    const result = await page.evaluate(() => {
      // Try multiple possible data locations
      const dataLocations = [
        { path: 'window.PAGE_MODEL', getter: () => window.PAGE_MODEL },
        { path: 'window.__NEXT_DATA__', getter: () => window.__NEXT_DATA__ },
        { path: 'window.__NEXT_DATA__.props', getter: () => window.__NEXT_DATA__?.props },
        { path: 'window.__NEXT_DATA__.props.pageProps', getter: () => window.__NEXT_DATA__?.props?.pageProps },
        { path: 'window.__INITIAL_STATE__', getter: () => window.__INITIAL_STATE__ },
        { path: 'window.PRELOADED_STATE', getter: () => window.PRELOADED_STATE__ },
      ];
      
      // Try each location
      for (const location of dataLocations) {
        try {
          const data = location.getter();
          if (data && typeof data === 'object') {
            return { data, source: location.path, found: true };
          }
        } catch (e) {
          continue;
        }
      }
      
      // Try to find JSON in script tags
      try {
        const scripts = document.querySelectorAll('script[type="application/json"], script[id*="__NEXT_DATA__"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data && typeof data === 'object') {
              return { data, source: 'script tag', found: true };
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        // Continue
      }
      
      return { found: false };
    });
    
    if (result.found) {
      console.log(`✓ Found data at: ${result.source}`);
      return result.data;
    }
    
    console.log('✗ No JavaScript data found in any location');
    return null;
  } catch (error) {
    console.warn(`Adaptive extraction error: ${error.message}`);
    return null;
  }
}

/**
 * STRATEGY 2: Intelligent Property Discovery
 * Recursively searches for property arrays by structure, not location
 */
function findPropertyDataRecursive(obj, maxDepth = 5, currentDepth = 0, path = 'root') {
  if (!obj || currentDepth > maxDepth) return null;
  
  // Check if this is an array of property-like objects
  if (Array.isArray(obj) && obj.length > 0) {
    const first = obj[0];
    if (first && typeof first === 'object') {
      // Check if it looks like property data
      const hasPropertyFields = (
        (first.id || first.propertyId) &&
        (first.price || first.displayPrice || first.displayAddress || first.address)
      );
      
      if (hasPropertyFields) {
        console.log(`✓ Found property array at: ${path} (${obj.length} properties)`);
        return obj;
      }
    }
  }
  
  // Check common property data keys first (optimization)
  const propertyKeys = [
    'propertyData',
    'properties',
    'results',
    'listings',
    'searchResults',
    'items',
    'data',
    'props'
  ];
  
  for (const key of propertyKeys) {
    if (obj[key]) {
      const result = findPropertyDataRecursive(obj[key], maxDepth, currentDepth + 1, `${path}.${key}`);
      if (result) return result;
    }
  }
  
  // Recursively search all other keys
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (!propertyKeys.includes(key) && obj[key] && typeof obj[key] === 'object') {
        const result = findPropertyDataRecursive(obj[key], maxDepth, currentDepth + 1, `${path}.${key}`);
        if (result) return result;
      }
    }
  }
  
  return null;
}

/**
 * STRATEGY 3: Adaptive DOM Selector Discovery
 * Discovers property card selectors dynamically based on patterns
 */
async function discoverPropertyCardSelector(page) {
  try {
    console.log('🔍 Discovering property card selectors...');
    
    const result = await page.evaluate(() => {
      const candidates = [];
      
      // Patterns that indicate a property card
      const classPatterns = [
        /property.*card/i,
        /search.*result/i,
        /listing.*item/i,
        /property.*item/i,
        /result.*card/i,
        /property.*wrapper/i
      ];
      
      const idPatterns = [
        /^property-\d+$/,
        /^listing-\d+$/,
        /property_\d+/
      ];
      
      // Find all elements and score them
      const allElements = document.querySelectorAll('*');
      const elementScores = new Map();
      
      allElements.forEach(el => {
        let score = 0;
        
        // Score by class name
        if (el.className && typeof el.className === 'string') {
          classPatterns.forEach(pattern => {
            if (pattern.test(el.className)) score += 10;
          });
        }
        
        // Score by ID
        if (el.id) {
          idPatterns.forEach(pattern => {
            if (pattern.test(el.id)) score += 10;
          });
        }
        
        // Score by data attributes
        if (el.hasAttribute('data-test') || el.hasAttribute('data-testid')) score += 5;
        if (el.hasAttribute('data-property-id') || el.hasAttribute('data-listing-id')) score += 8;
        
        // Score by content
        const text = el.textContent || '';
        if (text.match(/£[\d,]+/)) score += 3;  // Has price
        if (text.match(/\d+\s+bed/i)) score += 2;  // Has bedroom count
        if (text.match(/\b[A-Z][a-z]+\s+(Street|Road|Avenue|Lane|Drive)\b/)) score += 2;  // Has address
        
        if (score >= 10) {
          elementScores.set(el, score);
        }
      });
      
      // Group elements by similar selectors
      const selectorGroups = {};
      elementScores.forEach((score, el) => {
        let selector = null;
        
        // Try to generate a selector
        if (el.className && typeof el.className === 'string') {
          const classes = el.className.split(' ').filter(c => c.length > 0);
          if (classes.length > 0) {
            selector = `.${classes[0]}`;
          }
        }
        
        if (!selector && el.id) {
          // For IDs with numbers, use pattern
          if (/\d+/.test(el.id)) {
            selector = `[id^="${el.id.replace(/\d+$/, '')}"]`;
          } else {
            selector = `#${el.id}`;
          }
        }
        
        if (!selector) {
          selector = el.tagName.toLowerCase();
        }
        
        if (!selectorGroups[selector]) {
          selectorGroups[selector] = { count: 0, totalScore: 0, selector };
        }
        selectorGroups[selector].count++;
        selectorGroups[selector].totalScore += score;
      });
      
      // Find best selector (highest count with good score)
      let bestSelector = null;
      let bestMetric = 0;
      
      Object.values(selectorGroups).forEach(group => {
        // Metric: count * average score
        const metric = group.count * (group.totalScore / group.count);
        if (group.count >= 3 && metric > bestMetric) {  // At least 3 elements
          bestMetric = metric;
          bestSelector = group;
        }
      });
      
      return bestSelector;
    });
    
    if (result) {
      console.log(`✓ Discovered selector: "${result.selector}" (${result.count} elements, score: ${Math.round(result.totalScore / result.count)})`);
      return result.selector;
    }
    
    console.log('✗ Could not discover property card selector');
    return null;
  } catch (error) {
    console.warn(`Selector discovery error: ${error.message}`);
    return null;
  }
}

/**
 * STRATEGY 4: Confidence Scoring
 * Validates extraction quality
 */
function calculateConfidence(properties) {
  if (!properties || properties.length === 0) return 0;
  
  let totalScore = 0;
  const fieldWeights = {
    url: 20,
    address: 20,
    price: 20,
    description: 15,
    image: 15,
    addedOn: 10
  };
  
  properties.forEach(prop => {
    let propScore = 0;
    Object.keys(fieldWeights).forEach(field => {
      if (prop[field] && prop[field] !== null) {
        propScore += fieldWeights[field];
      }
    });
    totalScore += propScore;
  });
  
  const maxPossibleScore = properties.length * 100;
  const confidence = Math.round((totalScore / maxPossibleScore) * 100);
  
  return confidence;
}

/**
 * Main adaptive extraction function
 * Combines all strategies with fallback chain
 */
async function extractPropertiesAdaptive(page, distressKeywords = []) {
  const strategies = [];
  
  // STRATEGY 1 & 2: JavaScript extraction with intelligent discovery
  try {
    console.log('📊 Strategy 1: Adaptive JavaScript extraction');
    const jsData = await extractPageModelAdaptive(page);
    
    if (jsData) {
      const propertyArray = findPropertyDataRecursive(jsData);
      if (propertyArray && propertyArray.length > 0) {
        // We'll need to process this with the existing extractPropertyFromJS function
        strategies.push({
          name: 'Adaptive JavaScript',
          data: propertyArray,
          confidence: 90  // High confidence for JS data
        });
      }
    }
  } catch (e) {
    console.warn(`Strategy 1 failed: ${e.message}`);
  }
  
  // STRATEGY 3: Adaptive DOM extraction
  try {
    console.log('📊 Strategy 2: Adaptive DOM extraction');
    const discoveredSelector = await discoverPropertyCardSelector(page);
    
    if (discoveredSelector) {
      strategies.push({
        name: 'Adaptive DOM',
        selector: discoveredSelector,
        confidence: 70  // Medium confidence for DOM
      });
    }
  } catch (e) {
    console.warn(`Strategy 2 failed: ${e.message}`);
  }
  
  return strategies;
}

module.exports = {
  extractPageModelAdaptive,
  findPropertyDataRecursive,
  discoverPropertyCardSelector,
  calculateConfidence,
  extractPropertiesAdaptive
};
