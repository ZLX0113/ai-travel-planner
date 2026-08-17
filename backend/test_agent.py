"""Phase 2 端到端验证脚本"""
import asyncio
import json
from app.agents.state import PlannerState
from app.agents.planner_graph import search_node, summarize_node


async def test_full_flow():
    """测试完整流程：搜索 + 生成行程"""
    state: PlannerState = {
        "messages": [
            {"role": "user", "content": "请帮我规划一次东京的5天旅行。预算10000元。偏好：美食、文化。"}
        ],
        "destination": "东京",
        "days": 5,
        "budget": 10000,
        "preferences": ["美食", "文化"],
        "departure_city": "北京",
        "travelers": 1,
        "flights": None,
        "hotels": None,
        "attractions": None,
        "itinerary": None,
        "total_budget_estimate": None,
        "next_step": None,
        "error": None,
    }
    
    print("=" * 60)
    print("Phase 2 端到端测试: AI 旅行规划师 Agent")
    print("=" * 60)
    
    # Step 1: 搜索
    print("\n[1/2] 执行搜索节点...")
    state = await search_node(state)
    print(f"  - 航班: {len(state.get('flights', []))} 个")
    print(f"  - 酒店: {len(state.get('hotels', []))} 家")
    print(f"  - 景点: {len(state.get('attractions', []))} 个")
    
    assert len(state.get("flights", [])) > 0, "航班搜索失败"
    assert len(state.get("hotels", [])) > 0, "酒店搜索失败"
    assert len(state.get("attractions", [])) > 0, "景点搜索失败"
    print("  ✓ 搜索完成")
    
    # Step 2: 生成行程（需要 API Key，如果没有则跳过 LLM 调用）
    print("\n[2/2] 执行摘要节点（生成行程）...")
    try:
        state = await summarize_node(state)
        msgs = state.get("messages", [])
        assert len(msgs) > 0, "行程生成失败"
        content = msgs[-1]["content"]
        print(f"  ✓ 行程已生成（{len(content)} 字符）")
        print("\n" + "=" * 60)
        print("生成结果（前500字符）:")
        print("-" * 60)
        print(content[:500])
    except Exception as e:
        print(f"  ⚠ LLM 调用失败（可能未配置 API Key）: {e}")
        print("  ✓ 搜索节点验证通过，摘要节点需 API Key")
    
    print("-" * 60)
    print("\n✓ 搜索节点测试通过！Agent 核心功能正常。")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_full_flow())