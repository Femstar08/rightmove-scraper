# Zapier Integration Guide

## Overview

This guide shows you how to set up Zapier to orchestrate the flow between your Next.js UI, Apify Actor, and Supabase database.

## Architecture Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │───▶│     Zapier      │───▶│  Apify Actor    │───▶│   Supabase DB   │
│   (Job Create)  │    │   (Webhook)     │    │   (Scraping)    │    │  (Properties)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step 1: Set up Zapier Webhook Trigger

### 1.1 Create New Zap

1. Go to [Zapier](https://zapier.com) and create a new Zap
2. Choose **Webhooks by Zapier** as the trigger
3. Select **Catch Hook** as the trigger event
4. Copy the webhook URL provided by Zapier

### 1.2 Configure Environment Variables

Add the webhook URL to your Next.js app:

```env
# .env.local
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/
ZAPIER_SECRET=your_secret_key_here
```

### 1.3 Test the Webhook

1. Create a test job in your UI
2. Check that Zapier receives the webhook data
3. The payload should look like this:

```json
{
  "jobId": "uuid-here",
  "name": "London Properties",
  "site": "rightmove",
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "maxItems": 200,
  "maxPages": 5,
  "fullPropertyDetails": true,
  "includePriceHistory": false,
  "onlyDistressed": true,
  "distressKeywords": ["reduced", "chain free", "auction"]
}
```

## Step 2: Configure Apify Actor Action

### 2.1 Add Apify Action

1. Add a new action step in Zapier
2. Search for and select **Apify**
3. Choose **Run Actor** as the action
4. Connect your Apify account

### 2.2 Configure Actor Settings

Map the webhook data to your actor input:

```javascript
// Actor Input Configuration
{
  "site": "{{trigger.site}}",
  "startUrls": "{{trigger.startUrls}}",
  "maxItems": "{{trigger.maxItems}}",
  "maxPages": "{{trigger.maxPages}}",
  "fullPropertyDetails": "{{trigger.fullPropertyDetails}}",
  "includePriceHistory": "{{trigger.includePriceHistory}}",
  "onlyDistressed": "{{trigger.onlyDistressed}}",
  "distressKeywords": "{{trigger.distressKeywords}}"
}
```

### 2.3 Actor Settings

- **Actor ID**: Your deployed actor ID (e.g., `your-username/rightmove-scraper`)
- **Wait for finish**: Yes (important!)
- **Timeout**: 3600 seconds (1 hour)
- **Memory**: 4096 MB

## Step 3: Update Job Status (Running)

### 3.1 Add Webhook Action

1. Add another **Webhooks by Zapier** action
2. Choose **POST** method
3. URL: `https://your-app.vercel.app/api/webhooks/zapier`

### 3.2 Configure Headers

```
Content-Type: application/json
X-Zapier-Secret: your_secret_key_here
```

### 3.3 Configure Body

```json
{
  "type": "job_started",
  "jobId": "{{trigger.jobId}}",
  "data": {
    "apifyRunId": "{{2.run_id}}",
    "apifyActorId": "{{2.actor_id}}"
  }
}
```

## Step 4: Process Scraped Properties

### 4.1 Add Code Action (JavaScript)

1. Add a **Code by Zapier** action
2. Choose **Run JavaScript**
3. Use this code to process the Apify results:

```javascript
// Input Data
const apifyResults = inputData.apifyResults;
const jobId = inputData.jobId;

// Process the results
let properties = [];
let propertiesCount = 0;

if (apifyResults && apifyResults.length > 0) {
  properties = apifyResults.map((item) => {
    // Transform Apify output to Supabase schema
    return {
      id: item.id,
      url: item.url,
      source: item.source || item._site,
      address: item.address,
      price: item.price,
      description: item.description,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      propertyType: item.propertyType,
      coordinates: item.coordinates,
      images: item.images || [],
      features: item.features || [],
      distressKeywordsMatched: item.distressKeywordsMatched || [],
      distressScoreRule: item.distressScoreRule || 0,
      priceHistory: item.priceHistory || [],
      _scrapedAt: item._scrapedAt || new Date().toISOString(),
    };
  });

  propertiesCount = properties.length;
}

// Return processed data
output = {
  properties: properties,
  propertiesCount: propertiesCount,
  jobId: jobId,
};
```

## Step 5: Save Properties to Supabase

### 5.1 Add Webhook Action for Properties

1. Add another **Webhooks by Zapier** action
2. Choose **POST** method
3. URL: `https://your-app.vercel.app/api/properties`

### 5.2 Configure Request

```json
{
  "properties": "{{4.properties}}"
}
```

## Step 6: Update Job Status (Completed)

### 6.1 Add Final Webhook Action

1. Add final **Webhooks by Zapier** action
2. URL: `https://your-app.vercel.app/api/webhooks/zapier`

### 6.2 Configure Completion Webhook

```json
{
  "type": "job_completed",
  "jobId": "{{trigger.jobId}}",
  "data": {
    "propertiesFound": "{{4.propertiesCount}}",
    "propertiesSaved": "{{5.saved}}",
    "apifyDatasetId": "{{2.default_dataset_id}}"
  }
}
```

## Step 7: Error Handling

### 7.1 Add Error Path

1. In Zapier, add error handling for the Apify action
2. If the actor fails, send a failure webhook:

```json
{
  "type": "job_failed",
  "jobId": "{{trigger.jobId}}",
  "data": {
    "errorMessage": "{{2.error_message}}"
  }
}
```

## Step 8: Testing the Complete Flow

### 8.1 End-to-End Test

1. Create a new job in your UI
2. Monitor the Zapier execution
3. Check that properties appear in Supabase
4. Verify job status updates in the UI

### 8.2 Test Scenarios

- ✅ Successful scraping job
- ✅ Job with no results
- ✅ Job that fails/times out
- ✅ Large job with many properties

## Step 9: Advanced Features

### 9.1 Progress Updates

Add intermediate webhooks to show progress:

```json
{
  "type": "job_progress",
  "jobId": "{{trigger.jobId}}",
  "data": {
    "propertiesFound": "{{current_count}}"
  }
}
```

### 9.2 Batch Processing

For large jobs, process properties in batches:

```javascript
// Split properties into batches of 100
const batchSize = 100;
const batches = [];

for (let i = 0; i < properties.length; i += batchSize) {
  batches.push(properties.slice(i, i + batchSize));
}

// Process each batch
for (const batch of batches) {
  // Send batch to Supabase
}
```

### 9.3 Duplicate Detection

Add logic to handle duplicates:

```javascript
// Check for existing properties
const existingIds = await checkExistingProperties(properties.map((p) => p.id));
const newProperties = properties.filter((p) => !existingIds.includes(p.id));
```

## Step 10: Monitoring and Alerts

### 10.1 Zapier Notifications

Set up Zapier to send notifications:

- Email on job completion
- Slack message on failures
- SMS for critical errors

### 10.2 Dashboard Alerts

Add real-time notifications to your UI:

- WebSocket connections for live updates
- Browser notifications
- Email summaries

## Troubleshooting

### Common Issues

**Webhook not triggering:**

- Check webhook URL is correct
- Verify ZAPIER_SECRET matches
- Check network connectivity

**Apify actor failing:**

- Verify actor ID is correct
- Check input parameters
- Monitor actor logs in Apify console

**Properties not saving:**

- Check Supabase connection
- Verify schema matches
- Check for validation errors

**Job status not updating:**

- Verify webhook endpoints
- Check authentication
- Monitor API logs

### Debug Mode

Enable debug logging in your Next.js app:

```javascript
// Add to API routes
console.log("Webhook received:", JSON.stringify(body, null, 2));
```

## Security Considerations

1. **Webhook Security**: Always verify the Zapier secret
2. **API Rate Limits**: Implement rate limiting on webhooks
3. **Data Validation**: Validate all incoming data
4. **Error Handling**: Don't expose sensitive information in errors
5. **Monitoring**: Log all webhook activities

## Performance Optimization

1. **Batch Processing**: Process properties in batches
2. **Async Operations**: Use background jobs for large datasets
3. **Caching**: Cache frequently accessed data
4. **Database Indexing**: Ensure proper indexes on Supabase
5. **Connection Pooling**: Use connection pooling for database

This integration provides a robust, scalable solution for orchestrating your property scraping workflow while keeping your Apify Actor unchanged and leveraging Zapier's reliability for automation.
