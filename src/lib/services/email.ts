export interface EmailConfig {
  id: string;
  recipient_email: string;
  include_new_jobs: boolean;
  include_job_changes: boolean;
  include_statistics: boolean;
  frequency_hours: number;
  last_sent_at?: string;
}

export interface EmailLog {
  id: string;
  created_at: string;
  from_email: string;
  subject: string;
  job_links_extracted: number;
  jobs_processed: number;
  notes?: string;
}

export interface EmailLogFilters {
  from_email?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export class EmailService {
  private static readonly QUERIES = {
    GET_ALL_CONFIGS: `
      SELECT id, recipient_email, include_new_jobs, include_job_changes, 
             include_statistics, frequency_hours, last_sent_at
      FROM email_config
      ORDER BY recipient_email
    `,
    GET_CONFIG_BY_ID: `
      SELECT id, recipient_email, include_new_jobs, include_job_changes, 
             include_statistics, frequency_hours, last_sent_at
      FROM email_config
      WHERE id = ?
    `,
    INSERT_CONFIG: `
      INSERT INTO email_config (id, recipient_email, include_new_jobs, include_job_changes, 
                               include_statistics, frequency_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    UPDATE_CONFIG: `
      UPDATE email_config 
      SET recipient_email = ?, include_new_jobs = ?, include_job_changes = ?, 
          include_statistics = ?, frequency_hours = ?
      WHERE id = ?
    `,
    DELETE_CONFIG: `DELETE FROM email_config WHERE id = ?`,
    UPDATE_LAST_SENT: `UPDATE email_config SET last_sent_at = ? WHERE id = ?`,
    
    COUNT_LOGS: `SELECT COUNT(*) as total FROM email_logs`,
    GET_LOGS: `
      SELECT id, created_at, from_email, subject, job_links_extracted, 
             jobs_processed, notes
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    INSERT_LOG: `
      INSERT INTO email_logs (id, created_at, from_email, subject, 
                             job_links_extracted, jobs_processed, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  };

  constructor(private db: any) {}

  async getAllConfigs(): Promise<EmailConfig[]> {
    const { results } = await this.db.prepare(EmailService.QUERIES.GET_ALL_CONFIGS).all();
    return (results || []).map(this.mapConfigRow);
  }

  async getConfigById(id: string): Promise<EmailConfig | null> {
    const { results } = await this.db.prepare(EmailService.QUERIES.GET_CONFIG_BY_ID).bind(id).all();
    return results?.[0] ? this.mapConfigRow(results[0]) : null;
  }

  async createConfig(config: Omit<EmailConfig, 'id' | 'last_sent_at'>): Promise<EmailConfig> {
    const id = crypto.randomUUID();
    
    await this.db.prepare(EmailService.QUERIES.INSERT_CONFIG).bind(
      id,
      config.recipient_email,
      config.include_new_jobs ? 1 : 0,
      config.include_job_changes ? 1 : 0,
      config.include_statistics ? 1 : 0,
      config.frequency_hours
    ).run();

    return {
      id,
      ...config
    };
  }

  async updateConfig(id: string, config: Omit<EmailConfig, 'id' | 'last_sent_at'>): Promise<boolean> {
    const result = await this.db.prepare(EmailService.QUERIES.UPDATE_CONFIG).bind(
      config.recipient_email,
      config.include_new_jobs ? 1 : 0,
      config.include_job_changes ? 1 : 0,
      config.include_statistics ? 1 : 0,
      config.frequency_hours,
      id
    ).run();

    return result.changes > 0;
  }

  async deleteConfig(id: string): Promise<boolean> {
    const result = await this.db.prepare(EmailService.QUERIES.DELETE_CONFIG).bind(id).run();
    return result.changes > 0;
  }

  async updateLastSent(id: string, lastSentAt: string): Promise<boolean> {
    const result = await this.db.prepare(EmailService.QUERIES.UPDATE_LAST_SENT).bind(lastSentAt, id).run();
    return result.changes > 0;
  }

  async getLogs(filters: EmailLogFilters = {}): Promise<{ logs: EmailLog[], pagination: PaginationInfo }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const offset = (page - 1) * limit;

    // Build dynamic query with filters
    let whereConditions = [];
    let params = [];

    if (filters.from_email) {
      whereConditions.push('from_email LIKE ?');
      params.push(`%${filters.from_email}%`);
    }

    if (filters.start_date) {
      whereConditions.push('created_at >= ?');
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      whereConditions.push('created_at <= ?');
      params.push(filters.end_date);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = EmailService.QUERIES.COUNT_LOGS + ' ' + whereClause;
    const { results: countResults } = await this.db.prepare(countQuery).bind(...params).all();
    const total = countResults?.[0]?.total || 0;

    // Get logs with pagination
    const dataQuery = EmailService.QUERIES.GET_LOGS.replace(
      'ORDER BY created_at DESC',
      `${whereClause} ORDER BY created_at DESC`
    );

    const { results } = await this.db.prepare(dataQuery)
      .bind(...params, limit, offset)
      .all();

    return {
      logs: (results || []).map(this.mapLogRow),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createLog(log: Omit<EmailLog, 'id' | 'created_at'>): Promise<EmailLog> {
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    
    await this.db.prepare(EmailService.QUERIES.INSERT_LOG).bind(
      id,
      created_at,
      log.from_email,
      log.subject,
      log.job_links_extracted,
      log.jobs_processed,
      log.notes || ''
    ).run();

    return {
      id,
      created_at,
      ...log
    };
  }

  private mapConfigRow(row: any): EmailConfig {
    return {
      id: row.id,
      recipient_email: row.recipient_email,
      include_new_jobs: Boolean(row.include_new_jobs),
      include_job_changes: Boolean(row.include_job_changes),
      include_statistics: Boolean(row.include_statistics),
      frequency_hours: row.frequency_hours,
      last_sent_at: row.last_sent_at
    };
  }

  private mapLogRow(row: any): EmailLog {
    return {
      id: row.id,
      created_at: row.created_at,
      from_email: row.from_email,
      subject: row.subject,
      job_links_extracted: row.job_links_extracted,
      jobs_processed: row.jobs_processed,
      notes: row.notes
    };
  }
}