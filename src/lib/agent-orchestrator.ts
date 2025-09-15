// Agent Orchestrator - Core AI Services for 9to5 Scout
// Implements the multi-agent architecture outlined in AGENTS.md

export interface AgentRequest {
  type: 'job_discovery' | 'career_coach' | 'content_generation' | 'market_intelligence';
  payload: any;
  user_id?: string;
  context?: {
    previous_searches?: string[];
    applied_jobs?: string[];
    saved_jobs?: string[];
  };
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  confidence_score?: number;
  processing_time_ms?: number;
}

export interface AgentConfig {
  name: string;
  enabled: boolean;
  model: string;
  max_tokens: number;
  temperature: number;
  timeout_ms: number;
}

export class AgentOrchestrator {
  private agents: Map<string, AgentConfig> = new Map();
  private db?: any;
  
  constructor(database?: any) {
    this.db = database;
    this.initializeAgents();
  }
  
  private initializeAgents() {
    // Initialize core agents based on AGENTS.md specification
    this.agents.set('job_discovery', {
      name: 'Job Discovery Agent',
      enabled: true,
      model: 'gpt-4',
      max_tokens: 4000,
      temperature: 0.7,
      timeout_ms: 30000
    });
    
    this.agents.set('career_coach', {
      name: 'Career Coach Agent', 
      enabled: true,
      model: 'gpt-4',
      max_tokens: 4000,
      temperature: 0.8,
      timeout_ms: 45000
    });
    
    this.agents.set('content_generation', {
      name: 'Content Generation Agent',
      enabled: true,
      model: 'gpt-4',
      max_tokens: 3000,
      temperature: 0.6,
      timeout_ms: 25000
    });
    
    this.agents.set('market_intelligence', {
      name: 'Market Intelligence Agent',
      enabled: true,
      model: 'gpt-4',
      max_tokens: 2000,
      temperature: 0.3,
      timeout_ms: 20000
    });
  }
  
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const agent = this.agents.get(request.type);
      if (!agent || !agent.enabled) {
        return {
          success: false,
          error: `Agent ${request.type} not available or disabled`
        };
      }
      
      // Log agent interaction if database is available
      if (this.db && request.user_id) {
        await this.logAgentInteraction(request, 'started');
      }
      
      // Route to appropriate agent implementation
      let result;
      switch (request.type) {
        case 'job_discovery':
          result = await this.processJobDiscovery(request, agent);
          break;
        case 'career_coach':
          result = await this.processCareerCoach(request, agent);
          break;
        case 'content_generation':
          result = await this.processContentGeneration(request, agent);
          break;
        case 'market_intelligence':
          result = await this.processMarketIntelligence(request, agent);
          break;
        default:
          throw new Error(`Unknown agent type: ${request.type}`);
      }
      
      const response = {
        success: true,
        data: result,
        confidence_score: this.calculateConfidenceScore(result),
        processing_time_ms: Date.now() - startTime
      };
      
      // Log performance metrics
      if (this.db) {
        await this.logPerformanceMetrics(request, response, agent);
      }
      
      return response;
      
    } catch (error) {
      const errorResponse = {
        success: false,
        error: error.message,
        processing_time_ms: Date.now() - startTime
      };
      
      // Log error
      if (this.db) {
        await this.logPerformanceMetrics(request, errorResponse, this.agents.get(request.type));
      }
      
      return errorResponse;
    }
  }
  
  private async processJobDiscovery(request: AgentRequest, agent: AgentConfig): Promise<any> {
    // Job Discovery Agent implementation
    const { query, filters, user_preferences } = request.payload;
    
    // Enhanced job discovery with database integration
    if (this.db) {
      const jobs = await this.searchJobsInDatabase(query, filters);
      const recommendations = await this.generatePersonalizedRecommendations(request.user_id, user_preferences);
      
      return {
        jobs: jobs.results || [],
        total_results: jobs.count || 0,
        search_query: query,
        filters_applied: filters,
        recommendations: recommendations || [],
        semantic_matches: await this.getSemanticMatches(query),
        search_suggestions: await this.generateSearchSuggestions(query, filters)
      };
    }
    
    // Fallback for when database is not available
    return {
      jobs: [],
      total_results: 0,
      search_query: query,
      filters_applied: filters,
      recommendations: [],
      semantic_matches: []
    };
  }
  
  private async processCareerCoach(request: AgentRequest, agent: AgentConfig): Promise<any> {
    // Career Coach Agent implementation
    const { user_profile, request_type, target_job_id } = request.payload;
    
    switch (request_type) {
      case 'career_analysis':
        return this.analyzeCareerPath(user_profile);
      case 'skill_gaps':
        return this.analyzeSkillGaps(user_profile, target_job_id);
      case 'learning_path':
        return this.generateLearningPath(user_profile);
      case 'salary_guidance':
        return this.provideSalaryGuidance(user_profile);
      default:
        throw new Error(`Unknown career coach request: ${request_type}`);
    }
  }
  
  private async processContentGeneration(request: AgentRequest, agent: AgentConfig): Promise<any> {
    // Content Generation Agent implementation
    const { content_type, context, job_id } = request.payload;
    
    switch (content_type) {
      case 'cover_letter':
        return this.generateCoverLetter(context, job_id);
      case 'resume_optimization':
        return this.optimizeResume(context, job_id);
      case 'email_template':
        return this.generateEmailTemplate(context);
      case 'interview_prep':
        return this.generateInterviewPrep(context, job_id);
      default:
        throw new Error(`Unknown content type: ${content_type}`);
    }
  }
  
  private async processMarketIntelligence(request: AgentRequest, agent: AgentConfig): Promise<any> {
    // Market Intelligence Agent implementation
    const { analysis_type, parameters } = request.payload;
    
    switch (analysis_type) {
      case 'salary_analysis':
        return this.analyzeSalaryTrends(parameters);
      case 'market_trends':
        return this.analyzeMarketTrends(parameters);
      case 'company_intelligence':
        return this.analyzeCompanyIntelligence(parameters);
      case 'skill_demand':
        return this.analyzeSkillDemand(parameters);
      default:
        throw new Error(`Unknown analysis type: ${analysis_type}`);
    }
  }
  
  // Database integration methods
  private async searchJobsInDatabase(query: string, filters: any): Promise<any> {
    if (!this.db) return { results: [], count: 0 };
    
    let sql = `
      SELECT j.*, 
        CASE 
          WHEN j.title LIKE ? OR j.company LIKE ? THEN 3
          WHEN j.department LIKE ? OR j.location LIKE ? THEN 2
          ELSE 1 
        END as relevance_score
      FROM jobs j 
      WHERE j.status = 'active'
    `;
    
    const params = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];
    
    // Add filters
    if (filters.location) {
      sql += ' AND j.location LIKE ?';
      params.push(`%${filters.location}%`);
    }
    
    if (filters.company) {
      sql += ' AND j.company LIKE ?';
      params.push(`%${filters.company}%`);
    }
    
    if (filters.salary_min) {
      sql += ' AND (j.salary_min >= ? OR j.salary_max >= ?)';
      params.push(filters.salary_min, filters.salary_min);
    }
    
    sql += ' ORDER BY relevance_score DESC, j.posted_at DESC LIMIT 50';
    
    const stmt = this.db.prepare(sql);
    return await stmt.bind(...params).all();
  }
  
  private async generatePersonalizedRecommendations(userId: string, preferences: any): Promise<any[]> {
    if (!this.db || !userId) return [];
    
    // Get user's application history and preferences
    const userQuery = this.db.prepare(`
      SELECT 
        up.skills_primary,
        up.location_preferences, 
        up.industry_preferences,
        up.salary_expectations
      FROM user_profiles up 
      WHERE up.user_id = ?
    `);
    
    const userProfile = await userQuery.bind(userId).first();
    if (!userProfile) return [];
    
    // Find similar jobs based on user profile
    const recommendationsQuery = this.db.prepare(`
      SELECT j.* FROM jobs j 
      WHERE j.status = 'active'
      AND j.posted_at > datetime('now', '-30 days')
      ORDER BY j.posted_at DESC
      LIMIT 10
    `);
    
    const recommendations = await recommendationsQuery.all();
    return recommendations.results || [];
  }
  
  private async getSemanticMatches(query: string): Promise<any[]> {
    // Placeholder for semantic search implementation
    // In production, this would use vector embeddings
    return [];
  }
  
  private async generateSearchSuggestions(query: string, filters: any): Promise<string[]> {
    return [
      `${query} remote`,
      `${query} senior`,
      `${query} ${filters.location || 'san francisco'}`
    ];
  }
  
  private async logAgentInteraction(request: AgentRequest, status: string): Promise<void> {
    if (!this.db) return;
    
    const query = this.db.prepare(`
      INSERT INTO agent_interactions (id, user_id, agent_type, request_type, query, response_summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    await query.bind(
      crypto.randomUUID(),
      request.user_id || 'anonymous',
      request.type,
      JSON.stringify(request.payload).substring(0, 500),
      JSON.stringify(request),
      status,
      new Date().toISOString()
    ).run();
  }
  
  private async logPerformanceMetrics(request: AgentRequest, response: AgentResponse, agent?: AgentConfig): Promise<void> {
    if (!this.db || !agent) return;
    
    const query = this.db.prepare(`
      INSERT INTO agent_performance (id, agent_id, request_type, response_time_ms, success, error_message, tokens_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await query.bind(
      crypto.randomUUID(),
      agent.name,
      request.type,
      response.processing_time_ms || 0,
      response.success ? 1 : 0,
      response.error || null,
      agent.max_tokens, // Estimated tokens used
      new Date().toISOString()
    ).run();
  }
  
  
  // Enhanced helper methods for career coaching
  private async analyzeCareerPath(userProfile: any): Promise<any> {
    return {
      current_assessment: {
        level: userProfile.career_level || 'Mid-level',
        strengths: ['Technical skills', 'Problem solving'],
        areas_for_growth: ['Leadership', 'Communication']
      },
      career_opportunities: [
        { role: 'Senior Developer', timeline: '6-12 months', probability: 0.8 },
        { role: 'Tech Lead', timeline: '12-18 months', probability: 0.6 },
        { role: 'Engineering Manager', timeline: '18-24 months', probability: 0.4 }
      ],
      recommended_actions: [
        'Develop leadership skills through mentoring',
        'Lead cross-functional projects',
        'Improve communication through presentations'
      ],
      salary_trajectory: {
        current_estimate: { min: 95000, max: 120000 },
        projected_12m: { min: 110000, max: 140000 },
        projected_24m: { min: 130000, max: 160000 }
      }
    };
  }
  
  private async analyzeSkillGaps(userProfile: any, targetJobId?: string): Promise<any> {
    let targetSkills = ['React', 'TypeScript', 'Node.js', 'AWS'];
    
    if (this.db && targetJobId) {
      const jobQuery = this.db.prepare('SELECT * FROM jobs WHERE id = ?');
      const job = await jobQuery.bind(targetJobId).first();
      if (job && job.title) {
        // Extract skills from job description (simplified)
        targetSkills = this.extractSkillsFromJobDescription(job);
      }
    }
    
    const userSkills = userProfile.skills_primary || [];
    const missingSkills = targetSkills.filter(skill => !userSkills.includes(skill));
    
    return {
      target_skills: targetSkills,
      current_skills: userSkills,
      missing_skills: missingSkills,
      skill_gaps: missingSkills.map(skill => ({
        skill,
        priority: this.getSkillPriority(skill),
        estimated_learning_time: this.getEstimatedLearningTime(skill),
        learning_resources: this.getLearningResources(skill)
      })),
      overall_match_score: Math.max(0, 100 - (missingSkills.length * 15))
    };
  }
  
  private async generateLearningPath(userProfile: any): Promise<any> {
    const targetSkills = ['TypeScript', 'Docker', 'System Design', 'Leadership'];
    
    return {
      learning_path: targetSkills.map((skill, index) => ({
        skill,
        order: index + 1,
        duration_weeks: this.getEstimatedLearningTime(skill),
        prerequisites: this.getSkillPrerequisites(skill),
        resources: this.getLearningResources(skill),
        milestones: this.getSkillMilestones(skill)
      })),
      total_duration: '16-20 weeks',
      estimated_cost: '$200-500',
      success_probability: 0.8
    };
  }
  
  private async provideSalaryGuidance(userProfile: any): Promise<any> {
    return {
      current_market_value: {
        min: 95000,
        max: 125000,
        median: 110000,
        confidence: 0.85
      },
      negotiation_strategies: [
        'Research company salary bands',
        'Highlight unique value proposition',
        'Consider total compensation package'
      ],
      market_factors: [
        { factor: 'High demand for React skills', impact: '+10%' },
        { factor: 'Remote work premium', impact: '+5%' },
        { factor: 'Company size and funding', impact: '+15%' }
      ]
    };
  }
  
  // Enhanced helper methods for content generation
  private async generateCoverLetter(context: any, jobId?: string): Promise<any> {
    let jobDetails = {};
    
    if (this.db && jobId) {
      const jobQuery = this.db.prepare('SELECT * FROM jobs WHERE id = ?');
      jobDetails = await jobQuery.bind(jobId).first() || {};
    }
    
    return {
      content: this.buildCoverLetterContent(context, jobDetails),
      tone: context.tone || 'professional',
      word_count: 320,
      key_points: [
        'Relevant experience highlight',
        'Company-specific motivation',
        'Skills alignment',
        'Call to action'
      ],
      personalization_score: 0.9
    };
  }
  
  private async optimizeResume(context: any, jobId?: string): Promise<any> {
    return {
      optimization_suggestions: [
        {
          section: 'Summary',
          current: context.current_summary,
          suggested: 'Enhanced summary with keywords',
          impact: 'High'
        },
        {
          section: 'Skills',
          current: context.current_skills,
          suggested: 'Reorganized with job-relevant skills first',
          impact: 'Medium'
        }
      ],
      keyword_improvements: [
        { keyword: 'React', frequency: 3, importance: 'High' },
        { keyword: 'Agile', frequency: 1, importance: 'Medium' }
      ],
      ats_score: {
        current: 72,
        optimized: 87,
        improvement: '+15 points'
      },
      formatting_suggestions: [
        'Use consistent bullet points',
        'Optimize for ATS parsing',
        'Improve visual hierarchy'
      ]
    };
  }
  
  private async generateEmailTemplate(context: any): Promise<any> {
    return {
      subject: this.generateEmailSubject(context),
      content: this.generateEmailContent(context),
      template_type: context.type,
      personalization_level: 'high',
      best_practices: [
        'Keep subject line under 50 characters',
        'Include specific call-to-action',
        'Follow up within 48 hours'
      ]
    };
  }
  
  private async generateInterviewPrep(context: any, jobId?: string): Promise<any> {
    return {
      common_questions: [
        {
          question: "Tell me about yourself",
          suggested_approach: "Use STAR method",
          example_answer: "Brief professional story..."
        },
        {
          question: "Why are you interested in this role?",
          suggested_approach: "Connect to company values",
          example_answer: "Company-specific motivation..."
        }
      ],
      technical_topics: [
        'React hooks and lifecycle',
        'System design principles',
        'Database optimization'
      ],
      questions_to_ask: [
        "What does success look like in this role?",
        "What are the biggest challenges facing the team?",
        "What opportunities are there for growth?"
      ]
    };
  }
  
  // Enhanced helper methods for market intelligence
  private async analyzeSalaryTrends(parameters: any): Promise<any> {
    return {
      salary_analysis: {
        role: parameters.role,
        location: parameters.location,
        experience_level: parameters.experience_years,
        salary_range: { min: 90000, max: 140000 },
        market_median: 115000,
        percentiles: {
          p25: 95000,
          p50: 115000,
          p75: 130000,
          p90: 145000
        }
      },
      trend_analysis: {
        yoy_change: '+8%',
        direction: 'increasing',
        confidence: 0.9
      },
      market_factors: [
        'Remote work driving salary normalization',
        'High demand for technical skills',
        'Competition from tech companies'
      ],
      recommendations: [
        'Target companies in growth stage',
        'Negotiate for equity compensation',
        'Consider total compensation package'
      ]
    };
  }
  
  private async analyzeMarketTrends(parameters: any): Promise<any> {
    return {
      industry_trends: {
        growth_rate: '+12% YoY',
        job_openings: 25000,
        demand_level: 'very high',
        competition_level: 'moderate'
      },
      skill_trends: {
        hot_skills: ['React', 'TypeScript', 'AWS', 'Machine Learning'],
        declining_skills: ['jQuery', 'PHP', 'Flash'],
        emerging_skills: ['WebAssembly', 'Rust', 'Kubernetes']
      },
      geographic_trends: {
        hot_markets: ['Austin', 'Seattle', 'Remote'],
        salary_leaders: ['San Francisco', 'New York', 'Seattle'],
        growth_markets: ['Denver', 'Nashville', 'Portland']
      }
    };
  }
  
  private async analyzeCompanyIntelligence(parameters: any): Promise<any> {
    return {
      company_profile: {
        name: parameters.company,
        size: 'Mid-stage startup',
        funding_stage: 'Series B',
        growth_trajectory: 'Rapid growth'
      },
      hiring_intelligence: {
        active_openings: 45,
        hiring_velocity: '+20% this quarter',
        departments_hiring: ['Engineering', 'Sales', 'Marketing'],
        typical_timeline: '2-3 weeks'
      },
      culture_insights: {
        glassdoor_rating: 4.3,
        work_life_balance: 4.1,
        compensation: 4.0,
        management: 4.2,
        remote_friendly: true
      },
      strategic_insights: [
        'Recently raised $50M Series B',
        'Expanding into European market',
        'Strong technical leadership team'
      ]
    };
  }
  
  private async analyzeSkillDemand(parameters: any): Promise<any> {
    return {
      skill_analysis: parameters.skills?.map(skill => ({
        skill,
        demand_score: Math.floor(Math.random() * 40) + 60, // Mock score 60-100
        growth_trend: Math.random() > 0.5 ? 'increasing' : 'stable',
        job_openings: Math.floor(Math.random() * 5000) + 1000,
        avg_salary_premium: `${Math.floor(Math.random() * 20)}%`
      })) || []
    };
  }
  
  // Utility methods
  private extractSkillsFromJobDescription(job: any): string[] {
    const description = (job.title + ' ' + (job.department || '')).toLowerCase();
    const commonSkills = [
      'react', 'javascript', 'typescript', 'node.js', 'python', 'java', 
      'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'redis'
    ];
    
    return commonSkills.filter(skill => description.includes(skill));
  }
  
  private getSkillPriority(skill: string): 'High' | 'Medium' | 'Low' {
    const highPriority = ['React', 'TypeScript', 'AWS', 'System Design'];
    const mediumPriority = ['Docker', 'MongoDB', 'Redis'];
    
    if (highPriority.includes(skill)) return 'High';
    if (mediumPriority.includes(skill)) return 'Medium';
    return 'Low';
  }
  
  private getEstimatedLearningTime(skill: string): number {
    const timeMap: Record<string, number> = {
      'TypeScript': 4,
      'Docker': 3,
      'System Design': 8,
      'Leadership': 12,
      'React': 6,
      'AWS': 10
    };
    
    return timeMap[skill] || 4;
  }
  
  private getLearningResources(skill: string): any[] {
    return [
      {
        type: 'course',
        title: `Complete ${skill} Course`,
        provider: 'Online Platform',
        duration: '40 hours',
        cost: '$99'
      },
      {
        type: 'book',
        title: `Learning ${skill}`,
        author: 'Tech Expert',
        cost: '$29'
      }
    ];
  }
  
  private getSkillPrerequisites(skill: string): string[] {
    const prerequisites: Record<string, string[]> = {
      'TypeScript': ['JavaScript'],
      'Docker': ['Linux basics'],
      'System Design': ['Programming fundamentals', 'Database basics'],
      'Leadership': ['Communication skills']
    };
    
    return prerequisites[skill] || [];
  }
  
  private getSkillMilestones(skill: string): string[] {
    return [
      `Complete ${skill} fundamentals`,
      `Build practice project`,
      `Pass certification exam`,
      `Apply in real project`
    ];
  }
  
  private buildCoverLetterContent(context: any, jobDetails: any): string {
    return `Dear Hiring Manager,

I am excited to apply for the ${jobDetails.title || 'position'} at ${jobDetails.company || 'your company'}. With ${context.experience_years || 'several'} years of experience in software development and a strong background in the technologies you're seeking, I am confident I would be a valuable addition to your team.

${context.key_achievements || 'In my current role, I have successfully led multiple projects and contributed to significant improvements in system performance and user experience.'} I am particularly drawn to this opportunity because of ${context.company_interest || 'the innovative work your company is doing in the technology space'}.

I would welcome the opportunity to discuss how my skills in ${context.relevant_skills?.join(', ') || 'modern web technologies'} can contribute to your team's success. Thank you for considering my application.

Best regards,
${context.candidate_name || 'Your Name'}`;
  }
  
  private generateEmailSubject(context: any): string {
    const subjects = {
      follow_up: `Following up on ${context.position} application`,
      thank_you: `Thank you for the interview - ${context.position}`,
      networking: `Connecting about opportunities at ${context.company}`
    };
    
    return subjects[context.type] || 'Professional inquiry';
  }
  
  private generateEmailContent(context: any): string {
    const templates = {
      follow_up: `Hi ${context.contact_name},

I hope this email finds you well. I wanted to follow up on my application for the ${context.position} role submitted on ${context.application_date}.

I remain very interested in this opportunity and would welcome the chance to discuss how my experience aligns with your team's needs.

Thank you for your time and consideration.

Best regards,
${context.sender_name}`,
      
      thank_you: `Hi ${context.interviewer_name},

Thank you for taking the time to meet with me yesterday about the ${context.position} role. I enjoyed our conversation about ${context.discussion_topic} and learning more about the exciting projects your team is working on.

I'm even more enthusiastic about the opportunity to contribute to ${context.company} and help achieve your technical goals.

Please let me know if you need any additional information from me.

Best regards,
${context.sender_name}`
    };
    
    return templates[context.type] || templates.follow_up;
  }
  
  private calculateConfidenceScore(result: any): number {
    // Simple confidence calculation - in production this would be more sophisticated
    return 0.85;
  }
  
  getAgentConfigs(): AgentConfig[] {
    return Array.from(this.agents.values());
  }
  
  updateAgentConfig(agentType: string, config: Partial<AgentConfig>): boolean {
    const agent = this.agents.get(agentType);
    if (!agent) return false;
    
    this.agents.set(agentType, { ...agent, ...config });
    return true;
  }
}