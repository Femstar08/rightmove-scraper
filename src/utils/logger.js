/**
 * Enhanced Logging Utility for Multi-Site Scraping
 * Provides consistent, contextual logging across all adapters
 */

/**
 * Logger class with site context
 */
class Logger {
  constructor(siteName = null) {
    this.siteName = siteName;
    this.context = siteName ? `[${siteName.toUpperCase()}]` : '';
  }

  /**
   * Formats a log message with context
   * @param {string} message - Log message
   * @param {string} level - Log level
   * @returns {string} Formatted message
   */
  _format(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const levelStr = level.padEnd(5);
    return `${timestamp} ${levelStr} ${this.context} ${message}`.trim();
  }

  /**
   * Info level log
   * @param {string} message - Log message
   */
  info(message) {
    console.log(this._format(message, 'INFO'));
  }

  /**
   * Success level log (with checkmark)
   * @param {string} message - Log message
   */
  success(message) {
    console.log(this._format(`✓ ${message}`, 'INFO'));
  }

  /**
   * Warning level log
   * @param {string} message - Log message
   */
  warn(message) {
    console.warn(this._format(`⚠️  ${message}`, 'WARN'));
  }

  /**
   * Error level log
   * @param {string} message - Log message
   * @param {Error} error - Optional error object
   */
  error(message, error = null) {
    console.error(this._format(`❌ ${message}`, 'ERROR'));
    if (error && error.stack) {
      console.error(error.stack);
    }
  }

  /**
   * Debug level log
   * @param {string} message - Log message
   */
  debug(message) {
    if (process.env.DEBUG || process.env.LOG_LEVEL === 'debug') {
      console.log(this._format(message, 'DEBUG'));
    }
  }

  /**
   * Logs adapter initialization
   */
  logAdapterInit() {
    this.info(`Initializing ${this.siteName} adapter...`);
  }

  /**
   * Logs adapter initialization success
   */
  logAdapterInitSuccess() {
    this.success(`${this.siteName} adapter initialized`);
  }

  /**
   * Logs URL processing start
   * @param {string} url - URL being processed
   * @param {number} index - URL index
   * @param {number} total - Total URLs
   */
  logUrlStart(url, index, total) {
    this.info(`Processing URL ${index}/${total}: ${url}`);
  }

  /**
   * Logs page processing
   * @param {number} pageNum - Page number
   * @param {string} url - Page URL
   */
  logPageProcessing(pageNum, url) {
    this.info(`Processing page ${pageNum}: ${url}`);
  }

  /**
   * Logs property extraction
   * @param {number} count - Number of properties extracted
   * @param {string} source - Source (page, JavaScript, DOM)
   */
  logPropertiesExtracted(count, source = 'page') {
    this.success(`Extracted ${count} properties from ${source}`);
  }

  /**
   * Logs extraction method
   * @param {string} method - Extraction method (JavaScript, DOM, etc.)
   */
  logExtractionMethod(method) {
    this.info(`Using ${method} extraction method`);
  }

  /**
   * Logs extraction fallback
   * @param {string} from - Original method
   * @param {string} to - Fallback method
   */
  logExtractionFallback(from, to) {
    this.warn(`${from} extraction failed, falling back to ${to}`);
  }

  /**
   * Logs statistics
   * @param {Object} stats - Statistics object
   */
  logStatistics(stats) {
    this.info('='.repeat(50));
    this.info(`${this.siteName.toUpperCase()} STATISTICS`);
    this.info('='.repeat(50));
    this.info(`URLs processed: ${stats.urlsProcessed || 0}`);
    this.info(`Pages processed: ${stats.pagesProcessed || 0}`);
    this.info(`Properties found: ${stats.propertiesFound || 0}`);
    this.info(`With distress signals: ${stats.propertiesWithDistress || 0}`);
    if (stats.errors && stats.errors > 0) {
      this.warn(`Errors encountered: ${stats.errors}`);
    }
    this.info('='.repeat(50));
  }

  /**
   * Logs cross-site summary
   * @param {Object} aggregated - Aggregated statistics
   */
  logCrossSiteSummary(aggregated) {
    console.log('\n' + '='.repeat(50));
    console.log('MULTI-SITE SCRAPING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Sites processed: ${aggregated.totalSites}`);
    console.log(`Total URLs: ${aggregated.totalUrlsProcessed}`);
    console.log(`Total pages: ${aggregated.totalPagesProcessed}`);
    console.log(`Total properties: ${aggregated.totalPropertiesFound}`);
    console.log(`With distress signals: ${aggregated.totalPropertiesWithDistress}`);
    
    if (aggregated.totalErrors > 0) {
      console.warn(`⚠️  Total errors: ${aggregated.totalErrors}`);
    }
    
    console.log('\nPer-site breakdown:');
    Object.entries(aggregated.perSite).forEach(([site, stats]) => {
      console.log(`  ${site}: ${stats.propertiesFound} properties from ${stats.pagesProcessed} pages`);
    });
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Logs site detection results
   * @param {Map} grouped - Grouped URLs by site
   */
  logSiteDetection(grouped) {
    this.info('Site detection complete:');
    grouped.forEach((urls, site) => {
      this.info(`  ${site}: ${urls.length} URL(s)`);
    });
  }

  /**
   * Logs deduplication results
   * @param {number} before - Count before deduplication
   * @param {number} after - Count after deduplication
   */
  logDeduplication(before, after) {
    const removed = before - after;
    if (removed > 0) {
      this.info(`Deduplication: ${before} → ${after} (removed ${removed} duplicates)`);
    } else {
      this.info(`Deduplication: No duplicates found (${before} properties)`);
    }
  }

  /**
   * Logs filtering results
   * @param {number} before - Count before filtering
   * @param {number} after - Count after filtering
   * @param {string} filterType - Type of filter applied
   */
  logFiltering(before, after, filterType = 'distress') {
    const filtered = before - after;
    if (filtered > 0) {
      this.info(`${filterType} filtering: ${before} → ${after} (filtered ${filtered})`);
    }
  }

  /**
   * Logs monitoring mode status
   * @param {number} newCount - Number of new properties
   * @param {number} totalCount - Total properties checked
   */
  logMonitoringMode(newCount, totalCount) {
    this.info(`Monitoring mode: ${newCount} new properties (${totalCount} total checked)`);
  }

  /**
   * Logs progress
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {string} unit - Unit name (properties, pages, etc.)
   */
  logProgress(current, total, unit = 'items') {
    const percentage = Math.round((current / total) * 100);
    this.info(`Progress: ${current}/${total} ${unit} (${percentage}%)`);
  }

  /**
   * Logs rate limiting delay
   * @param {number} delayMs - Delay in milliseconds
   */
  logRateLimitDelay(delayMs) {
    this.debug(`Rate limit delay: ${delayMs}ms`);
  }

  /**
   * Logs proxy usage
   * @param {boolean} enabled - Whether proxy is enabled
   * @param {Array<string>} groups - Proxy groups
   */
  logProxyConfig(enabled, groups = []) {
    if (enabled) {
      const groupsStr = groups.length > 0 ? ` (groups: ${groups.join(', ')})` : '';
      this.info(`Proxy enabled${groupsStr}`);
    } else {
      this.info('Proxy disabled');
    }
  }

  /**
   * Creates a child logger with additional context
   * @param {string} additionalContext - Additional context to add
   * @returns {Logger} New logger instance
   */
  child(additionalContext) {
    const childSiteName = this.siteName 
      ? `${this.siteName}:${additionalContext}`
      : additionalContext;
    return new Logger(childSiteName);
  }
}

/**
 * Creates a logger instance
 * @param {string} siteName - Site name for context
 * @returns {Logger} Logger instance
 */
function createLogger(siteName = null) {
  return new Logger(siteName);
}

/**
 * Global logger without site context
 */
const globalLogger = new Logger();

module.exports = {
  Logger,
  createLogger,
  globalLogger
};
