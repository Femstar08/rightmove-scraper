# Rightmove Property Scraper with Distress Detection

A powerful Apify Actor that scrapes property listings from Rightmove search results with built-in distress keyword detection for identifying investment opportunities. Perfect for property investors, deal sourcers, and automation workflows.

## Overview

This Actor extracts structured property data from Rightmove search result pages, including property details, pricing, images, and dates. The standout feature is **automatic distress detection** - the Actor analyzes property descriptions to identify keywords that indicate potential distressed sales, motivated sellers, or investment opportunities.

### Key Features

#### Phase 1 (Basic Features)

- 🏠 **Complete Property Data**: Extracts URL, address, price, description, date added, and images
- 🎯 **Distress Detection**: Automatically identifies keywords indicating investment opportunities
- 📊 **Distress Scoring**: Simple rule-based scoring (0-10) based on keyword matches
- 📄 **Multi-Page Support**: Scrape multiple pages of search results
- 🔒 **Proxy Support**: Built-in Apify proxy integration to avoid rate limiting
- ⚙️ **Customizable Keywords**: Define your own distress keywords based on your investment strategy
- 📦 **Stable Output**: Consistent JSON structure with all fields present (null for missing data)
- 🔗 **Easy Integration**: Works seamlessly with OpenAI Workflows, Zapier, Google Sheets, and more

#### Phase 2 (Enhanced Commercial Features)

- 🏢 **Full Property Details**: Extract 30+ fields including coordinates, agent info, amenities, transport links
- 📍 **Location Data**: Latitude/longitude coordinates, postcode components, nearest stations
- 👔 **Agent Information**: Agent name, phone, logo, address, profile URL
- 📸 **Rich Media**: All images, brochures, floor plans with captions
- 🏗️ **Property Features**: Complete amenities list, property type, tenure, council tax band
- 📈 **Price History**: Track price changes over time (optional)
- 🔄 **Monitoring Mode**: Only return newly added properties compared to previous runs
- 📊 **Delisting Tracker**: Track when properties are removed from Rightmove using Key-Value store
- 🎯 **Direct Property URLs**: Scrape specific properties without searching
- ⚡ **Flexible Extraction**: Choose between fast search-card data or comprehensive property details

### Use Cases

- **Property Investors**: Find distressed properties and motivated sellers
- **Deal Sourcers**: Identify below-market-value opportunities
- **Market Research**: Analyze property listings and pricing trends
- **Automation Workflows**: Feed property data into CRM systems or notification pipelines
- **Lead Generation**: Build lists of properties matching specific criteria

## Input Parameters

### Phase 1 Parameters (Basic)

| Parameter            | Type    | Required | Default   | Description                                                                          |
| -------------------- | ------- | -------- | --------- | ------------------------------------------------------------------------------------ |
| `startUrls`          | array   | ✅ Yes\* | -         | Array of URL objects containing Rightmove search results pages to scrape             |
| `maxItems`           | integer | No       | `200`     | Maximum number of property listings to extract across all pages (1-10000)            |
| `maxPages`           | integer | No       | `5`       | Maximum number of search result pages to process per URL (1-100)                     |
| `proxyConfiguration` | object  | No       | See below | Proxy configuration object with useApifyProxy boolean and optional apifyProxyGroups  |
| `distressKeywords`   | array   | No       | See below | Keywords to detect in property descriptions that indicate potential distressed sales |
| `onlyDistressed`     | boolean | No       | `true`    | If true, only returns properties with distress signals (distressScore > 0)           |

\*Either `startUrls` or `propertyUrls` must be provided

### Phase 2 Parameters (Enhanced)

| Parameter                | Type    | Required | Default | Description                                                                                    |
| ------------------------ | ------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `propertyUrls`           | array   | No       | `[]`    | Array of direct property page URLs to scrape (skips search results)                            |
| `fullPropertyDetails`    | boolean | No       | `true`  | If true, visits each property page to extract 30+ fields. If false, uses search card data only |
| `monitoringMode`         | boolean | No       | `false` | If true, only returns newly added properties compared to the previous run                      |
| `enableDelistingTracker` | boolean | No       | `false` | If true, tracks properties in Key-Value store to identify when they're removed                 |
| `includePriceHistory`    | boolean | No       | `false` | If true, extracts price history (slower). Only works with fullPropertyDetails=true             |

### Default Distress Keywords

If not specified, the Actor uses these default keywords:

- `"reduced"` - Price reductions often indicate motivated sellers
- `"chain free"` - No chain means faster completion
- `"auction"` - Auction properties often sell below market value
- `"motivated"` - Explicitly motivated sellers
- `"cash buyers"` - Urgency to sell
- `"needs renovation"` - Properties requiring work often sell at discount

## Example Input

### Basic Usage (Phase 1)

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ]
}
```

### Phase 2: Full Property Details

Extract comprehensive property data (30+ fields):

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "fullPropertyDetails": true,
  "maxItems": 50
}
```

### Phase 2: Direct Property URLs

Scrape specific properties without searching:

```json
{
  "propertyUrls": [
    {
      "url": "https://www.rightmove.co.uk/properties/123456789"
    },
    {
      "url": "https://www.rightmove.co.uk/properties/987654321"
    }
  ],
  "fullPropertyDetails": true,
  "includePriceHistory": true
}
```

### Phase 2: Monitoring Mode

Only get newly added properties:

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "monitoringMode": true,
  "maxItems": 100
}
```

### Phase 2: Delisting Tracker

Track when properties are removed:

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "enableDelistingTracker": true,
  "fullPropertyDetails": true
}
```

### Advanced Usage with All Phase 2 Parameters

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    },
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E93929"
    }
  ],
  "propertyUrls": [
    {
      "url": "https://www.rightmove.co.uk/properties/123456789"
    }
  ],
  "maxItems": 100,
  "maxPages": 5,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": []
  },
  "distressKeywords": [
    "reduced",
    "chain free",
    "auction",
    "motivated",
    "cash buyers",
    "needs renovation",
    "probate",
    "executor sale",
    "quick sale",
    "vacant possession",
    "deceased estate",
    "renovation project",
    "modernisation required",
    "refurbishment opportunity"
  ],
  "fullPropertyDetails": true,
  "monitoringMode": false,
  "enableDelistingTracker": true,
  "includePriceHistory": false,
  "onlyDistressed": true
}
```

### Custom Keywords for Specific Strategies

**Probate-Focused Strategy:**

```json
{
  "listUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "distressKeywords": [
    "probate",
    "executor sale",
    "estate sale",
    "deceased estate"
  ]
}
```

**Renovation-Focused Strategy:**

```json
{
  "listUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "distressKeywords": [
    "needs work",
    "renovation project",
    "modernisation required",
    "refurbishment opportunity"
  ]
}
```

## Example Output

### Phase 1 Output (Basic Fields)

```json
[
  {
    "id": "123456789",
    "url": "https://www.rightmove.co.uk/properties/123456789",
    "address": "123 High Street, London, SW1A 1AA",
    "price": "£350,000",
    "description": "REDUCED! Chain free 2 bedroom flat in excellent location. Needs some modernisation but great potential. Motivated seller.",
    "bedrooms": 2,
    "bathrooms": 1,
    "propertyType": "Flat",
    "images": [
      "https://media.rightmove.co.uk/dir/crop/10:9-16:9/123k/456/789.jpg"
    ],
    "addedOn": "2025-01-15",
    "distressKeywordsMatched": ["reduced", "chain free", "motivated"],
    "distressScoreRule": 6
  }
]
```

### Phase 2 Output (Full Property Details - 30+ Fields)

```json
[
  {
    "id": "123456789",
    "url": "https://www.rightmove.co.uk/properties/123456789",
    "address": "123 High Street, London, SW1A 1AA",
    "price": "£350,000",
    "description": "REDUCED! Chain free 2 bedroom flat in excellent location. Needs some modernisation but great potential. Motivated seller.",
    "bedrooms": 2,
    "bathrooms": 1,
    "propertyType": "Flat",
    "images": [
      "https://media.rightmove.co.uk/dir/crop/10:9-16:9/123k/456/789_1.jpg",
      "https://media.rightmove.co.uk/dir/crop/10:9-16:9/123k/456/789_2.jpg"
    ],
    "addedOn": "2025-01-15",
    "distressKeywordsMatched": ["reduced", "chain free", "motivated"],
    "distressScoreRule": 6,
    "displayAddress": "High Street, Westminster, London SW1A",
    "countryCode": "GB",
    "outcode": "SW1A",
    "incode": "1AA",
    "coordinates": {
      "latitude": 51.5074,
      "longitude": -0.1278
    },
    "tenure": "Leasehold",
    "councilTaxBand": "D",
    "agent": "Premium Estate Agents",
    "agentPhone": "020 1234 5678",
    "agentLogo": "https://media.rightmove.co.uk/agents/logo.jpg",
    "agentDisplayAddress": "123 Main Street, London, SW1A 1AA",
    "agentProfileUrl": "https://www.rightmove.co.uk/estate-agents/agent/Premium-Estate-Agents.html",
    "brochures": [
      {
        "url": "https://media.rightmove.co.uk/brochures/123456789.pdf",
        "caption": "Property Brochure"
      }
    ],
    "floorplans": [
      {
        "url": "https://media.rightmove.co.uk/floorplans/123456789.jpg",
        "caption": "Ground Floor"
      }
    ],
    "nearestStations": [
      {
        "name": "Westminster Station",
        "types": ["tube", "national-rail"],
        "distance": 0.3,
        "unit": "miles"
      }
    ],
    "features": [
      "Double glazing",
      "Central heating",
      "Parking",
      "Garden",
      "Close to transport"
    ],
    "priceHistory": [
      {
        "date": "2025-01-01",
        "price": "£375,000"
      },
      {
        "date": "2025-01-15",
        "price": "£350,000"
      }
    ],
    "published": true,
    "archived": false,
    "sold": false,
    "listingUpdateDate": "2025-01-15T10:30:00Z",
    "firstVisibleDate": "2025-01-01T09:00:00Z",
    "_scrapedAt": "2025-01-20T14:25:30.123Z",
    "_isNew": true
  }
]
```

### Output Field Descriptions

#### Phase 1 Fields (Basic)

- **id**: Unique property identifier
- **url**: Direct link to the property detail page
- **address**: Full property address as displayed on Rightmove
- **price**: Property price (e.g., "£350,000", "POA" for price on application)
- **description**: Property description text
- **bedrooms**: Number of bedrooms (null if not available)
- **bathrooms**: Number of bathrooms (null if not available)
- **propertyType**: Type of property (e.g., "Flat", "Detached", "Semi-Detached")
- **images**: Array of image URLs
- **addedOn**: Date the property was added
- **distressKeywordsMatched**: Array of matched distress keywords (case-insensitive)
- **distressScoreRule**: Distress score from 0-10, calculated as `min(10, matched_keywords * 2)`

#### Phase 2 Fields (Enhanced)

- **displayAddress**: More detailed address format
- **countryCode**: Country code (usually "GB")
- **outcode**: Postcode outcode (e.g., "SW1A")
- **incode**: Postcode incode (e.g., "1AA")
- **coordinates**: Object with latitude and longitude
- **tenure**: Property tenure (e.g., "Freehold", "Leasehold")
- **councilTaxBand**: Council tax band (A-H)
- **agent**: Estate agent name
- **agentPhone**: Agent contact phone number
- **agentLogo**: URL to agent logo image
- **agentDisplayAddress**: Agent office address
- **agentProfileUrl**: Link to agent's Rightmove profile
- **brochures**: Array of brochure objects with url and caption
- **floorplans**: Array of floor plan objects with url and caption
- **nearestStations**: Array of nearby transport stations with distance
- **features**: Array of property features/amenities
- **priceHistory**: Array of historical price changes (only if includePriceHistory=true)
- **published**: Whether the property is currently published
- **archived**: Whether the property has been archived
- **sold**: Whether the property has been sold
- **listingUpdateDate**: ISO 8601 timestamp of last listing update
- **firstVisibleDate**: ISO 8601 timestamp when property first appeared
- **\_scrapedAt**: ISO 8601 timestamp when data was scraped
- **\_isNew**: Boolean flag indicating if property is new (only in monitoring mode)

### Distress Score Interpretation

- **0**: No distress signals detected
- **2**: Possibly distressed (1 keyword)
- **4**: Likely distressed (2 keywords)
- **6**: Very likely distressed (3 keywords)
- **8**: Highly distressed (4 keywords)
- **10**: Maximum distress signal (5+ keywords)

## Phase 2 Features Guide

### Feature Comparison Table

| Feature                   | Phase 1 (Basic) | Phase 2 (Enhanced) | Performance Impact |
| ------------------------- | --------------- | ------------------ | ------------------ |
| Property ID, URL, Address | ✅              | ✅                 | None               |
| Price, Description        | ✅              | ✅                 | None               |
| Bedrooms, Bathrooms       | ✅              | ✅                 | None               |
| Images                    | ✅ (1 image)    | ✅ (All images)    | Low                |
| Distress Detection        | ✅              | ✅                 | None               |
| Coordinates (Lat/Long)    | ❌              | ✅                 | None               |
| Agent Information         | ❌              | ✅                 | None               |
| Brochures & Floor Plans   | ❌              | ✅                 | None               |
| Features/Amenities        | ❌              | ✅                 | None               |
| Nearest Stations          | ❌              | ✅                 | None               |
| Property Status & Dates   | ❌              | ✅                 | None               |
| Price History             | ❌              | ✅ (Optional)      | High               |
| Monitoring Mode           | ❌              | ✅                 | Low                |
| Delisting Tracker         | ❌              | ✅                 | Low                |
| Direct Property URLs      | ❌              | ✅                 | None               |

### Performance Modes

Choose the right configuration for your use case:

#### Fast Mode (Search Cards Only)

```json
{
  "fullPropertyDetails": false,
  "includePriceHistory": false
}
```

- **Speed**: ~2-3 seconds per page
- **Fields**: Basic fields only (Phase 1)
- **Use Case**: Quick scans, high-volume scraping

#### Standard Mode (Full Details)

```json
{
  "fullPropertyDetails": true,
  "includePriceHistory": false
}
```

- **Speed**: ~5-7 seconds per property
- **Fields**: All 30+ fields except price history
- **Use Case**: Comprehensive property data

#### Deep Analysis Mode (Full Details + Price History)

```json
{
  "fullPropertyDetails": true,
  "includePriceHistory": true
}
```

- **Speed**: ~8-12 seconds per property
- **Fields**: All 30+ fields including price history
- **Use Case**: Investment analysis, price tracking

### Monitoring Mode

Track new properties over time by only returning properties that weren't in your previous run:

```json
{
  "startUrls": [{ "url": "..." }],
  "monitoringMode": true
}
```

**How it works:**

1. First run: Returns all properties found
2. Subsequent runs: Only returns properties with IDs not seen in the previous run
3. Properties get an `_isNew: true` flag

**Use cases:**

- Daily monitoring for new listings
- Automated alerts for new distressed properties
- Incremental data collection

### Delisting Tracker

Track when properties are removed from Rightmove:

```json
{
  "startUrls": [{ "url": "..." }],
  "enableDelistingTracker": true
}
```

**How it works:**

1. Each property ID is stored in a Key-Value store with a `lastSeen` timestamp
2. Every run updates the `lastSeen` timestamp for properties found
3. Properties not found in recent runs are considered delisted

**Accessing delisting data:**

```javascript
// Via Apify API
const store = await Actor.openKeyValueStore("rightmove-properties");
const property = await store.getValue("123456789");
// Returns: { lastSeen: "2025-01-20T14:25:30.123Z", propertyId: "123456789" }
```

**Use cases:**

- Identify sold properties
- Track market velocity
- Detect withdrawn listings (potential off-market deals)

## Usage Examples

### Basic Scraping

Scrape the first 5 pages of search results with default settings:

```json
{
  "listUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ]
}
```

This will extract up to 200 properties from up to 5 pages using default distress keywords.

### Multi-Page Scraping

Scrape multiple pages to get more results:

```json
{
  "listUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "maxItems": 200,
  "maxPages": 10,
  "proxy": {
    "useApifyProxy": true
  }
}
```

**Note**: When scraping multiple pages, it's recommended to enable `proxy.useApifyProxy: true` to avoid rate limiting.

### Multiple Search URLs

Scrape properties from multiple different search URLs:

```json
{
  "listUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    },
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E93929"
    },
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E61294"
    }
  ],
  "maxItems": 300,
  "maxPages": 5,
  "proxy": {
    "useApifyProxy": true
  }
}
```

This will scrape up to 5 pages from each URL, collecting up to 300 properties total across all URLs.

### Finding High-Distress Properties

Focus on properties with strong distress signals:

1. Run the Actor with your desired search URL
2. Filter results where `distressScoreRule >= 6`
3. Sort by `distressScoreRule` descending to see the most distressed properties first

### Monitoring New Listings

Set up a scheduled Actor run to check for new listings daily:

1. Create an Actor task with your search URL
2. Schedule it to run daily (e.g., 9 AM)
3. Use webhooks or integrations to get notified of new high-distress properties

## Integration Examples

### OpenAI Workflows Integration

Use the scraped data with OpenAI to analyze property descriptions and generate investment insights:

```javascript
// In your OpenAI Workflow
const properties = await Apify.call("your-actor-name", {
  listUrls: [
    { url: "https://www.rightmove.co.uk/property-for-sale/find.html?..." },
  ],
  maxItems: 50,
});

// Filter high-distress properties
const distressedProperties = properties.filter((p) => p.distressScoreRule >= 6);

// Send to OpenAI for analysis
for (const property of distressedProperties) {
  const analysis = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Analyze this property for investment potential: ${JSON.stringify(
          property
        )}`,
      },
    ],
  });
  console.log(analysis);
}
```

### Zapier Integration

Connect the Actor to Zapier to automate your workflow:

1. **Trigger**: Schedule (e.g., daily at 9 AM)
2. **Action**: Run Apify Actor with your search URL
3. **Filter**: Only continue if `distressScoreRule >= 6`
4. **Action**: Send email notification or add to Google Sheets
5. **Action**: Create task in your CRM (e.g., HubSpot, Salesforce)

**Example Zap Flow:**

```
Schedule → Run Apify Actor → Filter by distressScore → Add to Google Sheets → Send Slack notification
```

### Google Sheets Integration

Automatically populate a Google Sheet with property data:

1. Create a new Google Sheet with columns: URL, Address, Price, Description, Date Added, Distress Score
2. In Zapier or Make.com:
   - Trigger: Schedule or webhook
   - Action: Run this Apify Actor
   - Action: Add rows to Google Sheet
3. Use Google Sheets formulas to:
   - Highlight rows where distress score >= 6
   - Calculate average prices by area
   - Track price changes over time

**Example Google Sheets Formula:**

```
=IF(G2>=6, "🔥 HOT LEAD", IF(G2>=4, "⚠️ POTENTIAL", ""))
```

### Make.com (Integromat) Integration

Create sophisticated automation workflows:

```
Scenario:
1. Schedule: Every day at 9 AM
2. Apify: Run Rightmove Scraper Actor
3. Filter: distressScoreRule >= 6
4. Iterator: Loop through each property
5. HTTP: POST to your CRM API
6. Gmail: Send summary email with top 10 properties
7. Google Sheets: Append to tracking spreadsheet
```

### Webhook Integration

Get real-time notifications when the Actor completes:

```json
{
  "listUrls": [
    { "url": "https://www.rightmove.co.uk/property-for-sale/find.html?..." }
  ],
  "maxItems": 100,
  "proxy": {
    "useApifyProxy": true
  }
}
```

Configure a webhook in Apify Console to POST results to your endpoint:

```
POST https://your-api.com/webhooks/properties
```

Your endpoint receives:

```json
{
  "actorRunId": "abc123",
  "status": "SUCCEEDED",
  "datasetId": "xyz789",
  "properties": [...]
}
```

## Limitations and Best Practices

### Rate Limiting

- **Without Proxy**: Rightmove may block or rate-limit requests after 1-2 pages
- **With Proxy**: Can scrape multiple pages reliably
- **Recommendation**: Use `useProxy: true` when `maxPages > 2`

### When to Use Proxy

✅ **Use Proxy (`proxy.useApifyProxy: true`) when:**

- Scraping more than 2 pages
- Running frequent scheduled scrapes
- Scraping multiple different searches in succession
- You encounter HTTP 429 (Too Many Requests) errors

❌ **Proxy Not Needed when:**

- Testing with a single page
- One-off scrapes
- Low-volume usage (< 5 runs per day)

### HTML Structure Changes

Rightmove may update their website structure, which could affect scraping. If you notice missing data:

- Check the Actor logs for parsing errors
- Report issues to the Actor maintainer
- The Actor handles missing fields gracefully by returning `null`

### Performance Considerations

- **Memory**: Actor uses ~256-512 MB RAM
- **Speed**: ~2-5 seconds per page (without proxy), ~3-7 seconds per page (with proxy)
- **Cost**: Proxy usage incurs additional Apify platform costs

### Data Accuracy

- Property data is scraped from public Rightmove listings
- Distress detection is keyword-based and may have false positives/negatives
- Always verify property details directly with the agent or Rightmove
- Distress scores are indicative, not definitive

### Legal and Ethical Considerations

- Respect Rightmove's Terms of Service
- Use scraped data responsibly and ethically
- Don't overload Rightmove's servers (use reasonable `maxPages` limits)
- Consider using proxy to distribute load
- Data is for personal/business use, not for republishing

## Troubleshooting

### No Properties Extracted

- **Check URL**: Ensure the Rightmove search URL is valid and returns results
- **Check Logs**: Look for parsing errors in the Actor run logs
- **Try Proxy**: Enable `proxy.useApifyProxy: true` if you're being blocked

### Missing Fields

- Some properties may not have all fields (e.g., no image, no date)
- The Actor returns `null` for missing string fields
- Check the `description` field - if it's null, distress detection won't work

### HTTP Errors

- **429 Too Many Requests**: Enable `proxy.useApifyProxy: true`
- **403 Forbidden**: Enable `proxy.useApifyProxy: true` or wait before retrying
- **404 Not Found**: Check that your search URL is correct

### Low Distress Scores

- Properties may genuinely not have distress signals
- Try customizing `distressKeywords` for your market
- Consider expanding your keyword list
- Remember: not all good deals have obvious distress signals

## Support and Feedback

- **Issues**: Report bugs or request features via Apify Console
- **Questions**: Contact via Apify support
- **Updates**: Check the Actor changelog for new features

## Version History

### v2.0 (Phase 2) - Enhanced Commercial Features

- ✨ **Full Property Details**: Extract 30+ comprehensive fields
- 📍 **Location Data**: Coordinates, postcode components, nearest stations
- 👔 **Agent Information**: Complete agent details with contact info
- 📸 **Rich Media**: All images, brochures, floor plans
- 📈 **Price History**: Track price changes over time
- 🔄 **Monitoring Mode**: Only return newly added properties
- 📊 **Delisting Tracker**: Track when properties are removed
- 🎯 **Direct Property URLs**: Scrape specific properties
- ⚡ **Performance Modes**: Choose between fast and comprehensive extraction

### v1.0 (Phase 1) - Initial Release

- 🏠 Basic property data extraction
- 🎯 Distress keyword detection
- 📊 Distress scoring system
- 📄 Multi-page pagination support
- 🔒 Apify proxy integration
- ⚙️ Customizable distress keywords

---

**Built with ❤️ for property investors and deal sourcers**
