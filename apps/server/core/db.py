import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
anon_key: str = os.environ.get("SUPABASE_ANON_KEY")
service_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not anon_key or not service_key:
    raise ValueError("SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

# Standard client for public/anonymous operations
supabase: Client = create_client(url, anon_key)

# Admin client for server-side trusted operations (bypasses RLS)
supabase_admin: Client = create_client(url, service_key)
