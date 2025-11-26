# Rightmove Scraper Enhancement Plan

## Summary

I've created a comprehensive specification to add all features from the Rightmove Commercial Properties Scraper to your existing actor. This is a major enhancement that will transform your basic scraper into an enterprise-grade property scraping solution.

## What's Been Created

I've created a complete spec in `.kiro/specs/rightmove-scraper-enhanced/` with:

1. **requirements.md** - 12 detailed requirements with acceptance criteria covering:

   - Enhanced input configuration
   - Full property detail extraction (30+ fields)
   - Monitoring mode (incremental scraping)
   - Delisting tracker (Key-Value store)
   - Price history extraction
   - Multiple URL support with deduplication
   - Direct property URL support
   - Enhanced output schema
   - Performance optimization
   - Error handling
   - Comprehensive logging
   - Documentation

2. **design.md** - Complete technical design including:

   - Enhanced pipeline architecture diagram
   - Full property object schema (30+ fields)
   - Component implementations with code examples
   - Data models
   - Error handling strategy
   - Performance optimization strategies
   - Testing strategy

3. **tasks.md** - 65 implementation tasks organized in 8 phases:

   - Phase 1: Core Infrastructure (10 tasks)
   - Phase 2: Full Property Details (10 tasks)
   - Phase 3: Advanced Features (10 tasks)
   - Phase 4: Error Handling (5 tasks)
   - Phase 5: Enhanced Logging (5 tasks)
   - Phase 6: Testing (10 tasks)
   - Phase 7: Documentation (10 tasks)
   - Phase 8: Final Testing & Deployment (5 tasks)

4. **README.md** - Overview document with feature comparison table

## Key Features Being Added

### 1. Full Property Details (30+ fields)

Your current scraper extracts 6 basic fields. The enhanced version will extract:

- Property ID, title, channel
- Complete location data (coordinates, postcode parts, delivery point ID)
- Property specifics (bathrooms, bedrooms, tenure, property type)
- Agent information (name, phone, logo, address, URLs)
- All images, brochures, floor plans
- Nearest stations with distances
- Features and amenities
- Tax information (council tax, ground rent, service charges)
- Status flags and dates
- EPC ratings

### 2. Monitoring Mode

Only scrape new properties compared to previous runs:

- Loads previous dataset
- Filters out duplicates
- Returns only new listings
- Perfect for daily scheduled scrapes

### 3. Delisting Tracker

Track when properties are removed:

- Uses Apify Key-Value store
- Stores lastSeen timestamp
- Query to find delisted properties
- Useful for market analysis

### 4. Price History

Extract historical price changes:

- Shows price reductions
- Identifies motivated sellers
- Optional (can disable for speed)

### 5. Direct Property URLs

Scrape specific properties:

- Provide property URLs directly
- Skip search pages
- Targeted scraping

### 6. Multiple URLs with Deduplication

Process multiple searches:

- Automatic deduplication by ID
- Aggregate results
- Efficient multi-area scraping

## Feature Comparison

| Feature              | Current | Enhanced |
| -------------------- | ------- | -------- |
| Basic fields (6)     | ✅      | ✅       |
| Full details (30+)   | ❌      | ✅       |
| Monitoring mode      | ❌      | ✅       |
| Delisting tracker    | ❌      | ✅       |
| Price history        | ❌      | ✅       |
| Direct property URLs | ❌      | ✅       |
| Deduplication        | ❌      | ✅       |
| Distress detection   | ✅      | ✅       |
| Proxy support        | ✅      | ✅       |
| Pagination           | ✅      | ✅       |

## Implementation Timeline

**Estimated: 7-11 days**

- Phase 1-2 (Core + Full Details): 2-3 days
- Phase 3-4 (Advanced + Error Handling): 2-3 days
- Phase 5-6 (Logging + Testing): 2-3 days
- Phase 7-8 (Documentation + Deployment): 1-2 days

## Backward Compatibility

The enhanced version maintains full backward compatibility:

- Old input format (url, urls) still works
- Basic output fields unchanged
- New fields added, not replaced
- Set `fullPropertyDetails=false` for basic mode
- Existing integrations continue working

## Next Steps

### Option 1: Implement Everything (Recommended)

Follow the tasks.md file through all 8 phases for the complete solution.

### Option 2: Implement in Stages

1. Start with Phase 1 (Core Infrastructure)
2. Add Phase 2 (Full Property Details)
3. Test and deploy
4. Add remaining phases incrementally

### Option 3: Cherry-Pick Features

Choose specific features you need:

- Just full property details (Phase 2)
- Just monitoring mode (Phase 1, task 4)
- Just price history (Phase 3, tasks 21-22)

## How to Start

1. **Review the spec files**:

   ```
   .kiro/specs/rightmove-scraper-enhanced/requirements.md
   .kiro/specs/rightmove-scraper-enhanced/design.md
   .kiro/specs/rightmove-scraper-enhanced/tasks.md
   ```

2. **Start with Phase 1, Task 1**:

   - Update actor.json with enhanced input schema
   - Add new input fields
   - Update descriptions

3. **Follow tasks sequentially**:

   - Each task has clear requirements
   - Code examples provided in design.md
   - Test after each phase

4. **Ask questions**:
   - If anything is unclear
   - If you need code examples
   - If you want to adjust the approach

## Example Enhanced Input

```json
{
  "listUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "propertyUrls": [{ "url": "https://www.rightmove.co.uk/properties/123456" }],
  "maxItems": 100,
  "maxPages": 5,
  "useProxy": true,
  "fullPropertyDetails": true,
  "includePriceHistory": false,
  "monitoringMode": false,
  "enableDelistingTracker": false,
  "distressKeywords": ["reduced", "chain free", "auction", "motivated"]
}
```

## Example Enhanced Output

```json
{
  "id": "158395784",
  "url": "https://www.rightmove.co.uk/properties/158395784",
  "title": "Commercial property for sale...",
  "displayAddress": "51-53 Huntly Street, Aberdeen, AB10",
  "coordinates": { "latitude": 57.14548, "longitude": -2.10789 },
  "propertyType": "Commercial Property",
  "price": "£495,000",
  "agent": "TSA Property Consultants Ltd",
  "agentPhone": "0141 673 4025",
  "images": ["https://media.rightmove.co.uk/..."],
  "brochures": [{ "url": "...", "caption": "Marketing Brochure" }],
  "nearestStations": [
    {
      "name": "Aberdeen Station",
      "types": ["NATIONAL_TRAIN"],
      "distance": 0.37,
      "unit": "miles"
    }
  ],
  "features": ["Full Building", "Private Car Park"],
  "distressKeywordsMatched": ["reduced"],
  "distressScoreRule": 2,
  "_scrapedAt": "2025-02-18T15:30:00Z"
}
```

## Questions to Consider

1. **Do you want to implement all features or start with specific ones?**
2. **What's your priority: monitoring mode, full details, or price history?**
3. **Do you want to maintain backward compatibility or create a new actor?**
4. **What's your timeline for implementation?**

## Ready to Start?

Let me know if you want to:

- Start implementing (I can help with each phase)
- Adjust the spec (add/remove features)
- Get code examples for specific components
- Clarify any requirements or design decisions

The spec is comprehensive and ready to implement. All 65 tasks are clearly defined with requirements mapped to acceptance criteria.
