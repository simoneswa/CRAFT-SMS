import os
from typing import Optional

def get_secret(secret_name: str, default: Optional[str] = None) -> Optional[str]:
    """
    Fetches a secret from Google Secret Manager.
    Falls back to environment variables for local development if GCP_PROJECT is not set.
    """
    project_id = os.environ.get("GCP_PROJECT")
    
    # If not running in GCP or explicitly set to fallback, use ENV
    if not project_id:
        return os.environ.get(secret_name, default)

    try:
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        print(f"[SECRETS MANAGER ERROR] Failed to fetch {secret_name}: {e}")
        # Final fallback to ENV if GSM fails during transition
        return os.environ.get(secret_name, default)

