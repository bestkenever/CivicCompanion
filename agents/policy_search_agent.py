from services.azure_search import search_documents

def fetch_policy_info(query):
    results = search_documents(query)
    return results
