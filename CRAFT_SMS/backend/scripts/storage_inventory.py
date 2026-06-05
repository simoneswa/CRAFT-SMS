import os
import asyncio
from core.db import supabase_admin, supabase

async def get_inventory():
    client = supabase_admin or supabase
    if not client:
        print("No Supabase client available.")
        return

    print("Querying Supabase Storage inventory...")
    buckets = ['payment-slips', 'avatars', 'logos']
    
    total_files = 0
    total_bytes = 0
    
    for bucket in buckets:
        print(f"\nChecking bucket: {bucket}")
        try:
            # We list the root of the bucket. If there are subdirectories, we would need to recurse, 
            # but usually for a quick inventory a list on the bucket or a query on storage.objects is better.
            # Supabase Python SDK doesn't have a direct "list all" for the bucket easily without paths,
            # so we'll query the storage.objects table directly if possible.
            resp = client.table('storage.objects').select('name, metadata').eq('bucket_id', bucket).execute()
            files = resp.data or []
            
            bucket_files = len(files)
            bucket_bytes = sum([f.get('metadata', {}).get('size', 0) for f in files])
            
            print(f"Files: {bucket_files}")
            print(f"Size: {bucket_bytes / 1024 / 1024:.2f} MB")
            
            total_files += bucket_files
            total_bytes += bucket_bytes
        except Exception as e:
            print(f"Error accessing bucket {bucket}: {e}")
            print("Note: Direct table access to storage.objects might be blocked by RLS for the anon key.")

    print(f"\nTotal Files: {total_files}")
    print(f"Total Size: {total_bytes / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    asyncio.run(get_inventory())
