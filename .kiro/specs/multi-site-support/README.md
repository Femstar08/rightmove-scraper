# Multi-Site Property Scraper Spec

## Overview

This spec extends the Rightmove Property Scraper to support multiple UK property portals (Rightmove, Zoopla, and future portals) through a clean adapter architecture.

## Status

✅ **Requirements Complete** - 14 requirements with 91 acceptance criteria
✅ **Design Complete** - Adapter architecture with 10 correctness properties  
✅ **Tasks Complete** - 40 implementation tasks across 5 phases
🚀 **Ready for Implementation**

## Key Features

### Multi-Site Support

- Automatic site detection from URLs
- Support for Rightmove and Zoopla
- Unified output schema across all portals
- Mix URLs from different portals in single run

### Adapter Architecture

- Clean separation per portal
- Easy to add new portals
- BaseAdapter interface for consistency
- Site-specific configuration options

### Cross-Site Features

- Deduplication across portals
- Unified distress detection
- Per-portal statistics
- Error isolation (one portal fails, others continue)

### Backward Compatibility

- Existing Rightmove functionality preserved
- Same input schema (with new optional fields)
- Identical output for Rightmove-only runs
- No breaking changes

## Architecture

```
Core Orchestrator
├── Site Detector (automatic portal identification)
├── Rightmove Adapter (existing code refactored)
├── Zoopla Adapter (new implementation)
└── Deduplicator (cross-site duplicate detection)
```

## Implementation Phases

### Phase 1: Adapter Architecture (Tasks 1-10)

- Create BaseAdapter interface
- Build site detector
- Create core orchestrator
- Refactor Rightmove into adapter
- Update unified schema

**Estimated Time**: 3-4 days

### Phase 2: Zoopla Adapter (Tasks 11-20)

- Research Zoopla structure
- Implement Zoopla extraction
- Handle Zoopla pagination
- Map Zoopla fields to unified schema
- Integrate into orchestrator

**Estimated Time**: 3-4 days

### Phase 3: Cross-Site Features (Tasks 21-28)

- Implement deduplication
- Add site-specific configuration
- Ensure consistent distress detection
- Add statistics aggregation
- Extend monitoring mode and delisting tracker

**Estimated Time**: 2-3 days

### Phase 4: Testing & Documentation (Tasks 29-35)

- Write comprehensive tests
- Update README
- Create adapter development guide
- Document unified schema
- Update actor metadata

**Estimated Time**: 2-3 days

### Phase 5: Deployment (Tasks 36-40)

- Backward compatibility testing
- Real Zoopla URL testing
- Cross-site scenario testing
- Performance testing
- Deploy to Apify platform

**Estimated Time**: 1-2 days

**Total Estimated Time**: 10-15 days

## Getting Started

To begin implementation:

1. Open `.kiro/specs/multi-site-support/tasks.md`
2. Start with Task 1: Create base adapter interface
3. Follow the tasks sequentially through each phase
4. Use the requirements and design docs as reference

## Files

- `requirements.md` - Complete requirements with acceptance criteria
- `design.md` - Architecture, components, and correctness properties
- `tasks.md` - 40 implementation tasks with details
- `README.md` - This overview document

## Key Design Decisions

### Why Adapter Pattern?

- Clean separation of portal-specific logic
- Easy to add new portals without touching existing code
- Testable in isolation
- Maintains single responsibility principle

### Why Unified Schema?

- Consistent output format for all portals
- Easier for users to process data
- Enables cross-site deduplication
- Simplifies downstream integrations

### Why Backward Compatibility?

- Protects existing users
- No migration required for Rightmove-only users
- Reduces deployment risk
- Allows gradual adoption of new features

## Success Criteria

- ✅ Rightmove adapter works identically to current version
- ✅ Zoopla adapter extracts all key property fields
- ✅ Can mix Rightmove and Zoopla URLs in single run
- ✅ Cross-site deduplication identifies duplicates
- ✅ All 10 correctness properties pass
- ✅ Documentation complete with examples
- ✅ Deployed to Apify platform

## Next Steps

1. **Review the spec** - Make sure you're happy with the approach
2. **Start Task 1** - Create the base adapter interface
3. **Work through phases** - Follow the task list sequentially
4. **Test frequently** - Run tests after each major component
5. **Deploy** - Push to Apify when all phases complete

---

**Version**: 1.0  
**Created**: November 28, 2025  
**Target Version**: 3.0.0 (major version bump for new features)
