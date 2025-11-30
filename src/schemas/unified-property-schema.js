/**
 * Unified Property Schema
 * 
 * This schema defines the standard output format for properties from all supported portals.
 * All adapters must map their data to this schema to ensure consistency.
 * 
 * @module schemas/unified-property-schema
 */

/**
 * @typedef {Object} UnifiedProperty
 * 
 * Core Identification Fields
 * @property {string} id - Unique property identifier from the source portal
 * @property {string} url - Full URL to the property listing
 * @property {string} source - Portal name ('rightmove', 'zoopla', etc.)
 * @property {string} sourceUrl - Original URL from the portal (may differ from url)
 * 
 * Basic Property Information
 * @property {string} address - Full property address
 * @property {string} displayAddress - Formatted display address
 * @property {string} price - Property price (formatted string, e.g., "£350,000")
 * @property {string} description - Property description text
 * @property {string} propertyType - Type of property (e.g., "Detached", "Semi-Detached", "Flat")
 * 
 * Property Details
 * @property {number|null} bedrooms - Number of bedrooms
 * @property {number|null} bathrooms - Number of bathrooms
 * 
 * Location Data
 * @property {Object|null} coordinates - Geographic coordinates
 * @property {number} coordinates.latitude - Latitude
 * @property {number} coordinates.longitude - Longitude
 * @property {string|null} outcode - UK postcode outcode (e.g., 'SW1A')
 * @property {string|null} incode - UK postcode incode (e.g., '1AA')
 * @property {string} countryCode - ISO country code (e.g., 'GB')
 * 
 * Property Characteristics
 * @property {string|null} tenure - Property tenure (e.g., 'Freehold', 'Leasehold')
 * @property {string|null} councilTaxBand - Council tax band (A-H)
 * 
 * Media
 * @property {Array<string>} images - Array of image URLs
 * @property {Array<Object>} floorplans - Array of floorplan objects
 * @property {string} floorplans[].url - Floorplan image URL
 * @property {string} floorplans[].caption - Floorplan caption
 * @property {Array<Object>} brochures - Array of brochure objects
 * @property {string} brochures[].url - Brochure PDF URL
 * @property {string} brochures[].caption - Brochure caption
 * 
 * Agent Information
 * @property {string|null} agent - Agent or agency name
 * @property {string|null} agentPhone - Agent contact phone number
 * @property {string|null} agentLogo - Agent logo image URL
 * @property {string|null} agentDisplayAddress - Agent office address
 * @property {string|null} agentProfileUrl - Agent profile page URL
 * 
 * Features and Amenities
 * @property {Array<string>} features - Array of property features/amenities
 * @property {Array<Object>} nearestStations - Array of nearby transport stations
 * @property {string} nearestStations[].name - Station name
 * @property {Array<string>} nearestStations[].types - Transport types (e.g., ['tube', 'rail'])
 * @property {number} nearestStations[].distance - Distance to station
 * @property {string} nearestStations[].unit - Distance unit (e.g., 'miles')
 * 
 * Dates and Timeline
 * @property {string|null} addedOn - Date property was first listed (ISO 8601)
 * @property {string|null} firstVisibleDate - First date property was visible on portal
 * @property {string|null} listingUpdateDate - Date listing was last updated
 * 
 * Status Flags
 * @property {boolean} published - Whether property is currently published
 * @property {boolean} archived - Whether property has been archived
 * @property {boolean} sold - Whether property has been sold
 * 
 * Distress Detection
 * @property {Array<string>} distressKeywordsMatched - Keywords indicating distressed sale
 * @property {number} distressScoreRule - Distress score (0-10)
 * 
 * Price History (Optional)
 * @property {Array<Object>} priceHistory - Historical price changes
 * @property {string} priceHistory[].date - Date of price change (ISO 8601)
 * @property {string} priceHistory[].price - Price at that date
 * 
 * Cross-Site Deduplication
 * @property {Array<string>|undefined} sources - Array of portal names if property appears on multiple sites
 * @property {Array<string>|undefined} duplicateOf - Array of property IDs this is a duplicate of
 * @property {boolean|undefined} _isDuplicate - Flag indicating this is a merged duplicate
 * 
 * Site-Specific Data
 * @property {Object|undefined} additionalData - Portal-specific fields not in unified schema
 * 
 * Metadata
 * @property {string} _scrapedAt - Timestamp when property was scraped (ISO 8601)
 * @property {string} _site - Alias for source field (for backward compatibility)
 * @property {boolean} _isNew - Flag for monitoring mode (new property since last run)
 */

/**
 * Required fields that must be present in every property
 */
const REQUIRED_FIELDS = [
  'id',
  'url',
  'source',
  'address',
  'price'
];

/**
 * Field type definitions for validation
 */
const FIELD_TYPES = {
  // Core identification
  id: 'string',
  url: 'string',
  source: 'string',
  sourceUrl: 'string',
  
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
  coordinates: 'object',
  outcode: 'string',
  incode: 'string',
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
  
  // Price history
  priceHistory: 'array',
  
  // Cross-site deduplication
  sources: 'array',
  duplicateOf: 'array',
  _isDuplicate: 'boolean',
  
  // Site-specific data
  additionalData: 'object',
  
  // Metadata
  _scrapedAt: 'string',
  _site: 'string'
};

/**
 * Example property from Rightmove
 */
const EXAMPLE_RIGHTMOVE = {
  id: "123456789",
  url: "https://www.rightmove.co.uk/properties/123456789",
  source: "rightmove",
  sourceUrl: "https://www.rightmove.co.uk/properties/123456789",
  address: "High Street, London SW1A 1AA",
  displayAddress: "High Street, Westminster, London",
  price: "£350,000",
  description: "A beautiful 2-bedroom flat in the heart of Westminster...",
  propertyType: "Flat",
  bedrooms: 2,
  bathrooms: 1,
  coordinates: {
    latitude: 51.5014,
    longitude: -0.1419
  },
  outcode: "SW1A",
  incode: "1AA",
  countryCode: "GB",
  tenure: "Leasehold",
  councilTaxBand: "D",
  images: [
    "https://media.rightmove.co.uk/123k/122456/123456789/122456_123_IMG_00_0000.jpeg"
  ],
  floorplans: [],
  brochures: [],
  agent: "Example Estate Agents",
  agentPhone: "020 1234 5678",
  agentLogo: "https://media.rightmove.co.uk/logo.png",
  agentDisplayAddress: "123 High Street, London",
  agentProfileUrl: "https://www.rightmove.co.uk/estate-agents/agent/Example/123.html",
  features: ["Double glazing", "Garden", "Parking"],
  nearestStations: [
    {
      name: "Westminster",
      types: ["tube"],
      distance: 0.3,
      unit: "miles"
    }
  ],
  addedOn: "2024-01-15T10:30:00Z",
  firstVisibleDate: "2024-01-15T10:30:00Z",
  listingUpdateDate: "2024-01-20T14:00:00Z",
  published: true,
  archived: false,
  sold: false,
  distressKeywordsMatched: [],
  distressScoreRule: 0,
  priceHistory: [],
  _scrapedAt: "2024-01-25T09:00:00Z",
  _site: "rightmove"
};

/**
 * Example property from Zoopla
 */
const EXAMPLE_ZOOPLA = {
  id: "987654321",
  url: "https://www.zoopla.co.uk/for-sale/details/987654321",
  source: "zoopla",
  sourceUrl: "https://www.zoopla.co.uk/for-sale/details/987654321",
  address: "Baker Street, London NW1 6XE",
  displayAddress: "Baker Street, Marylebone, London",
  price: "£425,000",
  description: "Spacious 3-bedroom apartment with modern fixtures...",
  propertyType: "Flat",
  bedrooms: 3,
  bathrooms: 2,
  coordinates: {
    latitude: 51.5237,
    longitude: -0.1585
  },
  outcode: "NW1",
  incode: "6XE",
  countryCode: "GB",
  tenure: "Freehold",
  councilTaxBand: "E",
  images: [
    "https://lid.zoocdn.com/645/430/image.jpg"
  ],
  floorplans: [],
  brochures: [],
  agent: "Zoopla Estate Agents",
  agentPhone: "020 9876 5432",
  agentLogo: "https://st.zoocdn.com/zoopla_static_agent_logo.png",
  agentDisplayAddress: "456 Baker Street, London",
  agentProfileUrl: null,
  features: ["Balcony", "Lift", "Concierge"],
  nearestStations: [
    {
      name: "Baker Street",
      types: ["tube"],
      distance: 0.1,
      unit: "miles"
    }
  ],
  addedOn: "2024-01-10T08:00:00Z",
  firstVisibleDate: "2024-01-10T08:00:00Z",
  listingUpdateDate: "2024-01-18T12:00:00Z",
  published: true,
  archived: false,
  sold: false,
  distressKeywordsMatched: [],
  distressScoreRule: 0,
  priceHistory: [],
  additionalData: {
    zooplaListingId: "987654321",
    zooplaAgentId: "12345"
  },
  _scrapedAt: "2024-01-25T09:00:00Z",
  _site: "zoopla"
};

/**
 * Example of a deduplicated property (appears on both portals)
 */
const EXAMPLE_DEDUPLICATED = {
  id: "123456789",
  url: "https://www.rightmove.co.uk/properties/123456789",
  source: "rightmove",
  sourceUrl: "https://www.rightmove.co.uk/properties/123456789",
  address: "Oxford Street, London W1D 1BS",
  displayAddress: "Oxford Street, West End, London",
  price: "£500,000",
  description: "Stunning 2-bedroom apartment in prime location...",
  propertyType: "Flat",
  bedrooms: 2,
  bathrooms: 2,
  coordinates: {
    latitude: 51.5155,
    longitude: -0.1426
  },
  outcode: "W1D",
  incode: "1BS",
  countryCode: "GB",
  tenure: "Leasehold",
  councilTaxBand: "F",
  images: [
    "https://media.rightmove.co.uk/image1.jpg",
    "https://lid.zoocdn.com/image2.jpg"
  ],
  floorplans: [],
  brochures: [],
  agent: "Premium Estate Agents",
  agentPhone: "020 1111 2222",
  agentLogo: "https://media.rightmove.co.uk/logo.png",
  agentDisplayAddress: "789 Oxford Street, London",
  agentProfileUrl: "https://www.rightmove.co.uk/estate-agents/agent/Premium/789.html",
  features: ["Gym", "Roof terrace", "24-hour security"],
  nearestStations: [
    {
      name: "Oxford Circus",
      types: ["tube"],
      distance: 0.2,
      unit: "miles"
    }
  ],
  addedOn: "2024-01-05T09:00:00Z",
  firstVisibleDate: "2024-01-05T09:00:00Z",
  listingUpdateDate: "2024-01-22T16:00:00Z",
  published: true,
  archived: false,
  sold: false,
  distressKeywordsMatched: [],
  distressScoreRule: 0,
  priceHistory: [],
  sources: ["rightmove", "zoopla"],
  duplicateOf: ["123456789", "555666777"],
  _isDuplicate: true,
  _scrapedAt: "2024-01-25T09:00:00Z",
  _site: "rightmove"
};

module.exports = {
  REQUIRED_FIELDS,
  FIELD_TYPES,
  EXAMPLE_RIGHTMOVE,
  EXAMPLE_ZOOPLA,
  EXAMPLE_DEDUPLICATED
};
