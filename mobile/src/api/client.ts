// src/api/client.ts
import { Story, ExplainPolicyResponse, TakeActionResponse } from "../types";

const API_BASE_URL =
  // process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  "https://civiccompanion-backend-eqfgdybbdsawbzcx.canadacentral-01.azurewebsites.net";

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
