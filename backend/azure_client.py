import os
from typing import List, Dict
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

BASE_SYSTEM_PROMPT = """
You are CivicCompanion, an assistant that explains public policies in neutral, 
plain language. You avoid political advocacy and focus on helping people understand
what a policy does and what it might mean for them.
"""

client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version="2024-02-15-preview",
)


def _run_completion(messages: List[Dict[str, str]], temperature: float = 0.4, max_tokens: int = 400) -> str:
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
