# Phase 1 Deployment Instructions

## ✅ Pre-Deployment Complete

All code changes have been committed and pushed to GitHub:

- Version updated to 2.1.0
- All tests passing (113/113)
- Documentation complete
- Backward compatibility verified

**Commit:** `0d18ddb` - "Phase 1: Multi-Site Architecture Foundation v2.1.0"

## 🚀 Deploy to Apify

You have **three options** for deployment:

---

## Option 1: Apify CLI (Fastest)

### Step 1: Login to Apify

```bash
npx apify-cli login
```

This will:

1. Open your browser
2. Ask you to login to Apify
3. Generate an API token
4. Save credentials locally

### Step 2: Deploy

```bash
npx apify-cli push
```

This will:

- Build the actor
- Upload to Apify
- Make it live in your account

**Done!** Your actor is deployed.

---

## Option 2: GitHub Integration (Recommended for Auto-Deploy)

### Step 1: Connect GitHub to Apify

1. Go to https://console.apify.com
2. Click **"Create new"** → **"Actor"**
3. Choose **"Import from GitHub"**
4. Select repository: `Femstar08/rightmove-scraper`
5. Branch: `main`
6. Click **"Create"**

### Step 2: Configure Build

The actor will automatically detect:

- Dockerfile
- .actor/actor.json
- package.json

Click **"Build"** to start the first build.

### Step 3: Enable Auto-Deploy (Optional)

In actor settings:

- Enable "Build on push to GitHub"
- Future commits will automatically deploy

**Done!** Your actor is deployed and will auto-update.

---

## Option 3: Manual Verification (If CLI/GitHub Issues)

If you encounter issues, you can verify the deployment manually:

### Check Current Deployment

1. Go to https://console.apify.com
2. Find your "rightmove-scraper" actor
3. Check the version number (should be 2.1.0)
4. Review recent builds

---

## 🧪 Test the Deployment

### Test 1: Basic Rightmove Scraping

Run with this input:

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "maxItems": 5,
  "maxPages": 1,
  "fullPropertyDetails": true,
  "onlyDistressed": false
}
```

**Expected Result:**

- 5 properties extracted
- All fields present
- No errors in logs
- Enhanced logging visible

### Test 2: New Input Parameters

Run with new Phase 1 features:

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "maxItems": 5,
  "crossSiteDeduplication": true,
  "siteConfig": {
    "rightmove": {
      "enabled": true,
      "maxPages": 2,
      "maxItems": 10
    }
  }
}
```

**Expected Result:**

- New parameters accepted
- Site-specific config applied
- Enhanced logging shows adapter initialization

### Test 3: Backward Compatibility

Run with old v2.0 input (no new fields):

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "maxItems": 5,
  "fullPropertyDetails": true
}
```

**Expected Result:**

- Works exactly as before
- Same output format
- No breaking changes

---

## 📊 Verify Deployment Success

### Check These Indicators

✅ **Build Status**: "Succeeded" in Apify console  
✅ **Version**: Shows 2.1.0  
✅ **Test Run**: Completes successfully  
✅ **Logs**: Show enhanced logging with adapter info  
✅ **Output**: Contains all expected fields

### Enhanced Logging Example

You should see logs like:

```
=== Creating rightmove adapter ===
Adapter created: rightmove
=====================================

✓ rightmove adapter initialized

Processing URL: https://www.rightmove.co.uk/...
[RIGHTMOVE] Extracting properties from search page...
[RIGHTMOVE] Found 24 properties on page
```

---

## 🎯 What Changed in v2.1.0

### For Users (Visible Changes)

1. **Enhanced Logging**

   - More detailed logs with site context
   - Visual indicators (✓, ⚠️, ❌)
   - Per-portal statistics

2. **New Input Parameters**

   - `crossSiteDeduplication` (default: true)
   - `siteConfig` object for per-portal settings

3. **Improved Error Messages**
   - Better error context
   - Site-specific error handling

### For Developers (Internal Changes)

1. **Adapter Architecture**

   - Base adapter interface
   - Rightmove adapter refactored
   - Adapter factory for site detection

2. **Unified Schema**

   - Standardized output format
   - Cross-site deduplication fields
   - Comprehensive documentation

3. **Core Orchestrator**
   - Multi-site coordination
   - URL grouping by portal
   - Error isolation

---

## 🔄 Rollback Plan (If Needed)

If you encounter issues:

### Quick Rollback

```bash
git revert HEAD
git push origin main
```

Then redeploy the previous version.

### Gradual Rollback

1. Keep v2.1.0 deployed
2. Monitor for issues
3. Fix issues in patches (v2.1.1, v2.1.2, etc.)

---

## 📈 Post-Deployment Monitoring

### First 24 Hours

Monitor these metrics:

- **Error Rate**: Should be <5%
- **Run Duration**: Should be similar to v2.0
- **Memory Usage**: Should be <4GB
- **Success Rate**: Should be >95%

### Check Logs For

- ✅ Adapter initialization messages
- ✅ Enhanced logging output
- ✅ No unexpected errors
- ✅ Proper statistics tracking

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Actor builds without errors
2. ✅ Test runs complete successfully
3. ✅ Enhanced logging is visible
4. ✅ New input parameters work
5. ✅ Backward compatibility confirmed
6. ✅ No increase in error rate

---

## 📞 Support

### If You Encounter Issues

1. **Check Logs**: Apify console → Your actor → Runs → Latest run → Log
2. **Verify Input**: Ensure JSON is valid
3. **Test Minimal Config**: Use simplest possible input first
4. **Check Version**: Confirm v2.1.0 is deployed

### Common Issues

**Issue**: "Adapter not found"  
**Solution**: Ensure all adapter files are included in build

**Issue**: "New parameters not recognized"  
**Solution**: Verify actor.json was updated correctly

**Issue**: "Different output format"  
**Solution**: Should not occur - report immediately

---

## 🚀 Next Steps After Deployment

### Immediate (Today)

1. Deploy using one of the three options above
2. Run test scenarios
3. Verify success criteria
4. Monitor initial runs

### Short Term (This Week)

1. Monitor error rates
2. Collect user feedback
3. Fix any minor issues (v2.1.1)

### Medium Term (Next Week)

1. Begin Phase 2 planning
2. Research Zoopla page structure
3. Design Zoopla adapter

---

## 📝 Deployment Checklist

- [x] Code committed to GitHub
- [x] Version updated to 2.1.0
- [x] All tests passing (113/113)
- [x] Documentation complete
- [ ] **Deploy to Apify** ← YOU ARE HERE
- [ ] Run test scenarios
- [ ] Verify success criteria
- [ ] Monitor for 24 hours

---

**Ready to deploy!** Choose one of the three options above and follow the steps. 🚀

The deployment should take **5-10 minutes** and is fully backward compatible.
