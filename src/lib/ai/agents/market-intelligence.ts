import type { 
  AgentRequest, 
  AgentResponse, 
  MarketAnalysisRequest,
  SalaryAnalysisRequest,
  CompanyIntelligenceRequest,
  SkillTrendsRequest,
  MarketIntelligenceResult,
  AgentConfig 
} from '../types';
import { BaseAgent } from '../types';

export class MarketIntelligenceAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const { type, payload } = request.payload;
      
      let result;
      switch (type) {
        case 'market_analysis':
          result = await this.analyzeMarket(payload as MarketAnalysisRequest);
          break;
        case 'salary_intelligence':
          result = await this.analyzeSalaryData(payload as SalaryAnalysisRequest);
          break;
        case 'company_intelligence':
          result = await this.analyzeCompany(payload as CompanyIntelligenceRequest);
          break;
        case 'skill_trends':
          result = await this.analyzeSkillTrends(payload as SkillTrendsRequest);
          break;
        case 'geographic_analysis':
          result = await this.analyzeGeographicMarket(payload);
          break;
        default:
          throw new Error(`Unknown market intelligence operation: ${type}`);
      }
      
      return {
        request_id: request.request_id,
        agent_name: this.config.name,
        status: 'success',
        data: result,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          model_used: this.config.model,
          confidence_score: result.confidence_score || 0.83
        }
      };
    } catch (error) {
      return {
        request_id: request.request_id,
        agent_name: this.config.name,
        status: 'error',
        error: {
          code: 'market_intelligence_error',
          message: error instanceof Error ? error.message : 'Unknown market intelligence error'
        },
        metadata: {
          execution_time_ms: Date.now() - startTime
        }
      };
    }
  }

  private async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketIntelligenceResult> {
    // Mock market analysis - would integrate with real data sources in production
    const role = request.role || 'Software Engineer';
    const location = request.location || 'United States';
    const timeframe = request.timeframe || '6 months';

    return {
      market_overview: {
        job_demand: 'high',
        growth_rate: '+12% year-over-year',
        market_size: '2.3M open positions',
        competition_level: 'moderate',
        hiring_trends: [
          'Remote work continues to be popular',
          'Emphasis on full-stack capabilities',
          'Strong demand for cloud skills',
          'AI/ML skills becoming increasingly valuable'
        ]
      },
      salary_trends: {
        current_range: '$95,000 - $180,000',
        median_salary: '$125,000',
        salary_growth: '+8% compared to last year',
        top_paying_locations: ['San Francisco', 'Seattle', 'New York', 'Austin'],
        salary_by_experience: {
          'entry_level': '$75,000 - $105,000',
          'mid_level': '$105,000 - $145,000',
          'senior_level': '$145,000 - $200,000',
          'lead_level': '$180,000 - $250,000'
        }
      },
      skill_demand: {
        most_requested: ['React', 'Node.js', 'Python', 'AWS', 'TypeScript'],
        emerging_skills: ['GraphQL', 'Kubernetes', 'Terraform', 'Machine Learning'],
        declining_skills: ['jQuery', 'Flash', 'Internet Explorer support'],
        skill_premiums: {
          'AWS': '+15% salary premium',
          'Machine Learning': '+22% salary premium',
          'Kubernetes': '+18% salary premium',
          'GraphQL': '+12% salary premium'
        }
      },
      company_rankings: [
        {
          company: 'Google',
          hiring_health: 'excellent',
          avg_salary: '$185,000',
          work_life_balance: 4.2,
          growth_opportunities: 4.5
        },
        {
          company: 'Microsoft',
          hiring_health: 'excellent',
          avg_salary: '$170,000',
          work_life_balance: 4.0,
          growth_opportunities: 4.3
        },
        {
          company: 'Amazon',
          hiring_health: 'good',
          avg_salary: '$155,000',
          work_life_balance: 3.5,
          growth_opportunities: 4.1
        }
      ],
      recommendations: [
        'Focus on cloud technologies for maximum market value',
        'Consider remote opportunities for broader market access',
        'Develop AI/ML skills for future-proofing',
        'Build full-stack capabilities for versatility'
      ],
      confidence_score: 0.85
    };
  }

  private async analyzeSalaryData(request: SalaryAnalysisRequest): Promise<MarketIntelligenceResult> {
    // Mock salary analysis
    const role = request.role || 'Software Engineer';
    const location = request.location || 'United States';
    const experienceYears = request.experience_years || 3;
    const skills = request.skills || [];

    // Calculate base salary with modifiers
    const baseSalary = this.calculateBaseSalary(role, location, experienceYears);
    const skillPremium = this.calculateSkillPremium(skills);
    const totalCompensation = baseSalary + skillPremium;

    return {
      salary_analysis: {
        base_salary_range: `$${baseSalary - 15000} - $${baseSalary + 25000}`,
        recommended_ask: `$${totalCompensation}`,
        skill_premiums: skills.map(skill => ({
          skill,
          premium_percentage: this.getSkillPremium(skill),
          premium_amount: `$${this.getSkillPremiumAmount(skill)}`
        })),
        location_adjustment: location === 'San Francisco' ? '+35%' : 
                           location === 'New York' ? '+25%' : 
                           location === 'Seattle' ? '+20%' : 'baseline',
        market_percentile: this.calculateMarketPercentile(totalCompensation),
        negotiation_range: {
          conservative: `$${totalCompensation - 10000}`,
          target: `$${totalCompensation}`,
          optimistic: `$${totalCompensation + 15000}`
        }
      },
      market_comparison: {
        vs_national_average: `+${Math.round(((totalCompensation - 95000) / 95000) * 100)}%`,
        vs_local_average: `+${Math.round(Math.random() * 20 - 10)}%`,
        vs_similar_roles: 'Above average'
      },
      confidence_score: 0.88
    };
  }

  private async analyzeCompany(request: CompanyIntelligenceRequest): Promise<MarketIntelligenceResult> {
    // Mock company analysis
    const companyName = request.company_name || 'TechCorp';

    return {
      company_intelligence: {
        company_name: companyName,
        hiring_health: 'good',
        recent_funding: '$50M Series B (6 months ago)',
        employee_growth: '+25% in last year',
        glassdoor_rating: 4.1,
        work_life_balance: 3.8,
        career_opportunities: 4.2,
        compensation_benefits: 4.0,
        culture_values: 3.9,
        recent_news: [
          'Expanded engineering team by 40%',
          'Launched new product line',
          'Opened new office in Austin',
          'Increased remote work flexibility'
        ],
        interview_process: {
          typical_rounds: 4,
          average_duration: '2-3 weeks',
          process_steps: [
            'Initial phone screen (30 min)',
            'Technical assessment (2 hours)',
            'Team interviews (1 hour each)',
            'Final interview with manager (45 min)'
          ]
        },
        salary_competitiveness: 'Above market average',
        benefits_highlights: [
          'Comprehensive health insurance',
          'Unlimited PTO',
          'Stock options',
          'Learning and development budget',
          'Flexible work arrangements'
        ]
      },
      confidence_score: 0.82
    };
  }

  private async analyzeSkillTrends(request: SkillTrendsRequest): Promise<MarketIntelligenceResult> {
    // Mock skill trends analysis
    const skills = request.skills || ['React', 'Node.js', 'Python'];
    const timeframe = request.timeframe || '12 months';

    return {
      skill_trends: {
        timeframe,
        trend_data: skills.map(skill => ({
          skill,
          current_demand: Math.floor(Math.random() * 100000) + 50000,
          demand_change: `${Math.floor(Math.random() * 40) - 20}%`,
          growth_trajectory: Math.random() > 0.5 ? 'growing' : 'stable',
          job_postings_count: Math.floor(Math.random() * 10000) + 5000,
          average_salary_premium: `$${Math.floor(Math.random() * 20000) + 5000}`,
          related_skills: this.getRelatedSkills(skill),
          industry_adoption: Math.floor(Math.random() * 30) + 70
        })),
        emerging_technologies: [
          'WebAssembly',
          'Edge Computing',
          'Quantum Computing APIs',
          'Advanced AI/ML Frameworks'
        ],
        declining_technologies: [
          'Legacy JavaScript frameworks',
          'Outdated database systems',
          'Monolithic architectures'
        ]
      },
      market_predictions: [
        'AI integration will become standard requirement',
        'Cloud-native development will dominate',
        'Remote-first companies will offer premium salaries',
        'Full-stack capabilities increasingly valued'
      ],
      confidence_score: 0.84
    };
  }

  private async analyzeGeographicMarket(payload: any): Promise<MarketIntelligenceResult> {
    // Mock geographic analysis
    return {
      geographic_analysis: {
        top_tech_hubs: [
          { city: 'San Francisco', job_count: 45000, avg_salary: '$165,000', cost_of_living_index: 185 },
          { city: 'Seattle', job_count: 32000, avg_salary: '$145,000', cost_of_living_index: 142 },
          { city: 'New York', job_count: 38000, avg_salary: '$140,000', cost_of_living_index: 168 },
          { city: 'Austin', job_count: 18000, avg_salary: '$120,000', cost_of_living_index: 108 },
          { city: 'Denver', job_count: 15000, avg_salary: '$110,000', cost_of_living_index: 115 }
        ],
        remote_opportunities: {
          percentage_remote: '68%',
          hybrid_percentage: '22%',
          in_office_percentage: '10%',
          salary_impact: 'Remote roles pay 95-105% of local rates'
        },
        relocation_recommendations: [
          'Austin offers best value for salary-to-cost ratio',
          'Seattle provides strong tech community',
          'Remote work eliminates location constraints'
        ]
      },
      confidence_score: 0.81
    };
  }

  // Helper methods
  private calculateBaseSalary(role: string, location: string, experience: number): number {
    let baseSalary = 75000 + (experience * 12000); // Base calculation
    
    // Location adjustments
    const locationMultiplier = {
      'San Francisco': 1.35,
      'New York': 1.25,
      'Seattle': 1.20,
      'Austin': 1.08,
      'Denver': 1.05
    }[location] || 1.0;
    
    return Math.round(baseSalary * locationMultiplier);
  }

  private calculateSkillPremium(skills: string[]): number {
    const premiums: Record<string, number> = {
      'React': 8000,
      'Node.js': 6000,
      'AWS': 15000,
      'Machine Learning': 22000,
      'Kubernetes': 18000,
      'GraphQL': 12000,
      'TypeScript': 5000
    };
    
    return skills.reduce((total, skill) => total + (premiums[skill] || 0), 0);
  }

  private getSkillPremium(skill: string): number {
    const premiumPercentages: Record<string, number> = {
      'AWS': 15,
      'Machine Learning': 22,
      'Kubernetes': 18,
      'GraphQL': 12,
      'TypeScript': 5,
      'React': 8,
      'Node.js': 6
    };
    
    return premiumPercentages[skill] || 0;
  }

  private getSkillPremiumAmount(skill: string): number {
    const premiumAmounts: Record<string, number> = {
      'AWS': 15000,
      'Machine Learning': 22000,
      'Kubernetes': 18000,
      'GraphQL': 12000,
      'TypeScript': 5000,
      'React': 8000,
      'Node.js': 6000
    };
    
    return premiumAmounts[skill] || 0;
  }

  private calculateMarketPercentile(salary: number): number {
    // Simple percentile calculation based on typical ranges
    if (salary < 80000) return 25;
    if (salary < 120000) return 50;
    if (salary < 160000) return 75;
    return 90;
  }

  private getRelatedSkills(skill: string): string[] {
    const relatedSkillsMap: Record<string, string[]> = {
      'React': ['JavaScript', 'TypeScript', 'Redux', 'Next.js'],
      'Node.js': ['Express.js', 'JavaScript', 'MongoDB', 'REST APIs'],
      'Python': ['Django', 'Flask', 'Data Science', 'Machine Learning'],
      'AWS': ['Docker', 'Kubernetes', 'Terraform', 'DevOps']
    };
    
    return relatedSkillsMap[skill] || [];
  }

  async healthCheck(): Promise<boolean> {
    // Mock health check - would check data source availability in production
    return true;
  }
}