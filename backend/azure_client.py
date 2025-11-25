import asyncio
import os
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv
from openai import AzureOpenAI

# Azure SDKs
from azure.core.credentials import AzureKeyCredential
from azure.ai.textanalytics import TextAnalyticsClient, SingleLabelClassifyAction
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.search.documents import SearchClient
from azure.search.documents.models import QueryType
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions, TextCategory

load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

AZURE_LANGUAGE_ENDPOINT = os.getenv("AZURE_LANGUAGE_ENDPOINT")
AZURE_LANGUAGE_KEY = os.getenv("AZURE_LANGUAGE_KEY")
# Optional: custom single-label classification project + deployment
AZURE_LANGUAGE_INTENT_PROJECT = os.getenv("AZURE_LANGUAGE_INTENT_PROJECT")
AZURE_LANGUAGE_INTENT_DEPLOYMENT = os.getenv("AZURE_LANGUAGE_INTENT_DEPLOYMENT")

AZURE_DOCINTEL_ENDPOINT = os.getenv("AZURE_DOCINTEL_ENDPOINT")
AZURE_DOCINTEL_KEY = os.getenv("AZURE_DOCINTEL_KEY")
DOCINTEL_PAMPHLET_DIR = os.getenv(
    "DOCINTEL_PAMPHLET_DIR", os.path.join(os.path.dirname(__file__), "sample_docs")
)

AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
AZURE_SEARCH_POLICY_INDEX = os.getenv("AZURE_SEARCH_POLICY_INDEX")

AZURE_CONTENT_SAFETY_ENDPOINT = os.getenv("AZURE_CONTENT_SAFETY_ENDPOINT")
AZURE_CONTENT_SAFETY_KEY = os.getenv("AZURE_CONTENT_SAFETY_KEY")

BASE_SYSTEM_PROMPT = """
You are CivicCompanion, an assistant that explains public policies in neutral,
plain language. You avoid political advocacy and focus on helping people understand
what a policy does and what it might mean for them.
"""

_openai_client: Optional[AzureOpenAI] = None


def _get_openai_client() -> Optional[AzureOpenAI]:
    global _openai_client
    if _openai_client is not None:
        return _openai_client
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_API_KEY or not AZURE_OPENAI_DEPLOYMENT:
        return None
    _openai_client = AzureOpenAI(
        api_key=AZURE_OPENAI_API_KEY,
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_version="2024-02-15-preview",
    )
    return _openai_client


def _run_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.4,
    max_tokens: int = 400,
    fallback: str = "Azure OpenAI is not configured yet.",
) -> str:
    client = _get_openai_client()
    if not client or not AZURE_OPENAI_DEPLOYMENT:
        return fallback

    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


async def call_policy_explainer(
    policy_text: str,
    user_role: str | None = None,
    language: str = "en",
    reading_level: str = "default",
) -> str:
    role_blurb = f"The person asking is a {user_role}." if user_role else ""
    reading_hint = (
        "Write at a simplified reading level suitable for middle school students."
        if reading_level == "simple"
        else "Write at a general reading level suitable for adults."
    )

    user_prompt = f"""
{role_blurb}
{reading_hint}

Here is the policy text to explain:
\"\"\"{policy_text}\"\"\"

Provide a clear, neutral explanation in {language}. Use 2–3 short paragraphs that cover:
- What the policy does
- Who it mainly affects
- What might change for the reader
"""

    return _run_completion(
        [
            {"role": "system", "content": BASE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
    )


async def call_story_expander(
    story_title: str,
    story_summary: str,
    policy_text: str,
    reading_level: str = "default",
) -> str:
    reading_hint = (
        "Rephrase using simple words and short sentences so that a middle-school reader can understand."
        if reading_level == "simple"
        else "Write in concise, professional language for a general adult audience."
    )

    user_prompt = f"""
Write a 3-paragraph, neutral story for the CivicCompanion app. Do not include any title or header 
just go straight into the story

Story title: {story_title}

Short summary:
{story_summary}

Policy context (for reference only):
{policy_text}

Requirements:
- Stay factual and accessible; avoid legal or political advice.
- Mention why the story matters for everyday people or students.
- Include any helpful context about what readers could look out for next.
 - {reading_hint}
"""

    return _run_completion(
        [
            {"role": "system", "content": BASE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=500,
    )


async def detect_intent(message: str) -> str:
    """
    Try Azure Language Service single-label classification.
    Falls back to lightweight keyword heuristics if Language Service
    is not configured or the call fails.
    """
    if AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY:
        try:
            credential = AzureKeyCredential(AZURE_LANGUAGE_KEY)
            lang_client = TextAnalyticsClient(
                endpoint=AZURE_LANGUAGE_ENDPOINT, credential=credential
            )

            if AZURE_LANGUAGE_INTENT_PROJECT and AZURE_LANGUAGE_INTENT_DEPLOYMENT:
                # TODO: ensure the custom classification project + deployment exist in Azure AI Language.
                poller = await asyncio.to_thread(
                    lang_client.begin_analyze_actions,
                    [message],
                    actions=[
                        SingleLabelClassifyAction(
                            project_name=AZURE_LANGUAGE_INTENT_PROJECT,
                            deployment_name=AZURE_LANGUAGE_INTENT_DEPLOYMENT,
                        )
                    ],
                )
                results = await asyncio.to_thread(lambda: list(poller.result()))
                for doc in results:
                    for action_result in doc:
                        if getattr(action_result, "is_error", False):
                            continue
                        for doc_result in getattr(action_result, "documents_results", []):
                            classification = getattr(doc_result, "classification", None)
                            if classification and getattr(classification, "category", None):
                                return classification.category
            else:
                # Use key phrases as a light-weight Language Service signal.
                phrase_result = lang_client.extract_key_phrases([message])
                phrases: List[str] = []
                for doc in phrase_result:
                    if not doc.is_error:
                        phrases.extend(doc.key_phrases)
                inferred = _heuristic_intent(message, phrases)
                return inferred
        except Exception:
            # Silent fallback to heuristics if Language Service is unavailable.
            pass

    return _heuristic_intent(message, [])


def _heuristic_intent(message: str, phrases: List[str]) -> str:
    blob = f"{message.lower()} {' '.join(phrases).lower()}"

    candidate_keywords = [
        "candidate",
        "campaign",
        "running",
        "vote for",
        "ballot",
        "who is",
        "what is",
        "about",
        "mayor",
        "council",
        "senator",
        "representative",
        "governor",
    ]
    policy_keywords = [
        "policy",
        "law",
        "bill",
        "rule",
        "regulation",
        "impact",
        "housing",
        "rent",
        "eviction",
        "tuition",
        "loan",
        "crisis",
    ]
    action_keywords = ["how do i", "what should i do", "next steps", "help me", "action", "plan"]

    if any(word in blob for word in candidate_keywords):
        return "candidate_explanation"
    if any(word in blob for word in policy_keywords):
        return "policy_explanation"
    if any(word in blob for word in action_keywords):
        return "action"
    # Default to policy to keep responses helpful rather than returning "other".
    return "policy_explanation"


async def summarize_candidate_openai(message: str, context: str) -> str:
    user_prompt = f"""
You need to explain a political candidate and their proposals based on pamphlet text.
User question: {message}

Pamphlet excerpts:
\"\"\"{context}\"\"\"

Write a concise, neutral explanation covering:
- Who the candidate is and key roles or experience
- The top 2-3 proposals they highlight
- How those proposals might affect everyday people
Avoid advocacy; use clear, plain language.
"""
    return _run_completion(
        [
            {"role": "system", "content": BASE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=500,
    )


async def summarize_policy_openai(message: str, snippets: List[Tuple[str, str]]) -> str:
    formatted_snippets = "\n\n".join(
        [f"Source {idx+1} - {title}:\n{snippet}" for idx, (title, snippet) in enumerate(snippets)]
    )
    user_prompt = f"""
User policy question: {message}

Relevant material:
{formatted_snippets}

Write a neutral, plain-language explanation of the policy and likely impact. Mention any uncertainty if sources conflict.
"""
    return _run_completion(
        [
            {"role": "system", "content": BASE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=500,
    )


async def summarize_actions_openai(message: str) -> str:
    user_prompt = f"""
The user is asking for next steps or general guidance.
User message: {message}

Suggest 3–5 constructive, neutral actions. Keep each action to one short sentence and avoid political persuasion.
"""
    return _run_completion(
        [
            {"role": "system", "content": BASE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=300,
    )


async def extract_pamphlet_texts() -> List[Tuple[str, str]]:
    """
    Try to read candidate pamphlet PDFs with Azure Document Intelligence.
    Falls back to a placeholder snippet if the service or files are not ready.
    """
    documents: List[Tuple[str, str]] = []
    docintel_ready = AZURE_DOCINTEL_ENDPOINT and AZURE_DOCINTEL_KEY
    if docintel_ready and os.path.isdir(DOCINTEL_PAMPHLET_DIR):
        credential = AzureKeyCredential(AZURE_DOCINTEL_KEY)
        client = DocumentAnalysisClient(
            endpoint=AZURE_DOCINTEL_ENDPOINT, credential=credential
        )
        for filename in os.listdir(DOCINTEL_PAMPHLET_DIR):
            if not filename.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
                continue
            path = os.path.join(DOCINTEL_PAMPHLET_DIR, filename)
            try:
                with open(path, "rb") as f:
                    poller = await asyncio.to_thread(
                        client.begin_analyze_document, "prebuilt-read", f
                    )
                    result = await asyncio.to_thread(poller.result)
                    content = result.content if hasattr(result, "content") else ""
                    if content:
                        documents.append((filename, content[:2000]))
            except Exception:
                # Continue to the next file if parsing fails.
                continue

    if not documents:
        placeholder = (
            "Candidate A emphasizes affordable housing, job training programs, "
            "and transparency in city budgeting. Their pamphlet highlights working with "
            "local nonprofits, expanding rental assistance, and creating youth apprenticeship pathways."
        )
        documents.append(("sample_pamphlet", placeholder))

    return documents


async def search_policy_index(query: str, top_k: int = 3) -> List[Dict[str, str]]:
    """
    Search Azure AI Search for policy content. Requires:
    - AZURE_SEARCH_ENDPOINT
    - AZURE_SEARCH_KEY
    - AZURE_SEARCH_POLICY_INDEX
    Optionally configure semantic settings on the index for better snippets.
    """
    if not (AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_KEY and AZURE_SEARCH_POLICY_INDEX):
        return []

    credential = AzureKeyCredential(AZURE_SEARCH_KEY)
    client = SearchClient(
        endpoint=AZURE_SEARCH_ENDPOINT,
        index_name=AZURE_SEARCH_POLICY_INDEX,
        credential=credential,
    )
    results: List[Dict[str, str]] = []
    try:
        def _search():
            semantic_config = os.getenv("AZURE_SEARCH_POLICY_SEMANTIC_CONFIG")
            kwargs = {"search_text": query, "top": top_k}
            if semantic_config:
                kwargs.update(
                    {
                        "query_type": QueryType.SEMANTIC,
                        "semantic_configuration_name": semantic_config,
                        "query_caption": "extractive|highlight",
                    }
                )
            return list(client.search(**kwargs))

        search_results = await asyncio.to_thread(_search)
        for item in search_results:
            captions = []
            item_dict = dict(item)
            if "captions" in item_dict and item_dict["captions"]:
                captions = [
                    c.text if hasattr(c, "text") else str(c)
                    for c in item_dict.get("captions", [])
                ]
            results.append(
                {
                    "title": item_dict.get("title") or getattr(item, "title", ""),
                    "snippet": (" ".join(captions) or item_dict.get("content", ""))[:400],
                    "url": item_dict.get("url"),
                }
            )
    except Exception:
        return []

    return results


async def run_content_safety_check(answer: str) -> Tuple[bool, str, Optional[str]]:
    """
    Returns (is_blocked, safe_text, reason)
    """
    if not (AZURE_CONTENT_SAFETY_ENDPOINT and AZURE_CONTENT_SAFETY_KEY):
        return False, answer, None

    credential = AzureKeyCredential(AZURE_CONTENT_SAFETY_KEY)
    client = ContentSafetyClient(
        endpoint=AZURE_CONTENT_SAFETY_ENDPOINT, credential=credential
    )

    try:
        request = AnalyzeTextOptions(
            text=answer,
            categories=[
                TextCategory.HATE,
                TextCategory.SELF_HARM,
                TextCategory.SEXUAL,
                TextCategory.VIOLENCE,
            ],
        )
        response = await asyncio.to_thread(client.analyze_text, request)
        max_severity = max(
            (c.severity for c in response.categories_analysis), default=0
        )
        if max_severity >= 2:
            return True, (
                "I can’t share that answer because it may violate our safety policies. "
                "Please rephrase your question."
            ), "content_safety_blocked"
    except Exception:
        # If content safety fails, allow the answer to continue rather than blocking silently.
        return False, answer, None

    return False, answer, None
