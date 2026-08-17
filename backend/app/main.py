"""AI 旅行规划师 — FastAPI 入口"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import app_config
from app.routers import chat
from app.routers import trip
from app.routers import search

app = FastAPI(
    title="AI 旅行规划师",
    description="基于 LLM 的智能旅行规划助手",
    version="0.1.0",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat.router)
app.include_router(trip.router)
app.include_router(search.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "AI 旅行规划师"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=app_config.host,
        port=app_config.port,
        reload=True,
    )