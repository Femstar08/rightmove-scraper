const RightmoveAdapter = require('./rightmove-adapter');
const ZooplaAdapter = require('./zoopla-adapter');

/**
 * Site Adapter Factory
 * Creates the appropriate adapter based on site name or URL
 */
class AdapterFactory {
  /**
   * Creates a site adapter instance
   * @param {string} siteNameOrUrl - Site name ('rightmove', 'zoopla') or URL
   * @param {Object} config - Optional configuration
   * @returns {BaseSiteAdapter} Site adapter instance
   */
  static createAdapter(siteNameOrUrl, config = {}) {
    // Normalize site name
    const siteName = this._detectSite(siteNameOrUrl);
    
    switch (siteName) {
      case 'rightmove':
        return new RightmoveAdapter(config);
      
      case 'zoopla':
        return new ZooplaAdapter(config);
      
      // Future adapters
      // case 'onthemarket':
      //   return new OnTheMarketAdapter(config);
      
      default:
        throw new Error(`Unsupported site: ${siteName}. Supported sites: ${this.getSupportedSites().join(', ')}`);
    }
  }

  /**
   * Detects site name from URL or site string
   * @param {string} siteNameOrUrl - Site name or URL
   * @returns {string} Normalized site name
   */
  static _detectSite(siteNameOrUrl) {
    if (!siteNameOrUrl || typeof siteNameOrUrl !== 'string') {
      throw new Error('Site name or URL is required');
    }

    const lower = siteNameOrUrl.toLowerCase();

    // Check if it's a URL
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      try {
        const url = new URL(siteNameOrUrl);
        const hostname = url.hostname.toLowerCase();

        if (hostname.includes('rightmove.co.uk')) {
          return 'rightmove';
        }
        if (hostname.includes('zoopla.co.uk')) {
          return 'zoopla';
        }
        if (hostname.includes('onthemarket.com')) {
          return 'onthemarket';
        }

        throw new Error(`Unknown property site: ${hostname}`);
      } catch (error) {
        throw new Error(`Invalid URL or unsupported site: ${siteNameOrUrl}`);
      }
    }

    // It's a site name
    if (lower === 'rightmove') return 'rightmove';
    if (lower === 'zoopla') return 'zoopla';
    if (lower === 'onthemarket') return 'onthemarket';

    throw new Error(`Unknown site name: ${siteNameOrUrl}`);
  }

  /**
   * Gets list of supported sites
   * @returns {Array<string>} Array of supported site names
   */
  static getSupportedSites() {
    return ['rightmove', 'zoopla'];
  }

  /**
   * Checks if a site is supported
   * @param {string} siteName - Site name to check
   * @returns {boolean} True if supported
   */
  static isSiteSupported(siteName) {
    try {
      const normalized = this._detectSite(siteName);
      return this.getSupportedSites().includes(normalized);
    } catch {
      return false;
    }
  }
}

module.exports = AdapterFactory;
