from pydantic import BaseModel
from typing import List, Optional


class Story(BaseModel):
    id: str
    title: str
    summary: str
    policy_id: str
    tags: List[str]


class ExplainPolicyRequest(BaseModel):
    policy_id: str
    user_role: Optional[str] = "general"
    language: Optional[str] = "en"
    reading_level: Optional[str] = "default"  # e.g. "simple", "default"


class ExplainPolicyResponse(BaseModel):
    policy_title: str
    what_is_this: str
    what_it_means_for_you: str
    disclaimer: str


class TakeActionRequest(BaseModel):
    policy_id: str
    user_location: Optional[str] = None
    user_role: Optional[str] = "general"


class TakeActionResponse(BaseModel):
    policy_title: str
    actions: List[str]
    disclaimer: str
