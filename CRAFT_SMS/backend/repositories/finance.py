"""
repositories/finance.py

Repository for managing financial slips via the configured DatabaseProvider.
"""
from typing import Optional, Dict, Any, List
from repositories.base import DatabaseProvider


class FinanceRepository:
    def __init__(self, provider: DatabaseProvider):
        self.provider = provider

    async def create_slip(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new payment slip."""
        return await self.provider.insert("slips", data)

    async def get_slip(self, slip_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a slip by ID."""
        return await self.provider.fetch_one("slips", {"id": slip_id})

    async def update_slip(self, slip_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Update a slip."""
        return await self.provider.update("slips", {"id": slip_id}, data)
        
    async def list_slips(self, school_id: str, student_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List slips with optional filtering."""
        filters = {"school_id": school_id}
        if student_id:
            filters["student_id"] = student_id
        if status:
            filters["status"] = status
            
        return await self.provider.fetch_many("slips", filters, columns="*, profiles!student_id(full_name, custom_id)")

