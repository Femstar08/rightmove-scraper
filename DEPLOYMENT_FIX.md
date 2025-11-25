# Deployment Fix - Apify SDK v3 Compatibility

## Issue

The actor was failing on Apify platform with error:

```
TypeError: Apify.init is not a function
```

## Root Cause

The code was written for Apify SDK v2 API, but we're using Apify SDK v3 which has breaking changes.

## Changes Made

### 1. Updated Import Statement

**Before:**

```javascript
const Apify = require("apify");
```

**After:**

```javascript
const { Actor } = require("apify");
```

### 2. Updated All API Calls

| Old (SDK v2)                       | New (SDK v3)                       |
| ---------------------------------- | ---------------------------------- |
| `Apify.init()`                     | `Actor.init()`                     |
| `Apify.getInput()`                 | `Actor.getInput()`                 |
| `Apify.pushData()`                 | `Actor.pushData()`                 |
| `Apify.exit()`                     | `Actor.exit()`                     |
| `Apify.createProxyConfiguration()` | `Actor.createProxyConfiguration()` |

### 3. Updated Test Mocks

Changed all test mocks from `mockApify` to `mockActor` to match the new API.

## Verification

✅ All 77 tests passing locally
✅ Code committed to git

## Next Steps

1. Push the fix to GitHub:

   ```bash
   git push origin main
   ```

2. Rebuild the actor on Apify platform

   - The platform will automatically detect the changes
   - Or manually trigger a rebuild

3. Test the actor on Apify platform with sample input

## Test Input for Apify Platform

```json
{
  "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490",
  "maxItems": 10,
  "maxPages": 1,
  "useProxy": false,
  "distressKeywords": [
    "reduced",
    "chain free",
    "auction",
    "motivated",
    "cash buyers",
    "needs renovation"
  ]
}
```

## Expected Behavior

The actor should now:

1. Initialize successfully
2. Read input correctly
3. Scrape properties from Rightmove
4. Detect distress keywords
5. Save results to dataset
6. Exit cleanly

## Commit Hash

`6ca4f7cc9322884730ff4b67a7e1a0d1bd4cccbd`

---

## Update: Second Fix Applied

### Additional Issue Found

After fixing the Apify SDK issue, we encountered:

```
Error: got is not a function
```

### Root Cause

The `got` v12 library wasn't working properly in the Apify environment.

### Solution

Replaced `got` with native `fetch` API (available in Node 20):

- Removed `got` dependency
- Added `https-proxy-agent` for proxy support
- Updated `fetchPage()` to use fetch API
- Updated all 77 tests to mock fetch

### Final Status

✅ **All 77 tests passing**
✅ **Both issues resolved**
✅ **Ready for deployment**

### Commit Hash

`15bce7e6607d303347265fcf874822c7d9c2f2fa`
