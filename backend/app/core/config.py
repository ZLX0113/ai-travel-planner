"""应用配置管理"""

import os
from dataclasses import dataclass, field


@dataclass
class LLMConfig:
    """LLM 配置"""
    provider: str = os.getenv("LLM_PROVIDER", "openai")  # openai / azure / local
    model: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    api_key: str = os.getenv("OPENAI_API_KEY", "")
    base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    temperature: float = 0.7
    max_tokens: int = 4096


@dataclass
class AppConfig:
    """应用全局配置"""
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: list[str] = field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])
    llm: LLMConfig = field(default_factory=LLMConfig)


app_config = AppConfig()