// User profiles and onboarding API
import type { APIRoute } from 'astro';

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
    
    // Get user profile
    const profileQuery = db.prepare(`
      SELECT 
        up.*,
        a.name as applicant_name,
        a.email,
        a.current_title,
        a.experience_years,
        a.resume_url,
        a.linkedin_url
      FROM user_profiles up
      LEFT JOIN applicant a ON up.user_id = a.id
      WHERE up.user_id = ?
    `);
    
    const profile = await profileQuery.bind(userId).first();
    
    if (!profile) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Profile not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get recent activity
    const activityQuery = db.prepare(`
      SELECT 
        ah.*,
        j.title as job_title,
        j.company
      FROM applicant_history ah
      LEFT JOIN jobs j ON ah.job_id = j.id
      WHERE ah.applicant_id = ?
      ORDER BY ah.created_at DESC
      LIMIT 10
    `);
    
    const activity = await activityQuery.bind(userId).all();
    
    // Parse JSON fields
    const profileData = {
      id: profile.id,
      user_id: profile.user_id,
      basic_info: {
        name: profile.applicant_name,
        email: profile.email,
        current_title: profile.current_title,
        experience_years: profile.experience_years,
        resume_url: profile.resume_url,
        linkedin_url: profile.linkedin_url
      },
      career_profile: {
        career_level: profile.career_level,
        industry_preferences: tryParseJSON(profile.industry_preferences, []),
        location_preferences: tryParseJSON(profile.location_preferences, []),
        salary_expectations: tryParseJSON(profile.salary_expectations, {}),
        work_type_preferences: profile.work_type_preferences,
        skills_primary: tryParseJSON(profile.skills_primary, []),
        skills_learning: tryParseJSON(profile.skills_learning, []),
        career_goals: profile.career_goals
      },
      ai_preferences: tryParseJSON(profile.ai_preferences, {
        job_discovery: { enabled: true, aggressiveness: 'moderate' },
        career_coaching: { enabled: true, frequency: 'weekly' },
        content_generation: { enabled: true, tone: 'professional' },
        market_intelligence: { enabled: true, industries: [] }
      }),
      recent_activity: activity.results?.map(item => ({
        id: item.id,
        action: item.action,
        job_title: item.job_title,
        company: item.company,
        created_at: item.created_at,
        status: item.application_status
      })) || [],
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: profileData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const profileData = await request.json();
    const { user_id, basic_info, career_profile, ai_preferences } = profileData;
    
    if (!user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const now = new Date().toISOString();
    
    // Update or create applicant record
    if (basic_info) {
      const applicantQuery = db.prepare(`
        INSERT INTO applicant (id, name, email, current_title, experience_years, resume_url, linkedin_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          current_title = excluded.current_title,
          experience_years = excluded.experience_years,
          resume_url = excluded.resume_url,
          linkedin_url = excluded.linkedin_url,
          updated_at = excluded.updated_at
      `);
      
      await applicantQuery.bind(
        user_id,
        basic_info.name || null,
        basic_info.email || null,
        basic_info.current_title || null,
        basic_info.experience_years || null,
        basic_info.resume_url || null,
        basic_info.linkedin_url || null,
        now,
        now
      ).run();
    }
    
    // Update or create user profile
    const profileQuery = db.prepare(`
      INSERT INTO user_profiles (id, user_id, career_level, industry_preferences, location_preferences, salary_expectations, work_type_preferences, skills_primary, skills_learning, career_goals, ai_preferences, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        career_level = excluded.career_level,
        industry_preferences = excluded.industry_preferences,
        location_preferences = excluded.location_preferences,
        salary_expectations = excluded.salary_expectations,
        work_type_preferences = excluded.work_type_preferences,
        skills_primary = excluded.skills_primary,
        skills_learning = excluded.skills_learning,
        career_goals = excluded.career_goals,
        ai_preferences = excluded.ai_preferences,
        updated_at = excluded.updated_at
    `);
    
    await profileQuery.bind(
      crypto.randomUUID(),
      user_id,
      career_profile?.career_level || null,
      JSON.stringify(career_profile?.industry_preferences || []),
      JSON.stringify(career_profile?.location_preferences || []),
      JSON.stringify(career_profile?.salary_expectations || {}),
      career_profile?.work_type_preferences || null,
      JSON.stringify(career_profile?.skills_primary || []),
      JSON.stringify(career_profile?.skills_learning || []),
      career_profile?.career_goals || null,
      JSON.stringify(ai_preferences || {}),
      now,
      now
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Profile updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function tryParseJSON(jsonString: string | null, fallback: any = null): any {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}