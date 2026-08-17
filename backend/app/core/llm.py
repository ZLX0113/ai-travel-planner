"""LLM 客户端封装 —— 支持 OpenAI 兼容接口"""

from openai import AsyncOpenAI
from app.core.config import app_config


class LLMClient:
    """LLM 客户端单例"""

    _instance: "LLMClient | None" = None

    def __new__(cls) -> "LLMClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cfg = app_config.llm
            cls._instance.client = AsyncOpenAI(
                api_key=cfg.api_key,
                base_url=cfg.base_url,
            )
            cls._instance.model = cfg.model
            cls._instance.temperature = cfg.temperature
            cls._instance.max_tokens = cfg.max_tokens
        return cls._instance

    def get_client(self) -> AsyncOpenAI:
        return self.client

    def get_model(self) -> str:
        return self.model


def get_llm_client() -> LLMClient:
    return LLMClient()