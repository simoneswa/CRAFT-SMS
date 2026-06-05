import sys
import os

print("[CONFTEST] Backend conftest loaded!")

# Filter out any path ending in "core" or containing "core" as a leaf
sys.path = [p for p in sys.path if not (p.endswith("core") or p.endswith("core" + os.sep))]
print(f"[CONFTEST] Cleaned sys.path: {sys.path}")
