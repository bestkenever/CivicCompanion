from services.utils import query_local_llm

def explain_policy(policy_text, user_profile):
    prompt = f"""
    You are a civic policy explanation assistant.

    Given this policy text:
    {policy_text}

    And this user profile:
    {user_profile}

    Explain the potential impacts in a neutral, educational, inclusive way. Use examples that are relevant to the user to explain. 
    Do NOT recommend who to vote for.
    """

    return query_local_llm(prompt)
