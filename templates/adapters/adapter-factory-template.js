/**
 * Adapter Factory Template
 * 
 * Automatically detects which adapter to use based on URL or site name.
 * Add your site adapters to the switch statement.
 */

// Import your site adapters here
// const SiteAAdapter = require('./site-a-adapter');
// const SiteBAdapter = require('./site-b-adapter');

class AdapterFactory {
  /**
   * Creates the appropriate adapter for a site
   * @param {string} siteNameOrUrl - Site name or URL
   * @param {Object} config - Configuration options
   * @returns {BaseAdapter} Site adapter instance
   */
  static createAdapter(siteNameOrUrl, config = {}) {
    const siteName = this._detectSite(siteNameOrUrl);
    
    switch (siteName) {
      // Add your site adapters here
      // case 'siteA':
      //   return new SiteAAdapter(config);
      // case 'siteB':
      //   return new SiteBAdapter(config);
      
      default:
        const supported = this.getSupportedSites().join(', ');
        throw new Error(`Unsupported site: ${siteName}. Supported sites: ${supported}`);
    }
  }

  /**
   * Detects site name from URL or site string
   * @param {string} siteNameOrUrl - Site name or URL
   * @returns {string} Normalized site name
   * @private
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

        // Add your site detection logic here
        // if (hostname.includes('sitea.com')) return 'siteA';
        // if (hostname.includes('siteb.com')) return 'siteB';

        throw new Error(`Unknown site: ${hostname}`);
      } catch (error) {
        if (error.message.includes('Unknown site')) {
          throw error;
        }
        throw new Error(`Invalid URL: ${siteNameOrUrl}`);
      }
    }

    // It's a site name - normalize it
    // Add your site name mappings here
    // if (lower === 'sitea' || lower === 'site-a') return 'siteA';
    // if (lower === 'siteb' || lower === 'site-b') return 'siteB';

    throw new Error(`Unknown site name: ${siteNameOrUrl}`);
  }

  /**
   * Gets list of supported sites
   * @returns {Array<string>} Array of supported site names
   */
  static getSupportedSites() {
    // Update this list as you add more adapters
    return []; // e.g., ['siteA', 'siteB']
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
