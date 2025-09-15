import type { 
  AgentRequest, 
  AgentResponse, 
  JobSearchQuery, 
  JobRecommendation,
  JobMatch,
  AgentConfig 
} from '../types';
import { BaseAgent } from '../types';
import { OpenAIService } from '../services/openai';

export class JobDiscoveryAgent extends BaseAgent {
  private openaiService: OpenAIService | null = null;

  constructor(config: AgentConfig & { openaiApiKey?: string }) {
    super(config);
    
    // Initialize OpenAI service if API key is available
    if (config.openaiApiKey) {
      this.openaiService = OpenAIService.createIfAvailable(config.openaiApiKey);
    }
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const { type, payload } = request.payload;
      
      let result;
      switch (type) {
        case 'semantic_search':
          result = await this.semanticSearch(payload as JobSearchQuery);
          break;
        case 'job_fit_analysis':
          result = await this.analyzeJobFit(payload);
          break;
        case 'recommendations':
          result = await this.generateRecommendations(payload);
          break;
        default:
          throw new Error(`Unknown job discovery operation: ${type}`);
      }
      
      return {
        request_id: request.request_id,
        agent_name: this.config.name,
        status: 'success',
        data: result,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          model_used: this.config.model,
          confidence_score: 0.8
        }
      };
    } catch (error) {
      return {
        request_id: request.request_id,
        agent_name: this.config.name,
        status: 'error',
        error: {
          code: 'job_discovery_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: {
          execution_time_ms: Date.now() - startTime
        }
      };
    }
  }

  async semanticSearch(query: JobSearchQuery): Promise<JobRecommendation> {
    // Use OpenAI for enhanced semantic search if available, otherwise use mock data
    if (this.openaiService) {
      return await this.semanticSearchWithAI(query);
    }
    
    // Mock implementation - fallback when OpenAI is not available
    const mockJobs: JobMatch[] = [
      {
        job_id: 'job-1',
        fit_score: 92,
        fit_explanation: 'Strong match for React and TypeScript skills with remote work option',
        highlighted_skills: ['React', 'TypeScript', 'Remote Work'],
        salary_match: 85,
        location_match: 100, // Remote
        culture_match: 88
      },
      {
        job_id: 'job-2', 
        fit_score: 87,
        fit_explanation: 'Good frontend experience match, competitive salary',
        highlighted_skills: ['JavaScript', 'CSS', 'Frontend'],
        salary_match: 90,
        location_match: 75,
        culture_match: 82
      }
    ];

    // Simulate semantic understanding of the query
    const searchIntent = this.parseSearchIntent(query.query);
    const suggestedFilters = this.generateSuggestedFilters(query);

    return {
      jobs: mockJobs,
      search_intent: searchIntent,
      suggested_filters: suggestedFilters,
      total_matches: mockJobs.length,
      confidence_score: 0.85
    };
  }

  private async semanticSearchWithAI(query: JobSearchQuery): Promise<JobRecommendation> {
    try {
      // Use OpenAI to understand the search intent and extract key requirements
      const analysisPrompt = `
        Analyze this job search query and extract key information:
        Query: "${query.query}"
        
        Extract:
        1. Primary job roles/titles being sought
        2. Required skills and technologies
        3. Experience level preferences
        4. Location preferences
        5. Work arrangement preferences (remote, hybrid, onsite)
        6. Salary expectations if mentioned
        7. Company size/culture preferences
        
        Return as JSON with these fields: role, skills, experience_level, location_pref, work_arrangement, salary_range, company_culture.
      `;

      const response = await this.openaiService!.createChatCompletion(
        this.config.model,
        [
          { role: 'system', content: 'You are an expert job search analyst. Extract structured information from natural language job search queries.' },
          { role: 'user', content: analysisPrompt }
        ],
        { temperature: 0.3, max_tokens: 500 }
      );

      let searchAnalysis;
      try {
        const content = response.choices[0]?.message?.content;
        if (content) {
          searchAnalysis = JSON.parse(content);
        }
      } catch (parseError) {
        console.warn('Failed to parse OpenAI response, using fallback');
        searchAnalysis = this.parseSearchIntentFallback(query.query);
      }

      // Generate AI-enhanced job matches
      const aiGeneratedJobs = await this.generateJobMatchesWithAI(query, searchAnalysis);
      
      return {
        jobs: aiGeneratedJobs,
        search_intent: searchAnalysis.role || 'General job search',
        suggested_filters: this.generateAISuggestedFilters(searchAnalysis),
        total_matches: aiGeneratedJobs.length,
        confidence_score: 0.92
      };

    } catch (error) {
      console.warn('OpenAI semantic search failed, falling back to mock data:', error);
      // Fall back to mock implementation if OpenAI fails
      return this.semanticSearch(query);
    }
  }

  private async generateJobMatchesWithAI(query: JobSearchQuery, analysis: any): Promise<JobMatch[]> {
    try {
      const jobGenerationPrompt = `
        Based on this job search analysis, generate 3-5 realistic job matches:
        ${JSON.stringify(analysis)}
        
        For each job, provide:
        - job_id (string like "job-N")
        - fit_score (number 1-100) 
        - fit_explanation (string explaining why it's a good match)
        - highlighted_skills (array of relevant skills)
        - salary_match (number 1-100)
        - location_match (number 1-100)
        - culture_match (number 1-100)
        
        Return as JSON array of job objects.
      `;

      const response = await this.openaiService!.createChatCompletion(
        this.config.model,
        [
          { role: 'system', content: 'Generate realistic job matches based on search analysis. Return valid JSON only.' },
          { role: 'user', content: jobGenerationPrompt }
        ],
        { temperature: 0.5, max_tokens: 1000 }
      );

      const content = response.choices[0]?.message?.content;
      if (content) {
        const jobs = JSON.parse(content);
        return Array.isArray(jobs) ? jobs : [jobs];
      }
    } catch (error) {
      console.warn('Failed to generate AI job matches:', error);
    }

    // Fallback to mock jobs
    return [
      {
        job_id: 'job-ai-1',
        fit_score: 88,
        fit_explanation: 'AI-enhanced match based on your search preferences',
        highlighted_skills: analysis.skills?.slice(0, 3) || ['Technical Skills'],
        salary_match: 85,
        location_match: analysis.work_arrangement === 'remote' ? 100 : 80,
        culture_match: 87
      }
    ];
  }

  private generateAISuggestedFilters(analysis: any): any {
    return {
      location: analysis.location_pref || null,
      remote_ok: analysis.work_arrangement === 'remote',
      experience_level: analysis.experience_level || null,
      skills: analysis.skills || [],
      salary_range: analysis.salary_range || null
    };
  }

  private parseSearchIntentFallback(query: string): any {
    // Simple keyword-based analysis as fallback
    const lowerQuery = query.toLowerCase();
    return {
      role: lowerQuery.includes('senior') ? 'Senior Developer' : 
            lowerQuery.includes('junior') ? 'Junior Developer' : 'Developer',
      skills: ['JavaScript', 'React'],
      work_arrangement: lowerQuery.includes('remote') ? 'remote' : 'hybrid'
    };
  }

  async analyzeJobFit(payload: { job_id: string; user_profile: any }): Promise<JobMatch> {
    // Mock job fit analysis
    const { job_id, user_profile } = payload;
    
    // In real implementation, this would:
    // 1. Fetch job details from database
    // 2. Compare user skills with job requirements using NLP
    // 3. Calculate multi-dimensional fit score
    // 4. Generate explanation using AI
    
    return {
      job_id,
      fit_score: 88,
      fit_explanation: 'Your React and TypeScript experience aligns well with this role. The company culture emphasizes work-life balance which matches your preferences.',
      highlighted_skills: user_profile.skills.filter((skill: string) => 
        ['React', 'TypeScript', 'JavaScript'].includes(skill)
      ),
      salary_match: 85,
      location_match: user_profile.preferences.remote_ok ? 100 : 70,
      culture_match: 90
    };
  }

  async generateRecommendations(payload: { user_id: string; limit?: number }): Promise<JobRecommendation> {
    // Mock personalized recommendations based on user behavior
    // In real implementation, this would use collaborative filtering + content-based filtering
    
    const { user_id, limit = 20 } = payload;
    
    const recommendedJobs: JobMatch[] = [
      {
        job_id: 'rec-1',
        fit_score: 94,
        fit_explanation: 'Based on your recent searches and saved jobs, this senior frontend role offers the growth opportunity you\'re seeking',
        highlighted_skills: ['React', 'Team Leadership', 'Mentoring'],
        salary_match: 92,
        location_match: 95,
        culture_match: 89
      }
    ];

    return {
      jobs: recommendedJobs.slice(0, limit),
      search_intent: 'career_growth',
      suggested_filters: {
        seniority_level: 'senior',
        skills: ['React', 'TypeScript', 'Leadership']
      },
      total_matches: recommendedJobs.length,
      confidence_score: 0.92
    };
  }

  private parseSearchIntent(query: string): string {
    // Simple intent classification - in real version would use NLP model
    const intents = [
      { keywords: ['remote', 'work from home', 'telecommute'], intent: 'remote_work' },
      { keywords: ['senior', 'lead', 'manager'], intent: 'career_advancement' },
      { keywords: ['startup', 'early stage'], intent: 'startup_interest' },
      { keywords: ['work life balance', 'flexible'], intent: 'work_life_balance' }
    ];

    const lowerQuery = query.toLowerCase();
    for (const { keywords, intent } of intents) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general_search';
  }

  private generateSuggestedFilters(query: JobSearchQuery): any {
    // Generate intelligent filter suggestions based on query and user history
    return {
      employment_type: query.query.includes('remote') ? ['remote', 'hybrid'] : undefined,
      experience_level: query.query.includes('senior') ? ['senior', 'lead'] : undefined,
      skills: this.extractSkillsFromQuery(query.query)
    };
  }

  private extractSkillsFromQuery(query: string): string[] {
    // Simple skill extraction - in real version would use NER model
    const commonSkills = ['React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Node.js', 'CSS', 'HTML'];
    return commonSkills.filter(skill => 
      query.toLowerCase().includes(skill.toLowerCase())
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      // In real implementation, check model availability and database connectivity
      return true;
    } catch {
      return false;
    }
  }
}