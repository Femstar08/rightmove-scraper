# Property Scraper UI - Complete Deployment Guide

## 🎯 What You're Building

A professional property scraping platform with:

- **Next.js Dashboard** - Modern UI for managing scraping jobs
- **Supabase Database** - Stores properties and job data
- **Zapier Automation** - Orchestrates Apify Actor calls
- **Real-time Updates** - Live job status and property counts

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account
- Zapier account (free tier works)
- Your existing Apify Actor deployed
- Vercel account (for deployment)

## 🚀 Step-by-Step Setup

### Step 1: Set up Supabase Project

1. **Create Supabase Project**

   ```bash
   # Go to https://supabase.com
   # Create new project
   # Note down your project URL and anon key
   ```

2. **Run Database Migration**

   ```bash
   # In your main project directory
   npx supabase migration up
   ```

3. **Verify Tables Created**
   - Go to Supabase Dashboard → Table Editor
   - Should see: `properties`, `scraping_jobs` tables
   - Check the `property_analytics` view

### Step 2: Set up Next.js UI

1. **Install Dependencies**

   ```bash
   cd ui
   npm install
   ```

2. **Configure Environment Variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/
   ZAPIER_SECRET=your_random_secret_key
   ```

3. **Test Locally**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

### Step 3: Set up Zapier Automation

1. **Create Zapier Webhook**

   - Go to Zapier → Create Zap
   - Trigger: Webhooks by Zapier → Catch Hook
   - Copy webhook URL to your `.env.local`

2. **Add Apify Action**

   - Action: Apify → Run Actor
   - Actor ID: Your deployed actor ID
   - Map webhook data to actor input
   - Enable "Wait for completion"

3. **Add Supabase Actions**

   - Use webhook actions to update job status
   - Save properties to database
   - Handle success/failure scenarios

4. **Test the Flow**
   - Create test job in UI
   - Monitor Zapier execution
   - Verify data in Supabase

### Step 4: Deploy to Production

1. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy from ui directory
   cd ui
   vercel
   ```

2. **Configure Production Environment**
   - Add environment variables in Vercel dashboard
   - Update Zapier webhook URLs to production
   - Test production deployment

### Step 5: Configure Authentication (Optional)

1. **Enable Supabase Auth**

   ```bash
   # In Supabase dashboard
   # Authentication → Settings
   # Enable email/password auth
   ```

2. **Add Auth to UI**
   ```bash
   npm install @supabase/auth-helpers-nextjs
   ```

## 🔧 Configuration Details

### Supabase Configuration

**Row Level Security (RLS):**

```sql
-- Already configured in migration
-- Allows authenticated users full access
-- Modify policies for production security
```

**Indexes for Performance:**

```sql
-- Already created in migration
-- Optimized for common queries
-- Monitor query performance in production
```

### Zapier Configuration

**Webhook Payload:**

```json
{
  "jobId": "uuid",
  "name": "Job Name",
  "site": "rightmove",
  "startUrls": [{ "url": "..." }],
  "maxItems": 200,
  "fullPropertyDetails": true,
  "includePriceHistory": false
}
```

**Actor Input Mapping:**

```javascript
{
  "site": "{{trigger.site}}",
  "startUrls": "{{trigger.startUrls}}",
  "maxItems": "{{trigger.maxItems}}",
  "fullPropertyDetails": "{{trigger.fullPropertyDetails}}"
}
```

### UI Features

**Dashboard:**

- Real-time statistics
- Recent jobs overview
- Property map visualization
- Quick action buttons

**Job Management:**

- Create new scraping jobs
- Monitor job progress
- View job history
- Error handling and retry

**Property Browser:**

- Advanced filtering
- Search functionality
- Export capabilities
- Detailed property views

## 📊 Monitoring and Analytics

### Built-in Analytics

**Property Analytics View:**

```sql
-- Automatically created
-- Shows properties by source, date
-- Distress score analysis
-- Geographic distribution
```

**Dashboard Metrics:**

- Total properties scraped
- Active jobs count
- Distressed properties
- Daily scraping volume

### Performance Monitoring

**Database Performance:**

- Monitor query execution times
- Check index usage
- Optimize slow queries

**API Performance:**

- Monitor response times
- Track error rates
- Set up alerts for failures

## 🔒 Security Best Practices

### Environment Variables

```env
# Never commit these to git
# Use different keys for dev/prod
# Rotate keys regularly
```

### API Security

- Validate all webhook inputs
- Verify Zapier secret headers
- Implement rate limiting
- Log security events

### Database Security

- Use RLS policies
- Limit service role usage
- Monitor access patterns
- Regular security audits

## 🐛 Troubleshooting

### Common Issues

**Webhook not received:**

```bash
# Check webhook URL
# Verify network connectivity
# Check Zapier logs
```

**Database connection failed:**

```bash
# Verify Supabase credentials
# Check network access
# Monitor connection pool
```

**Actor execution failed:**

```bash
# Check Apify actor logs
# Verify input parameters
# Monitor memory usage
```

### Debug Mode

**Enable detailed logging:**

```javascript
// Add to API routes
console.log("Request:", JSON.stringify(req.body, null, 2));
```

**Monitor real-time:**

```bash
# Vercel logs
vercel logs

# Supabase logs
# Check dashboard → Logs
```

## 📈 Scaling Considerations

### Database Scaling

- Monitor table sizes
- Implement data archiving
- Optimize query performance
- Consider read replicas

### API Scaling

- Implement caching
- Use background jobs
- Add rate limiting
- Monitor response times

### Cost Optimization

- Monitor Supabase usage
- Optimize Zapier task usage
- Implement data retention policies
- Use efficient queries

## 🎉 Success Checklist

- [ ] Supabase project created and configured
- [ ] Database migration applied successfully
- [ ] Next.js UI running locally
- [ ] Zapier automation configured and tested
- [ ] Production deployment completed
- [ ] End-to-end flow tested
- [ ] Monitoring and alerts set up
- [ ] Security measures implemented
- [ ] Documentation updated

## 🔄 Maintenance

### Regular Tasks

- Monitor system health
- Update dependencies
- Review security logs
- Optimize database performance
- Update documentation

### Backup Strategy

- Supabase automatic backups
- Export critical data regularly
- Test restore procedures
- Document recovery process

## 📞 Support

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zapier Documentation](https://zapier.com/help)
- [Vercel Documentation](https://vercel.com/docs)

### Community

- Supabase Discord
- Next.js GitHub Discussions
- Zapier Community Forum

---

**🎊 Congratulations!** You now have a professional property scraping platform that scales with your needs while keeping your existing Apify Actor unchanged.
