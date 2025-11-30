# Multi-Site Scraper Template Package

## Overview

This project includes a complete, reusable template for building multi-site scrapers using the adapter pattern. The architecture has been battle-tested with Rightmove and Zoopla property scrapers and can be adapted for any multi-source scraping project.

---

## 📦 What's Included

### 1. Complete Documentation

- **`docs/SCRAPER_TEMPLATE_GUIDE.md`** - Comprehensive 500+ line guide
  - Architecture explanation
  - Step-by-step implementation guide
  - Complete job board aggregator example
  - Common patterns and best practices
  - Testing strategies

### 2. Ready-to-Use Templates

Located in `templates/` directory:

```
templates/
├── TEMPLATE_README.md                    # Quick start guide
├── adapters/
│   ├── base-adapter-template.js         # Base adapter interface
│   ├── adapter-factory-template.js      # Factory pattern
│   └── example-adapter-template.js      # Example implementation
```

### 3. Working Reference Implementation

The entire codebase serves as a reference:

```
src/
├── adapters/
│   ├── base-adapter.js                  # ✅ Production base adapter
│   ├── adapter-factory.js               # ✅ Production factory
│   ├── rightmove-adapter.js             # ✅ 700+ lines reference
│   └── zoopla-adapter.js                # ✅ 300+ lines reference
├── core/
│   └── orchestrator.js                  # ✅ Multi-site orchestrator
├── utils/
│   ├── field-mapping.js                 # ✅ Schema validation
│   └── logger.js                        # ✅ Site-contextual logging
└── schemas/
    └── unified-property-schema.js       # ✅ Schema definition
```

---

## 🚀 Quick Start

### For a New Project

1. **Copy the templates:**

   ```bash
   cp -r templates/adapters your-project/src/adapters
   ```

2. **Read the guide:**

   ```bash
   open docs/SCRAPER_TEMPLATE_GUIDE.md
   ```

3. **Follow the checklist:**
   - Define your domain (jobs, products, etc.)
   - Create unified schema
   - Implement site adapters
   - Test and deploy

### For Learning

1. **Study the reference implementation:**

   - `src/adapters/rightmove-adapter.js` - Complete adapter (700+ lines)
   - `src/adapters/zoopla-adapter.js` - Second adapter (300+ lines)
   - `src/core/orchestrator.js` - Multi-site coordination

2. **Run the tests:**

   ```bash
   npm test -- src/adapters
   ```

3. **Review the documentation:**
   - `docs/UNIFIED_SCHEMA.md` - Schema design
   - `docs/ZOOPLA_RESEARCH.md` - Research process
   - `PHASE1_FINAL_COMPLETION.md` - Implementation summary

---

## 📚 Documentation Structure

### Level 1: Quick Start

- `templates/TEMPLATE_README.md` - 5-minute quick start
- Get up and running fast

### Level 2: Comprehensive Guide

- `docs/SCRAPER_TEMPLATE_GUIDE.md` - Complete guide
- Step-by-step instructions
- Full job board aggregator example
- Common patterns and best practices

### Level 3: Reference Implementation

- Study the actual codebase
- See how it's done in production
- 143 tests to learn from

---

## 🎯 Use Cases

This template works for:

### ✅ Job Aggregators

- Indeed, LinkedIn, Glassdoor
- Monster, CareerBuilder, Dice

### ✅ E-commerce

- Amazon, eBay, Etsy
- Walmart, Target, Best Buy

### ✅ Real Estate

- Rightmove, Zoopla, OnTheMarket (this project!)
- Zillow, Realtor.com, Redfin

### ✅ News Aggregators

- Multiple news sites
- RSS feeds
- Blog platforms

### ✅ Price Comparison

- Multiple retailers
- Travel booking sites
- Insurance comparison

### ✅ Review Aggregators

- Yelp, Google Reviews, TripAdvisor
- Product reviews across sites

### ✅ Social Media

- Multiple platforms
- Content aggregation

---

## 🏗️ Architecture Benefits

### 1. Clean Separation of Concerns

```
Site-Specific Logic → Adapters
Common Logic → Utilities
Coordination → Orchestrator
```

### 2. Easy to Extend

- Add new site = Create new adapter
- No changes to existing code
- Plug-and-play architecture

### 3. Error Isolation

- One site fails → Others continue
- Detailed error logging per site
- Graceful degradation

### 4. Unified Output

- Consistent data format
- Cross-site deduplication
- Easy to consume downstream

### 5. Well Tested

- 143 tests in reference implementation
- Unit tests per adapter
- Integration tests for orchestrator

---

## 📖 Example: Job Board Aggregator

The guide includes a complete example of building a job board aggregator:

```javascript
// Define schema
const UNIFIED_JOB_SCHEMA = {
  id: "string",
  title: "string",
  company: "string",
  location: "string",
  salary: "string",
  // ...
};

// Implement adapters
class IndeedAdapter extends BaseAdapter {
  async extractJobs(page) {
    // Indeed-specific logic
  }
}

class LinkedInAdapter extends BaseAdapter {
  async extractJobs(page) {
    // LinkedIn-specific logic
  }
}

// Use orchestrator
const orchestrator = new JobOrchestrator(input);
const results = await orchestrator.run();
```

See `docs/SCRAPER_TEMPLATE_GUIDE.md` for the complete implementation.

---

## 🧪 Testing Approach

### Unit Tests

- Test each adapter independently
- Mock page data
- Test field mapping

### Integration Tests

- Test orchestrator with multiple adapters
- Test cross-site deduplication
- Test error handling

### Example Test Structure

```javascript
describe("IndeedAdapter", () => {
  test("should extract jobs correctly", () => {
    // Test implementation
  });

  test("should handle missing fields", () => {
    // Test implementation
  });
});
```

---

## 📋 Implementation Checklist

When creating a new scraper:

- [ ] **Define Domain**

  - [ ] What are you scraping?
  - [ ] Which sites?
  - [ ] What fields do you need?

- [ ] **Copy Templates**

  - [ ] Base adapter
  - [ ] Adapter factory
  - [ ] Example adapter

- [ ] **Create Schema**

  - [ ] Define all fields
  - [ ] Mark required fields
  - [ ] Plan for site-specific data

- [ ] **Implement Adapters**

  - [ ] One per site
  - [ ] All required methods
  - [ ] Field mapping

- [ ] **Test**

  - [ ] Unit tests per adapter
  - [ ] Integration tests
  - [ ] Mock data tests

- [ ] **Document**

  - [ ] README with examples
  - [ ] Schema documentation
  - [ ] Site-specific notes

- [ ] **Deploy**
  - [ ] Configure Apify
  - [ ] Set memory/timeout
  - [ ] Test in production

---

## 🔧 Customization Points

### 1. Schema Definition

Adapt `UNIFIED_SCHEMA` to your domain:

```javascript
const UNIFIED_SCHEMA = {
  // Your fields here
};
```

### 2. Adapter Methods

Implement site-specific logic:

```javascript
async extractFromJavaScript(page) {
  // Your extraction logic
}
```

### 3. Deduplication Logic

Customize how duplicates are detected:

```javascript
deduplicateItems(items) {
  // Your deduplication logic
}
```

### 4. Pagination

Adapt to site's pagination pattern:

```javascript
buildPageUrl(baseUrl, pageNumber) {
  // Your pagination logic
}
```

---

## 📊 Reference Implementation Stats

### Code

- **2,000+ lines** of production code
- **1,200+ lines** of test code
- **143 tests** passing
- **0 failures**

### Documentation

- **500+ lines** template guide
- **400+ lines** schema documentation
- **300+ lines** research documentation

### Architecture

- **2 adapters** (Rightmove, Zoopla)
- **1 orchestrator**
- **5 utility modules**
- **1 unified schema**

---

## 🎓 Learning Path

### Beginner

1. Read `templates/TEMPLATE_README.md`
2. Copy templates to new project
3. Follow quick start guide

### Intermediate

1. Read `docs/SCRAPER_TEMPLATE_GUIDE.md`
2. Study job board aggregator example
3. Implement your own scraper

### Advanced

1. Study reference implementation
2. Review all tests
3. Understand orchestrator patterns
4. Customize for complex scenarios

---

## 💡 Best Practices

### 1. Start Simple

- Implement one adapter first
- Test thoroughly
- Add more adapters incrementally

### 2. Test Early

- Write tests as you implement
- Use mock data initially
- Test with real data later

### 3. Document Everything

- Document each site's structure
- Document field mappings
- Document known limitations

### 4. Handle Errors Gracefully

- Isolate errors per site
- Log detailed information
- Continue processing other sites

### 5. Respect Rate Limits

- Implement delays
- Use proxies if needed
- Monitor request rates

---

## 🔗 Related Files

### Documentation

- `docs/SCRAPER_TEMPLATE_GUIDE.md` - Main guide
- `docs/UNIFIED_SCHEMA.md` - Schema documentation
- `docs/ZOOPLA_RESEARCH.md` - Research example

### Templates

- `templates/TEMPLATE_README.md` - Quick start
- `templates/adapters/*.js` - Template files

### Reference Code

- `src/adapters/` - Production adapters
- `src/core/` - Orchestrator
- `src/utils/` - Utilities

### Tests

- `src/adapters/*.test.js` - Adapter tests
- `src/core/*.test.js` - Orchestrator tests

---

## 🤝 Contributing

If you build something cool with this template:

1. Share your experience
2. Contribute improvements
3. Add new patterns to the guide

---

## 📝 License

This template is based on the UK Property Scraper project and follows the same license.

---

## 🎉 Success Stories

This architecture has been used for:

- ✅ UK Property Scraper (Rightmove + Zoopla)
- ✅ 143 tests passing
- ✅ Production-ready
- ✅ Fully documented

**Your project could be next!**

---

## 📞 Support

### Getting Started

1. Read `templates/TEMPLATE_README.md`
2. Follow the quick start guide
3. Copy template files

### Need Help?

1. Check `docs/SCRAPER_TEMPLATE_GUIDE.md`
2. Review reference implementation
3. Study test files for examples

### Advanced Topics

1. Review orchestrator patterns
2. Study deduplication logic
3. Examine error handling

---

## 🚀 Next Steps

1. **Read the guide:** `docs/SCRAPER_TEMPLATE_GUIDE.md`
2. **Copy templates:** `templates/adapters/`
3. **Study reference:** `src/adapters/rightmove-adapter.js`
4. **Build your scraper!**

---

_Template Package v1.0_  
_Based on: UK Property Scraper v2.1.0_  
_Architecture: Adapter Pattern with Orchestrator_  
_Last updated: November 30, 2025_

**Happy Scraping! 🎯**
