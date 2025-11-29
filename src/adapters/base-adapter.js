/**
 * Base Site Adapter Interface
 * All site-specific adapters must implement this interface
 */
class BaseSiteAdapter {
  constructor(config = {}) {
    this.config = config;
    this.siteName = 'unknown';
  }

  /**
   * Validates if a URL belongs to this site
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid for this site
   */
  isValidUrl(url) {
    throw new Error('isValidUrl() must be implemented by subclass');
  }

  /**
   * Builds a paginated URL for search results
   * @param {string} baseUrl - Base search URL
   * @param {number} pageIndex - Zero-based page index
   * @returns {string} Paginated URL
   */
  buildPageUrl(baseUrl, pageIndex) {
    throw new Error('buildPageUrl() must be implemented by subclass');
  }

  /**
   * Extracts property data from JavaScript (window object)
   * @param {Object} page - Playwright page object
   * @returns {Promise<Object|null>} Extracted data or null
   */
  async extractFromJavaScript(page) {
    throw new Error('extractFromJavaScript() must be implemented by subclass');
  }

  /**
   * Extracts property data from DOM/HTML
   * @param {Object} page - Playwright page object
   * @param {Array<string>} distressKeywords - Keywords for distress detection
   * @returns {Promise<Array<Object>>} Array of property objects
   */
  async extractFromDOM(page, distressKeywords = []) {
    throw new Error('extractFromDOM() must be implemented by subclass');
  }

  /**
   * Extracts full property details from a detail page
   * @param {Object} propertyData - Raw property data
   * @param {Array<string>} distressKeywords - Keywords for distress detection
   * @param {boolean} includePriceHistory - Whether to include price history
   * @returns {Object|null} Full property object or null
   */
  extractFullPropertyDetails(propertyData, distressKeywords = [], includePriceHistory = false) {
    throw new Error('extractFullPropertyDetails() must be implemented by subclass');
  }

  /**
   * Normalizes property data to a common format
   * @param {Object} rawProperty - Raw property data from site
   * @returns {Object} Normalized property object
   */
  normalizeProperty(rawProperty) {
    throw new Error('normalizeProperty() must be implemented by subclass');
  }

  /**
   * Gets site-specific configuration
   * @returns {Object} Configuration object
   */
  getSiteConfig() {
    return {
      name: this.siteName,
      baseUrl: this.config.baseUrl || '',
      propertiesPerPage: this.config.propertiesPerPage || 24,
      ...this.config
    };
  }
}

module.exports = BaseSiteAdapter;
