# Adaptive Scraping Strategy for Rightmove

## Problem Statement

Rightmove's page structure changes frequently, causing scrapers to break. We need a robust, adaptive approach that can handle:

- Changing CSS class names
- Changing HTML structure
- Changing JavaScript data object locations
- New page layouts and components

## Research Findings

### Current Issues (from logs)

1. ✅ JavaScript extraction found `__NEXT_DATA__` but no `propertyData` in expected location
2. ❌ DOM selectors found wrong element (filter wrapper instead of property cards)
3. ❌ All property fields returned null

### Key Insights from Existing Code

- We have a dual extraction strategy: JavaScript (primary) + DOM (fallback)
- We try multiple selectors in sequence
- We have a debug script that can inspect page structure

## Proposed Adaptive Strategies

### Strategy 1: **Multi-Path JavaScript Extraction** (RECOMMENDED)

Instead of looking for data in one location, try multiple paths:

```javascript
async function extractPageModel(page) {
  const dataLocations = [
    // Try multiple possible locations
    () => window.PAGE_MODEL,
    () => window.__NEXT_DATA__,
    () => window.__NEXT_DATA__?.props?.pageProps,
    () => window.__NEXT_DATA__?.props?.pageProps?.initialProps,
    () => window.__NEXT_DATA__?.props?.pageProps?.serverState,
    () => window.PRELOADED_STATE,
    () => window.__INITIAL_STATE__,
    // Try to find it in script tags
    () => {
      const scripts = document.querySelectorAll(
        'script[type="application/json"]'
      );
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data.props || data.propertyData || data.properties) {
            return data;
          }
        } catch (e) {}
      }
      return null;
    },
  ];

  for (const getter of dataLocations) {
    try {
      const data = await page.evaluate(getter);
      if (data) {
        console.log(
          `✓ Found data using method ${dataLocations.indexOf(getter) + 1}`
        );
        return data;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}
```

**Advantages:**

- Resilient to data location changes
- Logs which method worked (helps identify patterns)
- Falls back gracefully

### Strategy 2: **Intelligent Property Data Discovery**

Once we have the JavaScript object, recursively search for property arrays:

```javascript
function findPropertyData(obj, maxDepth = 5, currentDepth = 0) {
  if (currentDepth > maxDepth) return null;

  // Check if this object looks like property data
  if (Array.isArray(obj)) {
    // Check if array contains property-like objects
    if (
      obj.length > 0 &&
      obj[0].id &&
      (obj[0].price || obj[0].displayAddress)
    ) {
      return obj;
    }
  }

  // Check common property data keys
  const propertyKeys = [
    "propertyData",
    "properties",
    "results",
    "listings",
    "searchResults",
    "items",
    "data",
  ];

  for (const key of propertyKeys) {
    if (obj[key]) {
      const result = findPropertyData(obj[key], maxDepth, currentDepth + 1);
      if (result) return result;
    }
  }

  // Recursively search nested objects
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const result = findPropertyData(obj[key], maxDepth, currentDepth + 1);
      if (result) return result;
    }
  }

  return null;
}
```

**Advantages:**

- Finds property data regardless of nesting level
- Identifies property data by structure, not location
- Adapts to schema changes

### Strategy 3: **Adaptive DOM Selector Discovery**

Instead of hardcoded selectors, discover them dynamically:

```javascript
async function discoverPropertyCardSelector(page) {
  return await page.evaluate(() => {
    // Patterns that indicate a property card
    const patterns = {
      classPatterns: [
        /property.*card/i,
        /search.*result/i,
        /listing.*item/i,
        /property.*item/i,
      ],
      idPatterns: [/^property-\d+$/, /^listing-\d+$/],
      dataAttributes: [
        "data-test",
        "data-testid",
        "data-property-id",
        "data-listing-id",
      ],
    };

    // Find elements that match patterns
    const candidates = [];

    // Check all elements
    document.querySelectorAll("*").forEach((el) => {
      let score = 0;

      // Check class names
      patterns.classPatterns.forEach((pattern) => {
        if (pattern.test(el.className)) score += 10;
      });

      // Check IDs
      patterns.idPatterns.forEach((pattern) => {
        if (pattern.test(el.id)) score += 10;
      });

      // Check data attributes
      patterns.dataAttributes.forEach((attr) => {
        if (el.hasAttribute(attr)) score += 5;
      });

      // Check if it contains price-like text
      if (el.textContent.match(/£[\d,]+/)) score += 3;

      // Check if it contains address-like text
      if (
        el.textContent.match(/\b[A-Z][a-z]+\s+Street\b|\b[A-Z][a-z]+\s+Road\b/)
      )
        score += 3;

      if (score > 10) {
        candidates.push({
          element: el,
          score: score,
          selector: generateSelector(el),
        });
      }
    });

    // Return best candidate
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.selector || null;

    function generateSelector(el) {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className.split(" ").filter((c) => c.length > 0);
        if (classes.length > 0) return `.${classes[0]}`;
      }
      return el.tagName.toLowerCase();
    }
  });
}
```

**Advantages:**

- Discovers selectors based on content patterns
- Adapts to class name changes
- Scores candidates to find best match

### Strategy 4: **Visual Structure Analysis**

Use visual cues to identify property cards:

```javascript
async function findPropertyCardsByLayout(page) {
  return await page.evaluate(() => {
    // Find repeating elements with similar structure
    const allElements = Array.from(document.querySelectorAll("*"));

    // Group elements by similar dimensions
    const groups = {};
    allElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 150) {
        const key = `${Math.round(rect.width / 50)}_${Math.round(
          rect.height / 50
        )}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(el);
      }
    });

    // Find largest group (likely property cards)
    let largestGroup = [];
    for (const key in groups) {
      if (groups[key].length > largestGroup.length) {
        largestGroup = groups[key];
      }
    }

    return largestGroup.map((el) => ({
      selector: generateSelector(el),
      dimensions: el.getBoundingClientRect(),
    }));
  });
}
```

**Advantages:**

- Works even when classes/IDs change completely
- Identifies repeating patterns
- Based on visual layout

### Strategy 5: **Machine Learning Selector Prediction** (Advanced)

Train a model to predict correct selectors:

```javascript
// Collect training data from successful scrapes
const selectorHistory = {
  "2025-01": ".propertyCard",
  "2025-02": '[data-test="property-card"]',
  "2025-03": ".SearchResult_card",
};

// Use pattern matching to predict next selector
function predictSelector(currentSelectors) {
  // Analyze patterns in historical selectors
  // Return most likely current selector
}
```

**Advantages:**

- Learns from historical changes
- Predicts future changes
- Can be updated without code changes

### Strategy 6: **Fallback Chain with Confidence Scoring**

Combine multiple strategies with confidence scores:

```javascript
async function extractWithConfidence(page) {
  const strategies = [
    { name: "JavaScript", fn: extractFromJavaScript, weight: 10 },
    { name: "Adaptive DOM", fn: extractFromAdaptiveDOM, weight: 8 },
    { name: "Visual Layout", fn: extractFromVisualLayout, weight: 6 },
    { name: "Legacy Selectors", fn: extractFromLegacySelectors, weight: 4 },
  ];

  for (const strategy of strategies) {
    try {
      const result = await strategy.fn(page);
      if (result && result.length > 0) {
        const confidence = calculateConfidence(result);
        console.log(
          `✓ ${strategy.name} succeeded with ${confidence}% confidence`
        );

        if (confidence > 70) {
          return result;
        }
      }
    } catch (e) {
      console.log(`✗ ${strategy.name} failed: ${e.message}`);
    }
  }

  return [];
}

function calculateConfidence(properties) {
  let score = 0;
  const total = properties.length;

  properties.forEach((prop) => {
    if (prop.url) score += 20;
    if (prop.price) score += 20;
    if (prop.address) score += 20;
    if (prop.description) score += 20;
    if (prop.image) score += 20;
  });

  return Math.round(score / total);
}
```

**Advantages:**

- Multiple fallback options
- Validates extraction quality
- Logs which strategy worked

## Recommended Implementation Plan

### Phase 1: Immediate Fixes (1-2 days)

1. **Enhance JavaScript extraction** (Strategy 1)
   - Add multiple data location paths
   - Implement recursive property data discovery (Strategy 2)
2. **Improve DOM extraction** (Strategy 3)

   - Add adaptive selector discovery
   - Score candidates by content patterns

3. **Add confidence scoring** (Strategy 6)
   - Validate extracted data quality
   - Log which strategy succeeded

### Phase 2: Advanced Resilience (3-5 days)

4. **Implement visual structure analysis** (Strategy 4)

   - Identify property cards by layout
   - Use as additional fallback

5. **Add selector learning system**

   - Store successful selectors with timestamps
   - Analyze patterns over time
   - Predict likely current selectors

6. **Create monitoring dashboard**
   - Track extraction success rates
   - Alert when strategies fail
   - Suggest selector updates

### Phase 3: Automation (5-7 days)

7. **Auto-update system**

   - Automatically test new selectors
   - Update configuration without code changes
   - A/B test different strategies

8. **Community feedback loop**
   - Allow users to report broken selectors
   - Crowdsource working selectors
   - Auto-deploy fixes

## Testing Strategy

### 1. Selector Rotation Testing

```javascript
// Test with intentionally wrong selectors
const testSelectors = [
  ".oldSelector", // Should fail
  ".currentSelector", // Should work
  ".futureSelector", // Should fail
];

// Verify fallback chain works
```

### 2. Data Structure Variation Testing

```javascript
// Test with different data structures
const testStructures = [
  { propertyData: [...] },  // Current
  { props: { pageProps: { properties: [...] } } },  // Alternative
  { results: [...] }  // Another alternative
];
```

### 3. Confidence Threshold Testing

```javascript
// Verify confidence scoring
const testCases = [
  { data: fullProperty, expectedConfidence: 100 },
  { data: partialProperty, expectedConfidence: 60 },
  { data: emptyProperty, expectedConfidence: 0 },
];
```

## Monitoring & Alerts

### Key Metrics to Track

1. **Extraction Success Rate**: % of runs that extract data
2. **Strategy Usage**: Which strategy is being used most
3. **Confidence Scores**: Average confidence of extractions
4. **Field Completeness**: % of properties with all fields
5. **Selector Lifespan**: How long selectors remain valid

### Alert Triggers

- Success rate drops below 80%
- Confidence scores drop below 70%
- Primary strategy fails 3 times in a row
- New page structure detected

## Configuration Management

### Externalize Selectors

```json
{
  "version": "2025-11-26",
  "selectors": {
    "propertyCard": [
      ".propertyCard",
      "[data-test='property-card']",
      ".SearchResult_card"
    ],
    "price": [".propertyCard-priceValue", "[data-test='price']", ".price"]
  },
  "dataLocations": ["window.PAGE_MODEL", "window.__NEXT_DATA__.props.pageProps"]
}
```

### Update Without Deployment

- Store configuration in Apify Key-Value store
- Load at runtime
- Update via API or UI
- No code changes needed

## Cost-Benefit Analysis

| Strategy           | Implementation Time | Maintenance | Resilience | Recommended |
| ------------------ | ------------------- | ----------- | ---------- | ----------- |
| Multi-Path JS      | 4 hours             | Low         | High       | ✅ Yes      |
| Property Discovery | 6 hours             | Low         | High       | ✅ Yes      |
| Adaptive DOM       | 8 hours             | Medium      | High       | ✅ Yes      |
| Visual Layout      | 12 hours            | Medium      | Medium     | ⚠️ Maybe    |
| ML Prediction      | 40 hours            | High        | Very High  | ❌ Later    |
| Confidence Scoring | 4 hours             | Low         | N/A        | ✅ Yes      |

## Next Steps

1. **Immediate**: Implement Strategies 1, 2, 3, and 6 (Multi-path JS, Property Discovery, Adaptive DOM, Confidence Scoring)
2. **Short-term**: Add monitoring and alerting
3. **Medium-term**: Implement visual layout analysis
4. **Long-term**: Consider ML-based prediction

## Questions for Discussion

1. **Priority**: Which strategy should we implement first?
2. **Monitoring**: Do you have access to Apify monitoring/alerting?
3. **Updates**: How quickly can you deploy fixes when selectors break?
4. **Budget**: What's the acceptable cost for resilience vs. manual fixes?
5. **Data Quality**: What's the minimum acceptable confidence score?

## Conclusion

The key to handling Rightmove's frequent changes is:

1. **Multiple extraction paths** - Don't rely on one method
2. **Intelligent discovery** - Find data by structure, not location
3. **Confidence validation** - Know when extraction is working
4. **Fast updates** - Externalize configuration for quick fixes
5. **Monitoring** - Detect failures early

**Recommended First Step**: Implement Strategies 1, 2, and 6 together - they provide the best resilience-to-effort ratio and can be done in 1-2 days.
