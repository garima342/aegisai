import os
from typing import Any


class LLMClient:
    def __init__(self):
        self.mode = os.environ.get("LLM_MODE", "mock")
    
    def generate_response(self, prompt: str) -> dict[str, Any]:
        if self.mode == "mock":
            return {"status": "success", "content": "This is a mock LLM response."}
        else:
            # Implement live LLM call here
            return {"status": "success", "content": "Live response placeholder."}
