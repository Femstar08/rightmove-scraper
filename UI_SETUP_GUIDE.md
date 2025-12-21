# Property Scraper UI & Supabase Integration Guide

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │───▶│     Zapier      │───▶│  Apify Actor    │───▶│   Supabase DB   │
│   Dashboard     │    │   Automation    │    │   (Hosted)      │    │   (Properties)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Flow:**

1. User creates scraping job in Next.js UI
2. UI triggers Zapier webhook with job parameters
3. Zapier calls Apify Actor API with configuration
4. Apify Actor scrapes properties and returns data
5. Zapier receives results and saves to Supabase
6. UI displays real-time results from Supabase

## 1. Supabase Database Setup

### Migration Applied

✅ Created `supabase/migrations/20241216000001_create_properties_schema.sql`

**Tables Created:**

- `properties` - Stores scraped property data
- `scraping_jobs` - Tracks scraping job status and configuration
- `property_analytics` - View for analytics and reporting

### Key Features:

- Full property schema with 30+ fields
- Job tracking and status management
- RLS (Row Level Security) enabled
- Optimized indexes for performance
- JSONB fields for flexible data storage

## 2. Next.js UI Components

### Core Pages:

1. **Dashboard** - Overview of recent jobs and properties
2. **Jobs** - Create and manage scraping jobs
3. **Properties** - Browse and filter scraped properties
4. **Analytics** - Charts and insights

### Key Features:

- Real-time job status updates
- Property filtering and search
- Interactive maps with property locations
- Export functionality (CSV, JSON)
- Responsive design with Tailwind CSS

## 3. Zapier Integration

### Webhook Triggers:

1. **Start Scraping Job** - Triggered from UI
2. **Job Status Update** - Updates job progress
3. **Save Properties** - Stores scraped data in Supabase

### Apify API Integration:

- Calls your hosted Apify Actor
- Passes job configuration (URLs, settings, etc.)
- Monitors job progress
- Retrieves results when complete

## 4. Implementation Steps

### Step 1: Set up Supabase Project

```bash
# Already done - migration created
npx supabase migration up
```

### Step 2: Create Next.js UI

```bash
# Create new Next.js app
npx create-next-app@latest property-dashboard --typescript --tailwind --app

# Install Supabase client
cd property-dashboard
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Install additional dependencies
npm install recharts lucide-react @headlessui/react
npm install -D @types/node
```

### Step 3: Configure Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ZAPIER_WEBHOOK_URL=your_zapier_webhook_url
APIFY_API_TOKEN=your_apify_token
```

### Step 4: Set up Zapier Automation

1. Create Zapier account
2. Set up webhook trigger
3. Add Apify Actor action
4. Add Supabase database actions
5. Test the flow

## 5. UI Component Structure

```
property-dashboard/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard
│   │   ├── jobs/
│   │   │   ├── page.tsx          # Jobs list
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Create new job
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Job details
│   │   ├── properties/
│   │   │   ├── page.tsx          # Properties list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Property details
│   │   ├── analytics/
│   │   │   └── page.tsx          # Analytics dashboard
│   │   └── api/
│   │       ├── jobs/
│   │       │   └── route.ts      # Jobs API
│   │       ├── properties/
│   │       │   └── route.ts      # Properties API
│   │       └── webhooks/
│   │           └── zapier/
│   │               └── route.ts  # Zapier webhook handler
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── JobForm.tsx           # Job creation form
│   │   ├── PropertyCard.tsx      # Property display card
│   │   ├── PropertyMap.tsx       # Interactive map
│   │   └── Analytics.tsx         # Charts and graphs
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── types.ts              # TypeScript types
│   │   └── utils.ts              # Utility functions
│   └── hooks/
│       ├── useJobs.ts            # Jobs data hooks
│       └── useProperties.ts      # Properties data hooks
```

## 6. Key Features Implementation

### Job Creation Form

- Site selection (Rightmove/Zoopla)
- URL input with validation
- Advanced options (full details, price history, etc.)
- Distress keywords configuration
- Real-time validation

### Property Display

- Card-based layout with images
- Advanced filtering (price, bedrooms, location, etc.)
- Map view with clustering
- Distress score highlighting
- Export functionality

### Real-time Updates

- WebSocket connection for job status
- Live property count updates
- Progress indicators
- Error handling and retry logic

### Analytics Dashboard

- Properties by source (Rightmove vs Zoopla)
- Distress score distribution
- Price range analysis
- Geographic distribution
- Time-based trends

## 7. Zapier Automation Setup

### Trigger: Webhook

```json
{
  "jobId": "uuid",
  "name": "London Properties",
  "site": "rightmove",
  "startUrls": ["https://rightmove.co.uk/..."],
  "maxItems": 200,
  "fullPropertyDetails": true,
  "includePriceHistory": false,
  "distressKeywords": ["reduced", "chain free"]
}
```

### Action 1: Call Apify Actor

- Actor ID: Your deployed actor
- Input: Job configuration from webhook
- Wait for completion: Yes

### Action 2: Update Job Status

- Update Supabase `scraping_jobs` table
- Set status to 'running'
- Store Apify run ID

### Action 3: Save Properties

- Parse Apify results
- Transform to Supabase schema
- Bulk insert to `properties` table
- Update job with final counts

### Action 4: Final Status Update

- Set job status to 'completed' or 'failed'
- Store error messages if any
- Trigger UI notification

## 8. Benefits of This Architecture

### ✅ Separation of Concerns

- Apify Actor remains unchanged
- UI is independent and scalable
- Zapier handles orchestration

### ✅ Scalability

- Can handle multiple concurrent jobs
- Easy to add new property sites
- Horizontal scaling possible

### ✅ Reliability

- Zapier provides retry logic
- Database transactions ensure data integrity
- Error handling at each step

### ✅ User Experience

- Real-time updates
- Rich filtering and search
- Visual analytics
- Export capabilities

### ✅ Maintainability

- Clear separation of responsibilities
- Easy to update individual components
- Comprehensive logging and monitoring

## 9. Next Steps

1. **Set up Supabase project** and run migration
2. **Create Next.js UI** with the component structure
3. **Configure Zapier automation** with your Apify Actor
4. **Test the complete flow** end-to-end
5. **Deploy UI** to Vercel or similar platform
6. **Add authentication** and user management
7. **Implement advanced features** (alerts, scheduling, etc.)

This architecture gives you a professional property scraping platform that's scalable, maintainable, and user-friendly while keeping your existing Apify Actor intact.
