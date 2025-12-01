# Multi-Site Property Scraping Guide

## Overview

Version 2.1.0 introduces multi-site support, allowing you to scrape properties from multiple UK property portals in a single run. The scraper automatically detects which portal each URL belongs to and applies the appropriate extraction logic.

## Supported Portals

| Portal          | Status             | URL Pattern       | Features                                                            |
| --------------- | ------------------ | ----------------- | ------------------------------------------------------------------- |
| **Rightmove**   | ✅ Fully Supported | `rightmove.co.uk` | All features including monitoring, delisting tracker, price history |
| **Zoopla**      | ✅ Fully Supported | `zoopla.co.uk`    | Full property details, distress detection, pagination               |
| **OnTheMarket** | 🔜 Coming Soon     | `onthemarket.com` | Planned for future release                                          |

## Quick Start

### Single Portal (Backward Compatible)

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "maxItems": 50
}
```

### Multiple Portals

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    },
    {
      "url": "https://www.zoopla.co.uk/for-sale/property/london/"
    }
  ],
  "maxItems": 100,
  "crossSiteDeduplication": true
}
```

## New Features

### 1. Automatic Site Detection

The scraper automatically detects which portal each URL belongs to:

```javascript
// Rightmove URL
"https://www.rightmove.co.uk/property-for-sale/...";
// → Routes to Rightmove adapter

// Zoopla URL
"https://www.zoopla.co.uk/for-sale/property/...";
// → Routes to Zoopla adapter
```

No manual configuration needed!

### 2. Cross-Site Deduplication

Properties that appear on multiple portals are automatically identified and merged:

```json
{
  "crossSiteDeduplication": true
}
```

**How it works:**

- Properties are matched by address and postcode
- The most complete data is kept
- All sources are tracked in the `sources` array
- Duplicate IDs are listed in `duplicateOf`

**Example output:**

```json
{
  "id": "123456789",
  "address": "High Street, London SW1A 1AA",
  "price": "£350,000",
  "source": "rightmove",
  "sources": ["rightmove", "zoopla"],
  "duplicateOf": ["123456789", "555666777"],
  "_isDuplicate": true
}
```

### 3. Site-Specific Configuration

Configure settings per portal:

```json
{
  "startUrls": [...],
  "maxItems": 200,
  "maxPages": 10,
  "siteConfig": {
    "rightmove": {
      "enabled": true,
      "maxPages": 15,
      "maxItems": 150,
      "distressKeywords": ["reduced", "chain free"]
    },
    "zoopla": {
      "enabled": true,
      "maxPages": 5,
      "maxItems": 50,
      "distressKeywords": ["auction", "motivated"]
    }
  }
}
```

**Site-specific settings override global settings:**

- `enabled` - Enable/disable specific portal
- `maxPages` - Portal-specific page limit
- `maxItems` - Portal-specific item limit
- `distressKeywords` - Portal-specific keywords (merged with global)

### 4. Enhanced Logging

Multi-site runs include detailed per-portal statistics:

```
=== Creating rightmove adapter ===
Adapter created: rightmove
✓ rightmove adapter initialized

[RIGHTMOVE] Extracting properties from search page...
[RIGHTMOVE] Found 24 properties on page

=== RIGHTMOVE Statistics ===
URLs processed: 1
Pages processed: 5
Properties found: 120
With distress signals: 15
=====================================

=== Creating zoopla adapter ===
Adapter created: zoopla
✓ zoopla adapter initialized

[ZOOPLA] Extracting properties from JavaScript data...
[ZOOPLA] Found 20 properties in JavaScript data

=== ZOOPLA Statistics ===
URLs processed: 1
Pages processed: 3
Properties found: 60
With distress signals: 8
=====================================

=== Cross-Site Deduplication ===
Total properties before deduplication: 180
Duplicate groups found: 5
Properties after deduplication: 175
Duplicates removed: 5
Deduplication rate: 2.78%
==============================

=== MULTI-SITE SUMMARY ===
Sites processed: 2
Total URLs: 2
Total pages: 8
Total properties: 175
With distress: 23
==========================
```

## Unified Output Schema

All properties follow the same schema regardless of source portal:

### Core Fields (All Portals)

```json
{
  "id": "string",
  "url": "string",
  "source": "rightmove|zoopla",
  "sourceUrl": "string",
  "address": "string",
  "displayAddress": "string",
  "price": "string",
  "description": "string",
  "propertyType": "string",
  "bedrooms": "number|null",
  "bathrooms": "number|null"
}
```

### Location Data

```json
{
  "coordinates": {
    "latitude": "number",
    "longitude": "number"
  },
  "outcode": "string",
  "incode": "string",
  "countryCode": "GB"
}
```

### Distress Detection (Universal)

```json
{
  "distressKeywordsMatched": ["price reduced", "chain free"],
  "distressScoreRule": 4
}
```

### Cross-Site Fields

```json
{
  "sources": ["rightmove", "zoopla"],
  "duplicateOf": ["123456789", "555666777"],
  "_isDuplicate": true
}
```

### Portal-Specific Data

Portal-specific fields are stored in `additionalData`:

```json
{
  "additionalData": {
    "zooplaListingId": "987654321",
    "zooplaAgentId": "12345"
  }
}
```

## Portal Comparison

### Feature Availability

| Feature               | Rightmove | Zoopla     |
| --------------------- | --------- | ---------- |
| Basic property data   | ✅        | ✅         |
| Full property details | ✅        | ✅         |
| Coordinates           | ✅        | ✅         |
| Agent information     | ✅        | ✅         |
| Property features     | ✅        | ✅         |
| Images                | ✅        | ✅         |
| Floor plans           | ✅        | ⚠️ Limited |
| Brochures             | ✅        | ❌         |
| Nearest stations      | ✅        | ⚠️ Limited |
| Price history         | ✅        | ❌         |
| Monitoring mode       | ✅        | ✅         |
| Delisting tracker     | ✅        | ✅         |
| Distress detection    | ✅        | ✅         |

### Data Quality

**Rightmove:**

- Most comprehensive data
- Detailed agent information
- Rich media (brochures, floor plans)
- Price history available
- Extensive transport links

**Zoopla:**

- Good basic data
- Coordinates always available
- Simpler agent information
- Fewer media files
- Limited transport data

## Best Practices

### 1. Use Cross-Site Deduplication

Enable deduplication when scraping multiple portals:

```json
{
  "crossSiteDeduplication": true
}
```

This prevents duplicate properties in your results.

### 2. Configure Per-Portal Limits

Set appropriate limits for each portal:

```json
{
  "siteConfig": {
    "rightmove": {
      "maxPages": 10,
      "maxItems": 200
    },
    "zoopla": {
      "maxPages": 5,
      "maxItems": 100
    }
  }
}
```

### 3. Use Portal-Specific Keywords

Different portals may use different terminology:

```json
{
  "distressKeywords": ["reduced", "chain free", "motivated"],
  "siteConfig": {
    "zoopla": {
      "distressKeywords": ["auction", "quick sale"]
    }
  }
}
```

### 4. Monitor Performance

Check per-portal statistics to optimize your scraping:

```
=== RIGHTMOVE Statistics ===
Properties found: 150
Pages processed: 10
Average: 15 properties/page

=== ZOOPLA Statistics ===
Properties found: 80
Pages processed: 8
Average: 10 properties/page
```

## Error Handling

### Portal Isolation

If one portal fails, others continue:

```
❌ Error in zoopla adapter (page load timeout)
Message: Navigation timeout exceeded
Continuing with other sites...

✓ rightmove adapter completed successfully
Properties found: 120
```

### Unsupported URLs

Unsupported URLs are logged and skipped:

```
⚠️ Failed to detect site for URL: https://www.example.com
Error: Unknown property site: example.com
```

## Migration Guide

### From v2.0 to v2.1

**No changes required!** Version 2.1 is 100% backward compatible.

Existing configurations work unchanged:

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/..."
    }
  ]
}
```

### Adding Zoopla

Simply add Zoopla URLs to your existing configuration:

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/..."
    },
    {
      "url": "https://www.zoopla.co.uk/..."
    }
  ]
}
```

## Troubleshooting

### Issue: Duplicates Not Being Detected

**Solution:** Ensure addresses and postcodes are present:

```json
{
  "fullPropertyDetails": true,
  "crossSiteDeduplication": true
}
```

### Issue: One Portal Returns No Results

**Solution:** Check portal-specific configuration:

```json
{
  "siteConfig": {
    "zoopla": {
      "enabled": true,
      "maxPages": 10
    }
  }
}
```

### Issue: Different Field Availability

**Solution:** Check portal comparison table above. Some fields are portal-specific.

## Examples

### Example 1: Basic Multi-Site Scraping

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    },
    {
      "url": "https://www.zoopla.co.uk/for-sale/property/london/"
    }
  ],
  "maxItems": 100,
  "fullPropertyDetails": true,
  "crossSiteDeduplication": true
}
```

### Example 2: Portal-Specific Configuration

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    },
    {
      "url": "https://www.zoopla.co.uk/for-sale/property/manchester/"
    }
  ],
  "maxItems": 200,
  "siteConfig": {
    "rightmove": {
      "enabled": true,
      "maxPages": 15,
      "maxItems": 150
    },
    "zoopla": {
      "enabled": true,
      "maxPages": 5,
      "maxItems": 50
    }
  },
  "crossSiteDeduplication": true,
  "onlyDistressed": true
}
```

### Example 3: Monitoring Mode Across Portals

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    },
    {
      "url": "https://www.zoopla.co.uk/for-sale/property/london/"
    }
  ],
  "monitoringMode": true,
  "fullPropertyDetails": true,
  "crossSiteDeduplication": true
}
```

## API Reference

See [UNIFIED_SCHEMA.md](./UNIFIED_SCHEMA.md) for complete schema documentation.

## Support

For issues or questions:

- Check the [main README](../README.md)
- Review [UNIFIED_SCHEMA.md](./UNIFIED_SCHEMA.md)
- Check Apify console logs for detailed error messages

---

**Version:** 2.1.0  
**Last Updated:** November 30, 2025  
**Status:** Production Ready
