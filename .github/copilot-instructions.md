# 9to5-Scout Admin Dashboard
9to5-Scout is an Astro-based admin dashboard for job tracking and applicant management, built with React components, Tailwind CSS, and deployed on Cloudflare Workers with D1 database storage.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository
- **Install dependencies**: `npm install` -- takes 22 seconds. NEVER CANCEL.
- **Setup environment**: `cp .dev.vars.example .dev.vars` then edit `.dev.vars` to set `API_TOKEN=your_test_token`
- **Apply database migrations**: `npm run db:migrate` -- takes 2 seconds
- **Build the application**: `npm run build` -- takes 7 seconds. NEVER CANCEL. Set timeout to 15+ seconds.
- **Check deployment readiness**: `npm run check` -- takes 15 seconds. NEVER CANCEL. Set timeout to 30+ seconds.

### Run the Application
- **Development server with workflow workaround**:
  ```bash
  # REQUIRED workaround for workflow dependency issues
  cp wrangler.jsonc wrangler.jsonc.backup
  # Remove workflows section from wrangler.jsonc (lines starting with "workflows":)
  sed -i '/workflows/,$d' wrangler.jsonc && echo "}" >> wrangler.jsonc
  # Fix JSON syntax
  sed -i 's/],  /]/' wrangler.jsonc
  
  # Start development server
  npx wrangler dev --port 4321
  ```
  **CRITICAL**: The standard `npm run dev` command fails due to CustomerWorkflow export issues. Use the workaround above for reliable development.
- **Restore original config when done**:
  ```bash
  mv wrangler.jsonc.backup wrangler.jsonc
  ```
- **Access the application**:
  - Admin interface: `http://localhost:4321/admin/`
  - Main site: `http://localhost:4321/`
  - API base: `http://localhost:4321/api/`

### Test the Application
- **Smoke tests**: `PUBLIC_API_BASE=http://localhost:4321 npm run test` -- tests API endpoints (requires dev server running)
- **API authentication**: All API endpoints require either:
  - Header: `Authorization: Bearer <your_token>`
  - Header: `x-api-token: <your_token>`
- **Manual API testing**: 
  ```bash
  curl -H "Authorization: Bearer test_token_123" http://localhost:4321/api/monitoring/status
  ```

## Validation

### Always Manual Validate Changes
- **ALWAYS run the development server** after making changes and verify the admin interface loads correctly at `http://localhost:4321/admin/`
- **Test key user scenarios**:
  1. Navigate to admin dashboard and verify it loads without errors
  2. Check that API endpoints respond (may show internal errors but should not return 404/500 for auth)
  3. Verify build succeeds with `npm run build`
  4. Run deployment check with `npm run check`
- **Build validation**: Always run `npm run build` before committing - the build must succeed
- **Deployment validation**: Always run `npm run check` to ensure Cloudflare deployment will work

### Known Issues and Workarounds
- **Workflow dependency issues**: Both `npm run dev` and direct `npx wrangler dev` fail with "CustomerWorkflow not exported" errors. **REQUIRED workaround**: Temporarily remove the workflows section from `wrangler.jsonc` before starting the dev server (see detailed steps above).
- **API internal errors**: Some API endpoints may return internal errors due to missing data, but should authenticate correctly and not return 404s.
- **Network warnings**: "Unable to fetch Request.cf object" warnings are normal in local development.

## Project Structure

### Key Directories
- **`src/pages/`**: Astro pages including API routes (`src/pages/api/`) and admin pages (`src/pages/admin/`)
- **`src/components/`**: React UI components organized by feature (admin/, app/, ui/)
- **`src/lib/`**: Utility functions, API client, and TypeScript types
- **`src/layouts/`**: Astro layout components for different page types
- **`src/workflows/`**: Cloudflare Workflows definitions (customer workflow automation)
- **`migrations/`**: D1 database migration files
- **`scripts/`**: Build and development scripts (dev-smoke.mjs for API testing)

### Important Files
- **`wrangler.jsonc`**: Cloudflare Workers configuration (D1 database, KV storage, workflows)
- **`astro.config.mjs`**: Astro framework configuration with Cloudflare adapter
- **`schema.sql`**: Database schema for jobs, applicants, and monitoring
- **`.dev.vars`**: Local environment variables (API tokens, database config)

## Common Tasks

### Environment Setup
```bash
# Copy environment template
cp .dev.vars.example .dev.vars

# Edit .dev.vars to set your API token
# API_TOKEN=your_test_token_here

# For 9to5-Scout backend integration:
# PUBLIC_API_BASE=https://9to5-scout.hacolby.workers.dev
```

### Database Management
```bash
# Apply migrations locally
npm run db:migrate

# Apply migrations to remote (production)
npm run db:migrate:remote

# Initialize job tracking tables (alternative)
npx wrangler d1 execute DB --file=./schema.sql
```

### Build and Deploy
```bash
# Standard build
npm run build  # ~7 seconds

# Check deployment readiness (dry-run)
npm run check  # ~15 seconds

# Deploy to Cloudflare (requires auth)
npm run deploy
```

### Development Workflow
1. **Always start with**: `npm install && cp .dev.vars.example .dev.vars`
2. **Set API token** in `.dev.vars`: `API_TOKEN=test_token_123`
3. **Apply database migrations**: `npm run db:migrate`
4. **Apply workflow workaround**: 
   ```bash
   cp wrangler.jsonc wrangler.jsonc.backup
   sed -i '/workflows/,$d' wrangler.jsonc && echo "}" >> wrangler.jsonc
   sed -i 's/],  /]/' wrangler.jsonc
   ```
5. **Start development**: `npx wrangler dev --port 4321`
6. **Verify admin interface**: Navigate to `http://localhost:4321/admin/`
7. **Restore config when done**: `mv wrangler.jsonc.backup wrangler.jsonc`

## Tech Stack Details

### Frontend
- **Astro 5.x**: Static site generation with server-side rendering
- **React 19**: UI components and interactivity
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Pre-built component library
- **TypeScript**: Type safety and development experience

### Backend
- **Cloudflare Workers**: Serverless runtime environment
- **D1 Database**: SQLite-compatible serverless database
- **KV Storage**: Key-value storage for sessions
- **Workflows**: Background job processing (CustomerWorkflow)

### Key Dependencies
- **`@astrojs/cloudflare`**: Astro adapter for Cloudflare Workers
- **`@astrojs/react`**: React integration for Astro
- **`wrangler`**: Cloudflare development and deployment CLI
- **`zod`**: Runtime type validation

## Debugging Common Issues

### Build Failures
- **"CustomerWorkflow not exported"**: Remove workflows section from `wrangler.jsonc` temporarily or use direct wrangler command
- **Memory issues**: Build requires 2GB+ memory, increase Node.js memory: `export NODE_OPTIONS="--max-old-space-size=2048"`

### Development Server Issues
- **Connection refused**: Ensure dev server is running on correct port (4321)
- **API 401 errors**: Check that API_TOKEN is set in .dev.vars and matches request headers
- **Database errors**: Run `npm run db:migrate` to ensure local database is properly initialized

### Deployment Issues
- **Binding errors**: Ensure KV namespace and D1 database are properly configured in wrangler.jsonc
- **Missing secrets**: Set production API token: `npx wrangler secret put API_TOKEN`

## Performance Expectations

### Build Times (typical)
- **`npm install`**: 22 seconds
- **`npm run build`**: 7 seconds  
- **`npm run db:migrate`**: 2 seconds
- **`npm run check`**: 15 seconds

### Development
- **Server startup**: 15-20 seconds (includes build)
- **Hot reload**: 5-7 seconds for changes
- **API response**: <1 second for most endpoints

**CRITICAL**: NEVER CANCEL long-running commands. All build operations complete within 30 seconds. Use timeouts of 60+ seconds for safety.

## API Reference

### Authentication
All API endpoints require authentication via:
```bash
# Bearer token
Authorization: Bearer <token>

# Or X-API-Token header  
x-api-token: <token>
```

### Core Endpoints
- **`GET /api/monitoring/status`**: System health and job monitoring status
- **`GET /api/jobs`**: List jobs with filtering options
- **`GET /api/jobs/:id`**: Get specific job details
- **`POST /api/runs/monitor`**: Trigger monitoring run
- **`GET /api/applicant`**: Get applicant profile and history

### Testing API Endpoints
```bash
# Test with curl (replace token)
curl -H "Authorization: Bearer test_token_123" \
     http://localhost:4321/api/monitoring/status

# Run smoke tests against local server
PUBLIC_API_BASE=http://localhost:4321 npm run test
```

Remember: Focus on building and testing the application functionality. The admin interface should load and display the job tracking dashboard correctly after following these setup steps.