// Domain models — mirror the backend Pydantic *Out schemas.

export interface UserPublic {
  id: number;
  full_name: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "alumnus" | "admin";
  is_active: boolean;
  created_at?: string;
}

export interface AlumniProfile {
  id: number;
  user_id: number;
  program_trained?: string | null;
  batch_year?: number | null;
  current_company?: string | null;
  current_title?: string | null;
  expertise_domain?: string | null;
  skills?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  open_to_mentoring: boolean;
  open_to_opportunities: boolean;
  interested_in_startupvarsity: boolean;
  headline?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  user?: UserPublic | null;
}

export interface Comment {
  id: number;
  post_id: number;
  body: string;
  created_at?: string;
  author?: UserPublic | null;
}

export type PostType = "update" | "doing" | "looking";

export interface Post {
  id: number;
  body: string;
  post_type: PostType;
  likes: number;
  created_at?: string;
  author?: UserPublic | null;
  comments: Comment[];
}

export type OpportunityKind = "hiring" | "seeking";

export interface Opportunity {
  id: number;
  kind: OpportunityKind;
  title: string;
  description?: string | null;
  expertise_domain?: string | null;
  location?: string | null;
  company?: string | null;
  status: string;
  created_at?: string;
  author?: UserPublic | null;
}

export interface MentorProfile {
  id: number;
  user_id: number;
  programs?: string | null;
  headline?: string | null;
  bio?: string | null;
  hourly_rate: number;
  is_active: boolean;
  user?: UserPublic | null;
}

export interface MentorshipSession {
  id: number;
  mentor_id: number;
  mentee_id: number;
  program?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  amount: number;
  status: string;
  payment_status: string;
  created_at?: string;
}

export interface StartupProject {
  id: number;
  name: string;
  pitch?: string | null;
  stage: string;
  resources_requested?: string | null;
  status: string;
  created_at?: string;
  owner?: UserPublic | null;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  member_count: number;
}

export interface AppNotification {
  id: number;
  type: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at?: string;
}

export interface Invite {
  id: number;
  email: string;
  full_name?: string | null;
  program_trained?: string | null;
  batch_year?: number | null;
  status: string;
  created_at?: string;
  expires_at?: string;
}

export interface InvitePreview {
  email: string;
  full_name?: string | null;
  program_trained?: string | null;
  status: string;
}
