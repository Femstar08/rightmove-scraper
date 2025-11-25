# Rightmove Property Scraper with Distress Detection

A powerful Apify Actor that scrapes property listings from Rightmove search results with built-in distress keyword detection for identifying investment opportunities. Perfect for property investors, deal sourcers, and automation workflows.

## Overview

This Actor extracts structured property data from Rightmove search result pages, including property details, pricing, images, and dates. The standout feature is **automatic distress detection** - the Actor analyzes property descriptions to identify keywords that indicate potential distressed sales, motivated sellers, or investment opportunities.

### Key Features

- 🏠 **Complete Property Data**: Extracts URL, address, price, description, date added, and images
- 🎯 **Distress Detection**: Automatically identifies keywords indicating investment opportunities
- 📊 **Distress Scoring**: Simple rule-based scoring (0-10) based on keyword matches
- 📄 **Multi-Page Support**: Scrape multiple pages of search results
- 🔒 **Proxy Support**: Built-in Apify proxy integration to avoid rate limiting
- ⚙️ **Customizable Keywords**: Define your own distress keywords based on your investment strategy
- 📦 **Stable Output**: Consistent JSON structure with all fields present (null for missing data)
- 🔗 **Easy Integration**: Works seamlessly with OpenAI Workflows, Zapier, Google Sheets, and more

### Use Cases

- **Property Investors**: Find distressed properties and motivated sellers
- **Deal Sourcers**: Identify below-market-value opportunities
- **Market Research**: Analyze property listings and pricing trends
- **Automation Workflows**: Feed property data into CRM systems or notification pipelines
- **Lead Generation**: Build lists of properties matching specific criteria

## Input Parameters

| Parameter          | Type    | Required | Default   | Description                                                                          |
| ------------------ | ------- | -------- | --------- | ------------------------------------------------------------------------------------ |
| `url`              | string  | ✅ Yes   | -         | The URL of the Rightmove search results page to scrape                               |
| `maxItems`         | integer | No       | `50`      | Maximum number of property listings to extract across all pages (1-1000)             |
| `maxPages`         | integer | No       | `1`       | Maximum number of search result pages to process (1-50)                              |
| `useProxy`         | boolean | No       | `false`   | Enable Apify proxy to avoid rate limiting and IP blocks                              |
| `distressKeywords` | array   | No       | See below | Keywords to detect in property descriptions that indicate potential distressed sales |

### Default Distress Keywords

If not specified, the Actor uses these default keywords:

- `"reduced"` - Price reductions often indicate motivated sellers
- `"chain free"` - No chain means faster completion
- `"auction"` - Auction properties often sell below market value
- `"motivated"` - Explicitly motivated sellers
- `"cash buyers"` - Urgency to sell
- `"needs renovation"` - Properties requiring work often sell at discount

## Example Input

### Basic Usage

```json
{
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
}
```

### Advanced Usage with All Parameters

```json
{
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490",
  "maxItems": 100,
  "maxPages": 5,
  "useProxy": true,
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
    "vacant possession"
  ]
}
```

### Custom Keywords for Specific Strategies

**Probate-Focused Strategy:**

```json
{
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490",
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
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490",
  "distressKeywords": [
    "needs work",
    "renovation project",
    "modernisation required",
    "refurbishment opportunity"
  ]
}
```

## Example Output

```json
[
  {
    "url": "https://www.rightmove.co.uk/properties/123456789",
    "address": "123 High Street, London, SW1A 1AA",
    "price": "£350,000",
    "description": "REDUCED! Chain free 2 bedroom flat in excellent location. Needs some modernisation but great potential. Motivated seller.",
    "addedOn": "Added on 15/01/2025",
    "image": "https://media.rightmove.co.uk/dir/crop/10:9-16:9/123k/456/789.jpg",
    "distressKeywordsMatched": ["reduced", "chain free", "motivated"],
    "distressScoreRule": 6
  },
  {
    "url": "https://www.rightmove.co.uk/properties/987654321",
    "address": "456 Park Avenue, Manchester, M1 1AB",
    "price": "£275,000",
    "description": "Beautiful 3 bedroom house in prime location. Recently renovated throughout.",
    "addedOn": "Added today",
    "image": "https://media.rightmove.co.uk/dir/crop/10:9-16:9/987k/654/321.jpg",
    "distressKeywordsMatched": [],
    "distressScoreRule": 0
  }
]
```

### Output Field Descriptions

- **url**: Direct link to the property detail page
- **address**: Full property address as displayed on Rightmove
- **price**: Property price (e.g., "£350,000", "POA" for price on application)
- **description**: Property description text
- **addedOn**: Date the property was added (various formats: "Added today", "Added on DD/MM/YYYY")
- **image**: URL of the main property image
- **distressKeywordsMatched**: Array of keywords from your distressKeywords list that were found in the description (case-insensitive)
- **distressScoreRule**: Simple distress score from 0-10, calculated as `min(10, matched_keywords * 2)`

### Distress Score Interpretation

- **0**: No distress signals detected
- **2**: Possibly distressed (1 keyword)
- **4**: Likely distressed (2 keywords)
- **6**: Very likely distressed (3 keywords)
- **8**: Highly distressed (4 keywords)
- **10**: Maximum distress signal (5+ keywords)

## Usage Examples

### Basic Scraping

Scrape the first page of search results with default settings:

```json
{
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
}
```

This will extract up to 50 properties from the first page using default distress keywords.

### Multi-Page Scraping

Scrape multiple pages to get more results:

```json
{
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490",
  "maxItems": 200,
  "maxPages": 10,
  "useProxy": true
}
```

**Note**: When scraping multiple pages, it's recommended to enable `useProxy: true` to avoid rate limiting.

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
  url: "https://www.rightmove.co.uk/property-for-sale/find.html?...",
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
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?...",
  "maxItems": 100,
  "useProxy": true
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

✅ **Use Proxy (`useProxy: true`) when:**

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
- **Try Proxy**: Enable `useProxy: true` if you're being blocked

### Missing Fields

- Some properties may not have all fields (e.g., no image, no date)
- The Actor returns `null` for missing string fields
- Check the `description` field - if it's null, distress detection won't work

### HTTP Errors

- **429 Too Many Requests**: Enable `useProxy: true`
- **403 Forbidden**: Enable `useProxy: true` or wait before retrying
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

- **v1.0**: Initial release with distress detection, multi-page support, and proxy integration

---

**Built with ❤️ for property investors and deal sourcers**
