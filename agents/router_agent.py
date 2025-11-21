from services.utils import query_local_llm

def classify_intent(user_input):
    prompt = f"""
    You are an intent classification agent for civic engagement.

    Categorize the following message into one of:
    - POLICY_UPDATE
    - POLICY_IMPACT_EXPLANATION
    - FIND_SERVICES
    - SOCIAL_ACTION
    - GENERAL_QUESTION

    Message: {user_input}

    Return ONLY the category name.
    """

    result = query_local_llm(prompt)
    return result.strip().upper()
