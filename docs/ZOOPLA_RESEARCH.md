# Zoopla Page Structure Research

## Overview

Zoopla is a UK property portal similar to Rightmove. This document outlines the page structure and data extraction strategy for implementing the Zoopla adapter.

## URL Patterns

### Search Results Pages

```
https://www.zoopla.co.uk/for-sale/property/london/
https://www.zoopla.co.uk/for-sale/property/manchester/
https://www.zoopla.co.uk/for-sale/houses/london/
```

### Property Detail Pages

```
https://www.zoopla.co.uk/for-sale/details/{listing_id}
https://www.zoopla.co.uk/for-sale/details/12345678
```

### Pagination

```
https://www.zoopla.co.uk/for-sale/property/london/?pn=2
https://www.zoopla.co.uk/for-sale/property/london/?pn=3
```

## Data Structure

### JavaScript Data Object

Zoopla typically embeds property data in JavaScript objects within the page:

```javascript
window.__PRELOADED_STATE__ = {
  listing: {
    regular: {
      listings: [
        {
          listing_id: "12345678",
          displayable_address: "High Street, London SW1A 1AA",
          price: "350000",
          num_bedrooms: 2,
          num_bathrooms: 1,
          property_type: "Flat",
          description: "A beautiful property...",
          image_url: "https://lid.zoocdn.com/...",
          first_published_date: "2024-01-15",
          agent_name: "Example Estate Agents",
          agent_phone: "020 1234 5678",
        },
      ],
    },
  },
};
```

### Alternative Data Sources

If `__PRELOADED_STATE__` is not available, Zoopla may use:

- `window.__INITIAL_STATE__`
- JSON-LD structured data in `<script type="application/ld+json">`
- Data attributes on HTML elements

## Field Mapping

### Search Results Page Fields

| Zoopla Field           | Unified Schema Field | Notes                  |
| ---------------------- | -------------------- | ---------------------- |
| `listing_id`           | `id`                 | Convert to string      |
| `displayable_address`  | `address`            | Direct mapping         |
| `price`                | `price`              | Format with £ symbol   |
| `num_bedrooms`         | `bedrooms`           | Direct mapping         |
| `num_bathrooms`        | `bathrooms`          | Direct mapping         |
| `property_type`        | `propertyType`       | Direct mapping         |
| `description`          | `description`        | Direct mapping         |
| `image_url`            | `images[0]`          | Single image on search |
| `first_published_date` | `addedOn`            | ISO 8601 format        |
| `agent_name`           | `agent`              | Direct mapping         |
| `agent_phone`          | `agentPhone`         | Direct mapping         |

### Property Detail Page Fields

| Zoopla Field           | Unified Schema Field    | Notes                   |
| ---------------------- | ----------------------- | ----------------------- |
| `listing_id`           | `id`                    | Convert to string       |
| `details_url`          | `url`                   | Full property URL       |
| `displayable_address`  | `address`               | Full address            |
| `display_address`      | `displayAddress`        | Formatted address       |
| `price`                | `price`                 | Formatted price         |
| `detailed_description` | `description`           | Full description        |
| `num_bedrooms`         | `bedrooms`              | Number of bedrooms      |
| `num_bathrooms`        | `bathrooms`             | Number of bathrooms     |
| `property_type`        | `propertyType`          | Property type           |
| `tenure`               | `tenure`                | Freehold/Leasehold      |
| `image_urls`           | `images`                | Array of images         |
| `latitude`             | `coordinates.latitude`  | Latitude                |
| `longitude`            | `coordinates.longitude` | Longitude               |
| `agent_name`           | `agent`                 | Agent name              |
| `agent_phone`          | `agentPhone`            | Agent phone             |
| `agent_logo`           | `agentLogo`             | Agent logo URL          |
| `features`             | `features`              | Property features array |
| `first_published_date` | `addedOn`               | First listed date       |
| `last_published_date`  | `listingUpdateDate`     | Last updated date       |

## Pagination Structure

### HTML Structure

```html
<nav class="pagination">
  <a href="?pn=2" data-testid="pagination-next">Next</a>
</nav>
```

### Detection Strategy

1. Look for `data-testid="pagination-next"` attribute
2. Extract `href` attribute for next page URL
3. If no next link found, we're on the last page

### Page Number Pattern

- Page 1: No `pn` parameter or `pn=1`
- Page 2: `?pn=2`
- Page 3: `?pn=3`
- etc.

## Extraction Strategy

### Phase 1: Search Results

1. Navigate to search URL
2. Extract `window.__PRELOADED_STATE__` or equivalent
3. Parse `listing.regular.listings` array
4. Map each listing to basic property format
5. Apply distress detection
6. Detect pagination links

### Phase 2: Property Details

1. Navigate to property detail URL
2. Extract `window.__PRELOADED_STATE__.listing.propertyDetails`
3. Map all available fields to unified schema
4. Extract coordinates, agent info, features
5. Apply distress detection to full description

## Postcode Extraction

Zoopla addresses typically include UK postcodes:

```
"High Street, London SW1A 1AA"
```

Use the existing `extractPostcode` utility:

```javascript
const postcode = extractPostcode(address);
// Returns: { outcode: "SW1A", incode: "1AA", full: "SW1A 1AA" }
```

## Image URLs

Zoopla uses CDN URLs:

```
https://lid.zoocdn.com/645/430/{image_id}.jpg
```

Images may need to be:

- Converted to absolute URLs
- Filtered for valid formats
- Deduplicated

## Agent Information

Zoopla provides agent details:

```javascript
{
  agent_name: "Example Estate Agents",
  agent_phone: "020 1234 5678",
  agent_logo: "https://st.zoocdn.com/zoopla_static_agent_logo.png",
  agent_address: "123 High Street, London"
}
```

## Date Formats

Zoopla uses ISO 8601 date strings:

```
"2024-01-15T10:30:00Z"
```

These can be used directly in the unified schema.

## Distress Detection

Apply the same distress keywords to Zoopla descriptions:

- "price reduced"
- "chain free"
- "auction"
- "motivated seller"
- etc.

Use the existing `detectDistress` function from the Rightmove adapter.

## Error Handling

### Common Issues

1. **Missing `__PRELOADED_STATE__`**

   - Fallback to DOM parsing
   - Look for JSON-LD structured data
   - Log warning and continue

2. **Malformed Data**

   - Validate each field
   - Set missing fields to null
   - Log warnings for unexpected formats

3. **Rate Limiting**

   - Respect Zoopla's rate limits
   - Use delays between requests
   - Handle 429 responses gracefully

4. **Changed Page Structure**
   - Log detailed errors
   - Provide fallback extraction methods
   - Alert for manual review

## Testing Strategy

### Unit Tests

- Test field mapping for each data type
- Test postcode extraction
- Test image URL formatting
- Test date parsing

### Integration Tests

- Test with real Zoopla URLs (if available)
- Test pagination handling
- Test error scenarios
- Test with various property types

### Mock Data

Create mock Zoopla responses for testing:

```javascript
const mockZooplaListing = {
  listing_id: "12345678",
  displayable_address: "Baker Street, London NW1 6XE",
  price: "425000",
  num_bedrooms: 3,
  num_bathrooms: 2,
  property_type: "Flat",
  description: "Spacious apartment...",
  image_url: "https://lid.zoocdn.com/645/430/image.jpg",
  first_published_date: "2024-01-10T08:00:00Z",
  agent_name: "Zoopla Estate Agents",
  agent_phone: "020 9876 5432",
};
```

## Implementation Checklist

- [ ] Create ZooplaAdapter class extending BaseSiteAdapter
- [ ] Implement `extractFromJavaScript` for search results
- [ ] Implement `extractFromDOM` as fallback
- [ ] Implement `extractFullPropertyDetails` for detail pages
- [ ] Implement `buildPageUrl` for pagination
- [ ] Implement `isValidUrl` for Zoopla URL detection
- [ ] Implement `normalizeProperty` to add source fields
- [ ] Add Zoopla-specific utilities (date parsing, image formatting)
- [ ] Create unit tests for all methods
- [ ] Create integration tests with mock data
- [ ] Update AdapterFactory to recognize Zoopla URLs
- [ ] Update actor.json to include Zoopla in site enum
- [ ] Document Zoopla-specific fields in additionalData

## Site-Specific Considerations

### Differences from Rightmove

1. **Data Structure**: Uses `__PRELOADED_STATE__` instead of `window.PAGE_MODEL`
2. **Field Names**: Different naming conventions (e.g., `num_bedrooms` vs `bedrooms`)
3. **Pagination**: Uses `data-testid` attributes instead of class names
4. **Images**: Different CDN structure
5. **Agent Info**: More detailed agent information available

### Similarities to Rightmove

1. **JavaScript Data**: Both embed data in JavaScript objects
2. **Pagination**: Both use query parameters for page numbers
3. **Property Types**: Similar property type classifications
4. **UK Focus**: Both UK-specific with postcode support
5. **Distress Keywords**: Same keywords apply

## Next Steps

1. Implement ZooplaAdapter skeleton
2. Add basic field mapping
3. Test with mock data
4. Implement pagination
5. Add error handling
6. Create comprehensive tests
7. Integrate with AdapterFactory
8. Update documentation

## References

- Zoopla Website: https://www.zoopla.co.uk
- Unified Schema: `docs/UNIFIED_SCHEMA.md`
- Base Adapter: `src/adapters/base-adapter.js`
- Rightmove Adapter: `src/adapters/rightmove-adapter.js` (reference implementation)

---

_Research completed: November 30, 2025_  
_Ready for implementation_
