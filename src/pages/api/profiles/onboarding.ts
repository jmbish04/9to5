// Onboarding flow API
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const body = await request.json();
    const { user_id, step, data } = body;
    
    if (!user_id || !step) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id and step are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const now = new Date().toISOString();
    
    switch (step) {
      case 'basic_info':
        await handleBasicInfoStep(db, user_id, data, now);
        break;
      case 'career_preferences':
        await handleCareerPreferencesStep(db, user_id, data, now);
        break;
      case 'skills_assessment':
        await handleSkillsAssessmentStep(db, user_id, data, now);
        break;
      case 'ai_preferences':
        await handleAIPreferencesStep(db, user_id, data, now);
        break;
      case 'complete':
        await handleOnboardingComplete(db, user_id, now);
        break;
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid onboarding step'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const nextStep = getNextStep(step);
    
    return new Response(JSON.stringify({
      success: true,
      message: `${step} completed successfully`,
      next_step: nextStep,
      onboarding_complete: step === 'complete'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Onboarding error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id parameter is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check onboarding status
    const profileQuery = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?');
    const applicantQuery = db.prepare('SELECT * FROM applicant WHERE id = ?');
    
    const [profile, applicant] = await Promise.all([
      profileQuery.bind(userId).first(),
      applicantQuery.bind(userId).first()
    ]);
    
    const onboardingStatus = {
      basic_info: !!applicant,
      career_preferences: !!(profile && profile.career_level),
      skills_assessment: !!(profile && profile.skills_primary),
      ai_preferences: !!(profile && profile.ai_preferences),
      complete: !!(profile && applicant && profile.career_level && profile.skills_primary && profile.ai_preferences)
    };
    
    const currentStep = getCurrentStep(onboardingStatus);
    const progress = calculateProgress(onboardingStatus);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        user_id: userId,
        onboarding_status: onboardingStatus,
        current_step: currentStep,
        progress_percentage: progress,
        is_complete: onboardingStatus.complete
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Onboarding status error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function handleBasicInfoStep(db: any, userId: string, data: any, now: string) {
  const query = db.prepare(`
    INSERT INTO applicant (id, name, email, current_title, experience_years, linkedin_url, github_url, portfolio_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      current_title = excluded.current_title,
      experience_years = excluded.experience_years,
      linkedin_url = excluded.linkedin_url,
      github_url = excluded.github_url,
      portfolio_url = excluded.portfolio_url,
      updated_at = excluded.updated_at
  `);
  
  await query.bind(
    userId,
    data.name || null,
    data.email || null,
    data.current_title || null,
    data.experience_years || null,
    data.linkedin_url || null,
    data.github_url || null,
    data.portfolio_url || null,
    now,
    now
  ).run();
}

async function handleCareerPreferencesStep(db: any, userId: string, data: any, now: string) {
  const query = db.prepare(`
    INSERT INTO user_profiles (id, user_id, career_level, industry_preferences, location_preferences, salary_expectations, work_type_preferences, career_goals, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      career_level = excluded.career_level,
      industry_preferences = excluded.industry_preferences,
      location_preferences = excluded.location_preferences,
      salary_expectations = excluded.salary_expectations,
      work_type_preferences = excluded.work_type_preferences,
      career_goals = excluded.career_goals,
      updated_at = excluded.updated_at
  `);
  
  await query.bind(
    crypto.randomUUID(),
    userId,
    data.career_level || null,
    JSON.stringify(data.industry_preferences || []),
    JSON.stringify(data.location_preferences || []),
    JSON.stringify(data.salary_expectations || {}),
    data.work_type_preferences || null,
    data.career_goals || null,
    now,
    now
  ).run();
}

async function handleSkillsAssessmentStep(db: any, userId: string, data: any, now: string) {
  const query = db.prepare(`
    UPDATE user_profiles 
    SET 
      skills_primary = ?,
      skills_learning = ?,
      updated_at = ?
    WHERE user_id = ?
  `);
  
  await query.bind(
    JSON.stringify(data.skills_primary || []),
    JSON.stringify(data.skills_learning || []),
    now,
    userId
  ).run();
}

async function handleAIPreferencesStep(db: any, userId: string, data: any, now: string) {
  const query = db.prepare(`
    UPDATE user_profiles 
    SET 
      ai_preferences = ?,
      updated_at = ?
    WHERE user_id = ?
  `);
  
  await query.bind(
    JSON.stringify(data.ai_preferences || {}),
    now,
    userId
  ).run();
}

async function handleOnboardingComplete(db: any, userId: string, now: string) {
  // Record onboarding completion in agent interactions
  const query = db.prepare(`
    INSERT INTO agent_interactions (id, user_id, agent_type, request_type, query, response_summary, created_at)
    VALUES (?, ?, 'onboarding', 'complete', 'User completed onboarding flow', 'Onboarding successfully completed', ?)
  `);
  
  await query.bind(crypto.randomUUID(), userId, now).run();
}

function getNextStep(currentStep: string): string | null {
  const steps = ['basic_info', 'career_preferences', 'skills_assessment', 'ai_preferences', 'complete'];
  const currentIndex = steps.indexOf(currentStep);
  return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
}

function getCurrentStep(status: any): string {
  if (!status.basic_info) return 'basic_info';
  if (!status.career_preferences) return 'career_preferences';
  if (!status.skills_assessment) return 'skills_assessment';
  if (!status.ai_preferences) return 'ai_preferences';
  if (!status.complete) return 'complete';
  return 'complete';
}

function calculateProgress(status: any): number {
  const steps = ['basic_info', 'career_preferences', 'skills_assessment', 'ai_preferences', 'complete'];
  const completed = steps.filter(step => status[step]).length;
  return Math.round((completed / steps.length) * 100);
}