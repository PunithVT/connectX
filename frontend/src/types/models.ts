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
  reviewed?: boolean;
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

export type ConnectionState =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "connected"
  | "self";

export interface ConnectionStatus {
  state: ConnectionState;
  connection_id?: number | null;
}

export interface ConnectionUser {
  connection_id: number;
  status: string;
  user: UserPublic;
  headline?: string | null;
  expertise_domain?: string | null;
  current_company?: string | null;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  is_read: boolean;
  created_at?: string;
}

export interface Conversation {
  peer: UserPublic;
  last_message: string;
  last_at?: string;
  unread: number;
}

export type EventKind = "webinar" | "meetup" | "ama" | "launch" | "workshop";

export interface AlumniEvent {
  id: number;
  host_id: number;
  title: string;
  description?: string | null;
  kind: EventKind;
  location?: string | null;
  meeting_url?: string | null;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  cover_emoji?: string | null;
  status: string;
  created_at?: string;
  host?: UserPublic | null;
  attendee_count: number;
  is_attending: boolean;
  spots_left?: number | null;
}

export interface SkillEndorsement {
  skill: string;
  count: number;
  endorsed_by_me: boolean;
  endorsers: UserPublic[];
}

export interface MentorReview {
  id: number;
  mentor_id: number;
  reviewer_id: number;
  rating: number;
  comment?: string | null;
  created_at?: string;
  reviewer?: UserPublic | null;
}

export interface MentorLeaderboardEntry {
  mentor_id: number;
  user: UserPublic;
  headline?: string | null;
  hourly_rate: number;
  sessions_completed: number;
  review_count: number;
  avg_rating: number;
}

export interface GroupPost {
  id: number;
  community_id: number;
  author_id: number;
  body: string;
  created_at?: string;
  author?: UserPublic | null;
}

export interface Spotlight {
  id: number;
  user_id: number;
  title: string;
  story: string;
  program_trained?: string | null;
  cover_emoji?: string | null;
  is_featured: boolean;
  likes: number;
  created_at?: string;
  user?: UserPublic | null;
}

export interface Application {
  id: number;
  opportunity_id: number;
  applicant_id: number;
  referred_by?: number | null;
  note?: string | null;
  status: string;
  created_at?: string;
  applicant?: UserPublic | null;
  referrer?: UserPublic | null;
}
