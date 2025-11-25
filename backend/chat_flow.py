from dataclasses import dataclass, field
from typing import List

from models import Source
import azure_client


@dataclass
class ChatResult:
    intent: str
    answer: str
    sources: List[Source] = field(default_factory=list)
    tools_used: List[str] = field(default_factory=list)


async def handle_candidate_explanation(message: str) -> ChatResult:
    pamphlets = await azure_client.extract_pamphlet_texts()
    combined_text = "\n\n".join([text for _, text in pamphlets])
    summary = await azure_client.summarize_candidate_openai(message, combined_text)
    sources = [Source(title=title, snippet=text[:220]) for title, text in pamphlets]
    tools = ["openai"]
    if pamphlets:
        tools.insert(0, "document_intelligence")
    return ChatResult(
        intent="candidate_explanation",
        answer=summary,
        sources=sources,
        tools_used=tools,
    )


async def handle_policy_explanation(message: str) -> ChatResult:
    search_hits = await azure_client.search_policy_index(message)
    sources = [
        Source(
            title=hit.get("title") or "Policy source",
            snippet=hit.get("snippet") or "",
            url=hit.get("url"),
        )
        for hit in search_hits
    ]
    snippet_pairs = [(src.title, src.snippet) for src in sources if src.snippet]
    if not snippet_pairs:
        snippet_pairs = [("User question", message)]
    summary = await azure_client.summarize_policy_openai(message, snippet_pairs)
    tools = ["openai"]
    if search_hits:
        tools.insert(0, "search")
    return ChatResult(
        intent="policy_explanation",
        answer=summary,
        sources=sources,
        tools_used=tools,
    )


async def handle_action(message: str) -> ChatResult:
    summary = await azure_client.summarize_actions_openai(message)
    return ChatResult(intent="action", answer=summary, tools_used=["openai"])


async def handle_other(message: str) -> ChatResult:
    fallback = (
        "I’m here to explain candidates, policies, or suggest neutral actions. "
        "Try asking about a policy, a candidate’s proposals, or what steps you can take."
    )
    return ChatResult(intent="other", answer=fallback, tools_used=[])


async def run_chat(message: str) -> ChatResult:
    intent = await azure_client.detect_intent(message)
    if intent == "candidate_explanation":
        result = await handle_candidate_explanation(message)
    elif intent == "policy_explanation":
        result = await handle_policy_explanation(message)
    elif intent == "action":
        result = await handle_action(message)
    else:
        result = await handle_other(message)

    blocked, safe_answer, reason = await azure_client.run_content_safety_check(
        result.answer
    )
    if blocked:
        result.answer = safe_answer
        result.tools_used.append("content_safety_block")
    elif reason:
        result.tools_used.append(reason)

    return result
