# Setting Up GitHub Template Repository

## Why Both Approaches?

### Kiro Steering Document ✅ (Already Created)

- **Location:** `.kiro/steering/apify-actor-template.md`
- **Purpose:** Kiro automatically references this when building new actors
- **Benefit:** Zero friction - Kiro knows the patterns
- **Use case:** Working solo with Kiro

### GitHub Template Repository

- **Purpose:** Share with team, version control, public/private reuse
- **Benefit:** "Use this template" button for instant new repos
- **Use case:** Team collaboration, portfolio, open source

## Option 1: Create Separate Template Repo (Recommended)

### Step 1: Create New Repo

```bash
# Create a new directory for the template
mkdir apify-actor-template
cd apify-actor-template

# Copy only the starter kit
cp -r ../rightmove-scraper/templates/starter-kit/* .
cp -r ../rightmove-scraper/templates/starter-kit/.* . 2>/dev/null || true

# Copy key documentation
cp ../rightmove-scraper/ACTOR_STARTER_KIT.md .
cp ../rightmove-scraper/HOW_TO_REUSE.md .
cp ../rightmove-scraper/START_HERE.md ./README.md

# Initialize git
git init
git add .
git commit -m "Initial commit: Apify Actor Template"
```

### Step 2: Push to GitHub

```bash
# Create repo on GitHub (via web interface or gh cli)
gh repo create apify-actor-template --public --source=. --remote=origin

# Or manually:
# 1. Create repo on github.com
# 2. Add remote:
git remote add origin https://github.com/yourusername/apify-actor-template.git
git branch -M main
git push -u origin main
```

### Step 3: Enable Template Feature

1. Go to your repo on GitHub
2. Click **Settings**
3. Check **Template repository** under "General"
4. Save

### Step 4: Use It

For new projects:

1. Go to your template repo
2. Click **"Use this template"**
3. Name your new actor
4. Clone and start building!

## Option 2: Keep in Current Repo with Tags

### Step 1: Tag the Template

```bash
# In your rightmove-scraper repo
git add templates/
git add ACTOR_STARTER_KIT.md HOW_TO_REUSE.md START_HERE.md
git add .kiro/steering/apify-actor-template.md
git commit -m "feat: add reusable actor template system"

# Tag it
git tag -a template-v1.0.0 -m "Apify Actor Template v1.0.0"
git push origin template-v1.0.0
```

### Step 2: Use It

For new projects:

```bash
# Clone at specific tag
git clone --branch template-v1.0.0 https://github.com/yourusername/rightmove-scraper.git my-new-actor

# Copy just the template
cd my-new-actor
cp -r templates/starter-kit/* .
rm -rf templates/
rm -rf src/adapters/rightmove-adapter.js
rm -rf src/adapters/zoopla-adapter.js
# ... clean up property-specific files

# Start fresh
rm -rf .git
git init
```

## Recommended Approach: Both!

### Use Kiro Steering For:

- ✅ Quick reference while coding
- ✅ Kiro automatically knows the patterns
- ✅ No context switching
- ✅ Always up-to-date with your project

### Use GitHub Template For:

- ✅ Team collaboration
- ✅ Clean starting point
- ✅ Version control
- ✅ Public portfolio/open source
- ✅ "Use this template" button

## Quick Comparison

| Feature          | Kiro Steering        | GitHub Template      |
| ---------------- | -------------------- | -------------------- |
| Kiro Integration | ✅ Automatic         | ❌ Manual reference  |
| Team Sharing     | ❌ Project-specific  | ✅ Easy sharing      |
| Version Control  | ✅ With project      | ✅ Separate repo     |
| Discoverability  | ❌ Hidden in project | ✅ Public/searchable |
| Setup Time       | ✅ Already done!     | ⏱️ 30 minutes        |
| Maintenance      | ✅ Update in place   | ⏱️ Separate updates  |

## My Recommendation

### For You Right Now:

**Use the Kiro Steering Document** (already created!)

- It's already set up in `.kiro/steering/apify-actor-template.md`
- Kiro will reference it automatically when you mention "actor template" or "new actor"
- Zero additional work needed
- Perfect for solo development with Kiro

### Later (When Needed):

**Create GitHub Template** if:

- You want to share with a team
- You're building multiple actors frequently
- You want it in your public portfolio
- You want the "Use this template" convenience

## Testing the Kiro Steering

Try asking Kiro:

- "I want to build a new actor for scraping job sites"
- "How do I use the actor template?"
- "Create a new adapter for Indeed.com"

Kiro will reference the steering document automatically!

## Updating the Template

### Update Kiro Steering:

```bash
# Just edit the file
vim .kiro/steering/apify-actor-template.md
git commit -m "docs: update actor template patterns"
```

### Update GitHub Template:

```bash
# In your template repo
git pull
# Make changes
git commit -m "feat: add new pattern"
git tag -a v1.1.0 -m "Version 1.1.0"
git push --tags
```

## Conclusion

**Start with Kiro Steering** (✅ done!) and create the GitHub template later if you need team collaboration or want to showcase it publicly.

The steering document gives you immediate value with zero additional setup!
