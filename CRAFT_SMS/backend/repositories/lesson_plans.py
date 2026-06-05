"""
repositories/lesson_plans.py

Repository for managing lesson plans via the configured DatabaseProvider.
"""
from typing import Optional, Dict, Any, List
from repositories.base import DatabaseProvider


class LessonPlanRepository:
    def __init__(self, provider: DatabaseProvider):
        self.provider = provider

    async def create_lesson_plan(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new lesson plan."""
        return await self.provider.insert("lesson_plans", data)

    async def get_lesson_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a lesson plan by ID."""
        return await self.provider.fetch_one("lesson_plans", {"id": plan_id})

    async def list_lesson_plans(self, status: Optional[str] = None, tenant_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List lesson plans with optional filtering."""
        filters = {}
        if status:
            filters["status"] = status
        if tenant_id:
            filters["tenant_id"] = tenant_id
            
        return await self.provider.fetch_many("lesson_plans", filters, order_by="created_at", descending=True)

    async def update_lesson_plan(self, plan_id: str, data: Dict[str, Any]) -> None:
        """Update a lesson plan."""
        await self.provider.update("lesson_plans", {"id": plan_id}, data)

    async def create_comment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a comment on a lesson plan."""
        return await self.provider.insert("lesson_plan_comments", data)

