from datetime import datetime
from fastapi import FastAPI, HTTPException
from typing import List
from models import (
    Story,
    StoryDetail,
    ExplainPolicyRequest,
    ExplainPolicyResponse,
    TakeActionRequest,
    TakeActionResponse,
    ChatRequest,
    ChatResponse,
    Source,
)
from azure_client import call_policy_explainer, call_story_expander
from chat_flow import run_chat

app = FastAPI(
    title="CivicCompanion API",
    description="Backend for CivicCompanion: explain policies and suggest actions.",
    version="0.1.0",
)

# Temporary in-memory data until you wire up Azure DB / AI Search
DUMMY_POLICIES = {
    "ny_good_cause_eviction": {
        "title": "Good Cause Eviction protections expand for NYC renters",
        "text": (
            "New statewide rules make it harder for landlords to evict tenants without a legitimate "
            "reason and limit extreme rent hikes in many buildings. Under Good Cause Eviction, "
            "landlords generally must point to specific 'good causes'—such as non-payment of rent or "
            "serious lease violations—before they can remove a tenant.\n\n"
            "The policy also puts guardrails on large sudden rent increases for covered units. "
            "If a landlord raises rent by more than a set threshold, that can be treated like an "
            "effective eviction and challenged in housing court.\n\n"
            "Not every building or tenant is covered, and some small landlords or newer buildings "
            "may be exempt, so it’s important for renters to check how the law applies to their "
            "specific situation."
        ),
        "tags": ["HOUSING", "NEW YORK"],
    },
    "ny_rent_stabilization_updates": {
        "title": "Changes to NYC’s rent-stabilized apartment rules",
        "text": (
            "Each year, New York City’s Rent Guidelines Board sets how much landlords can raise rent "
            "for rent-stabilized apartments. The latest decision adjusts the allowed increases for "
            "one-year and two-year leases, affecting hundreds of thousands of tenants.\n\n"
            "These changes are meant to balance rising operating costs for landlords with the need to "
            "keep housing relatively affordable and predictable for long-term renters.\n\n"
            "Tenants in rent-stabilized units should review the new percentages before signing a "
            "renewal lease and can contact a tenant advocacy group or legal aid organization if "
            "they have questions about whether their increase is allowed."
        ),
        "tags": ["HOUSING", "NEW YORK"],
    },
    "federal_student_loan_relief": {
        "title": "New student loan relief program opens for borrowers",
        "text": (
            "A new federal loan relief initiative expands the ways some borrowers can reduce their "
            "monthly payments or qualify for forgiveness over time. It particularly focuses on "
            "people in public service jobs and borrowers who have been repaying for many years.\n\n"
            "The program may recalculate payments based on income and family size, and it can give "
            "credit for certain past repayment periods that previously didn’t count toward "
            "forgiveness.\n\n"
            "Borrowers still need to apply, confirm their loan types are eligible, and watch out "
            "for scams. Official guidance is usually available on government websites ending in .gov."
        ),
        "tags": ["FINANCIAL AID", "STUDENTS"],
    },
    "state_tuition_grant_expansion": {
        "title": "Need-based tuition grants expand for low-income students",
        "text": (
            "A new state policy broadens eligibility for need-based tuition grants, which are funds "
            "students do not have to repay. More students from low- and moderate-income families "
            "may now qualify, and award amounts may be larger at some public colleges.\n\n"
            "The change is intended to reduce how much students need to borrow to cover tuition and "
            "fees, especially at community colleges and state universities.\n\n"
            "Students typically must fill out financial aid forms by a deadline and attend an "
            "approved institution to benefit. Campus financial aid offices can help students "
            "understand their updated eligibility."
        ),
        "tags": ["FINANCIAL AID", "STUDENTS"],
    },
}

DUMMY_STORIES = [
    {
        "id": "story_housing_1",
        "title": "Good Cause Eviction protections expand for NYC renters",
        "summary": (
            "New statewide rules now limit extreme rent hikes and make it harder "
            "for landlords to remove tenants without valid reasons."
        ),
        "policy_id": "ny_good_cause_eviction",
        "tags": ["HOUSING", "NEW YORK"],
        "image_url": "https://images.unsplash.com/photo-1460317442991-0ec209397118",
    },
    {
        "id": "story_housing_2",
        "title": "NYC rent-stabilized tenants face updated rent rules",
        "summary": (
            "The Rent Guidelines Board has announced new increases that impact "
            "hundreds of thousands of rent-stabilized renters across the city."
        ),
        "policy_id": "ny_rent_stabilization_updates",
        "tags": ["HOUSING", "NEW YORK"],
        "image_url": "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    },
    {
        "id": "story_housing_3",
        "title": "Brooklyn tenants pack workshop on new eviction rules",
        "summary": (
            "Tenant organizers in Brooklyn hosted a community workshop explaining who is covered "
            "by Good Cause Eviction and how renters can respond to sudden rent hikes or "
            "non-renewal notices."
        ),
        "policy_id": "ny_good_cause_eviction",
        "tags": ["HOUSING", "NEW YORK", "COMMUNITY"],
        "image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    },
    {
        "id": "story_housing_4",
        "title": "Small landlords adjust to Good Cause Eviction changes",
        "summary": (
            "Smaller property owners say they are updating their leases and record-keeping "
            "practices to comply with Good Cause Eviction requirements while still managing "
            "rising costs."
        ),
        "policy_id": "ny_good_cause_eviction",
        "tags": ["HOUSING", "NEW YORK", "LANDLORDS"],
        "image_url": "https://images.unsplash.com/photo-1494526585095-c41746248156",
    },
    {
        "id": "story_housing_5",
        "title": "Queens renters compare new rent-stabilized increases",
        "summary": (
            "Rent-stabilized tenants in Queens are reviewing this year’s approved rent increase "
            "ranges and deciding whether to sign one- or two-year renewal leases."
        ),
        "policy_id": "ny_rent_stabilization_updates",
        "tags": ["HOUSING", "NEW YORK", "RENT-STABILIZED"],
        "image_url": "https://images.unsplash.com/photo-1430285561322-7808604715df",
    },
    {
        "id": "story_college_1",
        "title": "New loan relief program offers fresh help to borrowers",
        "summary": (
            "A federal relief initiative opens new paths toward loan forgiveness "
            "for public-service workers and borrowers in long-term repayment."
        ),
        "policy_id": "federal_student_loan_relief",
        "tags": ["FINANCIAL AID", "STUDENTS"],
        "image_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
    },
    {
        "id": "story_college_2",
        "title": "Expanded tuition grants make college more affordable",
        "summary": (
            "A new policy expands need-based grants, helping low-income students "
            "cover tuition without needing additional loans."
        ),
        "policy_id": "state_tuition_grant_expansion",
        "tags": ["FINANCIAL AID", "STUDENTS"],
        "image_url": "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        "id": "story_college_3",
        "title": "First-generation students explore new state grant options",
        "summary": (
            "Advisors at a public university are hosting information sessions to help "
            "first-generation students understand whether they qualify for the expanded "
            "need-based tuition grants."
        ),
        "policy_id": "state_tuition_grant_expansion",
        "tags": ["FINANCIAL AID", "STUDENTS", "FIRST-GEN"],
        "image_url": "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b",
    },
    {
        "id": "story_college_4",
        "title": "Public-service workers share loan relief experiences",
        "summary": (
            "Nurses, teachers, and nonprofit staff are comparing notes on how the new loan "
            "relief program affects their monthly payments and long-term forgiveness timelines."
        ),
        "policy_id": "federal_student_loan_relief",
        "tags": ["FINANCIAL AID", "STUDENTS", "PUBLIC SERVICE"],
        "image_url": "https://plus.unsplash.com/premium_photo-1681248156500-629dc0e04a33?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        "id": "story_college_5",
        "title": "Community college expands outreach on financial aid changes",
        "summary": (
            "A local community college is texting and emailing current students about updates "
            "to state grants and deadlines so fewer students miss out on funding they qualify for."
        ),
        "policy_id": "state_tuition_grant_expansion",
        "tags": ["FINANCIAL AID", "STUDENTS", "COMMUNITY COLLEGE"],
        "image_url": "https://images.unsplash.com/photo-1460518451285-97b6aa326961",
    },
]


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/stories", response_model=List[Story])
async def get_stories():
    """
    Returns a list of stories (policy-related updates) for the feed.
    Later, this can query Azure Database for PostgreSQL or Azure AI Search.
    """
    return DUMMY_STORIES

@app.get("/stories/{story_id}", response_model=StoryDetail)
async def get_story_detail(story_id: str, reading_level: str = "default"):
    story = next((s for s in DUMMY_STORIES if s["id"] == story_id), None)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found.")

    summary_key = "detailed_summary_simple" if reading_level == "simple" else "detailed_summary"
    cached = story.get(summary_key)
    if cached:
        return {**story, "detailed_summary": cached}

    policy = DUMMY_POLICIES.get(story["policy_id"])
    policy_text = policy["text"] if policy else ""

    detailed_text = await call_story_expander(
        story_title=story["title"],
        story_summary=story["summary"],
        policy_text=policy_text,
        reading_level=reading_level,
    )

    story[summary_key] = detailed_text
    return {**story, "detailed_summary": detailed_text}


@app.post("/explain-policy", response_model=ExplainPolicyResponse)
async def explain_policy(req: ExplainPolicyRequest):
    """
    Given a policy_id, return:
    - what the policy is
    - what it means for the user
    - a disclaimer

    For now, it uses dummy data + a placeholder Azure OpenAI call.
    """
    policy = DUMMY_POLICIES.get(req.policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")

    explanation_text = await call_policy_explainer(
        policy_text=policy["text"],
        user_role=req.user_role,
        language=req.language,
        reading_level=req.reading_level,
    )

    # For now, just reuse the same explanation in both sections.
    # Later, you can parse the model output into structured parts.
    return ExplainPolicyResponse(
        policy_title=policy["title"],
        what_is_this=policy["text"],
        what_it_means_for_you=explanation_text,
        disclaimer=(
            "This explanation is generated by an AI system for educational "
            "purposes only and does not constitute legal or professional advice."
        ),
    )


@app.post("/take-action", response_model=TakeActionResponse)
async def take_action(req: TakeActionRequest):
    """
    Suggest constructive, neutral actions the user can take related to a policy.
    This will later use location + resources from your DB.
    """
    policy = DUMMY_POLICIES.get(req.policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")

    # TODO: later, query DB for local orgs, contacts, events based on user_location.
    actions = [
        "Learn more from your local government or university housing office website.",
        "Contact your student union or tenant advocacy group to understand your rights.",
        "Attend a public meeting or info session about housing policies, if available.",
    ]

    return TakeActionResponse(
        policy_title=policy["title"],
        actions=actions,
        disclaimer=(
            "These are general suggestions and may not apply to every situation. "
            "Always verify details with official sources."
        ),
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Unified chat endpoint that routes to different tools based on detected intent.
    """
    if not req.message:
        raise HTTPException(status_code=400, detail="Message is required.")

    chat_result = await run_chat(req.message)
    # Attach conversation id + timestamp so the client can thread messages.
    response = ChatResponse(
        intent=chat_result.intent,
        answer=chat_result.answer,
        sources=[Source(**s.dict()) if hasattr(s, "dict") else s for s in chat_result.sources],
        tools_used=chat_result.tools_used,
        conversation_id=req.conversation_id,
        timestamp=datetime.utcnow(),
    )
    return response
