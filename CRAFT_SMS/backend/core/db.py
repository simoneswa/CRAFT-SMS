import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

from core.secrets import get_secret

# Read primary supabase connection values. These may be provided using
# conventional names (SUPABASE_*) or frontend-facing NEXT_PUBLIC_* entries
# in local development setups. We do NOT create noop/fake clients — missing
# server-side credentials should surface clearly and cause writes to fail.
url: Optional[str] = get_secret("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))
anon_key: Optional[str] = get_secret("SUPABASE_ANON_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
service_key: Optional[str] = get_secret("SUPABASE_SERVICE_ROLE_KEY")

# Default to None for missing clients. Callers must check and handle None
supabase: Optional[Client] = None
supabase_admin: Optional[Client] = None

if not url or not anon_key:
    # Clear, visible warning — do NOT create a silent noop client.
    print("[WARNING] SUPABASE_URL or SUPABASE_ANON_KEY missing. Supabase client not created; backend will run in degraded mode for non-critical reads.")
else:
    # Create standard client; assign admin client only if service key provided
    supabase = create_client(url, anon_key)
    if service_key:
        supabase_admin = create_client(url, service_key)
    else:
        # Keep admin client None so admin-only writes must explicitly handle absence
        print("[WARNING] SUPABASE_SERVICE_ROLE_KEY missing. Server-side admin client unavailable; admin writes will fail until configured.")
