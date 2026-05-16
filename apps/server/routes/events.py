from fastapi import APIRouter, Request, HTTPException
from core.db import supabase_admin

router = APIRouter()

@router.get("/")
async def get_events(request: Request, limit: int = 100, offset: int = 0):
    """
    Fetch the event log. 
    If a tenant (school_id) is identified, it scopes the log to that tenant.
    Otherwise, for SuperAdmin, it could fetch all (omitted authentication for brevity here, 
    but in production requires SuperAdmin role for cross-tenant access).
    """
    tenant_id = getattr(request.state, "school_id", None)
    
    query = supabase_admin.table('event_store').select('*')
    
    if tenant_id:
        query = query.eq('tenant_id', tenant_id)
        
    query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
    
    try:
        response = query.execute()
        return {"data": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")
