
import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version="2024-12-01-preview"
)

SYSTEM_PROMPT = """
You are an intent classification agent for a civic engagement platform.

Your job:
Classify the user's message into ONE of these intents:

1. candidate_info
   Asking about candidate positions, beliefs, proposals, election info.

2. policy_explanation
   Asking what a policy, proposal, or ballot item means, and how this policy 
   affects people, groups, or the user personally.

3. local_info_search
   Asking about reporting issues, finding government offices, services, legal aid.

4. social_action
   Asking how to find supporters, join others, organize discussions, or community action.

5. profile_update
   When the user gives information about themselves or wants personalization.

6. chit_chat
   Greetings, small talk, or unrelated conversation.

Return ONLY the label name.
"""

async def classify_intent(text: str) -> str:
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ],
        max_tokens=10,
        temperature=0,
        model=os.getenv("DEPLOYMENT_NAME")
    )
    
    intent = response.choices[0].message.content.strip()
    return intent
