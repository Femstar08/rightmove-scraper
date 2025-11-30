/**
 * Base Adapter Template
 * 
 * This is the interface that all site adapters must implement.
 * Copy this file and implement the required methods for each site you want to scrape.
 */

class BaseAdapter {
  /**
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = config;
    this.siteName = 'base'; // Override in subclass
    this.sitePattern = null; // Override in subclass (e.g., 'example.com')
  }

  /**
   * Extract data from JavaScript objects embedded in the page
   * @param {Object} page - Playwright page object
   * @param {Object} options - Extraction options
   * @returns {Promise<Array<Object>>} Array of extracted items
   */
  async extractFromJavaScript(page, options = {}) {
    throw new Error(`${this.siteName}: extractFromJavaScript must be implemented`);
  }

  /**
   * Extract data from DOM elements (fallback method)
   * @param {Object} page - Playwright page object
   * @param {Object} options - Extraction options
   * @returns {Promise<Array<Object>>} Array of extracted items
   */
  async extractFromDOM(page, options = {}) {
    throw new Error(`${this.siteName}: extractFromDOM must be implemented`);
  }

  /**
   * Extract full details for a single item
   * @param {Object} page - Playwright page object
   * @param {Object} options - Extraction options
   * @returns {Promise<Object|null>} Detailed item object
   */
  async extractFullDetails(page, options = {}) {
    throw new Error(`${this.siteName}: extractFullDetails must be implemented`);
  }

  /**
   * Build URL for pagination
   * @param {string} baseUrl - Base URL
   * @param {number} pageNumber - Page number (0-indexed)
   * @returns {string} URL for the specified page
   */
  buildPageUrl(baseUrl, pageNumber) {
    throw new Error(`${this.siteName}: buildPageUrl must be implemented`);
  }

  /**
   * Check if URL is valid for this adapter
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid for this site
   */
  isValidUrl(url) {
    throw new Error(`${this.siteName}: isValidUrl must be implemented`);
  }

  /**
   * Normalize raw data to unified schema
   * @param {Object} rawData - Raw data from site
   * @returns {Object} Normalized data matching unified schema
   */
  normalizeData(rawData) {
    throw new Error(`${this.siteName}: normalizeData must be implemented`);
  }

  /**
   * Initialize adapter (optional)
   * Override if your adapter needs initialization
   */
  async initialize() {
    // Optional: Override if needed
  }

  /**
   * Cleanup adapter resources (optional)
   * Override if your adapter needs cleanup
   */
  async cleanup() {
    // Optional: Override if needed
  }

  /**
   * Get site configuration
   * @returns {Object} Site configuration
   */
  getSiteConfig() {
    return {
      siteName: this.siteName,
      sitePattern: this.sitePattern,
      config: this.config
    };
  }
}

module.exports = BaseAdapter;
