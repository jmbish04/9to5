import type { 
  AgentRequest, 
  AgentResponse, 
  CoverLetterRequest,
  ResumeOptimizationRequest,
  ContentGenerationResult,
  AgentConfig 
} from '../types';
import { BaseAgent } from '../types';

export class ContentGenerationAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const { type, payload } = request.payload;
      
      let result;
      switch (type) {
        case 'cover_letter':
          result = await this.generateCoverLetter(payload as CoverLetterRequest);
          break;
        case 'resume_optimization':
          result = await this.optimizeResume(payload as ResumeOptimizationRequest);
          break;
        case 'email_template':
          result = await this.generateEmailTemplate(payload);
          break;
        default:
          throw new Error(`Unknown content generation operation: ${type}`);
      }
      
      return {
        request_id: request.request_id,
        agent_name: this.config.name,
        status: 'success',
        data: result,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          model_used: this.config.model,
          confidence_score: result.quality_metrics?.personalization_score || 0.8
        }
      };
    } catch (error) {
      return {
        request_id: request.request_id,
        agent_name: this.config.name,
        status: 'error',
        error: {
          code: 'content_generation_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: {
          execution_time_ms: Date.now() - startTime
        }
      };
    }
  }

  async generateCoverLetter(request: CoverLetterRequest): Promise<ContentGenerationResult> {
    // Mock cover letter generation - in real version would use OpenAI API
    const { user_profile, tone, length, highlights } = request;
    
    // Generate personalized cover letter based on user profile and job
    const content = this.createCoverLetterContent(user_profile, tone, length, highlights);
    
    // Assess quality metrics
    const quality_metrics = await this.assessContentQuality(content, 'cover_letter');
    
    // Generate improvement suggestions
    const suggestions = this.generateContentSuggestions(content, quality_metrics);
    
    return {
      content,
      quality_metrics,
      suggestions
    };
  }

  async optimizeResume(request: ResumeOptimizationRequest): Promise<ContentGenerationResult> {
    // Mock resume optimization
    const { resume_content, job_description, target_keywords, optimization_focus } = request;
    
    // Analyze current resume and optimize based on job description
    const optimized_content = this.optimizeResumeContent(resume_content, job_description, target_keywords, optimization_focus);
    
    // Assess ATS compatibility and other metrics
    const quality_metrics = await this.assessContentQuality(optimized_content, 'resume');
    
    const suggestions = this.generateOptimizationSuggestions(resume_content, optimized_content, quality_metrics);
    
    return {
      content: optimized_content,
      quality_metrics,
      suggestions
    };
  }

  async generateEmailTemplate(payload: {
    type: 'follow_up' | 'thank_you' | 'networking';
    context: any;
    tone: 'professional' | 'casual';
  }): Promise<ContentGenerationResult> {
    const { type, context, tone } = payload;
    
    const content = this.createEmailTemplate(type, context, tone);
    const quality_metrics = await this.assessContentQuality(content, 'email');
    
    return {
      content,
      quality_metrics,
      suggestions: []
    };
  }

  private createCoverLetterContent(
    user_profile: any, 
    tone: string, 
    length: string, 
    highlights: string[]
  ): string {
    // Mock cover letter generation based on parameters
    const greeting = `Dear Hiring Manager,`;
    
    const intro = tone === 'enthusiastic' 
      ? `I am thrilled to submit my application for this exciting opportunity!`
      : `I am writing to express my interest in the position at your company.`;
    
    const body = `With ${user_profile.experience_years} years of experience in ${user_profile.current_role || 'the field'}, I bring strong expertise in ${user_profile.skills.slice(0, 3).join(', ')}. ${highlights.map(h => `My experience in ${h} would be valuable for this role.`).join(' ')}`;
    
    const closing = tone === 'conservative'
      ? `I look forward to the opportunity to discuss my qualifications further.`
      : `I would welcome the chance to contribute to your team's success!`;
    
    const signature = `Sincerely,\n${user_profile.name}`;
    
    return `${greeting}\n\n${intro}\n\n${body}\n\n${closing}\n\n${signature}`;
  }

  private optimizeResumeContent(
    resume_content: string,
    job_description: string,
    target_keywords: string[],
    optimization_focus: string[]
  ): string {
    // Mock resume optimization
    let optimized = resume_content;
    
    if (optimization_focus.includes('keywords')) {
      // Add target keywords naturally into the content
      target_keywords.forEach(keyword => {
        if (!optimized.toLowerCase().includes(keyword.toLowerCase())) {
          optimized += ` • Experience with ${keyword}`;
        }
      });
    }
    
    if (optimization_focus.includes('achievements')) {
      // Convert responsibilities to achievements with metrics
      optimized = optimized.replace(/Responsible for/g, 'Successfully managed');
      optimized = optimized.replace(/Worked on/g, 'Delivered');
    }
    
    return optimized;
  }

  private createEmailTemplate(type: string, context: any, tone: string): string {
    const { company, interviewer_name, position } = context;
    
    switch (type) {
      case 'thank_you':
        return `Subject: Thank you for the ${position} interview\n\nDear ${interviewer_name || 'Hiring Manager'},\n\nThank you for taking the time to meet with me about the ${position} role at ${company}. I enjoyed our conversation about the team's goals and how my experience could contribute to your success.\n\nI remain very interested in this opportunity and look forward to hearing about next steps.\n\nBest regards,\n[Your Name]`;
      
      case 'follow_up':
        return `Subject: Following up on ${position} application\n\nDear Hiring Manager,\n\nI wanted to follow up on my application for the ${position} role at ${company}. I remain very interested in this opportunity and would welcome the chance to discuss how my skills could benefit your team.\n\nPlease let me know if you need any additional information.\n\nBest regards,\n[Your Name]`;
      
      default:
        return `Subject: Exploring opportunities at ${company}\n\nHello,\n\nI hope this message finds you well. I am interested in learning more about opportunities at ${company}, particularly roles that leverage my background in [your field].\n\nI would appreciate any insights you might share about your team and current openings.\n\nThank you for your time,\n[Your Name]`;
    }
  }

  private async assessContentQuality(content: string, type: string): Promise<ContentGenerationResult['quality_metrics']> {
    // Mock quality assessment - in real version would use AI models for analysis
    return {
      grammar_score: 92,
      readability_score: 78,
      keyword_density: type === 'resume' ? 85 : 70,
      tone_consistency: 88,
      personalization_score: 82,
      ats_compatibility: type === 'resume' ? 89 : 95
    };
  }

  private generateContentSuggestions(content: string, quality_metrics: any): string[] {
    const suggestions: string[] = [];
    
    if (quality_metrics.grammar_score < 90) {
      suggestions.push('Consider reviewing grammar and spelling');
    }
    
    if (quality_metrics.readability_score < 70) {
      suggestions.push('Simplify sentence structure for better readability');
    }
    
    if (quality_metrics.personalization_score < 80) {
      suggestions.push('Add more specific examples from your experience');
    }
    
    return suggestions;
  }

  private generateOptimizationSuggestions(original: string, optimized: string, quality_metrics: any): string[] {
    const suggestions: string[] = [];
    
    if (quality_metrics.ats_compatibility < 85) {
      suggestions.push('Use more standard job title formats');
      suggestions.push('Include more relevant keywords naturally');
    }
    
    if (quality_metrics.keyword_density < 80) {
      suggestions.push('Incorporate more industry-specific terms');
    }
    
    return suggestions;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // In real implementation, check AI model availability
      return true;
    } catch {
      return false;
    }
  }
}