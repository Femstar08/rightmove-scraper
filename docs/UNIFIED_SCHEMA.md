# Unified Property Schema Documentation

## Overview

The Unified Property Schema is a standardized output format used across all property portals supported by this scraper. All adapters (Rightmove, Zoopla, etc.) map their data to this schema to ensure consistency and enable cross-site features like deduplication.

## Schema Version

Current Version: **1.0.0**

## Required Fields

The following fields MUST be present in every property object:

- `id` - Unique property identifier
- `url` - Full URL to the property listing
- `source` - Portal name
- `address` - Full property address
- `price` - Property price

## Field Definitions

### Core Identification

| Field       | Type   | Required | Description                                   | Example                                              |
| ----------- | ------ | -------- | --------------------------------------------- | ---------------------------------------------------- |
| `id`        | string | ✅       | Unique property identifier from source portal | `"123456789"`                                        |
| `url`       | string | ✅       | Full URL to the property listing              | `"https://www.rightmove.co.uk/properties/123456789"` |
| `source`    | string | ✅       | Portal name                                   | `"rightmove"`, `"zoopla"`                            |
| `sourceUrl` | string | ❌       | Original URL (may differ from url)            | `"https://www.rightmove.co.uk/properties/123456789"` |

### Basic Property Information

| Field            | Type   | Required | Description                | Example                                   |
| ---------------- | ------ | -------- | -------------------------- | ----------------------------------------- |
| `address`        | string | ✅       | Full property address      | `"High Street, London SW1A 1AA"`          |
| `displayAddress` | string | ❌       | Formatted display address  | `"High Street, Westminster, London"`      |
| `price`          | string | ✅       | Property price (formatted) | `"£350,000"`                              |
| `description`    | string | ❌       | Property description text  | `"A beautiful 2-bedroom flat..."`         |
| `propertyType`   | string | ❌       | Type of property           | `"Detached"`, `"Flat"`, `"Semi-Detached"` |

### Property Details

| Field       | Type   | Required | Description         | Example |
| ----------- | ------ | -------- | ------------------- | ------- |
| `bedrooms`  | number | ❌       | Number of bedrooms  | `2`     |
| `bathrooms` | number | ❌       | Number of bathrooms | `1`     |

### Location Data

| Field                   | Type   | Required | Description            | Example                                     |
| ----------------------- | ------ | -------- | ---------------------- | ------------------------------------------- |
| `coordinates`           | object | ❌       | Geographic coordinates | `{ latitude: 51.5014, longitude: -0.1419 }` |
| `coordinates.latitude`  | number | ❌       | Latitude               | `51.5014`                                   |
| `coordinates.longitude` | number | ❌       | Longitude              | `-0.1419`                                   |
| `outcode`               | string | ❌       | UK postcode outcode    | `"SW1A"`                                    |
| `incode`                | string | ❌       | UK postcode incode     | `"1AA"`                                     |
| `countryCode`           | string | ❌       | ISO country code       | `"GB"`                                      |

### Property Characteristics

| Field            | Type   | Required | Description      | Example                     |
| ---------------- | ------ | -------- | ---------------- | --------------------------- |
| `tenure`         | string | ❌       | Property tenure  | `"Freehold"`, `"Leasehold"` |
| `councilTaxBand` | string | ❌       | Council tax band | `"D"`                       |

### Media

| Field        | Type  | Required | Description                | Example                            |
| ------------ | ----- | -------- | -------------------------- | ---------------------------------- |
| `images`     | array | ❌       | Array of image URLs        | `["https://...jpg"]`               |
| `floorplans` | array | ❌       | Array of floorplan objects | `[{ url: "...", caption: "..." }]` |
| `brochures`  | array | ❌       | Array of brochure objects  | `[{ url: "...", caption: "..." }]` |

### Agent Information

| Field                 | Type   | Required | Description            | Example                     |
| --------------------- | ------ | -------- | ---------------------- | --------------------------- |
| `agent`               | string | ❌       | Agent or agency name   | `"Example Estate Agents"`   |
| `agentPhone`          | string | ❌       | Agent contact phone    | `"020 1234 5678"`           |
| `agentLogo`           | string | ❌       | Agent logo image URL   | `"https://...png"`          |
| `agentDisplayAddress` | string | ❌       | Agent office address   | `"123 High Street, London"` |
| `agentProfileUrl`     | string | ❌       | Agent profile page URL | `"https://..."`             |

### Features and Amenities

| Field             | Type  | Required | Description                 | Example                        |
| ----------------- | ----- | -------- | --------------------------- | ------------------------------ |
| `features`        | array | ❌       | Property features/amenities | `["Double glazing", "Garden"]` |
| `nearestStations` | array | ❌       | Nearby transport stations   | See below                      |

**nearestStations Object Structure:**

```javascript
{
  name: "Westminster",
  types: ["tube"],
  distance: 0.3,
  unit: "miles"
}
```

### Dates and Timeline

| Field               | Type   | Required | Description                  | Example                  |
| ------------------- | ------ | -------- | ---------------------------- | ------------------------ |
| `addedOn`           | string | ❌       | Date first listed (ISO 8601) | `"2024-01-15T10:30:00Z"` |
| `firstVisibleDate`  | string | ❌       | First visible date on portal | `"2024-01-15T10:30:00Z"` |
| `listingUpdateDate` | string | ❌       | Last update date             | `"2024-01-20T14:00:00Z"` |

### Status Flags

| Field       | Type    | Required | Description         | Example |
| ----------- | ------- | -------- | ------------------- | ------- |
| `published` | boolean | ❌       | Currently published | `true`  |
| `archived`  | boolean | ❌       | Has been archived   | `false` |
| `sold`      | boolean | ❌       | Has been sold       | `false` |

### Distress Detection

| Field                     | Type   | Required | Description               | Example                           |
| ------------------------- | ------ | -------- | ------------------------- | --------------------------------- |
| `distressKeywordsMatched` | array  | ❌       | Matched distress keywords | `["price reduced", "chain free"]` |
| `distressScoreRule`       | number | ❌       | Distress score (0-10)     | `5`                               |

### Price History

| Field          | Type  | Required | Description              | Example   |
| -------------- | ----- | -------- | ------------------------ | --------- |
| `priceHistory` | array | ❌       | Historical price changes | See below |

**priceHistory Object Structure:**

```javascript
{
  date: "2024-01-10T00:00:00Z",
  price: "£375,000"
}
```

### Cross-Site Deduplication

These fields are only present when cross-site deduplication is enabled and duplicates are found:

| Field          | Type    | Required | Description                | Example                      |
| -------------- | ------- | -------- | -------------------------- | ---------------------------- |
| `sources`      | array   | ❌       | Portal names if duplicate  | `["rightmove", "zoopla"]`    |
| `duplicateOf`  | array   | ❌       | Property IDs of duplicates | `["123456789", "555666777"]` |
| `_isDuplicate` | boolean | ❌       | Flag for merged duplicate  | `true`                       |

### Site-Specific Data

| Field            | Type   | Required | Description            | Example                            |
| ---------------- | ------ | -------- | ---------------------- | ---------------------------------- |
| `additionalData` | object | ❌       | Portal-specific fields | `{ zooplaListingId: "987654321" }` |

### Metadata

| Field        | Type    | Required | Description                         | Example                  |
| ------------ | ------- | -------- | ----------------------------------- | ------------------------ |
| `_scrapedAt` | string  | ❌       | Scrape timestamp (ISO 8601)         | `"2024-01-25T09:00:00Z"` |
| `_site`      | string  | ❌       | Alias for source (backward compat)  | `"rightmove"`            |
| `_isNew`     | boolean | ❌       | New property flag (monitoring mode) | `true`                   |

## Complete Examples

### Example 1: Rightmove Property

```json
{
  "id": "123456789",
  "url": "https://www.rightmove.co.uk/properties/123456789",
  "source": "rightmove",
  "sourceUrl": "https://www.rightmove.co.uk/properties/123456789",
  "address": "High Street, London SW1A 1AA",
  "displayAddress": "High Street, Westminster, London",
  "price": "£350,000",
  "description": "A beautiful 2-bedroom flat in the heart of Westminster...",
  "propertyType": "Flat",
  "bedrooms": 2,
  "bathrooms": 1,
  "coordinates": {
    "latitude": 51.5014,
    "longitude": -0.1419
  },
  "outcode": "SW1A",
  "incode": "1AA",
  "countryCode": "GB",
  "tenure": "Leasehold",
  "councilTaxBand": "D",
  "images": [
    "https://media.rightmove.co.uk/123k/122456/123456789/122456_123_IMG_00_0000.jpeg"
  ],
  "floorplans": [],
  "brochures": [],
  "agent": "Example Estate Agents",
  "agentPhone": "020 1234 5678",
  "agentLogo": "https://media.rightmove.co.uk/logo.png",
  "agentDisplayAddress": "123 High Street, London",
  "agentProfileUrl": "https://www.rightmove.co.uk/estate-agents/agent/Example/123.html",
  "features": ["Double glazing", "Garden", "Parking"],
  "nearestStations": [
    {
      "name": "Westminster",
      "types": ["tube"],
      "distance": 0.3,
      "unit": "miles"
    }
  ],
  "addedOn": "2024-01-15T10:30:00Z",
  "firstVisibleDate": "2024-01-15T10:30:00Z",
  "listingUpdateDate": "2024-01-20T14:00:00Z",
  "published": true,
  "archived": false,
  "sold": false,
  "distressKeywordsMatched": [],
  "distressScoreRule": 0,
  "priceHistory": [],
  "_scrapedAt": "2024-01-25T09:00:00Z",
  "_site": "rightmove"
}
```

### Example 2: Zoopla Property

```json
{
  "id": "987654321",
  "url": "https://www.zoopla.co.uk/for-sale/details/987654321",
  "source": "zoopla",
  "sourceUrl": "https://www.zoopla.co.uk/for-sale/details/987654321",
  "address": "Baker Street, London NW1 6XE",
  "displayAddress": "Baker Street, Marylebone, London",
  "price": "£425,000",
  "description": "Spacious 3-bedroom apartment with modern fixtures...",
  "propertyType": "Flat",
  "bedrooms": 3,
  "bathrooms": 2,
  "coordinates": {
    "latitude": 51.5237,
    "longitude": -0.1585
  },
  "outcode": "NW1",
  "incode": "6XE",
  "countryCode": "GB",
  "tenure": "Freehold",
  "councilTaxBand": "E",
  "images": ["https://lid.zoocdn.com/645/430/image.jpg"],
  "floorplans": [],
  "brochures": [],
  "agent": "Zoopla Estate Agents",
  "agentPhone": "020 9876 5432",
  "agentLogo": "https://st.zoocdn.com/zoopla_static_agent_logo.png",
  "agentDisplayAddress": "456 Baker Street, London",
  "agentProfileUrl": null,
  "features": ["Balcony", "Lift", "Concierge"],
  "nearestStations": [
    {
      "name": "Baker Street",
      "types": ["tube"],
      "distance": 0.1,
      "unit": "miles"
    }
  ],
  "addedOn": "2024-01-10T08:00:00Z",
  "firstVisibleDate": "2024-01-10T08:00:00Z",
  "listingUpdateDate": "2024-01-18T12:00:00Z",
  "published": true,
  "archived": false,
  "sold": false,
  "distressKeywordsMatched": [],
  "distressScoreRule": 0,
  "priceHistory": [],
  "additionalData": {
    "zooplaListingId": "987654321",
    "zooplaAgentId": "12345"
  },
  "_scrapedAt": "2024-01-25T09:00:00Z",
  "_site": "zoopla"
}
```

### Example 3: Deduplicated Property

When a property appears on multiple portals and cross-site deduplication is enabled:

```json
{
  "id": "123456789",
  "url": "https://www.rightmove.co.uk/properties/123456789",
  "source": "rightmove",
  "sourceUrl": "https://www.rightmove.co.uk/properties/123456789",
  "address": "Oxford Street, London W1D 1BS",
  "displayAddress": "Oxford Street, West End, London",
  "price": "£500,000",
  "description": "Stunning 2-bedroom apartment in prime location...",
  "propertyType": "Flat",
  "bedrooms": 2,
  "bathrooms": 2,
  "coordinates": {
    "latitude": 51.5155,
    "longitude": -0.1426
  },
  "outcode": "W1D",
  "incode": "1BS",
  "countryCode": "GB",
  "tenure": "Leasehold",
  "councilTaxBand": "F",
  "images": [
    "https://media.rightmove.co.uk/image1.jpg",
    "https://lid.zoocdn.com/image2.jpg"
  ],
  "features": ["Gym", "Roof terrace", "24-hour security"],
  "sources": ["rightmove", "zoopla"],
  "duplicateOf": ["123456789", "555666777"],
  "_isDuplicate": true,
  "_scrapedAt": "2024-01-25T09:00:00Z",
  "_site": "rightmove"
}
```

## Portal-Specific Mappings

### Rightmove

Rightmove data already closely matches the unified schema. The adapter primarily adds:

- `source: "rightmove"`
- `sourceUrl` field
- `_site: "rightmove"`

### Zoopla

Zoopla requires more extensive mapping:

| Zoopla Field           | Unified Field       | Notes                   |
| ---------------------- | ------------------- | ----------------------- |
| `listing_id`           | `id`                | Converted to string     |
| `displayable_address`  | `address`           | Direct mapping          |
| `price`                | `price`             | Formatted with £ symbol |
| `num_bedrooms`         | `bedrooms`          | Direct mapping          |
| `num_bathrooms`        | `bathrooms`         | Direct mapping          |
| `property_type`        | `propertyType`      | Direct mapping          |
| `first_published_date` | `addedOn`           | ISO 8601 format         |
| `last_published_date`  | `listingUpdateDate` | ISO 8601 format         |
| `agent_name`           | `agent`             | Direct mapping          |
| `agent_phone`          | `agentPhone`        | Direct mapping          |
| `agent_logo`           | `agentLogo`         | Direct mapping          |

Zoopla-specific fields are stored in `additionalData`:

```javascript
additionalData: {
  zooplaListingId: "987654321",
  zooplaAgentId: "12345"
}
```

## Validation

The schema includes validation utilities in `src/utils/field-mapping.js`:

```javascript
const { validateUnifiedSchema } = require("./utils/field-mapping");

// Validate a property
const result = validateUnifiedSchema(property, (strict = false));
// Returns: { valid: boolean, errors: Array, warnings: Array }
```

## Null Handling

Fields that are not available from a portal should be set to appropriate null values:

- Strings: `null`
- Numbers: `null`
- Arrays: `[]` (empty array)
- Objects: `null`
- Booleans: `false`

Use the `setMissingFieldsToNull` utility:

```javascript
const { setMissingFieldsToNull } = require("./utils/field-mapping");

const normalized = setMissingFieldsToNull(property);
```

## Versioning

Schema changes follow semantic versioning:

- **Major**: Breaking changes (field removal, type changes)
- **Minor**: New optional fields
- **Patch**: Documentation updates, clarifications

Current version: **1.0.0**

## See Also

- [Field Mapping Utilities](../src/utils/field-mapping.js)
- [Schema Definition](../src/schemas/unified-property-schema.js)
- [Adapter Development Guide](./ADAPTER_DEVELOPMENT.md) (coming soon)
