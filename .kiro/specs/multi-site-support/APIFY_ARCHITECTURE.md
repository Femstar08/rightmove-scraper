# Apify Architecture for Multi-Site Support

## Recommended Approach: Single Actor with Site Parameter

### Architecture Overview

```
┌─────────────────────────────────────┐
│   UK Property Scraper Actor        │
│   (single Apify deployment)         │
└─────────────────────────────────────┘
                 │
                 ├─ Input: { site: "rightmove", ... }
                 ├─ Input: { site: "zoopla", ... }
                 └─ Input: { site: "onthemarket", ... }
                 │
                 ▼
┌─────────────────────────────────────┐
│      Site Adapter Router            │
└─────────────────────────────────────┘
         │           │           │
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │Rightmove│  │ Zoopla │  │OnThe   │
    │Adapter  │  │Adapter │  │Market  │
    └────────┘  └────────┘  └────────┘
```

### Input Schema

```json
{
  "site": "rightmove",  // NEW: "rightmove" | "zoopla" | "onthemarket"
  "startUrls": [...],
  "maxItems": 200,
  "maxPages": 5,
  "fullPropertyDetails": true,
  "distressKeywords": [...],
  "onlyDistressed": true,
  // ... other shared parameters
}
```

### Benefits

- **Single API endpoint**: Users call one actor with different site parameters
- **Unified monitoring**: All scraping metrics in one place
- **Shared infrastructure**: Proxy rotation, storage, error handling
- **Easier maintenance**: Update shared logic once
- **Cost effective**: One deployment, one set of resources

### Alternative: Separate Actors (Not Recommended)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ rightmove-scraper│  │  zoopla-scraper  │  │onthemarket-scraper│
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

- More deployments to manage
- Code duplication
- Harder to keep in sync
- Higher operational overhead

### Implementation Plan

1. Keep current `rightmove-scraper` name for backward compatibility
2. Add `site` parameter (default: "rightmove")
3. Implement adapter pattern internally
4. Later: Rename to `uk-property-scraper` if needed

### Deployment Strategy

- **Phase 1**: Deploy with Rightmove adapter only (backward compatible)
- **Phase 2**: Add Zoopla adapter (users opt-in with `site: "zoopla"`)
- **Phase 3**: Add OnTheMarket adapter
- **Phase 4**: Consider renaming actor to reflect multi-site capability
