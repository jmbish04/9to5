-- Sample data for testing agents, tasks, and workflows

-- Insert sample agents
INSERT INTO agents (id, name, role, goal, backstory, llm, system_prompt, max_tokens, temperature, enabled, created_at, updated_at) VALUES
('agent-1', 'Job Discovery Agent', 'Senior AI Researcher', 'Find and analyze job opportunities that match user preferences', 'You are an experienced AI agent specializing in job market analysis and candidate matching. You have access to extensive job databases and can identify optimal opportunities.', 'gpt-4', 'You are a helpful AI assistant focused on job discovery and matching.', 4000, 0.7, 1, datetime('now'), datetime('now')),
('agent-2', 'Career Coach Agent', 'Professional Career Advisor', 'Provide personalized career guidance and skill development recommendations', 'You are a seasoned career coach with 15+ years of experience helping professionals advance their careers. You understand market trends and skill gaps.', 'gpt-4', 'You are a professional career coach providing actionable advice.', 4000, 0.7, 1, datetime('now'), datetime('now')),
('agent-3', 'Content Generation Agent', 'Technical Writer', 'Create compelling application materials including resumes and cover letters', 'You are an expert technical writer who specializes in creating professional application materials. You understand ATS systems and hiring manager preferences.', 'gpt-3.5-turbo', 'You are a professional writer creating compelling application materials.', 3000, 0.6, 1, datetime('now'), datetime('now'));

-- Insert sample tasks
INSERT INTO tasks (id, name, description, expected_output, agent_id, context_tasks, output_schema, enabled, created_at, updated_at) VALUES
('task-1', 'Analyze Job Requirements', 'Analyze job posting requirements and extract key skills, qualifications, and preferences', 'A structured analysis of job requirements including required skills, preferred qualifications, company culture indicators, and salary range', 'agent-1', NULL, NULL, 1, datetime('now'), datetime('now')),
('task-2', 'Assess Candidate Fit', 'Compare candidate profile against job requirements to determine compatibility', 'A compatibility score (0-100) with detailed breakdown of strengths, gaps, and recommendations', 'agent-2', '["task-1"]', NULL, 1, datetime('now'), datetime('now')),
('task-3', 'Generate Cover Letter', 'Create a personalized cover letter based on job analysis and candidate profile', 'A professionally written cover letter tailored to the specific job and highlighting relevant experience', 'agent-3', '["task-1", "task-2"]', NULL, 1, datetime('now'), datetime('now')),
('task-4', 'Optimize Resume', 'Optimize candidate resume for ATS compatibility and job relevance', 'An ATS-optimized resume with improved keyword density and relevant experience highlighted', 'agent-3', '["task-1"]', NULL, 1, datetime('now'), datetime('now'));

-- Insert sample workflows
INSERT INTO workflows (id, name, description, task_sequence, enabled, created_at, updated_at) VALUES
('workflow-1', 'Job Application Assistant', 'Complete workflow for analyzing a job and preparing application materials', '["task-1", "task-2", "task-3", "task-4"]', 1, datetime('now'), datetime('now')),
('workflow-2', 'Quick Job Analysis', 'Fast analysis of job requirements and candidate fit', '["task-1", "task-2"]', 1, datetime('now'), datetime('now')),
('workflow-3', 'Content Creation Only', 'Generate application materials without analysis', '["task-3", "task-4"]', 1, datetime('now'), datetime('now'));