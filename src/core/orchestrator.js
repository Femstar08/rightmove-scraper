const { AdapterFactory } = require('../adapters');

/**
 * Orchestrator for multi-site property scraping
 * Coordinates scraping across multiple property portals
 */
class Orchestrator {
  constructor(config = {}) {
    this.config = config;
    this.adapters = new Map(); // site -> adapter instance
    this.statistics = new Map(); // site -> stats object
  }

  /**
   * Groups URLs by site
   * @param {Array<string>} urls - Array of URLs to group
   * @returns {Map<string, Array<string>>} Map of site -> URLs
   */
  groupUrlsBySite(urls) {
    const grouped = new Map();
    
    urls.forEach(url => {
      try {
        // Detect site from URL
        const siteName = AdapterFactory._detectSite(url);
        
        if (!grouped.has(siteName)) {
          grouped.set(siteName, []);
        }
        
        grouped.get(siteName).push(url);
      } catch (error) {
        console.warn(`Failed to detect site for URL: ${url}`);
        console.warn(`Error: ${error.message}`);
      }
    });
    
    return grouped;
  }

  /**
   * Gets or creates an adapter for a site
   * @param {string} siteName - Site name
   * @returns {BaseSiteAdapter} Adapter instance
   */
  getAdapter(siteName) {
    if (!this.adapters.has(siteName)) {
      console.log(`Creating adapter for ${siteName}...`);
      const adapter = AdapterFactory.createAdapter(siteName);
      this.adapters.set(siteName, adapter);
      console.log(`✓ ${siteName} adapter initialized`);
    }
    
    return this.adapters.get(siteName);
  }

  /**
   * Initializes statistics for a site
   * @param {string} siteName - Site name
   */
  initializeStatistics(siteName) {
    if (!this.statistics.has(siteName)) {
      this.statistics.set(siteName, {
        site: siteName,
        urlsProcessed: 0,
        pagesProcessed: 0,
        propertiesFound: 0,
        propertiesWithDistress: 0,
        errors: 0,
        startTime: new Date().toISOString(),
        endTime: null
      });
    }
  }

  /**
   * Updates statistics for a site
   * @param {string} siteName - Site name
   * @param {Object} updates - Statistics updates
   */
  updateStatistics(siteName, updates) {
    const stats = this.statistics.get(siteName);
    if (stats) {
      Object.assign(stats, updates);
    }
  }

  /**
   * Finalizes statistics for a site
   * @param {string} siteName - Site name
   */
  finalizeStatistics(siteName) {
    const stats = this.statistics.get(siteName);
    if (stats) {
      stats.endTime = new Date().toISOString();
    }
  }

  /**
   * Gets statistics for a site
   * @param {string} siteName - Site name
   * @returns {Object} Statistics object
   */
  getStatistics(siteName) {
    return this.statistics.get(siteName) || null;
  }

  /**
   * Gets aggregated statistics across all sites
   * @returns {Object} Aggregated statistics
   */
  getAggregatedStatistics() {
    const aggregated = {
      totalSites: this.statistics.size,
      totalUrlsProcessed: 0,
      totalPagesProcessed: 0,
      totalPropertiesFound: 0,
      totalPropertiesWithDistress: 0,
      totalErrors: 0,
      perSite: {}
    };

    this.statistics.forEach((stats, siteName) => {
      aggregated.totalUrlsProcessed += stats.urlsProcessed;
      aggregated.totalPagesProcessed += stats.pagesProcessed;
      aggregated.totalPropertiesFound += stats.propertiesFound;
      aggregated.totalPropertiesWithDistress += stats.propertiesWithDistress;
      aggregated.totalErrors += stats.errors;
      aggregated.perSite[siteName] = { ...stats };
    });

    return aggregated;
  }

  /**
   * Logs statistics for a site
   * @param {string} siteName - Site name
   */
  logStatistics(siteName) {
    const stats = this.getStatistics(siteName);
    if (!stats) return;

    console.log(`\n=== ${siteName.toUpperCase()} Statistics ===`);
    console.log(`URLs processed: ${stats.urlsProcessed}`);
    console.log(`Pages processed: ${stats.pagesProcessed}`);
    console.log(`Properties found: ${stats.propertiesFound}`);
    console.log(`With distress signals: ${stats.propertiesWithDistress}`);
    if (stats.errors > 0) {
      console.log(`Errors: ${stats.errors}`);
    }
    console.log('=====================================');
  }

  /**
   * Logs aggregated statistics
   */
  logAggregatedStatistics() {
    const stats = this.getAggregatedStatistics();

    console.log('\n=== MULTI-SITE SUMMARY ===');
    console.log(`Sites processed: ${stats.totalSites}`);
    console.log(`Total URLs: ${stats.totalUrlsProcessed}`);
    console.log(`Total pages: ${stats.totalPagesProcessed}`);
    console.log(`Total properties: ${stats.totalPropertiesFound}`);
    console.log(`With distress: ${stats.totalPropertiesWithDistress}`);
    if (stats.totalErrors > 0) {
      console.log(`Total errors: ${stats.totalErrors}`);
    }
    
    console.log('\nPer-site breakdown:');
    Object.entries(stats.perSite).forEach(([site, siteStats]) => {
      console.log(`  ${site}: ${siteStats.propertiesFound} properties from ${siteStats.pagesProcessed} pages`);
    });
    console.log('==========================');
  }

  /**
   * Handles errors for a site
   * @param {string} siteName - Site name
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  handleError(siteName, error, context = '') {
    console.error(`\n❌ Error in ${siteName} adapter${context ? ` (${context})` : ''}`);
    console.error(`Message: ${error.message}`);
    
    // Update error count
    const stats = this.getStatistics(siteName);
    if (stats) {
      stats.errors++;
    }
    
    // Don't throw - allow other sites to continue
    console.log(`Continuing with other sites...`);
  }

  /**
   * Validates that at least one site is supported
   * @param {Array<string>} urls - URLs to validate
   * @throws {Error} If no supported sites found
   */
  validateUrls(urls) {
    if (!urls || urls.length === 0) {
      throw new Error('No URLs provided');
    }

    const grouped = this.groupUrlsBySite(urls);
    
    if (grouped.size === 0) {
      throw new Error('No supported property sites found in URLs');
    }

    return grouped;
  }

  /**
   * Gets list of sites that will be processed
   * @param {Array<string>} urls - URLs to process
   * @returns {Array<string>} List of site names
   */
  getProcessingSites(urls) {
    const grouped = this.groupUrlsBySite(urls);
    return Array.from(grouped.keys());
  }
}

module.exports = Orchestrator;
