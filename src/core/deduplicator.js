/**
 * Cross-Site Deduplicator
 * 
 * Identifies and merges duplicate properties that appear on multiple portals
 */

const { normalizeAddress } = require('../utils/field-mapping');

class Deduplicator {
  /**
   * Deduplicates properties across multiple sites
   * @param {Array<Object>} properties - Array of properties from all sites
   * @returns {Array<Object>} Deduplicated properties
   */
  static deduplicate(properties) {
    if (!properties || properties.length === 0) {
      return [];
    }

    console.log(`\n=== Cross-Site Deduplication ===`);
    console.log(`Total properties before deduplication: ${properties.length}`);

    // Group properties by normalized address
    const groups = this._groupByAddress(properties);

    // Process each group
    const deduplicated = [];
    let duplicatesFound = 0;

    for (const [address, props] of groups) {
      if (props.length === 1) {
        // No duplicates for this address
        deduplicated.push(props[0]);
      } else {
        // Multiple properties with same address - merge them
        const merged = this._mergeProperties(props);
        deduplicated.push(merged);
        duplicatesFound += props.length - 1;
      }
    }

    console.log(`Duplicate groups found: ${groups.size - deduplicated.length}`);
    console.log(`Properties after deduplication: ${deduplicated.length}`);
    console.log(`Duplicates removed: ${duplicatesFound}`);
    console.log(`=====================================\n`);

    return deduplicated;
  }

  /**
   * Groups properties by normalized address
   * @param {Array<Object>} properties - Properties to group
   * @returns {Map<string, Array<Object>>} Map of address to properties
   */
  static _groupByAddress(properties) {
    const groups = new Map();

    for (const property of properties) {
      const key = this._generateKey(property);

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(property);
    }

    return groups;
  }

  /**
   * Generates a unique key for property grouping
   * Uses normalized address and postcode
   * @param {Object} property - Property object
   * @returns {string} Unique key
   */
  static _generateKey(property) {
    const address = normalizeAddress(property.address || '');
    const postcode = `${property.outcode || ''} ${property.incode || ''}`.trim();

    // Combine address and postcode for matching
    return `${address}|${postcode}`.toLowerCase();
  }

  /**
   * Merges multiple properties into one
   * Keeps the most complete data for each field
   * @param {Array<Object>} properties - Properties to merge
   * @returns {Object} Merged property
   */
  static _mergeProperties(properties) {
    if (properties.length === 1) {
      return properties[0];
    }

    // Sort by completeness (most fields filled)
    const sorted = properties.sort((a, b) => {
      const aFields = this._countFilledFields(a);
      const bFields = this._countFilledFields(b);
      return bFields - aFields;
    });

    // Start with the most complete property
    const merged = { ...sorted[0] };

    // Track sources
    merged.sources = properties.map(p => p.source || p._site).filter(Boolean);
    merged.duplicateOf = properties.map(p => p.id).filter(Boolean);
    merged._isDuplicate = true;

    // Merge fields from other properties
    for (let i = 1; i < sorted.length; i++) {
      const property = sorted[i];

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
        if (typeof newValue === 'object' && typeof currentValue === 'object' && 
            !Array.isArray(newValue) && !Array.isArray(currentValue)) {
          merged[key] = { ...currentValue, ...newValue };
          return;
        }
      });
    }

    return merged;
  }

  /**
   * Counts filled fields in a property
   * @param {Object} property - Property to count
   * @returns {number} Number of filled fields
   */
  static _countFilledFields(property) {
    return Object.values(property).filter(v => 
      v !== null && v !== undefined && v !== ''
    ).length;
  }

  /**
   * Gets deduplication statistics
   * @param {Array<Object>} original - Original properties
   * @param {Array<Object>} deduplicated - Deduplicated properties
   * @returns {Object} Statistics object
   */
  static getStatistics(original, deduplicated) {
    const duplicatesRemoved = original.length - deduplicated.length;
    const duplicateGroups = deduplicated.filter(p => p._isDuplicate).length;

    return {
      originalCount: original.length,
      deduplicatedCount: deduplicated.length,
      duplicatesRemoved,
      duplicateGroups,
      deduplicationRate: original.length > 0 
        ? ((duplicatesRemoved / original.length) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = Deduplicator;
