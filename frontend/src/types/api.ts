// Request payload types shared across api clients.

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface InviteAcceptPayload {
  token: string;
  password: string;
  full_name: string;
  current_company?: string;
  current_title?: string;
  expertise_domain?: string;
  skills?: string;
  location?: string;
  linkedin_url?: string;
  open_to_mentoring?: boolean;
  open_to_opportunities?: boolean;
  interested_in_startupvarsity?: boolean;
}

export interface CreatePostPayload {
  body: string;
  post_type: string;
}

export interface CreateOpportunityPayload {
  kind: "hiring" | "seeking";
  title: string;
  description?: string;
  expertise_domain?: string;
  location?: string;
  company?: string;
}

export interface BecomeMentorPayload {
  programs?: string;
  headline?: string;
  bio?: string;
  hourly_rate: number;
}

export interface BookSessionPayload {
  mentor_id: number;
  program?: string;
  scheduled_at: string;
  duration_minutes: number;
}

export interface StartupApplyPayload {
  name: string;
  pitch?: string;
  stage: string;
  resources_requested?: string;
}
