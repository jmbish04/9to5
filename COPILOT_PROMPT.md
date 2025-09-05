Got it. Here’s a single, drop-in Codex/Copilot prompt you can paste into the root of https://github.com/jmbish04/9to5 to scaffold and finish the Astro + React (shadcn/ui + Tailwind) frontend for 9to5-Scout against the worker at https://9to5-scout.hacolby.workers.dev.

⸻

PROMPT FOR CODEX / COPILOT

You are a senior full-stack engineer working in the jmbish04/9to5 repo. Build the complete frontend for 9to5-Scout on Astro with React UI components using shadcn/ui and Tailwind. The app deploys on Cloudflare Pages and consumes the backend at https://9to5-scout.hacolby.workers.dev using the provided OpenAPI 3.1 spec below.

Persona & principles
•Act as an expert in Astro, TypeScript, React, shadcn/ui, and Cloudflare Pages.
•Code must be clean, modular, typed, testable, and production-ready.
•No auth headers: the site sits behind Cloudflare Access; do not inject tokens.
•Favor server fetches via Astro endpoints where it simplifies pagination; otherwise use typed client hooks.
•All interactive React components in .astro files must use client:only="react" or client:load appropriately.
•All UI elements must use shadcn/ui primitives and patterns.

Grounding resources (follow exactly)
•shadcn/ui CLI commands and usage (for adding Button, Card, Dialog, Table, Select, Input, Textarea, Tabs, Badge, Pagination helpers, Skeleton, Sonner/Toast if needed). Use npx shadcn@latest add <component> as documented.
•Cloudflare Pages build/deploy facts:
•Framework preset Astro → build command npm run build, output dist.
•Use Pages Functions only if needed later; initial app is static + XHR to the worker origin.
•Keep repo deployable via Pages Git integration.

API surface (source of truth)

Use THIS OpenAPI 3.1 JSON to generate types and a typed client. Base URL is / relative to the worker origin https://9to5-scout.hacolby.workers.dev. (Do not hard-code bearer tokens; none required.)

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "9to5-Scout API",
    "description": "AI-powered job discovery and career assistance platform with comprehensive job scraping, agent-based resume optimization, and email routing capabilities.",
    "version": "1.0.0",
    "contact": {
      "name": "9to5-Scout Support",
      "email": "support@9to5scout.dev"
    }
  },
  "servers": [
    {
      "url": "/",
      "description": "Current worker deployment"
    }
  ],
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "Job": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "site_id": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "canonical_url": { "type": "string", "format": "uri" },
          "title": { "type": "string" },
          "company": { "type": "string" },
          "location": { "type": "string" },
          "employment_type": { "type": "string" },
          "department": { "type": "string" },
          "salary_min": { "type": "integer" },
          "salary_max": { "type": "integer" },
          "salary_currency": { "type": "string" },
          "source": { 
            "type": "string", 
            "enum": ["SCRAPED", "EMAIL", "MANUAL"],
            "description": "Source of job discovery"
          },
          "status": { "type": "string", "enum": ["open", "closed"] },
          "posted_at": { "type": "string", "format": "date-time" },
          "first_seen_at": { "type": "string", "format": "date-time" },
          "last_crawled_at": { "type": "string", "format": "date-time" }
        }
      },
      "AgentConfig": {
        "type": "object",
        "required": ["id", "name", "role", "goal", "backstory", "llm"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "role": { "type": "string" },
          "goal": { "type": "string" },
          "backstory": { "type": "string" },
          "llm": { "type": "string" },
          "system_prompt": { "type": "string" },
          "max_tokens": { "type": "integer", "default": 4000 },
          "temperature": { "type": "number", "default": 0.7 },
          "enabled": { "type": "boolean", "default": true },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" }
        }
      },
      "TaskConfig": {
        "type": "object",
        "required": ["id", "name", "description", "expected_output", "agent_id"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "expected_output": { "type": "string" },
          "agent_id": { "type": "string" },
          "context_tasks": { 
            "type": "array", 
            "items": { "type": "string" },
            "description": "Array of task IDs this task depends on"
          },
          "output_schema": { "type": "object" },
          "enabled": { "type": "boolean", "default": true },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" }
        }
      },
      "WorkflowConfig": {
        "type": "object",
        "required": ["id", "name", "description", "task_sequence"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "task_sequence": { 
            "type": "array", 
            "items": { "type": "string" },
            "description": "Array of task IDs in execution order"
          },
          "enabled": { "type": "boolean", "default": true },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" }
        }
      },
      "EmailConfig": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "enabled": { "type": "boolean", "default": true },
          "frequency_hours": { "type": "integer", "minimum": 1, "default": 24 },
          "recipient_email": { "type": "string", "format": "email" },
          "include_new_jobs": { "type": "boolean", "default": true },
          "include_job_changes": { "type": "boolean", "default": true },
          "include_statistics": { "type": "boolean", "default": true },
          "last_sent_at": { "type": "string", "format": "date-time" },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" }
        }
      },
      "CoverLetterRequest": {
        "type": "object",
        "required": ["job_title", "company_name", "job_description_text", "candidate_career_summary"],
        "properties": {
          "job_title": { "type": "string" },
          "company_name": { "type": "string" },
          "hiring_manager_name": { "type": "string" },
          "job_description_text": { "type": "string" },
          "candidate_career_summary": { "type": "string" }
        }
      },
      "ResumeRequest": {
        "type": "object",
        "required": ["job_title", "company_name", "job_description_text", "candidate_career_summary"],
        "properties": {
          "job_title": { "type": "string" },
          "company_name": { "type": "string" },
          "job_description_text": { "type": "string" },
          "candidate_career_summary": { "type": "string" }
        }
      },
      "Error": {
        "type": "object",
        "properties": {
          "error": { "type": "string" },
          "message": { "type": "string" }
        }
      },
      "Snapshot": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "job_id": { "type": "string" },
          "run_id": { "type": "string" },
          "content_hash": { "type": "string" },
          "html_r2_key": { "type": "string" },
          "json_r2_key": { "type": "string" },
          "screenshot_r2_key": { "type": "string" },
          "pdf_r2_key": { "type": "string" },
          "markdown_r2_key": { "type": "string" },
          "fetched_at": { "type": "string", "format": "date-time" },
          "http_status": { "type": "integer" },
          "etag": { "type": "string" }
        }
      },
      "Change": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "job_id": { "type": "string" },
          "from_snapshot_id": { "type": "string" },
          "to_snapshot_id": { "type": "string" },
          "diff_json": { "type": "string" },
          "semantic_summary": { "type": "string" },
          "changed_at": { "type": "string", "format": "date-time" }
        }
      },
      "JobTrackingHistory": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "job_id": { "type": "string" },
          "snapshot_id": { "type": "string" },
          "tracking_date": { "type": "string", "format": "date" },
          "status": { 
            "type": "string",
            "enum": ["open", "closed", "modified", "error"]
          },
          "content_hash": { "type": "string" },
          "title_changed": { "type": "boolean" },
          "requirements_changed": { "type": "boolean" },
          "salary_changed": { "type": "boolean" },
          "description_changed": { "type": "boolean" },
          "error_message": { "type": "string" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "JobMarketStats": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "date": { "type": "string", "format": "date" },
          "total_jobs_tracked": { "type": "integer" },
          "new_jobs_found": { "type": "integer" },
          "jobs_closed": { "type": "integer" },
          "jobs_modified": { "type": "integer" },
          "avg_job_duration_days": { "type": "number" },
          "top_companies": { "type": "string", "description": "JSON array of top companies" },
          "trending_keywords": { "type": "string", "description": "JSON array of trending keywords" },
          "salary_stats": { "type": "string", "description": "JSON object with salary statistics" },
          "location_stats": { "type": "string", "description": "JSON object with location statistics" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "DailyMonitoringResult": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "format": "date" },
          "jobs_checked": { "type": "integer" },
          "jobs_modified": { "type": "integer" },
          "jobs_closed": { "type": "integer" },
          "errors": { "type": "integer" },
          "snapshots_created": { "type": "integer" },
          "pdfs_generated": { "type": "integer" },
          "markdown_extracts": { "type": "integer" }
        }
      }
    }
  },
  "paths": {
    "/": {
      "get": {
        "summary": "Landing page with platform documentation",
        "operationId": "getLandingPage",
        "security": [],
        "responses": {
          "200": {
            "description": "HTML documentation page",
            "content": {
              "text/html": {
                "schema": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "/openapi.json": {
      "get": {
        "summary": "OpenAPI specification",
        "operationId": "getOpenAPISpec",
        "security": [],
        "responses": {
          "200": {
            "description": "OpenAPI 3.1.0 specification",
            "content": {
              "application/json": {
                "schema": { "type": "object" }
              }
            }
          }
        }
      }
    },
    "/api/health": {
      "get": {
        "summary": "Health check endpoint",
        "operationId": "healthCheck",
        "security": [],
        "responses": {
          "200": {
            "description": "Service health status",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string" },
                    "timestamp": { "type": "string", "format": "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/jobs": {
      "get": {
        "summary": "List all jobs",
        "operationId": "listJobs",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 50 }
          },
          {
            "name": "offset",
            "in": "query", 
            "schema": { "type": "integer", "default": 0 }
          },
          {
            "name": "status",
            "in": "query",
            "schema": { "type": "string", "enum": ["open", "closed"] }
          },
          {
            "name": "source",
            "in": "query",
            "schema": { "type": "string", "enum": ["SCRAPED", "EMAIL", "MANUAL"] }
          }
        ],
        "responses": {
          "200": {
            "description": "List of jobs",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/Job" }
                }
              }
            }
          }
        }
      }
    },
    "/api/jobs/{id}": {
      "get": {
        "summary": "Get job by ID",
        "operationId": "getJob",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Job details",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Job" }
              }
            }
          },
          "404": {
            "description": "Job not found",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/api/jobs/{id}/tracking": {
      "get": {
        "summary": "Get job tracking history",
        "operationId": "getJobTracking",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" },
            "description": "Job ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Job tracking timeline with snapshots and changes",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "job": { "$ref": "#/components/schemas/Job" },
                    "timeline": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/JobTrackingHistory" }
                    },
                    "snapshots": {
                      "type": "array", 
                      "items": { "$ref": "#/components/schemas/Snapshot" }
                    },
                    "changes": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/Change" }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Job not found",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/api/jobs/{id}/snapshots/{snapshotId}/content": {
      "get": {
        "summary": "Get snapshot content from R2 storage",
        "operationId": "getSnapshotContent",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" },
            "description": "Job ID"
          },
          {
            "name": "snapshotId",
            "in": "path", 
            "required": true,
            "schema": { "type": "string" },
            "description": "Snapshot ID"
          },
          {
            "name": "type",
            "in": "query",
            "required": false,
            "schema": { 
              "type": "string",
              "enum": ["html", "pdf", "markdown", "json", "screenshot"],
              "default": "html"
            },
            "description": "Content type to retrieve"
          }
        ],
        "responses": {
          "200": {
            "description": "Snapshot content",
            "content": {
              "text/html": { "schema": { "type": "string" } },
              "application/pdf": { "schema": { "type": "string", "format": "binary" } },
              "text/markdown": { "schema": { "type": "string" } },
              "application/json": { "schema": { "type": "object" } },
              "image/png": { "schema": { "type": "string", "format": "binary" } }
            }
          },
          "404": {
            "description": "Snapshot or content not found",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/api/jobs/{id}/monitoring": {
      "put": {
        "summary": "Update job monitoring settings",
        "operationId": "updateJobMonitoring",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" },
            "description": "Job ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "daily_monitoring_enabled": { "type": "boolean" },
                  "monitoring_frequency_hours": { "type": "integer", "minimum": 1 }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Updated job with monitoring settings",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Job" }
              }
            }
          },
          "404": {
            "description": "Job not found",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/api/monitoring/daily-run": {
      "post": {
        "summary": "Manually trigger daily job monitoring",
        "operationId": "triggerDailyMonitoring",
        "responses": {
          "200": {
            "description": "Daily monitoring results",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/DailyMonitoringResult" }
              }
            }
          }
        }
      }
    },
    "/api/monitoring/status": {
      "get": {
        "summary": "Get monitoring status and statistics",
        "operationId": "getMonitoringStatus",
        "responses": {
          "200": {
            "description": "Monitoring status and recent activity",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "active_jobs_monitored": { "type": "integer" },
                    "jobs_needing_check": { "type": "integer" },
                    "last_updated": { "type": "string", "format": "date-time" },
                    "recent_activity": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "tracking_date": { "type": "string" },
                          "jobs_checked": { "type": "integer" },
                          "jobs_modified": { "type": "integer" },
                          "jobs_closed": { "type": "integer" },
                          "errors": { "type": "integer" }
                        }
                      }
                    },
                    "market_statistics": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/JobMarketStats" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/jobs/monitoring-queue": {
      "get": {
        "summary": "Get list of jobs that need monitoring",
        "operationId": "getMonitoringQueue",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": { "type": "integer", "default": 50 },
            "description": "Maximum number of jobs to return"
          }
        ],
        "responses": {
          "200": {
            "description": "Jobs needing monitoring",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "total_jobs": { "type": "integer" },
                    "returned_jobs": { "type": "integer" },
                    "jobs": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/Job" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/runs/discovery": {
      "post": {
        "summary": "Start job discovery run",
        "operationId": "startDiscoveryRun",
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "config_id": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Discovery run started",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "run_id": { "type": "string" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/runs/monitor": {
      "post": {
        "summary": "Start job monitoring run",
        "operationId": "startMonitorRun",
        "responses": {
          "200": {
            "description": "Monitor run started",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "run_id": { "type": "string" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/agent/query": {
      "get": {
        "summary": "Semantic job search using AI",
        "operationId": "semanticJobSearch",
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "description": "Search query for semantic job matching",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Matching jobs with relevance scores",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "allOf": [
                      { "$ref": "#/components/schemas/Job" },
                      {
                        "type": "object",
                        "properties": {
                          "relevance_score": { "type": "number" }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/cover-letter": {
      "post": {
        "summary": "Generate AI-powered cover letter",
        "operationId": "generateCoverLetter",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/CoverLetterRequest" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Generated cover letter",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "cover_letter": { "type": "string" },
                    "html": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/resume": {
      "post": {
        "summary": "Generate AI-optimized resume content",
        "operationId": "generateResume",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/ResumeRequest" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Generated resume content",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "summary": { "type": "string" },
                    "experience_bullets": {
                      "type": "array",
                      "items": { "type": "string" }
                    },
                    "skills": {
                      "type": "array", 
                      "items": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/email/insights/send": {
      "post": {
        "summary": "Send job insights email manually",
        "operationId": "sendEmailInsights",
        "responses": {
          "200": {
            "description": "Email sent successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean" },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/email/logs": {
      "get": {
        "summary": "Get email processing logs",
        "operationId": "getEmailLogs",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 50 }
          }
        ],
        "responses": {
          "200": {
            "description": "Email processing logs",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "logs": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string" },
                          "from_email": { "type": "string" },
                          "subject": { "type": "string" },
                          "job_links_extracted": { "type": "integer" },
                          "jobs_processed": { "type": "integer" },
                          "status": { "type": "string" },
                          "received_at": { "type": "string", "format": "date-time" }
                        }
                      }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "limit": { "type": "integer" },
                        "offset": { "type": "integer" },
                        "total": { "type": "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/email/configs": {
      "get": {
        "summary": "Get email configuration",
        "operationId": "getEmailConfigs",
        "responses": {
          "200": {
            "description": "Email configurations",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "configs": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/EmailConfig" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update email configuration",
        "operationId": "updateEmailConfigs",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/EmailConfig" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Configuration updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/agents": {
      "get": {
        "summary": "List all agent configurations",
        "operationId": "listAgents",
        "parameters": [
          {
            "name": "enabled",
            "in": "query",
            "schema": { "type": "boolean" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of agent configurations",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/AgentConfig" }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create new agent configuration",
        "operationId": "createAgent",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/AgentConfig" }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Agent created",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/AgentConfig" }
              }
            }
          }
        }
      }
    },
    "/api/agents/{id}": {
      "get": {
        "summary": "Get agent configuration by ID",
        "operationId": "getAgent", 
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Agent configuration",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/AgentConfig" }
              }
            }
          },
          "404": {
            "description": "Agent not found",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update agent configuration",
        "operationId": "updateAgent",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/AgentConfig" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Agent updated",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/AgentConfig" }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete agent configuration",
        "operationId": "deleteAgent",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "204": {
            "description": "Agent deleted"
          },
          "404": {
            "description": "Agent not found"
          }
        }
      }
    },
    "/api/tasks": {
      "get": {
        "summary": "List all task configurations",
        "operationId": "listTasks",
        "parameters": [
          {
            "name": "enabled",
            "in": "query",
            "schema": { "type": "boolean" }
          },
          {
            "name": "agent_id",
            "in": "query",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of task configurations",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/TaskConfig" }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create new task configuration",
        "operationId": "createTask",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/TaskConfig" }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Task created",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/TaskConfig" }
              }
            }
          }
        }
      }
    },
    "/api/tasks/{id}": {
      "get": {
        "summary": "Get task configuration by ID",
        "operationId": "getTask",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Task configuration",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/TaskConfig" }
              }
            }
          },
          "404": {
            "description": "Task not found"
          }
        }
      },
      "put": {
        "summary": "Update task configuration",
        "operationId": "updateTask",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/TaskConfig" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Task updated",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/TaskConfig" }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete task configuration",
        "operationId": "deleteTask",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "204": {
            "description": "Task deleted"
          }
        }
      }
    },
    "/api/workflows": {
      "get": {
        "summary": "List all workflow configurations",
        "operationId": "listWorkflows",
        "parameters": [
          {
            "name": "enabled",
            "in": "query",
            "schema": { "type": "boolean" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of workflow configurations",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/WorkflowConfig" }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create new workflow configuration",
        "operationId": "createWorkflow",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/WorkflowConfig" }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Workflow created",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/WorkflowConfig" }
              }
            }
          }
        }
      }
    },
    "/api/workflows/{id}": {
      "get": {
        "summary": "Get workflow configuration by ID",
        "operationId": "getWorkflow",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Workflow configuration",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/WorkflowConfig" }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update workflow configuration",
        "operationId": "updateWorkflow",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/WorkflowConfig" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Workflow updated",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/WorkflowConfig" }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete workflow configuration",
        "operationId": "deleteWorkflow",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "204": {
            "description": "Workflow deleted"
          }
        }
      }
    },
    "/api/workflows/{id}/execute": {
      "post": {
        "summary": "Execute a workflow",
        "operationId": "executeWorkflow",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "context": {
                    "type": "object",
                    "description": "Input context for workflow execution"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Workflow execution started",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "execution_id": { "type": "string" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/applicant/history": {
      "post": {
        "summary": "Submit job history for AI processing",
        "operationId": "submitJobHistory",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["user_id", "raw_content"],
                "properties": {
                  "user_id": {
                    "type": "string",
                    "description": "Unique identifier for the applicant"
                  },
                  "raw_content": {
                    "type": "string",
                    "description": "Job history content in any format (plaintext, markdown, JSON, etc.)"
                  },
                  "content_type": {
                    "type": "string",
                    "enum": ["text/plain", "text/markdown", "application/json"],
                    "default": "text/plain",
                    "description": "Hint about the content format"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Job history processed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean" },
                    "submission_id": { "type": "string" },
                    "applicant_id": { "type": "string" },
                    "entries_processed": { "type": "integer" },
                    "entries": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/JobHistoryEntry" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/applicant/{user_id}/history": {
      "get": {
        "summary": "Get applicant's job history and profile",
        "operationId": "getJobHistory",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" },
            "description": "Unique identifier for the applicant"
          }
        ],
        "responses": {
          "200": {
            "description": "Applicant profile and job history",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "applicant": { "$ref": "#/components/schemas/ApplicantProfile" },
                    "job_history": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/JobHistoryEntry" }
                    },
                    "submissions": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/JobHistorySubmission" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/applicant/job-rating": {
      "post": {
        "summary": "Generate AI-powered job fit rating",
        "operationId": "generateJobRating",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["user_id", "job_id"],
                "properties": {
                  "user_id": {
                    "type": "string",
                    "description": "Unique identifier for the applicant"
                  },
                  "job_id": {
                    "type": "string",
                    "description": "Job ID to rate fit against"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Job fit rating generated",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/JobRating" }
              }
            }
          }
        }
      }
    },
    "/api/applicant/{user_id}/job-ratings": {
      "get": {
        "summary": "Get all job ratings for an applicant",
        "operationId": "getJobRatings",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" },
            "description": "Unique identifier for the applicant"
          }
        ],
        "responses": {
          "200": {
            "description": "List of job ratings",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/JobRating" }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Deliverables (files to create/modify)

Follow existing repo structure. Extend, don’t replace.

0) Project setup & deps
•Ensure Tailwind is wired for Astro.
•Add deps:
•openapi-typescript (dev) for type generation
•zod, zustand, swr (or React Query), date-fns, qs
•@radix-ui/react-* as pulled by shadcn/ui CLI
•sonner for toasts (optional)
•Add scripts in package.json:
•"types:api": "openapi-typescript public/openapi.json -o src/lib/types/openapi.ts"
•"dev", "build", "preview" already present; keep them intact.

1) OpenAPI, types, and API client
•Place public/openapi.json (keep in repo; CI-friendly).
•Generate src/lib/types/openapi.ts from it.
•Create src/lib/api.ts:
•const API_BASE = 'https://9to5-scout.hacolby.workers.dev' (single source)
•A generic http() wrapper with proper fetch and JSON parsing.
•Export fully typed functions for every operationId in the spec (listJobs, getJob, getJobTracking, getSnapshotContent, updateJobMonitoring, getMonitoringStatus, … all others). Infer request/response types from openapi.ts.
•Pagination helpers using limit/offset. Use qs to build querystrings.
•Create lightweight SWR hooks in src/lib/hooks/ (e.g., useJobs, useMonitoringStatus, useJob, useJobTracking, useMonitoringQueue, etc.) with keys stable on params.

2) Layout, shell, and navigation
•src/components/ui/ → add via shadcn CLI: button card dialog table input select textarea tabs badge skeleton and any supporting primitives.
•src/components/app/AppShell.tsx:
•Top Nav with product name.
•Left Sidebar (Dashboard, Jobs, Applicant, Agents, Tasks, Workflows).
•Dark mode toggle (optional).
•src/layouts/AdminLayout.astro consumes AppShell and renders children.

3) Routes & pages (Astro)

Create these pages under src/pages/:

/admin (Dashboard)
•File: src/pages/admin/index.astro
•Fetch GET /api/monitoring/status.
•Cards:
•Monitoring Status: active_jobs_monitored, jobs_needing_check, last_updated.
•Recent Activity: compact list from recent_activity with date, checked/modified/closed/errors.
•Market Statistics: simple table/grouped list (role, location, totals, avg salary).
•Include a “Run Daily Monitoring” button calling POST /api/monitoring/daily-run and toast success.

/admin/jobs (List)
•File: src/pages/admin/jobs.astro
•Table with columns: Title, Company, Location, Employment Type, Status, Source.
•Above table: filters for status and source (Select), a text search (optional), and pagination (limit/offset).
•Each Title links to /admin/jobs/[id].

/admin/jobs/[id] (Detail)
•File: src/pages/admin/jobs/[id].astro
•Fetch GET /api/jobs/{id}.
•Tracking timeline from GET /api/jobs/{id}/tracking:
•Timeline cards listing tracking_date, status, change_summary.
•Collapsible sections for Snapshots and Changes.
•Snapshot content viewer:
•A “View content” menu → choose html | markdown | screenshot | pdf.
•For html/markdown: render inside a Dialog using a safe container (dangerouslySetInnerHTML for HTML).
•For screenshot/pdf: open in new tab (download link).
•Monitoring settings form in a Dialog:
•PUT /api/jobs/{id}/monitoring with daily_monitoring_enabled, monitoring_frequency_hours.
•On success → refetch and toast.
•Job Fit Rating button:
•Calls POST /api/applicant/job-rating with user_id: "default-user" and the job id.
•Show the JobRating response in a Card (overall + dimension scores, strengths, gaps, recommendations).

/admin/applicant
•File: src/pages/admin/applicant.astro
•Applicant Profile & History:
•Fetch GET /api/applicant/{user_id}/history where user_id = "default-user".
•Show ApplicantProfile summary and table of job_history entries.
•Raw Job History submission form:
•POST /api/applicant/history with { user_id: "default-user", raw_content, content_type }.
•Show status and any entries returned.
•AI Tools:
•Cover Letter Generator form POST /api/cover-letter:
•Input: job title, company, job description text, candidate summary (+ optional hiring manager).
•Show rendered HTML preview and raw text.
•Resume Optimizer form POST /api/resume:
•Same input model; show summary, experience bullets, skills.

/admin/agents, /admin/tasks, /admin/workflows
•CRUD pages with Tables + Dialog forms:
•Agents (GET/POST/PUT/DELETE /api/agents and /api/agents/{id})
•Tasks (/api/tasks, /api/tasks/{id})
•Workflows (/api/workflows, /api/workflows/{id})
•Workflow detail includes an Execute button calling POST /api/workflows/{id}/execute and showing a toast/result id.

4) Reusable React components (put in src/components/)
•DataTable.tsx: generic table with columns, server pagination, empty & loading states (Skeleton).
•FilterBar.tsx: Select, Input, and Apply/Clear buttons.
•StatCard.tsx, Timeline.tsx, ScoreBar.tsx (for rating sub-scores), KeyValue.tsx.
•SnapshotViewer.tsx: Dialog that fetches content by type and renders safely.
•MonitoringForm.tsx: Dialog form using shadcn Dialog, Input, Switch (if added), Button.

5) UX details
•Loading: Skeletons on first load; spinners on actions; disabled buttons during submit.
•Errors: Non-OK responses show a Toast (sonner) and inline error text.
•Empty states: Friendly message + CTA (e.g., “Trigger discovery run”).
•Responsive: Cards stack on mobile, tables scroll horizontally with sticky headers.

6) shadcn/ui usage
•Initialize shadcn (if not already) and add components as needed:
•Run CLI per docs: npx shadcn@latest init, npx shadcn@latest add button card dialog table input select textarea tabs badge skeleton (expand if needed). Keep aliases consistent.

7) Environment & build for Cloudflare Pages
•Keep Astro default build: npm run build → dist.
•Ensure no Node-only APIs run at build time unless guarded.
•Document Cloudflare Pages deploy steps in README.md (Git integration; build command/output). Use the Astro preset (dist) exactly.

8) Minimal tests
•Add a few Vitest tests for utility functions (e.g., query builders, type guards) and component render sanity for StatCard/DataTable.

Implementation steps (do these in order)
1.Sync OpenAPI
•Add public/openapi.json (exact JSON above).
•Generate types: pnpm add -D openapi-typescript && pnpm types:api.
2.API wrapper
•Implement src/lib/api.ts + src/lib/hooks/* with full coverage of endpoints in the spec.
•Export strongly-typed functions named by operationId.
3.shadcn setup
•Initialize and add required components using the CLI; wire Tailwind styles per docs.
4.App shell + routes
•Create AdminLayout.astro, AppShell.tsx, and all pages under /admin as described.
•Use SWR (or React Query) hooks for data loading; show Skeletons and errors.
5.Job detail deep-linking
•Implement snapshot content Dialog fetching by type.
•Add monitoring settings PUT flow with optimistic UI + refetch.
6.Applicant tools
•Build the history submission and AI cover-letter/resume panels.
•On success, render previews with copy buttons.
7.Agent/Task/Workflow admin
•Tables with Create/Edit Dialogs; Delete with confirm; Workflow Execute action.
8.Docs
•Update README.md:
•Local dev (pnpm i && pnpm dev)
•Type generation (pnpm types:api)
•Adding UI components with shadcn CLI
•Deploy to Cloudflare Pages (Astro preset: npm run build, output dist).

Acceptance criteria
•All listed routes render and interact successfully with the live worker.
•API client functions exist for every endpoint/operationId in the spec and are fully typed.
•Filters and pagination work on /admin/jobs.
•Timeline, Snapshots, Changes render on job detail. Snapshot HTML/MD renders in-app; screenshot/PDF open or download.
•Monitoring settings update via PUT with visible feedback.
•Applicant history submit works; returned entries display.
•Cover letter and resume endpoints produce visible outputs.
•Agents/Tasks/Workflows pages provide full CRUD and workflow execute.
•UI is responsive, uses shadcn/ui, and has loading/error states.
•Build succeeds on Cloudflare Pages with Astro preset.

Stretch (optional, time-boxed)
•Add /admin/search using GET /api/agent/query?q=… with ranked list and badges for relevance.
•Add “Monitoring Queue” page from /api/jobs/monitoring-queue.

⸻

Notes for the assistant
•Use absolute imports/aliases consistent with the repo.
•Keep components small and co-located when sensible.
•Prefer SWR with fetcher bound to our http() wrapper and mutate after writes.
•Ensure all .astro pages wrap React islands with client:only="react" where required.

⸻

Commands you may need (reference)
•Add shadcn components: npx shadcn@latest add button card dialog table input select textarea tabs badge skeleton
•Generate OpenAPI types: pnpm types:api
•Cloudflare Pages deploy preset for Astro: build npm run build, output dist.

⸻

That’s the full prompt. Once you paste this into Copilot/Codex in the repo, it should scaffold the pages, hooks, and components, wire shadcn/ui, and call the worker per the spec.
