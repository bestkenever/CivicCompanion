from services.utils import query_local_llm

def suggest_actions(topic, location):
    prompt = f"""
    Suggest civic engagement options for:
    Topic: {topic}
    Location: {location}

    Include:
    - where to get official help
    - local organizations
    - community groups
    - safe ways to participate

    DO NOT instruct illegal activities.
    """

    return query_local_llm(prompt)
