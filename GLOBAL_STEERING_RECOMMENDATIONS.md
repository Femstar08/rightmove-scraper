# Global Steering & Hooks Recommendations

## Overview

Global steering files live in `~/.kiro/steering/` and apply to ALL workspaces. They're perfect for:

- Reusable patterns and templates
- Personal coding standards
- Common workflows
- Tool-specific best practices

## Recommended Global Steering Files

### 1. Testing Best Practices

**File:** `~/.kiro/steering/testing-standards.md`

````markdown
---
title: Testing Standards
description: Testing best practices and patterns
tags: [testing, jest, quality]
---

# Testing Standards

## Test Structure

```javascript
describe("ComponentName", () => {
  let instance;

  beforeEach(() => {
    instance = new ComponentName();
  });

  afterEach(() => {
    // Cleanup
  });

  describe("methodName", () => {
    test("should handle normal case", () => {
      expect(instance.method()).toBe(expected);
    });

    test("should handle edge case", () => {
      expect(instance.method(null)).toBe(null);
    });

    test("should throw on invalid input", () => {
      expect(() => instance.method("invalid")).toThrow();
    });
  });
});
```
````

## Coverage Requirements

- Minimum 70% coverage
- 100% coverage for critical paths
- Test edge cases and error conditions

## Test Naming

- Use descriptive names: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks
- One assertion per test when possible

## Mocking

```javascript
// Mock external dependencies
jest.mock("./external-service");

// Mock timers
jest.useFakeTimers();

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve(data) })
);
```

````

### 2. Git Commit Standards

**File:** `~/.kiro/steering/git-conventions.md`

```markdown
---
title: Git Commit Conventions
description: Conventional commits and git workflow
tags: [git, commits, workflow]
---

# Git Commit Conventions

## Commit Message Format

````

<type>(<scope>): <subject>

<body>

<footer>
```

## Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style (formatting, semicolons)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

## Examples

```bash
feat(auth): add OAuth2 login support

Implemented OAuth2 authentication flow with Google and GitHub providers.
Added token refresh mechanism and session management.

Closes #123
```

```bash
fix(api): handle null response from external service

Added null check before processing API response to prevent crashes.

Fixes #456
```

## Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

## Workflow

1. Create feature branch from main
2. Make changes with conventional commits
3. Run tests before committing
4. Push and create PR
5. Squash merge to main

````

### 3. Code Review Checklist

**File:** `~/.kiro/steering/code-review.md`

```markdown
---
title: Code Review Checklist
description: What to check during code reviews
tags: [review, quality, standards]
---

# Code Review Checklist

## Functionality
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs

## Code Quality
- [ ] Code is readable and maintainable
- [ ] Functions are small and focused
- [ ] No code duplication
- [ ] Naming is clear and consistent
- [ ] Comments explain "why", not "what"

## Testing
- [ ] Tests are included
- [ ] Tests cover edge cases
- [ ] Tests are meaningful
- [ ] All tests pass

## Security
- [ ] No sensitive data in code
- [ ] Input validation is present
- [ ] No SQL injection vulnerabilities
- [ ] Authentication/authorization is correct

## Performance
- [ ] No obvious performance issues
- [ ] Database queries are optimized
- [ ] No unnecessary loops or operations

## Documentation
- [ ] README is updated if needed
- [ ] API documentation is current
- [ ] Breaking changes are documented
````

### 4. API Design Patterns

**File:** `~/.kiro/steering/api-design.md`

```markdown
---
title: API Design Patterns
description: RESTful API design best practices
tags: [api, rest, design]
---

# API Design Patterns

## RESTful Endpoints
```

GET /api/resources # List all
GET /api/resources/:id # Get one
POST /api/resources # Create
PUT /api/resources/:id # Update (full)
PATCH /api/resources/:id # Update (partial)
DELETE /api/resources/:id # Delete

````

## Response Format

```javascript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
````

## Status Codes

- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Pagination

```
GET /api/resources?page=1&limit=20&sort=created_at&order=desc
```

## Filtering

```
GET /api/resources?status=active&category=tech
```

## Versioning

```
GET /api/v1/resources
```

````

### 5. Error Handling Patterns

**File:** `~/.kiro/steering/error-handling.md`

```markdown
---
title: Error Handling Patterns
description: Consistent error handling across projects
tags: [errors, exceptions, patterns]
---

# Error Handling Patterns

## Custom Error Classes

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}
````

## Try-Catch Pattern

```javascript
async function processData(data) {
  try {
    validateInput(data);
    const result = await performOperation(data);
    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to process data", error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }

    throw error; // Re-throw unexpected errors
  }
}
```

## Error Logging

```javascript
logger.error("Operation failed", {
  error: error.message,
  stack: error.stack,
  context: { userId, operation },
});
```

## User-Friendly Messages

```javascript
function getUserMessage(error) {
  const messages = {
    ValidationError: "Please check your input and try again",
    NotFoundError: "The requested item could not be found",
    AuthError: "Please log in to continue",
  };

  return messages[error.name] || "An unexpected error occurred";
}
```

````

### 6. Performance Optimization

**File:** `~/.kiro/steering/performance.md`

```markdown
---
title: Performance Optimization
description: Common performance patterns and anti-patterns
tags: [performance, optimization, speed]
---

# Performance Optimization

## Database Queries

**Bad:**
```javascript
// N+1 query problem
for (const user of users) {
  const posts = await db.posts.find({ userId: user.id });
}
````

**Good:**

```javascript
// Single query with join
const usersWithPosts = await db.users.find().populate("posts");
```

## Caching

```javascript
const cache = new Map();

async function getData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}
```

## Debouncing

```javascript
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedSearch = debounce(search, 300);
```

## Lazy Loading

```javascript
// Load only when needed
const heavyModule = await import("./heavy-module.js");
```

## Batch Operations

```javascript
// Process in batches
async function processBatch(items, batchSize = 100) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(process));
  }
}
```

````

## Recommended Global Hooks

### 1. Pre-Commit Test Runner

**Hook:** Run tests before every commit

```json
{
  "name": "pre-commit-tests",
  "trigger": "onSave",
  "filePattern": "**/*.{js,ts,jsx,tsx}",
  "action": "command",
  "command": "npm test -- --bail --findRelatedTests ${file}"
}
````

### 2. Auto-Format on Save

**Hook:** Format code on save

```json
{
  "name": "auto-format",
  "trigger": "onSave",
  "filePattern": "**/*.{js,ts,jsx,tsx,json,md}",
  "action": "command",
  "command": "npx prettier --write ${file}"
}
```

### 3. Lint on Save

**Hook:** Run linter on save

```json
{
  "name": "lint-on-save",
  "trigger": "onSave",
  "filePattern": "**/*.{js,ts,jsx,tsx}",
  "action": "command",
  "command": "npx eslint ${file} --fix"
}
```

### 4. Update Dependencies Weekly

**Hook:** Remind to update dependencies

```json
{
  "name": "dependency-check",
  "trigger": "onSessionStart",
  "action": "message",
  "message": "Check for outdated dependencies with: npm outdated"
}
```

### 5. Documentation Reminder

**Hook:** Remind to update docs when changing API

```json
{
  "name": "docs-reminder",
  "trigger": "onSave",
  "filePattern": "**/api/**/*.js",
  "action": "message",
  "message": "Remember to update API documentation if you changed the interface"
}
```

## Priority Recommendations

### Must-Have (Create These First)

1. **apify-actor-template.md** ✅ (Already created!)
2. **testing-standards.md** - Universal testing patterns
3. **git-conventions.md** - Consistent commit messages
4. **error-handling.md** - Consistent error patterns

### Nice-to-Have

5. **api-design.md** - If you build APIs
6. **performance.md** - Optimization patterns
7. **code-review.md** - Review checklist

### Project-Specific (Keep in workspace)

- Domain-specific patterns
- Project architecture docs
- Team-specific conventions

## How to Create Global Steering

### On Windows (PowerShell):

```powershell
# Create directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.kiro\steering"

# Create file
New-Item -ItemType File -Path "$env:USERPROFILE\.kiro\steering\testing-standards.md"
```

### On Mac/Linux:

```bash
# Create directory
mkdir -p ~/.kiro/steering

# Create file
touch ~/.kiro/steering/testing-standards.md
```

## Verification

Check if global steering is working:

1. Create a new workspace
2. Start a chat with Kiro
3. Mention "testing" or "commit message"
4. Kiro should reference your global steering

## Best Practices

### Do:

✅ Keep steering files focused and concise
✅ Use clear examples
✅ Update as you learn new patterns
✅ Tag files appropriately
✅ Use `inclusion: manual` for templates

### Don't:

❌ Put project-specific details in global steering
❌ Make files too long (split into multiple files)
❌ Duplicate information across files
❌ Include sensitive information

## Maintenance

### Monthly Review:

- Review and update patterns
- Remove outdated information
- Add new learnings
- Consolidate similar patterns

### Version Control:

Consider backing up your global steering:

```bash
# Backup
cp -r ~/.kiro/steering ~/Dropbox/kiro-steering-backup

# Or use git
cd ~/.kiro/steering
git init
git add .
git commit -m "Backup steering files"
git remote add origin <your-repo>
git push
```

## Summary

**Create these global steering files:**

1. ✅ `apify-actor-template.md` (Done!)
2. 📝 `testing-standards.md` (High priority)
3. 📝 `git-conventions.md` (High priority)
4. 📝 `error-handling.md` (High priority)
5. 📝 `api-design.md` (If applicable)
6. 📝 `performance.md` (Nice to have)

**Create these hooks:**

1. Pre-commit test runner
2. Auto-format on save
3. Lint on save

**Time investment:** 1-2 hours to set up
**ROI:** Consistent patterns across all projects forever!
