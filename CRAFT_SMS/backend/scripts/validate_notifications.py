import sys
from pathlib import Path
BASE = Path(__file__).resolve().parents[3]
# Ensure package imports resolve the same way the backend does (backend/ as sys.path)
BACKEND_PATH = BASE / 'CRAFT_SMS' / 'backend'
sys.path.insert(0, str(BACKEND_PATH))

import asyncio
from importlib import import_module

# Import core.db as backend would (core is a top-level package under backend/)
mod = import_module('core.db')
print('supabase:', mod.supabase)
print('supabase_admin:', mod.supabase_admin)

notif = import_module('routes.notifications')

async def run_checks():
    # Simulate a user
    user = {'profile': {'id': '00000000-0000-0000-0000-000000000000'}}

    reads = await notif.get_notifications(user)
    print('get_notifications result (should be []):', reads)

    try:
        await notif.mark_as_read('abc', user)
    except Exception as e:
        print('mark_as_read raised as expected:', type(e), str(e))

    try:
        await notif.mark_all_as_read(user)
    except Exception as e:
        print('mark_all_as_read raised as expected:', type(e), str(e))

asyncio.run(run_checks())
