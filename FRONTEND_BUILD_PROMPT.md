# Frontend Build Prompt: UK Property Scraper Dashboard

## Project Overview

Build a modern, responsive web dashboard to visualize and manage property data from the UK Property Scraper (Rightmove + Zoopla). The dashboard should display properties, enable filtering, show statistics, and provide insights into distressed properties and cross-site duplicates.

---

## Tech Stack Recommendation

### Core Framework

- **Next.js 14** (App Router) - React framework with SSR/SSG
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Data & State

- **React Query (TanStack Query)** - Data fetching and caching
- **Zustand** - Global state management
- **Zod** - Schema validation

### Visualization

- **Recharts** - Charts and graphs
- **Leaflet** or **Mapbox** - Property maps
- **Lucide React** - Icons

### Backend Integration

- **Apify API Client** - Fetch scraper results
- **Next.js API Routes** - Backend proxy

---

## Core Features

### 1. Dashboard Home

**Purpose:** Overview of all scraped properties with key metrics

**Components:**

- Summary cards (total properties, distressed count, avg price, new today)
- Recent properties grid
- Quick filters (portal, price range, bedrooms)
- Search bar (address, postcode)

**Metrics to Display:**

- Total properties scraped
- Properties by portal (Rightmove vs Zoopla)
- Distressed properties count
- Duplicate properties found
- Average price by area
- Properties added today/this week

### 2. Property List View

**Purpose:** Browse all properties with advanced filtering

**Features:**

- Infinite scroll or pagination
- Sort by: price, date added, distress score, bedrooms
- Filter by:
  - Portal (Rightmove, Zoopla, Both)
  - Price range (slider)
  - Bedrooms (1-5+)
  - Property type (Flat, House, etc.)
  - Distress score (0-10)
  - Location (postcode, area)
  - Duplicates only
  - New properties only

**Property Card Display:**

```
┌─────────────────────────────────────┐
│ [Image]                             │
│                                     │
│ £350,000  [Rightmove] [Zoopla]     │
│ 2 bed Flat                          │
│ High Street, London SW1A 1AA        │
│                                     │
│ 🚨 Distress Score: 6/10             │
│ Keywords: price reduced, chain free │
│                                     │
│ Added: 2 days ago                   │
│ [View Details] [Save] [Share]      │
└─────────────────────────────────────┘
```

### 3. Property Detail View

**Purpose:** Full property information

**Sections:**

- Image gallery (carousel)
- Key details (price, beds, baths, type, tenure)
- Full description
- Distress analysis
  - Matched keywords highlighted
  - Distress score breakdown
  - Investment opportunity indicator
- Location
  - Map with pin
  - Postcode (outcode/incode)
  - Nearest stations
- Agent information
  - Name, phone, logo
  - Contact button
- Cross-site information (if duplicate)
  - Sources (Rightmove, Zoopla)
  - Price comparison
  - Link to other listings
- Property history
  - Price changes
  - Listing updates
  - First seen date
- Features list
- Floor plans (if available)
- Brochures (if available)

### 4. Map View

**Purpose:** Visualize properties geographically

**Features:**

- Interactive map (Leaflet/Mapbox)
- Property markers (color-coded by distress score)
- Cluster markers for dense areas
- Click marker to see property card
- Filter properties on map
- Draw search area
- Heatmap overlay (price, distress)

**Marker Colors:**

- 🟢 Green: Low distress (0-3)
- 🟡 Yellow: Medium distress (4-6)
- 🔴 Red: High distress (7-10)

### 5. Analytics Dashboard

**Purpose:** Insights and trends

**Charts:**

1. **Properties by Portal** (Pie chart)

   - Rightmove count
   - Zoopla count
   - Duplicates

2. **Price Distribution** (Histogram)

   - Price ranges
   - Count per range

3. **Distress Score Distribution** (Bar chart)

   - Score 0-2, 3-5, 6-8, 9-10
   - Count per range

4. **Properties Over Time** (Line chart)

   - New properties per day
   - Cumulative total

5. **Top Keywords** (Word cloud or bar chart)

   - Most common distress keywords
   - Frequency count

6. **Average Price by Area** (Bar chart)

   - Top 10 areas
   - Average price

7. **Property Types** (Donut chart)
   - Flat, House, Bungalow, etc.

### 6. Saved Properties

**Purpose:** User's saved/favorited properties

**Features:**

- Save properties for later
- Add notes to saved properties
- Create collections/folders
- Export saved properties (CSV, JSON)
- Share collection link

### 7. Alerts & Monitoring

**Purpose:** Get notified of new properties

**Features:**

- Create custom alerts
  - Price range
  - Location
  - Distress score threshold
  - Keywords
- Email notifications
- In-app notifications
- Alert history

### 8. Settings

**Purpose:** Configure dashboard preferences

**Options:**

- Display preferences
  - Theme (light/dark)
  - Currency format
  - Date format
- Data refresh settings
  - Auto-refresh interval
  - Last updated timestamp
- Export settings
  - Default format
  - Fields to include
- API configuration
  - Apify API key
  - Dataset ID

---

## Data Schema (TypeScript)

```typescript
interface Property {
  // Core fields
  id: string;
  url: string;
  source: "rightmove" | "zoopla";
  sourceUrl: string;

  // Basic info
  address: string;
  displayAddress: string;
  price: string;
  description: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;

  // Location
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  outcode: string | null;
  incode: string | null;
  countryCode: string;

  // Property details
  tenure: string | null;
  councilTaxBand: string | null;

  // Media
  images: string[];
  floorplans: Array<{ url: string; caption: string }>;
  brochures: Array<{ url: string; caption: string }>;

  // Agent
  agent: string | null;
  agentPhone: string | null;
  agentLogo: string | null;
  agentDisplayAddress: string | null;
  agentProfileUrl: string | null;

  // Features
  features: string[];
  nearestStations: Array<{
    name: string;
    types: string[];
    distance: number;
    unit: string;
  }>;

  // Dates
  addedOn: string | null;
  firstVisibleDate: string | null;
  listingUpdateDate: string | null;

  // Status
  published: boolean;
  archived: boolean;
  sold: boolean;

  // Distress detection
  distressKeywordsMatched: string[];
  distressScoreRule: number;

  // Price history
  priceHistory: Array<{
    date: string;
    price: string;
  }>;

  // Cross-site
  sources?: string[];
  duplicateOf?: string[];
  _isDuplicate?: boolean;

  // Metadata
  _scrapedAt: string;
  _site: string;
  _isNew?: boolean;
}

interface Statistics {
  totalProperties: number;
  propertiesByPortal: {
    rightmove: number;
    zoopla: number;
  };
  distressedCount: number;
  duplicatesCount: number;
  averagePrice: number;
  newToday: number;
  newThisWeek: number;
}

interface Filter {
  portal?: "rightmove" | "zoopla" | "both";
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number[];
  propertyType?: string[];
  distressScoreMin?: number;
  distressScoreMax?: number;
  location?: string;
  duplicatesOnly?: boolean;
  newOnly?: boolean;
  keywords?: string[];
}
```

---

## API Integration

### Fetching Data from Apify

```typescript
// lib/apify.ts
import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export async function getProperties(datasetId: string) {
  const dataset = client.dataset(datasetId);
  const { items } = await dataset.listItems();
  return items as Property[];
}

export async function getLatestRun(actorId: string) {
  const actor = client.actor(actorId);
  const { items } = await actor.lastRun().dataset().listItems();
  return items as Property[];
}
```

### Next.js API Routes

```typescript
// app/api/properties/route.ts
import { NextResponse } from "next/server";
import { getProperties } from "@/lib/apify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get("datasetId");

  if (!datasetId) {
    return NextResponse.json({ error: "Dataset ID required" }, { status: 400 });
  }

  const properties = await getProperties(datasetId);
  return NextResponse.json(properties);
}
```

---

## UI Components

### 1. PropertyCard Component

```tsx
interface PropertyCardProps {
  property: Property;
  onSave?: (id: string) => void;
  onView?: (id: string) => void;
}

export function PropertyCard({ property, onSave, onView }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <Image
          src={property.images[0] || "/placeholder.jpg"}
          alt={property.address}
          fill
          className="object-cover"
        />
        {property._isDuplicate && (
          <Badge className="absolute top-2 right-2">Duplicate</Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold">{property.price}</h3>
          <div className="flex gap-1">
            {property.sources?.map((source) => (
              <Badge key={source} variant="outline">
                {source}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          {property.bedrooms} bed {property.propertyType}
        </p>

        <p className="text-sm mb-3">{property.displayAddress}</p>

        {property.distressScoreRule > 0 && (
          <Alert className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              Distress Score: {property.distressScoreRule}/10
            </AlertTitle>
            <AlertDescription>
              {property.distressKeywordsMatched.join(", ")}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Added {formatDistanceToNow(new Date(property.addedOn))}</span>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={() => onView?.(property.id)} className="flex-1">
            View Details
          </Button>
          <Button onClick={() => onSave?.(property.id)} variant="outline">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. FilterPanel Component

```tsx
export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Filters</h3>

      <div className="space-y-4">
        {/* Portal Filter */}
        <div>
          <Label>Portal</Label>
          <Select
            value={filters.portal}
            onValueChange={(v) => onFilterChange({ portal: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="rightmove">Rightmove</SelectItem>
              <SelectItem value="zoopla">Zoopla</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <Label>Price Range</Label>
          <Slider
            min={0}
            max={1000000}
            step={10000}
            value={[filters.priceMin || 0, filters.priceMax || 1000000]}
            onValueChange={([min, max]) =>
              onFilterChange({ priceMin: min, priceMax: max })
            }
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>£{filters.priceMin?.toLocaleString()}</span>
            <span>£{filters.priceMax?.toLocaleString()}</span>
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <Label>Bedrooms</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <Button
                key={num}
                variant={
                  filters.bedrooms?.includes(num) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleBedroom(num)}
              >
                {num}+
              </Button>
            ))}
          </div>
        </div>

        {/* Distress Score */}
        <div>
          <Label>Min Distress Score</Label>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[filters.distressScoreMin || 0]}
            onValueChange={([v]) => onFilterChange({ distressScoreMin: v })}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={filters.duplicatesOnly}
              onCheckedChange={(v) => onFilterChange({ duplicatesOnly: v })}
            />
            <Label>Duplicates only</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={filters.newOnly}
              onCheckedChange={(v) => onFilterChange({ newOnly: v })}
            />
            <Label>New properties only</Label>
          </div>
        </div>

        <Button onClick={clearFilters} variant="outline" className="w-full">
          Clear Filters
        </Button>
      </div>
    </Card>
  );
}
```

### 3. StatisticsCards Component

```tsx
export function StatisticsCards({ stats }: { stats: Statistics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Properties
          </CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProperties}</div>
          <p className="text-xs text-muted-foreground">
            Across {Object.keys(stats.propertiesByPortal).length} portals
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Distressed</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.distressedCount}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.distressedCount / stats.totalProperties) * 100).toFixed(1)}
            % of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Average Price</CardTitle>
          <PoundSterling className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            £{stats.averagePrice.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Across all properties</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">New Today</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newToday}</div>
          <p className="text-xs text-muted-foreground">
            {stats.newThisWeek} this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Page Structure

```
app/
├── layout.tsx                 # Root layout with nav
├── page.tsx                   # Dashboard home
├── properties/
│   ├── page.tsx              # Property list
│   └── [id]/
│       └── page.tsx          # Property detail
├── map/
│   └── page.tsx              # Map view
├── analytics/
│   └── page.tsx              # Analytics dashboard
├── saved/
│   └── page.tsx              # Saved properties
├── alerts/
│   └── page.tsx              # Alerts management
└── settings/
    └── page.tsx              # Settings
```

---

## Styling Guidelines

### Color Scheme

- **Primary:** Blue (#3B82F6) - Trust, professionalism
- **Success:** Green (#10B981) - Low distress
- **Warning:** Yellow (#F59E0B) - Medium distress
- **Danger:** Red (#EF4444) - High distress
- **Neutral:** Gray (#6B7280) - Text, borders

### Typography

- **Headings:** Inter or Geist Sans
- **Body:** System font stack
- **Monospace:** Geist Mono (for IDs, codes)

### Spacing

- Use Tailwind's spacing scale (4px base)
- Consistent padding: p-4, p-6, p-8
- Card spacing: gap-4, gap-6

---

## Responsive Design

### Breakpoints

- **Mobile:** < 640px (1 column)
- **Tablet:** 640px - 1024px (2 columns)
- **Desktop:** > 1024px (3-4 columns)

### Mobile Considerations

- Bottom navigation bar
- Collapsible filters (drawer)
- Swipeable property cards
- Touch-friendly buttons (min 44px)

---

## Performance Optimization

1. **Image Optimization**

   - Use Next.js Image component
   - Lazy load images
   - Blur placeholder

2. **Data Fetching**

   - React Query for caching
   - Stale-while-revalidate
   - Pagination/infinite scroll

3. **Code Splitting**

   - Dynamic imports for heavy components
   - Route-based splitting (automatic in Next.js)

4. **Caching Strategy**
   - Cache property data (5 minutes)
   - Cache statistics (1 minute)
   - Invalidate on new scrape

---

## Deployment

### Recommended Platform

- **Vercel** - Optimal for Next.js
- **Netlify** - Alternative
- **Railway** - If backend needed

### Environment Variables

```env
NEXT_PUBLIC_APIFY_API_TOKEN=your_token
NEXT_PUBLIC_APIFY_ACTOR_ID=your_actor_id
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

---

## Future Enhancements

1. **User Authentication**

   - Clerk or NextAuth.js
   - User-specific saved properties
   - Team collaboration

2. **Real-time Updates**

   - WebSocket connection
   - Live property updates
   - Push notifications

3. **Advanced Analytics**

   - Price predictions (ML)
   - Market trends
   - Investment ROI calculator

4. **Export Features**

   - PDF reports
   - Excel exports
   - Email digests

5. **Mobile App**
   - React Native
   - Push notifications
   - Offline mode

---

## Getting Started

### 1. Initialize Project

```bash
npx create-next-app@latest property-dashboard --typescript --tailwind --app
cd property-dashboard
```

### 2. Install Dependencies

```bash
npm install @tanstack/react-query zustand zod
npm install apify-client
npm install recharts leaflet react-leaflet
npm install lucide-react date-fns
npm install @radix-ui/react-* # shadcn components
```

### 3. Setup shadcn/ui

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input select slider checkbox
```

### 4. Create Basic Structure

```bash
mkdir -p app/{properties,map,analytics,saved,alerts,settings}
mkdir -p components/{ui,property,analytics,map}
mkdir -p lib/{api,utils,hooks}
```

### 5. Start Development

```bash
npm run dev
```

---

## Example Implementation

See the complete example implementation in the `/examples/dashboard` directory (to be created).

---

## Support & Resources

- **Scraper API:** See `docs/UNIFIED_SCHEMA.md`
- **Multi-Site Guide:** See `docs/MULTI_SITE_GUIDE.md`
- **Apify Docs:** https://docs.apify.com
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com

---

**Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Status:** Ready for Implementation

---

## Quick Start Checklist

- [ ] Initialize Next.js project
- [ ] Install dependencies
- [ ] Setup shadcn/ui
- [ ] Configure Apify API client
- [ ] Create property data types
- [ ] Build PropertyCard component
- [ ] Build FilterPanel component
- [ ] Create dashboard home page
- [ ] Implement property list page
- [ ] Add map view
- [ ] Build analytics dashboard
- [ ] Deploy to Vercel

**Estimated Time:** 2-3 weeks for MVP

🚀 **Ready to build!**
