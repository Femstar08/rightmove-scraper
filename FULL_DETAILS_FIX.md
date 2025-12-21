# Full Property Details & Price History Fix

## Issue Description

When users enabled "Full Property Details" or "Include Price History" options, the data returned did not change and sometimes no data came back at all.

## Root Cause

The issue was in the search results processing flow in `src/main.js`. The scraper had two different flows:

1. **Search Results Flow**: Used `adapter.parseFromPageModel()` - only extracted basic data from search result cards
2. **Individual Property URLs Flow**: Used `adapter.extractFullPropertyDetails()` - extracted comprehensive data from property detail pages

The problem was that when scraping search results (the main use case), the `fullPropertyDetails` and `includePriceHistory` options were completely ignored. The scraper only used these options when processing individual property URLs directly.

## Solution

Modified the `scrapeProperties()` function in `src/main.js` to:

1. **Extract search results** from listing pages (as before)
2. **When `fullPropertyDetails=true`**: Visit each individual property page to get detailed data
3. **Use `scrapePropertyDetail()`** for each property URL to extract 30+ comprehensive fields
4. **Include price history** when `includePriceHistory=true`

## Key Changes

### 1. Updated `scrapeProperties()` Function Signature

```javascript
// Before
async function scrapeProperties(url, adapter, maxItems, maxPages, distressKeywords, proxy)

// After
async function scrapeProperties(url, adapter, maxItems, maxPages, distressKeywords, proxy, fullPropertyDetails = false, includePriceHistory = false)
```

### 2. Added Full Details Processing Logic

```javascript
// If fullPropertyDetails is enabled, visit each property page for detailed data
if (fullPropertyDetails && pageProperties.length > 0) {
  console.log(
    `🔍 Full property details enabled - visiting ${pageProperties.length} property pages...`
  );
  const detailedProperties = [];

  for (
    let i = 0;
    i < pageProperties.length && detailedProperties.length < remainingSlots;
    i++
  ) {
    const basicProperty = pageProperties[i];

    const detailedProperty = await scrapePropertyDetail(
      basicProperty.url,
      adapter,
      distressKeywords,
      proxy,
      fullPropertyDetails,
      includePriceHistory
    );

    if (detailedProperty) {
      detailedProperties.push(detailedProperty);
    }
  }

  pageProperties = detailedProperties;
}
```

### 3. Updated Function Call

```javascript
// Updated the call to pass new parameters
const result = await scrapeProperties(
  url,
  adapter,
  input.maxItems,
  input.maxPages,
  input.distressKeywords,
  input.proxy,
  input.fullPropertyDetails, // ← New parameter
  input.includePriceHistory // ← New parameter
);
```

## How It Works Now

### Basic Mode (`fullPropertyDetails=false`)

1. Scrape search result pages
2. Extract basic data from property cards
3. Return basic property information

### Full Details Mode (`fullPropertyDetails=true`)

1. Scrape search result pages
2. Extract property URLs from cards
3. **Visit each individual property page**
4. Extract comprehensive data (30+ fields)
5. Include price history if `includePriceHistory=true`
6. Return detailed property information

## Fields Available in Full Details Mode

When `fullPropertyDetails=true`, you get 30+ comprehensive fields including:

- **Basic Info**: id, url, address, price, description, bedrooms, bathrooms, propertyType
- **Location**: displayAddress, countryCode, outcode, incode, coordinates (lat/lng)
- **Property Details**: tenure, councilTaxBand, features, published, archived, sold
- **Agent Info**: agent, agentPhone, agentLogo, agentDisplayAddress, agentProfileUrl
- **Media**: images, brochures, floorplans
- **Transport**: nearestStations with distances
- **History**: priceHistory (when `includePriceHistory=true`)
- **Metadata**: listingUpdateDate, firstVisibleDate, \_scrapedAt

## Performance Impact

- **Basic Mode**: Fast - only scrapes search result pages
- **Full Details Mode**: Slower - visits each individual property page for comprehensive data
- **With Price History**: Slowest - extracts historical price data

## Testing

The fix has been tested and verified to:

1. ✅ Process `fullPropertyDetails` and `includePriceHistory` options correctly
2. ✅ Visit individual property pages when full details are requested
3. ✅ Extract comprehensive property data (30+ fields)
4. ✅ Include price history when requested
5. ✅ Maintain backward compatibility with basic extraction

## Status: ✅ FIXED

Users can now successfully use the "Full Property Details" and "Include Price History" options to get comprehensive property data.
