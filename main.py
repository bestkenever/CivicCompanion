from agents.router_agent import classify_intent
from agents.policy_search_agent import fetch_policy_info
from agents.policy_explain_agent import explain_policy
from agents.action_connect_agent import suggest_actions

def run_system(user_input, user_profile):

    intent = classify_intent(user_input)
    print(f"INTENT: {intent}")

    if intent == "POLICY_UPDATE":
        return fetch_policy_info(user_input)

    elif intent == "POLICY_IMPACT_EXPLANATION":
        policy = fetch_policy_info(user_input)
        return explain_policy(policy, user_profile)

    elif intent == "FIND_SERVICES":
        return suggest_actions(user_input, user_profile.get("location"))

    elif intent == "SOCIAL_ACTION":
        return suggest_actions(user_input, user_profile.get("location"))

    else:
        return "I can help you with policy updates, civic information, and local engagement."
