// src/types.ts
export interface Story {
    id: string;
    title: string;
    summary: string;
    policy_id: string;
    tags: string[];
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
  