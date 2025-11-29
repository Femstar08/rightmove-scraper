/**
 * Field Mapping Utilities
 * Handles unified schema validation, field normalization, and data transformation
 */

/**
 * Unified property schema definition
 * All adapters should map their data to this schema
 */
const UNIFIED_SCHEMA = {
  // Core identification
  id: 'string',
  url: 'string',
  source: 'string', // Portal name: 'rightmove', 'zoopla', etc.
  sourceUrl: 'string', // Original URL from portal
  
  // Basic property info
  address: 'string',
  displayAddress: 'string',
  price: 'string',
  description: 'string',
  propertyType: 'string',
  
  // Property details
  bedrooms: 'number',
  bathrooms: 'number',
  
  // Location
  coordinates: 'object', // { latitude, longitude }
  outcode: 'string', // e.g., 'SW1A'
  incode: 'string', // e.g., '1AA'
  countryCode: 'string',
  
  // Property characteristics
  tenure: 'string',
  councilTaxBand: 'string',
  
  // Media
  images: 'array',
  floorplans: 'array',
  brochures: 'array',
  
  // Agent info
  agent: 'string',
  agentPhone: 'string',
  agentLogo: 'string',
  agentDisplayAddress: 'string',
  agentProfileUrl: 'string',
  
  // Features
  features: 'array',
  nearestStations: 'array',
  
  // Dates
  addedOn: 'string',
  firstVisibleDate: 'string',
  listingUpdateDate: 'string',
  
  // Status
  published: 'boolean',
  archived: 'boolean',
  sold: 'boolean',
  
  // Distress detection
  distressKeywordsMatched: 'array',
  distressScoreRule: 'number',
  
  // Price history (optional)
  priceHistory: 'array',
  
  // Cross-site deduplication
  sources: 'array', // Array of source portals if duplicate
  duplicateOf: 'array', // Array of property IDs this is a duplicate of
  _isDuplicate: 'boolean',
  
  // Site-specific data
  additionalData: 'object',
  
  // Metadata
  _scrapedAt: 'string',
  _site: 'string' // Alias for source
};

/**
 * Required fields that must be present
 */
const REQUIRED_FIELDS = ['id', 'url', 'source', 'address', 'price'];

/**
 * Validates a property object against the unified schema
 * @param {Object} property - Property object to validate
 * @param {boolean} strict - If true, throws on validation errors
 * @returns {Object} Validation result { valid: boolean, errors: Array, warnings: Array }
 */
function validateUnifiedSchema(property, strict = false) {
  const errors = [];
  const warnings = [];

  if (!property || typeof property !== 'object') {
    errors.push('Property must be an object');
    if (strict) throw new Error('Property must be an object');
    return { valid: false, errors, warnings };
  }

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (property[field] === undefined || property[field] === null) {
      errors.push(`Required field missing: ${field}`);
    }
  });

  // Check field types
  Object.entries(UNIFIED_SCHEMA).forEach(([field, expectedType]) => {
    const value = property[field];
    
    // Skip null/undefined (handled by required check)
    if (value === null || value === undefined) {
      return;
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== expectedType) {
      warnings.push(`Field "${field}" expected type ${expectedType}, got ${actualType}`);
    }
  });

  // Check for unknown fields
  Object.keys(property).forEach(field => {
    if (!UNIFIED_SCHEMA.hasOwnProperty(field)) {
      warnings.push(`Unknown field: ${field}`);
    }
  });

  const valid = errors.length === 0;

  if (strict && !valid) {
    throw new Error(`Schema validation failed: ${errors.join(', ')}`);
  }

  return { valid, errors, warnings };
}

/**
 * Sets missing fields to null for consistent schema
 * @param {Object} property - Property object
 * @returns {Object} Property with all schema fields present
 */
function setMissingFieldsToNull(property) {
  const normalized = { ...property };

  Object.keys(UNIFIED_SCHEMA).forEach(field => {
    if (normalized[field] === undefined) {
      // Set appropriate null value based on type
      const type = UNIFIED_SCHEMA[field];
      if (type === 'array') {
        normalized[field] = [];
      } else if (type === 'object') {
        normalized[field] = null;
      } else if (type === 'boolean') {
        normalized[field] = false;
      } else {
        normalized[field] = null;
      }
    }
  });

  return normalized;
}

/**
 * Extracts postcode components from a UK address or postcode string
 * @param {string} addressOrPostcode - Full address or postcode
 * @returns {Object} { outcode: string, incode: string, full: string } or null
 */
function extractPostcode(addressOrPostcode) {
  if (!addressOrPostcode || typeof addressOrPostcode !== 'string') {
    return null;
  }

  // UK postcode regex pattern
  // Format: AA9A 9AA, A9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA
  const postcodeRegex = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})\b/i;
  
  const match = addressOrPostcode.match(postcodeRegex);
  
  if (match) {
    const outcode = match[1].toUpperCase();
    const incode = match[2].toUpperCase();
    const full = `${outcode} ${incode}`;
    
    return { outcode, incode, full };
  }

  return null;
}

/**
 * Normalizes an address string
 * @param {string} address - Address to normalize
 * @returns {string} Normalized address
 */
function normalizeAddress(address) {
  if (!address || typeof address !== 'string') {
    return '';
  }

  return address
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/,\s*$/, ''); // Remove trailing comma
}

/**
 * Normalizes a price string to a consistent format
 * @param {string|number} price - Price to normalize
 * @returns {string} Normalized price string
 */
function normalizePrice(price) {
  if (price === null || price === undefined) {
    return null;
  }

  const priceStr = price.toString().trim();
  
  // Already formatted
  if (priceStr.startsWith('£')) {
    return priceStr;
  }

  // Extract numbers
  const numbers = priceStr.replace(/[^\d]/g, '');
  
  if (!numbers) {
    return priceStr; // Return original if no numbers found
  }

  // Format with commas
  const formatted = parseInt(numbers).toLocaleString('en-GB');
  return `£${formatted}`;
}

/**
 * Validates field types
 * @param {*} value - Value to validate
 * @param {string} expectedType - Expected type
 * @returns {boolean} True if type matches
 */
function validateFieldType(value, expectedType) {
  if (value === null || value === undefined) {
    return true; // Null/undefined allowed for optional fields
  }

  const actualType = Array.isArray(value) ? 'array' : typeof value;
  return actualType === expectedType;
}

/**
 * Merges property data from multiple sources (for deduplication)
 * Keeps the most complete data for each field
 * @param {Array<Object>} properties - Array of property objects to merge
 * @returns {Object} Merged property object
 */
function mergeProperties(properties) {
  if (!properties || properties.length === 0) {
    return null;
  }

  if (properties.length === 1) {
    return properties[0];
  }

  const merged = { ...properties[0] };

  // Track sources
  merged.sources = properties.map(p => p.source || p._site).filter(Boolean);
  merged.duplicateOf = properties.map(p => p.id).filter(Boolean);
  merged._isDuplicate = true;

  // Merge fields - prefer non-null, longer strings, larger arrays
  properties.slice(1).forEach(property => {
    Object.keys(property).forEach(key => {
      const currentValue = merged[key];
      const newValue = property[key];

      // Skip if new value is null/undefined
      if (newValue === null || newValue === undefined) {
        return;
      }

      // If current is null/undefined, use new value
      if (currentValue === null || currentValue === undefined) {
        merged[key] = newValue;
        return;
      }

      // For strings, prefer longer
      if (typeof newValue === 'string' && typeof currentValue === 'string') {
        if (newValue.length > currentValue.length) {
          merged[key] = newValue;
        }
        return;
      }

      // For arrays, merge and deduplicate
      if (Array.isArray(newValue) && Array.isArray(currentValue)) {
        merged[key] = [...new Set([...currentValue, ...newValue])];
        return;
      }

      // For objects, merge
      if (typeof newValue === 'object' && typeof currentValue === 'object') {
        merged[key] = { ...currentValue, ...newValue };
        return;
      }
    });
  });

  return merged;
}

/**
 * Gets the schema definition
 * @returns {Object} Schema definition
 */
function getSchema() {
  return { ...UNIFIED_SCHEMA };
}

/**
 * Gets required fields list
 * @returns {Array<string>} Required fields
 */
function getRequiredFields() {
  return [...REQUIRED_FIELDS];
}

module.exports = {
  UNIFIED_SCHEMA,
  REQUIRED_FIELDS,
  validateUnifiedSchema,
  setMissingFieldsToNull,
  extractPostcode,
  normalizeAddress,
  normalizePrice,
  validateFieldType,
  mergeProperties,
  getSchema,
  getRequiredFields
};
