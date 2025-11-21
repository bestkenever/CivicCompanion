import requests
import json

def query_local_llm(prompt, model="qwen2:7b"):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": model, "prompt": prompt},
    )
    result = response.json()
    return result.get("response", "")
