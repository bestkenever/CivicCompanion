// src/types.ts
export interface Story {
  id: string;
  title: string;
  summary: string;
  policy_id: string;
  tags: string[];
  image_url?: string;
}
 
export interface StoryDetail extends Story {
  detailed_summary: string;
}

export interface ExplainPolicyResponse {
  policy_title: string;
  what_it_is: string;
  what_it_means_for_you: string;
  disclaimer: string;
}

export interface TakeActionResponse {
  policy_title: string;
  actions: string[];
  disclaimer: string;
}

export interface ShortVideo {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
}

export interface Source {
  title: string;
  snippet: string;
  url?: string;
}

export interface ChatResponse {
  intent: string;
  answer: string;
  sources: Source[];
  tools_used: string[];
  conversation_id?: string | null;
  timestamp?: string;
}
