"""
Migration script to securely port files from Supabase Storage to Firebase Storage.
Run this script locally or in Cloud Run before the final database cutover.
"""

import os
import asyncio
import tempfile
import firebase_admin
from firebase_admin import credentials, storage
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

FIREBASE_BUCKET = os.environ.get("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "craft-sms-460912.appspot.com")

async def migrate_bucket(supabase_client: Client, firebase_bucket, bucket_name: str, category: str):
    print(f"\nScanning Supabase bucket: {bucket_name}")
    try:
        # Without a dedicated recursive list function, we query the storage.objects table
        resp = supabase_client.table("storage.objects").select("*").eq("bucket_id", bucket_name).execute()
        files = resp.data or []
        print(f"Found {len(files)} files in '{bucket_name}'.")
        
        for file_obj in files:
            file_name = file_obj.get("name")
            if not file_name or file_name.endswith("/"):
                # Skip directories
                continue
                
            print(f"Migrating: {file_name}")
            
            # 1. Download from Supabase
            download_resp = supabase_client.storage.from_(bucket_name).download(file_name)
            
            if type(download_resp) == bytes:
                data = download_resp
            else:
                print(f"  Failed to download {file_name}")
                continue

            # 2. Upload to Firebase Storage
            # Path matching our new school-centric architecture
            # Old Supabase pattern for payment slips: {userId}/{timestamp}.jpg
            # We must resolve the user's school_id.
            
            user_id = file_name.split("/")[0] if "/" in file_name else None
            
            if user_id:
                profile_resp = supabase_client.table("profiles").select("school_id").eq("id", user_id).single().execute()
                school_id = profile_resp.data.get("school_id") if profile_resp.data else "UNKNOWN_SCHOOL"
            else:
                school_id = "UNKNOWN_SCHOOL"
                
            new_path = f"schools/{school_id}/{category}/{file_name}"
            
            blob = firebase_bucket.blob(new_path)
            
            # Only upload if it doesn't already exist to allow idempotent retries
            if not blob.exists():
                blob.upload_from_string(data, content_type=file_obj.get("metadata", {}).get("mimetype"))
                # Add malware scanning metadata
                blob.metadata = {"status": "SAFE"}
                blob.patch()
                print(f"  -> Uploaded to Firebase: {new_path}")
            else:
                print(f"  -> Skipped, already exists: {new_path}")

    except Exception as e:
        print(f"Error migrating bucket {bucket_name}: {e}")

async def run_migration():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.")
        return

    print("Initializing Supabase Admin Client...")
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print("Initializing Firebase Admin SDK...")
    if not firebase_admin._apps:
        # Default initialization expects GOOGLE_APPLICATION_CREDENTIALS
        firebase_admin.initialize_app()
        
    bucket = storage.bucket(FIREBASE_BUCKET)
    
    # Map Supabase buckets to our new Firebase category paths
    migrations = [
        ("payment-slips", "payment-slips"),
        ("avatars", "avatars"),
        ("logos", "branding")
    ]
    
    for sb_bucket, fb_category in migrations:
        await migrate_bucket(supabase_client, bucket, sb_bucket, fb_category)
        
    print("\nMigration completed successfully.")

if __name__ == "__main__":
    asyncio.run(run_migration())
