# Email Ingestion Observability

This implementation provides comprehensive email ingestion observability for the 9to5 Scout platform, enabling administrators to monitor email processing activities and manage email configurations.

## Features Implemented

### 1. Email Configuration Management
- **GET /api/email-config** - Retrieve all email configurations
- **POST /api/email-config** - Create new email configuration  
- **PUT /api/email-config** - Update existing email configuration
- **DELETE /api/email-config** - Delete email configuration

### 2. Email Processing Logs
- **GET /api/email-logs** - Retrieve email processing logs with filtering and pagination
- **POST /api/email-logs** - Create new email processing log entry

### 3. Admin UI Components
- **Email Logs Table** - Displays email processing history with metrics
- **Email Config Manager** - Manage email ingestion configurations
- **Admin Dashboard** - Unified interface at `/admin/emails`

## Database Schema

The implementation uses existing database tables defined in `schema.sql`:

```sql
-- Email configuration for ingestion settings
CREATE TABLE email_config (
  id TEXT PRIMARY KEY,
  recipient_email TEXT,
  include_new_jobs INTEGER,
  include_job_changes INTEGER,
  include_statistics INTEGER,
  frequency_hours INTEGER,
  last_sent_at TEXT
);

-- Logs for email processing activities  
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT,
  from_email TEXT,
  subject TEXT,
  job_links_extracted INTEGER,
  jobs_processed INTEGER,
  notes TEXT
);
```

## API Documentation

### Email Configuration Endpoints

#### GET /api/email-config
Returns all email configurations.

**Response:**
```json
{
  "email_configs": [
    {
      "id": "config-123",
      "recipient_email": "admin@9to5scout.com",
      "include_new_jobs": true,
      "include_job_changes": false,
      "include_statistics": true,
      "frequency_hours": 24,
      "last_sent_at": "2024-12-15T10:00:00Z"
    }
  ],
  "success": true
}
```

#### POST /api/email-config
Creates a new email configuration.

**Request:**
```json
{
  "recipient_email": "user@example.com",
  "include_new_jobs": true,
  "include_job_changes": false,
  "include_statistics": true,
  "frequency_hours": 24
}
```

### Email Logs Endpoints

#### GET /api/email-logs
Returns email processing logs with optional filtering.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (max: 100, default: 50)
- `from_email` - Filter by sender email
- `start_date` - Filter from date (ISO format)
- `end_date` - Filter to date (ISO format)

**Response:**
```json
{
  "email_logs": [
    {
      "id": "log-123",
      "created_at": "2024-12-15T09:30:00Z",
      "from_email": "jobs@techcorp.com",
      "subject": "Weekly Tech Jobs Digest",
      "job_links_extracted": 15,
      "jobs_processed": 12,
      "notes": "3 jobs failed validation"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  },
  "success": true
}
```

## React Components

### EmailLogsTable Component
Located at `src/components/admin/email-logs-table.tsx`

Features:
- Responsive table with TanStack Table
- Date formatting with relative time
- Badge indicators for processing metrics
- Loading and empty states
- Truncated content with tooltips

### EmailConfigManager Component
Located at `src/components/admin/email-config-manager.tsx`

Features:
- CRUD operations for email configurations
- Form validation with Zod schema
- Switch toggles for feature flags
- Modal dialogs for create/edit
- Card-based configuration display

## Admin Dashboard

The main admin interface is available at `/admin/emails` and includes:

### Statistics Overview
- Total email count
- Active configurations count  
- Links extracted summary
- Jobs processed summary

### Tabbed Interface
1. **Email Logs Tab** - View and filter processing logs
2. **Configurations Tab** - Manage email settings

### Sample Test Data

The implementation includes realistic test data showing:
- **2 email configurations** (admin and team)
- **5 recent email logs** from various sources
- **86.2% processing success rate** (56/65 jobs processed)
- **4 emails processed** in last 24 hours

Example log entry:
```json
{
  "id": "log-1",
  "created_at": "2024-12-15T09:30:00Z",
  "from_email": "jobs@techcorp.com", 
  "subject": "Weekly Tech Jobs Digest",
  "job_links_extracted": 15,
  "jobs_processed": 12,
  "notes": "3 jobs failed validation due to missing salary info"
}
```

## Technology Stack

- **Backend:** Astro with Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Frontend:** React with TypeScript
- **UI Components:** Radix UI with Tailwind CSS
- **Tables:** TanStack Table with sorting and filtering
- **Forms:** React Hook Form with Zod validation
- **Date Handling:** date-fns for formatting

## File Structure

```
src/
├── pages/api/
│   ├── email-config.ts      # Email configuration API
│   └── email-logs.ts        # Email logs API
├── components/admin/
│   ├── email-logs-table.tsx    # Email logs table component
│   └── email-config-manager.tsx # Email config management
├── lib/services/
│   └── email.ts             # Email service layer
└── pages/admin/
    └── emails.astro         # Admin email dashboard
```

## Success Criteria Met ✅

1. **Email logs table** - ✅ Implemented with filtering, pagination, and metrics display
2. **Email configs get/update** - ✅ Full CRUD API with admin UI for management

The implementation provides a comprehensive observability solution for email ingestion, enabling administrators to monitor processing efficiency and configure email handling behavior through an intuitive web interface.