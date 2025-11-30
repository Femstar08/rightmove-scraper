# Quick Deployment Guide

## 🚀 Ready to Deploy!

Your Rightmove Scraper Phase 2 is ready for deployment. All code is implemented, tested, and documented.

## Prerequisites

- Apify account (sign up at https://apify.com)
- Apify CLI installed (optional, for command-line deployment)

## Deployment Options

### Option 1: Apify CLI (Recommended)

```bash
# 1. Install Apify CLI globally
npm install -g apify-cli

# 2. Login to your Apify account
apify login

# 3. Deploy the actor
apify push
```

The CLI will:

- Build your actor
- Upload it to Apify platform
- Make it available in your account

### Option 2: GitHub Integration

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Phase 2 complete - ready for deployment"
   git push origin main
   ```

2. **Connect in Apify Console**:

   - Go to https://console.apify.com
   - Click "Create new" → "Actor"
   - Choose "Import from GitHub"
   - Select your repository
   - Configure build settings
   - Click "Build"

3. **Automatic Deployments**:
   - Future pushes to GitHub will automatically rebuild the actor

### Option 3: Manual ZIP Upload

1. **Create deployment package**:

   ```bash
   # Exclude node_modules and test files
   zip -r rightmove-scraper.zip . -x "node_modules/*" "*.test.js" ".git/*"
   ```

2. **Upload to Apify**:
   - Go to https://console.apify.com
   - Click "Create new" → "Actor"
   - Choose "Upload ZIP"
   - Upload your ZIP file
   - Click "Build"

## Testing Before Production

### 1. Test in Apify Console

After deployment, test with a small dataset:

```json
{
  "startUrls": [
    {
      "url": "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490"
    }
  ],
  "maxItems": 5,
  "maxPages": 1,
  "fullPropertyDetails": true
}
```

### 2. Verify Output

Check that the output includes:

- All 30+ property fields
- Distress detection working
- No errors in logs

### 3. Test Phase 2 Features

**Monitoring Mode**:

```json
{
  "startUrls": [{ "url": "..." }],
  "monitoringMode": true,
  "maxItems": 10
}
```

Run twice - second run should only show new properties.

**Delisting Tracker**:

```json
{
  "startUrls": [{ "url": "..." }],
  "enableDelistingTracker": true,
  "maxItems": 10
}
```

Check Key-Value store "rightmove-properties" for stored data.

## Configuration in Apify Console

### Memory Settings

- **Recommended**: 4096 MB (4 GB)
- **Minimum**: 2048 MB (2 GB)

### Timeout Settings

- **Recommended**: 3600 seconds (1 hour)
- Adjust based on maxItems and maxPages

### Proxy Settings

- Enable "Apify Proxy" in actor settings
- Use residential proxies for best results

## Monitoring Production Runs

### Key Metrics to Watch

1. **Success Rate**: Should be >95%
2. **Memory Usage**: Should stay under 4 GB
3. **Run Duration**: Varies by configuration
   - Fast mode: ~2-3 seconds per page
   - Standard mode: ~5-7 seconds per property
   - Deep mode: ~8-12 seconds per property

### Common Issues

**Issue**: "No properties extracted"

- **Solution**: Enable proxy, check URL validity

**Issue**: "Memory limit exceeded"

- **Solution**: Reduce maxItems or increase memory allocation

**Issue**: "Rate limited"

- **Solution**: Enable Apify proxy, reduce maxConcurrency

## Making the Actor Public (Optional)

If you want to share your actor:

1. Go to actor settings in Apify Console
2. Set visibility to "Public"
3. Add a good description and README
4. Set pricing (free or paid)
5. Publish to Apify Store

## Support

- **Apify Documentation**: https://docs.apify.com
- **Apify Discord**: https://discord.com/invite/jyEM2PRvMU
- **Actor Logs**: Check console for detailed error messages

## Next Steps

1. ✅ Deploy using one of the methods above
2. ✅ Run initial test with small dataset
3. ✅ Verify all Phase 2 features work
4. ✅ Set up scheduled runs (optional)
5. ✅ Monitor performance and adjust settings

---

**Your actor is production-ready! 🎉**

All Phase 2 features are implemented:

- ✅ Full property details (30+ fields)
- ✅ Monitoring mode
- ✅ Delisting tracker
- ✅ Price history
- ✅ Direct property URLs
- ✅ Performance modes
