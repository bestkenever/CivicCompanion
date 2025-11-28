// src/api/client.ts
import {
  Story,
  StoryDetail,
  ExplainPolicyResponse,
  TakeActionResponse,
  ChatResponse,
  ShortVideo,
} from "../types";

export const API_BASE_URL =
  // process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  "https://civiccompanion-backend-eqfgdybbdsawbzcx.canadacentral-01.azurewebsites.net";
  //"http://192.168.1.27:8000"

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchStories(): Promise<Story[]> {
  const res = await fetch(`${API_BASE_URL}/stories`);
  return handleResponse<Story[]>(res);
}

export async function fetchStoryDetail(
  storyId: string,
  opts?: { reading_level?: string }
): Promise<StoryDetail> {
  const query = opts?.reading_level
    ? `?reading_level=${encodeURIComponent(opts.reading_level)}`
    : "";
  const res = await fetch(`${API_BASE_URL}/stories/${storyId}${query}`);
  return handleResponse<StoryDetail>(res);
}

export async function explainPolicy(params: {
  policy_id: string;
  user_role?: string;
  language?: string;
}): Promise<ExplainPolicyResponse> {
  const res = await fetch(`${API_BASE_URL}/explain-policy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      policy_id: params.policy_id,
      user_role: params.user_role ?? "general",
      language: params.language ?? "en",
    }),
  });
  return handleResponse<ExplainPolicyResponse>(res);
}

export async function takeAction(params: {
  policy_id: string;
  user_location?: string | null;
  user_role?: string;
}): Promise<TakeActionResponse> {
  const res = await fetch(`${API_BASE_URL}/take-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      policy_id: params.policy_id,
      user_location: params.user_location ?? null,
      user_role: params.user_role ?? "general",
    }),
  });
  return handleResponse<TakeActionResponse>(res);
}

export async function sendChat(params: {
  message: string;
  conversation_id?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      conversation_id: params.conversation_id ?? null,
      metadata: params.metadata ?? {},
    }),
  });
  return handleResponse<ChatResponse>(res);
}

export async function fetchShorts(): Promise<ShortVideo[]> {
  const res = await fetch(`${API_BASE_URL}/shorts`);
  return handleResponse<ShortVideo[]>(res);
}
