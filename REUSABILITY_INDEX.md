# Reusability Index

## 📖 Start Here

**New to this template?** Start with these documents in order:

1. **REUSABILITY_SUMMARY.md** (5 min read)

   - Overview of what you have
   - Time savings and benefits
   - Quick wins

2. **HOW_TO_REUSE.md** (10 min read)

   - Three approaches to reuse
   - Step-by-step instructions
   - Real-world example

3. **templates/starter-kit/QUICK_START.md** (5 min read + 5 min doing)

   - Get your first actor running in 5 minutes
   - Hands-on tutorial

4. **templates/starter-kit/IMPLEMENTATION_GUIDE.md** (20 min read)

   - Detailed implementation steps
   - Common patterns
   - Best practices

5. **ACTOR_STARTER_KIT.md** (30 min read)

   - Complete reference
   - All components explained
   - Configuration templates

6. **docs/SCRAPER_TEMPLATE_GUIDE.md** (45 min read)
   - Deep architecture dive
   - Advanced patterns
   - Multi-site coordination

## 🎯 Quick Navigation

### I want to...

#### Start a new actor right now

→ Copy `templates/starter-kit/` and read `QUICK_START.md`

#### Understand the architecture

→ Read `ACTOR_STARTER_KIT.md`

#### See a real example

→ Check `src/adapters/rightmove-adapter.js` and `src/adapters/zoopla-adapter.js`

#### Learn best practices

→ Read `templates/starter-kit/IMPLEMENTATION_GUIDE.md`

#### Set up for my team

→ Read `HOW_TO_REUSE.md` → "Approach 2: GitHub Template"

#### Create an npm package

→ Read `HOW_TO_REUSE.md` → "Approach 3: NPM Package"

#### Understand time savings

→ Read `REUSABILITY_SUMMARY.md` → "Time Savings" section

#### See what's included

→ Read `REUSABILITY_SUMMARY.md` → "What's Ready to Reuse" section

## 📁 File Structure

```
rightmove-scraper/
│
├── 📘 REUSABILITY_INDEX.md          ← You are here
├── 📘 REUSABILITY_SUMMARY.md        ← Overview and benefits
├── 📘 HOW_TO_REUSE.md               ← Main reuse guide
├── 📘 ACTOR_STARTER_KIT.md          ← Complete reference
│
├── templates/
│   └── starter-kit/                 ← COPY THIS for new actors
│       ├── 📘 README.md             ← Template overview
│       ├── 📘 QUICK_START.md        ← 5-minute setup
│       ├── 📘 IMPLEMENTATION_GUIDE.md ← Step-by-step tutorial
│       ├── src/
│       │   ├── adapters/
│       │   │   ├── base-adapter.js       ← Interface (copy as-is)
│       │   │   └── adapter-factory.js    ← Factory (customize)
│       │   ├── utils/
│       │   │   ├── logger.js             ← Logging (copy as-is)
│       │   │   └── field-mapping.js      ← Schema (customize)
│       │   └── schemas/
│       ├── .actor/
│       │   └── actor.json                ← Config (customize)
│       ├── package.json                  ← Dependencies (customize)
│       ├── jest.config.js                ← Tests (copy as-is)
│       ├── Dockerfile                    ← Container (copy as-is)
│       └── .gitignore                    ← Git (copy as-is)
│
├── docs/
│   ├── 📘 SCRAPER_TEMPLATE_GUIDE.md ← Architecture deep-dive
│   ├── 📘 MULTI_SITE_GUIDE.md       ← Multi-site features
│   └── 📘 UNIFIED_SCHEMA.md         ← Schema documentation
│
└── src/                             ← Reference implementations
    ├── adapters/
    │   ├── rightmove-adapter.js     ← Real example
    │   ├── zoopla-adapter.js        ← Real example
    │   ├── base-adapter.js          ← Production version
    │   └── adapter-factory.js       ← Production version
    ├── core/
    │   ├── orchestrator.js          ← Multi-site coordinator
    │   └── deduplicator.js          ← Deduplication logic
    └── utils/
        ├── logger.js                ← Production version
        └── field-mapping.js         ← Production version
```

## 🎓 Learning Paths

### Path 1: Quick Start (30 minutes)

Perfect for: Getting something working fast

1. Read `REUSABILITY_SUMMARY.md` (5 min)
2. Copy `templates/starter-kit/` (1 min)
3. Follow `QUICK_START.md` (5 min)
4. Build your first adapter (20 min)

**Result:** Working actor deployed

### Path 2: Deep Understanding (2 hours)

Perfect for: Building complex actors

1. Read `REUSABILITY_SUMMARY.md` (5 min)
2. Read `HOW_TO_REUSE.md` (10 min)
3. Read `ACTOR_STARTER_KIT.md` (30 min)
4. Read `IMPLEMENTATION_GUIDE.md` (20 min)
5. Study `src/adapters/rightmove-adapter.js` (20 min)
6. Read `docs/SCRAPER_TEMPLATE_GUIDE.md` (45 min)

**Result:** Complete understanding of architecture

### Path 3: Team Setup (1 hour)

Perfect for: Setting up for multiple developers

1. Read `HOW_TO_REUSE.md` (10 min)
2. Create GitHub template repo (20 min)
3. Document team-specific patterns (20 min)
4. Onboard first team member (10 min)

**Result:** Team-ready template system

## 🔧 Component Reference

### Core Components (Copy As-Is)

| Component       | File                              | Purpose              |
| --------------- | --------------------------------- | -------------------- |
| Base Adapter    | `src/adapters/base-adapter.js`    | Interface definition |
| Adapter Factory | `src/adapters/adapter-factory.js` | Site routing         |
| Logger          | `src/utils/logger.js`             | Structured logging   |
| Field Mapping   | `src/utils/field-mapping.js`      | Schema validation    |
| Jest Config     | `jest.config.js`                  | Test setup           |
| Dockerfile      | `Dockerfile`                      | Container config     |

### Customizable Components

| Component     | File                              | What to Change                      |
| ------------- | --------------------------------- | ----------------------------------- |
| Schema        | `src/utils/field-mapping.js`      | `UNIFIED_SCHEMA`, `REQUIRED_FIELDS` |
| Site Adapters | `src/adapters/[site]-adapter.js`  | Create new files                    |
| Factory       | `src/adapters/adapter-factory.js` | Add site detection                  |
| Input Schema  | `.actor/actor.json`               | Input parameters                    |
| Main Logic    | `src/main.js`                     | Scraping logic                      |

### Optional Components

| Component    | File                       | When to Use             |
| ------------ | -------------------------- | ----------------------- |
| Orchestrator | `src/core/orchestrator.js` | Multi-site coordination |
| Deduplicator | `src/core/deduplicator.js` | Cross-site dedup        |

## 📊 Comparison Matrix

### Reuse Approaches

| Approach         | Setup Time | Maintenance | Best For          | Complexity |
| ---------------- | ---------- | ----------- | ----------------- | ---------- |
| Copy Starter Kit | 5 min      | Manual      | Single developer  | Low        |
| GitHub Template  | 30 min     | Git-based   | Teams             | Medium     |
| NPM Package      | 2 hours    | Centralized | Multiple projects | High       |

### Actor Types

| Type        | Complexity | Time with Template | Time without |
| ----------- | ---------- | ------------------ | ------------ |
| Single-site | Low        | 2-4 hours          | 2-3 days     |
| Multi-site  | Medium     | 4-8 hours          | 5-10 days    |
| With dedup  | High       | 8-16 hours         | 10-15 days   |

## ✅ Checklists

### Starting a New Actor

- [ ] Copy `templates/starter-kit/`
- [ ] Run `npm install`
- [ ] Update `package.json` name
- [ ] Define schema in `field-mapping.js`
- [ ] Create first adapter
- [ ] Update `adapter-factory.js`
- [ ] Configure `.actor/actor.json`
- [ ] Write tests
- [ ] Test locally
- [ ] Deploy

### Adding a New Site

- [ ] Create `src/adapters/[site]-adapter.js`
- [ ] Extend `BaseAdapter`
- [ ] Implement required methods
- [ ] Add to `adapter-factory.js`
- [ ] Write tests
- [ ] Test integration

### Before Deploying

- [ ] All tests pass
- [ ] README updated
- [ ] Input schema documented
- [ ] Example inputs provided
- [ ] Error handling tested
- [ ] Proxy configured (if needed)
- [ ] Memory limits set
- [ ] Timeout configured

## 🎯 Success Metrics

You're using this correctly when:

✅ New actors take < 2 hours to start
✅ Code is consistent across projects
✅ Tests pass on first run
✅ Documentation is clear
✅ Team members can contribute easily

## 🆘 Troubleshooting

### Common Issues

**"I don't know where to start"**
→ Read `QUICK_START.md` and follow along

**"I need to understand the architecture"**
→ Read `ACTOR_STARTER_KIT.md`

**"My adapter isn't working"**
→ Check `src/adapters/rightmove-adapter.js` for a working example

**"Tests are failing"**
→ Make sure you updated `adapter-factory.js`

**"I want to add a feature"**
→ Check `docs/SCRAPER_TEMPLATE_GUIDE.md` for patterns

**"How do I share this with my team?"**
→ Read `HOW_TO_REUSE.md` → "Approach 2"

## 📚 Additional Resources

### In This Project

- All test files (`*.test.js`) - Testing examples
- `src/main.js` - Entry point example
- `src/core/orchestrator.js` - Multi-site coordination
- `README.md` - Project documentation

### External

- [Apify Documentation](https://docs.apify.com/)
- [Crawlee Documentation](https://crawlee.dev/)
- [Playwright Documentation](https://playwright.dev/)

## 🔄 Maintenance

### Keeping Templates Updated

1. **Discover new pattern** → Document it
2. **Fix a bug** → Update starter kit
3. **Add feature** → Add to templates
4. **Learn something** → Update guides

### Version Control

```bash
# Tag releases
git tag -a template-v1.0.0 -m "Initial template"
git push --tags

# Reference specific versions
git checkout template-v1.0.0
```

## 🎉 Quick Wins

### Today (5 minutes)

- [ ] Read `REUSABILITY_SUMMARY.md`
- [ ] Bookmark this index

### This Week (2 hours)

- [ ] Copy starter kit
- [ ] Build a test actor
- [ ] Deploy it

### This Month (1 day)

- [ ] Create GitHub template
- [ ] Build 2-3 actors
- [ ] Document improvements

## 📞 Getting Help

1. **Check the docs** - Start with this index
2. **Review examples** - Look at real adapters
3. **Read tests** - See how components work
4. **Experiment** - Copy and modify

## 🚀 Next Steps

**Right now:**

1. Read `REUSABILITY_SUMMARY.md` (5 min)
2. Choose your learning path above
3. Start building!

**This week:**

1. Build your first actor with the template
2. Document any issues you find
3. Share with your team

**This month:**

1. Create your reuse strategy (copy/GitHub/npm)
2. Build multiple actors
3. Refine your process

---

## Summary

**You have:**

- ✅ Production-proven template
- ✅ Complete documentation
- ✅ Real-world examples
- ✅ Testing framework
- ✅ Deployment setup

**You can:**

- ✅ Start new actors in < 2 hours
- ✅ Reuse proven patterns
- ✅ Scale to multiple sites
- ✅ Maintain consistency
- ✅ Onboard team members quickly

**Time saved:**

- ✅ 95% reduction in setup time
- ✅ Weeks of development avoided
- ✅ Consistent quality across projects

---

**Start here:** `REUSABILITY_SUMMARY.md`

**Build now:** `templates/starter-kit/QUICK_START.md`

**Go deep:** `ACTOR_STARTER_KIT.md`

---

_Last Updated: December 2024_
_Based on: UK Property Scraper v2.2.0_
_Status: Production-Ready ✅_
